/**
 * TripMembersRepository.rosterUserIds (Plan 3c Task 0b): the legacy
 * `DatabaseService.rosterUserIds` statement in intent — `SELECT user_id FROM
 * trip_members WHERE trip_id = ? UNION SELECT user_id FROM trips WHERE id =
 * ?` — as two reads merged through a `Set`. Real rows, on the real test DB,
 * through the same `TestOrm` harness `Trips.repository.test.ts` uses.
 */
import { TripMembers } from '../../../../src/db/entities/TripMembers.entity';
import type { TripMembersRepository } from '../../../../src/db/repositories/TripMembers.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { addTripMember, createTrip, createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let tripMembers: TripMembersRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  tripMembers = t.repo(TripMembers);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const legacyRoster = (tripId: number): Set<number> => {
  const rows = testDb
    .prepare('SELECT user_id FROM trip_members WHERE trip_id = ? UNION SELECT user_id FROM trips WHERE id = ?')
    .all(tripId, tripId) as { user_id: number }[];
  return new Set(rows.map((r) => r.user_id));
};

describe('TripMembersRepository.rosterUserIds — parity with the legacy UNION statement', () => {
  it('TMEMREPO-001: an owner-only trip (no members row) still yields the owner', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    expect(await tripMembers.rosterUserIds(trip.id)).toEqual(new Set([owner.id]));
    expect(await tripMembers.rosterUserIds(trip.id)).toEqual(legacyRoster(trip.id));
  });

  it('TMEMREPO-002: owner + members are deduped into one set, in either read order', async () => {
    const { user: owner } = createUser(testDb);
    const { user: memberA } = createUser(testDb);
    const { user: memberB } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, memberA.id);
    addTripMember(testDb, trip.id, memberB.id);

    const roster = await tripMembers.rosterUserIds(trip.id);
    expect(roster).toEqual(new Set([owner.id, memberA.id, memberB.id]));
    expect(roster).toEqual(legacyRoster(trip.id));
  });

  it('TMEMREPO-003: a member row for the owner (edge case) still dedupes to one id, not a Set of size 2', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, owner.id);
    const roster = await tripMembers.rosterUserIds(trip.id);
    expect(roster).toEqual(new Set([owner.id]));
    expect(roster.size).toBe(1);
  });

  it("TMEMREPO-004: a trip belonging to someone else never leaks its roster into another trip's read", async () => {
    const { user: ownerA } = createUser(testDb);
    const { user: ownerB } = createUser(testDb);
    const { user: memberOfA } = createUser(testDb);
    const tripA = createTrip(testDb, ownerA.id);
    const tripB = createTrip(testDb, ownerB.id);
    addTripMember(testDb, tripA.id, memberOfA.id);

    expect(await tripMembers.rosterUserIds(tripB.id)).toEqual(new Set([ownerB.id]));
  });

  it('TMEMREPO-005: a missing trip id yields an empty set, not a throw', async () => {
    const missingId = 999999;
    expect(await tripMembers.rosterUserIds(missingId)).toEqual(new Set());
    expect(legacyRoster(missingId)).toEqual(new Set());
  });

  it('TMEMREPO-006: a non-numeric-looking id finds nothing, the same raw-bind seam TripsRepository documents', async () => {
    expect(await tripMembers.rosterUserIds('abc')).toEqual(new Set());
  });
});

// Plan 3c Task 1 (TB2/TB5/TB6): TripMembershipService.listMemberUserIds/
// joinTripAsMember's own check-then-act sequence.
describe('TripMembersRepository — listUserIdsByTrip / exists / addMember (Plan 3c Task 1)', () => {
  it('TMEMREPO-007: listUserIdsByTrip excludes the owner and orders by added_at ASC', async () => {
    const { user: owner } = createUser(testDb);
    const { user: first } = createUser(testDb);
    const { user: second } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, first.id);
    testDb
      .prepare('UPDATE trip_members SET added_at = ? WHERE trip_id = ? AND user_id = ?')
      .run('2026-01-01 00:00:00', trip.id, first.id);
    addTripMember(testDb, trip.id, second.id);
    testDb
      .prepare('UPDATE trip_members SET added_at = ? WHERE trip_id = ? AND user_id = ?')
      .run('2026-02-01 00:00:00', trip.id, second.id);

    expect(await tripMembers.listUserIdsByTrip(trip.id)).toEqual([first.id, second.id]);
  });

  it('TMEMREPO-008: listUserIdsByTrip returns an empty array for an owner-only trip', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    expect(await tripMembers.listUserIdsByTrip(trip.id)).toEqual([]);
  });

  it('TMEMREPO-009: exists is true only for an actual (trip, user) membership row', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    expect(await tripMembers.exists(trip.id, member.id)).toBe(true);
    expect(await tripMembers.exists(trip.id, stranger.id)).toBe(false);
    // The owner has no trip_members row unless one was explicitly added.
    expect(await tripMembers.exists(trip.id, owner.id)).toBe(false);
  });

  it('TMEMREPO-010: addMember inserts a row with the given invited_by, nullable', async () => {
    const { user: owner } = createUser(testDb);
    const { user: inviter } = createUser(testDb);
    const { user: joiner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    await tripMembers.addMember(trip.id, joiner.id, inviter.id);
    const row = testDb
      .prepare('SELECT trip_id, user_id, invited_by FROM trip_members WHERE trip_id = ? AND user_id = ?')
      .get(trip.id, joiner.id);
    expect(row).toEqual({ trip_id: trip.id, user_id: joiner.id, invited_by: inviter.id });

    const { user: joiner2 } = createUser(testDb);
    await tripMembers.addMember(trip.id, joiner2.id, null);
    const row2 = testDb
      .prepare('SELECT invited_by FROM trip_members WHERE trip_id = ? AND user_id = ?')
      .get(trip.id, joiner2.id);
    expect(row2).toEqual({ invited_by: null });
  });
});

// ---------------------------------------------------------------------------
// Plan 3c Task 6 — TripMembersService (TM2/TM8/TM14/TM15/TM18). Appended
// after Task 1's own suite above, per this task's file-ownership rule.
// ---------------------------------------------------------------------------

/** TM2's statement, run raw on the same rows — the parity oracle every assertion below is checked against. */
function legacyListWithUserAndInviter(tripId: number, ownerId: number): unknown {
  return testDb
    .prepare(
      `
    SELECT u.id, COALESCE(u.display_name, u.username) AS username, u.email, u.avatar, u.is_guest,
      CASE WHEN u.id = ? THEN 'owner' ELSE 'member' END as role,
      m.added_at,
      COALESCE(ib.display_name, ib.username) as invited_by_username
    FROM trip_members m
    JOIN users u ON u.id = m.user_id
    LEFT JOIN users ib ON ib.id = m.invited_by
    WHERE m.trip_id = ?
    ORDER BY m.added_at ASC
  `,
    )
    .all(ownerId, tripId);
}

describe('TripMembersRepository.listWithUserAndInviter (TM2, Plan 3c Task 6)', () => {
  it('TMEMREPO-011: parity with the legacy statement on a fully seeded roster — a member with display_name, one without, a guest, an inviter with/without display_name, NULL avatars', async () => {
    const { user: owner } = createUser(testDb, { username: 'owner-handle' });
    const trip = createTrip(testDb, owner.id);

    const { user: inviterWithName } = createUser(testDb, { username: 'inviter-1' });
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('Inviter One', inviterWithName.id);
    const { user: inviterBare } = createUser(testDb, { username: 'inviter-2' });

    const { user: memberWithDisplayName } = createUser(testDb, { username: 'member-1-handle' });
    testDb
      .prepare('UPDATE users SET display_name = ?, avatar = ? WHERE id = ?')
      .run('Member One', 'm1.png', memberWithDisplayName.id);
    testDb
      .prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)')
      .run(trip.id, memberWithDisplayName.id, inviterWithName.id);

    const { user: memberBare } = createUser(testDb, { username: 'member-2-handle' });
    testDb
      .prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)')
      .run(trip.id, memberBare.id, inviterBare.id);

    const { user: memberNoInviter } = createUser(testDb, { username: 'member-3-handle' });
    testDb
      .prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, NULL)')
      .run(trip.id, memberNoInviter.id);

    const { user: guest } = createUser(testDb, { username: 'guest-handle' });
    testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guest.id);
    testDb
      .prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)')
      .run(trip.id, guest.id, owner.id);

    testDb
      .prepare('UPDATE trip_members SET added_at = ? WHERE trip_id = ? AND user_id = ?')
      .run('2026-01-01 00:00:00', trip.id, memberWithDisplayName.id);
    testDb
      .prepare('UPDATE trip_members SET added_at = ? WHERE trip_id = ? AND user_id = ?')
      .run('2026-01-02 00:00:00', trip.id, memberBare.id);
    testDb
      .prepare('UPDATE trip_members SET added_at = ? WHERE trip_id = ? AND user_id = ?')
      .run('2026-01-03 00:00:00', trip.id, memberNoInviter.id);
    testDb
      .prepare('UPDATE trip_members SET added_at = ? WHERE trip_id = ? AND user_id = ?')
      .run('2026-01-04 00:00:00', trip.id, guest.id);

    const rows = await tripMembers.listWithUserAndInviter(trip.id, owner.id);
    expect(rows).toEqual(legacyListWithUserAndInviter(trip.id, owner.id));
    expect(rows).toEqual([
      {
        id: memberWithDisplayName.id,
        username: 'Member One',
        email: memberWithDisplayName.email,
        avatar: 'm1.png',
        is_guest: 0,
        role: 'member',
        added_at: '2026-01-01 00:00:00',
        invited_by_username: 'Inviter One',
      },
      {
        id: memberBare.id,
        username: 'member-2-handle',
        email: memberBare.email,
        avatar: null,
        is_guest: 0,
        role: 'member',
        added_at: '2026-01-02 00:00:00',
        invited_by_username: 'inviter-2',
      },
      {
        id: memberNoInviter.id,
        username: 'member-3-handle',
        email: memberNoInviter.email,
        avatar: null,
        is_guest: 0,
        role: 'member',
        added_at: '2026-01-03 00:00:00',
        invited_by_username: null,
      },
      {
        id: guest.id,
        username: 'guest-handle',
        email: guest.email,
        avatar: null,
        is_guest: 1,
        role: 'member',
        added_at: '2026-01-04 00:00:00',
        invited_by_username: 'owner-handle',
      },
    ]);
  });

  it('TMEMREPO-012: the trip owner\'s own row (if ever a member) reports role "owner"', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    testDb
      .prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, NULL)')
      .run(trip.id, owner.id);
    const rows = await tripMembers.listWithUserAndInviter(trip.id, owner.id);
    expect(rows).toEqual([expect.objectContaining({ id: owner.id, role: 'owner' })]);
  });

  it('TMEMREPO-013: an owner-only trip (no members row) returns an empty array', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    expect(await tripMembers.listWithUserAndInviter(trip.id, owner.id)).toEqual([]);
  });

  // Task 9 fix wave (B-M3): relabelled. `listWithUserAndInviter` is a
  // `qb().execute('all', false)` projection, and `TrekRepository` applies
  // `disableIdentityMap: true` to every read by default anyway, so there is
  // no live identity-map entry here to bypass — this proves a DB round-trip
  // (a member added after an unrelated wider read is visible), not an
  // identity-map bypass.
  it('TMEMREPO-014 (fresh after a raw UPDATE, not D-shape): a member added after an unrelated identity-map read is visible in the FIRST wider projection', async () => {
    const { user: owner } = createUser(testDb);
    const { user: fresh } = createUser(testDb, { username: 'fresh-member' });
    const trip = createTrip(testDb, owner.id);
    await t.repo(TripMembers).find({}, { disableIdentityMap: false }); // populate the identity map with an unrelated read
    addTripMember(testDb, trip.id, fresh.id);
    const rows = await tripMembers.listWithUserAndInviter(trip.id, owner.id);
    expect(rows).toEqual([expect.objectContaining({ id: fresh.id, username: 'fresh-member' })]);
  });
});

describe('TripMembersRepository.isGuestOfTrip (TM18, security-sensitive, Plan 3c Task 6)', () => {
  it('TMEMREPO-015: true only for a guest who is actually a member of THIS trip', async () => {
    const { user: owner } = createUser(testDb);
    const { user: guest } = createUser(testDb, { username: 'guest-scoped' });
    testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guest.id);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, guest.id);

    expect(await tripMembers.isGuestOfTrip(trip.id, guest.id)).toBe(true);
  });

  it('TMEMREPO-016: false for a real member (not a guest)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    expect(await tripMembers.isGuestOfTrip(trip.id, member.id)).toBe(false);
  });

  it('TMEMREPO-017: false for a guest of a DIFFERENT trip — the scoping guard that keeps guest mutations trip-local', async () => {
    const { user: ownerA } = createUser(testDb);
    const { user: ownerB } = createUser(testDb);
    const { user: guest } = createUser(testDb, { username: 'guest-of-a' });
    testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guest.id);
    const tripA = createTrip(testDb, ownerA.id);
    const tripB = createTrip(testDb, ownerB.id);
    addTripMember(testDb, tripA.id, guest.id);

    expect(await tripMembers.isGuestOfTrip(tripA.id, guest.id)).toBe(true);
    expect(await tripMembers.isGuestOfTrip(tripB.id, guest.id)).toBe(false);
  });

  it('TMEMREPO-018: false for a nonexistent user id', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    expect(await tripMembers.isGuestOfTrip(trip.id, 999999)).toBe(false);
  });
});

describe('TripMembersRepository.addIgnoringConflict / remove (TM8/TM14/TM15, security-sensitive, Plan 3c Task 6)', () => {
  it('TMEMREPO-019: addIgnoringConflict inserts a fresh row', async () => {
    const { user: owner } = createUser(testDb);
    const { user: former } = createUser(testDb);
    const { user: newOwner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await tripMembers.addIgnoringConflict(trip.id, former.id, newOwner.id);
    const row = testDb
      .prepare('SELECT trip_id, user_id, invited_by FROM trip_members WHERE trip_id = ? AND user_id = ?')
      .get(trip.id, former.id);
    expect(row).toEqual({ trip_id: trip.id, user_id: former.id, invited_by: newOwner.id });
  });

  it('TMEMREPO-020: addIgnoringConflict is a true no-op (not a throw) when the (trip, user) row already exists', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    // The existing row's invited_by (NULL, from addTripMember) must survive —
    // an upsert-merge would overwrite it, which is NOT what `INSERT OR IGNORE` does.
    await expect(tripMembers.addIgnoringConflict(trip.id, member.id, owner.id)).resolves.toBeUndefined();
    const row = testDb
      .prepare('SELECT invited_by FROM trip_members WHERE trip_id = ? AND user_id = ?')
      .get(trip.id, member.id);
    expect(row).toEqual({ invited_by: null });
    expect(
      (
        testDb
          .prepare('SELECT COUNT(*) AS n FROM trip_members WHERE trip_id = ? AND user_id = ?')
          .get(trip.id, member.id) as { n: number }
      ).n,
    ).toBe(1);
  });

  it('TMEMREPO-021: remove deletes exactly the (trip, user) row, leaving other members untouched', async () => {
    const { user: owner } = createUser(testDb);
    const { user: memberA } = createUser(testDb);
    const { user: memberB } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, memberA.id);
    addTripMember(testDb, trip.id, memberB.id);

    await tripMembers.remove(trip.id, memberA.id);
    expect(
      testDb.prepare('SELECT id FROM trip_members WHERE trip_id = ? AND user_id = ?').get(trip.id, memberA.id),
    ).toBeUndefined();
    expect(
      testDb.prepare('SELECT id FROM trip_members WHERE trip_id = ? AND user_id = ?').get(trip.id, memberB.id),
    ).toBeDefined();
  });

  it('TMEMREPO-022: remove on a missing row is a silent no-op', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await expect(tripMembers.remove(trip.id, 999999)).resolves.toBeUndefined();
  });

  // TMEMREPO-023 used to pin remove's `number | string` raw-bind seam on
  // `trip_id` (`remove(String(trip.id), ...)`) — retired by Plan 4 Task 8a's
  // narrowing to `trip_id: number` (its own docstring covers why: its last
  // raw-string caller, TripMembersController.removeMember, now parses its
  // route param once itself). `String(trip.id)` no longer typechecks
  // against `remove`'s signature, so there is nothing left to pin here.
  // `user_id` keeps its own raw bind (TMEMREPO-024 below), a different,
  // still-live seam — see remove's own docstring.
});

// Rule 15's exact trap, caught on a compiled boot (`DELETE /api/trips/:id/
// members/abc` 500'd with `no such column: NaN` before this guard existed):
// `TripMembersController.removeMember`/`renameGuest`/`deleteGuest` still do a
// bare `Number.parseInt(userId)` on the route's `:userId`, unvalidated — a
// non-numeric id parses to `NaN`, which MikroORM/Kysely inline as the
// literal SQL token `NaN` even through a raw `?` placeholder.
describe('NaN user_id — rule 15 (a non-numeric route id parses to NaN, must not 500)', () => {
  it('TMEMREPO-024: remove(tripId, NaN) is a silent no-op, matching the legacy better-sqlite3 bind', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    await expect(tripMembers.remove(trip.id, NaN)).resolves.toBeUndefined();
    // The real member row survives — NaN must not accidentally match anything.
    expect(
      testDb.prepare('SELECT id FROM trip_members WHERE trip_id = ? AND user_id = ?').get(trip.id, member.id),
    ).toBeDefined();
  });

  it('TMEMREPO-025: isGuestOfTrip(tripId, NaN) resolves false, matching the legacy 404 Guest not found', async () => {
    const { user: owner } = createUser(testDb);
    const { user: guest } = createUser(testDb);
    testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guest.id);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, guest.id);
    await expect(tripMembers.isGuestOfTrip(trip.id, NaN)).resolves.toBe(false);
  });
});

// ── Plan 3c Task 7 (trips.rpc.ts::members, RP3) — additive ──────────────────

describe('TripMembersRepository.listRawUsernameAndDisplayName (RP3)', () => {
  it("TMEMREPO-026: byte-identical to the legacy statement — raw username AND display_name, NOT TM2's COALESCE", async () => {
    const { user: owner } = createUser(testDb);
    const { user: named } = createUser(testDb, { username: 'bare-name' });
    testDb.prepare('UPDATE users SET display_name = ?, avatar = ? WHERE id = ?').run('Displayed', 'a.png', named.id);
    const { user: bare } = createUser(testDb, { username: 'no-display' });
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, named.id);
    addTripMember(testDb, trip.id, bare.id);

    const legacy = testDb
      .prepare(
        'SELECT u.id, u.username, u.display_name, u.avatar FROM trip_members tm JOIN users u ON u.id = tm.user_id WHERE tm.trip_id = ?',
      )
      .all(trip.id);
    const rows = await tripMembers.listRawUsernameAndDisplayName(trip.id);
    expect(rows).toEqual(legacy);
    const byId = new Map(rows.map((r) => [r.id, r]));
    // Raw username, not COALESCEd with display_name — TM2's shape is different on purpose (§18.10).
    expect(byId.get(named.id)).toEqual({
      id: named.id,
      username: 'bare-name',
      display_name: 'Displayed',
      avatar: 'a.png',
    });
    expect(byId.get(bare.id)).toEqual({ id: bare.id, username: 'no-display', display_name: null, avatar: null });
  });

  it('TMEMREPO-027: an owner-only trip (no trip_members rows) returns an empty array', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    expect(await tripMembers.listRawUsernameAndDisplayName(trip.id)).toEqual([]);
  });

  it('TMEMREPO-028: raw-bind — a string trip id binds unconverted, same as a real number', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    expect((await tripMembers.listRawUsernameAndDisplayName(String(trip.id))).map((r) => r.id)).toEqual([member.id]);
  });
});

describe('TripMembersRepository.clearInvitedBy (Plan 4 Task 1, UC4)', () => {
  it('TMEMREPO-029: nulls invited_by on every row the departing user invited, across trips, leaving other rows untouched', async () => {
    const { user: owner } = createUser(testDb);
    const { user: departing } = createUser(testDb, { username: 'departing' });
    const { user: other } = createUser(testDb, { username: 'other' });
    const tripA = createTrip(testDb, owner.id);
    const tripB = createTrip(testDb, owner.id);
    testDb
      .prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)')
      .run(tripA.id, other.id, departing.id);
    testDb
      .prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)')
      .run(tripB.id, owner.id, departing.id);
    // Control row: invited by someone else entirely — must survive untouched.
    const { user: controlMember } = createUser(testDb, { username: 'control-member' });
    testDb
      .prepare('INSERT INTO trip_members (trip_id, user_id, invited_by) VALUES (?, ?, ?)')
      .run(tripA.id, controlMember.id, owner.id);

    await tripMembers.clearInvitedBy(departing.id);

    const rows = testDb
      .prepare('SELECT trip_id, user_id, invited_by FROM trip_members ORDER BY trip_id, user_id')
      .all();
    expect(rows).toEqual([
      { trip_id: tripA.id, user_id: other.id, invited_by: null },
      { trip_id: tripA.id, user_id: controlMember.id, invited_by: owner.id },
      { trip_id: tripB.id, user_id: owner.id, invited_by: null },
    ]);
  });

  it('TMEMREPO-030: a user who never invited anyone is a no-op', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    await expect(tripMembers.clearInvitedBy(999999)).resolves.toBeUndefined();
    expect(
      (
        testDb
          .prepare('SELECT invited_by FROM trip_members WHERE trip_id = ? AND user_id = ?')
          .get(trip.id, member.id) as { invited_by: number | null }
      ).invited_by,
    ).toBeNull();
  });
});
