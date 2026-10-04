import type { Reservations } from '../entities/Reservations.entity';
import { DayAssignments } from '../entities/DayAssignments.entity';
import { Days } from '../entities/Days.entity';
import { castIntegerKysely, coalesceOverride, columnRef, concatKysely, dayDistance, startsWithIsoDateKysely, substringKysely } from '../dialect/sql-functions';
import { publicReservationExpr, publicStayExists, type ReservationVisibilityKyselyDB } from './_shared/reservation-visibility';
import type { DayAssignmentRow } from './DayAssignments.repository';
import { TrekRepository } from './_shared/trek-repository';

/**
 * RS18/RR1's shared joined projection — `SELECT r.*, d.day_number, p.name as
 * place_name, r.assignment_id, ap.place_id as accommodation_place_id,
 * acc_p.name as accommodation_name, ap.start_day_id as
 * accommodation_start_day_id, ap.end_day_id as accommodation_end_day_id FROM
 * reservations r LEFT JOIN days d ON r.day_id = d.id LEFT JOIN places p ON
 * r.place_id = p.id LEFT JOIN day_accommodations ap ON r.accommodation_id =
 * ap.id LEFT JOIN places acc_p ON ap.place_id = acc_p.id`. The service
 * folds `accommodation_id` (`Math.trunc(Number(x))`), `day_positions`,
 * `endpoints` and `travelers` on afterward (unchanged from the legacy split).
 */
export interface ReservationJoinRow {
  id: number;
  trip_id: number;
  day_id: number | null;
  end_day_id: number | null;
  place_id: number | null;
  assignment_id: number | null;
  title: string;
  accommodation_id: string | null;
  reservation_time: string | null;
  reservation_end_time: string | null;
  location: string | null;
  confirmation_number: string | null;
  notes: string | null;
  status: string | null;
  type: string | null;
  created_at: string | null;
  metadata: string | null;
  day_plan_position: number | null;
  needs_review: number;
  external_source: string | null;
  external_id: string | null;
  external_owner_user_id: number | null;
  external_synced_at: string | null;
  sync_enabled: number | null;
  external_hash: string | null;
  url: string | null;
  ingest_state: string;
  day_number: number | null;
  place_name: string | null;
  accommodation_place_id: number | null;
  accommodation_name: string | null;
  accommodation_start_day_id: number | null;
  accommodation_end_day_id: number | null;
}

/**
 * Kysely typing for the RS18/RR1 join (`joinedQuery` below) — `reservations
 * .accommodation_id` is a bare `p.text().nullable()` column with no FK to
 * `day_accommodations` (§18.1 of the inventory), so the QueryBuilder's
 * relation-path `.join()` cannot express `LEFT JOIN day_accommodations ap ON
 * r.accommodation_id = ap.id` at all — the same escape hatch
 * `DayAssignmentsRepository.effectiveStart`/`TripsRepository.tripSelectQuery`
 * use. `id`/`trip_id` stay `number | string` (raw-bind, D4's T5 seam): a
 * Kysely `.where(col, '=', value)` call is a TYPED condition regardless of
 * how loosely its value is typed (program rule 23 bans a raw SQL-text
 * condition string, not a loosely-typed bound value), so this join keeps the
 * legacy statement's exact raw-bind flexibility.
 */
interface ReservationJoinKyselyDB {
  reservations: {
    id: number | string;
    trip_id: number | string;
    day_id: number | null;
    end_day_id: number | null;
    place_id: number | null;
    assignment_id: number | null;
    title: string;
    accommodation_id: string | null;
    reservation_time: string | null;
    reservation_end_time: string | null;
    location: string | null;
    confirmation_number: string | null;
    notes: string | null;
    status: string | null;
    type: string | null;
    created_at: string | null;
    metadata: string | null;
    day_plan_position: number | null;
    needs_review: number;
    external_source: string | null;
    external_id: string | null;
    external_owner_user_id: number | null;
    external_synced_at: string | null;
    sync_enabled: number | null;
    external_hash: string | null;
    url: string | null;
    ingest_state: string;
  };
  days: { id: number; day_number: number };
  places: { id: number; name: string };
  day_accommodations: { id: number; place_id: number | null; start_day_id: number; end_day_id: number };
}

/**
 * Kysely typing for `restampLinkedReservation` (DY23). `accommodation_id:
 * string | number | null` — R2's ruling: the legacy statement binds `accId`
 * (a plain JS `number`, `stay.id`) straight into the `:accId` named param
 * compared against the TEXT column, so this method's caller passes the SAME
 * number, unconverted, and the interface is widened only so that bind
 * type-checks (SQLite applies its own TEXT-affinity conversion at compare
 * time regardless of which JS type bound the value — see the method's own
 * docstring).
 */
interface ReservationRestampKyselyDB {
  reservations: {
    id: number;
    accommodation_id: string | number | null;
    type: string | null;
    day_id: number | null;
    reservation_time: string | null;
  };
}

/**
 * Kysely typing for AC37/AC40 (`listIdMetadataByStay`/`listIdsByStay`).
 *
 * **Revert to the REAL-bound compare (Plan 3d Task 7 whole-plan review, M3;
 * corrects this docstring's earlier claim).** A bound-parameter `WHERE
 * accommodation_id = ?` with a plain JS `number` is EXACTLY the comparison
 * the legacy statement's own `Number(id)` bind produced: `better-sqlite3`
 * binds every plain JS number as SQLite REAL, integer-valued or not
 * (`typeof(?)` on a bound `14` reads back `'real'`) — including through
 * MikroORM's Kysely dialect — and SQLite's TEXT-affinity conversion of a
 * REAL for a comparison renders its decimal form (`14` → `'14.0'`), so a
 * bound `WHERE accommodation_id = ?` matches `'14.0'` ONLY, same as the
 * legacy statement — never `'14'`. The earlier version of this docstring
 * claimed the opposite (that `em.insert()`/`nativeUpdate()` calls in this
 * cluster store the bare `'14'` shape and a REAL-bound compare would
 * therefore miss them): that was true only because RS28/RS41
 * (`reservations.service.ts`, outside this repository) used to write
 * `String(n)` instead of the legacy's REAL-bound shape (H1, the same
 * review). H1 fixes every write in this cluster to store `'<id>.0'`
 * (`legacyBoundIntegerText`), so the widening below has no remaining
 * reason to exist, and parity is law once it doesn't: `CAST(accommodation_id
 * AS INTEGER) = ?` (via {@link castIntegerKysely}) matches `'14'`, `'14.0'`,
 * `'14 '` and `'14abc'` alike — a WIDER row set than the legacy's own
 * `'14.0'`-only compare (measured, task-7-review.md M3) — which is an
 * unpinned parity break, not a fix, on a read the legacy also bound
 * `Number(id)` for. `castIntegerKysely` stays in use elsewhere in this file
 * (RS20/RV2's correlated subqueries) where the legacy statement's OWN
 * comparison used a `CAST`, not a bound number — this interface's two
 * consumers are not that case.
 */
interface ReservationsByAccommodationKyselyDB {
  reservations: {
    id: number;
    // `string | number | null`, not just `string` (R2's ruling, the same
    // widening {@link ReservationRestampKyselyDB} documents for DY23): the
    // column is TEXT, but the bind below is a plain `number`, matching the
    // legacy's own `Number(id)` bind — the interface only needs to
    // type-check that bind, not describe the column's storage type.
    accommodation_id: string | number | null;
    metadata: string | null;
  };
}

// ---------------------------------------------------------------------------
// Plan 3d Task 4 (calendar, `listUpcoming`, the visibility-predicate
// consumers incl. `share`, the `public-api` pickup) — additive. `calendar/**`
// and `share/**`'s reads on `day_accommodations`/`reservation_endpoints`/
// `reservation_day_positions` land here rather than on those tables' own
// repositories: `RoadtripVias`/`RoadtripDayTracks`/`RoadtripPreferences`/
// `RoadtripDayBoundaries`/`DayAccommodations`/`ReservationEndpoints`/
// `ReservationTravelers` repositories are Task 6's file set for this window
// (trip copy's additive methods), so a cross-table Kysely read — the SAME
// escape hatch `joinedQuery()`/`getAssignmentTripId`/`findNearestDayId`
// above already use to reach `days`/`places`/`day_accommodations` from this
// file — lands the read here instead of opening a second implementer's file.
// `DayAssignments.repository.ts` is not in Task 6's set, but CL4's read is
// kept alongside its RS20/CL2/CL7 siblings for the same "one file, one
// diff" reason.
// ---------------------------------------------------------------------------

/**
 * CL2 (`CalendarService.buildTripCalendar`'s reservation read) — `SELECT
 * r.*, pl.lat AS place_lat, pl.lng AS place_lng, sd.date AS stay_start_date,
 * ed.date AS stay_end_date, a.check_in AS stay_check_in, a.check_out AS
 * stay_check_out, (SELECT MIN(r2.id) FROM reservations r2 WHERE
 * r2.accommodation_id = a.id) AS stay_first_reservation_id, rd.date AS
 * day_date, red.date AS end_day_date FROM reservations r LEFT JOIN places
 * pl … LEFT JOIN day_accommodations a ON r.accommodation_id = a.id LEFT
 * JOIN days sd/ed/rd/red … WHERE r.trip_id = ? AND <RV1('r')>`, no `ORDER
 * BY`. `r.accommodation_id = a.id` and `r2.accommodation_id = a.id` are
 * plain column-to-column joins (no `CAST`) — SQLite applies numeric
 * affinity to the TEXT side against a genuine INTEGER column on its own
 * (§18.1), the same reasoning `joinedQuery()`'s `ap`/`acc_p` joins above
 * already rely on; a `CAST` is only needed where one side is a BOUND value
 * (RV2, RS20's correlated title subquery). The `stay_first_reservation_id`
 * subquery is deliberately **not** filtered by RV1 — inventory §18.2's
 * documented, unfixed hole (a staged sibling booking with a lower id can
 * win the slot and suppress a public booking's all-day block); kept
 * byte-for-byte, pinned by CAL-CL2-HOLE-001 in the repository test.
 */
export interface CalendarReservationRow extends ReservationAllColumnsRow {
  place_lat: number | null;
  place_lng: number | null;
  stay_start_date: string | null;
  stay_end_date: string | null;
  stay_check_in: string | null;
  stay_check_out: string | null;
  stay_first_reservation_id: number | null;
  day_date: string | null;
  end_day_date: string | null;
}

interface CalendarReservationKyselyDB {
  reservations: ReservationJoinKyselyDB['reservations'];
  places: { id: number; lat: number | null; lng: number | null };
  day_accommodations: { id: number; start_day_id: number | null; end_day_id: number | null; check_in: string | null; check_out: string | null };
  days: { id: number; date: string | null };
}

/**
 * CL4 (`CalendarService.buildTripCalendar`'s per-day assignment read,
 * previously run once per dated day) — `SELECT da.*, p.name as place_name,
 * p.address as place_address, p.lat as place_lat, p.lng as place_lng,
 * COALESCE(da.assignment_time, p.place_time) as effective_time,
 * COALESCE(da.assignment_end_time, p.end_time) as effective_end_time FROM
 * day_assignments da JOIN places p ON da.place_id = p.id WHERE da.day_id =
 * ? AND da.accommodation_id IS NULL ORDER BY da.order_index ASC,
 * da.created_at ASC` — the booked-night stop (its own accommodation-linked
 * `day_assignments` row) is excluded, matching the legacy comment ("that
 * stop is the booking … reading it here as well would put the hotel on the
 * day a second time"). Kept per-day (the caller's own loop), not batched —
 * result-identical either way per the inventory's own note; per-day is the
 * smaller diff against the legacy statement shape.
 */
export interface CalendarStopRow extends DayAssignmentRow {
  place_name: string;
  place_address: string | null;
  place_lat: number | null;
  place_lng: number | null;
  effective_time: string | null;
  effective_end_time: string | null;
}

interface CalendarStopsKyselyDB {
  day_assignments: {
    id: number; day_id: number; place_id: number; order_index: number | null; notes: string | null;
    reservation_status: string | null; reservation_notes: string | null; reservation_datetime: string | null;
    created_at: string | null; assignment_time: string | null; assignment_end_time: string | null;
    leg_transport_mode: string | null; incoming_leg_transport_mode: string | null; end_day: number; accommodation_id: number | null;
  };
  places: { id: number; name: string; address: string | null; lat: number | null; lng: number | null; place_time: string | null; end_time: string | null };
}

/**
 * CL7 (`CalendarService.buildTripCalendar`'s check-in/check-out stay read)
 * — `SELECT a.id, a.check_in, a.check_in_end, a.check_out, sd.date AS
 * start_date, ed.date AS end_date, p.name AS place_name, p.address AS
 * place_address, p.lat AS place_lat, p.lng AS place_lng, (SELECT r.title
 * FROM reservations r WHERE r.accommodation_id = a.id AND <RV1('r')> ORDER
 * BY r.id ASC LIMIT 1) AS reservation_title FROM day_accommodations a LEFT
 * JOIN days sd … LEFT JOIN days ed … LEFT JOIN places p … WHERE a.trip_id =
 * ? AND <RV2('a')> ORDER BY a.id ASC`. The `reservation_title` subquery is
 * a plain column-to-column compare too (no `CAST`), same reasoning as CL2.
 * `.where('a.trip_id', ...).where(publicStayExists)` are chained BEFORE the
 * `sd`/`ed`/`p` joins below (Kysely renders WHERE after JOIN regardless of
 * call order — the AST, not the call sequence, decides clause order) so
 * `publicStayExists`'s narrow `ExpressionBuilder<…, 'a'>` signature sees
 * exactly the `a` alias it requires (Task 0 review's own finding: a
 * differently-joined outer query typechecks as long as the alias stays
 * `a`).
 */
export interface CalendarStayRow {
  id: number;
  check_in: string | null;
  check_in_end: string | null;
  check_out: string | null;
  start_date: string | null;
  end_date: string | null;
  place_name: string | null;
  place_address: string | null;
  place_lat: number | null;
  place_lng: number | null;
  reservation_title: string | null;
}

interface CalendarStayKyselyDB extends ReservationVisibilityKyselyDB {
  day_accommodations: {
    id: number; trip_id: number | string; place_id: number | null; start_day_id: number | null; end_day_id: number | null;
    check_in: string | null; check_in_end: string | null; check_out: string | null;
  };
  reservations: ReservationVisibilityKyselyDB['reservations'] & { title: string };
  days: { id: number; date: string | null };
  places: { id: number; name: string | null; address: string | null; lat: number | null; lng: number | null };
}

/**
 * RS20 (`ReservationsService.listUpcoming`) — the CTE + `UNION ALL`
 * statement, inventory §2e. Ruling (ii): ONE fully typed Kysely statement
 * (no `connection.execute()` exception, no JS merge/re-sort — the reviewer's
 * prototype matched legacy rows across 5 `(today, now, limit)` settings
 * incl. the cross-table `id` tiebreak, and the plan adopted that). GLOB
 * through `startsWithIsoDateKysely`; `CAST` through `castIntegerKysely`
 * (the correlated title subquery compares a BOUND `a.id` — an outer-query
 * value, not a plain column-to-column join, unlike CL2/CL7's `MIN`/title
 * subqueries — so the legacy statement casts here too:
 * `CAST(res.accommodation_id AS INTEGER) = a.id`); `||` through
 * `concatKysely`; `substr` through `substringKysely`. `LIMIT` stays inside
 * SQL; the SQLite collation `ORDER BY at_date ASC, COALESCE(at_time,
 * '00:00') ASC, id ASC` (the cross-table `id` tiebreak — a stay id and a
 * reservation id can collide) is reproduced exactly, never a JS `.sort()`.
 *
 * Each of the three `entries` arms is `$castTo<EntriesRow>()`'d before the
 * `unionAll` chain: Kysely infers a literal type (`'checkin'`) for
 * `eb.val('checkin').as('type')` in arms 2/3 against `r.type: string |
 * null` in arm 1, and the three arms' `title`/`reservation_time` sources
 * differ in nullability shape too — the union of literal/nullable variants
 * doesn't collapse into one column type on its own, the same
 * `DayStopRow`/`AssignmentTimeSortKyselyDB` precedent
 * (`DayAssignments.repository.ts::listForTimeSort`) uses for its own
 * `eb.and([...])`-inferred boolean column.
 */
export interface UpcomingReservationRow {
  id: number;
  trip_id: number;
  title: string;
  type: string | null;
  status: string | null;
  location: string | null;
  reservation_time: string | null;
  confirmation_number: string | null;
  trip_title: string;
  trip_cover: string | null;
  day_date: string | null;
  place_name: string | null;
  place_image: string | null;
}

/** RS20's `entries` CTE row shape — see {@link UpcomingReservationRow}'s docstring for why every arm is cast to this. */
interface EntriesRow extends UpcomingReservationRow {
  at_date: string | null;
  at_time: string | null;
}

interface UpcomingReservationsKyselyDB {
  trips: { id: number; user_id: number; title: string; cover_image: string | null; is_archived: number };
  trip_members: { trip_id: number; user_id: number };
  reservations: {
    id: number; trip_id: number; title: string; type: string | null; status: string | null;
    location: string | null; reservation_time: string | null; confirmation_number: string | null;
    day_id: number | null; place_id: number | null; accommodation_id: string | null;
  };
  days: { id: number; date: string | null };
  places: { id: number; name: string | null; image_url: string | null };
  day_accommodations: {
    id: number; trip_id: number; place_id: number | null; start_day_id: number; end_day_id: number;
    check_in: string | null; check_out: string | null; confirmation: string | null;
  };
}

/**
 * `share.service.ts:251` (`publicEndpointsByReservation`) — `SELECT
 * e.reservation_id, e.role, e.sequence, e.name, e.code, e.lat, e.lng,
 * e.timezone, e.local_date, e.local_time FROM reservation_endpoints e JOIN
 * reservations r ON r.id = e.reservation_id WHERE r.trip_id = ? ORDER BY
 * e.reservation_id ASC, e.sequence ASC`. Not filtered by RV1 — the legacy
 * statement loads every reservation's endpoints regardless of
 * `ingest_state`, and the caller only ever looks one up for a reservation
 * `share.service.ts`'s OWN filtered read already returned (parity, matching
 * `CalendarService.loadEndpointsByTrip`'s identical shape, §4's CL6 note).
 */
export interface ShareEndpointRow {
  reservation_id: number;
  role: string;
  sequence: number;
  name: string;
  code: string | null;
  lat: number;
  lng: number;
  timezone: string | null;
  local_date: string | null;
  local_time: string | null;
}

interface ShareEndpointsKyselyDB {
  reservation_endpoints: {
    reservation_id: number; role: string; sequence: number; name: string; code: string | null;
    lat: number; lng: number; timezone: string | null; local_date: string | null; local_time: string | null;
  };
  reservations: { id: number; trip_id: number | string };
}

/**
 * `share.service.ts:368` (`getSharedTripData`'s day-position read) —
 * `SELECT rdp.reservation_id, rdp.day_id, rdp.position FROM
 * reservation_day_positions rdp JOIN reservations r ON rdp.reservation_id =
 * r.id WHERE r.trip_id = ?`, no `ORDER BY`, no RV1 filter (same reasoning
 * as the endpoints read above — the caller only consults `posMap` for a
 * reservation its own filtered read already returned).
 */
export interface ShareDayPositionRow {
  reservation_id: number;
  day_id: number;
  position: number;
}

interface ShareDayPositionsKyselyDB {
  reservation_day_positions: { reservation_id: number; day_id: number; position: number };
  reservations: { id: number; trip_id: number | string };
}

/**
 * `share.service.ts:387` (`getSharedTripData`'s public booking read) —
 * `SELECT ${PUBLIC_RESERVATION_COLUMNS} FROM reservations r WHERE r.trip_id
 * = ? AND <RV1('r')> ORDER BY r.reservation_time ASC` —
 * `PUBLIC_RESERVATION_COLUMNS` is `id, trip_id, day_id, end_day_id,
 * place_id, accommodation_id, title, type, status, location,
 * reservation_time, reservation_end_time, notes, url, metadata,
 * created_at`, the allow-list a public link may see (never the
 * confirmation number, the import trail or who is travelling).
 */
export interface SharePublicReservationRow {
  id: number;
  trip_id: number;
  day_id: number | null;
  end_day_id: number | null;
  place_id: number | null;
  accommodation_id: string | null;
  title: string;
  type: string | null;
  status: string | null;
  location: string | null;
  reservation_time: string | null;
  reservation_end_time: string | null;
  notes: string | null;
  url: string | null;
  metadata: string | null;
  created_at: string | null;
}

interface SharePublicReservationKyselyDB {
  reservations: ReservationVisibilityKyselyDB['reservations'] & {
    trip_id: number | string;
    day_id: number | null; end_day_id: number | null; place_id: number | null; title: string;
    type: string | null; status: string | null; location: string | null;
    reservation_time: string | null; reservation_end_time: string | null;
    notes: string | null; url: string | null; metadata: string | null; created_at: string | null;
  };
}

/**
 * `share.service.ts:401` (`getSharedTripData`'s public stay read) —
 * `SELECT ${PUBLIC_ACCOMMODATION_COLUMNS}, p.name as place_name, p.address
 * as place_address, p.lat as place_lat, p.lng as place_lng FROM
 * day_accommodations a JOIN places p ON a.place_id = p.id WHERE a.trip_id =
 * ? AND <RV2('a')>` — an INNER `JOIN`, not `LEFT`, unlike CL7: a stay with
 * no linked place is silently excluded from a public link (parity, kept
 * exactly). `PUBLIC_ACCOMMODATION_COLUMNS` is `id, trip_id, place_id,
 * start_day_id, end_day_id, check_in, check_in_end, check_out, notes`.
 */
export interface SharePublicAccommodationRow {
  id: number;
  trip_id: number;
  place_id: number | null;
  start_day_id: number | null;
  end_day_id: number | null;
  check_in: string | null;
  check_in_end: string | null;
  check_out: string | null;
  notes: string | null;
  place_name: string | null;
  place_address: string | null;
  place_lat: number | null;
  place_lng: number | null;
}

interface SharePublicAccommodationKyselyDB extends ReservationVisibilityKyselyDB {
  day_accommodations: {
    id: number; trip_id: number | string; place_id: number | null; start_day_id: number | null; end_day_id: number | null;
    check_in: string | null; check_in_end: string | null; check_out: string | null; notes: string | null;
  };
  places: { id: number; name: string | null; address: string | null; lat: number | null; lng: number | null };
}

/**
 * `public-api.service.ts::reservationsByDay` (Task 5's `// Task 2` pickup)
 * — `SELECT day_id, type, title, location, reservation_time,
 * reservation_end_time, status, notes FROM reservations WHERE trip_id = ?
 * AND day_id IS NOT NULL ORDER BY day_id ASC, reservation_time ASC`.
 */
export interface PublicApiScheduledReservationRow {
  day_id: number;
  type: string | null;
  title: string | null;
  location: string | null;
  reservation_time: string | null;
  reservation_end_time: string | null;
  status: string | null;
  notes: string | null;
}

/**
 * `public-api.service.ts::buildUnscheduledReservations` (Task 5's `// Task
 * 2` pickup) — the same 7 columns minus `day_id`, `WHERE trip_id = ? AND
 * day_id IS NULL ORDER BY reservation_time ASC, id ASC`.
 */
export type PublicApiUnscheduledReservationRow = Omit<PublicApiScheduledReservationRow, 'day_id'>;

interface PublicApiReservationKyselyDB {
  reservations: {
    id: number; trip_id: number; day_id: number | null; type: string | null; title: string | null;
    location: string | null; reservation_time: string | null; reservation_end_time: string | null;
    status: string | null; notes: string | null;
  };
}

/**
 * `public-api.service.ts::buildAccommodations` (Task 5's `// Task 3`
 * pickup) — `SELECT p.name, p.address, p.lat, p.lng, ds.date AS start_date,
 * de.date AS end_date, a.check_in, a.check_out, a.notes FROM
 * day_accommodations a LEFT JOIN places p ON p.id = a.place_id LEFT JOIN
 * days ds ON ds.id = a.start_day_id LEFT JOIN days de ON de.id =
 * a.end_day_id WHERE a.trip_id = ? ORDER BY ds.date ASC`.
 */
export interface PublicApiAccommodationRow {
  name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  start_date: string | null;
  end_date: string | null;
  check_in: string | null;
  check_out: string | null;
  notes: string | null;
}

interface PublicApiAccommodationKyselyDB {
  day_accommodations: { id: number; trip_id: number; place_id: number | null; start_day_id: number | null; end_day_id: number | null; check_in: string | null; check_out: string | null; notes: string | null };
  places: { id: number; name: string | null; address: string | null; lat: number | null; lng: number | null };
  days: { id: number; date: string | null };
}

/**
 * `public-api.service.ts::buildUnplannedPlaces` (Task 5's `// Task 3`
 * pickup — "the whole statement stays raw rather than splitting the
 * places/day_assignments reads from the one 3d-table predicate", the
 * method's own comment) — `SELECT p.name, p.address, p.lat, p.lng,
 * p.place_time, p.end_time, p.duration_minutes, p.notes, p.transport_mode,
 * c.name AS category FROM places p LEFT JOIN categories c ON c.id =
 * p.category_id WHERE p.trip_id = ? AND NOT EXISTS (SELECT 1 FROM
 * day_assignments da WHERE da.place_id = p.id) AND NOT EXISTS (SELECT 1
 * FROM day_accommodations a WHERE a.place_id = p.id) ORDER BY
 * p.created_at ASC, p.id ASC`.
 */
export interface PublicApiUnplannedPlaceRow {
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  place_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  notes: string | null;
  transport_mode: string | null;
  category: string | null;
}

interface PublicApiUnplannedPlaceKyselyDB {
  places: {
    id: number; trip_id: number; name: string; address: string | null; lat: number | null; lng: number | null;
    place_time: string | null; end_time: string | null; duration_minutes: number | null; notes: string | null;
    transport_mode: string | null; category_id: number | null; created_at: string | null;
  };
  categories: { id: number; name: string };
  day_assignments: { id: number; place_id: number };
  day_accommodations: { id: number; place_id: number | null };
}

/**
 * Plan 3h Task 4 (`AirportsService.backfillFlightEndpoints`, AIR1) —
 * additive. The narrow `reservations`/`reservation_endpoints` shape the
 * `NOT EXISTS` guard needs.
 */
interface FlightsMissingEndpointsKyselyDB {
  reservations: { id: number; metadata: string | null; reservation_time: string | null; reservation_end_time: string | null; type: string | null };
  reservation_endpoints: { id: number; reservation_id: number };
}

export class ReservationsRepository extends TrekRepository<Reservations> {
  private joinedQuery() {
    return this.kysely<ReservationJoinKyselyDB>()
      .selectFrom('reservations as r')
      .leftJoin('days as d', 'd.id', 'r.day_id')
      .leftJoin('places as p', 'p.id', 'r.place_id')
      .leftJoin('day_accommodations as ap', 'ap.id', 'r.accommodation_id')
      .leftJoin('places as acc_p', 'acc_p.id', 'ap.place_id')
      .selectAll('r')
      .select([
        'd.day_number as day_number',
        'p.name as place_name',
        'ap.place_id as accommodation_place_id',
        'acc_p.name as accommodation_name',
        'ap.start_day_id as accommodation_start_day_id',
        'ap.end_day_id as accommodation_end_day_id',
      ]);
  }

  /**
   * RS18 (`ReservationsService.list`) — the joined projection for a whole
   * trip, `ORDER BY r.reservation_time ASC, r.created_at ASC`.
   */
  async listForTrip(trip_id: number | string): Promise<ReservationJoinRow[]> {
    const rows = await this.joinedQuery()
      .where('r.trip_id', '=', trip_id)
      .orderBy('r.reservation_time', 'asc')
      .orderBy('r.created_at', 'asc')
      .execute();
    return rows as ReservationJoinRow[];
  }

  /**
   * RR1 (`ReservationsReadService.getReservationWithJoins`) — the SAME
   * projection for one reservation, no `ORDER BY` (a single row).
   */
  async findWithJoins(id: number | string): Promise<ReservationJoinRow | undefined> {
    const row = await this.joinedQuery().where('r.id', '=', id).executeTakeFirst();
    return row as ReservationJoinRow | undefined;
  }

  /**
   * RS35 (`ReservationsService.getReservation`) — `SELECT * FROM
   * reservations WHERE id = ? AND trip_id = ?`, the trip-scoping guard every
   * write path re-reads through. `id`/`trip_id: number` (rule 21 — the
   * SERVICE parses both ONCE via `toRowId` before calling this, and every
   * later write in the same method reuses that same parsed value, never a
   * second, independent conversion).
   */
  async findInTrip(id: number, trip_id: number): Promise<ReservationAllColumnsRow | undefined> {
    return this.qb('r')
      .select(['r.*'])
      .where({ id, trip: trip_id })
      .execute<ReservationAllColumnsRow | undefined>('get', false);
  }

  /** RS45 (`ReservationsService.remove`'s pre-image read) — `SELECT id, title, type, accommodation_id FROM reservations WHERE id = ? AND trip_id = ?`. */
  async findHeaderInTrip(id: number, trip_id: number): Promise<{ id: number; title: string; type: string | null; accommodation_id: string | null } | undefined> {
    return this.qb('r')
      .select(['r.id', 'r.title', 'r.type', 'r.accommodation_id'])
      .where({ id, trip: trip_id })
      .execute<{ id: number; title: string; type: string | null; accommodation_id: string | null } | undefined>('get', false);
  }

  /**
   * RS12 (`ReservationsService.resyncReservationDays`) — `SELECT id,
   * reservation_time, reservation_end_time, day_id, end_day_id FROM
   * reservations WHERE trip_id = ? AND (type != 'hotel' OR accommodation_id
   * IS NULL) AND reservation_time IS NOT NULL`.
   */
  async listResyncCandidates(trip_id: number): Promise<{
    id: number; reservation_time: string | null; reservation_end_time: string | null;
    day_id: number | null; end_day_id: number | null;
  }[]> {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('r')
      .select(['r.id', 'r.reservation_time', 'r.reservation_end_time', columnRef(platform, 'r.day_id').as('day_id'), columnRef(platform, 'r.end_day_id').as('end_day_id')])
      .where({
        trip: trip_id,
        $or: [{ type: { $ne: 'hotel' } }, { accommodation_id: null }],
        reservation_time: { $ne: null },
      })
      .execute<{ id: number; reservation_time: string | null; reservation_end_time: string | null; day_id: number | null; end_day_id: number | null }[]>('all', false);
  }

  /** RS13 (`resyncReservationDays`'s per-row write) — `UPDATE reservations SET day_id = ?, end_day_id = ? WHERE id = ?`. */
  async setDays(id: number, day_id: number | null, end_day_id: number | null): Promise<void> {
    await this.nativeUpdate({ id }, { day: day_id, endDay: end_day_id });
  }

  /**
   * RS28 (`ReservationsService.createInTx`) — `INSERT INTO reservations
   * (trip_id, day_id, end_day_id, place_id, assignment_id, title,
   * reservation_time, reservation_end_time, location, confirmation_number,
   * notes, url, status, type, accommodation_id, metadata, needs_review)
   * VALUES (?×17)`. `sync_enabled`/`ingest_state`/`day_plan_position`
   * deliberately NOT named, so the column's own DB-level `DEFAULT` applies
   * (`sync_enabled INTEGER DEFAULT 1`, `Migration20200101021800_…`;
   * `ingest_state` `.default('live')`) — the caller has already resolved
   * every value (the `|| null` coercions, `resolvedOrNull`, the numeric
   * `accommodation_id` stringified for the TEXT column, R2).
   */
  async insertReservation(input: {
    trip_id: number;
    day_id: number | null;
    end_day_id: number | null;
    place_id: number | null;
    assignment_id: number | null;
    title: string;
    reservation_time: string | null;
    reservation_end_time: string | null;
    location: string | null;
    confirmation_number: string | null;
    notes: string | null;
    url: string | null;
    status: string;
    type: string;
    accommodation_id: string | null;
    metadata: string | null;
    needs_review: number;
  }): Promise<number> {
    return await this.insert({
      trip: input.trip_id,
      day: input.day_id,
      endDay: input.end_day_id,
      place: input.place_id,
      assignment: input.assignment_id,
      title: input.title,
      reservation_time: input.reservation_time,
      reservation_end_time: input.reservation_end_time,
      location: input.location,
      confirmation_number: input.confirmation_number,
      notes: input.notes,
      url: input.url,
      status: input.status,
      type: input.type,
      accommodation_id: input.accommodation_id,
      metadata: input.metadata,
      needs_review: input.needs_review,
    });
  }

  /**
   * RS41 (`ReservationsService.updateInTx`) — the 16-column `UPDATE
   * reservations SET … WHERE id = ?`. The `PlacesRepository.updatePlace`/PL11
   * precedent: the four legacy `COALESCE(?, col)` keep-if-null columns
   * (`title`, `status`, `type`, `needs_review`) are resolved to their FINAL
   * value by the SERVICE first (it already holds the pre-image via the
   * `current` parameter every caller passes), so this writes exactly what it
   * is handed — no SQL-side COALESCE. `id: number` (rule 21 — the SAME
   * `toRowId`-parsed value `findInTrip`'s gate read used).
   */
  async updateReservation(id: number, write: {
    title: string;
    reservation_time: string | null;
    reservation_end_time: string | null;
    location: string | null;
    confirmation_number: string | null;
    notes: string | null;
    url: string | null;
    day_id: number | null;
    end_day_id: number | null;
    place_id: number | null;
    assignment_id: number | null;
    status: string;
    type: string;
    accommodation_id: string | null;
    metadata: string | null;
    needs_review: number;
  }): Promise<void> {
    await this.nativeUpdate({ id }, {
      title: write.title,
      reservation_time: write.reservation_time,
      reservation_end_time: write.reservation_end_time,
      location: write.location,
      confirmation_number: write.confirmation_number,
      notes: write.notes,
      url: write.url,
      day: write.day_id,
      endDay: write.end_day_id,
      place: write.place_id,
      assignment: write.assignment_id,
      status: write.status,
      type: write.type,
      accommodation_id: write.accommodation_id,
      metadata: write.metadata,
      needs_review: write.needs_review,
    });
  }

  /**
   * RS33 (`updatePositions`'s legacy/global branch) — `UPDATE reservations
   * SET day_plan_position = ? WHERE id = ? AND trip_id = ?`. `position:
   * number | null`, never `undefined` (R8 — the SERVICE maps an absent
   * `day_plan_position` to `null` explicitly before calling, so
   * `nativeUpdate` always WRITES the column instead of silently skipping it).
   */
  async setDayPlanPosition(id: number, trip_id: number, position: number | null): Promise<void> {
    await this.nativeUpdate({ id, trip: trip_id }, { day_plan_position: position });
  }

  /** RS50 (`remove`) — `DELETE FROM reservations WHERE id = ?`, unscoped (the caller already proved trip access via `findHeaderInTrip`). */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /** DY14 (`DaysService.restampReservationDates`) — `SELECT id, day_id, end_day_id, reservation_time, reservation_end_time FROM reservations WHERE trip_id = ?`. */
  async listForRestamp(trip_id: number): Promise<{
    id: number; day_id: number | null; end_day_id: number | null;
    reservation_time: string | null; reservation_end_time: string | null;
  }[]> {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('r')
      .select(['r.id', columnRef(platform, 'r.day_id').as('day_id'), columnRef(platform, 'r.end_day_id').as('end_day_id'), 'r.reservation_time', 'r.reservation_end_time'])
      .where({ trip: trip_id })
      .execute<{ id: number; day_id: number | null; end_day_id: number | null; reservation_time: string | null; reservation_end_time: string | null }[]>('all', false);
  }

  /** DY15 — `UPDATE reservations SET reservation_time = ? WHERE id = ?`. */
  async setReservationTime(id: number, reservation_time: string): Promise<void> {
    await this.nativeUpdate({ id }, { reservation_time });
  }

  /** DY16 — `UPDATE reservations SET reservation_end_time = ? WHERE id = ?`. */
  async setReservationEndTime(id: number, reservation_end_time: string): Promise<void> {
    await this.nativeUpdate({ id }, { reservation_end_time });
  }

  /**
   * DY23 (`DaysService.resyncAccommodationDays`) — the named-param `UPDATE
   * reservations SET day_id = :dayId, reservation_time = CASE WHEN
   * reservation_time IS NULL THEN :date ELSE :date || SUBSTR(reservation_time,
   * 11) END WHERE accommodation_id = :accId AND type = 'hotel'`. Kysely (the
   * `CASE WHEN … ELSE … || SUBSTR(...)` shape has no typed-filter
   * equivalent — the T6 tier per the inventory's own ruling), through
   * `concatKysely`/`substringKysely` (`sql-functions.ts`'s Kysely-expression
   * twins of `concat`/`substring` — the MikroORM `RawQueryFragment` forms
   * render as a literal `?` token inside a Kysely statement and throw at
   * execution, Task 0 review H1). `accommodation_id` (TEXT) compared against
   * `accId` (a bound NUMBER, exactly as the legacy statement bound it — R2,
   * never stringified here, so the SAME SQLite TEXT-affinity conversion the
   * legacy statement triggered still applies, including its own miss on a
   * `"14.0"`-shaped row — parity, not a fix).
   */
  async restampLinkedReservation(accommodation_id: number, day_id: number, date: string): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.kysely<ReservationRestampKyselyDB>()
      .updateTable('reservations')
      .set((eb) => ({
        day_id,
        reservation_time: eb
          .case()
          .when('reservation_time', 'is', null)
          .then(eb.val(date))
          .else(concatKysely(platform, eb, { value: date }, { expression: substringKysely(platform, eb, 'reservation_time', 11) }))
          .end(),
      }))
      .where('accommodation_id', '=', accommodation_id)
      .where('type', '=', 'hotel')
      .execute();
  }

  /**
   * RS22's dispatch (`ReservationsService.referencesOutsideTrip`'s
   * `assignment_id` branch) — `SELECT d.trip_id FROM day_assignments da JOIN
   * days d ON da.day_id = d.id WHERE da.id = ?`. Reached through
   * `DayAssignmentsRepository`'s own relation join (`da.day` — the same
   * cross-repository-read shape `TripMembersRepository.rosterUserIds`
   * already uses for a table this repository does not own), never a new
   * method on that file
   * (`DayAssignmentsRepository`/`DaysRepository` are Task 1's
   * additive-method territory per the file-ownership split).
   */
  async getAssignmentTripId(assignment_id: number): Promise<number | undefined> {
    const platform = this.getEntityManager().getPlatform();
    const dayAssignments = this.getEntityManager().getRepository(DayAssignments);
    const row = await dayAssignments
      .qb('da')
      .join('da.day', 'd')
      .select([columnRef(platform, 'd.trip_id').as('trip_id')])
      .where({ id: assignment_id })
      .execute<{ trip_id: number } | undefined>('get', false);
    return row?.trip_id;
  }

  /**
   * RS11 (`resolveDayIdFromTime`'s nearest-day fallback) — `SELECT id FROM
   * days WHERE trip_id = ? ORDER BY ABS(JULIANDAY(date) - JULIANDAY(?)) ASC,
   * date ASC LIMIT 1`. `dayDistance`, through `DaysRepository`'s own QB (the
   * same cross-repository-read shape as `getAssignmentTripId` above —
   * `DaysRepository` stays Task 1's additive-method territory; no new
   * method is added there).
   */
  async findNearestDayId(trip_id: number, iso_date: string): Promise<number | undefined> {
    const platform = this.getEntityManager().getPlatform();
    const days = this.getEntityManager().getRepository(Days);
    const row = await days
      .qb('d')
      .select(['d.id'])
      .where({ trip: trip_id })
      .orderBy([{ [dayDistance(platform, 'd.date', iso_date)]: 'asc' }, { date: 'asc' }])
      .limit(1)
      .execute<{ id: number } | undefined>('get', false);
    return row?.id;
  }

  // ---------------------------------------------------------------------------
  // Plan 3d Task 3 (`AccommodationsService`) — additive, per this task's own
  // file-ownership rule ("additive methods on Days/Places/DayAssignments/
  // Reservations repositories where a read belongs there").
  // ---------------------------------------------------------------------------

  /**
   * AC33 (`AccommodationsService.createAccommodation`) — `INSERT INTO
   * reservations (trip_id, day_id, title, reservation_time, location,
   * confirmation_number, notes, status, type, accommodation_id, metadata)
   * VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', 'hotel', ?, ?)` — the
   * auto-created partner hotel booking. `status`/`type` literals, `location`
   * always `null` (matching the legacy statement exactly — it never binds a
   * value there). `accommodation_id: string` — R2: the caller stringifies
   * the new stay's numeric id (`String(newId)`) the same way `insertReservation`'s
   * own `accommodation_id` caller already does, so SQLite's TEXT-affinity
   * storage is identical to the legacy raw bind of the bare number.
   */
  async insertHotelPartner(input: {
    trip_id: number | string;
    day_id: number;
    title: string;
    reservation_time: string | null;
    confirmation_number: string | null;
    notes: string | null;
    accommodation_id: string;
    metadata: string | null;
  }): Promise<number> {
    return await this.insert({
      trip: input.trip_id,
      day: input.day_id,
      title: input.title,
      reservation_time: input.reservation_time,
      location: null,
      confirmation_number: input.confirmation_number,
      notes: input.notes,
      status: 'confirmed',
      type: 'hotel',
      accommodation_id: input.accommodation_id,
      metadata: input.metadata,
    });
  }

  /**
   * AC37 (`AccommodationsService.updateAccommodation`) — `SELECT id,
   * metadata FROM reservations WHERE accommodation_id = ?`, every linked
   * booking (no unique constraint on the column — more than one booking can
   * point at the same stay). Bound as a plain `number`, matching the
   * legacy's own `Number(id)` bind byte-for-byte — see
   * {@link ReservationsByAccommodationKyselyDB}'s docstring (M3, reverted
   * from the `castIntegerKysely` widening).
   */
  async listIdMetadataByStay(accommodation_id: number): Promise<{ id: number; metadata: string | null }[]> {
    const rows = await this.kysely<ReservationsByAccommodationKyselyDB>()
      .selectFrom('reservations')
      .select(['id', 'metadata'])
      .where('accommodation_id', '=', accommodation_id)
      .execute();
    return rows as { id: number; metadata: string | null }[];
  }

  /**
   * AC38 (`AccommodationsService.updateAccommodation`) — `UPDATE
   * reservations SET metadata = ?, confirmation_number = COALESCE(?,
   * confirmation_number) WHERE id = ?`. Runs AFTER `updateAccommodation`'s
   * own transaction commits (§18.6 — R5 class, flagged not fixed).
   * `coalesceOverride` for the value-side COALESCE — the bound `?` FIRST,
   * the column the fallback, so the new value wins
   * (`DayAccommodationsRepository.patchConfirmation`'s precedent).
   */
  async setMetadataAndConfirmation(id: number, metadata: string, confirmation: string | null): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.qb()
      .update({
        metadata,
        confirmation_number: coalesceOverride(platform, confirmation, 'confirmation_number'),
      })
      .where({ id })
      .execute('run');
  }

  /**
   * AC40 (`AccommodationsService.deleteAccommodation`) — `SELECT id FROM
   * reservations WHERE accommodation_id = ?`, ALL linked bookings. Same
   * REAL-bound compare as {@link listIdMetadataByStay} (M3).
   */
  async listIdsByStay(accommodation_id: number): Promise<{ id: number }[]> {
    const rows = await this.kysely<ReservationsByAccommodationKyselyDB>()
      .selectFrom('reservations')
      .select(['id'])
      .where('accommodation_id', '=', accommodation_id)
      .execute();
    return rows as { id: number }[];
  }

  // ---------------------------------------------------------------------------
  // Plan 3d Task 6 (`trips.service.ts::copy`) — moved here from
  // `ReservationEndpoints.repository.ts` in the Task 7 whole-plan review's
  // fix wave (item 8/D4, "one repository per table"): Task 4 owned this file
  // for the Task 6 tree window, so TP58/TP59 (the reservations copy
  // read/write) landed on `ReservationEndpointsRepository` instead at the
  // time — a pure move now that the window is closed, same statements,
  // same parity proof (`Reservations.repository.test.ts`). Endpoints/
  // travelers/day-positions are never copied with a reservation (R7,
  // `copy` never copied them — kept as-is on their own repositories).
  // ---------------------------------------------------------------------------

  /**
   * TP58 (`trips.service.ts::copy`'s reservations read) — `SELECT * FROM
   * reservations WHERE trip_id = ?`, no `ORDER BY` (matching the legacy
   * statement; the copy loop's own id-remap doesn't depend on read order).
   * `ReservationAllColumnsRow` (RS35's own `SELECT *` shape) rather than a
   * second, differently-named copy of the same fields.
   */
  async listAllForTrip(trip_id: number): Promise<ReservationAllColumnsRow[]> {
    return await this.kysely<{ reservations: ReservationAllColumnsRow }>()
      .selectFrom('reservations')
      .selectAll()
      .where('trip_id', '=', trip_id)
      .execute();
  }

  /**
   * TP59 (`trips.service.ts::copy`'s reservation INSERT) — `INSERT INTO
   * reservations (trip_id, day_id, end_day_id, place_id, assignment_id,
   * accommodation_id, title, reservation_time, reservation_end_time,
   * location, confirmation_number, notes, url, status, type, metadata,
   * day_plan_position, needs_review, ingest_state) VALUES (?×19)`. The
   * `external_*`/`sync_enabled`/`created_at` columns are deliberately
   * omitted (the legacy statement's own column list never named them — a
   * copy must not inherit the source's external sync identity).
   *
   * `this.insert(...)`, not `this.getEntityManager().insert(Reservations,
   * …)`: this repository IS templated on `Reservations` (unlike
   * `ReservationEndpointsRepository`, where this method used to live and
   * needed the escape hatch to reach a table it wasn't templated on) — the
   * ordinary `TrekRepository.insert` is the right call here.
   *
   * `accommodation_id` arrives ALREADY formatted as the legacy `'<id>.0'`
   * TEXT shape (`row-id.ts`'s `legacyBoundIntegerText`, the program's
   * Plan 3d Task 3 `"14.0"` finding): a plain JS number written here would
   * be inlined as a SQL literal (rule 22) and stored as `'14'`, not the
   * shape the legacy raw-bound statement produced.
   */
  async insertReservationCopy(input: {
    trip_id: number;
    day_id: number | null;
    end_day_id: number | null;
    place_id: number | null;
    assignment_id: number | null;
    accommodation_id: string | null;
    title: string;
    reservation_time: string | null;
    reservation_end_time: string | null;
    location: string | null;
    confirmation_number: string | null;
    notes: string | null;
    url: string | null;
    status: string | null;
    type: string | null;
    metadata: string | null;
    day_plan_position: number | null;
    needs_review: number;
    ingest_state: string;
  }): Promise<number> {
    return await this.insert({
      trip: input.trip_id,
      day: input.day_id,
      endDay: input.end_day_id,
      place: input.place_id,
      assignment: input.assignment_id,
      accommodation_id: input.accommodation_id,
      title: input.title,
      reservation_time: input.reservation_time,
      reservation_end_time: input.reservation_end_time,
      location: input.location,
      confirmation_number: input.confirmation_number,
      notes: input.notes,
      url: input.url,
      status: input.status,
      type: input.type,
      metadata: input.metadata,
      day_plan_position: input.day_plan_position,
      needs_review: input.needs_review,
      ingest_state: input.ingest_state,
    });
  }

  // ---------------------------------------------------------------------------
  // Plan 3d Task 4 — additive (see the file-level comment above the interfaces
  // this section's methods return).
  // ---------------------------------------------------------------------------

  /** CL2 — see {@link CalendarReservationRow}'s docstring. */
  async listForCalendar(trip_id: number | string): Promise<CalendarReservationRow[]> {
    const rows = await this.kysely<CalendarReservationKyselyDB>()
      .selectFrom('reservations as r')
      .leftJoin('places as pl', 'pl.id', 'r.place_id')
      .leftJoin('day_accommodations as a', 'a.id', 'r.accommodation_id')
      .leftJoin('days as sd', 'sd.id', 'a.start_day_id')
      .leftJoin('days as ed', 'ed.id', 'a.end_day_id')
      .leftJoin('days as rd', 'rd.id', 'r.day_id')
      .leftJoin('days as red', 'red.id', 'r.end_day_id')
      .selectAll('r')
      .select((eb) => [
        'pl.lat as place_lat',
        'pl.lng as place_lng',
        'sd.date as stay_start_date',
        'ed.date as stay_end_date',
        'a.check_in as stay_check_in',
        'a.check_out as stay_check_out',
        eb
          .selectFrom('reservations as r2')
          .select((eb2) => eb2.fn.min<number | null>('r2.id').as('c'))
          .whereRef('r2.accommodation_id', '=', 'a.id')
          .as('stay_first_reservation_id'),
        'rd.date as day_date',
        'red.date as end_day_date',
      ])
      .where('r.trip_id', '=', trip_id)
      .where((eb) => publicReservationExpr(eb, 'r.ingest_state'))
      .execute();
    return rows as CalendarReservationRow[];
  }

  /** CL4 — see {@link CalendarStopRow}'s docstring. */
  async listCalendarStops(day_id: number): Promise<CalendarStopRow[]> {
    const rows = await this.kysely<CalendarStopsKyselyDB>()
      .selectFrom('day_assignments as da')
      .innerJoin('places as p', 'p.id', 'da.place_id')
      .selectAll('da')
      .select((eb) => [
        'p.name as place_name',
        'p.address as place_address',
        'p.lat as place_lat',
        'p.lng as place_lng',
        eb.fn.coalesce('da.assignment_time', 'p.place_time').as('effective_time'),
        eb.fn.coalesce('da.assignment_end_time', 'p.end_time').as('effective_end_time'),
      ])
      .where('da.day_id', '=', day_id)
      .where('da.accommodation_id', 'is', null)
      .orderBy('da.order_index', 'asc')
      .orderBy('da.created_at', 'asc')
      .execute();
    return rows as CalendarStopRow[];
  }

  /** CL7 — see {@link CalendarStayRow}'s docstring. */
  async listPublicStaysForCalendar(trip_id: number | string): Promise<CalendarStayRow[]> {
    const rows = await this.kysely<CalendarStayKyselyDB>()
      .selectFrom('day_accommodations as a')
      .where('a.trip_id', '=', trip_id)
      .where((eb) => publicStayExists(eb))
      .leftJoin('days as sd', 'sd.id', 'a.start_day_id')
      .leftJoin('days as ed', 'ed.id', 'a.end_day_id')
      .leftJoin('places as p', 'p.id', 'a.place_id')
      .select((eb) => [
        'a.id',
        'a.check_in',
        'a.check_in_end',
        'a.check_out',
        'sd.date as start_date',
        'ed.date as end_date',
        'p.name as place_name',
        'p.address as place_address',
        'p.lat as place_lat',
        'p.lng as place_lng',
        eb
          .selectFrom('reservations as r')
          .select('r.title')
          .whereRef('r.accommodation_id', '=', 'a.id')
          .where((eb2) => publicReservationExpr(eb2, 'r.ingest_state'))
          .orderBy('r.id', 'asc')
          .limit(1)
          .as('reservation_title'),
      ])
      .orderBy('a.id', 'asc')
      .execute();
    return rows as CalendarStayRow[];
  }

  /** RS20 — see {@link UpcomingReservationRow}'s docstring. */
  async listUpcomingForUser(user_id: number, today: string, now_hhmm: string, limit: number): Promise<UpcomingReservationRow[]> {
    const platform = this.getEntityManager().getPlatform();

    // The `COALESCE(place name, nameless-stay's-linked-booking title, trip
    // title)` title is identical across the check-in and check-out arms
    // (both name the STAY, not the moment); it is spelled out in each rather
    // than factored into a shared helper, matching `Trips.repository.ts`'s
    // `activeTrip` precedent for its own repeated `CASE WHEN` — a helper
    // spanning two differently-joined query builders would need the same
    // kind of hand-written cross-callback type `_shared/reservation-visibility
    // .ts`'s own module docstring explains doesn't hold up.
    const rows = await this.kysely<UpcomingReservationsKyselyDB>()
      .with('visible_trips', (qb) =>
        qb
          .selectFrom('trips as t')
          .leftJoin('trip_members as tm', (join) => join.onRef('tm.trip_id', '=', 't.id').on('tm.user_id', '=', user_id))
          .select(['t.id', 't.title', 't.cover_image'])
          .where((eb) =>
            eb.and([eb.or([eb('t.user_id', '=', user_id), eb('tm.user_id', 'is not', null)]), eb('t.is_archived', '=', 0)]),
          ),
      )
      .with('entries', (qb) => {
        const bookings = qb
          .selectFrom('reservations as r')
          .innerJoin('visible_trips as tr', 'tr.id', 'r.trip_id')
          .leftJoin('days as d', 'd.id', 'r.day_id')
          .leftJoin('places as p', 'p.id', 'r.place_id')
          .select((eb) => [
            'r.id as id',
            'r.trip_id as trip_id',
            'r.title as title',
            'r.type as type',
            'r.status as status',
            'r.location as location',
            'r.reservation_time as reservation_time',
            'r.confirmation_number as confirmation_number',
            'tr.title as trip_title',
            'tr.cover_image as trip_cover',
            'd.date as day_date',
            'p.name as place_name',
            'p.image_url as place_image',
            eb
              .case()
              .when(startsWithIsoDateKysely(platform, eb, 'r.reservation_time'))
              .then(substringKysely(platform, eb, 'r.reservation_time', 1, 10))
              .else(eb.ref('d.date'))
              .end()
              .as('at_date'),
            eb
              .case()
              .when(startsWithIsoDateKysely(platform, eb, 'r.reservation_time'))
              .then(substringKysely(platform, eb, 'r.reservation_time', 12))
              .else(eb.ref('r.reservation_time'))
              .end()
              .as('at_time'),
          ])
          .where('r.status', '!=', 'cancelled')
          .where((eb) => eb(eb.fn.coalesce(eb.ref('r.type'), eb.val('')), '!=', 'hotel'))
          .$castTo<EntriesRow>();

        const checkins = qb
          .selectFrom('day_accommodations as a')
          .innerJoin('visible_trips as tr', 'tr.id', 'a.trip_id')
          .innerJoin('days as d', 'd.id', 'a.start_day_id')
          .leftJoin('places as p', 'p.id', 'a.place_id')
          .select((eb) => [
            'a.id as id',
            'a.trip_id as trip_id',
            eb
              .fn.coalesce(
                eb.ref('p.name'),
                eb
                  .selectFrom('reservations as res')
                  .select('res.title')
                  .where((eb2) => eb2(castIntegerKysely(platform, eb2, 'res.accommodation_id'), '=', eb2.ref('a.id')))
                  .where('res.status', '!=', 'cancelled')
                  .orderBy('res.id', 'asc')
                  .limit(1),
                eb.ref('tr.title'),
              )
              .as('title'),
            eb.val('checkin').as('type'),
            eb.val('confirmed').as('status'),
            eb.val<string | null>(null).as('location'),
            eb
              .case()
              .when('a.check_in', 'is not', null)
              .then(concatKysely(platform, eb, { column: 'd.date' }, { value: 'T' }, { column: 'a.check_in' }))
              .end()
              .as('reservation_time'),
            'a.confirmation as confirmation_number',
            'tr.title as trip_title',
            'tr.cover_image as trip_cover',
            'd.date as day_date',
            'p.name as place_name',
            'p.image_url as place_image',
            'd.date as at_date',
            'a.check_in as at_time',
          ])
          .$castTo<EntriesRow>();

        const checkouts = qb
          .selectFrom('day_accommodations as a')
          .innerJoin('visible_trips as tr', 'tr.id', 'a.trip_id')
          .innerJoin('days as d', 'd.id', 'a.end_day_id')
          .leftJoin('places as p', 'p.id', 'a.place_id')
          .select((eb) => [
            'a.id as id',
            'a.trip_id as trip_id',
            eb
              .fn.coalesce(
                eb.ref('p.name'),
                eb
                  .selectFrom('reservations as res')
                  .select('res.title')
                  .where((eb2) => eb2(castIntegerKysely(platform, eb2, 'res.accommodation_id'), '=', eb2.ref('a.id')))
                  .where('res.status', '!=', 'cancelled')
                  .orderBy('res.id', 'asc')
                  .limit(1),
                eb.ref('tr.title'),
              )
              .as('title'),
            eb.val('checkout').as('type'),
            eb.val('confirmed').as('status'),
            eb.val<string | null>(null).as('location'),
            eb
              .case()
              .when('a.check_out', 'is not', null)
              .then(concatKysely(platform, eb, { column: 'd.date' }, { value: 'T' }, { column: 'a.check_out' }))
              .end()
              .as('reservation_time'),
            'a.confirmation as confirmation_number',
            'tr.title as trip_title',
            'tr.cover_image as trip_cover',
            'd.date as day_date',
            'p.name as place_name',
            'p.image_url as place_image',
            'd.date as at_date',
            'a.check_out as at_time',
          ])
          .$castTo<EntriesRow>();

        return bookings.unionAll(checkins).unionAll(checkouts);
      })
      .selectFrom('entries')
      .select(['id', 'trip_id', 'title', 'type', 'status', 'location', 'reservation_time', 'confirmation_number', 'trip_title', 'trip_cover', 'day_date', 'place_name', 'place_image'])
      .where('at_date', 'is not', null)
      .where((eb) =>
        eb.or([
          eb('at_date', '>', today),
          eb.and([eb('at_date', '=', today), eb(eb.fn.coalesce(eb.ref('at_time'), eb.val('23:59')), '>=', now_hhmm)]),
        ]),
      )
      .orderBy('at_date', 'asc')
      .orderBy((eb) => eb.fn.coalesce(eb.ref('at_time'), eb.val('00:00')), 'asc')
      .orderBy('id', 'asc')
      .limit(limit)
      .execute();
    return rows as UpcomingReservationRow[];
  }

  /** `share.service.ts:251` — see {@link ShareEndpointRow}'s docstring. */
  async listEndpointsForShare(trip_id: number | string): Promise<ShareEndpointRow[]> {
    const rows = await this.kysely<ShareEndpointsKyselyDB>()
      .selectFrom('reservation_endpoints as e')
      .innerJoin('reservations as r', 'r.id', 'e.reservation_id')
      .select(['e.reservation_id', 'e.role', 'e.sequence', 'e.name', 'e.code', 'e.lat', 'e.lng', 'e.timezone', 'e.local_date', 'e.local_time'])
      .where('r.trip_id', '=', trip_id)
      .orderBy('e.reservation_id', 'asc')
      .orderBy('e.sequence', 'asc')
      .execute();
    return rows as ShareEndpointRow[];
  }

  /** `share.service.ts:368` — see {@link ShareDayPositionRow}'s docstring. */
  async listDayPositionsForShare(trip_id: number | string): Promise<ShareDayPositionRow[]> {
    const rows = await this.kysely<ShareDayPositionsKyselyDB>()
      .selectFrom('reservation_day_positions as rdp')
      .innerJoin('reservations as r', 'r.id', 'rdp.reservation_id')
      .select(['rdp.reservation_id', 'rdp.day_id', 'rdp.position'])
      .where('r.trip_id', '=', trip_id)
      .execute();
    return rows as ShareDayPositionRow[];
  }

  /** `share.service.ts:387` — see {@link SharePublicReservationRow}'s docstring. */
  async listPublicForShare(trip_id: number | string): Promise<SharePublicReservationRow[]> {
    const rows = await this.kysely<SharePublicReservationKyselyDB>()
      .selectFrom('reservations as r')
      .select([
        'r.id', 'r.trip_id', 'r.day_id', 'r.end_day_id', 'r.place_id', 'r.accommodation_id',
        'r.title', 'r.type', 'r.status', 'r.location', 'r.reservation_time', 'r.reservation_end_time',
        'r.notes', 'r.url', 'r.metadata', 'r.created_at',
      ])
      .where('r.trip_id', '=', trip_id)
      .where((eb) => publicReservationExpr(eb, 'r.ingest_state'))
      .orderBy('r.reservation_time', 'asc')
      .execute();
    return rows as SharePublicReservationRow[];
  }

  /** `share.service.ts:401` — see {@link SharePublicAccommodationRow}'s docstring. */
  async listPublicAccommodationsForShare(trip_id: number | string): Promise<SharePublicAccommodationRow[]> {
    const rows = await this.kysely<SharePublicAccommodationKyselyDB>()
      .selectFrom('day_accommodations as a')
      .where('a.trip_id', '=', trip_id)
      .where((eb) => publicStayExists(eb))
      .innerJoin('places as p', 'p.id', 'a.place_id')
      .select([
        'a.id', 'a.trip_id', 'a.place_id', 'a.start_day_id', 'a.end_day_id',
        'a.check_in', 'a.check_in_end', 'a.check_out', 'a.notes',
        'p.name as place_name', 'p.address as place_address', 'p.lat as place_lat', 'p.lng as place_lng',
      ])
      .execute();
    return rows as SharePublicAccommodationRow[];
  }

  /**
   * `share.service.ts`'s travel-only read (SH19, #1712) — `SELECT DISTINCT
   * a.place_id FROM day_accommodations a WHERE a.trip_id = ? AND <RV2('a')>`:
   * the places the trip sleeps at, through the same public-stay predicate as
   * {@link listPublicAccommodationsForShare}.
   */
  async listPublicStayPlaceIdsForShare(trip_id: number | string): Promise<number[]> {
    const rows = await this.kysely<SharePublicAccommodationKyselyDB>()
      .selectFrom('day_accommodations as a')
      .where('a.trip_id', '=', trip_id)
      .where((eb) => publicStayExists(eb))
      .select('a.place_id')
      .distinct()
      .execute();
    return rows.map((r) => r.place_id as number);
  }

  /** `public-api.service.ts::reservationsByDay` (Task 5's `// Task 2` pickup) — see {@link PublicApiScheduledReservationRow}'s docstring. */
  async listScheduledForPublicApi(trip_id: number): Promise<PublicApiScheduledReservationRow[]> {
    const rows = await this.kysely<PublicApiReservationKyselyDB>()
      .selectFrom('reservations')
      .select(['day_id', 'type', 'title', 'location', 'reservation_time', 'reservation_end_time', 'status', 'notes'])
      .where('trip_id', '=', trip_id)
      .where('day_id', 'is not', null)
      .orderBy('day_id', 'asc')
      .orderBy('reservation_time', 'asc')
      .execute();
    return rows as PublicApiScheduledReservationRow[];
  }

  /** `public-api.service.ts::buildUnscheduledReservations` (Task 5's `// Task 2` pickup) — see {@link PublicApiUnscheduledReservationRow}'s docstring. */
  async listUnscheduledForPublicApi(trip_id: number): Promise<PublicApiUnscheduledReservationRow[]> {
    const rows = await this.kysely<PublicApiReservationKyselyDB>()
      .selectFrom('reservations')
      .select(['type', 'title', 'location', 'reservation_time', 'reservation_end_time', 'status', 'notes'])
      .where('trip_id', '=', trip_id)
      .where('day_id', 'is', null)
      .orderBy('reservation_time', 'asc')
      .orderBy('id', 'asc')
      .execute();
    return rows as PublicApiUnscheduledReservationRow[];
  }

  /** `public-api.service.ts::buildAccommodations` (Task 5's `// Task 3` pickup) — see {@link PublicApiAccommodationRow}'s docstring. */
  async listAccommodationsForPublicApi(trip_id: number): Promise<PublicApiAccommodationRow[]> {
    const rows = await this.kysely<PublicApiAccommodationKyselyDB>()
      .selectFrom('day_accommodations as a')
      .leftJoin('places as p', 'p.id', 'a.place_id')
      .leftJoin('days as ds', 'ds.id', 'a.start_day_id')
      .leftJoin('days as de', 'de.id', 'a.end_day_id')
      .select(['p.name', 'p.address', 'p.lat', 'p.lng', 'ds.date as start_date', 'de.date as end_date', 'a.check_in', 'a.check_out', 'a.notes'])
      .where('a.trip_id', '=', trip_id)
      .orderBy('ds.date', 'asc')
      .execute();
    return rows as PublicApiAccommodationRow[];
  }

  /** `public-api.service.ts::buildUnplannedPlaces` (Task 5's `// Task 3` pickup) — see {@link PublicApiUnplannedPlaceRow}'s docstring. */
  async listUnplannedPlacesForPublicApi(trip_id: number): Promise<PublicApiUnplannedPlaceRow[]> {
    const rows = await this.kysely<PublicApiUnplannedPlaceKyselyDB>()
      .selectFrom('places as p')
      .leftJoin('categories as c', 'c.id', 'p.category_id')
      .select((eb) => [
        'p.name', 'p.address', 'p.lat', 'p.lng', 'p.place_time', 'p.end_time',
        'p.duration_minutes', 'p.notes', 'p.transport_mode', 'c.name as category',
      ])
      .where('p.trip_id', '=', trip_id)
      .where((eb) => eb.not(eb.exists(eb.selectFrom('day_assignments as da').select('da.id').whereRef('da.place_id', '=', 'p.id'))))
      .where((eb) => eb.not(eb.exists(eb.selectFrom('day_accommodations as a').select('a.id').whereRef('a.place_id', '=', 'p.id'))))
      .orderBy('p.created_at', 'asc')
      .orderBy('p.id', 'asc')
      .execute();
    return rows as PublicApiUnplannedPlaceRow[];
  }

  // ---------------------------------------------------------------------------
  // Plan 3e Task 1 (`FilesService.findForeignLinkTarget`, R12) — additive,
  // append-only per that task's own file-ownership rule.
  // ---------------------------------------------------------------------------

  /**
   * FL1 (`FilesService.findForeignLinkTarget`'s reservation branch) —
   * `SELECT 1 FROM reservations WHERE id = ? AND trip_id = ?`, re-expressed
   * as "what trip does this row belong to" (R12: one method per target
   * table, no dynamic identifier dispatch — the RS21/RS23/RS25 D4 precedent)
   * so the caller compares the returned `trip_id` against its own, already
   * `toRowId`-parsed value instead of binding two ids into the query itself.
   * `trip_id` is a `persist(false)` mirror of the `trip` relation —
   * `columnRef`, not a bare select (the program-wide trap).
   */
  async findTripId(id: number): Promise<number | undefined> {
    const platform = this.getEntityManager().getPlatform();
    const row = await this.qb('r')
      .select([columnRef(platform, 'r.trip_id').as('trip_id')])
      .where({ id })
      .execute<{ trip_id: number } | undefined>('get', false);
    return row?.trip_id;
  }

  // ---------------------------------------------------------------------------
  // Plan 3e Task 2 (budget) — additive, append-only per that task's own
  // file-ownership rule: BG54/85, BG55/86, BG56/87 — the mirrored-price
  // read/write/re-select `BudgetService.clearReservationPrice`/
  // `syncReservationPrice` run against a reservation. Kysely, matching
  // `findTripId` above's reasoning: `trip_id` is a `persist(false)` mirror.
  // ---------------------------------------------------------------------------

  /** BG54/BG85 — `SELECT id, metadata FROM reservations WHERE id = ? AND trip_id = ?`. */
  async getIdAndMetadata(id: number | string, trip_id: number | string): Promise<{ id: number; metadata: string | null } | undefined> {
    return await this.kysely<{ reservations: { id: number; trip_id: number; metadata: string | null } }>()
      .selectFrom('reservations')
      .select(['id', 'metadata'])
      .where('id', '=', id as number)
      .where('trip_id', '=', trip_id as number)
      .executeTakeFirst();
  }

  /** BG55/BG86 — `UPDATE reservations SET metadata = ? WHERE id = ?`. */
  async setMetadata(id: number | string, metadata: string): Promise<void> {
    await this.kysely<{ reservations: { id: number; metadata: string } }>()
      .updateTable('reservations')
      .set({ metadata })
      .where('id', '=', id as number)
      .execute();
  }

  /** BG56/BG87 — `SELECT * FROM reservations WHERE id = ?`, the mirrored-price re-select for the `reservation:updated` broadcast. */
  async getFull(id: number | string): Promise<ReservationAllColumnsRow | undefined> {
    return await this.kysely<{ reservations: ReservationAllColumnsRow }>()
      .selectFrom('reservations')
      .selectAll()
      .where('id', '=', id as number)
      .executeTakeFirst();
  }

  // ---------------------------------------------------------------------------
  // Plan 3h Task 4 (AirTrail's bookkeeping, `nest/integrations/airtrail*.ts` —
  // owns zero tables of its own, R7) + airports' flight-endpoint backfill
  // (`nest/airports/airports.service.ts`) — additive, per this task's own
  // file-ownership rule ("additive methods on Reservations/ReservationEndpoints/
  // Days/Places/Users repositories"). `trip_id` is a `persist(false)` FK
  // mirror — every trip-scoped read below filters by the `trip` ref property
  // (the `findInTrip`/`listResyncCandidates` precedent above), never a raw
  // column name.
  // ---------------------------------------------------------------------------

  /** ATI1 (`airtrail-import.service.ts#importAirtrailFlights`, dedup: already-linked ids) — `SELECT external_id, metadata FROM reservations WHERE trip_id = ? AND external_source = 'airtrail'`. */
  async listAirtrailLinkedForTrip(trip_id: number): Promise<{ external_id: string | null; metadata: string | null }[]> {
    return this.qb('r')
      .select(['r.external_id', 'r.metadata'])
      .where({ trip: trip_id, external_source: 'airtrail' })
      .execute<{ external_id: string | null; metadata: string | null }[]>('all', false);
  }

  /** ATI2 (`airtrail-import.service.ts#importAirtrailFlights`, existing-flight signature dedup) — `SELECT r.id, r.reservation_time, r.metadata FROM reservations r WHERE r.trip_id = ? AND r.type = 'flight'`. */
  async listFlightReservationsForTrip(trip_id: number): Promise<{ id: number; reservation_time: string | null; metadata: string | null }[]> {
    return this.qb('r')
      .select(['r.id', 'r.reservation_time', 'r.metadata'])
      .where({ trip: trip_id, type: 'flight' })
      .execute<{ id: number; reservation_time: string | null; metadata: string | null }[]>('all', false);
  }

  /**
   * ATI5 (`airtrail-import.service.ts#importAirtrailFlights`, multi-leg
   * branch) — `UPDATE reservations SET external_source = 'airtrail',
   * external_id = ?, external_owner_user_id = ?, sync_enabled = 0,
   * external_synced_at = ? WHERE id = ?`. **CORRECTNESS GAP, pre-existing,
   * report don't fix** (inventory §3b): neither this nor {@link
   * linkAirtrailSingleFlight} is transactional with the preceding
   * `ReservationsService.create` call — a failure between the two leaves an
   * untracked reservation. Preserved exactly, not "fixed" with an added
   * `uow.transactional` wrap.
   */
  async linkAirtrailMultiLeg(id: number, external_id: string, external_owner_user_id: number, external_synced_at: string): Promise<void> {
    await this.nativeUpdate({ id }, { external_source: 'airtrail', external_id, external_owner_user_id, sync_enabled: 0, external_synced_at });
  }

  /**
   * ATI6 (`airtrail-import.service.ts#importAirtrailFlights`, single-flight
   * branch) — `UPDATE reservations SET external_source = 'airtrail',
   * external_id = ?, external_owner_user_id = ?, sync_enabled = 1,
   * external_hash = ?, external_synced_at = ? WHERE id = ?`. Same
   * pre-existing tx gap as {@link linkAirtrailMultiLeg} — report don't fix.
   */
  async linkAirtrailSingleFlight(id: number, external_id: string, external_owner_user_id: number, external_hash: string, external_synced_at: string): Promise<void> {
    await this.nativeUpdate({ id }, { external_source: 'airtrail', external_id, external_owner_user_id, sync_enabled: 1, external_hash, external_synced_at });
  }

  /** ATL2 (`airtrail-link.service.ts#detach`) — `UPDATE reservations SET sync_enabled = 0 WHERE id = ?`. */
  async setAirtrailSyncDisabled(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { sync_enabled: 0 });
  }

  /**
   * ATL4 (`airtrail-link.service.ts#pushReservationToAirtrail`) — `SELECT
   * id, trip_id, external_id, external_owner_user_id, sync_enabled FROM
   * reservations WHERE id = ? AND external_source = 'airtrail'`. `trip_id`
   * via `columnRef` (the `listResyncCandidates` precedent above) — the
   * mirror column, not a bare select.
   */
  async findAirtrailLinked(id: number): Promise<{ id: number; trip_id: number; external_id: string | null; external_owner_user_id: number | null; sync_enabled: number | null } | undefined> {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('r')
      .select(['r.id', columnRef(platform, 'r.trip_id').as('trip_id'), 'r.external_id', 'r.external_owner_user_id', 'r.sync_enabled'])
      .where({ id, external_source: 'airtrail' })
      .execute<{ id: number; trip_id: number; external_id: string | null; external_owner_user_id: number | null; sync_enabled: number | null } | undefined>('get', false);
  }

  /**
   * ATL5 (`airtrail-link.service.ts#pushReservationToAirtrail`, self-write
   * suppression) / ATS2 (`airtrail-sync.service.ts#syncOwner`, byte-identical
   * 2nd call site) — `UPDATE reservations SET external_hash = ?,
   * external_synced_at = ? WHERE id = ?`. One method, two call sites (D4).
   */
  async setAirtrailSyncStamp(id: number, external_hash: string, external_synced_at: string): Promise<void> {
    await this.nativeUpdate({ id }, { external_hash, external_synced_at });
  }

  /**
   * ATS1 (`airtrail-sync.service.ts#syncOwner`) — `SELECT id, trip_id,
   * external_id, external_hash FROM reservations WHERE external_source =
   * 'airtrail' AND sync_enabled = 1 AND external_owner_user_id = ?`.
   */
  async listAirtrailSyncCandidatesForOwner(owner_user_id: number): Promise<{ id: number; trip_id: number; external_id: string | null; external_hash: string | null }[]> {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('r')
      .select(['r.id', columnRef(platform, 'r.trip_id').as('trip_id'), 'r.external_id', 'r.external_hash'])
      .where({ external_source: 'airtrail', sync_enabled: 1, external_owner_user_id: owner_user_id })
      .execute<{ id: number; trip_id: number; external_id: string | null; external_hash: string | null }[]>('all', false);
  }

  /**
   * ATS3 (`airtrail-sync.service.ts#runAirtrailSync`) — `SELECT DISTINCT
   * external_owner_user_id AS uid FROM reservations WHERE external_source =
   * 'airtrail' AND sync_enabled = 1 AND external_owner_user_id IS NOT NULL`.
   * **NON-HTTP ENTRYPOINT SOURCE** — the cron poll's owner list.
   */
  async listAirtrailSyncOwners(): Promise<number[]> {
    const rows = await this.qb('r')
      .select(['r.external_owner_user_id'])
      .distinct()
      .where({ external_source: 'airtrail', sync_enabled: 1, external_owner_user_id: { $ne: null } })
      .execute<{ external_owner_user_id: number }[]>('all', false);
    return rows.map((row) => row.external_owner_user_id);
  }

  /**
   * AIR1 (`airports.service.ts#backfillFlightEndpoints`) — `SELECT r.id,
   * r.metadata, r.reservation_time, r.reservation_end_time FROM reservations
   * r WHERE r.type = 'flight' AND NOT EXISTS (SELECT 1 FROM
   * reservation_endpoints e WHERE e.reservation_id = r.id)`. **NON-HTTP
   * ENTRYPOINT SOURCE** — the boot-sweep backfill; idempotent via this NOT
   * EXISTS guard, same shape as `Reservations.repository.ts`'s own
   * `listUnplannedPlacesForPublicApi` NOT EXISTS precedent (`eb.not(eb.exists(...))`).
   */
  async listFlightsMissingEndpoints(): Promise<{ id: number; metadata: string | null; reservation_time: string | null; reservation_end_time: string | null }[]> {
    const rows = await this.kysely<FlightsMissingEndpointsKyselyDB>()
      .selectFrom('reservations as r')
      .select(['r.id', 'r.metadata', 'r.reservation_time', 'r.reservation_end_time'])
      .where('r.type', '=', 'flight')
      .where((eb) => eb.not(eb.exists(eb.selectFrom('reservation_endpoints as e').select('e.id').whereRef('e.reservation_id', '=', 'r.id'))))
      .execute();
    return rows;
  }

  /** AIR3 (`airports.service.ts#backfillFlightEndpoints`, looped) — `UPDATE reservations SET needs_review = 1 WHERE id = ?`. */
  async markNeedsReview(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { needs_review: 1 });
  }

  /** RPL4/RPL5's shared select list, the columns of `RoadtripCarrierRow`. */
  private roadtripCarrierQuery() {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('r')
      .select([
        'r.id',
        'r.type',
        'r.title',
        columnRef(platform, 'r.day_id').as('day_id'),
        columnRef(platform, 'r.end_day_id').as('end_day_id'),
        'r.reservation_time',
        'r.reservation_end_time',
        'r.metadata',
        'r.day_plan_position',
      ]);
  }

  /**
   * RPL4 (`RoadtripPlanService.carriers`) — `SELECT id, type, title, day_id,
   * end_day_id, reservation_time, reservation_end_time, metadata,
   * day_plan_position FROM reservations WHERE trip_id = ? AND type IN
   * ('flight', 'train', 'ferry', 'cruise', 'bus', 'car') AND day_id IS NOT
   * NULL`: the bookings that seam the drive, and the hire cars whose desks
   * stand on it.
   */
  async listRoadtripCarriers(trip_id: number): Promise<RoadtripCarrierRow[]> {
    return this.roadtripCarrierQuery()
      .where({ trip: trip_id, type: { $in: ['flight', 'train', 'ferry', 'cruise', 'bus', 'car'] }, day: { $ne: null } })
      .execute<RoadtripCarrierRow[]>('all', false);
  }

  /**
   * RPL5 (`RoadtripPlanService.undatedRides`) — `SELECT id, type, title,
   * day_id, end_day_id, reservation_time, reservation_end_time, metadata,
   * day_plan_position FROM reservations WHERE trip_id = ? AND day_id IS
   * NULL`. Which of them count as rides is `undatedRides` (shared) alone.
   */
  async listRoadtripUndated(trip_id: number): Promise<RoadtripCarrierRow[]> {
    return this.roadtripCarrierQuery()
      .where({ trip: trip_id, day: null })
      .execute<RoadtripCarrierRow[]>('all', false);
  }
}

/**
 * RPL4/RPL5's row: a booking the traveller rides, with what the road trip's
 * seam needs of it (the days and clocks at both ends, where the day plan
 * seats it). The terminals and day positions are joined on in the service.
 */
export interface RoadtripCarrierRow {
  id: number;
  type: string;
  title: string;
  day_id: number | null;
  end_day_id: number | null;
  reservation_time: string | null;
  reservation_end_time: string | null;
  metadata: string | null;
  day_plan_position: number | null;
}

/** `SELECT *` — every scalar column of `Reservations`, RS35's shape. */
export interface ReservationAllColumnsRow {
  id: number;
  trip_id: number;
  day_id: number | null;
  end_day_id: number | null;
  place_id: number | null;
  assignment_id: number | null;
  title: string;
  accommodation_id: string | null;
  reservation_time: string | null;
  reservation_end_time: string | null;
  location: string | null;
  confirmation_number: string | null;
  notes: string | null;
  status: string | null;
  type: string | null;
  created_at: string | null;
  metadata: string | null;
  day_plan_position: number | null;
  needs_review: number;
  external_source: string | null;
  external_id: string | null;
  external_owner_user_id: number | null;
  external_synced_at: string | null;
  sync_enabled: number | null;
  external_hash: string | null;
  url: string | null;
  ingest_state: string;
}
