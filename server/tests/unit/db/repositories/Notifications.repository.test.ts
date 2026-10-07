import { Notifications } from '../../../../src/db/entities/Notifications.entity';
import type { NotificationsRepository } from '../../../../src/db/repositories/Notifications.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser, createTrip, addTripMember, type TestUser, type TestTrip } from '../../../helpers/factories';
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
function seedThreeTypes(
  recipientId: number,
  senderId: number | null,
): { simpleId: number; booleanId: number; navigateId: number } {
  const simpleId = testDb
    .prepare(
      `
    INSERT INTO notifications (type, scope, target, sender_id, recipient_id, title_key, title_params, text_key, text_params)
    VALUES ('simple', 'trip', ?, ?, ?, 'notif.trip_invite.title', '{"trip":"Rome"}', 'notif.trip_invite.text', '{"actor":"Alice"}')
  `,
    )
    .run(trip.id, senderId, recipientId).lastInsertRowid as number;

  const booleanId = testDb
    .prepare(
      `
    INSERT INTO notifications (
      type, scope, target, sender_id, recipient_id, title_key, title_params, text_key, text_params,
      positive_text_key, negative_text_key, positive_callback, negative_callback
    ) VALUES ('boolean', 'trip', ?, ?, ?, 'notif.vacay_invite.title', '{"trip":"Rome"}', 'notif.vacay_invite.text', '{"actor":"Bob"}',
      'notif.action.accept', 'notif.action.decline', '{"action":"noop","payload":{"x":1}}', '{"action":"noop","payload":{"x":2}}')
  `,
    )
    .run(trip.id, senderId, recipientId).lastInsertRowid as number;

  const navigateId = testDb
    .prepare(
      `
    INSERT INTO notifications (
      type, scope, target, sender_id, recipient_id, title_key, title_params, text_key, text_params,
      navigate_text_key, navigate_target
    ) VALUES ('navigate', 'trip', ?, ?, ?, 'notif.booking_change.title', '{"trip":"Rome"}', 'notif.booking_change.text', '{"actor":"Carl"}',
      'notif.action.view_trip', '/trips/1')
  `,
    )
    .run(trip.id, senderId, recipientId).lastInsertRowid as number;

  return { simpleId, booleanId, navigateId };
}

/** The legacy `SELECT * FROM notifications WHERE id = ?`, run raw, for a full-key parity comparison. */
function legacyFindById(id: number): unknown {
  return testDb.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
}

describe('NotificationsRepository — findById/findByIdForRecipient parity (fully seeded: simple/boolean/navigate, every optional field set)', () => {
  it('NOTREPO-001 — findById matches the legacy full-row SELECT, byte for byte, for all three notification types', async () => {
    const { user: recipient } = createUser(testDb);
    const { user: sender } = createUser(testDb);
    const { simpleId, booleanId, navigateId } = seedThreeTypes(recipient.id, sender.id);

    for (const id of [simpleId, booleanId, navigateId]) {
      const legacy = legacyFindById(id);
      const converted = await repo.findById(id);
      expect(converted).toEqual(legacy);
    }
  });

  it('NOTREPO-002 — findByIdForRecipient matches the legacy recipient-scoped SELECT, and returns undefined for the wrong recipient', async () => {
    const { user: recipient } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const { booleanId } = seedThreeTypes(recipient.id, null);

    const legacy = testDb
      .prepare('SELECT * FROM notifications WHERE id = ? AND recipient_id = ?')
      .get(booleanId, recipient.id);
    expect(await repo.findByIdForRecipient(booleanId, recipient.id)).toEqual(legacy);
    expect(await repo.findByIdForRecipient(booleanId, stranger.id)).toBeUndefined();
  });

  it('NOTREPO-003 — findWithSenderById matches the legacy LEFT JOIN users projection (sender_username/sender_avatar), including a NULL sender', async () => {
    const { user: recipient } = createUser(testDb);
    const { user: sender } = createUser(testDb, { username: 'Alice', email: 'alice@test.example.com' });
    const { simpleId } = seedThreeTypes(recipient.id, sender.id);

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
    const systemId = testDb
      .prepare(
        `
      INSERT INTO notifications (type, scope, target, sender_id, recipient_id, title_key, title_params, text_key, text_params)
      VALUES ('simple', 'admin', 0, NULL, ?, 'notif.version_available.title', '{}', 'notif.version_available.text', '{}')
    `,
      )
      .run(recipient.id).lastInsertRowid as number;
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
    seedThreeTypes(recipient.id, sender.id);
    testDb.prepare('UPDATE notifications SET is_read = 1 WHERE recipient_id = ? LIMIT 1').run(recipient.id);
    // SQLite compiled without LIMIT-on-UPDATE support in better-sqlite3 by default — fall back to an id-scoped update.
    const firstId = (
      testDb.prepare('SELECT id FROM notifications WHERE recipient_id = ? ORDER BY id LIMIT 1').get(recipient.id) as {
        id: number;
      }
    ).id;
    testDb.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(firstId);

    for (const unreadOnly of [false, true]) {
      const whereAliased = unreadOnly ? 'WHERE n.recipient_id = ? AND n.is_read = 0' : 'WHERE n.recipient_id = ?';
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
    const legacy = (testDb.prepare('SELECT user_id FROM trips WHERE id = ?').get(trip.id) as { user_id: number })
      .user_id;
    expect(await repo.getTripOwnerId(trip.id)).toBe(legacy);
    expect(await repo.getTripOwnerId(999999)).toBeNull();
  });

  it('NOTREPO-006 — listNonGuestTripMemberIds (NT2, the guest-exclusion chokepoint, #1362): a guest member never appears, a real member always does', async () => {
    const { user: member } = createUser(testDb);
    addTripMember(testDb, trip.id, member.id);
    const guestId = testDb
      .prepare(
        "INSERT INTO users (username, email, password_hash, role, is_guest) VALUES ('Guest', 'guest-repo@guests.invalid', '', 'user', 1)",
      )
      .run().lastInsertRowid as number;
    addTripMember(testDb, trip.id, guestId);

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
    const guestAdminId = testDb
      .prepare(
        "INSERT INTO users (username, email, password_hash, role, is_guest) VALUES ('GuestAdmin', 'guest-admin@guests.invalid', '', 'admin', 1)",
      )
      .run().lastInsertRowid as number;

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
    testDb.prepare('UPDATE users SET avatar = ? WHERE id = ?').run('avatar.png', user.id);
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

    const row = testDb.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as Record<string, unknown>;
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
    const { simpleId, booleanId } = seedThreeTypes(recipient.id, null);

    expect(await repo.setRead(simpleId, stranger.id, 1)).toBe(0); // wrong recipient — no-op
    expect(await repo.setRead(simpleId, recipient.id, 1)).toBe(1);
    expect(
      (testDb.prepare('SELECT is_read FROM notifications WHERE id = ?').get(simpleId) as { is_read: number }).is_read,
    ).toBe(1);

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
    const { booleanId } = seedThreeTypes(recipient.id, null);

    expect(await repo.claimResponse(booleanId, recipient.id, 'positive')).toBe(1);
    // A second claim on the same, now-claimed notification affects 0 rows —
    // the `response IS NULL` guard is the load-bearing part of this statement.
    expect(await repo.claimResponse(booleanId, recipient.id, 'negative')).toBe(0);
    expect(
      (testDb.prepare('SELECT response FROM notifications WHERE id = ?').get(booleanId) as { response: string })
        .response,
    ).toBe('positive');
  });

  it('NOTREPO-013 — releaseResponse (NT21) restores the claim so a retry can succeed', async () => {
    const { user: recipient } = createUser(testDb);
    const { booleanId } = seedThreeTypes(recipient.id, null);

    await repo.claimResponse(booleanId, recipient.id, 'positive');
    await repo.releaseResponse(booleanId, recipient.id, 0);
    const row = testDb.prepare('SELECT response, is_read FROM notifications WHERE id = ?').get(booleanId) as {
      response: string | null;
      is_read: number;
    };
    expect(row.response).toBeNull();
    expect(row.is_read).toBe(0);
    expect(await repo.claimResponse(booleanId, recipient.id, 'negative')).toBe(1);
  });
});
