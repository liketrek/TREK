import { Reservations } from '../../../../../src/db/entities/Reservations.entity';
import {
  publicReservationCondition,
  publicReservationExpr,
  publicStayExists,
  type ReservationVisibilityKyselyDB,
} from '../../../../../src/db/repositories/_shared/reservation-visibility';
import { createSnapshotTestDb } from '../../../../helpers/db-mock';
import {
  createDayAccommodation,
  createPlace,
  createReservation,
  createTrip,
  createUser,
} from '../../../../helpers/factories';
import { resetTestDb } from '../../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * The legacy string fragments this harness proves parity against
 * (`src/nest/reservations/reservation-visibility.ts`'s `publicReservationSql`/
 * `publicStaySql`) were DELETED by Plan 3d Task 4 once calendar and `share`
 * — their only two consumers — were converted onto the typed predicates
 * above in the same commit (no two live implementations of an
 * anonymous-surface security check). Kept here, byte-identical to the
 * deleted file's own text, as this test's own oracle: the point of a
 * string-vs-predicate parity harness is to hold the STRING side fixed and
 * independent of the production code it is proving, not to import it from
 * production (there is no longer a production copy to import).
 */
const publicReservationSql = (alias = 'r'): string => `COALESCE(${alias}.ingest_state, 'live') <> 'staged'`;
const publicStaySql = (alias = 'a'): string => `(
      NOT EXISTS (SELECT 1 FROM reservations vr WHERE CAST(vr.accommodation_id AS INTEGER) = ${alias}.id)
      OR EXISTS (SELECT 1 FROM reservations vr WHERE CAST(vr.accommodation_id AS INTEGER) = ${alias}.id
                   AND ${publicReservationSql('vr')})
    )`;

const testDb = createSnapshotTestDb();
let t: TestOrm;

beforeAll(async () => {
  t = await createTestOrm(testDb);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

/**
 * R3's string-vs-predicate parity harness: seeds staged/live/mixed
 * reservations and stays, then runs BOTH the legacy raw-string fragment
 * (`src/nest/reservations/reservation-visibility.ts`) and the new typed
 * predicate (`src/db/repositories/_shared/reservation-visibility.ts`)
 * against the identical rows, asserting identical row-id sets. Tasks 2/4/5
 * reuse this harness rather than re-derive it (brief item 3).
 */
describe('reservation-visibility parity (RV1: publicReservationCondition vs publicReservationSql)', () => {
  it('RESVIS-001: a mix of live/staged reservations — the typed condition and the legacy string fragment select the identical row set', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const live1 = createReservation(testDb, trip.id, { title: 'Live 1' });
    const live2 = createReservation(testDb, trip.id, { title: 'Live 2' });
    const staged1 = createReservation(testDb, trip.id, { title: 'Staged 1' });
    testDb.prepare("UPDATE reservations SET ingest_state = 'staged' WHERE id = ?").run(staged1.id);
    const staged2 = createReservation(testDb, trip.id, { title: 'Staged 2' });
    testDb.prepare("UPDATE reservations SET ingest_state = 'staged' WHERE id = ?").run(staged2.id);

    const platform = t.em.getPlatform();
    const typed = await t.em
      .createQueryBuilder(Reservations, 'r')
      .select(['r.id'])
      .where({ 'r.trip_id': trip.id, ...publicReservationCondition(platform, 'r') })
      .orderBy({ id: 'asc' })
      .execute<{ id: number }[]>('all', false);

    const legacy = testDb
      .prepare(`SELECT id FROM reservations r WHERE r.trip_id = ? AND ${publicReservationSql('r')} ORDER BY id ASC`)
      .all(trip.id) as { id: number }[];

    expect(typed.map((r) => r.id)).toEqual([live1.id, live2.id]);
    expect(typed).toEqual(legacy);
  });

  it('RESVIS-002: every reservation staged — both forms select nothing', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const staged = createReservation(testDb, trip.id, { title: 'Staged only' });
    testDb.prepare("UPDATE reservations SET ingest_state = 'staged' WHERE id = ?").run(staged.id);
    const platform = t.em.getPlatform();

    const typed = await t.em
      .createQueryBuilder(Reservations, 'r')
      .select(['r.id'])
      .where({ 'r.trip_id': trip.id, ...publicReservationCondition(platform, 'r') })
      .execute<{ id: number }[]>('all', false);
    const legacy = testDb
      .prepare(`SELECT id FROM reservations r WHERE r.trip_id = ? AND ${publicReservationSql('r')}`)
      .all(trip.id) as { id: number }[];

    expect(typed).toEqual([]);
    expect(typed).toEqual(legacy);
  });

  it('RESVIS-003: a different table alias (the share.service.ts / calendar.service.ts "vr" shape) renders identically', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const live = createReservation(testDb, trip.id, { title: 'Live' });
    const staged = createReservation(testDb, trip.id, { title: 'Staged' });
    testDb.prepare("UPDATE reservations SET ingest_state = 'staged' WHERE id = ?").run(staged.id);
    const platform = t.em.getPlatform();

    const typed = await t.em
      .createQueryBuilder(Reservations, 'vr')
      .select(['vr.id'])
      .where({ 'vr.trip_id': trip.id, ...publicReservationCondition(platform, 'vr') })
      .execute<{ id: number }[]>('all', false);
    const legacy = testDb
      .prepare(`SELECT id FROM reservations vr WHERE vr.trip_id = ? AND ${publicReservationSql('vr')}`)
      .all(trip.id) as { id: number }[];

    expect(typed.map((r) => r.id)).toEqual([live.id]);
    expect(typed).toEqual(legacy);
  });
});

/**
 * RV1's Kysely-expression twin (L2, Plan 3d Task 4) — `publicReservationExpr`,
 * the form CL2/CL7/`share.service.ts`'s reads use (statements built with
 * `this.kysely()`, not the MikroORM QueryBuilder `publicReservationCondition`
 * spreads into). Run through a bare `reservations` selectFrom rather than
 * through a repository, since this file has no repository of its own — the
 * same "no consumer-facing generic DB" shape `publicStayExists` documents.
 */
interface PublicReservationExprTestDB {
  reservations: { id: number; trip_id: number; ingest_state: string | null };
}

describe('reservation-visibility parity (RV1 Kysely form: publicReservationExpr vs publicReservationSql)', () => {
  it('RESVIS-011: a mix of live/staged reservations — publicReservationExpr and the legacy string fragment select the identical row set', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const live1 = createReservation(testDb, trip.id, { title: 'Live 1' });
    const live2 = createReservation(testDb, trip.id, { title: 'Live 2' });
    const staged = createReservation(testDb, trip.id, { title: 'Staged' });
    testDb.prepare("UPDATE reservations SET ingest_state = 'staged' WHERE id = ?").run(staged.id);

    const typed = await t.em
      .getKysely<PublicReservationExprTestDB>()
      .selectFrom('reservations as r')
      .select('r.id')
      .where('r.trip_id', '=', trip.id)
      .where((eb) => publicReservationExpr(eb, 'r.ingest_state'))
      .orderBy('r.id', 'asc')
      .execute();
    const legacy = testDb
      .prepare(`SELECT id FROM reservations r WHERE r.trip_id = ? AND ${publicReservationSql('r')} ORDER BY id ASC`)
      .all(trip.id) as { id: number }[];

    expect(typed.map((r) => r.id)).toEqual([live1.id, live2.id]);
    expect(typed).toEqual(legacy);
  });

  // Mutation-sensitive: a third `ingest_state` value (neither 'live' nor
  // 'staged' — reachable today, no CHECK constraint pins the column to two
  // values, `Migration20200101031900...`) must stay PUBLIC. A one-token
  // confusion between "hide unless live" (`<> 'live'`, wrong) and "hide only
  // staged" (`<> 'staged'`, the actual rule) diverges exactly on this row:
  // manually mutated `publicReservationExpr`'s `'staged'` literal to `'live'`
  // and re-ran this suite — this case goes red (the row is wrongly hidden)
  // while every RESVIS-001/003 live/staged-only case stays green, so it is
  // not redundant with them.
  it('RESVIS-012 (mutation-sensitive): a third ingest_state value (neither live nor staged) is public — only "staged" hides a row', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createReservation(testDb, trip.id, { title: 'Some other ingest state' });
    testDb.prepare("UPDATE reservations SET ingest_state = 'archived_import' WHERE id = ?").run(other.id);
    const staged = createReservation(testDb, trip.id, { title: 'Staged' });
    testDb.prepare("UPDATE reservations SET ingest_state = 'staged' WHERE id = ?").run(staged.id);

    const typed = await t.em
      .getKysely<PublicReservationExprTestDB>()
      .selectFrom('reservations as r')
      .select('r.id')
      .where('r.trip_id', '=', trip.id)
      .where((eb) => publicReservationExpr(eb, 'r.ingest_state'))
      .orderBy('r.id', 'asc')
      .execute();
    const legacy = testDb
      .prepare(`SELECT id FROM reservations r WHERE r.trip_id = ? AND ${publicReservationSql('r')} ORDER BY id ASC`)
      .all(trip.id) as { id: number }[];

    expect(typed.map((r) => r.id)).toEqual([other.id]);
    expect(typed).toEqual(legacy);
  });
});

/**
 * `Kysely<StayVisibilityTestDB>` typed the way `TrekRepository.kysely()`
 * types every other repository's Kysely escape hatch — here obtained
 * directly off the test ORM's EntityManager (this module has no repository
 * of its own; it is a shared predicate builder, not a `TrekRepository`
 * subclass). Extends `ReservationVisibilityKyselyDB`'s real-table-name
 * shape with the one extra column this test's own WHERE clause needs
 * (`day_accommodations.trip_id`) — `.selectFrom('day_accommodations as a')`
 * below derives the aliased `a` member FROM `day_accommodations` (see
 * `ReservationVisibilityKyselyDB`'s own docstring), so the resulting `eb` is
 * exactly the shape `publicStayExists` requires.
 */
interface StayVisibilityTestDB extends ReservationVisibilityKyselyDB {
  day_accommodations: { id: number; trip_id: number };
}

describe('reservation-visibility parity (RV2: publicStayExists vs publicStaySql)', () => {
  it('RESVIS-004: no reservation points at the stay — public (the NOT EXISTS branch)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-05' });
    const place = createPlace(testDb, trip.id);
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as {
      id: number;
    }[];
    const stay = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);

    const typed = await t.em
      .getKysely<StayVisibilityTestDB>()
      .selectFrom('day_accommodations as a')
      .select('a.id')
      .where('a.trip_id', '=', trip.id)
      .where((eb) => publicStayExists(eb))
      .orderBy('a.id', 'asc')
      .execute();
    const legacy = testDb
      .prepare(`SELECT id FROM day_accommodations a WHERE a.trip_id = ? AND ${publicStaySql('a')} ORDER BY a.id ASC`)
      .all(trip.id) as { id: number }[];

    expect(typed.map((r) => r.id)).toEqual([stay.id]);
    expect(typed).toEqual(legacy);
  });

  it('RESVIS-005: a live booking points at the stay — public (the EXISTS + live branch)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-05' });
    const place = createPlace(testDb, trip.id);
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as {
      id: number;
    }[];
    const stay = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);
    const booking = createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel' });
    testDb.prepare('UPDATE reservations SET accommodation_id = ? WHERE id = ?').run(String(stay.id), booking.id);

    const typed = await t.em
      .getKysely<StayVisibilityTestDB>()
      .selectFrom('day_accommodations as a')
      .select('a.id')
      .where('a.trip_id', '=', trip.id)
      .where((eb) => publicStayExists(eb))
      .execute();
    const legacy = testDb
      .prepare(`SELECT id FROM day_accommodations a WHERE a.trip_id = ? AND ${publicStaySql('a')}`)
      .all(trip.id) as { id: number }[];

    expect(typed.map((r) => r.id)).toEqual([stay.id]);
    expect(typed).toEqual(legacy);
  });

  it('RESVIS-006: only a staged booking points at the stay — hidden (neither branch matches)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-05' });
    const place = createPlace(testDb, trip.id);
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as {
      id: number;
    }[];
    const stay = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);
    const booking = createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel' });
    testDb
      .prepare("UPDATE reservations SET accommodation_id = ?, ingest_state = 'staged' WHERE id = ?")
      .run(String(stay.id), booking.id);

    const typed = await t.em
      .getKysely<StayVisibilityTestDB>()
      .selectFrom('day_accommodations as a')
      .select('a.id')
      .where('a.trip_id', '=', trip.id)
      .where((eb) => publicStayExists(eb))
      .execute();
    const legacy = testDb
      .prepare(`SELECT id FROM day_accommodations a WHERE a.trip_id = ? AND ${publicStaySql('a')}`)
      .all(trip.id) as { id: number }[];

    expect(typed).toEqual([]);
    expect(typed).toEqual(legacy);
  });

  it('RESVIS-007: a staged AND a live booking both point at the stay — public (the live one is enough)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-05' });
    const place = createPlace(testDb, trip.id);
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as {
      id: number;
    }[];
    const stay = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);
    const stagedBooking = createReservation(testDb, trip.id, { title: 'Staged copy', type: 'hotel' });
    testDb
      .prepare("UPDATE reservations SET accommodation_id = ?, ingest_state = 'staged' WHERE id = ?")
      .run(String(stay.id), stagedBooking.id);
    const liveBooking = createReservation(testDb, trip.id, { title: 'Live copy', type: 'hotel' });
    testDb.prepare('UPDATE reservations SET accommodation_id = ? WHERE id = ?').run(String(stay.id), liveBooking.id);

    const typed = await t.em
      .getKysely<StayVisibilityTestDB>()
      .selectFrom('day_accommodations as a')
      .select('a.id')
      .where('a.trip_id', '=', trip.id)
      .where((eb) => publicStayExists(eb))
      .execute();
    const legacy = testDb
      .prepare(`SELECT id FROM day_accommodations a WHERE a.trip_id = ? AND ${publicStaySql('a')}`)
      .all(trip.id) as { id: number }[];

    expect(typed.map((r) => r.id)).toEqual([stay.id]);
    expect(typed).toEqual(legacy);
  });

  // §18.1: reservations.accommodation_id is TEXT with no FK; some rows read
  // back as "14.0". The CAST(... AS INTEGER) both the legacy fragment and
  // publicStayExists use must match that spelling too, not just the plain
  // integer-as-string form.
  it('RESVIS-008: accommodation_id stored in the "14.0" TEXT form still resolves the link — public', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-05' });
    const place = createPlace(testDb, trip.id);
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as {
      id: number;
    }[];
    const stay = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);
    const booking = createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel' });
    testDb.prepare('UPDATE reservations SET accommodation_id = ? WHERE id = ?').run(`${stay.id}.0`, booking.id);

    const typed = await t.em
      .getKysely<StayVisibilityTestDB>()
      .selectFrom('day_accommodations as a')
      .select('a.id')
      .where('a.trip_id', '=', trip.id)
      .where((eb) => publicStayExists(eb))
      .execute();
    const legacy = testDb
      .prepare(`SELECT id FROM day_accommodations a WHERE a.trip_id = ? AND ${publicStaySql('a')}`)
      .all(trip.id) as { id: number }[];

    expect(typed.map((r) => r.id)).toEqual([stay.id]);
    expect(typed).toEqual(legacy);
  });

  it('RESVIS-009: a mixed trip — one unlinked stay, one live-linked stay, one staged-only stay — every stay resolves identically between both forms', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-06' });
    const place = createPlace(testDb, trip.id);
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as {
      id: number;
    }[];

    const unlinked = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);
    const liveLinked = createDayAccommodation(testDb, trip.id, place.id, days[2].id, days[3].id);
    const liveBooking = createReservation(testDb, trip.id, { title: 'Live', type: 'hotel' });
    testDb
      .prepare('UPDATE reservations SET accommodation_id = ? WHERE id = ?')
      .run(String(liveLinked.id), liveBooking.id);
    const stagedOnly = createDayAccommodation(testDb, trip.id, place.id, days[4].id, days[5].id);
    const stagedBooking = createReservation(testDb, trip.id, { title: 'Staged', type: 'hotel' });
    testDb
      .prepare("UPDATE reservations SET accommodation_id = ?, ingest_state = 'staged' WHERE id = ?")
      .run(String(stagedOnly.id), stagedBooking.id);

    const typed = await t.em
      .getKysely<StayVisibilityTestDB>()
      .selectFrom('day_accommodations as a')
      .select('a.id')
      .where('a.trip_id', '=', trip.id)
      .where((eb) => publicStayExists(eb))
      .orderBy('a.id', 'asc')
      .execute();
    const legacy = testDb
      .prepare(`SELECT id FROM day_accommodations a WHERE a.trip_id = ? AND ${publicStaySql('a')} ORDER BY a.id ASC`)
      .all(trip.id) as { id: number }[];

    expect(typed.map((r) => r.id)).toEqual([unlinked.id, liveLinked.id]);
    expect(typed).toEqual(legacy);
  });

  // M1 (Plan 3d Task 0 review, folded into Task 7's fix wave): the harness
  // above never made the CAST load-bearing — dropping `eb2.cast(…,
  // 'integer')` from `publicStayExists` stayed green on all of RESVIS-004..
  // 009, RESVIS-008 ("14.0") included, because a column-to-column compare
  // already gets SQLite's own NUMERIC-affinity coercion for a
  // WHOLLY-numeric TEXT value ('14 ', '14.0', ' 14' all equal 14 without
  // any CAST — measured). Only a PREFIX-numeric value tells the two
  // predicates apart: `CAST('14abc' AS INTEGER) = 14` is true, but the bare
  // affinity compare `'14abc' = 14` is false, since '14abc' is not a
  // well-formed number and keeps its TEXT affinity.
  it('RESVIS-013 (mutation-sensitive): a staged-only booking with accommodation_id = "<id>abc" still resolves the link — the stay is hidden (only the CAST recognises a prefix-numeric TEXT value)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-05' });
    const place = createPlace(testDb, trip.id);
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as {
      id: number;
    }[];
    const stay = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);
    const booking = createReservation(testDb, trip.id, { title: 'Staged prefix-numeric link', type: 'hotel' });
    testDb
      .prepare("UPDATE reservations SET accommodation_id = ?, ingest_state = 'staged' WHERE id = ?")
      .run(`${stay.id}abc`, booking.id);

    const typed = await t.em
      .getKysely<StayVisibilityTestDB>()
      .selectFrom('day_accommodations as a')
      .select('a.id')
      .where('a.trip_id', '=', trip.id)
      .where((eb) => publicStayExists(eb))
      .execute();
    const legacy = testDb
      .prepare(`SELECT id FROM day_accommodations a WHERE a.trip_id = ? AND ${publicStaySql('a')}`)
      .all(trip.id) as { id: number }[];

    // The only link is staged, so the stay must be hidden — the SAME answer
    // RESVIS-006 gives for a plain-integer-spelled staged link. Dropping the
    // CAST makes the typed predicate miss the link entirely (a bare
    // '14abc' = 14 compare is false) and fall into the NOT-EXISTS branch,
    // wrongly reading the stay as public — this assertion goes red then,
    // while `typed` still equals `legacy` under the untouched code.
    expect(typed).toEqual([]);
    expect(typed).toEqual(legacy);
  });

  it('RESVIS-014: a staged-only booking with accommodation_id = "<id> " (trailing space) still resolves the link — the stay is hidden (both forms agree; SQLite\'s own affinity already coerces a wholly-numeric padded value)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-05' });
    const place = createPlace(testDb, trip.id);
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as {
      id: number;
    }[];
    const stay = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);
    const booking = createReservation(testDb, trip.id, { title: 'Staged padded link', type: 'hotel' });
    testDb
      .prepare("UPDATE reservations SET accommodation_id = ?, ingest_state = 'staged' WHERE id = ?")
      .run(`${stay.id} `, booking.id);

    const typed = await t.em
      .getKysely<StayVisibilityTestDB>()
      .selectFrom('day_accommodations as a')
      .select('a.id')
      .where('a.trip_id', '=', trip.id)
      .where((eb) => publicStayExists(eb))
      .execute();
    const legacy = testDb
      .prepare(`SELECT id FROM day_accommodations a WHERE a.trip_id = ? AND ${publicStaySql('a')}`)
      .all(trip.id) as { id: number }[];

    expect(typed).toEqual([]);
    expect(typed).toEqual(legacy);
  });
});
