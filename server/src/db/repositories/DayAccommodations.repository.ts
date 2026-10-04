import type { DayAccommodations } from '../entities/DayAccommodations.entity';
import { coalesceOverride, columnRef } from '../dialect/sql-functions';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/**
 * A `day_accommodations` row exactly as AC34 (`AccommodationsService
 * .getAccommodation`) re-selects it — every scalar column of the entity
 * (`a.*`), the trip-scoping guard every write path (REST update/delete, MCP,
 * RPC) re-reads through.
 */
export interface DayAccommodationRow {
  id: number;
  trip_id: number;
  place_id: number | null;
  start_day_id: number;
  end_day_id: number;
  check_in: string | null;
  check_in_end: string | null;
  check_out: string | null;
  confirmation: string | null;
  notes: string | null;
  created_at: string | null;
}

const _dayAccommodationRowKeys: AssertRowKeys<DayAccommodationRow, DayAccommodations> = true;

/** AC2's projection: {@link DayAccommodationRow} plus the linked place's display fields. */
export interface DayAccommodationWithPlaceRow extends DayAccommodationRow {
  place_name: string | null;
  place_address: string | null;
  place_image: string | null;
  place_lat: number | null;
  place_lng: number | null;
}

/** AC3's projection: {@link DayAccommodationWithPlaceRow} plus the linked booking's title — one row per linked `reservations` row (the LEFT JOIN fans out; parity keeps the duplicates, AC3's own ruling). */
export interface DayAccommodationListRow extends DayAccommodationWithPlaceRow {
  reservation_title: string | null;
}

/**
 * Kysely typing for AC3 (`listForTripWithPlaceAndBooking`) — `reservations
 * .accommodation_id` is a bare `p.text().nullable()` column with no FK to
 * `day_accommodations` (§18.1 of the inventory, the same gap
 * `ReservationsRepository.joinedQuery` documents from the other side), so
 * the QueryBuilder's relation-path `.join()` cannot express `LEFT JOIN
 * reservations r ON r.accommodation_id = a.id` at all.
 */
interface DayAccommodationListKyselyDB {
  day_accommodations: {
    id: number;
    // `number | string` — `ReservationsRepository.listForTrip`'s own
    // `trip_id` widening: the raw-bind flexibility a `.where(col, '=',
    // value)` call keeps regardless of how loosely its value is typed
    // (program rule 23 bans a raw SQL-text condition, not a loosely-typed
    // bound value).
    trip_id: number | string;
    place_id: number | null;
    start_day_id: number;
    end_day_id: number;
    check_in: string | null;
    check_in_end: string | null;
    check_out: string | null;
    confirmation: string | null;
    notes: string | null;
    created_at: string | null;
  };
  places: {
    id: number;
    name: string;
    address: string | null;
    image_url: string | null;
    lat: number | null;
    lng: number | null;
  };
  reservations: {
    accommodation_id: string | null;
    title: string;
  };
}

/**
 * Plan 3d Task 2 (`ReservationsService`'s `day_accommodations` writes — RS27,
 * RS29, RS30, RS37–RS40, RS42, RS43, RS46, RS47 — plus the RS21 dispatch
 * union's `'day_accommodations'` arm). This is the reservations-owned SUBSET
 * of the repository: `days.service.ts` DY19/DY20/DY22 and `places.service.ts`
 * PL16 (Plan 3d Task 3) add methods here too — the class is shared, per the
 * inventory's own note (§7) — Task 3 appends rather than replaces.
 *
 * `day_accommodations` has no MikroORM relation to `reservations`
 * (`reservations.accommodation_id` is a bare `p.text().nullable()` column,
 * no FK — Task 0's R10 finding) — every method here that only reaches this
 * table stays on the QueryBuilder/`nativeUpdate`/`insert`, never Kysely: the
 * TEXT-vs-INTEGER join lives in `ReservationsRepository`, not here.
 */
export class DayAccommodationsRepository extends TrekRepository<DayAccommodations> {
  /**
   * RS27/RS40 (`ReservationsService.createInTx`/`updateInTx`'s auto-create
   * branch) — `INSERT INTO day_accommodations (trip_id, place_id,
   * start_day_id, end_day_id, check_in, check_out, confirmation) VALUES
   * (?×7)`. Seven columns only — no `check_in_end`, no `notes` (unlike
   * `AccommodationsService`'s own AC30, a 9-column insert — a DIFFERENT
   * method, D4). The caller passes already-decided values (the `|| null`
   * coercions stay in the service); `em.insert()` returns the generated PK.
   */
  async insertBookingStay(input: {
    trip_id: number | string;
    place_id: number | null;
    start_day_id: number;
    end_day_id: number;
    check_in: string | null;
    check_out: string | null;
    confirmation: string | null;
  }): Promise<number> {
    return await this.insert({
      trip: input.trip_id,
      place: input.place_id,
      startDay: input.start_day_id,
      endDay: input.end_day_id,
      check_in: input.check_in,
      check_out: input.check_out,
      confirmation: input.confirmation,
    });
  }

  /**
   * RS29/RS42 — `UPDATE day_accommodations SET check_in = COALESCE(?,
   * check_in), check_in_end = COALESCE(?, check_in_end), check_out =
   * COALESCE(?, check_out) WHERE id = ?`. `coalesceOverride` (value-side, a
   * bound `?` FIRST, the column the fallback — the new value wins) through
   * `qb().update()` — `nativeUpdate`'s `EntityData` shape doesn't accept a
   * raw fragment value (`DayAssignmentsRepository.shiftOrderFrom`'s
   * precedent).
   */
  async patchTimes(id: number, check_in: string | null, check_in_end: string | null, check_out: string | null): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.qb()
      .update({
        check_in: coalesceOverride(platform, check_in, 'check_in'),
        check_in_end: coalesceOverride(platform, check_in_end, 'check_in_end'),
        check_out: coalesceOverride(platform, check_out, 'check_out'),
      })
      .where({ id })
      .execute('run');
  }

  /** RS30/RS43 — `UPDATE day_accommodations SET confirmation = COALESCE(?, confirmation) WHERE id = ?`. */
  async patchConfirmation(id: number, confirmation: string | null): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.qb()
      .update({ confirmation: coalesceOverride(platform, confirmation, 'confirmation') })
      .where({ id })
      .execute('run');
  }

  /**
   * RS37/RS46 — `SELECT id FROM day_accommodations WHERE id = ? AND trip_id
   * = ?`. `id`/`trip_id: number` (typed filter, program rule 23): both
   * callers (`updateInTx`'s re-link scoping check, `remove`'s own-stay
   * check) pass the SAME `toRowId`-parsed trip id the service method itself
   * resolved once at its gate.
   */
  async existsInTrip(id: number, trip_id: number): Promise<boolean> {
    const row = await this.qb('a')
      .select(['a.id'])
      .where({ id, trip: trip_id })
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /** RS38 — `SELECT check_in FROM day_accommodations WHERE id = ?`. */
  async getCheckIn(id: number): Promise<string | null | undefined> {
    const row = await this.qb('a')
      .select(['a.check_in'])
      .where({ id })
      .execute<{ check_in: string | null } | undefined>('get', false);
    return row?.check_in;
  }

  /**
   * RS39 — `UPDATE day_accommodations SET place_id = ?, start_day_id = ?,
   * end_day_id = ?, check_in = ?, check_out = ?, confirmation = ? WHERE id =
   * ?`. Six columns (no `check_in_end`/`notes`, unlike `AccommodationsService
   * .moveStay`'s own write) — the caller's already-decided values, written
   * verbatim (the `PlacesRepository.updatePlace`/PL11 precedent: no SQL-side
   * COALESCE here, the legacy statement itself has none for these columns).
   */
  async updateFromBooking(id: number, write: {
    place_id: number | null;
    start_day_id: number;
    end_day_id: number;
    check_in: string | null;
    check_out: string | null;
    confirmation: string | null;
  }): Promise<void> {
    await this.nativeUpdate({ id }, {
      place: write.place_id,
      startDay: write.start_day_id,
      endDay: write.end_day_id,
      check_in: write.check_in,
      check_out: write.check_out,
      confirmation: write.confirmation,
    });
  }

  /** RS47 — `DELETE FROM day_accommodations WHERE id = ? AND trip_id = ?`, run AFTER `accommodations.dropStayStops` (ordering load-bearing, kept in the service). `id`/`trip_id: number` (typed filter, program rule 23; rule 21 — the SAME `toRowId`-parsed trip id `existsInTrip`'s gate read used). */
  async deleteInTrip(id: number, trip_id: number): Promise<void> {
    await this.nativeDelete({ id, trip: trip_id });
  }

  /**
   * RS21's `'day_accommodations'` dispatch arm (`ReservationsService
   * .referencesOutsideTrip`'s `elsewhere('day_accommodations',
   * data.accommodation_id)` — `SELECT trip_id FROM day_accommodations WHERE
   * id = ?`). A missing row is not an offender (the caller's own `!!row &&
   * String(row.trip_id) !== String(tripId)` check, preserved in the
   * service) — this returns `undefined` on a miss, never throws.
   */
  async getTripId(id: number): Promise<number | undefined> {
    const platform = this.getEntityManager().getPlatform();
    const row = await this.qb('a')
      .select([columnRef(platform, 'a.trip_id').as('trip_id')])
      .where({ id })
      .execute<{ trip_id: number } | undefined>('get', false);
    return row?.trip_id;
  }

  // ---------------------------------------------------------------------------
  // Plan 3d Task 3 (`AccommodationsService`, `days.service.ts` DY19/DY20/DY22,
  // `places.service.ts` PL16) — appended after Task 2's own methods above,
  // per this task's file-ownership rule ("the class is shared... Task 3
  // appends rather than replaces").
  // ---------------------------------------------------------------------------

  /**
   * AC2 (`AccommodationsService.getAccommodationWithPlace`) — `SELECT a.*,
   * p.name as place_name, p.address as place_address, p.image_url as
   * place_image, p.lat as place_lat, p.lng as place_lng FROM
   * day_accommodations a LEFT JOIN places p ON a.place_id = p.id WHERE a.id
   * = ?`. The re-select every stay write answers with, post-commit.
   */
  async findWithPlace(id: number): Promise<DayAccommodationWithPlaceRow | undefined> {
    // `{ 'a.id': id }`, not a bare `{ id }` (`DayAssignmentsRepository
    // .findWithPlaceAndCategory`'s precedent): the LEFT JOIN to `places`
    // means an unqualified `id` key is ambiguous between `a.id` and `p.id`.
    return await this.qb('a')
      .leftJoin('a.place', 'p')
      .select(['a.*', 'p.name as place_name', 'p.address as place_address', 'p.image_url as place_image', 'p.lat as place_lat', 'p.lng as place_lng'])
      .where({ 'a.id': id })
      .execute<DayAccommodationWithPlaceRow | undefined>('get', false);
  }

  /**
   * AC3 (`AccommodationsService.listAccommodations`) — AC2's projection plus
   * `r.title as reservation_title` via `LEFT JOIN reservations r ON
   * r.accommodation_id = a.id`, `WHERE a.trip_id = ? ORDER BY a.created_at
   * ASC`. Kysely (the reservations join, see {@link DayAccommodationListKyselyDB}).
   * Fans out one row per linked booking — the legacy statement's own shape
   * (the delete path documents more than one booking per stay is legal) —
   * parity keeps the duplicates, no `DISTINCT`.
   */
  async listForTripWithPlaceAndBooking(trip_id: number | string): Promise<DayAccommodationListRow[]> {
    const rows = await this.kysely<DayAccommodationListKyselyDB>()
      .selectFrom('day_accommodations as a')
      .leftJoin('places as p', 'p.id', 'a.place_id')
      .leftJoin('reservations as r', 'r.accommodation_id', 'a.id')
      .selectAll('a')
      .select([
        'p.name as place_name',
        'p.address as place_address',
        'p.image_url as place_image',
        'p.lat as place_lat',
        'p.lng as place_lng',
        'r.title as reservation_title',
      ])
      .where('a.trip_id', '=', trip_id)
      .orderBy('a.created_at', 'asc')
      .execute();
    return rows as DayAccommodationListRow[];
  }

  /**
   * AC34 (`AccommodationsService.getAccommodation`) — `SELECT * FROM
   * day_accommodations WHERE id = ? AND trip_id = ?`, the trip-scoping
   * guard every write path (REST update/delete, MCP, RPC) re-reads through.
   * `id`/`trip_id: number` (rule 21 — the SERVICE parses both ONCE via
   * `toRowId` before calling this).
   */
  async findInTrip(id: number, trip_id: number): Promise<DayAccommodationRow | undefined> {
    return await this.qb('a')
      .select(['a.*'])
      .where({ id, trip: trip_id })
      .execute<DayAccommodationRow | undefined>('get', false);
  }

  /**
   * AC30 (`AccommodationsService.createAccommodation`) — `INSERT INTO
   * day_accommodations (trip_id, place_id, start_day_id, end_day_id,
   * check_in, check_in_end, check_out, confirmation, notes) VALUES (?×9)`.
   * Nine columns — a DIFFERENT method from Task 2's own `insertBookingStay`
   * (seven columns, no `check_in_end`/`notes`, D4). The caller passes
   * already-decided values (the `|| null` coercions stay in the service);
   * `em.insert()` returns the generated PK (R6's `lastInsertRowid`
   * replacement).
   */
  async insertStay(input: {
    trip_id: number | string;
    place_id: number | null;
    start_day_id: number;
    end_day_id: number;
    check_in: string | null;
    check_in_end: string | null;
    check_out: string | null;
    confirmation: string | null;
    notes: string | null;
  }): Promise<number> {
    return await this.insert({
      trip: input.trip_id,
      place: input.place_id,
      startDay: input.start_day_id,
      endDay: input.end_day_id,
      check_in: input.check_in,
      check_in_end: input.check_in_end,
      check_out: input.check_out,
      confirmation: input.confirmation,
      notes: input.notes,
    });
  }

  /**
   * AC36 (`AccommodationsService.updateAccommodation`) — `UPDATE
   * day_accommodations SET place_id = ?, start_day_id = ?, end_day_id = ?,
   * check_in = ?, check_in_end = ?, check_out = ?, confirmation = ?, notes =
   * ? WHERE id = ?`. Eight columns, written verbatim — the caller's
   * `fields.x !== undefined ? fields.x : existing.x` presence sentinel
   * (note: NO `|| null` here, unlike AC30 — the legacy statement itself has
   * none for these columns, so `''` is stored as `''`).
   */
  async updateStay(id: number, write: {
    place_id: number | null;
    start_day_id: number;
    end_day_id: number;
    check_in: string | null;
    check_in_end: string | null;
    check_out: string | null;
    confirmation: string | null;
    notes: string | null;
  }): Promise<void> {
    await this.nativeUpdate({ id }, {
      place: write.place_id,
      startDay: write.start_day_id,
      endDay: write.end_day_id,
      check_in: write.check_in,
      check_in_end: write.check_in_end,
      check_out: write.check_out,
      confirmation: write.confirmation,
      notes: write.notes,
    });
  }

  /**
   * AC44 (`AccommodationsService.deleteAccommodation`) — `DELETE FROM
   * day_accommodations WHERE id = ?`. No trip scoping (the legacy statement
   * has none either — the caller already scoped `id` via AC34's guard,
   * rule 21).
   */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /**
   * DY19 (`DaysService.assertNoInvertedAccommodation`) — `SELECT a.id,
   * s.day_number AS start_no, e.day_number AS end_no FROM day_accommodations
   * a JOIN days s ON a.start_day_id = s.id JOIN days e ON a.end_day_id =
   * e.id WHERE a.trip_id = ?`. Both `days` joins are declared relations
   * (`startDay`/`endDay`), so the QueryBuilder expresses this directly.
   */
  async listStartEndDayNumbers(trip_id: number): Promise<{ id: number; start_no: number; end_no: number }[]> {
    return await this.qb('a')
      .join('a.startDay', 's')
      .join('a.endDay', 'e')
      .select(['a.id', 's.day_number as start_no', 'e.day_number as end_no'])
      .where({ trip: trip_id })
      .execute<{ id: number; start_no: number; end_no: number }[]>('all', false);
  }

  /**
   * DY20 (`DaysService.resyncAccommodationDays`) — `SELECT id,
   * start_day_id, end_day_id, check_in FROM day_accommodations WHERE trip_id
   * = ?`. `check_in` seats the stay's stop on the day it is carried to
   * (night-seat.ts). `start_day_id`/`end_day_id` are `persist(false)` mirrors
   * of the `startDay`/`endDay` relations — a bare select would drop them (the
   * `RoadtripDayBoundariesRepository` trap, Task 1's report), so both go
   * through `columnRef`.
   */
  async listForResync(trip_id: number): Promise<{ id: number; start_day_id: number; end_day_id: number; check_in: string | null }[]> {
    const platform = this.getEntityManager().getPlatform();
    return await this.qb('a')
      .select(['a.id', columnRef(platform, 'a.start_day_id').as('start_day_id'), columnRef(platform, 'a.end_day_id').as('end_day_id'), 'a.check_in'])
      .where({ trip: trip_id })
      .execute<{ id: number; start_day_id: number; end_day_id: number; check_in: string | null }[]>('all', false);
  }

  /**
   * DY41 (`DayRemovalService.cancelStays`) — `SELECT id FROM
   * day_accommodations WHERE trip_id = ? AND (start_day_id = ? OR end_day_id
   * = ?) ORDER BY id`: the stays that check in or out on a day being deleted.
   */
  async listIdsCheckingInOrOutOn(trip_id: number, day_id: number): Promise<number[]> {
    const rows = await this.qb('a')
      .select(['a.id'])
      .where({ trip: trip_id, $or: [{ startDay: day_id }, { endDay: day_id }] })
      .orderBy({ id: 'asc' })
      .execute<{ id: number }[]>('all', false);
    return rows.map((r) => r.id);
  }

  /** DY22 (`DaysService.resyncAccommodationDays`) — `UPDATE day_accommodations SET start_day_id = ?, end_day_id = ? WHERE id = ?`. */
  async setDayRange(id: number, start_day_id: number, end_day_id: number): Promise<void> {
    await this.nativeUpdate({ id }, { startDay: start_day_id, endDay: end_day_id });
  }

  /**
   * PL16 (`PlacesService.cancelStaysAt`) — `SELECT id FROM day_accommodations
   * WHERE trip_id = ? AND place_id = ?`. Reached from `PlacesService` through
   * `AccommodationsService` (already injected there for the cascade itself),
   * not a new repository dependency of `PlacesService`'s own (R4 — keeps the
   * trip scoping AC44's own unscoped delete relies on, inventory §14.3).
   */
  async listForPlace(trip_id: number, place_id: number): Promise<{ id: number }[]> {
    return await this.qb('a')
      .select(['a.id'])
      .where({ trip: trip_id, place: place_id })
      .execute<{ id: number }[]>('all', false);
  }

  // ---------------------------------------------------------------------------
  // Plan 3d Task 6 (`trips.service.ts::copy`) — additive, appended after
  // Task 3's own methods above, per this task's file-ownership rule.
  // ---------------------------------------------------------------------------

  /**
   * TP55 (`trips.service.ts::copy`'s day_accommodations read) — `SELECT *
   * FROM day_accommodations WHERE trip_id = ?`, no `ORDER BY` (matching the
   * legacy statement exactly — each row is independently remapped and
   * inserted, so read order doesn't affect the copy). {@link
   * DayAccommodationRow} is already this table's full-column shape (AC34's
   * own `findInTrip` projection), reused here rather than declared again.
   */
  async listAllForTrip(trip_id: number): Promise<DayAccommodationRow[]> {
    return await this.qb('a')
      .select(['a.*'])
      .where({ trip: trip_id })
      .execute<DayAccommodationRow[]>('all', false);
  }

  // ---------------------------------------------------------------------------
  // RoadtripPlanService.context (`stays` read) — RPL3
  // ---------------------------------------------------------------------------

  /**
   * RPL3 (`RoadtripPlanService.context`'s `stays` read) — `SELECT a.id,
   * a.place_id, a.start_day_id, a.end_day_id, a.check_in, a.check_out,
   * p.name AS place_name, p.lat AS place_lat, p.lng AS place_lng, (SELECT
   * MIN(r.id) FROM reservations r WHERE r.accommodation_id = a.id) AS
   * reservation_id FROM day_accommodations a LEFT JOIN places p ON p.id =
   * a.place_id WHERE a.trip_id = ? ORDER BY a.id`. Every stay of the trip in
   * id order, the order the night-bookend rule reads them in. Kysely for the
   * same reason as AC3: `reservations.accommodation_id` has no relation to
   * this table (see {@link DayAccommodationListKyselyDB}).
   */
  async listRoadtripStays(trip_id: number): Promise<RoadtripStayRow[]> {
    const rows = await this.kysely<RoadtripStaysKyselyDB>()
      .selectFrom('day_accommodations as a')
      .leftJoin('places as p', 'p.id', 'a.place_id')
      .select((eb) => [
        'a.id as id',
        'a.place_id as place_id',
        'a.start_day_id as start_day_id',
        'a.end_day_id as end_day_id',
        'a.check_in as check_in',
        'a.check_out as check_out',
        'p.name as place_name',
        'p.lat as place_lat',
        'p.lng as place_lng',
        eb
          .selectFrom('reservations as r')
          .select((eb2) => eb2.fn.min<number | null>('r.id').as('m'))
          .whereRef('r.accommodation_id', '=', 'a.id')
          .as('reservation_id'),
      ])
      .where('a.trip_id', '=', trip_id)
      .orderBy('a.id', 'asc')
      .execute();
    return rows as RoadtripStayRow[];
  }
}

/**
 * RPL3's row: a booked night as the road trip reads it, the stay, the days it spans,
 * where it is and the earliest booking linked to it. The rule reads these for the hotel
 * at the edges of the days around the night (`seatNightBookends`, as a `BookendStay`);
 * get_roadtrip_context reports them as they are, with the check-in beside the check-out.
 */
export interface RoadtripStayRow {
  id: number;
  place_id: number | null;
  start_day_id: number;
  end_day_id: number;
  check_in: string | null;
  check_out: string | null;
  place_name: string | null;
  place_lat: number | null;
  place_lng: number | null;
  reservation_id: number | null;
}

/** Kysely typing for RPL3 (`listRoadtripStays`). */
interface RoadtripStaysKyselyDB {
  day_accommodations: {
    id: number;
    trip_id: number;
    place_id: number | null;
    start_day_id: number;
    end_day_id: number;
    check_in: string | null;
    check_out: string | null;
  };
  places: {
    id: number;
    name: string;
    lat: number | null;
    lng: number | null;
  };
  reservations: {
    id: number;
    accommodation_id: string | null;
  };
}
