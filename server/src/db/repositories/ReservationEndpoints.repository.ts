import type { ReservationEndpoints } from '../entities/ReservationEndpoints.entity';
import { type AssertRowKeys } from './_shared/rows';
import { columnRef } from '../dialect/sql-functions';
import { travelerOwnsExpr, type ReservationTravelersOwnsKyselyDB } from './_shared/reservation-travelers-owns';
import { TrekRepository } from './_shared/trek-repository';

/** A `reservation_endpoints` row exactly as `r.*`/`SELECT *` read it (every scalar column). */
export interface ReservationEndpointRow {
  id: number;
  reservation_id: number;
  role: string;
  sequence: number;
  name: string;
  code: string | null;
  lat: number;
  lng: number;
  timezone: string | null;
  local_time: string | null;
  local_date: string | null;
  created_at: string | null;
}

const _reservationEndpointRowKeys: AssertRowKeys<ReservationEndpointRow, ReservationEndpoints> = true;

export class ReservationEndpointsRepository extends TrekRepository<ReservationEndpoints> {
  /**
   * RS3 (`ReservationsService.loadEndpointsByTrip`) — `SELECT e.* FROM
   * reservation_endpoints e JOIN reservations r ON e.reservation_id = r.id
   * WHERE r.trip_id = ? ORDER BY e.reservation_id, e.sequence`. The
   * per-reservation grouping into a `Map` stays in the service (JS, not SQL).
   */
  async listForTrip(trip_id: number): Promise<ReservationEndpointRow[]> {
    return this.qb('e')
      .join('e.reservation', 'r')
      .select(['e.*'])
      .where({ 'r.trip': trip_id })
      .orderBy({ 'e.reservation': 'asc', 'e.sequence': 'asc' })
      .execute<ReservationEndpointRow[]>('all', false);
  }

  /**
   * RR2 (`ReservationsReadService.loadEndpoints`) — `SELECT * FROM
   * reservation_endpoints WHERE reservation_id = ? ORDER BY sequence`.
   */
  async listForReservation(reservation_id: number): Promise<ReservationEndpointRow[]> {
    return this.qb('e')
      .select(['e.*'])
      .where({ reservation: reservation_id })
      .orderBy({ sequence: 'asc' })
      .execute<ReservationEndpointRow[]>('all', false);
  }

  /** RS16 (`ReservationsService.saveEndpoints`'s replace-all) — `DELETE FROM reservation_endpoints WHERE reservation_id = ?`. */
  async deleteForReservation(reservation_id: number): Promise<void> {
    await this.nativeDelete({ reservation: reservation_id });
  }

  /**
   * RS17 — `INSERT INTO reservation_endpoints (reservation_id, role,
   * sequence, name, code, lat, lng, timezone, local_time, local_date) VALUES
   * (?×10)`, one row per call (the legacy `prepare` + per-row `run`). The
   * lat/lng-null skip and the `sequence ?? i` (index AFTER the filter) stay
   * in the service — this writes exactly the row it is handed.
   */
  async insertEndpoint(input: {
    reservation_id: number;
    role: string;
    sequence: number;
    name: string;
    code: string | null;
    lat: number;
    lng: number;
    timezone: string | null;
    local_time: string | null;
    local_date: string | null;
  }): Promise<number> {
    return await this.insert({
      reservation: input.reservation_id,
      role: input.role,
      sequence: input.sequence,
      name: input.name,
      code: input.code,
      lat: input.lat,
      lng: input.lng,
      timezone: input.timezone,
      local_time: input.local_time,
      local_date: input.local_date,
    });
  }

  /** DY17 (`DaysService.restampReservationDates`) — `SELECT id, local_date FROM reservation_endpoints WHERE reservation_id = ?`. */
  async listIdAndDate(reservation_id: number): Promise<{ id: number; local_date: string | null }[]> {
    return this.qb('e')
      .select(['e.id', 'e.local_date'])
      .where({ reservation: reservation_id })
      .execute<{ id: number; local_date: string | null }[]>('all', false);
  }

  /** DY18 — `UPDATE reservation_endpoints SET local_date = ? WHERE id = ?`. */
  async setLocalDate(id: number, local_date: string): Promise<void> {
    await this.nativeUpdate({ id }, { local_date });
  }

  // ---------------------------------------------------------------------------
  // Plan 3h Task 4 (`airtrail-import.service.ts`) — additive, per this task's
  // own file-ownership rule.
  // ---------------------------------------------------------------------------

  /**
   * ATI3 (`airtrail-import.service.ts#importAirtrailFlights`) — `SELECT
   * e.reservation_id, e.code, e.local_date, e.sequence FROM
   * reservation_endpoints e JOIN reservations r ON r.id = e.reservation_id
   * WHERE r.trip_id = ? AND r.type = 'flight' ORDER BY e.sequence`. Distinct
   * from {@link listForTrip} above (RS3): a narrower column list, a
   * `r.type = 'flight'` filter and a single-key `ORDER BY e.sequence` (not
   * `e.reservation_id, e.sequence`) — a genuinely different statement, per
   * D4.
   */
  async listFlightEndpointsForTrip(trip_id: number): Promise<{ reservation_id: number; code: string | null; local_date: string | null; sequence: number }[]> {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('e')
      .join('e.reservation', 'r')
      .select([columnRef(platform, 'e.reservation_id').as('reservation_id'), 'e.code', 'e.local_date', 'e.sequence'])
      .where({ 'r.trip': trip_id, 'r.type': 'flight' })
      .orderBy({ sequence: 'asc' })
      .execute<{ reservation_id: number; code: string | null; local_date: string | null; sequence: number }[]>('all', false);
  }

  // ---------------------------------------------------------------------------
  // Plan 3f Task 1 (`AtlasService`) — additive, append-only per that task's
  // own file-ownership rule. AT6/AT45/AT46 all consume Task 0's shared
  // `travelerOwnsExpr` (`_shared/reservation-travelers-owns.ts`, R7) rather
  // than re-deriving the `TRAVELER_OWNS` fragment — one predicate, three
  // call sites, per the plan's own instruction.
  // ---------------------------------------------------------------------------

  /**
   * AT6 (`AtlasService#stats`, countries reached only by a flight —
   * #1366/#1486/#1535/#1966) — `SELECT DISTINCT e.id, e.reservation_id,
   * r.trip_id, e.role, e.code, e.lat, e.lng, e.local_date, e.local_time,
   * r.type AS reservation_type, r.status AS reservation_status, CASE e.role
   * WHEN 'to' THEN COALESCE(r.reservation_end_time, r.reservation_time)
   * ELSE COALESCE(r.reservation_time, r.reservation_end_time) END AS
   * fallback_time FROM reservation_endpoints e JOIN reservations r ON
   * e.reservation_id = r.id WHERE r.trip_id IN (...) AND e.role IN ('from',
   * 'to') AND ${TRAVELER_OWNS}`. Dynamic `IN`, empty-array short-circuit —
   * the caller (`getUserTrips`'s own tripIds) already guards the zero-trip
   * case before this ever runs, but the guard is repeated here to match
   * every other dynamic-`IN` site in this cluster (AT2/AT3/AT23/AT28).
   */
  async listOwnedEndpointsForTrips(tripIds: number[], userId: number): Promise<TravelerOwnedEndpointRow[]> {
    if (tripIds.length === 0) return [];
    const rows = await this.kysely<TravelerOwnedEndpointsKyselyDB>()
      .selectFrom('reservation_endpoints as e')
      .innerJoin('reservations as r', 'r.id', 'e.reservation_id')
      .select((eb) => [
        'e.id', 'e.reservation_id', 'r.trip_id', 'e.role', 'e.code', 'e.lat', 'e.lng', 'e.local_date', 'e.local_time',
        'r.type as reservation_type', 'r.status as reservation_status',
        eb.case().when('e.role', '=', 'to').then(eb.fn.coalesce('r.reservation_end_time', 'r.reservation_time')).else(eb.fn.coalesce('r.reservation_time', 'r.reservation_end_time')).end().as('fallback_time'),
      ])
      .distinct()
      .where('r.trip_id', 'in', tripIds)
      .where('e.role', 'in', ['from', 'to'])
      .where((eb) => travelerOwnsExpr(eb, userId))
      .execute();
    return rows as TravelerOwnedEndpointRow[];
  }

  /**
   * AT45 (`AtlasService#getTravelStats`) — the widest single statement in
   * this plan: `SELECT DISTINCT e.id, e.reservation_id, r.trip_id, e.role,
   * e.code, e.lat, e.lng, e.local_date, e.local_time, r.type AS
   * reservation_type, r.status AS reservation_status, CASE e.role WHEN
   * 'to' THEN COALESCE(r.reservation_end_time, r.reservation_time) ELSE
   * COALESCE(r.reservation_time, r.reservation_end_time) END AS
   * fallback_time FROM reservation_endpoints e JOIN reservations r ON
   * e.reservation_id = r.id JOIN trips t ON r.trip_id = t.id LEFT JOIN
   * trip_members tm ON t.id = tm.trip_id WHERE (t.user_id = ? OR tm.user_id
   * = ?) AND e.role IN ('from', 'to') AND COALESCE(t.start_date, t.end_date)
   * IS NOT NULL AND COALESCE(t.start_date, t.end_date) <= date('now') AND
   * ${TRAVELER_OWNS}`. `today` resolved by the caller once (`todayUtc()`),
   * the `TripsRepository.activeTrip`/`lastStartedTrip` precedent.
   */
  async listOwnedEndpointsForUser(userId: number, today: string): Promise<TravelerOwnedEndpointRow[]> {
    const rows = await this.kysely<TravelerOwnedEndpointsWithTripsKyselyDB>()
      .selectFrom('reservation_endpoints as e')
      .innerJoin('reservations as r', 'r.id', 'e.reservation_id')
      .innerJoin('trips as t', 't.id', 'r.trip_id')
      .leftJoin('trip_members as tm', 'tm.trip_id', 't.id')
      .select((eb) => [
        'e.id', 'e.reservation_id', 'r.trip_id', 'e.role', 'e.code', 'e.lat', 'e.lng', 'e.local_date', 'e.local_time',
        'r.type as reservation_type', 'r.status as reservation_status',
        eb.case().when('e.role', '=', 'to').then(eb.fn.coalesce('r.reservation_end_time', 'r.reservation_time')).else(eb.fn.coalesce('r.reservation_time', 'r.reservation_end_time')).end().as('fallback_time'),
      ])
      .distinct()
      .where((eb) => eb.or([eb('t.user_id', '=', userId), eb('tm.user_id', '=', userId)]))
      .where('e.role', 'in', ['from', 'to'])
      .where((eb) => eb(eb.fn.coalesce('t.start_date', 't.end_date'), 'is not', null))
      .where((eb) => eb(eb.fn.coalesce('t.start_date', 't.end_date'), '<=', today))
      .where((eb) => travelerOwnsExpr(eb, userId))
      .execute();
    return rows as TravelerOwnedEndpointRow[];
  }

  /**
   * AT46 (`AtlasService#flightDistanceKm`) — `SELECT re.reservation_id,
   * re.lat, re.lng FROM reservation_endpoints re JOIN reservations r ON
   * r.id = re.reservation_id JOIN trips t ON t.id = r.trip_id LEFT JOIN
   * trip_members tm ON tm.trip_id = t.id AND tm.user_id = ? WHERE
   * (t.user_id = ? OR tm.user_id IS NOT NULL) AND r.type = 'flight' AND
   * r.status != 'cancelled' AND ${TRAVELER_OWNS} ORDER BY re.reservation_id,
   * re.sequence`. The haversine summing across ordered legs stays in the
   * SERVICE (unchanged JS).
   */
  async listOwnedFlightLegsForUser(userId: number): Promise<{ reservation_id: number; lat: number; lng: number }[]> {
    return await this.kysely<TravelerOwnedEndpointsWithTripsKyselyDB>()
      .selectFrom('reservation_endpoints as re')
      .innerJoin('reservations as r', 'r.id', 're.reservation_id')
      .innerJoin('trips as t', 't.id', 'r.trip_id')
      .leftJoin('trip_members as tm', (join) => join.onRef('tm.trip_id', '=', 't.id').on('tm.user_id', '=', userId))
      .select(['re.reservation_id', 're.lat', 're.lng'])
      .where((eb) => eb.or([eb('t.user_id', '=', userId), eb('tm.user_id', 'is not', null)]))
      .where('r.type', '=', 'flight')
      .where('r.status', '!=', 'cancelled')
      .where((eb) => travelerOwnsExpr(eb, userId))
      .orderBy('re.reservation_id', 'asc')
      .orderBy('re.sequence', 'asc')
      .execute();
  }

  /**
   * RPL6 (`RoadtripPlanService.withTerminals`) — `SELECT e.reservation_id,
   * e.role, e.sequence, e.name, e.code, e.lat, e.lng FROM
   * reservation_endpoints e JOIN reservations r ON r.id = e.reservation_id
   * WHERE r.trip_id = ? ORDER BY e.reservation_id, e.sequence`. Same join and
   * order as {@link listForTrip} (RS3) but its own column list, per D4.
   */
  async listRoadtripTerminals(trip_id: number): Promise<RoadtripTerminalRow[]> {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('e')
      .join('e.reservation', 'r')
      .select([columnRef(platform, 'e.reservation_id').as('reservation_id'), 'e.role', 'e.sequence', 'e.name', 'e.code', 'e.lat', 'e.lng'])
      .where({ 'r.trip': trip_id })
      .orderBy({ 'e.reservation': 'asc', 'e.sequence': 'asc' })
      .execute<RoadtripTerminalRow[]>('all', false);
  }
}

/** RPL6's row: a terminal of a booking the road trip's seam reads, keyed by its reservation. */
export interface RoadtripTerminalRow {
  reservation_id: number;
  role: string;
  sequence: number;
  name: string;
  code: string | null;
  lat: number;
  lng: number;
}

/** AT6/AT45's shared projection — `EndpointRow`'s own shape in `atlas.service.ts` (kept independent here so this repository doesn't import a `nest/` type). */
export interface TravelerOwnedEndpointRow {
  id: number;
  reservation_id: number;
  trip_id: number;
  role: string;
  code: string | null;
  lat: number;
  lng: number;
  local_date: string | null;
  local_time: string | null;
  reservation_type: string | null;
  reservation_status: string | null;
  fallback_time: string | null;
}

/** {@link ReservationEndpointsRepository.listOwnedEndpointsForTrips}'s narrow `reservation_endpoints`/`reservations`/`reservation_travelers` shape (`r` aliased for `travelerOwnsExpr`, R7). */
interface TravelerOwnedEndpointsKyselyDB extends ReservationTravelersOwnsKyselyDB {
  reservation_endpoints: { id: number; reservation_id: number; role: string; sequence: number; code: string | null; lat: number; lng: number; local_date: string | null; local_time: string | null };
  reservations: ReservationTravelersOwnsKyselyDB['reservations'] & { trip_id: number; type: string | null; status: string | null; reservation_time: string | null; reservation_end_time: string | null };
}

/** {@link ReservationEndpointsRepository.listOwnedEndpointsForUser}/{@link ReservationEndpointsRepository.listOwnedFlightLegsForUser}'s narrow shape, adding `trips`/`trip_members` to {@link TravelerOwnedEndpointsKyselyDB}. */
interface TravelerOwnedEndpointsWithTripsKyselyDB extends TravelerOwnedEndpointsKyselyDB {
  trips: { id: number; user_id: number; start_date: string | null; end_date: string | null };
  trip_members: { trip_id: number; user_id: number };
}
