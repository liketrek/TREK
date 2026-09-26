/**
 * Web Push subscriptions: what the browser may hand over (PUSHSUB-CHK-*) and
 * the table behind it (PUSHSUB-*), on the real schema including migration 245.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { createECDH } from 'node:crypto';
import { MAX_PUSH_ENDPOINT_LENGTH, pushUnsubscribeRequestSchema } from '@trek/shared';

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

import { db as testDb } from '../../../../src/db/database';
import { createTables } from '../../../../src/db/schema';
import { runMigrations } from '../../../../src/db/migrations';
import { resetTestDb } from '../../../helpers/test-db';
import { createUser } from '../../../helpers/factories';
import { DatabaseService } from '../../../../src/nest/database/database.service';
import {
  MAX_PUSH_DEVICES_PER_USER,
  PushSubscriptionsService,
} from '../../../../src/nest/notifications/push/push-subscriptions.service';
import {
  PUSH_SUBSCRIPTION_ERRORS,
  checkPushEndpoint,
  checkPushSubscription,
  isPushServiceEndpoint,
  type CheckedPushSubscription,
} from '../../../../src/nest/notifications/push/push-subscription.helpers';

const subs = new PushSubscriptionsService(new DatabaseService(testDb));

function browserKeys() {
  const ua = createECDH('prime256v1');
  ua.generateKeys();
  return { p256dh: ua.getPublicKey('base64url'), auth: Buffer.from('0123456789abcdef').toString('base64url') };
}

function checked(endpoint: string): CheckedPushSubscription {
  const result = checkPushSubscription({ endpoint, keys: browserKeys() });
  if ('error' in result) throw new Error(result.error);
  return result.value;
}

const FCM = 'https://fcm.googleapis.com/fcm/send/device-1';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

describe('checkPushEndpoint / checkPushSubscription', () => {
  it('PUSHSUB-CHK-001: accepts the push services browsers use', () => {
    for (const endpoint of [
      FCM,
      'https://android.googleapis.com/gcm/send/x',
      'https://updates.push.services.mozilla.com/wpush/v2/gAAAA',
      'https://push.services.mozilla.com/wpush/v1/x',
      'https://web.push.apple.com/QGx9',
      'https://api.push.apple.com/3/device/x',
      'https://wns2-par02p.notify.windows.com/w/?token=BQYAAA',
    ]) {
      expect(checkPushEndpoint(endpoint), endpoint).toBe('ok');
      expect(isPushServiceEndpoint(endpoint)).toBe(true);
    }
  });

  it('PUSHSUB-CHK-002: refuses anything that is not a plain https URL', () => {
    for (const endpoint of [
      'not a url',
      'http://fcm.googleapis.com/fcm/send/x',
      'https://user:pw@fcm.googleapis.com/fcm/send/x',
      'https://fcm.googleapis.com:8443/fcm/send/x',
      `https://fcm.googleapis.com/${'a'.repeat(MAX_PUSH_ENDPOINT_LENGTH)}`,
    ]) {
      expect(checkPushEndpoint(endpoint), endpoint).toBe('endpoint');
    }
  });

  it('PUSHSUB-CHK-002b: takes an endpoint exactly as long as the contract allows, and not one character more', () => {
    const base = 'https://fcm.googleapis.com/fcm/send/';
    const longest = `${base}${'a'.repeat(MAX_PUSH_ENDPOINT_LENGTH - base.length)}`;
    // The contract and the check share one limit, so a device that could register can also be sent to and removed.
    expect(pushUnsubscribeRequestSchema.safeParse({ endpoint: longest }).success).toBe(true);
    expect(checkPushEndpoint(longest)).toBe('ok');
    expect(checkPushEndpoint(`${longest}a`)).toBe('endpoint');
  });

  it('PUSHSUB-CHK-003: refuses hosts that are not push services, including lookalikes', () => {
    for (const endpoint of [
      'https://example.com/push',
      'https://127.0.0.1/push',
      'https://fcm.googleapis.com.evil.test/x',
      'https://evilnotify.windows.com/x',
      'https://.notify.windows.com/x',
      'https://push.apple.com/x',
    ]) {
      expect(checkPushEndpoint(endpoint), endpoint).not.toBe('ok');
    }
    expect(checkPushSubscription({ endpoint: 'https://example.com/push', keys: browserKeys() })).toEqual({
      ok: false,
      error: PUSH_SUBSCRIPTION_ERRORS.service,
    });
    expect(checkPushSubscription({ endpoint: 'http://fcm.googleapis.com/x', keys: browserKeys() })).toEqual({
      ok: false,
      error: PUSH_SUBSCRIPTION_ERRORS.endpoint,
    });
  });

  it('PUSHSUB-CHK-004: wants a p256dh on the curve and a 16-byte auth secret', () => {
    const keys = browserKeys();
    const offCurve = Buffer.from(keys.p256dh, 'base64url');
    offCurve[64] ^= 0x01;
    for (const p256dh of [
      '!!!',
      Buffer.alloc(65, 4).toString('base64url'),
      offCurve.toString('base64url'),
      keys.auth,
    ]) {
      expect(checkPushSubscription({ endpoint: FCM, keys: { ...keys, p256dh } })).toEqual({
        ok: false,
        error: PUSH_SUBSCRIPTION_ERRORS.p256dh,
      });
    }
    for (const auth of ['!!!', Buffer.alloc(8).toString('base64url')]) {
      expect(checkPushSubscription({ endpoint: FCM, keys: { ...keys, auth } })).toEqual({
        ok: false,
        error: PUSH_SUBSCRIPTION_ERRORS.auth,
      });
    }
  });

  it('PUSHSUB-CHK-005: hands the keys back canonical, without padding', () => {
    const keys = browserKeys();
    const result = checkPushSubscription({
      endpoint: FCM,
      keys: { p256dh: `${keys.p256dh}=`, auth: `${keys.auth}==` },
    });
    expect(result).toEqual({ ok: true, value: { endpoint: FCM, p256dh: keys.p256dh, auth: keys.auth } });
  });
});

describe('PushSubscriptionsService', () => {
  it('PUSHSUB-001: stores a subscription with the key it was made for and counts devices', () => {
    const { user } = createUser(testDb);
    const sub = checked(FCM);
    expect(subs.hasAny(user.id)).toBe(false);
    expect(subs.upsert(user.id, sub, 'server-key', 'Mozilla/5.0')).toBe(1);
    const [row] = subs.listForUser(user.id);
    expect(row).toMatchObject({
      user_id: user.id,
      endpoint: FCM,
      p256dh: sub.p256dh,
      auth: sub.auth,
      vapid_public_key: 'server-key',
      user_agent: 'Mozilla/5.0',
      failure_count: 0,
      last_success_at: null,
    });
    expect(subs.hasAny(user.id)).toBe(true);
    expect(subs.countForUser(user.id)).toBe(1);
  });

  it('PUSHSUB-002: subscribing again refreshes the same row instead of adding one', () => {
    const { user } = createUser(testDb);
    subs.upsert(user.id, checked(FCM), 'old-key');
    const [before] = subs.listForUser(user.id);
    subs.recordFailure(before.id);
    const fresh = checked(FCM);
    expect(subs.upsert(user.id, fresh, 'new-key', null)).toBe(1);
    const [after] = subs.listForUser(user.id);
    expect(after.id).toBe(before.id);
    expect(after).toMatchObject({
      p256dh: fresh.p256dh,
      vapid_public_key: 'new-key',
      failure_count: 0,
      user_agent: null,
    });
  });

  it('PUSHSUB-003: a browser shared by two accounts belongs to whoever subscribed on it last', () => {
    const { user: first } = createUser(testDb);
    const { user: second } = createUser(testDb);
    subs.upsert(first.id, checked(FCM), 'k');
    expect(subs.upsert(second.id, checked(FCM), 'k')).toBe(1);
    expect(subs.countForUser(first.id)).toBe(0);
    expect(subs.listForUser(second.id).map((r) => r.endpoint)).toEqual([FCM]);
  });

  it('PUSHSUB-004: caps the devices per user and drops the one registered longest ago', () => {
    const { user } = createUser(testDb);
    for (let i = 0; i < MAX_PUSH_DEVICES_PER_USER; i++) {
      subs.upsert(user.id, checked(`https://fcm.googleapis.com/fcm/send/d${i}`), 'k');
    }
    // Same second for every row; the id breaks the tie, so d0 is the oldest.
    // d0 subscribing again renews it, which leaves d1 as the oldest.
    testDb.prepare("UPDATE push_subscriptions SET created_at = '2026-01-01 00:00:00'").run();
    subs.upsert(user.id, checked('https://fcm.googleapis.com/fcm/send/d0'), 'k');
    expect(subs.upsert(user.id, checked('https://fcm.googleapis.com/fcm/send/new'), 'k')).toBe(
      MAX_PUSH_DEVICES_PER_USER,
    );
    const endpoints = subs.listForUser(user.id).map((r) => r.endpoint);
    expect(endpoints).toContain('https://fcm.googleapis.com/fcm/send/d0');
    expect(endpoints).toContain('https://fcm.googleapis.com/fcm/send/new');
    expect(endpoints).not.toContain('https://fcm.googleapis.com/fcm/send/d1');
  });

  it('PUSHSUB-005: a user can only remove their own endpoint', () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    subs.upsert(owner.id, checked(FCM), 'k');
    expect(subs.removeForUser(other.id, FCM)).toBe(false);
    expect(subs.countForUser(owner.id)).toBe(1);
    expect(subs.removeForUser(owner.id, FCM)).toBe(true);
    expect(subs.countForUser(owner.id)).toBe(0);
  });

  it('PUSHSUB-006: success resets the failure count, failures add up, deleteById removes the row', () => {
    const { user } = createUser(testDb);
    subs.upsert(user.id, checked(FCM), 'k');
    const [row] = subs.listForUser(user.id);
    expect(subs.recordFailure(row.id)).toBe(1);
    expect(subs.recordFailure(row.id)).toBe(2);
    expect(subs.listForUser(user.id)[0].failure_count).toBe(2);
    subs.recordSuccess(row.id);
    const [after] = subs.listForUser(user.id);
    expect(after.failure_count).toBe(0);
    expect(after.last_success_at).not.toBeNull();
    expect(subs.recordFailure(row.id)).toBe(1);
    subs.deleteById(row.id);
    expect(subs.hasAny(user.id)).toBe(false);
    // A failure recorded for a row another send already removed changes nothing.
    expect(subs.recordFailure(row.id)).toBe(0);
  });

  it('PUSHSUB-007: cuts a long user agent and the rows go with the user', () => {
    const { user } = createUser(testDb);
    subs.upsert(user.id, checked(FCM), 'k', 'x'.repeat(1000));
    expect(subs.listForUser(user.id)[0].user_agent).toHaveLength(256);
    testDb.prepare('DELETE FROM users WHERE id = ?').run(user.id);
    expect(testDb.prepare('SELECT COUNT(*) AS n FROM push_subscriptions').get()).toEqual({ n: 0 });
  });

  it('PUSHSUB-008: migration 245 created the table with its user index', () => {
    const index = testDb
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'push_subscriptions'")
      .all() as { name: string }[];
    expect(index.map((i) => i.name)).toContain('idx_push_subscriptions_user');
  });
});
