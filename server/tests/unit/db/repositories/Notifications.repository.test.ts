import { Notifications } from '../../../../src/db/entities/Notifications.entity';
import { Users } from '../../../../src/db/entities/Users.entity';
import type { NotificationsRepository } from '../../../../src/db/repositories/Notifications.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser, createTrip, addTripMember, type TestUser, type TestTrip } from '../../../helpers/factories';
import { findRow, findRows, insertRow, updateRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: NotificationsRepository;
let owner: TestUser;
let trip: TestTrip;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(Notifications);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
  owner = createUser(testDb).user;
  trip = createTrip(testDb, owner.id);
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

/** Inserts one of each NT-inventory notification type, with every optional field set, for `recipientId`. Returns the three ids in insertion order (simple, boolean, navigate). */
async function seedThreeTypes(
  recipientId: number,
  senderId: number | null,
): Promise<{ simpleId: number; booleanId: number; navigateId: number }> {
  const simpleId = await insertRow(t, Notifications, {
    type: 'simple',
    scope: 'trip',
    target: trip.id,
    sender: senderId,
    recipient: recipientId,
    title_key: 'notif.trip_invite.title',
    title_params: '{"trip":"Rome"}',
    text_key: 'notif.trip_invite.text',
    text_params: '{"actor":"Alice"}',
  });

  const booleanId = await insertRow(t, Notifications, {
    type: 'boolean',
    scope: 'trip',
    target: trip.id,
    sender: senderId,
    recipient: recipientId,
    title_key: 'notif.vacay_invite.title',
    title_params: '{"trip":"Rome"}',
    text_key: 'notif.vacay_invite.text',
    text_params: '{"actor":"Bob"}',
    positive_text_key: 'notif.action.accept',
    negative_text_key: 'notif.action.decline',
    positive_callback: '{"action":"noop","payload":{"x":1}}',
    negative_callback: '{"action":"noop","payload":{"x":2}}',
  });

  const navigateId = await insertRow(t, Notifications, {
    type: 'navigate',
    scope: 'trip',
    target: trip.id,
    sender: senderId,
    recipient: recipientId,
    title_key: 'notif.booking_change.title',
    title_params: '{"trip":"Rome"}',
    text_key: 'notif.booking_change.text',
    text_params: '{"actor":"Carl"}',
    navigate_text_key: 'notif.action.view_trip',
    navigate_target: '/trips/1',
  });

  return { simpleId, booleanId, navigateId };
}

/** The legacy `SELECT * FROM notifications WHERE id = ?`, run raw, for a full-key parity comparison. */
function legacyFindById(id: number): unknown {
  // test-sql-allow: the legacy full-row SELECT is the parity oracle the repository is compared against.
  return testDb.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
}

/** The notification row as it is now; fails the test when it is gone. */
async function notificationRow(id: number) {
  return (await findRow(t, Notifications, { id }))!;
}

describe('NotificationsRepository — findById/findByIdForRecipient parity (fully seeded: simple/boolean/navigate, every optional field set)', () => {
  it('NOTREPO-001 — findById matches the legacy full-row SELECT, byte for byte, for all three notification types', async () => {
    const { user: recipient } = createUser(testDb);
    const { user: sender } = createUser(testDb);
    const { simpleId, booleanId, navigateId } = await seedThreeTypes(recipient.id, sender.id);

    for (const id of [simpleId, booleanId, navigateId]) {
      const legacy = legacyFindById(id);
      const converted = await repo.findById(id);
      expect(converted).toEqual(legacy);
    }
  });

  it('NOTREPO-002 — findByIdForRecipient matches the legacy recipient-scoped SELECT, and returns undefined for the wrong recipient', async () => {
    const { user: recipient } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const { booleanId } = await seedThreeTypes(recipient.id, null);

    // test-sql-allow: the legacy recipient-scoped SELECT is the parity oracle the repository is compared against.
    const legacy = testDb
      .prepare('SELECT * FROM notifications WHERE id = ? AND recipient_id = ?')
      .get(booleanId, recipient.id);
    expect(await repo.findByIdForRecipient(booleanId, recipient.id)).toEqual(legacy);
    expect(await repo.findByIdForRecipient(booleanId, stranger.id)).toBeUndefined();
  });

  it('NOTREPO-003 — findWithSenderById matches the legacy LEFT JOIN users projection (sender_username/sender_avatar), including a NULL sender', async () => {
    const { user: recipient } = createUser(testDb);
    const { user: sender } = createUser(testDb, { username: 'Alice', email: 'alice@test.example.com' });
    const { simpleId } = await seedThreeTypes(recipient.id, sender.id);

    // test-sql-allow: the legacy LEFT JOIN projection is the parity oracle the repository is compared against.
    const legacy = testDb
      .prepare(
        `
      SELECT n.*, u.username AS sender_username, u.avatar AS sender_avatar
      FROM notifications n LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.id = ?
    `,
      )
      .get(simpleId);
    expect(await repo.findWithSenderById(simpleId)).toEqual(legacy);

    // A system notification (no sender) — the LEFT JOIN's NULL side.
    const systemId = await insertRow(t, Notifications, {
      type: 'simple',
      scope: 'admin',
      target: 0,
      sender: null,
      recipient: recipient.id,
      title_key: 'notif.version_available.title',
      title_params: '{}',
      text_key: 'notif.version_available.text',
      text_params: '{}',
    });
    // test-sql-allow: the legacy LEFT JOIN projection is the parity oracle the repository is compared against.
    const legacySystem = testDb
      .prepare(
        `
      SELECT n.*, u.username AS sender_username, u.avatar AS sender_avatar
      FROM notifications n LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.id = ?
    `,
      )
      .get(systemId);
    expect(await repo.findWithSenderById(systemId)).toEqual(legacySystem);
  });

  it('NOTREPO-004 — listForRecipient matches the legacy joined page read, for both unreadOnly variants', async () => {
    const { user: recipient } = createUser(testDb);
    const { user: sender } = createUser(testDb);
    await seedThreeTypes(recipient.id, sender.id);
    // The recipient's first notification is read, the other two are not.
    const [first] = await findRows(t, Notifications, { recipient: recipient.id }, { id: 'asc' });
    await updateRows(t, Notifications, { id: first.id }, { is_read: 1 });

    for (const unreadOnly of [false, true]) {
      const whereAliased = unreadOnly ? 'WHERE n.recipient_id = ? AND n.is_read = 0' : 'WHERE n.recipient_id = ?';
      // test-sql-allow: the legacy joined page read is the parity oracle the repository is compared against.
      const legacy = testDb
        .prepare(
          `
        SELECT n.*, u.username AS sender_username, u.avatar AS sender_avatar
        FROM notifications n LEFT JOIN users u ON n.sender_id = u.id
        ${whereAliased}
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
      `,
        )
        .all(recipient.id, 20, 0);
      const converted = await repo.listForRecipient(recipient.id, 20, 0, unreadOnly);
      expect(converted).toEqual(legacy);
    }
  });
});

describe('NotificationsRepository — recipient resolution (NT1-NT4)', () => {
  it('NOTREPO-005 — getTripOwnerId matches `SELECT user_id FROM trips WHERE id = ?`', async () => {
    // test-sql-allow: the legacy statement named in the case title is the parity oracle.
    const legacy = (testDb.prepare('SELECT user_id FROM trips WHERE id = ?').get(trip.id) as { user_id: number })
      .user_id;
    expect(await repo.getTripOwnerId(trip.id)).toBe(legacy);
    expect(await repo.getTripOwnerId(999999)).toBeNull();
  });

  it('NOTREPO-006 — listNonGuestTripMemberIds (NT2, the guest-exclusion chokepoint, #1362): a guest member never appears, a real member always does', async () => {
    const { user: member } = createUser(testDb);
    addTripMember(testDb, trip.id, member.id);
    const guestId = await insertRow(t, Users, {
      username: 'Guest',
      email: 'guest-repo@guests.invalid',
      password_hash: '',
      role: 'user',
      is_guest: 1,
    });
    addTripMember(testDb, trip.id, guestId);

    // test-sql-allow: the legacy statement named in the case title is the parity oracle.
    const legacy = (
      testDb
        .prepare(
          'SELECT m.user_id FROM trip_members m JOIN users u ON u.id = m.user_id WHERE m.trip_id = ? AND COALESCE(u.is_guest, 0) = 0',
        )
        .all(trip.id) as { user_id: number }[]
    ).map((r) => r.user_id);
    const converted = await repo.listNonGuestTripMemberIds(trip.id);

    expect(converted.sort()).toEqual(legacy.sort());
    expect(converted).toContain(member.id);
    expect(converted).not.toContain(guestId);
  });

  it('NOTREPO-007 — findGuestFlag matches `SELECT is_guest FROM users WHERE id = ?`, and is undefined for a nonexistent user', async () => {
    const { user } = createUser(testDb);
    expect(await repo.findGuestFlag(user.id)).toEqual({ is_guest: 0 });
    expect(await repo.findGuestFlag(999999)).toBeUndefined();
  });

  it('NOTREPO-008 — listNonGuestUserIdsByRole matches `SELECT id FROM users WHERE role = ? AND COALESCE(is_guest, 0) = 0`', async () => {
    const { user: admin1 } = createUser(testDb, { role: 'admin' });
    const { user: admin2 } = createUser(testDb, { role: 'admin' });
    createUser(testDb); // a regular user — must not appear
    const guestAdminId = await insertRow(t, Users, {
      username: 'GuestAdmin',
      email: 'guest-admin@guests.invalid',
      password_hash: '',
      role: 'admin',
      is_guest: 1,
    });

    // test-sql-allow: the legacy statement named in the case title is the parity oracle.
    const legacy = (
      testDb.prepare('SELECT id FROM users WHERE role = ? AND COALESCE(is_guest, 0) = 0').all('admin') as {
        id: number;
      }[]
    ).map((r) => r.id);
    const converted = await repo.listNonGuestUserIdsByRole('admin');

    expect(converted.sort()).toEqual(legacy.sort());
    expect(converted).toContain(admin1.id);
    expect(converted).toContain(admin2.id);
    expect(converted).not.toContain(guestAdminId);
  });

  it('NOTREPO-009 — findUserBasic matches `SELECT username, avatar FROM users WHERE id = ?`', async () => {
    const { user } = createUser(testDb);
    await updateRows(t, Users, { id: user.id }, { avatar: 'avatar.png' });
    // test-sql-allow: the legacy statement named in the case title is the parity oracle.
    const legacy = testDb.prepare('SELECT username, avatar FROM users WHERE id = ?').get(user.id);
    expect(await repo.findUserBasic(user.id)).toEqual(legacy);
    expect(await repo.findUserBasic(999999)).toBeUndefined();
  });
});

describe('NotificationsRepository — writes', () => {
  it('NOTREPO-010 — insertNotification writes all 15 columns and returns the new id', async () => {
    const { user: recipient } = createUser(testDb);
    const { user: sender } = createUser(testDb);

    const id = await repo.insertNotification({
      type: 'boolean',
      scope: 'trip',
      target: trip.id,
      sender_id: sender.id,
      recipient_id: recipient.id,
      title_key: 'notif.trip_invite.title',
      title_params: '{"trip":"Rome"}',
      text_key: 'notif.trip_invite.text',
      text_params: '{"actor":"A"}',
      positive_text_key: 'notif.action.accept',
      negative_text_key: 'notif.action.decline',
      positive_callback: '{"action":"noop","payload":{}}',
      negative_callback: '{"action":"noop","payload":{}}',
      navigate_text_key: null,
      navigate_target: null,
    });

    const row = await notificationRow(id);
    expect(row.type).toBe('boolean');
    expect(row.scope).toBe('trip');
    expect(row.target).toBe(trip.id);
    expect(row.sender_id).toBe(sender.id);
    expect(row.recipient_id).toBe(recipient.id);
    expect(row.positive_callback).toBe('{"action":"noop","payload":{}}');
    expect(row.is_read).toBe(0);
    expect(row.response).toBeNull();
  });

  it('NOTREPO-011 — setRead/markAllRead/deleteForRecipient/deleteAllForRecipient are recipient-scoped and return the affected-row count', async () => {
    const { user: recipient } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const { simpleId, booleanId } = await seedThreeTypes(recipient.id, null);

    expect(await repo.setRead(simpleId, stranger.id, 1)).toBe(0); // wrong recipient — no-op
    expect(await repo.setRead(simpleId, recipient.id, 1)).toBe(1);
    expect((await notificationRow(simpleId)).is_read).toBe(1);

    expect(await repo.setRead(simpleId, recipient.id, 0)).toBe(1);

    expect(await repo.markAllRead(recipient.id)).toBe(3); // simple + boolean + navigate, all currently unread
    expect(await repo.countUnreadForRecipient(recipient.id)).toBe(0);

    expect(await repo.deleteForRecipient(booleanId, stranger.id)).toBe(0);
    expect(await repo.deleteForRecipient(booleanId, recipient.id)).toBe(1);
    expect(await repo.deleteAllForRecipient(recipient.id)).toBe(2); // simple + navigate remain
    expect(await repo.countForRecipient(recipient.id, false)).toBe(0);
  });

  it('NOTREPO-012 — claimResponse (NT20) only succeeds once: the atomic double-submit claim', async () => {
    const { user: recipient } = createUser(testDb);
    const { booleanId } = await seedThreeTypes(recipient.id, null);

    expect(await repo.claimResponse(booleanId, recipient.id, 'positive')).toBe(1);
    // A second claim on the same, now-claimed notification affects 0 rows —
    // the `response IS NULL` guard is the load-bearing part of this statement.
    expect(await repo.claimResponse(booleanId, recipient.id, 'negative')).toBe(0);
    expect((await notificationRow(booleanId)).response).toBe('positive');
  });

  it('NOTREPO-013 — releaseResponse (NT21) restores the claim so a retry can succeed', async () => {
    const { user: recipient } = createUser(testDb);
    const { booleanId } = await seedThreeTypes(recipient.id, null);

    await repo.claimResponse(booleanId, recipient.id, 'positive');
    await repo.releaseResponse(booleanId, recipient.id, 0);
    const row = await notificationRow(booleanId);
    expect(row.response).toBeNull();
    expect(row.is_read).toBe(0);
    expect(await repo.claimResponse(booleanId, recipient.id, 'negative')).toBe(1);
  });
});
