/**
 * Web Push inside the dispatcher (WPDISP-*): the admin switch, the per-user
 * Push column, admin-scoped events, the preference matrix, the generic test
 * route, and all of them while the key pair cannot be used, stored or from
 * VAPID_*. Real NotificationsService and real SQL; safeFetchFollow is the edge.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { createECDH } from 'node:crypto';

// One snapshot connection per file, created inside the factory so nothing has
// to be hoisted above the imports; the tests reach it through the mocked module.
vi.mock('../../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
});
const { safeFetchFollow, logError } = vi.hoisted(() => ({ safeFetchFollow: vi.fn(), logError: vi.fn() }));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError,
  logWarn: vi.fn(),
}));
vi.mock('../../../../src/utils/ssrfGuard', () => {
  class SsrfBlockedError extends Error {}
  return { SsrfBlockedError, safeFetchFollow };
});

import { db as testDb } from '../../../../src/db/database';
import { resetTestDb } from '../../../helpers/test-db';
import { sharedTestOrm } from '../../../helpers/test-uow';
import { countRows, deleteRows, findRows, insertRow, updateRows } from '../../../helpers/factories/rows';
import { readAppSetting } from '../../../helpers/factories/settings';
import { AppSettings } from '../../../../src/db/entities/AppSettings.entity';
import { Notifications } from '../../../../src/db/entities/Notifications.entity';
import { Settings } from '../../../../src/db/entities/Settings.entity';
import { createAdmin, createUser, disableNotificationPref, setNotificationChannels } from '../../../helpers/factories';
import {
  makeNotificationPreferencesService,
  makeNotificationsService,
  makePushSubscriptionsService,
  makeVapidKeysService,
} from '../../../helpers/notifications';
import type { NotificationsService } from '../../../../src/nest/notifications/notifications.service';
import type { NotificationPreferencesService } from '../../../../src/nest/notifications/notification-preferences.service';
import type { PushSubscriptionsService } from '../../../../src/nest/notifications/push/push-subscriptions.service';
import {
  PUSH_UNAVAILABLE_ERROR,
  VAPID_PRIVATE_KEY_SETTING,
  type VapidKeysService,
} from '../../../../src/nest/notifications/push/vapid-keys.service';
import { checkPushSubscription } from '../../../../src/nest/notifications/push/push-subscription.helpers';
import { generateVapidKeyPair } from '../../../../src/nest/notifications/push/web-push-crypto';

// Built in beforeAll: every provider takes repositories and a UnitOfWork,
// which are async to resolve on this file's handle.
let notifications: NotificationsService;
let prefs: NotificationPreferencesService;
let subscriptions: PushSubscriptionsService;
let keys: VapidKeysService;

async function addDevice(userId: number, endpoint = `https://fcm.googleapis.com/fcm/send/u${userId}`): Promise<string> {
  const ua = createECDH('prime256v1');
  ua.generateKeys();
  const checked = checkPushSubscription({
    endpoint,
    keys: { p256dh: ua.getPublicKey('base64url'), auth: Buffer.alloc(16, 7).toString('base64url') },
  });
  if ('error' in checked) throw new Error(checked.error);
  await subscriptions.upsert(userId, checked.value, await keys.getPublicKey());
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

async function breakStoredPrivateKey(): Promise<void> {
  await updateRows(await sharedTestOrm(testDb), AppSettings, { key: VAPID_PRIVATE_KEY_SETTING }, { value: UNREADABLE });
}

const pushColumn = async (userId: number) =>
  (await prefs.getPreferencesMatrix(userId, 'user')).channels.find((c) => c.id === 'push');

const storedKeyRows = async () =>
  (await findRows(await sharedTestOrm(testDb), AppSettings, { key: { $like: 'web_push_vapid_%' } }, { key: 'asc' })).map(
    (r) => ({ key: r.key, value: r.value }),
  );

beforeAll(async () => {
  notifications = await makeNotificationsService(testDb);
  prefs = await makeNotificationPreferencesService(testDb);
  subscriptions = await makePushSubscriptionsService(testDb);
  keys = await makeVapidKeysService(testDb);
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
    const endpoint = await addDevice(user.id);
    setNotificationChannels(testDb, 'push');
    await invite(user.id, actor.id);
    expect(pushedTo()).toEqual([endpoint]);
  });

  it('WPDISP-002: stays quiet while the admin has not enabled push', async () => {
    const { user } = createUser(testDb);
    const { user: actor } = createUser(testDb);
    await addDevice(user.id);
    setNotificationChannels(testDb, 'email');
    await invite(user.id, actor.id);
    expect(safeFetchFollow).not.toHaveBeenCalled();
  });

  it('WPDISP-003: respects the user switching the event off in the Push column', async () => {
    const { user } = createUser(testDb);
    const { user: actor } = createUser(testDb);
    await addDevice(user.id);
    setNotificationChannels(testDb, 'push');
    disableNotificationPref(testDb, user.id, 'trip_invite', 'push');
    await invite(user.id, actor.id);
    expect(safeFetchFollow).not.toHaveBeenCalled();
  });

  it('WPDISP-004: never carries an admin-scoped event', async () => {
    const { user: admin } = createAdmin(testDb);
    await addDevice(admin.id);
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
  it('WPDISP-005: the user matrix gets a Push column, active by the admin switch, configured by a device', async () => {
    const { user } = createUser(testDb);
    let push = (await prefs.getPreferencesMatrix(user.id, 'user')).channels.find((c) => c.id === 'push');
    expect(push).toMatchObject({
      source: 'builtin',
      labelKey: 'settings.notificationPreferences.push',
      active: false,
      configured: false,
    });

    setNotificationChannels(testDb, 'email,push');
    await addDevice(user.id);
    push = (await prefs.getPreferencesMatrix(user.id, 'user')).channels.find((c) => c.id === 'push');
    expect(push).toMatchObject({ active: true, configured: true });
    expect(await prefs.getActiveChannels()).toEqual(['email', 'push']);
    expect((await prefs.getPreferencesMatrix(user.id, 'user')).implemented_combos['trip_invite']).toContain('push');
  });

  it('WPDISP-006: the admin matrix has no Push column, since push never carries admin events', async () => {
    const { user: admin } = createAdmin(testDb);
    const matrix = await prefs.getPreferencesMatrix(admin.id, 'admin', 'admin');
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
    const endpoint = await addDevice(user.id);
    await expect(notifications.testChannel(user.id, 'push')).resolves.toEqual({ success: true });
    expect(pushedTo()).toEqual([endpoint]);
  });
});

describe('Web Push while the stored key pair cannot be used', () => {
  it('WPDISP-008: a send skips push without an error while in-app and webhook still go out', async () => {
    const { user } = createUser(testDb);
    const { user: actor } = createUser(testDb);
    const endpoint = await addDevice(user.id);
    await insertRow(await sharedTestOrm(testDb), Settings, { user: user.id, key: 'webhook_url', value: 'https://hooks.example.test/trek' });
    setNotificationChannels(testDb, 'webhook,push');
    await breakStoredPrivateKey();

    // In-app and the webhook go out; the skipped push is no failed delivery.
    await expect(invite(user.id, actor.id)).resolves.toEqual({ attempted: 2, delivered: 2 });

    expect(pushedTo()).toEqual(['https://hooks.example.test/trek']);
    expect(await countRows(await sharedTestOrm(testDb), Notifications, { recipient: user.id })).toBe(1);
    // The device is kept for when the key is back, and nothing failed on the way.
    expect((await subscriptions.listForUser(user.id)).map((r) => r.endpoint)).toEqual([endpoint]);
    expect(logError).not.toHaveBeenCalledWith(expect.stringContaining('dispatch failed'));
    expect(logError).not.toHaveBeenCalledWith(expect.stringContaining('Web Push failed'));
  });

  it('WPDISP-009: the matrix stops offering push, so the card and the column go, and both come back with the key', async () => {
    const { user } = createUser(testDb);
    setNotificationChannels(testDb, 'email,push');
    await addDevice(user.id);
    const ciphertext = await readAppSetting(await sharedTestOrm(testDb), VAPID_PRIVATE_KEY_SETTING);
    if (ciphertext === null) throw new Error('the private key should be stored by now');
    await breakStoredPrivateKey();

    expect(await pushColumn(user.id)).toMatchObject({ active: false, configured: true });
    // Only push: email keeps its column, SMTP or not, as it always has.
    expect((await prefs.getPreferencesMatrix(user.id, 'user')).channels.find((c) => c.id === 'email')?.active).toBe(true);

    await updateRows(await sharedTestOrm(testDb), AppSettings, { key: VAPID_PRIVATE_KEY_SETTING }, { value: ciphertext });
    expect(await pushColumn(user.id)).toMatchObject({ active: true, configured: true });
  });

  it('WPDISP-009b: reading the matrix while neither key row exists writes nothing, and push is still offered', async () => {
    const { user } = createUser(testDb);
    setNotificationChannels(testDb, 'email,push');
    await addDevice(user.id);
    // What deleting both rows to start over leaves under a running server.
    await deleteRows(await sharedTestOrm(testDb), AppSettings, { key: { $like: 'web_push_vapid_%' } });

    expect(await pushColumn(user.id)).toMatchObject({ active: true, configured: true });
    expect(await storedKeyRows()).toEqual([]);
  });

  it('WPDISP-010: the test send says push is unavailable and sends nothing', async () => {
    const { user } = createUser(testDb);
    await addDevice(user.id);
    await breakStoredPrivateKey();
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
    await keys.getPublicKey();
    const stored = await storedKeyRows();
    const pair = generateVapidKeyPair();
    vi.stubEnv('VAPID_PUBLIC_KEY', pair.publicKey);
    vi.stubEnv('VAPID_PRIVATE_KEY', pair.privateKey);
    const endpoint = await addDevice(user.id);
    // A typo or a rotated Secret: still a valid 32-byte key, so boot is fine.
    vi.stubEnv('VAPID_PRIVATE_KEY', generateVapidKeyPair().privateKey);

    // Only the in-app row goes out; the push it cannot send counts as skipped, not failed.
    await expect(invite(user.id, actor.id)).resolves.toEqual({ attempted: 1, delivered: 1 });

    expect(safeFetchFollow).not.toHaveBeenCalled();
    expect((await subscriptions.listForUser(user.id)).map((r) => [r.endpoint, r.vapid_public_key])).toEqual([
      [endpoint, pair.publicKey],
    ]);
    expect(await storedKeyRows()).toEqual(stored);
    expect(await pushColumn(user.id)).toMatchObject({ active: false, configured: true });

    vi.stubEnv('VAPID_PRIVATE_KEY', pair.privateKey);
    expect(await pushColumn(user.id)).toMatchObject({ active: true, configured: true });
    await invite(user.id, actor.id);
    expect(pushedTo()).toEqual([endpoint]);
  });
});
