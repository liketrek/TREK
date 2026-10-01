/**
 * The Web Push transport (WPUSH-*): what goes over the wire, what each push
 * service answer does to the table, and the payload the worker receives
 * (WPUSH-PAY-*). safeFetchFollow is the boundary; the database is real.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { HttpException } from '@nestjs/common';
import { createDecipheriv, createECDH, hkdfSync, type ECDH } from 'node:crypto';

// One :memory: connection per file, created inside the factory so nothing has
// to be hoisted above the imports; the tests reach it through the mocked module.
vi.mock('../../../../src/db/database', async () => {
  const { default: Database } = await import('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  return {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
});
vi.mock('../../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
const { logInfo, logError, safeFetchFollow } = vi.hoisted(() => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  safeFetchFollow: vi.fn(),
}));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo,
  logDebug: vi.fn(),
  logError,
  logWarn: vi.fn(),
}));
vi.mock('../../../../src/utils/ssrfGuard', () => {
  class SsrfBlockedError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SsrfBlockedError';
    }
  }
  return { SsrfBlockedError, safeFetchFollow };
});

import { db as testDb } from '../../../../src/db/database';
import { createTables } from '../../../../src/db/schema';
import { runMigrations } from '../../../../src/db/migrations';
import { resetTestDb } from '../../../helpers/test-db';
import { createUser } from '../../../helpers/factories';
import { DatabaseService } from '../../../../src/nest/database/database.service';
import { SsrfBlockedError } from '../../../../src/utils/ssrfGuard';
import { PushSubscriptionsService } from '../../../../src/nest/notifications/push/push-subscriptions.service';
import {
  PUSH_UNAVAILABLE_ERROR,
  VAPID_PRIVATE_KEY_SETTING,
  VAPID_PUBLIC_KEY_SETTING,
  VapidKeysService,
} from '../../../../src/nest/notifications/push/vapid-keys.service';
import { PushController } from '../../../../src/nest/notifications/push/push.controller';
import { checkPushSubscription } from '../../../../src/nest/notifications/push/push-subscription.helpers';
import { generateVapidKeyPair } from '../../../../src/nest/notifications/push/web-push-crypto';
import {
  FORBIDDEN_FAILURES_BEFORE_REMOVAL,
  MAX_PUSH_PAYLOAD_BYTES,
  WebPushService,
  buildPushPayload,
  samePagePath,
} from '../../../../src/nest/notifications/transports/web-push.service';
import { ALL_EVENT_TYPES, type ChannelMessage } from '../../../../src/nest/notifications/notification-events';

const dbs = new DatabaseService(testDb);
const keys = new VapidKeysService(dbs);
const subscriptions = new PushSubscriptionsService(dbs);
const push = new WebPushService(keys, subscriptions);

const MSG: ChannelMessage = {
  event: 'collab_message',
  title: 'New message in "Lisbon"',
  body: 'alice: see you at the station',
  navigateTarget: '/trips/12',
  url: 'https://trek.example.test/trips/12',
};

interface Device {
  endpoint: string;
  ua: ECDH;
  auth: Buffer;
}

function subscribe(userId: number, endpoint: string): Device {
  const ua = createECDH('prime256v1');
  ua.generateKeys();
  const auth = Buffer.from('fedcba9876543210');
  const checked = checkPushSubscription({
    endpoint,
    keys: { p256dh: ua.getPublicKey('base64url'), auth: auth.toString('base64url') },
  });
  if ('error' in checked) throw new Error(checked.error);
  subscriptions.upsert(userId, checked.value, keys.getPublicKey());
  return { endpoint, ua, auth };
}

/** The browser's side of RFC 8291, to read what was actually sent. */
function open(body: Uint8Array, device: Device): unknown {
  const buf = Buffer.from(body);
  const salt = buf.subarray(0, 16);
  const keyId = buf.subarray(21, 21 + buf[20]);
  const record = buf.subarray(21 + buf[20]);
  const secret = device.ua.computeSecret(keyId);
  const info = Buffer.concat([Buffer.from('WebPush: info\0'), device.ua.getPublicKey(), keyId]);
  const ikm = Buffer.from(hkdfSync('sha256', secret, device.auth, info, 32));
  const cek = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));
  const decipher = createDecipheriv('aes-128-gcm', cek, nonce);
  decipher.setAuthTag(record.subarray(record.length - 16));
  const padded = Buffer.concat([decipher.update(record.subarray(0, record.length - 16)), decipher.final()]);
  return JSON.parse(padded.subarray(0, padded.lastIndexOf(0x02)).toString('utf8'));
}

function reply(status: number, text = '') {
  return {
    ok: status >= 200 && status < 300,
    status,
    body: null,
    headers: { get: () => null },
    text: async () => text,
  };
}

function rows(userId: number) {
  return subscriptions.listForUser(userId);
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  safeFetchFollow.mockReset();
  logInfo.mockClear();
  logError.mockClear();
});

afterAll(() => {
  testDb.close();
});

describe('WebPushService delivery', () => {
  it('WPUSH-001: posts one encrypted, VAPID-signed message through the SSRF guard', async () => {
    const { user } = createUser(testDb);
    const device = subscribe(user.id, 'https://fcm.googleapis.com/fcm/send/abc');
    safeFetchFollow.mockResolvedValue(reply(201));

    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(true);

    expect(safeFetchFollow).toHaveBeenCalledTimes(1);
    const [url, init, options] = safeFetchFollow.mock.calls[0];
    expect(url).toBe(device.endpoint);
    expect(options).toEqual({ maxRedirects: 0, bypassInternalIpAllowed: true });
    expect(init.method).toBe('POST');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.headers).toMatchObject({
      TTL: '86400',
      Urgency: 'normal',
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
    });
    expect(init.headers.Authorization).toMatch(
      new RegExp(`^vapid t=[\\w-]+\\.[\\w-]+\\.[\\w-]+, k=${keys.getPublicKey()}$`),
    );
    expect(open(init.body, device)).toEqual({
      title: MSG.title,
      body: MSG.body,
      url: '/trips/12',
      tag: 'collab_message:/trips/12',
    });

    const [row] = rows(user.id);
    expect(row.last_success_at).not.toBeNull();
    expect(row.failure_count).toBe(0);
  });

  it('WPUSH-002: date-bound events go out with high urgency', async () => {
    const { user } = createUser(testDb);
    subscribe(user.id, 'https://web.push.apple.com/QGx');
    safeFetchFollow.mockResolvedValue(reply(201));
    await push.sendToUser(user.id, { ...MSG, event: 'trip_reminder' });
    expect(safeFetchFollow.mock.calls[0][1].headers.Urgency).toBe('high');
  });

  it('WPUSH-003: 404 and 410 mean the browser is gone, and the row goes with it', async () => {
    const { user } = createUser(testDb);
    subscribe(user.id, 'https://fcm.googleapis.com/fcm/send/expired');
    subscribe(user.id, 'https://updates.push.services.mozilla.com/wpush/v2/revoked');
    safeFetchFollow.mockImplementation(async (url: string) => reply(url.includes('expired') ? 404 : 410));
    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(false);
    expect(rows(user.id)).toEqual([]);
    expect(logError).not.toHaveBeenCalled();
  });

  it('WPUSH-004: a first 403 with Apple’s BadJwtToken keeps the device, counts it and logs the reason', async () => {
    // Apple answers 403 for a token it rejects, which is the server's problem
    // (subject, clock, key), not a sign the device is gone.
    const { user } = createUser(testDb);
    subscribe(user.id, 'https://web.push.apple.com/QGx');
    safeFetchFollow.mockResolvedValue(reply(403, '{"reason":"BadJwtToken"}'));
    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(false);
    expect(rows(user.id)).toHaveLength(1);
    expect(rows(user.id)[0].failure_count).toBe(1);
    const line = logError.mock.calls[0][0] as string;
    expect(line).toContain('HTTP 403');
    expect(line).toContain('BadJwtToken');
    expect(line).toContain('host=web.push.apple.com');
    // The endpoint is a capability URL: the log names the host only.
    expect(line).not.toContain('/QGx');
  });

  it(`WPUSH-004b: the device goes after ${FORBIDDEN_FAILURES_BEFORE_REMOVAL} failed sends in a row ending in 403`, async () => {
    const { user } = createUser(testDb);
    subscribe(user.id, 'https://web.push.apple.com/QGx');
    safeFetchFollow.mockResolvedValue(reply(403, '{"reason":"BadJwtToken"}'));
    for (let i = 1; i < FORBIDDEN_FAILURES_BEFORE_REMOVAL; i++) {
      await push.sendToUser(user.id, MSG);
      expect(rows(user.id)[0].failure_count).toBe(i);
    }
    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(false);
    expect(rows(user.id)).toEqual([]);
    expect(logError).toHaveBeenLastCalledWith(expect.stringContaining('removed a device'));
    expect(logError).toHaveBeenLastCalledWith(expect.stringContaining('BadJwtToken'));
  });

  it('WPUSH-004c: a success between refusals starts the count over', async () => {
    const { user } = createUser(testDb);
    subscribe(user.id, 'https://web.push.apple.com/QGx');
    safeFetchFollow.mockResolvedValue(reply(403, '{"reason":"BadJwtToken"}'));
    for (let i = 1; i < FORBIDDEN_FAILURES_BEFORE_REMOVAL; i++) await push.sendToUser(user.id, MSG);
    safeFetchFollow.mockResolvedValueOnce(reply(201));
    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(true);
    expect(rows(user.id)[0].failure_count).toBe(0);
    await push.sendToUser(user.id, MSG);
    expect(rows(user.id)).toHaveLength(1);
    expect(rows(user.id)[0].failure_count).toBe(1);
  });

  it('WPUSH-005: any other failure keeps the row, counts it and logs the capped body', async () => {
    const { user } = createUser(testDb);
    subscribe(user.id, 'https://fcm.googleapis.com/fcm/send/busy');
    safeFetchFollow.mockResolvedValue(reply(503, `overloaded ${'x'.repeat(5000)}`));
    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(false);
    expect(rows(user.id)[0].failure_count).toBe(1);
    const line = logError.mock.calls[0][0] as string;
    expect(line).toContain('HTTP 503');
    expect(line.length).toBeLessThan(1300);

    // A body that cannot be read changes nothing but the log text.
    safeFetchFollow.mockResolvedValueOnce({
      ...reply(500),
      text: async () => {
        throw new Error('stream reset');
      },
    });
    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(false);
    expect(rows(user.id)[0].failure_count).toBe(2);
    expect(logError).toHaveBeenLastCalledWith(expect.stringMatching(/HTTP 500 .*host=fcm\.googleapis\.com: $/));
  });

  it('WPUSH-006: a refused or failed request is a failure, never a throw', async () => {
    const { user } = createUser(testDb);
    subscribe(user.id, 'https://fcm.googleapis.com/fcm/send/a');
    safeFetchFollow.mockRejectedValueOnce(new SsrfBlockedError('Requests to private addresses are not allowed'));
    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(false);
    expect(logError).toHaveBeenLastCalledWith(expect.stringContaining('blocked by SSRF guard'));

    safeFetchFollow.mockRejectedValueOnce(new Error('The operation was aborted due to timeout'));
    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(false);
    expect(logError).toHaveBeenLastCalledWith(expect.stringContaining('timeout'));
    expect(rows(user.id)[0].failure_count).toBe(2);
  });

  it('WPUSH-007: one device getting it is enough', async () => {
    const { user } = createUser(testDb);
    subscribe(user.id, 'https://fcm.googleapis.com/fcm/send/ok');
    subscribe(user.id, 'https://fcm.googleapis.com/fcm/send/down');
    safeFetchFollow.mockImplementation(async (url: string) => reply(url.endsWith('/ok') ? 201 : 500));
    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(true);
    // Both hosts are the same origin, so one token served both requests.
    const [a, b] = safeFetchFollow.mock.calls.map((c) => c[1].headers.Authorization);
    expect(a).toBe(b);
  });

  it('WPUSH-008: a row made for a previous server key is dropped without a request', async () => {
    const { user } = createUser(testDb);
    subscribe(user.id, 'https://fcm.googleapis.com/fcm/send/old');
    testDb.prepare("UPDATE push_subscriptions SET vapid_public_key = 'previous-key'").run();
    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(false);
    expect(safeFetchFollow).not.toHaveBeenCalled();
    expect(rows(user.id)).toEqual([]);
  });

  it('WPUSH-009: a row whose host is not a push service any more is dropped without a request', async () => {
    const { user } = createUser(testDb);
    subscribe(user.id, 'https://fcm.googleapis.com/fcm/send/x');
    subscribe(user.id, 'https://fcm.googleapis.com/fcm/send/y');
    testDb
      .prepare("UPDATE push_subscriptions SET endpoint = 'https://attacker.example.test/collect' WHERE endpoint LIKE '%/x'")
      .run();
    testDb.prepare("UPDATE push_subscriptions SET endpoint = 'not a url' WHERE endpoint LIKE '%/y'").run();
    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(false);
    expect(safeFetchFollow).not.toHaveBeenCalled();
    expect(rows(user.id)).toEqual([]);
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('host=attacker.example.test'));
    // Not even a URL: the log still has something to name instead of the value.
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('not a known push service user'));
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('host=invalid-endpoint'));
  });

  it('WPUSH-010: broken stored keys count as a failure for that row', async () => {
    const { user } = createUser(testDb);
    subscribe(user.id, 'https://fcm.googleapis.com/fcm/send/x');
    testDb.prepare("UPDATE push_subscriptions SET auth = '***'").run();
    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(false);
    expect(safeFetchFollow).not.toHaveBeenCalled();
    expect(rows(user.id)[0].failure_count).toBe(1);
  });

  it('WPUSH-011: nothing to send to is simply false', async () => {
    const { user } = createUser(testDb);
    expect(push.hasDevices(user.id)).toBe(false);
    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(false);
    expect(safeFetchFollow).not.toHaveBeenCalled();
  });

  it('WPUSH-012: a failure before any request (no key pair) is logged and false', async () => {
    const { user } = createUser(testDb);
    subscribe(user.id, 'https://fcm.googleapis.com/fcm/send/x');
    const spy = vi.spyOn(keys, 'getKeys').mockImplementationOnce(() => {
      throw new Error('database is locked');
    });
    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(false);
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('database is locked'));
    spy.mockRestore();
  });

  it('WPUSH-012b: while the stored key pair cannot be used nothing is sent and every device stays', async () => {
    const { user } = createUser(testDb);
    subscribe(user.id, 'https://fcm.googleapis.com/fcm/send/x');
    const publicKey = keys.getPublicKey();
    // A restore under a different ENCRYPTION_KEY: the ciphertext no longer opens.
    testDb
      .prepare("UPDATE app_settings SET value = 'enc:v1:bm90IGEgY2lwaGVydGV4dA' WHERE key = ?")
      .run(VAPID_PRIVATE_KEY_SETTING);

    await expect(push.sendToUser(user.id, MSG)).resolves.toBe(false);

    expect(safeFetchFollow).not.toHaveBeenCalled();
    expect(rows(user.id)).toHaveLength(1);
    expect(rows(user.id)[0].vapid_public_key).toBe(publicKey);
    expect(rows(user.id)[0].failure_count).toBe(0);
    expect(push.isAvailable()).toBe(false);

    // The test send says why instead of a bare failure, and sends nothing either.
    await expect(push.sendTest(user.id)).resolves.toEqual({ success: false, error: PUSH_UNAVAILABLE_ERROR });
    expect(safeFetchFollow).not.toHaveBeenCalled();
  });

  it('WPUSH-012c: an install that only ran on VAPID_* generates nothing when that pair breaks, and keeps every device', async () => {
    const pair = generateVapidKeyPair();
    vi.stubEnv('VAPID_PUBLIC_KEY', pair.publicKey);
    vi.stubEnv('VAPID_PRIVATE_KEY', pair.privateKey);
    try {
      const { user } = createUser(testDb);
      subscribe(user.id, 'https://fcm.googleapis.com/fcm/send/x');
      subscribe(user.id, 'https://web.push.apple.com/y');
      // An existingSecret without the private half: the variable is simply gone.
      vi.stubEnv('VAPID_PRIVATE_KEY', '');

      await expect(push.sendToUser(user.id, MSG)).resolves.toBe(false);
      await expect(push.sendTest(user.id)).resolves.toEqual({ success: false, error: PUSH_UNAVAILABLE_ERROR });

      expect(push.isAvailable()).toBe(false);
      expect(safeFetchFollow).not.toHaveBeenCalled();
      expect(testDb.prepare("SELECT key FROM app_settings WHERE key LIKE 'web_push_vapid_%'").all()).toEqual([]);
      expect(rows(user.id).map((row) => row.vapid_public_key)).toEqual([pair.publicKey, pair.publicKey]);

      // The Secret fixed: the same devices receive again, nobody turns push on again.
      vi.stubEnv('VAPID_PRIVATE_KEY', pair.privateKey);
      safeFetchFollow.mockResolvedValue(reply(201));
      await expect(push.sendToUser(user.id, MSG)).resolves.toBe(true);
      expect(safeFetchFollow).toHaveBeenCalledTimes(2);
      expect(rows(user.id)).toHaveLength(2);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('WPUSH-012d: a broken VAPID_* pair over a pair stored from before sends nothing, keeps every device and serves no key', async () => {
    // The first start without VAPID_* stored a pair; the operator then brought their own.
    const storedKey = keys.getPublicKey();
    const pair = generateVapidKeyPair();
    vi.stubEnv('VAPID_PUBLIC_KEY', pair.publicKey);
    vi.stubEnv('VAPID_PRIVATE_KEY', pair.privateKey);
    const controller = new PushController(keys, subscriptions);
    try {
      const { user } = createUser(testDb);
      subscribe(user.id, 'https://fcm.googleapis.com/fcm/send/x');
      subscribe(user.id, 'https://web.push.apple.com/y');
      // An existingSecret rotated without the private half.
      vi.stubEnv('VAPID_PRIVATE_KEY', '');

      await expect(push.sendToUser(user.id, MSG)).resolves.toBe(false);
      await expect(push.sendTest(user.id)).resolves.toEqual({ success: false, error: PUSH_UNAVAILABLE_ERROR });
      expect(push.isAvailable()).toBe(false);
      expect(safeFetchFollow).not.toHaveBeenCalled();
      // Signing with the stored pair would have dropped both rows; they stay on the environment key.
      expect(rows(user.id).map((row) => row.vapid_public_key)).toEqual([pair.publicKey, pair.publicKey]);
      expect(testDb.prepare('SELECT value FROM app_settings WHERE key = ?').get(VAPID_PUBLIC_KEY_SETTING)).toEqual({
        value: storedKey,
      });
      // Browsers are not handed the stored key to subscribe again with either.
      let refusal: unknown = null;
      try {
        controller.publicKey();
      } catch (err) {
        refusal = err;
      }
      expect(refusal).toBeInstanceOf(HttpException);
      expect((refusal as HttpException).getStatus()).toBe(503);

      // The Secret fixed: the same rows receive again, and the key served is the one they hold.
      vi.stubEnv('VAPID_PRIVATE_KEY', pair.privateKey);
      safeFetchFollow.mockResolvedValue(reply(201));
      await expect(push.sendToUser(user.id, MSG)).resolves.toBe(true);
      expect(safeFetchFollow).toHaveBeenCalledTimes(2);
      expect(rows(user.id)).toHaveLength(2);
      expect(controller.publicKey()).toEqual({ publicKey: pair.publicKey });
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('WPUSH-013: the test send reports success and failure like the other channels', async () => {
    const { user } = createUser(testDb);
    const device = subscribe(user.id, 'https://fcm.googleapis.com/fcm/send/x');
    safeFetchFollow.mockResolvedValueOnce(reply(201));
    expect(push.isAvailable()).toBe(true);
    await expect(push.sendTest(user.id)).resolves.toEqual({ success: true });
    const sent = open(safeFetchFollow.mock.calls[0][1].body, device);
    expect(sent).toMatchObject({ title: 'Test Notification', url: '/settings?tab=notifications' });
    // Only chat collapses; a second test is a second notification.
    expect(sent).not.toHaveProperty('tag');
    safeFetchFollow.mockResolvedValueOnce(reply(500));
    await expect(push.sendTest(user.id)).resolves.toEqual({
      success: false,
      error: 'Failed to send push notification',
    });
  });
});

describe('buildPushPayload', () => {
  const size = (p: unknown) => Buffer.byteLength(JSON.stringify(p), 'utf8');

  it('WPUSH-PAY-001: passes a short message through; chat collapses per trip', () => {
    expect(buildPushPayload(MSG)).toEqual({
      title: MSG.title,
      body: MSG.body,
      url: '/trips/12',
      tag: 'collab_message:/trips/12',
    });
    // Without a trip to collapse on there is no tag at all, never one for every chat everywhere.
    expect(buildPushPayload({ ...MSG, navigateTarget: undefined })).toEqual({
      title: MSG.title,
      body: MSG.body,
    });
  });

  it('WPUSH-PAY-001b: every other event has no tag, so two of them never replace each other', () => {
    const others = ALL_EVENT_TYPES.filter((event) => event !== 'collab_message');
    expect(others.length).toBeGreaterThan(5);
    for (const event of others) {
      const payload = buildPushPayload({ ...MSG, event });
      expect(payload, event).toEqual({ title: MSG.title, body: MSG.body, url: '/trips/12' });
      expect(payload, event).not.toHaveProperty('tag');
    }
  });

  it('WPUSH-PAY-002: cuts a long body at a character boundary until the payload fits', () => {
    const payload = buildPushPayload({ ...MSG, body: '🚄'.repeat(5000) });
    expect(size(payload)).toBeLessThanOrEqual(MAX_PUSH_PAYLOAD_BYTES);
    expect(size(payload)).toBeGreaterThan(MAX_PUSH_PAYLOAD_BYTES - 8);
    expect(payload.body.endsWith('…')).toBe(true);
    expect(payload.body.slice(0, -1)).toMatch(/^(🚄)+$/u);
  });

  it('WPUSH-PAY-003: characters JSON has to escape are counted as what they cost', () => {
    const payload = buildPushPayload({ ...MSG, title: '\u0001'.repeat(500), body: '"\u0002'.repeat(3000) });
    expect(size(payload)).toBeLessThanOrEqual(MAX_PUSH_PAYLOAD_BYTES);
    expect(Array.from(payload.title)).toHaveLength(120);
    expect(payload.body.length).toBeGreaterThan(0);
  });

  it('WPUSH-PAY-004: only same-origin paths reach the worker', () => {
    expect(samePagePath('/trips/5')).toBe('/trips/5');
    expect(samePagePath('/admin?tab=storage')).toBe('/admin?tab=storage');
    for (const target of [
      'https://evil.test/x',
      '//evil.test/x',
      '/\\evil.test',
      'trips/5',
      '/trips/5 x',
      `/${'a'.repeat(300)}`,
      '',
      undefined,
    ]) {
      expect(samePagePath(target), String(target)).toBeUndefined();
    }
    expect(buildPushPayload({ ...MSG, navigateTarget: 'https://evil.test/' })).not.toHaveProperty('url');
  });
});
