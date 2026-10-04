/**
 * Plan 3d Task 4 — the proof for CL1/CL2/CL4/CL7 (calendar) and RS20
 * (`listUpcoming`): full-key `toEqual(<legacy run raw>)` parity between
 * `ReservationsRepository`'s new methods and the exact legacy SQL they
 * replace (the legacy text is this file's own oracle — the production
 * copies were deleted the same commit these methods were added, per R3
 * "one source"; see `_shared/reservation-visibility.test.ts`'s identical
 * reasoning for keeping its own oracle text local).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import {
  createDay, createDayAccommodation, createDayAssignment, createPlace, createReservation, createTrip, createUser, addTripMember,
} from '../../../helpers/factories';
import {
  createTestReservationsRepo, createTestTripsRepo, createTestDaysRepo, createTestDayNotesRepo,
} from '../../../helpers/test-uow';
import type { ReservationsRepository } from '../../../../src/db/repositories/Reservations.repository';
import type { TripsRepository } from '../../../../src/db/repositories/Trips.repository';
import type { DaysRepository } from '../../../../src/db/repositories/Days.repository';
import type { DayNotesRepository } from '../../../../src/db/repositories/DayNotes.repository';

const testDb = createSnapshotTestDb();
let reservationsRepo: ReservationsRepository;
let tripsRepo: TripsRepository;
let daysRepo: DaysRepository;
let dayNotesRepo: DayNotesRepository;

beforeAll(async () => {
  reservationsRepo = await createTestReservationsRepo(testDb);
  tripsRepo = await createTestTripsRepo(testDb);
  daysRepo = await createTestDaysRepo(testDb);
  dayNotesRepo = await createTestDayNotesRepo(testDb);
});
beforeEach(() => resetTestDb(testDb));
afterAll(() => testDb.close());

// The RV1 fragment CL2/CL7's legacy statements interpolated inline — kept
// here, not imported, for the same "no production copy left to import from"
// reason `_shared/reservation-visibility.test.ts` gives.
const publicReservationSql = (alias = 'r'): string => `COALESCE(${alias}.ingest_state, 'live') <> 'staged'`;
const publicStaySql = (alias = 'a'): string => `(
      NOT EXISTS (SELECT 1 FROM reservations vr WHERE CAST(vr.accommodation_id AS INTEGER) = ${alias}.id)
      OR EXISTS (SELECT 1 FROM reservations vr WHERE CAST(vr.accommodation_id AS INTEGER) = ${alias}.id
                   AND ${publicReservationSql('vr')})
    )`;

describe('ReservationsRepository — CL1 (findRaw, existing method reused by calendar)', () => {
  it('CAL-CL1-001: matches SELECT * FROM trips WHERE id = ?', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Alps' });

    const typed = await tripsRepo.findRaw(trip.id);
    const legacy = testDb.prepare('SELECT * FROM trips WHERE id = ?').get(trip.id);

    expect(typed).toEqual(legacy);
  });
});

describe('ReservationsRepository — CL2 (listForCalendar)', () => {
  it('CAL-CL2-001: matches the legacy joined statement, live bookings only, staged excluded', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-06-01', end_date: '2026-06-05' });
    const place = createPlace(testDb, trip.id);
    const live = createReservation(testDb, trip.id, { title: 'Live' });
    testDb.prepare('UPDATE reservations SET place_id = ? WHERE id = ?').run(place.id, live.id);
    const staged = createReservation(testDb, trip.id, { title: 'Staged' });
    testDb.prepare("UPDATE reservations SET ingest_state = 'staged' WHERE id = ?").run(staged.id);

    const typed = await reservationsRepo.listForCalendar(trip.id);
    const legacy = testDb
      .prepare(
        `SELECT r.*, pl.lat AS place_lat, pl.lng AS place_lng,
                sd.date AS stay_start_date, ed.date AS stay_end_date,
                a.check_in AS stay_check_in, a.check_out AS stay_check_out,
                (SELECT MIN(r2.id) FROM reservations r2
                  WHERE r2.accommodation_id = a.id) AS stay_first_reservation_id,
                rd.date AS day_date, red.date AS end_day_date
         FROM reservations r
         LEFT JOIN places pl ON r.place_id = pl.id
         LEFT JOIN day_accommodations a ON r.accommodation_id = a.id
         LEFT JOIN days sd ON a.start_day_id = sd.id
         LEFT JOIN days ed ON a.end_day_id = ed.id
         LEFT JOIN days rd ON r.day_id = rd.id
         LEFT JOIN days red ON r.end_day_id = red.id
         WHERE r.trip_id = ? AND ${publicReservationSql('r')}`,
      )
      .all(trip.id);

    expect(typed.map((r) => r.id)).toEqual([live.id]);
    expect(typed).toEqual(legacy);
  });

  it('CAL-CL2-002: a "14.0"-shaped accommodation_id join still resolves the stay dates', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-06-01', end_date: '2026-06-05' });
    const place = createPlace(testDb, trip.id);
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as { id: number }[];
    const stay = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id, { check_in: '15:00', check_out: '11:00' });
    const booking = createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel' });
    testDb.prepare('UPDATE reservations SET accommodation_id = ? WHERE id = ?').run(`${stay.id}.0`, booking.id);

    const typed = await reservationsRepo.listForCalendar(trip.id);
    const legacy = testDb
      .prepare(
        `SELECT r.*, pl.lat AS place_lat, pl.lng AS place_lng,
                sd.date AS stay_start_date, ed.date AS stay_end_date,
                a.check_in AS stay_check_in, a.check_out AS stay_check_out,
                (SELECT MIN(r2.id) FROM reservations r2
                  WHERE r2.accommodation_id = a.id) AS stay_first_reservation_id,
                rd.date AS day_date, red.date AS end_day_date
         FROM reservations r
         LEFT JOIN places pl ON r.place_id = pl.id
         LEFT JOIN day_accommodations a ON r.accommodation_id = a.id
         LEFT JOIN days sd ON a.start_day_id = sd.id
         LEFT JOIN days ed ON a.end_day_id = ed.id
         LEFT JOIN days rd ON r.day_id = rd.id
         LEFT JOIN days red ON r.end_day_id = red.id
         WHERE r.trip_id = ? AND ${publicReservationSql('r')}`,
      )
      .all(trip.id);

    expect(typed[0]?.stay_check_in).toBe('15:00');
    expect(typed).toEqual(legacy);
  });

  // Inventory §18.2's documented, unfixed hole: `stay_first_reservation_id`'s
  // correlated MIN(r2.id) is NOT filtered by RV1, so a staged sibling booking
  // with a LOWER id than the live one still wins the slot. Parity keeps it —
  // pinned by name so nobody "fixes" it silently in a later change.
  it('CAL-CL2-HOLE-001: a staged sibling with a lower id wins stay_first_reservation_id over the live booking (documented, unfixed)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-06-01', end_date: '2026-06-05' });
    const place = createPlace(testDb, trip.id);
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as { id: number }[];
    const stay = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);

    const stagedFirst = createReservation(testDb, trip.id, { title: 'Staged, lower id', type: 'hotel' });
    testDb.prepare("UPDATE reservations SET accommodation_id = ?, ingest_state = 'staged' WHERE id = ?").run(String(stay.id), stagedFirst.id);
    const liveSecond = createReservation(testDb, trip.id, { title: 'Live, higher id', type: 'hotel' });
    testDb.prepare('UPDATE reservations SET accommodation_id = ? WHERE id = ?').run(String(stay.id), liveSecond.id);

    const typed = await reservationsRepo.listForCalendar(trip.id);
    const liveRow = typed.find((r) => r.id === liveSecond.id);

    // The visible (live) row reports the STAGED sibling's id as the "first
    // reservation" for its own stay — that is the hole, reproduced exactly.
    expect(liveRow?.stay_first_reservation_id).toBe(stagedFirst.id);
    expect(liveRow?.stay_first_reservation_id).not.toBe(liveSecond.id);
  });
});

describe('ReservationsRepository — CL4 (listCalendarStops)', () => {
  it('CAL-CL4-001: matches the legacy per-day statement, excluding a booked-night stop', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-06-01', end_date: '2026-06-03' });
    const day = createDay(testDb, trip.id, { date: '2026-06-01' });
    const place = createPlace(testDb, trip.id, { name: 'Museum' });
    testDb.prepare('INSERT INTO day_assignments (day_id, place_id, order_index) VALUES (?, ?, 0)').run(day.id, place.id);
    // A booked-night stop: linked to an accommodation, must be excluded.
    const hotelPlace = createPlace(testDb, trip.id, { name: 'Hotel' });
    const accResult = testDb.prepare(
      'INSERT INTO day_accommodations (trip_id, place_id, start_day_id, end_day_id) VALUES (?, ?, ?, ?)',
    ).run(trip.id, hotelPlace.id, day.id, day.id);
    testDb.prepare('INSERT INTO day_assignments (day_id, place_id, order_index, accommodation_id) VALUES (?, ?, 1, ?)')
      .run(day.id, hotelPlace.id, accResult.lastInsertRowid);

    const typed = await reservationsRepo.listCalendarStops(day.id);
    const legacy = testDb.prepare(`
        SELECT da.*, p.name as place_name, p.address as place_address,
          p.lat as place_lat, p.lng as place_lng,
          COALESCE(da.assignment_time, p.place_time) as effective_time,
          COALESCE(da.assignment_end_time, p.end_time) as effective_end_time
        FROM day_assignments da
        JOIN places p ON da.place_id = p.id
        WHERE da.day_id = ?
          AND da.accommodation_id IS NULL
        ORDER BY da.order_index ASC, da.created_at ASC
      `).all(day.id);

    expect(typed.map((s) => s.place_name)).toEqual(['Museum']);
    expect(typed).toEqual(legacy);
  });
});

describe('ReservationsRepository — CL7 (listPublicStaysForCalendar)', () => {
  it('CAL-CL7-001: matches the legacy statement — a live-linked stay is included, a staged-only one is not', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-06-01', end_date: '2026-06-06' });
    const place = createPlace(testDb, trip.id);
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as { id: number }[];

    const liveLinked = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id, { check_in: '15:00', check_out: '11:00' });
    const liveBooking = createReservation(testDb, trip.id, { title: 'Live', type: 'hotel' });
    testDb.prepare('UPDATE reservations SET accommodation_id = ? WHERE id = ?').run(String(liveLinked.id), liveBooking.id);

    const stagedOnly = createDayAccommodation(testDb, trip.id, place.id, days[2].id, days[3].id);
    const stagedBooking = createReservation(testDb, trip.id, { title: 'Staged', type: 'hotel' });
    testDb.prepare("UPDATE reservations SET accommodation_id = ?, ingest_state = 'staged' WHERE id = ?").run(String(stagedOnly.id), stagedBooking.id);

    const typed = await reservationsRepo.listPublicStaysForCalendar(trip.id);
    const legacy = testDb.prepare(`
      SELECT a.id, a.check_in, a.check_in_end, a.check_out,
             sd.date AS start_date, ed.date AS end_date,
             p.name AS place_name, p.address AS place_address, p.lat AS place_lat, p.lng AS place_lng,
             (SELECT r.title FROM reservations r
               WHERE r.accommodation_id = a.id AND ${publicReservationSql('r')}
               ORDER BY r.id ASC LIMIT 1) AS reservation_title
      FROM day_accommodations a
      LEFT JOIN days sd ON a.start_day_id = sd.id
      LEFT JOIN days ed ON a.end_day_id = ed.id
      LEFT JOIN places p ON a.place_id = p.id
      WHERE a.trip_id = ? AND ${publicStaySql('a')}
      ORDER BY a.id ASC
    `).all(trip.id);

    expect(typed.map((s) => s.id)).toEqual([liveLinked.id]);
    expect(typed).toEqual(legacy);
  });
});

// ── RS20 (listUpcomingForUser) ───────────────────────────────────────────

/** The exact legacy statement RS20's `ReservationsService.listUpcoming` ran, kept here as this test's own oracle (§ file header). */
const LEGACY_LIST_UPCOMING = `
    WITH visible_trips AS (
      SELECT t.id, t.title, t.cover_image
      FROM trips t
      LEFT JOIN trip_members tm ON tm.trip_id = t.id AND tm.user_id = ?
      WHERE (t.user_id = ? OR tm.user_id IS NOT NULL) AND t.is_archived = 0
    ),
    entries AS (
      SELECT r.id, r.trip_id, r.title, r.type, r.status, r.location,
             r.reservation_time, r.confirmation_number,
             tr.title as trip_title, tr.cover_image as trip_cover,
             d.date as day_date, p.name as place_name, p.image_url as place_image,
             CASE WHEN r.reservation_time GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*' THEN substr(r.reservation_time, 1, 10) ELSE d.date END as at_date,
             CASE WHEN r.reservation_time GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*' THEN substr(r.reservation_time, 12) ELSE r.reservation_time END as at_time
      FROM reservations r
      JOIN visible_trips tr ON tr.id = r.trip_id
      LEFT JOIN days d ON r.day_id = d.id
      LEFT JOIN places p ON r.place_id = p.id
      WHERE r.status != 'cancelled'
        AND COALESCE(r.type, '') != 'hotel'

      UNION ALL

      SELECT a.id, a.trip_id,
             COALESCE(p.name, (SELECT res.title FROM reservations res
                                WHERE CAST(res.accommodation_id AS INTEGER) = a.id
                                  AND res.status != 'cancelled'
                                ORDER BY res.id LIMIT 1), tr.title) as title,
             'checkin' as type, 'confirmed' as status, NULL as location,
             CASE WHEN a.check_in IS NOT NULL THEN d.date || 'T' || a.check_in END as reservation_time,
             a.confirmation as confirmation_number,
             tr.title as trip_title, tr.cover_image as trip_cover,
             d.date as day_date, p.name as place_name, p.image_url as place_image,
             d.date as at_date, a.check_in as at_time
      FROM day_accommodations a
      JOIN visible_trips tr ON tr.id = a.trip_id
      JOIN days d ON d.id = a.start_day_id
      LEFT JOIN places p ON p.id = a.place_id

      UNION ALL

      SELECT a.id, a.trip_id,
             COALESCE(p.name, (SELECT res.title FROM reservations res
                                WHERE CAST(res.accommodation_id AS INTEGER) = a.id
                                  AND res.status != 'cancelled'
                                ORDER BY res.id LIMIT 1), tr.title) as title,
             'checkout' as type, 'confirmed' as status, NULL as location,
             CASE WHEN a.check_out IS NOT NULL THEN d.date || 'T' || a.check_out END as reservation_time,
             a.confirmation as confirmation_number,
             tr.title as trip_title, tr.cover_image as trip_cover,
             d.date as day_date, p.name as place_name, p.image_url as place_image,
             d.date as at_date, a.check_out as at_time
      FROM day_accommodations a
      JOIN visible_trips tr ON tr.id = a.trip_id
      JOIN days d ON d.id = a.end_day_id
      LEFT JOIN places p ON p.id = a.place_id
    )
    SELECT id, trip_id, title, type, status, location, reservation_time,
           confirmation_number, trip_title, trip_cover, day_date, place_name, place_image
    FROM entries
    WHERE at_date IS NOT NULL
      AND (at_date > ? OR (at_date = ? AND COALESCE(at_time, '23:59') >= ?))
    ORDER BY at_date ASC, COALESCE(at_time, '00:00') ASC, id ASC
    LIMIT ?
  `;

function legacyListUpcoming(userId: number, today: string, nowHHMM: string, limit: number) {
  return testDb.prepare(LEGACY_LIST_UPCOMING).all(userId, userId, today, today, nowHHMM, limit);
}

describe('ReservationsRepository — RS20 (listUpcomingForUser)', () => {
  /**
   * One fully seeded world — owner + member + archived + hidden trips, a
   * mixed-type/mixed-shape reservation set, a NAMED stay and a NAMELESS one
   * whose only booking's `accommodation_id` is written in the `"<id>.0"`
   * TEXT shape (§18.1) — run against 5 `(today, now, limit)` settings,
   * including one where two bookings tie on `(at_date, at_time)` so the
   * `id` tiebreak is load-bearing, and one where `limit` cuts the result
   * strictly inside that tie.
   */
  it('RS20-001..005: matches the legacy CTE statement across 5 (today, now, limit) settings, incl. the cross-table id tiebreak and a limit straddling a tie', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);

    const tripOwned = createTrip(testDb, owner.id, { start_date: '2999-01-01', end_date: '2999-01-10' });
    const tripMember = createTrip(testDb, stranger.id, { start_date: '2999-01-01', end_date: '2999-01-05' });
    addTripMember(testDb, tripMember.id, owner.id);
    const tripHidden = createTrip(testDb, stranger.id, { start_date: '2999-01-01', end_date: '2999-01-05' });
    const tripArchived = createTrip(testDb, owner.id, { start_date: '2999-01-01', end_date: '2999-01-05' });
    testDb.prepare('UPDATE trips SET is_archived = 1 WHERE id = ?').run(tripArchived.id);

    // Two bookings on the SAME date+time — the (at_date, at_time) tie the
    // `id ASC` tiebreak has to resolve, in insertion (id) order.
    const tie1 = createReservation(testDb, tripOwned.id, { title: 'Tie 1' });
    testDb.prepare('UPDATE reservations SET reservation_time = ? WHERE id = ?').run('2999-01-02T09:00:00', tie1.id);
    const tie2 = createReservation(testDb, tripOwned.id, { title: 'Tie 2' });
    testDb.prepare('UPDATE reservations SET reservation_time = ? WHERE id = ?').run('2999-01-02T09:00:00', tie2.id);

    // Excluded regardless of settings: cancelled, and a hotel-typed booking
    // dated through its own reservation_time.
    const cancelled = createReservation(testDb, tripOwned.id, { title: 'Cancelled' });
    testDb.prepare("UPDATE reservations SET reservation_time = ?, status = 'cancelled' WHERE id = ?").run('2999-01-03T10:00:00', cancelled.id);
    const hotelDated = createReservation(testDb, tripOwned.id, { title: 'Hotel dated', type: 'hotel' });
    testDb.prepare('UPDATE reservations SET reservation_time = ? WHERE id = ?').run('2999-01-03T10:00:00', hotelDated.id);

    // A NULL-typed booking still shows.
    const untyped = createReservation(testDb, tripOwned.id, { title: 'Untyped' });
    testDb.prepare('UPDATE reservations SET type = NULL, reservation_time = ? WHERE id = ?').run('2999-01-04T10:00:00', untyped.id);

    // A bare-clock, day-anchored booking.
    const bareDay = createDay(testDb, tripOwned.id, { date: '2999-01-05' });
    const bareClock = createReservation(testDb, tripOwned.id, { title: 'Bare clock', day_id: bareDay.id });
    testDb.prepare('UPDATE reservations SET reservation_time = ? WHERE id = ?').run('07:00', bareClock.id);

    // A member-trip booking.
    const memberBooking = createReservation(testDb, tripMember.id, { title: 'Member trip' });
    testDb.prepare('UPDATE reservations SET reservation_time = ? WHERE id = ?').run('2999-01-02T12:00:00', memberBooking.id);

    // A hidden-trip booking — must never appear.
    const hiddenBooking = createReservation(testDb, tripHidden.id, { title: 'Hidden' });
    testDb.prepare('UPDATE reservations SET reservation_time = ? WHERE id = ?').run('2999-01-02T08:00:00', hiddenBooking.id);

    // A NAMED stay (check-in + check-out).
    const namedPlace = createPlace(testDb, tripOwned.id, { name: 'The Plaza' });
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(tripOwned.id) as { id: number }[];
    createDayAccommodation(testDb, tripOwned.id, namedPlace.id, days[5].id, days[7].id, { check_in: '15:00', check_out: '11:00' });

    // A NAMELESS stay whose only (cancelled-excluded) booking's
    // accommodation_id is stored in the "<id>.0" TEXT shape.
    const namelessAcc = testDb.prepare(
      'INSERT INTO day_accommodations (trip_id, place_id, start_day_id, end_day_id, check_in, check_out) VALUES (?, NULL, ?, ?, ?, ?)',
    ).run(tripOwned.id, days[5].id, days[6].id, '16:00', '10:00');
    const namelessId = namelessAcc.lastInsertRowid as number;
    const namelessBooking = createReservation(testDb, tripOwned.id, { title: 'Hotel Ibis', type: 'hotel' });
    testDb.prepare('UPDATE reservations SET accommodation_id = ? WHERE id = ?').run(`${namelessId}.0`, namelessBooking.id);

    const settings: [string, string, number][] = [
      ['2000-01-01', '2000-01-01T00:00', 20], // far past today — everything future-dated shows
      ['2999-01-02', '2999-01-02T09:00', 20], // exactly on the tie moment — inclusive, both tie rows stay
      ['2999-01-02', '2999-01-02T09:01', 20], // one minute past the tie — both tie rows drop
      ['2000-01-01', '2000-01-01T00:00', 3], // straddles the tie: limit cuts inside the tied pair
      ['2999-06-01', '2999-06-01T00:00', 20], // nothing left — empty result
    ];

    for (const [today, nowHHMM, limit] of settings) {
      const typed = await reservationsRepo.listUpcomingForUser(owner.id, today, nowHHMM, limit);
      const legacy = legacyListUpcoming(owner.id, today, nowHHMM, limit);
      expect(typed).toEqual(legacy);
    }

    // Sanity — the first setting's shape is what the matrix above claims:
    // hidden/archived excluded, cancelled/hotel-dated excluded, the tie
    // resolves in id order, the nameless stay reads its title off the
    // linked "<id>.0" booking.
    const baseline = await reservationsRepo.listUpcomingForUser(owner.id, '2000-01-01', '2000-01-01T00:00', 20);
    expect(baseline.map((r) => r.title)).not.toContain('Hidden');
    const tieIndex = baseline.findIndex((r) => r.title === 'Tie 1');
    expect(baseline[tieIndex + 1]?.title).toBe('Tie 2');
    expect(baseline.some((r) => r.title === 'Hotel Ibis')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// M3 (Plan 3d Task 7 whole-plan review): AC37/AC40 reverted to the legacy
// REAL-bound compare (parity is law — the widening had no reason to exist
// once H1 makes every write in this cluster store the legacy `'<id>.0'`
// shape). Pinned against the SAME five-shape matrix the review measured.
// ─────────────────────────────────────────────────────────────────────────────

describe('ReservationsRepository — AC37/AC40 (listIdMetadataByStay/listIdsByStay), M3', () => {
  it('AC37/AC40 match the legacy REAL-bound compare — only the "<id>.0" TEXT shape resolves, not the bare integer, a trailing/leading space or a prefix-numeric value', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-05' });
    const place = createPlace(testDb, trip.id);
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as { id: number }[];
    const stay = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);

    // `shapes[1]` ('<id>.0') is the ONLY one the legacy `Number(id)` bind —
    // and this repository's own reverted compare — ever matched.
    const shapes = [
      `${stay.id}`,
      `${stay.id}.0`,
      `${stay.id} `,
      `${stay.id}abc`,
      ` ${stay.id}`,
    ];
    const ids = shapes.map((shape, i) => {
      const r = createReservation(testDb, trip.id, { title: `Link ${i}`, type: 'hotel' });
      testDb.prepare('UPDATE reservations SET accommodation_id = ? WHERE id = ?').run(shape, r.id);
      return r.id;
    });

    const typedMeta = await reservationsRepo.listIdMetadataByStay(stay.id);
    const legacyMeta = testDb.prepare('SELECT id, metadata FROM reservations WHERE accommodation_id = ?').all(stay.id) as { id: number; metadata: string | null }[];
    expect(typedMeta).toEqual(legacyMeta);
    expect(typedMeta.map((r) => r.id)).toEqual([ids[1]]);

    const typedIds = await reservationsRepo.listIdsByStay(stay.id);
    const legacyIds = testDb.prepare('SELECT id FROM reservations WHERE accommodation_id = ?').all(stay.id) as { id: number }[];
    expect(typedIds).toEqual(legacyIds);
    expect(typedIds.map((r) => r.id)).toEqual([ids[1]]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Plan 3d Task 7 whole-plan review, item 9 ("missing parity tests"): Task 2's
// own `ReservationsRepository` reads (`listForTrip`, `findWithJoins`,
// `findInTrip`, `listResyncCandidates`, `listForRestamp`) had no
// repository-level parity test — they rested on the reservations.service
// REAL-LEGACY suite only. ONE seeded world, one `toEqual(<legacy raw>)`
// test per method.
// ─────────────────────────────────────────────────────────────────────────────

describe('ReservationsRepository — Task 2 reads (listForTrip / findWithJoins / findInTrip / listResyncCandidates / listForRestamp)', () => {
  const legacyJoinedSql = `
    SELECT r.*, d.day_number as day_number, p.name as place_name, ap.place_id as accommodation_place_id,
      acc_p.name as accommodation_name, ap.start_day_id as accommodation_start_day_id, ap.end_day_id as accommodation_end_day_id
    FROM reservations r
    LEFT JOIN days d ON d.id = r.day_id
    LEFT JOIN places p ON p.id = r.place_id
    LEFT JOIN day_accommodations ap ON ap.id = r.accommodation_id
    LEFT JOIN places acc_p ON acc_p.id = ap.place_id`;

  const seed = () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-05' });
    const place = createPlace(testDb, trip.id, { name: 'Museum' });
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as { id: number }[];
    const hotelPlace = createPlace(testDb, trip.id, { name: 'Grand Hotel' });
    const stay = createDayAccommodation(testDb, trip.id, hotelPlace.id, days[0].id, days[1].id);

    // A dated, non-hotel booking — a restamp/resync candidate.
    const dinner = createReservation(testDb, trip.id, { title: 'Dinner', type: 'restaurant', day_id: days[0].id });
    testDb.prepare("UPDATE reservations SET reservation_time = ? WHERE id = ?").run('2026-09-01T19:00', dinner.id);

    // A hotel booking linked to the stay above — the joined projection's place/accommodation columns.
    const hotel = createReservation(testDb, trip.id, { title: 'Grand Hotel Stay', type: 'hotel', day_id: days[0].id });
    testDb.prepare('UPDATE reservations SET accommodation_id = ?, place_id = ? WHERE id = ?').run(`${stay.id}.0`, place.id, hotel.id);

    return { trip, days, place, hotelPlace, stay, dinner, hotel };
  };

  it('RS18 listForTrip — matches the legacy joined statement, ordered by reservation_time then created_at', async () => {
    const { trip } = seed();
    const legacy = testDb.prepare(`${legacyJoinedSql} WHERE r.trip_id = ? ORDER BY r.reservation_time ASC, r.created_at ASC`).all(trip.id);
    const typed = await reservationsRepo.listForTrip(trip.id);
    expect(typed).toEqual(legacy);
  });

  it('RR1 findWithJoins — matches the legacy joined statement for one row, place/accommodation columns populated', async () => {
    const { hotel, stay, hotelPlace } = seed();
    const legacy = testDb.prepare(`${legacyJoinedSql} WHERE r.id = ?`).get(hotel.id);
    const typed = await reservationsRepo.findWithJoins(hotel.id);
    expect(typed).toEqual(legacy);
    expect(typed).toMatchObject({ accommodation_place_id: hotelPlace.id, accommodation_name: hotelPlace.name, accommodation_start_day_id: stay.start_day_id });
  });

  it('RS35 findInTrip — matches the legacy statement, scoped by trip', async () => {
    const { trip, dinner } = seed();
    const legacy = testDb.prepare('SELECT * FROM reservations WHERE id = ? AND trip_id = ?').get(dinner.id, trip.id);
    expect(await reservationsRepo.findInTrip(dinner.id, trip.id)).toEqual(legacy);
    expect(await reservationsRepo.findInTrip(999999, trip.id)).toBeUndefined();
  });

  it('RS12 listResyncCandidates — matches the legacy statement (dated, non-hotel-or-unlinked)', async () => {
    const { trip, dinner } = seed();
    const legacy = testDb.prepare(`
      SELECT id, reservation_time, reservation_end_time, day_id, end_day_id FROM reservations
      WHERE trip_id = ? AND (type != 'hotel' OR accommodation_id IS NULL) AND reservation_time IS NOT NULL`).all(trip.id);
    const typed = await reservationsRepo.listResyncCandidates(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => r.id)).toEqual([dinner.id]);
  });

  it('DY14 listForRestamp — matches the legacy statement, every reservation of the trip regardless of type', async () => {
    const { trip, dinner, hotel } = seed();
    const legacy = testDb.prepare('SELECT id, day_id, end_day_id, reservation_time, reservation_end_time FROM reservations WHERE trip_id = ?').all(trip.id);
    const typed = await reservationsRepo.listForRestamp(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => r.id).sort((a, b) => a - b)).toEqual([dinner.id, hotel.id].sort((a, b) => a - b));
  });
});

// ---------------------------------------------------------------------------
// Plan 3h Task 7 review, M1 coverage — the AirTrail leaf's writes/reads,
// untested at the repository level (the airtrail-link/sync service tests
// stub this repository).
// ---------------------------------------------------------------------------

describe('ReservationsRepository — AirTrail leaf (ATL1/ATL2/ATL4, airports)', () => {
  it('ATL1 linkAirtrailSingleFlight — stamps every AirTrail column and switches sync on, matching the legacy statement', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const res = createReservation(testDb, trip.id, { title: 'Flight', type: 'flight' });

    await reservationsRepo.linkAirtrailSingleFlight(res.id, 'AT-42', user.id, 'hash-1', '2026-09-24T10:00:00Z');

    const row = testDb.prepare(
      "SELECT external_source, external_id, external_owner_user_id, sync_enabled, external_hash, external_synced_at FROM reservations WHERE id = ?",
    ).get(res.id);
    expect(row).toEqual({
      external_source: 'airtrail', external_id: 'AT-42', external_owner_user_id: user.id,
      sync_enabled: 1, external_hash: 'hash-1', external_synced_at: '2026-09-24T10:00:00Z',
    });
  });

  it('ATL2 setAirtrailSyncDisabled — turns sync_enabled off, matching the legacy statement, and leaves every other column alone', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const res = createReservation(testDb, trip.id, { title: 'Flight', type: 'flight' });
    await reservationsRepo.linkAirtrailSingleFlight(res.id, 'AT-42', user.id, 'hash-1', '2026-09-24T10:00:00Z');

    await reservationsRepo.setAirtrailSyncDisabled(res.id);

    const row = testDb.prepare('SELECT sync_enabled, external_id FROM reservations WHERE id = ?').get(res.id);
    expect(row).toEqual({ sync_enabled: 0, external_id: 'AT-42' });
  });

  it('ATL4 findAirtrailLinked — matches the legacy statement, scoped to external_source = \'airtrail\' (a plain flight misses)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const linked = createReservation(testDb, trip.id, { title: 'Flight', type: 'flight' });
    await reservationsRepo.linkAirtrailSingleFlight(linked.id, 'AT-7', user.id, 'hash-2', '2026-09-24T11:00:00Z');
    const plain = createReservation(testDb, trip.id, { title: 'Dinner', type: 'restaurant' });

    const legacy = testDb.prepare(
      "SELECT id, trip_id, external_id, external_owner_user_id, sync_enabled FROM reservations WHERE id = ? AND external_source = 'airtrail'",
    ).get(linked.id);
    expect(await reservationsRepo.findAirtrailLinked(linked.id)).toEqual(legacy);
    expect(await reservationsRepo.findAirtrailLinked(plain.id)).toBeUndefined();
  });

  it('markNeedsReview (airports) — sets needs_review, matching the legacy statement', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const res = createReservation(testDb, trip.id, { title: 'Flight', type: 'flight' });
    expect((testDb.prepare('SELECT needs_review FROM reservations WHERE id = ?').get(res.id) as { needs_review: number }).needs_review).toBe(0);

    await reservationsRepo.markNeedsReview(res.id);

    expect((testDb.prepare('SELECT needs_review FROM reservations WHERE id = ?').get(res.id) as { needs_review: number }).needs_review).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Plan 4 Task 8b-2, item 1 (3d Task 7 review's "share/public-api ×8 reads",
// `phase3d-reports/task-7-review.md`'s "Parity tests: read models with no
// full-key `toEqual(<legacy raw>)`" list): `share.service.ts`'s 4 reads
// (SH-family: listEndpointsForShare, listDayPositionsForShare,
// listPublicForShare, listPublicAccommodationsForShare) and
// `public-api.service.ts`'s 4 reads (listScheduledForPublicApi,
// listUnscheduledForPublicApi, listAccommodationsForPublicApi,
// listUnplannedPlacesForPublicApi) — service-level coverage only until now.
// ONE seeded world per describe block, `toEqual(<legacy raw>)` per method.
// ─────────────────────────────────────────────────────────────────────────────

const insertReservationEndpoint = (
  reservationId: number,
  role: string,
  sequence: number,
  overrides: Partial<{ name: string; code: string | null; lat: number; lng: number; timezone: string | null; local_time: string | null; local_date: string | null }> = {},
) => {
  testDb.prepare(`
    INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, code, lat, lng, timezone, local_time, local_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    reservationId, role, sequence,
    overrides.name ?? `${role} endpoint`, overrides.code ?? null, overrides.lat ?? 48.0, overrides.lng ?? 11.0,
    overrides.timezone ?? null, overrides.local_time ?? null, overrides.local_date ?? null,
  );
};

const insertDayPosition = (reservationId: number, dayId: number, position: number) => {
  testDb.prepare('INSERT INTO reservation_day_positions (reservation_id, day_id, position) VALUES (?, ?, ?)')
    .run(reservationId, dayId, position);
};

describe('ReservationsRepository — share.service.ts reads (SH-family)', () => {
  it('listEndpointsForShare — matches the legacy JOIN, ordered by reservation then sequence, scoped by trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const flight = createReservation(testDb, trip.id, { title: 'Flight', type: 'flight' });
    insertReservationEndpoint(flight.id, 'from', 1, { name: 'JFK', code: 'JFK', lat: 40.6, lng: -73.7, timezone: 'America/New_York', local_time: '10:00', local_date: '2026-09-01' });
    insertReservationEndpoint(flight.id, 'to', 0, { name: 'MUC', code: null, lat: 48.35, lng: 11.78, timezone: null, local_time: null, local_date: null });
    const foreign = createReservation(testDb, other.id, { title: 'Foreign', type: 'flight' });
    insertReservationEndpoint(foreign.id, 'from', 0, { name: 'LHR' });

    const legacy = testDb.prepare(`
      SELECT e.reservation_id, e.role, e.sequence, e.name, e.code, e.lat, e.lng, e.timezone, e.local_date, e.local_time
      FROM reservation_endpoints e JOIN reservations r ON r.id = e.reservation_id
      WHERE r.trip_id = ? ORDER BY e.reservation_id ASC, e.sequence ASC`).all(trip.id);

    const typed = await reservationsRepo.listEndpointsForShare(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((e) => e.sequence)).toEqual([0, 1]);
  });

  it('listDayPositionsForShare — matches the legacy JOIN, scoped by trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-03' });
    const other = createTrip(testDb, user.id);
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as { id: number }[];
    const res = createReservation(testDb, trip.id, { title: 'Multi-day rental', type: 'car_rental' });
    insertDayPosition(res.id, days[0].id, 0);
    insertDayPosition(res.id, days[1].id, 1);
    const foreignRes = createReservation(testDb, other.id, { title: 'Foreign', type: 'car_rental' });
    testDb.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, 1, ?)').run(other.id, '2026-01-01');
    const foreignDay = testDb.prepare('SELECT id FROM days WHERE trip_id = ?').get(other.id) as { id: number };
    insertDayPosition(foreignRes.id, foreignDay.id, 0);

    const legacy = testDb.prepare(`
      SELECT rdp.reservation_id, rdp.day_id, rdp.position
      FROM reservation_day_positions rdp JOIN reservations r ON r.id = rdp.reservation_id
      WHERE r.trip_id = ?`).all(trip.id);

    const typed = await reservationsRepo.listDayPositionsForShare(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.length).toBe(2);
  });

  it('listPublicForShare — matches the legacy statement, live bookings only, staged excluded', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-03' });
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as { id: number }[];
    const place = createPlace(testDb, trip.id);
    const live = createReservation(testDb, trip.id, { title: 'Live', type: 'flight', day_id: days[0].id });
    testDb.prepare(`UPDATE reservations SET end_day_id = ?, place_id = ?, accommodation_id = NULL, status = 'confirmed',
      location = ?, reservation_time = ?, reservation_end_time = ?, notes = ?, url = ?, metadata = ? WHERE id = ?`)
      .run(days[1].id, place.id, 'Gate 4', '2026-09-01T10:00', '2026-09-01T12:00', 'note', 'https://example.com', '{"k":"v"}', live.id);
    const staged = createReservation(testDb, trip.id, { title: 'Staged', type: 'flight' });
    testDb.prepare("UPDATE reservations SET ingest_state = 'staged' WHERE id = ?").run(staged.id);

    const legacy = testDb.prepare(`
      SELECT id, trip_id, day_id, end_day_id, place_id, accommodation_id, title, type, status, location,
             reservation_time, reservation_end_time, notes, url, metadata, created_at
      FROM reservations WHERE trip_id = ? AND ${publicReservationSql('reservations')}
      ORDER BY reservation_time ASC`).all(trip.id);

    const typed = await reservationsRepo.listPublicForShare(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => r.id)).toEqual([live.id]);
  });

  it('listPublicAccommodationsForShare — matches the legacy statement, only stays with a public booking (or none) are included', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-05' });
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as { id: number }[];
    const place = createPlace(testDb, trip.id, { name: 'Grand Hotel' });
    const noBooking = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id, { check_in: '15:00', check_out: '11:00' });
    const liveLinked = createDayAccommodation(testDb, trip.id, place.id, days[2].id, days[3].id);
    const liveBooking = createReservation(testDb, trip.id, { title: 'Live', type: 'hotel' });
    testDb.prepare('UPDATE reservations SET accommodation_id = ? WHERE id = ?').run(String(liveLinked.id), liveBooking.id);
    const stagedOnly = createDayAccommodation(testDb, trip.id, place.id, days[3].id, days[4].id);
    const stagedBooking = createReservation(testDb, trip.id, { title: 'Staged', type: 'hotel' });
    testDb.prepare("UPDATE reservations SET accommodation_id = ?, ingest_state = 'staged' WHERE id = ?").run(String(stagedOnly.id), stagedBooking.id);

    const legacy = testDb.prepare(`
      SELECT a.id, a.trip_id, a.place_id, a.start_day_id, a.end_day_id, a.check_in, a.check_in_end, a.check_out, a.notes,
             p.name as place_name, p.address as place_address, p.lat as place_lat, p.lng as place_lng
      FROM day_accommodations a JOIN places p ON p.id = a.place_id
      WHERE a.trip_id = ? AND ${publicStaySql('a')}`).all(trip.id);

    const typed = await reservationsRepo.listPublicAccommodationsForShare(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((s) => s.id).sort((a, b) => a - b)).toEqual([noBooking.id, liveLinked.id].sort((a, b) => a - b));
  });

  it('listPublicStayPlaceIdsForShare — matches the legacy DISTINCT read, hand-added and live-booked stays in, staged-booked stays out', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const otherDay = createDay(testDb, other.id);
    const handAdded = createPlace(testDb, trip.id, { name: 'Hand added' });
    const live = createPlace(testDb, trip.id, { name: 'Live booking' });
    const staged = createPlace(testDb, trip.id, { name: 'Staged booking' });
    const elsewhere = createPlace(testDb, other.id, { name: 'Other trip' });
    createDayAccommodation(testDb, trip.id, handAdded.id, day.id, day.id);
    // Two nights at the same place: DISTINCT folds them into one id.
    createDayAccommodation(testDb, trip.id, handAdded.id, day.id, day.id);
    const liveStay = createDayAccommodation(testDb, trip.id, live.id, day.id, day.id);
    const stagedStay = createDayAccommodation(testDb, trip.id, staged.id, day.id, day.id);
    createDayAccommodation(testDb, other.id, elsewhere.id, otherDay.id, otherDay.id);
    const liveRes = createReservation(testDb, trip.id, { type: 'hotel', title: 'Live' });
    const stagedRes = createReservation(testDb, trip.id, { type: 'hotel', title: 'Staged' });
    testDb.prepare('UPDATE reservations SET accommodation_id = ? WHERE id = ?').run(String(liveStay.id), liveRes.id);
    testDb.prepare("UPDATE reservations SET accommodation_id = ?, ingest_state = 'staged' WHERE id = ?").run(String(stagedStay.id), stagedRes.id);

    const legacy = (testDb.prepare(`
      SELECT DISTINCT a.place_id FROM day_accommodations a
      WHERE a.trip_id = ? AND ${publicStaySql('a')}`).all(trip.id) as { place_id: number }[]).map((r) => r.place_id);

    const typed = await reservationsRepo.listPublicStayPlaceIdsForShare(trip.id);
    expect([...typed].sort((a, b) => a - b)).toEqual([...legacy].sort((a, b) => a - b));
    expect([...typed].sort((a, b) => a - b)).toEqual([handAdded.id, live.id].sort((a, b) => a - b));
  });
});

describe('ReservationsRepository — public-api.service.ts reads', () => {
  it('listScheduledForPublicApi — matches the legacy statement, scoped by trip, ordered by day then time', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-03' });
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as { id: number }[];
    const scheduled = createReservation(testDb, trip.id, { title: 'Dinner', type: 'restaurant', day_id: days[0].id });
    testDb.prepare("UPDATE reservations SET reservation_time = ?, location = ?, notes = ? WHERE id = ?").run('2026-09-01T19:00', 'Downtown', 'window seat', scheduled.id);
    createReservation(testDb, trip.id, { title: 'Unscheduled', type: 'restaurant' });

    const legacy = testDb.prepare(`
      SELECT day_id, type, title, location, reservation_time, reservation_end_time, status, notes
      FROM reservations WHERE trip_id = ? AND day_id IS NOT NULL
      ORDER BY day_id ASC, reservation_time ASC`).all(trip.id);

    const typed = await reservationsRepo.listScheduledForPublicApi(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.length).toBe(1);
  });

  it('listUnscheduledForPublicApi — matches the legacy statement, day_id IS NULL only', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-02' });
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as { id: number }[];
    const unscheduled = createReservation(testDb, trip.id, { title: 'Unscheduled', type: 'restaurant' });
    testDb.prepare("UPDATE reservations SET reservation_time = NULL, location = ?, notes = ? WHERE id = ?").run(null, null, unscheduled.id);
    createReservation(testDb, trip.id, { title: 'Scheduled', type: 'restaurant', day_id: days[0].id });

    const legacy = testDb.prepare(`
      SELECT type, title, location, reservation_time, reservation_end_time, status, notes
      FROM reservations WHERE trip_id = ? AND day_id IS NULL
      ORDER BY reservation_time ASC, id ASC`).all(trip.id);

    const typed = await reservationsRepo.listUnscheduledForPublicApi(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => r.title)).toEqual(['Unscheduled']);
  });

  it('listAccommodationsForPublicApi — matches the legacy LEFT JOIN statement, ordered by start date', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-05' });
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as { id: number }[];
    const place = createPlace(testDb, trip.id, { name: 'Grand Hotel' });
    createDayAccommodation(testDb, trip.id, place.id, days[2].id, days[3].id, { check_in: '15:00', check_out: '11:00' });
    createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);

    const legacy = testDb.prepare(`
      SELECT p.name, p.address, p.lat, p.lng, ds.date as start_date, de.date as end_date, a.check_in, a.check_out, a.notes
      FROM day_accommodations a
      LEFT JOIN places p ON p.id = a.place_id
      LEFT JOIN days ds ON ds.id = a.start_day_id
      LEFT JOIN days de ON de.id = a.end_day_id
      WHERE a.trip_id = ? ORDER BY ds.date ASC`).all(trip.id) as { start_date: string | null }[];

    const typed = await reservationsRepo.listAccommodationsForPublicApi(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((a) => a.start_date)).toEqual([legacy[0].start_date, legacy[1].start_date]);
  });

  it('listUnplannedPlacesForPublicApi — matches the legacy NOT EXISTS statement, excluding assigned and staying places', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-02' });
    const days = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(trip.id) as { id: number }[];
    const unplanned = createPlace(testDb, trip.id, { name: 'Unplanned Cafe' });
    const assigned = createPlace(testDb, trip.id, { name: 'Assigned Museum' });
    createDayAssignment(testDb, days[0].id, assigned.id);
    const staying = createPlace(testDb, trip.id, { name: 'Hotel' });
    createDayAccommodation(testDb, trip.id, staying.id, days[0].id, days[1].id);

    const legacy = testDb.prepare(`
      SELECT p.name, p.address, p.lat, p.lng, p.place_time, p.end_time, p.duration_minutes, p.notes, p.transport_mode, c.name as category
      FROM places p LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.trip_id = ?
        AND NOT EXISTS (SELECT 1 FROM day_assignments da WHERE da.place_id = p.id)
        AND NOT EXISTS (SELECT 1 FROM day_accommodations a WHERE a.place_id = p.id)
      ORDER BY p.created_at ASC, p.id ASC`).all(trip.id);

    const typed = await reservationsRepo.listUnplannedPlacesForPublicApi(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((p) => p.name)).toEqual([unplanned.name]);
  });
});
