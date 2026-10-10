/**
 * Unit tests for in-app notification preference filtering in
 * NotificationsService.createNotification() and the respondToBoolean flow —
 * INOTIF-001 to INOTIF-004 (moved 1:1 from the legacy
 * tests/unit/services/inAppNotificationPrefs.test.ts when the in-app store
 * SQL folded into nest/notifications).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
    return mock;
});

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createAdmin, disableNotificationPref } from '../../helpers/factories';
import { registerAction } from '../../../src/nest/notifications/in-app-actions';
import { NotificationsService } from '../../../src/nest/notifications/notifications.service';
import { makeNotificationsService, makeNotificationPreferencesService } from '../../helpers/notifications';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { findRow, insertRow } from '../../helpers/factories/rows';
import { makeNotification } from '../../helpers/factories/notifications';
import { makeTrip } from '../../helpers/factories/trips';
import { Notifications } from '../../../src/db/entities/Notifications.entity';
import { TripMembers } from '../../../src/db/entities/TripMembers.entity';
import { FakeRealtimeService } from '../../helpers/fake-realtime';

const realtime = new FakeRealtimeService();
const broadcastMock = realtime.broadcastToUserMock;

// Built in beforeAll: the service now takes a UnitOfWork, which is async to build.
let notifications: NotificationsService;
// Arrow forwarders rather than `.bind(notifications)`: under `strictBindCallApply: false`
// a bound alias is typed `any`, which hides a missing `await` from tsc AND from the
// type-aware lint rules (recipe R4).
type Svc = NotificationsService;
const createNotification = (...a: Parameters<Svc['createNotification']>) => notifications.createNotification(...a);
const createNotificationForRecipient = (...a: Parameters<Svc['createNotificationForRecipient']>) => notifications.createNotificationForRecipient(...a);
const respondToBoolean = (...a: Parameters<Svc['respond']>) => notifications.respond(...a);

beforeAll(async () => {
  notifications = await makeNotificationsService(testDb, realtime);
});

beforeEach(() => {
  resetTestDb(testDb);
  broadcastMock.mockClear();
});

let orm: TestOrm;

beforeAll(async () => {
  orm = await createTestOrm(testDb);
});

afterAll(async () => {
  await orm.close();
  testDb.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// createNotification — preference filtering
// ─────────────────────────────────────────────────────────────────────────────

describe('createNotification — preference filtering', () => {
  it('INOTIF-001 — notification without event_type is delivered to all recipients (backward compat)', async () => {
    const { user: admin } = createAdmin(testDb);
    const { user: recipient } = createUser(testDb);
    // The admin scope targets all admins — create a second admin as the sender
    const { user: sender } = createAdmin(testDb);

    // Send to a specific user (user scope) without event_type
    const ids = await createNotification({
      type: 'simple',
      scope: 'user',
      target: recipient.id,
      sender_id: sender.id,
      title_key: 'notifications.test.title',
      text_key: 'notifications.test.text',
      // no event_type
    });

    expect(ids.length).toBe(1);
    const row = await findRow(orm, Notifications, { recipient: recipient.id });
    expect(row).not.toBeNull();
    // Also verify the admin who disabled all prefs still gets messages without event_type
    disableNotificationPref(testDb, admin.id, 'trip_invite', 'inapp');
    // admin still gets this since no event_type check
    const adminIds = await createNotification({
      type: 'simple',
      scope: 'user',
      target: admin.id,
      sender_id: sender.id,
      title_key: 'notifications.test.title',
      text_key: 'notifications.test.text',
    });
    expect(adminIds.length).toBe(1);
  });

  it('INOTIF-002 — notification with event_type skips recipients who have disabled that event on inapp', async () => {
    const { user: sender } = createAdmin(testDb);
    const { user: recipient1 } = createUser(testDb);
    const { user: recipient2 } = createUser(testDb);

    // recipient2 has disabled inapp for trip_invite
    disableNotificationPref(testDb, recipient2.id, 'trip_invite', 'inapp');

    // Use a trip to target both members
    const tripId = (await makeTrip(orm, sender.id, { title: 'Test Trip' })).id;
    await insertRow(orm, TripMembers, { trip: tripId, user: recipient1.id });
    await insertRow(orm, TripMembers, { trip: tripId, user: recipient2.id });

    const ids = await createNotification({
      type: 'simple',
      scope: 'trip',
      target: tripId,
      sender_id: sender.id,
      event_type: 'trip_invite',
      title_key: 'notifications.test.title',
      text_key: 'notifications.test.text',
    });

    // sender excluded, recipient1 included, recipient2 skipped (disabled pref)
    expect(ids.length).toBe(1);
    const r1 = await findRow(orm, Notifications, { recipient: recipient1.id });
    const r2 = await findRow(orm, Notifications, { recipient: recipient2.id });
    expect(r1).not.toBeNull();
    expect(r2).toBeNull();
  });

  it('INOTIF-003 — notification with event_type delivers to recipients with no stored preferences', async () => {
    const { user: sender } = createAdmin(testDb);
    const { user: recipient } = createUser(testDb);

    // No preferences stored for recipient — should default to enabled
    const ids = await createNotification({
      type: 'simple',
      scope: 'user',
      target: recipient.id,
      sender_id: sender.id,
      event_type: 'trip_invite',
      title_key: 'notifications.test.title',
      text_key: 'notifications.test.text',
    });

    expect(ids.length).toBe(1);
    const row = await findRow(orm, Notifications, { recipient: recipient.id });
    expect(row).not.toBeNull();
  });

  it('INOTIF-003b — createNotificationForRecipient inserts a single notification and broadcasts via WS', async () => {
    const { user: sender } = createAdmin(testDb);
    const { user: recipient } = createUser(testDb);

    const id = await createNotificationForRecipient(
      {
        type: 'navigate',
        scope: 'user',
        target: recipient.id,
        sender_id: sender.id,
        event_type: 'trip_invite',
        title_key: 'notif.trip_invite.title',
        text_key: 'notif.trip_invite.text',
        navigate_text_key: 'notif.action.view_trip',
        navigate_target: '/trips/99',
      },
      recipient.id,
      { username: 'admin', avatar: null }
    );

    expect(id).toBeTypeOf('number');
    const row = await findRow(orm, Notifications, { id });
    expect(row).not.toBeNull();
    expect(row!.recipient_id).toBe(recipient.id);
    expect(row!.navigate_target).toBe('/trips/99');
    expect(broadcastMock).toHaveBeenCalledTimes(1);
    expect(broadcastMock.mock.calls[0][0]).toBe(recipient.id);
  });

  it('INOTIF-004 — admin-scope version_available only reaches admins with enabled pref', async () => {
    const { user: admin1 } = createAdmin(testDb);
    const { user: admin2 } = createAdmin(testDb);

    // admin2 disables version_available inapp notifications
    disableNotificationPref(testDb, admin2.id, 'version_available', 'inapp');

    const ids = await createNotification({
      type: 'navigate',
      scope: 'admin',
      target: 0,
      sender_id: null,
      event_type: 'version_available',
      title_key: 'notifications.versionAvailable.title',
      text_key: 'notifications.versionAvailable.text',
      navigate_text_key: 'notifications.versionAvailable.button',
      navigate_target: '/admin',
    });

    // Only admin1 should receive it
    expect(ids.length).toBe(1);
    const admin1Row = await findRow(orm, Notifications, { recipient: admin1.id });
    const admin2Row = await findRow(orm, Notifications, { recipient: admin2.id });
    expect(admin1Row).not.toBeNull();
    expect(admin2Row).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// respondToBoolean
// ─────────────────────────────────────────────────────────────────────────────

/** A yes/no notification for the user whose two buttons run the named actions. */
async function insertBoolean(recipientId: number, senderId: number | null, positive: string, negative = positive): Promise<number> {
  const row = await makeNotification(orm, recipientId, {
    type: 'boolean', sender: senderId,
    title_key: 'notif.test.title', title_params: '{}', text_key: 'notif.test.text', text_params: '{}',
    positive_text_key: 'notif.action.accept', negative_text_key: 'notif.action.decline',
    positive_callback: JSON.stringify({ action: positive, payload: {} }),
    negative_callback: JSON.stringify({ action: negative, payload: {} }),
  });
  return row.id;
}

function insertBooleanNotification(recipientId: number, senderId: number | null = null): Promise<number> {
  return insertBoolean(recipientId, senderId, 'test_approve', 'test_deny');
}

async function insertSimpleNotification(recipientId: number): Promise<number> {
  const row = await makeNotification(orm, recipientId, {
    sender: null, title_key: 'notif.test.title', title_params: '{}', text_key: 'notif.test.text', text_params: '{}',
  });
  return row.id;
}

describe('respondToBoolean', () => {
  it('INOTIF-005 — positive response sets response=positive, marks read, broadcasts update', async () => {
    const { user } = createUser(testDb);
    const id = await insertBooleanNotification(user.id);

    const result = await respondToBoolean(id, user.id, 'positive');

    expect(result.success).toBe(true);
    expect(result.notification).toBeDefined();
    const row = await findRow(orm, Notifications, { id });
    expect(row?.response).toBe('positive');
    expect(row?.is_read).toBe(1);
    expect(broadcastMock).toHaveBeenCalledWith(user.id, expect.objectContaining({ type: 'notification:updated' }));
  });

  it('INOTIF-006 — negative response sets response=negative', async () => {
    const { user } = createUser(testDb);
    const id = await insertBooleanNotification(user.id);

    const result = await respondToBoolean(id, user.id, 'negative');

    expect(result.success).toBe(true);
    const row = await findRow(orm, Notifications, { id });
    expect(row?.response).toBe('negative');
  });

  it('INOTIF-007 — double-response prevention returns error on second call', async () => {
    const { user } = createUser(testDb);
    const id = await insertBooleanNotification(user.id);

    await respondToBoolean(id, user.id, 'positive');
    const result = await respondToBoolean(id, user.id, 'negative');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already responded/i);
  });

  it('INOTIF-008 — response on a simple notification returns error', async () => {
    const { user } = createUser(testDb);
    const id = await insertSimpleNotification(user.id);

    const result = await respondToBoolean(id, user.id, 'positive');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not a boolean/i);
  });

  it('INOTIF-009 — response on a non-existent notification returns error', async () => {
    const { user } = createUser(testDb);
    const result = await respondToBoolean(99999, user.id, 'positive');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  it('INOTIF-010 — response on notification belonging to another user returns error', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const id = await insertBooleanNotification(owner.id);

    const result = await respondToBoolean(id, other.id, 'positive');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  // ── Regression pins from the post-fold fix(server) commit ──────────────────

  it('INOTIF-011 — a concurrent double-submit executes the action handler exactly once (CAS before handler)', async () => {
    const { user } = createUser(testDb);
    const calls: string[] = [];
    // Slow handler: with the legacy handler-before-CAS order, both submits
    // passed the response-IS-NULL pre-check while the first awaited here and
    // the action ran twice.
    registerAction('slow_approve', async () => {
      calls.push('run');
      await new Promise((resolve) => setImmediate(resolve));
    });
    const id = await insertBoolean(user.id, null, 'slow_approve');

    const [first, second] = await Promise.all([
      respondToBoolean(id, user.id, 'positive'),
      respondToBoolean(id, user.id, 'negative'),
    ]);

    expect(calls).toHaveLength(1);
    const outcomes = [first, second];
    expect(outcomes.filter((r) => r.success)).toHaveLength(1);
    expect(outcomes.find((r) => !r.success)?.error).toMatch(/already responded/i);
  });

  it('INOTIF-012 — a handler failure releases the claim: error returned, notification stays unresponded, retry succeeds', async () => {
    const { user } = createUser(testDb);
    let shouldFail = true;
    registerAction('flaky_approve', async () => {
      if (shouldFail) throw new Error('downstream unavailable');
    });
    const id = await insertBoolean(user.id, null, 'flaky_approve');

    const failed = await respondToBoolean(id, user.id, 'positive');
    expect(failed).toEqual({ success: false, error: 'downstream unavailable' });
    const row = await findRow(orm, Notifications, { id });
    expect(row?.response).toBeNull();
    expect(row?.is_read).toBe(0);

    shouldFail = false;
    const retried = await respondToBoolean(id, user.id, 'positive');
    expect(retried.success).toBe(true);
  });

  it('INOTIF-013 — respond result + broadcast carry an ISO-UTC created_at (toUtcIso, #1149 parity across paths)', async () => {
    const { user } = createUser(testDb);
    const id = await insertBooleanNotification(user.id);

    const result = await respondToBoolean(id, user.id, 'positive');

    expect(result.notification?.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    const broadcastPayload = broadcastMock.mock.calls
      .map((call) => call[1] as { type: string; notification: { created_at: string } })
      .find((p) => p.type === 'notification:updated');
    expect(broadcastPayload?.notification.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  it('INOTIF-014 — createNotification broadcast carries an ISO-UTC created_at (was the un-patched #1149 path)', async () => {
    const { user } = createUser(testDb);

    await createNotification({
      type: 'simple',
      scope: 'user',
      target: user.id,
      sender_id: null,
      title_key: 'notif.test.title',
      text_key: 'notif.test.text',
    });

    const broadcastPayload = broadcastMock.mock.calls
      .map((call) => call[1] as { type: string; notification: { created_at: string } })
      .find((p) => p.type === 'notification:new');
    expect(broadcastPayload?.notification.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
