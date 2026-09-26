/**
 * Web Push inside the dispatcher (WPDISP-*): the admin switch, the per-user
 * Push column, admin-scoped events, the preference matrix, the generic test
 * route, and all of them while the key pair cannot be used, stored or from
 * VAPID_*. Real NotificationsService and real SQL; safeFetchFollow is the edge.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { createECDH } from 'node:crypto';

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
const { safeFetchFollow, logError } = vi.hoisted(() => ({ safeFetchFollow: vi.fn(), logError: vi.fn() }));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError,
  logWarn: vi.fn(),
}));
vi.mock('../../../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));
vi.mock('../../../../src/utils/ssrfGuard', () => {
  class SsrfBlockedError extends Error {}
  return { SsrfBlockedError, safeFetchFollow };
});

import { db as testDb } from '../../../../src/db/database';
import { createTables } from '../../../../src/db/schema';
import { runMigrations } from '../../../../src/db/migrations';
import { resetTestDb } from '../../../helpers/test-db';
import { createAdmin, createUser, disableNotificationPref, setNotificationChannels } from '../../../helpers/factories';
import { makeNotificationPreferencesService, makeNotificationsService } from '../../../helpers/notifications';
import { DatabaseService } from '../../../../src/nest/database/database.service';
import { PushSubscriptionsService } from '../../../../src/nest/notifications/push/push-subscriptions.service';
import {
  PUSH_UNAVAILABLE_ERROR,
  VAPID_PRIVATE_KEY_SETTING,
  VapidKeysService,
} from '../../../../src/nest/notifications/push/vapid-keys.service';
import { checkPushSubscription } from '../../../../src/nest/notifications/push/push-subscription.helpers';
import { generateVapidKeyPair } from '../../../../src/nest/notifications/push/web-push-crypto';

const dbs = new DatabaseService(testDb);
const notifications = makeNotificationsService(dbs);
const prefs = makeNotificationPreferencesService(dbs);
const subscriptions = new PushSubscriptionsService(dbs);
const keys = new VapidKeysService(dbs);

function addDevice(userId: number, endpoint = `https://fcm.googleapis.com/fcm/send/u${userId}`): string {
  const ua = createECDH('prime256v1');
  ua.generateKeys();
  const checked = checkPushSubscription({
    endpoint,
    keys: { p256dh: ua.getPublicKey('base64url'), auth: Buffer.alloc(16, 7).toString('base64url') },
  });
  if ('error' in checked) throw new Error(checked.error);
  subscriptions.upsert(userId, checked.value, keys.getPublicKey());
  return endpoint;
}

function invite(targetId: number, actorId: number) {
  return notifications.send({
    event: 'trip_invite',
    actorId,
    params: { trip: 'Lisbon', actor: 'bob@example.test', invitee: 'alice', tripId: '12' },
    scope: 'user',
    targetId,
  });
}

const pushedTo = () => safeFetchFollow.mock.calls.map((c) => c[0] as string);

/** What a restore under a different ENCRYPTION_KEY leaves behind: a private key that no longer opens. */
const UNREADABLE = 'enc:v1:bm90IGEgY2lwaGVydGV4dA';

function breakStoredPrivateKey(): void {
  testDb.prepare('UPDATE app_settings SET value = ? WHERE key = ?').run(UNREADABLE, VAPID_PRIVATE_KEY_SETTING);
}

const pushColumn = (userId: number) =>
  prefs.getPreferencesMatrix(userId, 'user').channels.find((c) => c.id === 'push');

const storedKeyRows = () =>
  testDb.prepare("SELECT key, value FROM app_settings WHERE key LIKE 'web_push_vapid_%' ORDER BY key").all();

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  safeFetchFollow.mockReset();
  safeFetchFollow.mockResolvedValue({ ok: true, status: 201, body: null, headers: { get: () => null } });
  logError.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

afterAll(() => {
  testDb.close();
});

describe('Web Push in NotificationsService.send()', () => {
  it('WPDISP-001: goes out once the admin enabled push and the user has a device', async () => {
    const { user } = createUser(testDb);
    const { user: actor } = createUser(testDb);
    const endpoint = addDevice(user.id);
    setNotificationChannels(testDb, 'push');
    await invite(user.id, actor.id);
    expect(pushedTo()).toEqual([endpoint]);
  });

  it('WPDISP-002: stays quiet while the admin has not enabled push', async () => {
    const { user } = createUser(testDb);
    const { user: actor } = createUser(testDb);
    addDevice(user.id);
    setNotificationChannels(testDb, 'email');
    await invite(user.id, actor.id);
    expect(safeFetchFollow).not.toHaveBeenCalled();
  });

  it('WPDISP-003: respects the user switching the event off in the Push column', async () => {
    const { user } = createUser(testDb);
    const { user: actor } = createUser(testDb);
    addDevice(user.id);
    setNotificationChannels(testDb, 'push');
    disableNotificationPref(testDb, user.id, 'trip_invite', 'push');
    await invite(user.id, actor.id);
    expect(safeFetchFollow).not.toHaveBeenCalled();
  });

  it('WPDISP-004: never carries an admin-scoped event', async () => {
    const { user: admin } = createAdmin(testDb);
    addDevice(admin.id);
    setNotificationChannels(testDb, 'push');
    await notifications.send({
      event: 'version_available',
      actorId: null,
      params: { version: '9.9.9' },
      scope: 'admin',
      targetId: 0,
    });
    expect(safeFetchFollow).not.toHaveBeenCalled();
  });
});

describe('Web Push in the preference matrix', () => {
  it('WPDISP-005: the user matrix gets a Push column, active by the admin switch, configured by a device', () => {
    const { user } = createUser(testDb);
    let push = prefs.getPreferencesMatrix(user.id, 'user').channels.find((c) => c.id === 'push');
    expect(push).toMatchObject({
      source: 'builtin',
      labelKey: 'settings.notificationPreferences.push',
      active: false,
      configured: false,
    });

    setNotificationChannels(testDb, 'email,push');
    addDevice(user.id);
    push = prefs.getPreferencesMatrix(user.id, 'user').channels.find((c) => c.id === 'push');
    expect(push).toMatchObject({ active: true, configured: true });
    expect(prefs.getActiveChannels()).toEqual(['email', 'push']);
    expect(prefs.getPreferencesMatrix(user.id, 'user').implemented_combos['trip_invite']).toContain('push');
  });

  it('WPDISP-006: the admin matrix has no Push column, since push never carries admin events', () => {
    const { user: admin } = createAdmin(testDb);
    const matrix = prefs.getPreferencesMatrix(admin.id, 'admin', 'admin');
    expect(matrix.channels.map((c) => c.id)).toEqual(['inapp', 'email', 'webhook', 'ntfy']);
    expect(matrix.implemented_combos['version_available']).not.toContain('push');
    expect(matrix.preferences['version_available']).not.toHaveProperty('push');
  });
});

describe('POST /api/notifications/test/push, through the registry', () => {
  it('WPDISP-007: refuses a user without a device and sends to one with', async () => {
    const { user } = createUser(testDb);
    await expect(notifications.testChannel(user.id, 'push')).resolves.toEqual({
      success: false,
      error: 'Channel is not configured for this user',
    });
    const endpoint = addDevice(user.id);
    await expect(notifications.testChannel(user.id, 'push')).resolves.toEqual({ success: true });
    expect(pushedTo()).toEqual([endpoint]);
  });
});

describe('Web Push while the stored key pair cannot be used', () => {
  it('WPDISP-008: a send skips push without an error while in-app and webhook still go out', async () => {
    const { user } = createUser(testDb);
    const { user: actor } = createUser(testDb);
    const endpoint = addDevice(user.id);
    testDb
      .prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'webhook_url', ?)")
      .run(user.id, 'https://hooks.example.test/trek');
    setNotificationChannels(testDb, 'webhook,push');
    breakStoredPrivateKey();

    await expect(invite(user.id, actor.id)).resolves.toBeUndefined();

    expect(pushedTo()).toEqual(['https://hooks.example.test/trek']);
    const inApp = testDb.prepare('SELECT COUNT(*) AS n FROM notifications WHERE recipient_id = ?').get(user.id) as {
      n: number;
    };
    expect(inApp.n).toBe(1);
    // The device is kept for when the key is back, and nothing failed on the way.
    expect(subscriptions.listForUser(user.id).map((r) => r.endpoint)).toEqual([endpoint]);
    expect(logError).not.toHaveBeenCalledWith(expect.stringContaining('dispatch failed'));
    expect(logError).not.toHaveBeenCalledWith(expect.stringContaining('Web Push failed'));
  });

  it('WPDISP-009: the matrix stops offering push, so the card and the column go, and both come back with the key', () => {
    const { user } = createUser(testDb);
    setNotificationChannels(testDb, 'email,push');
    addDevice(user.id);
    const ciphertext = (
      testDb.prepare('SELECT value FROM app_settings WHERE key = ?').get(VAPID_PRIVATE_KEY_SETTING) as { value: string }
    ).value;
    breakStoredPrivateKey();

    expect(pushColumn(user.id)).toMatchObject({ active: false, configured: true });
    // Only push: email keeps its column, SMTP or not, as it always has.
    expect(prefs.getPreferencesMatrix(user.id, 'user').channels.find((c) => c.id === 'email')?.active).toBe(true);

    testDb.prepare('UPDATE app_settings SET value = ? WHERE key = ?').run(ciphertext, VAPID_PRIVATE_KEY_SETTING);
    expect(pushColumn(user.id)).toMatchObject({ active: true, configured: true });
  });

  it('WPDISP-009b: reading the matrix while neither key row exists writes nothing, and push is still offered', () => {
    const { user } = createUser(testDb);
    setNotificationChannels(testDb, 'email,push');
    addDevice(user.id);
    // What deleting both rows to start over leaves under a running server.
    testDb.prepare("DELETE FROM app_settings WHERE key LIKE 'web_push_vapid_%'").run();

    expect(pushColumn(user.id)).toMatchObject({ active: true, configured: true });
    expect(storedKeyRows()).toEqual([]);
  });

  it('WPDISP-010: the test send says push is unavailable and sends nothing', async () => {
    const { user } = createUser(testDb);
    addDevice(user.id);
    breakStoredPrivateKey();
    await expect(notifications.testChannel(user.id, 'push')).resolves.toEqual({
      success: false,
      error: PUSH_UNAVAILABLE_ERROR,
    });
    expect(safeFetchFollow).not.toHaveBeenCalled();
  });
});

describe('Web Push while the VAPID_* pair is broken and an older pair is stored', () => {
  it('WPDISP-011: nothing is sent, the device and both rows stay, the column goes, and all of it returns with the variables', async () => {
    const { user } = createUser(testDb);
    const { user: actor } = createUser(testDb);
    setNotificationChannels(testDb, 'push');
    // The first start without VAPID_* stored a pair; the operator then brought their own.
    keys.getPublicKey();
    const stored = storedKeyRows();
    const pair = generateVapidKeyPair();
    vi.stubEnv('VAPID_PUBLIC_KEY', pair.publicKey);
    vi.stubEnv('VAPID_PRIVATE_KEY', pair.privateKey);
    const endpoint = addDevice(user.id);
    // A typo or a rotated Secret: still a valid 32-byte key, so boot is fine.
    vi.stubEnv('VAPID_PRIVATE_KEY', generateVapidKeyPair().privateKey);

    await expect(invite(user.id, actor.id)).resolves.toBeUndefined();

    expect(safeFetchFollow).not.toHaveBeenCalled();
    expect(subscriptions.listForUser(user.id).map((r) => [r.endpoint, r.vapid_public_key])).toEqual([
      [endpoint, pair.publicKey],
    ]);
    expect(storedKeyRows()).toEqual(stored);
    expect(pushColumn(user.id)).toMatchObject({ active: false, configured: true });

    vi.stubEnv('VAPID_PRIVATE_KEY', pair.privateKey);
    expect(pushColumn(user.id)).toMatchObject({ active: true, configured: true });
    await invite(user.id, actor.id);
    expect(pushedTo()).toEqual([endpoint]);
  });
});
