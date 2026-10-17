import { Trips } from '../../../../src/db/entities/Trips.entity';
import { Users } from '../../../../src/db/entities/Users.entity';
import type { TripsRepository } from '../../../../src/db/repositories/Trips.repository';
import { withRequestContext } from '../../../../src/nest/database/request-context';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { addTripMember, createDay, createPlace, createTrip, createUser } from '../../../helpers/factories';
import { findRow, updateRows } from '../../../helpers/factories/rows';
import { CAN_ACCESS_TRIP_SQL, resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import type { EntityData } from '@mikro-orm/core';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let trips: TripsRepository;
let uow: UnitOfWork;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  trips = t.repo(Trips);
  uow = new UnitOfWork(t.em);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function setTrip(id: number, data: EntityData<Trips>): Promise<void> {
  await updateRows(t.orm, Trips, { id }, data);
}

/** The stored trip; fails the case when it is gone. */
async function tripRow(id: number) {
  const row = await findRow(t.orm, Trips, { id });
  if (!row) throw new Error(`no trip ${id}`);
  return row;
}

// test-sql-allow: the legacy statement is the oracle the repository read is held to.
const legacy = (tripId: number, userId: number) => testDb.prepare(CAN_ACCESS_TRIP_SQL).get(userId, tripId, userId);

describe('TripsRepository.findAccessible — parity with canAccessTrip', () => {
  it('TRIPREPO-001: the owner sees the trip, with the same three columns', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await trips.findAccessible(trip.id, user.id)).toEqual(legacy(trip.id, user.id));
    expect(await trips.findAccessible(trip.id, user.id)).toEqual({ id: trip.id, user_id: user.id, currency: 'EUR' });
  });

  it('TRIPREPO-002: a member sees it, a stranger does not', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    expect(await trips.findAccessible(trip.id, member.id)).toEqual(legacy(trip.id, member.id));
    expect(await trips.findAccessible(trip.id, stranger.id)).toBeUndefined();
    expect(legacy(trip.id, stranger.id)).toBeUndefined();
  });

  it('TRIPREPO-003: a member of another trip is still a stranger here', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const a = createTrip(testDb, owner.id);
    const b = createTrip(testDb, owner.id);
    addTripMember(testDb, a.id, member.id);
    expect(await trips.findAccessible(b.id, member.id)).toBeUndefined();
  });

  it('TRIPREPO-004: a null currency comes back null, not undefined', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await setTrip(trip.id, { currency: null });
    expect(await trips.findAccessible(trip.id, user.id)).toEqual({ id: trip.id, user_id: user.id, currency: null });
  });

  it('TRIPREPO-005: isOwner is true for the owner only', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    expect(await trips.isOwner(trip.id, owner.id)).toBe(true);
    expect(await trips.isOwner(trip.id, member.id)).toBe(false);

    // 0b security review F-B6: full parity against the legacy statement run
    // raw on the same rows, not just the boolean the method returns.
    const legacyIsOwner = (tripId: number, userId: number): boolean =>
      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      !!testDb.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId);
    expect(await trips.isOwner(trip.id, owner.id)).toEqual(legacyIsOwner(trip.id, owner.id));
    expect(await trips.isOwner(trip.id, member.id)).toEqual(legacyIsOwner(trip.id, member.id));
  });

  it('TRIPREPO-007: a missing trip id resolves to undefined, not a throw, for both findAccessible and isOwner', async () => {
    const { user } = createUser(testDb);
    const missingId = 999999;
    expect(await trips.findAccessible(missingId, user.id)).toBeUndefined();
    expect(legacy(missingId, user.id)).toBeUndefined();
    expect(await trips.isOwner(missingId, user.id)).toBe(false);
  });

  it('TRIPREPO-006: toObject on a trip omits the hidden relation and every unloaded collection', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const entity = await t.repo(Trips).findOneOrFail({ id: trip.id });
    // test-sql-allow: the whole row as SELECT * returns it is what toObject has to reproduce, column for column.
    const raw = testDb.prepare('SELECT * FROM trips WHERE id = ?').get(trip.id) as Record<string, unknown>;
    const { wrap } = await import('@mikro-orm/core');
    expect(wrap(entity).toObject()).toStrictEqual(raw);
  });
});

// Plan 3c Task 1 (TB1/TB3/TB4): the trip-membership primitives, added onto
// the same repository so `TripMembershipService` never touches raw SQL.
describe('TripsRepository — getOwnerId / findIdAndOwner / listAccessibleIds (Plan 3c Task 1)', () => {
  it('TRIPREPO-008: getOwnerId returns the owner id, null for a missing trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await trips.getOwnerId(trip.id)).toBe(user.id);
    expect(await trips.getOwnerId(999999)).toBeNull();
  });

  it('TRIPREPO-009: getOwnerId binds a string id raw, matching the `0x10`/`007`-shaped id parity seam', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // A numeric-looking string binds fine under SQLite's affinity comparison.
    expect(await trips.getOwnerId(String(trip.id))).toBe(user.id);
    // A non-numeric string never matches any row — no throw, no coercion.
    expect(await trips.getOwnerId('not-a-number')).toBeNull();
  });

  it('TRIPREPO-010: findIdAndOwner returns {id, user_id} for a real trip, undefined for a missing one', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await trips.findIdAndOwner(trip.id)).toEqual({ id: trip.id, user_id: user.id });
    expect(await trips.findIdAndOwner(999999)).toBeUndefined();
  });

  it("TRIPREPO-011: listAccessibleIds returns owned + member trips, newest first, excluding a stranger's trips", async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const a = createTrip(testDb, owner.id);
    await setTrip(a.id, { created_at: '2026-01-01 00:00:00' });
    const b = createTrip(testDb, owner.id);
    await setTrip(b.id, { created_at: '2026-02-01 00:00:00' });
    const c = createTrip(testDb, stranger.id);
    addTripMember(testDb, c.id, member.id);

    expect(await trips.listAccessibleIds(owner.id)).toEqual([b.id, a.id]);
    expect(await trips.listAccessibleIds(member.id)).toEqual([c.id]);
    expect(await trips.listAccessibleIds(stranger.id)).toEqual([c.id]);
  });

  it('TRIPREPO-012: listAccessibleIds never double-counts a trip where the caller is both owner and, somehow, member-listed', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, owner.id);
    expect(await trips.listAccessibleIds(owner.id)).toEqual([trip.id]);
  });
});

// Plan 3c Task 2 (DY35): `days.service.ts::insert`'s dated path extends the
// trip by one day. Owned exclusively by Task 2 per the plan's file
// ownership (`Trips.repository.ts` ONLY for `setEndDate`) — appended here
// rather than interleaved with Task 1's blocks above.
describe('TripsRepository.setEndDate (Plan 3c Task 2, DY35)', () => {
  it('TRIPREPO-013: writes end_date verbatim, including clearing it to null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await trips.setEndDate(trip.id, '2026-09-30');
    expect((await tripRow(trip.id)).end_date).toBe('2026-09-30');
    await trips.setEndDate(trip.id, null);
    expect((await tripRow(trip.id)).end_date).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Plan 3c Task 6 — TripMembersService (TM7/TM9/TM13) and TripReadModelService
// (TR-A/TR-B). Appended per this task's file-ownership rule (additive
// methods only, this repository is shared across tasks).
// ---------------------------------------------------------------------------

describe('TripsRepository — TripMembersService / TripReadModelService (Plan 3c Task 6)', () => {
  it('TRIPREPO-014: getTitle (TM7) reads the title, null for a missing trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Readable' });
    expect(await trips.getTitle(trip.id)).toBe('Readable');
    expect(await trips.getTitle(999999)).toBeNull();
  });

  it('TRIPREPO-015: getTitle binds a string id raw, the same `0x10`/`007`-shaped id parity seam TripsRepository documents', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Stringy' });
    expect(await trips.getTitle(String(trip.id))).toBe('Stringy');
    expect(await trips.getTitle('not-a-number')).toBeNull();
  });

  it('TRIPREPO-016: findIdTitleOwner (TM9) returns {id, title, user_id}, undefined for a missing trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Handover' });
    expect(await trips.findIdTitleOwner(trip.id)).toEqual({ id: trip.id, title: 'Handover', user_id: user.id });
    expect(await trips.findIdTitleOwner(999999)).toBeUndefined();
  });

  it('TRIPREPO-017: setOwner (TM13, security-sensitive) writes user_id verbatim', async () => {
    const { user: owner } = createUser(testDb);
    const { user: newOwner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await trips.setOwner(trip.id, newOwner.id);
    expect((await tripRow(trip.id)).user_id).toBe(newOwner.id);
  });

  // TRIPREPO-018 used to pin setOwner's `number | string` raw-bind seam
  // (`setOwner(String(trip.id), ...)`) — retired by Plan 4 Task 8a's
  // narrowing to `trip_id: number` (its own docstring covers why: its one
  // production caller already passes a real `trip.id` number, never the
  // route's raw string). `String(trip.id)` no longer typechecks against
  // `setOwner`'s signature, so there is nothing left to pin here.

  describe('findRaw (TR-B, shared with TripsService.getRaw once Task 7 lands)', () => {
    it("TRIPREPO-019: every scalar column comes back, feed_token included (the JS strip is the caller's job)", async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id, {
        title: 'Full Row',
        description: 'desc',
        start_date: '2026-01-01',
        end_date: '2026-01-05',
      });
      await setTrip(trip.id, { feed_token: 'secret-token', cover_image: 'cover.png' });
      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      const legacyRow = testDb.prepare('SELECT * FROM trips WHERE id = ?').get(trip.id);
      const row = await trips.findRaw(trip.id);
      expect(row).toEqual(legacyRow);
      expect(row?.feed_token).toBe('secret-token');
    });

    it('TRIPREPO-020: NULL-bearing nullable columns come back null, not undefined (rule 16); a missing trip is null', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const row = await trips.findRaw(trip.id);
      expect(row).toMatchObject({
        description: null,
        start_date: null,
        end_date: null,
        cover_image: null,
        feed_token: null,
      });
      expect(await trips.findRaw(999999)).toBeNull();
    });

    it('TRIPREPO-021: binds a string trip id raw, the same seam every other method here preserves', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id, { title: 'Stringy Raw' });
      expect((await trips.findRaw(String(trip.id)))?.title).toBe('Stringy Raw');
      expect(await trips.findRaw('not-a-number')).toBeNull();
    });

    // Task 9 fix wave (B-M3): relabelled. `findRaw` is a `qb().execute('get',
    // false)` projection with an explicit `t.*` select, which never
    // hydrates an entity into the identity map by construction, and the
    // base default leaves the identity map disabled for every read anyway —
    // there is no live identity-map entry here to bypass. This proves a DB
    // round-trip, not an identity-map bypass.
    it('TRIPREPO-022 (fresh after a raw UPDATE, not D-shape): a title written after an unrelated identity-map read is visible in the FIRST wider projection', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id, { title: 'Before' });
      await t.repo(Trips).find({}, { disableIdentityMap: false }); // populate the identity map with an unrelated read
      // test-sql-allow: the write has to land behind the ORM's back, which is what the fresh read is tested against.
      testDb.prepare('UPDATE trips SET title = ? WHERE id = ?').run('After', trip.id);
      expect((await trips.findRaw(trip.id))?.title).toBe('After');
    });
  });
});

// ── Plan 3c Task 7 — TRIP_SELECT's ONE builder, generateDays helpers, CRUD ───
//
// `TRIP_SELECT` (trips.service.ts): the shared projection every one of
// `findForViewer`/`listForUser`/`activeTrip` builds on (`tripSelectQuery`).
// Byte-diffed here against the legacy statement run raw, on a FULLY seeded
// trip (days, places, a second member, an owner) with every nullable column
// both null and set (rule 19).
const LEGACY_TRIP_SELECT = `
  SELECT t.*,
    NULL AS feed_token,
    (SELECT COUNT(*) FROM days d WHERE d.trip_id = t.id) as day_count,
    (SELECT COUNT(*) FROM places p WHERE p.trip_id = t.id) as place_count,
    CASE WHEN t.user_id = :userId THEN 1 ELSE 0 END as is_owner,
    u.username as owner_username,
    (SELECT COUNT(*) FROM trip_members tm WHERE tm.trip_id = t.id) as shared_count
  FROM trips t
  JOIN users u ON u.id = t.user_id
`;

describe('TripsRepository.findForViewer / listForUser / activeTrip (Plan 3c Task 7, TRIP_SELECT)', () => {
  describe('findForViewer (TP20, also serves TP19/TP29 and TripMembersService.getTripForViewer)', () => {
    it('TRIPREPO-023: byte-identical to the legacy TRIP_SELECT statement on a FULLY seeded trip (days, places, a member, feed_token set in the DB)', async () => {
      const { user: owner } = createUser(testDb, { username: 'owner-handle' });
      const { user: member } = createUser(testDb);
      const trip = createTrip(testDb, owner.id, {
        title: 'Full Row',
        description: 'A real description',
        start_date: '2026-03-01',
        end_date: '2026-03-05',
      });
      await setTrip(trip.id, { feed_token: 'super-secret', cover_image: 'cover.png' });
      addTripMember(testDb, trip.id, member.id);
      createDay(testDb, trip.id, { date: '2026-03-01' });
      createDay(testDb, trip.id, { date: '2026-03-02' });
      createPlace(testDb, trip.id);
      createPlace(testDb, trip.id);
      createPlace(testDb, trip.id);

      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      const legacyOwner = testDb
        .prepare(
          `
        ${LEGACY_TRIP_SELECT}
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = :userId
        WHERE t.id = :tripId AND (t.user_id = :userId OR m.user_id IS NOT NULL)
      `,
        )
        .get({ userId: owner.id, tripId: trip.id });
      const row = await trips.findForViewer(trip.id, owner.id);
      expect(row).toEqual(legacyOwner);
      // createTrip's own start_date/end_date span already generates 5 days;
      // the two explicit createDay calls above add 2 more, for 7 total.
      expect(row).toMatchObject({
        day_count: 7,
        place_count: 3,
        shared_count: 1,
        is_owner: 1,
        owner_username: 'owner-handle',
        feed_token: null,
      });
      // The real column is set in the DB — the wire value is blanked by the
      // SQL-side `NULL AS feed_token` trick, not merely absent from a
      // hand-picked column list (§18.5).
      expect((await tripRow(trip.id)).feed_token).toBe('super-secret');

      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      const legacyMember = testDb
        .prepare(
          `
        ${LEGACY_TRIP_SELECT}
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = :userId
        WHERE t.id = :tripId AND (t.user_id = :userId OR m.user_id IS NOT NULL)
      `,
        )
        .get({ userId: member.id, tripId: trip.id });
      const memberRow = await trips.findForViewer(trip.id, member.id);
      expect(memberRow).toEqual(legacyMember);
      expect(memberRow).toMatchObject({ is_owner: 0, day_count: 7, place_count: 3, shared_count: 1 });
    });

    it('TRIPREPO-024: NULL-seeded nullable columns come back null on the wire; a stranger and a nonexistent trip both get undefined', async () => {
      const { user: owner } = createUser(testDb);
      const { user: stranger } = createUser(testDb);
      const trip = createTrip(testDb, owner.id); // description/start_date/end_date/cover_image all NULL by default

      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      const legacy = testDb
        .prepare(
          `
        ${LEGACY_TRIP_SELECT}
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = :userId
        WHERE t.id = :tripId AND (t.user_id = :userId OR m.user_id IS NOT NULL)
      `,
        )
        .get({ userId: owner.id, tripId: trip.id });
      const row = await trips.findForViewer(trip.id, owner.id);
      expect(row).toEqual(legacy);
      expect(row).toMatchObject({
        description: null,
        start_date: null,
        end_date: null,
        cover_image: null,
        feed_token: null,
      });

      expect(await trips.findForViewer(trip.id, stranger.id)).toBeUndefined();
      expect(await trips.findForViewer(999999, owner.id)).toBeUndefined();
    });

    it('TRIPREPO-025: binds a string trip id raw, the seam every other method here preserves', async () => {
      const { user: owner } = createUser(testDb);
      const trip = createTrip(testDb, owner.id, { title: 'Stringy' });
      expect((await trips.findForViewer(String(trip.id), owner.id))?.title).toBe('Stringy');
    });

    // Rule 21: `findForViewer` is a Kysely read, which never consults the
    // identity map — the "fresh after a raw UPDATE" shape applies instead of
    // a D-shape identity-map test.
    it('TRIPREPO-026 (fresh after a raw UPDATE): a title changed outside the ORM is visible on the next read', async () => {
      const { user: owner } = createUser(testDb);
      const trip = createTrip(testDb, owner.id, { title: 'Stale' });
      expect((await trips.findForViewer(trip.id, owner.id))?.title).toBe('Stale');
      await setTrip(trip.id, { title: 'Fresh' });
      expect((await trips.findForViewer(trip.id, owner.id))?.title).toBe('Fresh');
    });
  });

  describe('listForUser (TP16/TP17)', () => {
    it('TRIPREPO-027: byte-identical to the legacy statement, archived === null (TP16, no filter)', async () => {
      const { user: owner } = createUser(testDb);
      const { user: member } = createUser(testDb);
      const owned = createTrip(testDb, owner.id, { title: 'Owned' });
      const shared = createTrip(testDb, member.id, { title: 'Shared' });
      addTripMember(testDb, shared.id, owner.id);
      const archived = createTrip(testDb, owner.id, { title: 'Archived' });
      await setTrip(archived.id, { is_archived: 1 });

      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      const legacy = testDb
        .prepare(
          `
        ${LEGACY_TRIP_SELECT}
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = :userId
        WHERE (t.user_id = :userId OR m.user_id IS NOT NULL)
        ORDER BY t.created_at DESC
      `,
        )
        .all({ userId: owner.id });
      const rows = await trips.listForUser(owner.id, null);
      expect(rows).toEqual(legacy);
      expect(rows.map((r) => r.id).sort()).toEqual([owned.id, shared.id, archived.id].sort());
    });

    it('TRIPREPO-028: byte-identical to the legacy statement, archived filtered (TP17)', async () => {
      const { user: owner } = createUser(testDb);
      const active = createTrip(testDb, owner.id, { title: 'Active' });
      const archived = createTrip(testDb, owner.id, { title: 'Archived' });
      await setTrip(archived.id, { is_archived: 1 });

      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      const legacyArchived = testDb
        .prepare(
          `
        ${LEGACY_TRIP_SELECT}
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = :userId
        WHERE (t.user_id = :userId OR m.user_id IS NOT NULL) AND t.is_archived = :archived
        ORDER BY t.created_at DESC
      `,
        )
        .all({ userId: owner.id, archived: 1 });
      expect(await trips.listForUser(owner.id, 1)).toEqual(legacyArchived);
      expect((await trips.listForUser(owner.id, 1)).map((r) => r.id)).toEqual([archived.id]);
      expect((await trips.listForUser(owner.id, 0)).map((r) => r.id)).toEqual([active.id]);
    });
  });

  describe('activeTrip (TP21) — the triple CASE WHEN relevance projection and the double-CASE WHEN ORDER BY', () => {
    const LEGACY_ACTIVE_TRIP = `
      SELECT t.id, t.title, t.start_date, t.end_date,
        CASE
          WHEN t.start_date IS NOT NULL AND t.end_date IS NOT NULL AND t.start_date <= :today AND t.end_date >= :today THEN 0
          WHEN t.start_date IS NOT NULL AND t.start_date >= :today THEN 1
          ELSE 2
        END AS relevance
      FROM trips t
      LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = :userId
      WHERE (t.user_id = :userId OR m.user_id IS NOT NULL) AND t.is_archived = 0
      ORDER BY relevance ASC,
        CASE WHEN relevance < 2 THEN t.start_date END ASC,
        CASE WHEN relevance = 2 THEN t.start_date END DESC
      LIMIT 1
    `;

    it('TRIPREPO-029: a running-today trip (relevance 0) wins over an upcoming or past one, matching the legacy statement result AND ordering', async () => {
      const { user } = createUser(testDb);
      const today = '2026-06-10';
      createTrip(testDb, user.id, { title: 'Past', start_date: '2026-01-01', end_date: '2026-01-05' });
      const running = createTrip(testDb, user.id, {
        title: 'Running',
        start_date: '2026-06-08',
        end_date: '2026-06-12',
      });
      createTrip(testDb, user.id, { title: 'Future', start_date: '2026-07-01', end_date: '2026-07-05' });

      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      const legacy = testDb.prepare(LEGACY_ACTIVE_TRIP).get({ userId: user.id, today });
      const row = await trips.activeTrip(user.id, today);
      expect(row).toEqual(legacy);
      expect(row).toMatchObject({ id: running.id, title: 'Running', relevance: 0 });
    });

    it('TRIPREPO-030: no running trip — the next upcoming one wins, earliest first (relevance 1)', async () => {
      const { user } = createUser(testDb);
      const today = '2026-06-10';
      const soonest = createTrip(testDb, user.id, {
        title: 'Soonest',
        start_date: '2026-07-01',
        end_date: '2026-07-05',
      });
      createTrip(testDb, user.id, { title: 'Later', start_date: '2026-08-01', end_date: '2026-08-05' });

      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      const legacy = testDb.prepare(LEGACY_ACTIVE_TRIP).get({ userId: user.id, today });
      const row = await trips.activeTrip(user.id, today);
      expect(row).toEqual(legacy);
      expect(row).toMatchObject({ id: soonest.id, relevance: 1 });
    });

    it('TRIPREPO-031: nothing running or upcoming — the most recently started trip wins (relevance 2), archived trips excluded', async () => {
      const { user } = createUser(testDb);
      const today = '2026-06-10';
      createTrip(testDb, user.id, { title: 'Long ago', start_date: '2026-01-01', end_date: '2026-01-05' });
      const recent = createTrip(testDb, user.id, { title: 'Recent', start_date: '2026-05-01', end_date: '2026-05-05' });
      const archived = createTrip(testDb, user.id, {
        title: 'Archived-but-recent',
        start_date: '2026-06-01',
        end_date: '2026-06-05',
      });
      await setTrip(archived.id, { is_archived: 1 });

      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      const legacy = testDb.prepare(LEGACY_ACTIVE_TRIP).get({ userId: user.id, today });
      const row = await trips.activeTrip(user.id, today);
      expect(row).toEqual(legacy);
      expect(row).toMatchObject({ id: recent.id, relevance: 2 });
    });

    it('TRIPREPO-032: nothing at all returns undefined', async () => {
      const { user } = createUser(testDb);
      expect(await trips.activeTrip(user.id, '2026-06-10')).toBeUndefined();
    });
  });

  // Task 7 security review L2, absorbed here (Task 8 touches the same file):
  // `findForViewer`/`listForUser`/`activeTrip` each build their own Kysely
  // query via `this.kysely()` (`TrekRepository.kysely()`, validated first —
  // see its own docstring), which is the SAME escape hatch every write
  // method in this repository resolves its transactional fork through. The
  // OAUTHTOKREPO-012 shape proves that directly rather than by doc comment:
  // a write made — and READ BACK through these three methods — inside an
  // open `uow.transactional` that then rolls back must be invisible again
  // once the transaction is gone; if any of the three resolved on a SEPARATE
  // connection instead, it would never have seen the write in the first
  // place (a much louder failure, not merely a rollback bug).
  it('TRIPREPO-037 (rollback-proved): findForViewer/listForUser/activeTrip join the ambient transaction — a rolled-back write is visible inside it, gone once it rolls back', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Before', start_date: '2026-01-01', end_date: '2026-01-02' });

    let caught: unknown;
    try {
      await withRequestContext(t.orm, async () => {
        await uow.transactional(async () => {
          await trips.updateTripRow(trip.id, {
            title: 'After',
            description: null,
            start_date: '2026-01-01',
            end_date: '2026-01-02',
            currency: 'EUR',
            is_archived: 0,
            cover_image: null,
            reminder_days: 3,
          });
          // Seen INSIDE the open transaction — the write and the read share
          // one connection.
          expect((await trips.findForViewer(trip.id, user.id))?.title).toBe('After');
          expect((await trips.listForUser(user.id, null)).find((row) => row.id === trip.id)?.title).toBe('After');
          expect((await trips.activeTrip(user.id, '2026-01-01'))?.title).toBe('After');
          throw new Error('force rollback');
        });
      });
    } catch (e) {
      caught = e;
    }
    expect((caught as Error).message).toBe('force rollback');

    // Outside, after the rollback: every one of the three reads the ORIGINAL title.
    expect((await trips.findForViewer(trip.id, user.id))?.title).toBe('Before');
    expect((await trips.listForUser(user.id, null)).find((row) => row.id === trip.id)?.title).toBe('Before');
    expect((await trips.activeTrip(user.id, '2026-01-01'))?.title).toBe('Before');
  });
});

describe('TripsRepository.insertTrip / updateTripRow / setCoverImage / deleteById (Plan 3c Task 7)', () => {
  it('TRIPREPO-033: insertTrip (TP18) writes the given column set verbatim and returns the generated id', async () => {
    const { user } = createUser(testDb);
    const id = await trips.insertTrip({
      user_id: user.id,
      title: 'New Trip',
      description: null,
      start_date: null,
      end_date: null,
      currency: 'EUR',
      reminder_days: 3,
    });
    const row = await tripRow(id);
    expect(row).toMatchObject({ user_id: user.id, title: 'New Trip', currency: 'EUR', reminder_days: 3 });
  });

  it('TRIPREPO-034: updateTripRow (TP25) writes every column and stamps updated_at', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Before' });
    await trips.updateTripRow(trip.id, {
      title: 'After',
      description: 'd',
      start_date: '2026-01-01',
      end_date: '2026-01-05',
      currency: 'USD',
      is_archived: 1,
      cover_image: 'c.png',
      reminder_days: 7,
    });
    const row = await tripRow(trip.id);
    expect(row).toMatchObject({
      title: 'After',
      description: 'd',
      start_date: '2026-01-01',
      end_date: '2026-01-05',
      currency: 'USD',
      is_archived: 1,
      cover_image: 'c.png',
      reminder_days: 7,
    });
    // CURRENT_TIMESTAMP has one-second resolution — a same-second before/after
    // comparison is flaky, not a real assertion; the column being non-null and
    // in the CURRENT_TIMESTAMP text shape is what `updateTripRow` promises.
    expect(row.updated_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('TRIPREPO-035: setCoverImage (TP35) writes cover_image and stamps updated_at', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await trips.setCoverImage(trip.id, '/uploads/covers/x.jpg');
    expect((await tripRow(trip.id)).cover_image).toBe('/uploads/covers/x.jpg');
  });

  it('TRIPREPO-036: deleteById (TP34, security-sensitive) removes exactly the given trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    await trips.deleteById(trip.id);
    expect(await findRow(t.orm, Trips, { id: trip.id })).toBeNull();
    expect(await findRow(t.orm, Trips, { id: other.id })).not.toBeNull();
  });
});

// ── Plan 3c Task 8 (`TripsService.copy`, TP37) — additive ───────────────────

describe('TripsRepository.insertTripCopy (TP37)', () => {
  it('TRIPREPO-039: writes the 8-column copy set, is_archived hard-coded to 0 regardless of the caller', async () => {
    const { user: owner } = createUser(testDb);
    const { user: newOwner } = createUser(testDb);
    const newId = await trips.insertTripCopy({
      user_id: newOwner.id,
      title: 'Clone',
      description: 'd',
      start_date: '2026-01-01',
      end_date: '2026-01-05',
      currency: 'USD',
      cover_image: 'c.png',
      reminder_days: 7,
    });
    const { user_id, title, description, start_date, end_date, currency, cover_image, is_archived, reminder_days } =
      await tripRow(newId);
    const row = {
      user_id,
      title,
      description,
      start_date,
      end_date,
      currency,
      cover_image,
      is_archived,
      reminder_days,
    };
    expect(row).toEqual({
      user_id: newOwner.id,
      title: 'Clone',
      description: 'd',
      start_date: '2026-01-01',
      end_date: '2026-01-05',
      currency: 'USD',
      cover_image: 'c.png',
      is_archived: 0,
      reminder_days: 7,
    });
    // The source trip (never touched) proves is_archived: 0 is a literal, not a copied value.
    await setTrip(owner.id, { is_archived: 1 });
  });

  it('TRIPREPO-040: an archived source still produces an unarchived copy', async () => {
    const { user } = createUser(testDb);
    const src = createTrip(testDb, user.id, { title: 'Archived source' });
    await setTrip(src.id, { is_archived: 1 });
    const newId = await trips.insertTripCopy({
      user_id: user.id,
      title: 'Clone',
      description: null,
      start_date: null,
      end_date: null,
      currency: null,
      cover_image: null,
      reminder_days: 3,
    });
    expect((await tripRow(newId)).is_archived).toBe(0);
  });
});

// ── Task 7 security review M1, absorbed here (Task 8 touches the same file) ──
//
// The trip access predicate (`t.user_id = ? OR EXISTS a trip_members row`) was
// written out FOUR times in this file: once as the shared QB helper
// `accessibleTripsQuery` (`findAccessible`/`listAccessibleIds`), and three
// more times by hand in the Kysely methods (`findForViewer`, `listForUser`,
// `activeTrip`) — a different builder API that cannot share the QB helper. A
// single Kysely `.$call()` helper for the latter three was evaluated and set
// aside by Task 7 (real typing risk across three different `DB` shapes on a
// security-sensitive predicate, under that task's own time budget) in favor
// of the review's own stated fallback: this cross-method parity test proving
// all five agree on who can see a trip.
//
// Plan 4 Task 8a unified the three Kysely copies onto ONE shared boolean
// expression, `tripAccessExpr` (`_shared/trip-access.ts`) — fully generic
// over `<DB, TB>` (no correlated subquery forces the narrower fixed-alias
// shape `reservation-visibility.ts`'s `publicStayExists` needs, so it
// composes across `TripSelectKyselyDB` and `ActiveTripKyselyDB` without a
// `.$call()` helper). The LEFT JOIN itself stays hand-written at each call
// site (unchanged, still three copies) — `tripSelectQuery`'s own docstring
// records why a shared join helper can't be typed across these
// differently-joined outer queries. This test stays green as the
// unification's own regression guard, exactly as it always was.
describe('Cross-method access parity (Task 7 security review M1, absorbed)', () => {
  it('TRIPREPO-041: owner, member, stranger and an admin with no membership get the identical accessible/inaccessible verdict from all five access-checking methods', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const { user: admin } = createUser(testDb);
    await updateRows(t.orm, Users, { id: admin.id }, { role: 'admin' });
    const today = new Date().toISOString().slice(0, 10);
    const trip = createTrip(testDb, owner.id, { start_date: today, end_date: today });
    addTripMember(testDb, trip.id, member.id);

    const cases: Array<[string, number, boolean]> = [
      ['owner', owner.id, true],
      ['member', member.id, true],
      ['stranger', stranger.id, false],
      // An admin role grants no DB-level bypass here — role-gated access (if
      // any) is a higher layer's decision, never this repository's.
      ['admin, not a member', admin.id, false],
    ];

    for (const [, viewerId, expected] of cases) {
      expect(!!(await trips.findAccessible(trip.id, viewerId))).toBe(expected);
      expect((await trips.listAccessibleIds(viewerId)).includes(trip.id)).toBe(expected);
      expect(!!(await trips.findForViewer(trip.id, viewerId))).toBe(expected);
      expect((await trips.listForUser(viewerId, null)).some((row) => row.id === trip.id)).toBe(expected);
      expect((await trips.activeTrip(viewerId, today))?.id === trip.id).toBe(expected);
    }
  });
});

// ── Plan 3d Task 5 (FeedsService) — additive: FD1/FD2-4/FD9/FD11, the
// anonymous ICS feed token lifecycle's `trips` half (R3/R4). ─────────────────

const LEGACY_TRIP_TOKEN_ROW = `
  SELECT feed_token FROM trips
   WHERE id = ? AND (user_id = ? OR id IN (SELECT trip_id FROM trip_members WHERE user_id = ?))
`;
const LEGACY_REACHABLE_UPDATE = `
  UPDATE trips SET feed_token = ?
   WHERE id = ? AND (user_id = ? OR id IN (SELECT trip_id FROM trip_members WHERE user_id = ?))
`;

describe('TripsRepository.getFeedTokenIfReachable / setFeedTokenIfReachable (FD1/FD2-4)', () => {
  it('TRIPREPO-042: getFeedTokenIfReachable — byte-identical to the legacy tripTokenRow statement for owner/member/stranger, token set and null', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    await setTrip(trip.id, { feed_token: 'tok-reach' });

    for (const viewer of [owner, member]) {
      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      const legacy =
        (
          testDb.prepare(LEGACY_TRIP_TOKEN_ROW).get(trip.id, viewer.id, viewer.id) as
            { feed_token: string | null } | undefined
        )?.feed_token ?? null;
      expect(await trips.getFeedTokenIfReachable(trip.id, viewer.id)).toBe(legacy);
      expect(await trips.getFeedTokenIfReachable(trip.id, viewer.id)).toBe('tok-reach');
    }
    // A stranger: the legacy row is undefined, the repository's null collapse matches.
    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    expect(testDb.prepare(LEGACY_TRIP_TOKEN_ROW).get(trip.id, stranger.id, stranger.id)).toBeUndefined();
    expect(await trips.getFeedTokenIfReachable(trip.id, stranger.id)).toBeNull();
  });

  it('TRIPREPO-043: getFeedTokenIfReachable returns null for a reachable trip whose column is NULL (rule 16, not the same as "unreachable" but the caller collapses both)', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id); // feed_token NULL by default
    expect(await trips.getFeedTokenIfReachable(trip.id, owner.id)).toBeNull();
  });

  it('TRIPREPO-044: an archived trip is still reachable — REACHABLE never filters on is_archived, matching the legacy statement', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await setTrip(trip.id, { is_archived: 1, feed_token: 'tok-archived' });
    expect(await trips.getFeedTokenIfReachable(trip.id, owner.id)).toBe('tok-archived');
  });

  it("TRIPREPO-045: setFeedTokenIfReachable — owner and member can write, a stranger cannot; affected count matches the legacy statement's row count for each case", async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    // Owner writes.
    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacyOwner = testDb.prepare(LEGACY_REACHABLE_UPDATE).run('tok-owner', trip.id, owner.id, owner.id);
    expect(legacyOwner.changes).toBe(1);
    await setTrip(trip.id, { feed_token: null }); // undo, re-run through the repository
    expect(await trips.setFeedTokenIfReachable(trip.id, owner.id, 'tok-owner')).toBe(1);
    expect((await tripRow(trip.id)).feed_token).toBe('tok-owner');

    // Member writes.
    expect(await trips.setFeedTokenIfReachable(trip.id, member.id, 'tok-member')).toBe(1);
    expect((await tripRow(trip.id)).feed_token).toBe('tok-member');

    // A stranger's write affects 0 rows and leaves the column untouched — the
    // mutation-catching proof (rule: a loosened predicate would make this 1).
    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacyStranger = testDb
      .prepare(LEGACY_REACHABLE_UPDATE)
      .run('tok-stranger', trip.id, stranger.id, stranger.id);
    expect(legacyStranger.changes).toBe(0);
    expect(await trips.setFeedTokenIfReachable(trip.id, stranger.id, 'tok-stranger')).toBe(0);
    expect((await tripRow(trip.id)).feed_token).toBe('tok-member');
  });

  it('TRIPREPO-046: setFeedTokenIfReachable clears the column to NULL (disable) and works on an archived trip', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await setTrip(trip.id, { feed_token: 'tok-before', is_archived: 1 });
    expect(await trips.setFeedTokenIfReachable(trip.id, owner.id, null)).toBe(1);
    expect((await tripRow(trip.id)).feed_token).toBeNull();
  });

  // R3 (one visibility predicate, one source): `getFeedTokenIfReachable`/
  // `setFeedTokenIfReachable` reuse `accessibleTripsQuery` — the SAME join
  // builder `findAccessible` reads through. Extends TRIPREPO-041's
  // cross-method matrix rather than re-deriving it: if any of the three
  // diverged (a loosened membership arm, a dropped alias), this would fail.
  it('TRIPREPO-047: getFeedTokenIfReachable/setFeedTokenIfReachable agree with findAccessible on the identical owner/member/stranger verdict', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    for (const [viewer, reachable] of [
      [owner, true],
      [member, true],
      [stranger, false],
    ] as const) {
      const accessible = !!(await trips.findAccessible(trip.id, viewer.id));
      expect(accessible).toBe(reachable);
      // A read: getFeedTokenIfReachable returns non-null iff findAccessible does, given a token is set.
      await setTrip(trip.id, { feed_token: 'probe-token' });
      expect((await trips.getFeedTokenIfReachable(trip.id, viewer.id)) !== null).toBe(reachable);
      // A write: setFeedTokenIfReachable's affected count is 1 iff findAccessible says reachable.
      expect(await trips.setFeedTokenIfReachable(trip.id, viewer.id, 'probe-write')).toBe(reachable ? 1 : 0);
    }
  });
});

describe('TripsRepository.findIdByFeedToken (FD9)', () => {
  it('TRIPREPO-048: byte-identical to SELECT id FROM trips WHERE feed_token = ?', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await setTrip(trip.id, { feed_token: 'tok-credential' });
    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb.prepare('SELECT id FROM trips WHERE feed_token = ?').get('tok-credential') as { id: number };
    expect(await trips.findIdByFeedToken('tok-credential')).toBe(legacy.id);
  });

  it('TRIPREPO-049: an unknown token, and a NULL-token row, both resolve to undefined — the partial UNIQUE index semantics', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id); // feed_token NULL
    expect(await trips.findIdByFeedToken('does-not-exist')).toBeUndefined();
    expect(await trips.findIdByFeedToken('')).toBeUndefined();
  });
});

describe('TripsRepository.listReachableActiveTrips (FD11)', () => {
  const LEGACY_ACTIVE_FEED_TRIPS = `
    SELECT id FROM trips
     WHERE (user_id = ? OR id IN (SELECT trip_id FROM trip_members WHERE user_id = ?))
       AND is_archived = 0
       AND (end_date IS NULL OR end_date >= ?)
     ORDER BY start_date ASC
  `;

  it('TRIPREPO-050: byte-identical to the legacy statement — owned, member, archived, ended and undated trips', async () => {
    const { user: owner } = createUser(testDb);
    const { user: sharer } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const cutoff = '2026-01-01';

    const active = createTrip(testDb, owner.id, { title: 'Active', start_date: '2026-06-01', end_date: '2026-06-10' });
    const archived = createTrip(testDb, owner.id, {
      title: 'Archived',
      start_date: '2026-06-01',
      end_date: '2099-01-01',
    });
    await setTrip(archived.id, { is_archived: 1 });
    const ended = createTrip(testDb, owner.id, { title: 'Ended', start_date: '2020-01-01', end_date: '2020-01-10' });
    const undated = createTrip(testDb, owner.id, { title: 'Undated' }); // no end_date at all
    const shared = createTrip(testDb, sharer.id, { title: 'Shared', start_date: '2026-03-01', end_date: '2026-03-10' });
    addTripMember(testDb, shared.id, owner.id);
    createTrip(testDb, stranger.id, { title: 'Not mine', start_date: '2026-01-01', end_date: '2026-01-10' });

    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb.prepare(LEGACY_ACTIVE_FEED_TRIPS).all(owner.id, owner.id, cutoff) as { id: number }[];
    const rows = await trips.listReachableActiveTrips(owner.id, cutoff);
    expect(rows).toEqual(legacy.map((r) => r.id));
    expect(rows.sort((a, b) => a - b)).toEqual([shared.id, active.id, undated.id].sort((a, b) => a - b));
    expect(rows).not.toContain(archived.id);
    expect(rows).not.toContain(ended.id);
  });

  it("TRIPREPO-051: ordered by start_date ASC, a NULL start_date sorting per SQLite's own NULL-first ordering, matching the legacy statement", async () => {
    const { user } = createUser(testDb);
    const later = createTrip(testDb, user.id, { title: 'Later', start_date: '2026-08-01', end_date: '2099-01-01' });
    const earlier = createTrip(testDb, user.id, { title: 'Earlier', start_date: '2026-01-01', end_date: '2099-01-01' });
    const undated = createTrip(testDb, user.id, { title: 'Undated' });

    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = (
      testDb.prepare(LEGACY_ACTIVE_FEED_TRIPS).all(user.id, user.id, '2026-01-01') as { id: number }[]
    ).map((r) => r.id);
    expect(await trips.listReachableActiveTrips(user.id, '2026-01-01')).toEqual(legacy);
    expect(legacy).toEqual([undated.id, earlier.id, later.id]);
  });

  it('TRIPREPO-052: a stranger sees nothing, matching the legacy statement', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    createTrip(testDb, owner.id, { start_date: '2026-01-01', end_date: '2099-01-01' });
    expect(await trips.listReachableActiveTrips(stranger.id, '2026-01-01')).toEqual([]);
  });
});

// ── Plan 3d Task 5 (PublicApiService) — additive: the trip reads on 3d ───────
// (`listTrips`/`getTrip`/`buildTravellers`), converted onto TripsRepository.

describe('TripsRepository.listSummariesByIds / findSummaryById (PublicApiService.listTrips/getTrip)', () => {
  const LEGACY_TRIP_PROJECTION_COLS = 'id, title, description, start_date, end_date, currency, is_archived, updated_at';

  it('TRIPREPO-053: listSummariesByIds — byte-identical to the legacy statement, ordered by start_date DESC, id DESC', async () => {
    const { user } = createUser(testDb);
    const a = createTrip(testDb, user.id, { title: 'A', start_date: '2026-01-01', description: 'first' });
    const b = createTrip(testDb, user.id, { title: 'B', start_date: '2026-06-01' });
    const c = createTrip(testDb, user.id, { title: 'C' }); // start_date NULL
    createTrip(testDb, user.id, { title: 'Excluded' }); // not in the id list

    const ids = [a.id, b.id, c.id];
    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb
      .prepare(
        `SELECT ${LEGACY_TRIP_PROJECTION_COLS} FROM trips WHERE id IN (${ids.map(() => '?').join(',')}) ORDER BY start_date DESC, id DESC`,
      )
      .all(...ids);
    const rows = await trips.listSummariesByIds(ids);
    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.id)).toEqual([b.id, a.id, c.id]);
    expect(rows.find((r) => r.id === a.id)).toMatchObject({ description: 'first' });
    expect(rows.find((r) => r.id === c.id)).toMatchObject({ description: null, start_date: null });
  });

  it('TRIPREPO-054: listSummariesByIds returns [] for an empty id list without querying', async () => {
    expect(await trips.listSummariesByIds([])).toEqual([]);
  });

  it('TRIPREPO-055: findSummaryById — byte-identical to the legacy single-row statement; a missing trip is null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, {
      title: 'Solo',
      description: 'd',
      start_date: '2026-01-01',
      end_date: '2026-01-05',
    });
    await setTrip(trip.id, { is_archived: 1 });
    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb.prepare(`SELECT ${LEGACY_TRIP_PROJECTION_COLS} FROM trips WHERE id = ?`).get(trip.id);
    expect(await trips.findSummaryById(trip.id)).toEqual(legacy);
    expect(await trips.findSummaryById(trip.id)).toMatchObject({ title: 'Solo', is_archived: 1 });
    expect(await trips.findSummaryById(999999)).toBeNull();
  });
});

describe('TripsRepository.listTravellerUsernames (PublicApiService.buildTravellers)', () => {
  const LEGACY_TRAVELLERS = `
    SELECT u.username, 1 AS is_owner
      FROM trips t JOIN users u ON u.id = t.user_id
     WHERE t.id = ?
    UNION ALL
   SELECT u.username, 0 AS is_owner
      FROM trip_members m JOIN users u ON u.id = m.user_id
     WHERE m.trip_id = ?
     ORDER BY is_owner DESC
  `;

  it('TRIPREPO-056: byte-identical to the legacy UNION ALL statement — owner first, then members', async () => {
    const { user: owner } = createUser(testDb, { username: 'owner-handle' });
    const { user: memberA } = createUser(testDb, { username: 'member-a' });
    const { user: memberB } = createUser(testDb, { username: 'member-b' });
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, memberA.id);
    addTripMember(testDb, trip.id, memberB.id);

    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb.prepare(LEGACY_TRAVELLERS).all(trip.id, trip.id);
    const rows = await trips.listTravellerUsernames(trip.id);
    expect(rows).toEqual(legacy);
    expect(rows[0]).toEqual({ username: 'owner-handle', is_owner: 1 });
    expect(
      rows
        .slice(1)
        .map((r) => r.username)
        .sort(),
    ).toEqual(['member-a', 'member-b']);
  });

  it('TRIPREPO-057: a trip with no members returns only the owner row', async () => {
    const { user: owner } = createUser(testDb, { username: 'solo-owner' });
    const trip = createTrip(testDb, owner.id);
    expect(await trips.listTravellerUsernames(trip.id)).toEqual([{ username: 'solo-owner', is_owner: 1 }]);
  });
});

// L6 (task-7-review.md item 11): AT1 had no full-key legacy-raw `toEqual` —
// TRIPREPO-011/012 above only proved `listAccessibleIds` (ids only). One
// seeded world: an owned trip, a trip the caller only belongs to as a
// member, and a stranger's trip that must not appear.
describe('TripsRepository.listOwnedOrMember — AT1 parity with the legacy statement', () => {
  const LEGACY_OWNED_OR_MEMBER = `
    SELECT DISTINCT t.* FROM trips t
    LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
    WHERE t.user_id = ? OR m.user_id = ?
    ORDER BY t.start_date DESC
  `;

  it("TRIPREPO-058: byte-identical to the legacy DISTINCT/LEFT JOIN statement — owned and member trips, in the same start_date-desc order, a stranger's trip excluded", async () => {
    const { user: caller } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const owned = createTrip(testDb, caller.id, { start_date: '2026-03-01', end_date: '2026-03-05' });
    const memberOf = createTrip(testDb, stranger.id, { start_date: '2026-06-01', end_date: '2026-06-05' });
    addTripMember(testDb, memberOf.id, caller.id);
    createTrip(testDb, stranger.id, { start_date: '2026-01-01', end_date: '2026-01-02' }); // not the caller's

    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb.prepare(LEGACY_OWNED_OR_MEMBER).all(caller.id, caller.id, caller.id);
    const rows = await trips.listOwnedOrMember(caller.id);

    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.id)).toEqual([memberOf.id, owned.id]);
  });

  it('TRIPREPO-059: no owned or member trips returns an empty array, matching the legacy statement', async () => {
    const { user: caller } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    createTrip(testDb, stranger.id);

    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb.prepare(LEGACY_OWNED_OR_MEMBER).all(caller.id, caller.id, caller.id);
    expect(await trips.listOwnedOrMember(caller.id)).toEqual(legacy);
    expect(legacy).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Plan 3h Task 3 (`DawarichSyncService`/`DawarichTracksService`) — additive.
// ---------------------------------------------------------------------------

describe('TripsRepository.listTripsToSync (DSY2)', () => {
  const LEGACY_LIST_TRIPS_TO_SYNC = `
    SELECT DISTINCT t.id, t.start_date, t.end_date
       FROM trips t
       LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
      WHERE (t.user_id = ? OR m.user_id IS NOT NULL)
        AND COALESCE(t.is_archived, 0) = 0
        AND t.start_date IS NOT NULL
        AND (t.end_date IS NULL OR t.end_date >= date('now', '-400 days'))
        AND t.start_date <= date('now', '+1 day')
      ORDER BY t.start_date DESC
  `;

  it('TRIPREPO-060: byte-identical to the legacy statement — owned, member-of and archived/undated/out-of-window trips filtered the same way', async () => {
    const { user: caller } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const owned = createTrip(testDb, caller.id, { start_date: '2026-01-05', end_date: '2026-01-10' });
    const memberOf = createTrip(testDb, stranger.id, { start_date: '2026-02-01', end_date: '2026-02-05' });
    addTripMember(testDb, memberOf.id, caller.id);
    createTrip(testDb, caller.id, { start_date: '2020-01-01', end_date: '2020-01-02' }); // long past — end_date < -400d
    createTrip(testDb, caller.id); // no dates at all — start_date IS NULL
    const archived = createTrip(testDb, caller.id, { start_date: '2026-01-05', end_date: '2026-01-10' });
    await setTrip(archived.id, { is_archived: 1 });
    createTrip(testDb, stranger.id, { start_date: '2026-01-05', end_date: '2026-01-10' }); // not the caller's at all

    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb.prepare(LEGACY_LIST_TRIPS_TO_SYNC).all(caller.id, caller.id);
    const rows = await trips.listTripsToSync(caller.id);

    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.id).sort()).toEqual([owned.id, memberOf.id].sort());
  });

  it('TRIPREPO-061: no syncable trips returns an empty array, matching the legacy statement', async () => {
    const { user: caller } = createUser(testDb);
    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb.prepare(LEGACY_LIST_TRIPS_TO_SYNC).all(caller.id, caller.id);
    expect(await trips.listTripsToSync(caller.id)).toEqual(legacy);
    expect(legacy).toEqual([]);
  });
});

describe('TripsRepository.findDatesById (DTR1)', () => {
  it('TRIPREPO-062: returns start_date/end_date only, matching a legacy narrow SELECT', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-05-01', end_date: '2026-05-03' });
    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb.prepare('SELECT start_date, end_date FROM trips WHERE id = ?').get(trip.id);
    expect(await trips.findDatesById(trip.id)).toEqual(legacy);
  });

  it('TRIPREPO-063: undefined for a trip that does not exist', async () => {
    expect(await trips.findDatesById(999999)).toBeUndefined();
  });
});

describe('TripsRepository.listIdTitleOrderedByTitle (Plan 4 Task 1, RI2)', () => {
  it('TRIPREPO-064: id/title only, case-insensitively ordered by title, matching the legacy statement byte-for-byte', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'zulu' });
    createTrip(testDb, user.id, { title: 'Alpha' });
    createTrip(testDb, user.id, { title: 'bravo' });

    // test-sql-allow: the legacy statement, COLLATE NOCASE included, is the oracle the repository read is held to.
    const legacy = testDb.prepare('SELECT id, title FROM trips ORDER BY title COLLATE NOCASE ASC').all();

    expect(await trips.listIdTitleOrderedByTitle()).toEqual(legacy);
  });

  it('TRIPREPO-065: empty array when there are no trips', async () => {
    expect(await trips.listIdTitleOrderedByTitle()).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Plan 4 Task 8b-2, item 3 (3f L6 carry): AT42 (AtlasService#getTravelStats)
// had no repository-level toEqual(<legacy raw>) parity test.
// ─────────────────────────────────────────────────────────────────────────────

describe('TripsRepository.countTripsAndDaysForUser (AT42, AtlasService#getTravelStats)', () => {
  it('TRIPREPO-066: matches the legacy COUNT(DISTINCT) statement, owner and member trips, archived trips still counted', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const tripA = createTrip(testDb, owner.id);
    createDay(testDb, tripA.id);
    createDay(testDb, tripA.id);
    const tripB = createTrip(testDb, owner.id); // archived, still counts
    await setTrip(tripB.id, { is_archived: 1 });
    createDay(testDb, tripB.id);
    addTripMember(testDb, tripA.id, member.id);

    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb
      .prepare(
        `
      SELECT COUNT(DISTINCT t.id) as trips, COUNT(DISTINCT d.id) as days
      FROM trips t LEFT JOIN days d ON d.trip_id = t.id LEFT JOIN trip_members tm ON t.id = tm.trip_id
      WHERE (t.user_id = ? OR tm.user_id = ?)`,
      )
      .get(owner.id, owner.id) as { trips: number; days: number };

    const typedOwner = await trips.countTripsAndDaysForUser(owner.id);
    expect(typedOwner).toEqual(legacy);
    expect(typedOwner).toEqual({ trips: 2, days: 3 });

    const typedMember = await trips.countTripsAndDaysForUser(member.id);
    expect(typedMember).toEqual({ trips: 1, days: 2 });

    expect(await trips.countTripsAndDaysForUser(stranger.id)).toEqual({ trips: 0, days: 0 });
  });
});

// Plan 4 final review m5 (carry 5): `findPublicForShare` had no test reference
// at all. Full-key parity against the legacy SH7 statement run raw on the same
// connection — every column, a NULL-heavy row next to a filled one, a missing id.
describe('TripsRepository.findPublicForShare (SH7)', () => {
  const LEGACY_SH7 =
    'SELECT id, title, description, start_date, end_date, cover_image, currency FROM trips WHERE id = ?';

  it('TRIPREPO-067: byte-identical to the legacy statement for a fully filled trip and for a NULL-heavy one', async () => {
    const { user } = createUser(testDb);
    const filled = createTrip(testDb, user.id, {
      title: 'Filled',
      description: 'All columns set',
      start_date: '2026-10-01',
      end_date: '2026-10-03',
    });
    await setTrip(filled.id, { cover_image: '/uploads/covers/a.jpg', currency: 'CHF', is_archived: 1 });
    const sparse = createTrip(testDb, user.id, { title: 'Sparse' });
    await setTrip(sparse.id, { currency: null });

    for (const trip of [filled, sparse]) {
      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      const legacy = testDb.prepare(LEGACY_SH7).get(trip.id);
      expect(await trips.findPublicForShare(trip.id)).toEqual(legacy);
    }
    expect(await trips.findPublicForShare(filled.id)).toEqual({
      id: filled.id,
      title: 'Filled',
      description: 'All columns set',
      start_date: '2026-10-01',
      end_date: '2026-10-03',
      cover_image: '/uploads/covers/a.jpg',
      currency: 'CHF',
    });
  });

  it('TRIPREPO-068: an id with no trip is undefined, as the legacy .get() is', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    expect(testDb.prepare(LEGACY_SH7).get(trip.id + 1000)).toBeUndefined();
    expect(await trips.findPublicForShare(trip.id + 1000)).toBeUndefined();
  });
});
