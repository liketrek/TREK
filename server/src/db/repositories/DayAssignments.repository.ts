import type { Platform } from '@mikro-orm/core';
import type { DayAssignments } from '../entities/DayAssignments.entity';
import { caseWhenNotNull, coalesce, columnIncrementedBy, columnRef } from '../dialect/sql-functions';
import { TrekRepository } from './_shared/trek-repository';
import type {
  AssignmentTimeSortKyselyDB,
  AssignmentWithPlaceRow,
  DayAssignmentRow,
  DaySeatRow,
  DayStopRow,
  RoadtripVisitRow,
  RoadtripVisitsKyselyDB,
  SharePublicAssignmentRow,
} from './day-assignment-rows';
import type { DB } from '../kysely/db';

export class DayAssignmentsRepository extends TrekRepository<DayAssignments> {
  /** The DY1/DY3/AS1/AS3 projection's SELECT list, shared by all three query shapes below. */
  private assignmentWithPlaceSelect(platform: Platform) {
    return [
      'da.*',
      'p.id as place_id',
      'p.name as place_name',
      'p.description as place_description',
      'p.lat',
      'p.lng',
      'p.address',
      // `category_id` is `persist(false)` on `Places` — a bare `'p.category_id'`
      // string selects nothing (not a real property name), and `'p.category'`
      // (the owning relation) is ALSO the joined alias here (`c`), so MikroORM
      // absorbs the select into the join and returns `c__id`, not `category_id`
      // (`McpTokensRepository.listAllWithUsername`'s `t.user`/`user_id`
      // docstring is the same trap, one join away from this one). `columnRef`
      // selects the literal physical column, keyed `category_id`.
      columnRef(platform, 'p.category_id'),
      'p.price',
      'p.currency as place_currency',
      coalesce(platform, 'da.assignment_time', 'p.place_time').as('place_time'),
      coalesce(platform, 'da.assignment_end_time', 'p.end_time').as('end_time'),
      'p.duration_minutes',
      'p.notes as place_notes',
      'p.image_url',
      'p.transport_mode',
      'p.google_place_id',
      'p.google_ftid',
      'p.osm_id',
      'p.amap_poi_id',
      'p.website',
      'p.phone',
      'p.stop_type',
      'p.fill_percent',
      // `place_id` on `Tours` is the `persist(false)` twin of its primary-key
      // relation, the same trap as `category_id` above, so `columnRef` again.
      columnRef(platform, 't.place_id').as('tour_place_id'),
      caseWhenNotNull(platform, 't.place_id', 'p.route_geometry').as('tour_route_geometry'),
      'c.name as category_name',
      'c.color as category_color',
      'c.icon as category_icon',
    ] as const;
  }

  /**
   * AS1 (`assignments.service.ts::getAssignmentWithPlace`, Task 3): the
   * projection filtered to one assignment, no ORDER BY (a single row).
   */
  async findWithPlaceAndCategory(id: number): Promise<AssignmentWithPlaceRow | null> {
    const platform = this.getEntityManager().getPlatform();
    const row = await this.qb('da')
      .join('da.place', 'p')
      .leftJoin('p.tours', 't')
      .leftJoin('p.category', 'c')
      .select(this.assignmentWithPlaceSelect(platform))
      .where({ 'da.id': id })
      .execute<AssignmentWithPlaceRow | undefined>('get', false);
    return row ?? null;
  }

  /**
   * DY1 (`days.service.ts::getAssignmentsForDay`) and AS3
   * (`assignments.service.ts::listDayAssignments`, Task 3): the projection
   * for one day, `ORDER BY da.order_index ASC, da.created_at ASC`.
   */
  async listForDay(day_id: number): Promise<AssignmentWithPlaceRow[]> {
    const platform = this.getEntityManager().getPlatform();
    return await this.qb('da')
      .join('da.place', 'p')
      .leftJoin('p.tours', 't')
      .leftJoin('p.category', 'c')
      .select(this.assignmentWithPlaceSelect(platform))
      .where({ 'da.day': day_id })
      .orderBy({ 'da.order_index': 'asc', 'da.created_at': 'asc' })
      .execute<AssignmentWithPlaceRow[]>('all', false);
  }

  /**
   * DY3 (`days.service.ts::list`): the same projection for several days at
   * once (`WHERE da.day_id IN (...)`), same ORDER BY. Empty-array
   * short-circuit before any query, as the legacy dynamic-`IN` builder did.
   */
  async listWithPlaceAndCategory(day_ids: number[]): Promise<AssignmentWithPlaceRow[]> {
    if (day_ids.length === 0) return [];
    const platform = this.getEntityManager().getPlatform();
    return await this.qb('da')
      .join('da.place', 'p')
      .leftJoin('p.tours', 't')
      .leftJoin('p.category', 'c')
      .select(this.assignmentWithPlaceSelect(platform))
      .where({ 'da.day': { $in: day_ids } })
      .orderBy({ 'da.order_index': 'asc', 'da.created_at': 'asc' })
      .execute<AssignmentWithPlaceRow[]>('all', false);
  }

  /**
   * `share.service.ts:288` SH9 (`getSharedTripData`'s share_map assignment
   * read) — the SAME projection {@link assignmentWithPlaceSelect} builds,
   * minus six internal-id/routing columns a public share link must never
   * leak (`google_place_id`, `google_ftid`, `osm_id`, `amap_poi_id`,
   * `stop_type`, `fill_percent`) — never widen this list to match the
   * private `listWithPlaceAndCategory` projection above.
   */
  private publicAssignmentSelect(platform: Platform) {
    return [
      'da.*',
      'p.id as place_id',
      'p.name as place_name',
      'p.description as place_description',
      'p.lat',
      'p.lng',
      'p.address',
      columnRef(platform, 'p.category_id'),
      'p.price',
      'p.currency as place_currency',
      coalesce(platform, 'da.assignment_time', 'p.place_time').as('place_time'),
      coalesce(platform, 'da.assignment_end_time', 'p.end_time').as('end_time'),
      'p.duration_minutes',
      'p.notes as place_notes',
      'p.image_url',
      'p.transport_mode',
      'p.website',
      'p.phone',
      'c.name as category_name',
      'c.color as category_color',
      'c.icon as category_icon',
    ] as const;
  }

  /** SH9 — same WHERE/ORDER BY shape as {@link listWithPlaceAndCategory}, narrower projection. */
  async listPublicForShare(day_ids: number[]): Promise<SharePublicAssignmentRow[]> {
    if (day_ids.length === 0) return [];
    const platform = this.getEntityManager().getPlatform();
    return await this.qb('da')
      .join('da.place', 'p')
      .leftJoin('p.category', 'c')
      .select(this.publicAssignmentSelect(platform))
      .where({ 'da.day': { $in: day_ids } })
      .orderBy({ 'da.order_index': 'asc', 'da.created_at': 'asc' })
      .execute<SharePublicAssignmentRow[]>('all', false);
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 3 (`AssignmentsService`) — appended after Task 2's own
  // methods above, per this task's file-ownership rule.
  // ---------------------------------------------------------------------------

  /**
   * AS9 (`assignmentExistsInDay`) — `SELECT da.id FROM day_assignments da
   * JOIN days d ON da.day_id = d.id WHERE da.id = ? AND da.day_id = ? AND
   * d.trip_id = ?`.
   *
   * **`id: number`, not `number | string` (Task 3 review H1, absorbed in
   * Task 4 — `task-3-review.md` §9.1):** this method's ONLY caller
   * (`AssignmentsService.assignmentExistsInDay`) now runs `toRowId` on the
   * route's raw `id` BEFORE calling this — a non-canonical id (`"3 "`,
   * `"3.0"`) must resolve to "not found" in the SERVICE gate, not pass this
   * statement's own SQLite text/integer affinity match and then disagree
   * with `deleteAssignment`'s `toRowId(id)!` downstream (the H1 regression).
   * `day_id`/`trip_id` keep their `number | string` raw-bind scoping —
   * `deleteAssignment` never reads either back, so there is no gate-vs-write
   * id to protect there.
   */
  async existsInDay(id: number, day_id: number | string, trip_id: number | string): Promise<boolean> {
    const row = await this.qb('da')
      .join('da.day', 'd')
      .select(['da.id'])
      .where('da.id = ? AND da.day_id = ? AND d.trip_id = ?', [id, day_id, trip_id])
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * AS12 (`getAssignmentForTrip`) — `SELECT da.* FROM day_assignments da
   * JOIN days d ON da.day_id = d.id WHERE da.id = ? AND d.trip_id = ?`.
   *
   * **`id: number`, not `number | string` (Task 3 review H1, absorbed in
   * Task 4 — `task-3-review.md` §9.1):** this method's ONLY caller
   * (`AssignmentsService.getAssignmentForTrip`) now runs `toRowId` on the
   * route/tool's raw `id` BEFORE calling this, the same H1 fix
   * `existsInDay` above applies — every mutation behind this gate
   * (`updateTime`/`setEndDay`/`updateNotes`/`setLegTransportMode`/
   * `setIncomingLegTransportMode`/`setParticipants`/`moveAssignment`)
   * converts `id` with its own `toRowId(id)!`, and `ItineraryRpc.unassign`
   * reads `existing.day_id` off THIS result (a genuine re-select, not only
   * an existence guard) — so the id this read resolves must be the same one
   * every one of those writes uses. `trip_id` keeps its `number | string`
   * raw-bind scoping, unchanged.
   */
  async findInTrip(id: number, trip_id: number | string): Promise<DayAssignmentRow | undefined> {
    const row = await this.qb('da')
      .join('da.day', 'd')
      .select(['da.*'])
      .where('da.id = ? AND d.trip_id = ?', [id, trip_id])
      .execute<DayAssignmentRow | undefined>('get', false);
    return row ?? undefined;
  }

  /**
   * AS6 (`createAssignment`'s append-position read) — `SELECT
   * MAX(order_index) as max FROM day_assignments WHERE day_id = ?`, read as
   * the highest row by an ordered `limit(1)` (`DaysRepository.maxDayNumber`'s
   * precedent — SQLite sorts `NULL` last under `DESC`, so an all-NULL or
   * empty table folds the same way `MAX()` ignoring every `NULL` does).
   * Returns the raw nullable value, NOT folded to `0`/`-1` here: the
   * service's explicit `maxOrder !== null ? maxOrder : -1` check (AS6's
   * ruling) needs to tell "no rows" from a stored `0` order_index, which a
   * `?? -1` fold would collapse identically — unlike `DaysRepository
   * .maxDayNumber`, this repository method must NOT pre-fold the null case.
   */
  async maxOrderIndex(day_id: number): Promise<number | null> {
    const row = await this.qb('da')
      .select('da.order_index')
      .where({ day: day_id })
      .orderBy({ order_index: 'desc' })
      .limit(1)
      .execute<{ order_index: number | null } | undefined>('get', false);
    return row?.order_index ?? null;
  }

  /**
   * AS7 — `UPDATE day_assignments SET order_index = order_index + 1 WHERE
   * day_id = ? AND order_index >= ?`, a column-from-column update
   * (`InviteTokensRepository.incrementUsedCount`'s `columnIncrementedBy`
   * precedent — `nativeUpdate`'s `EntityData` shape doesn't accept a raw
   * fragment value, so this goes through `qb().update()` instead).
   */
  async shiftOrderFrom(day_id: number, from: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.qb()
      .update({ order_index: columnIncrementedBy(platform, 'order_index', 1) })
      .where({ day: day_id, order_index: { $gte: from } })
      .execute('run');
  }

  /**
   * AS8 — `INSERT INTO day_assignments (day_id, place_id, order_index,
   * notes, accommodation_id) VALUES (?, ?, ?, ?, ?)`. The caller passes
   * already-decided values (the `notes || null`/`accommodationId ?? null`
   * coercions and the clamped `orderIndex` stay in the service, the same
   * split `DaysRepository.createDay`'s docstring describes) — `em.insert()`
   * returns the generated PK (R6's `lastInsertRowid` replacement).
   */
  async insertAssignment(input: {
    day_id: number;
    place_id: number;
    order_index: number;
    notes: string | null;
    accommodation_id: number | null;
    /** MDT-02: one stage of a multi-day tour, by its starting stop's key; absent for the whole tour or a place. */
    tour_stage_key?: string | null;
  }): Promise<number> {
    return await this.insert({
      day: input.day_id,
      place: input.place_id,
      order_index: input.order_index,
      notes: input.notes,
      accommodation_id: input.accommodation_id,
      tour_stage_key: input.tour_stage_key ?? null,
    });
  }

  /** AS10 — `DELETE FROM day_assignments WHERE id = ?`. */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /**
   * AS11 (`reorderAssignments`, day-scoped: `UPDATE day_assignments SET
   * order_index = ? WHERE id = ? AND day_id = ?`) and AS19
   * (`sortDayByTime`'s per-row write, NOT day-scoped: `UPDATE
   * day_assignments SET order_index = ? WHERE id = ?`) — one method, both
   * signatures, per the inventory's ruling ("keep both signatures"):
   * `day_id` omitted (`undefined`) reproduces AS19's unscoped statement.
   */
  async setOrderIndex(id: number, day_id: number | undefined, order_index: number): Promise<void> {
    const where = day_id !== undefined ? { id, day: day_id } : { id };
    await this.nativeUpdate(where, { order_index });
  }

  /**
   * {@link setOrderIndex} for many rows in one statement: `UPDATE
   * day_assignments SET order_index = CASE id WHEN ? THEN ? ... END WHERE id IN
   * (...) [AND day_id = ?]`. The result is what the writes one by one in the
   * given order left: an id listed twice keeps its last index, and with
   * `day_id` a row on another day is not touched.
   */
  async setOrderIndexes(order: ReadonlyArray<{ id: number; order_index: number }>, day_id?: number): Promise<void> {
    const last = new Map<number, number>();
    for (const { id, order_index } of order) last.set(id, order_index);
    const [first, ...rest] = [...last];
    if (!first) return;
    let query = this.kysely<Pick<DB, 'day_assignments'>>()
      .updateTable('day_assignments')
      .set((eb) => {
        let index = eb.case().when('id', '=', first[0]).then(first[1]);
        for (const [id, orderIndex] of rest) index = index.when('id', '=', id).then(orderIndex);
        return { order_index: index.else(eb.ref('order_index')).end() };
      })
      .where('id', 'in', [...last.keys()]);
    if (day_id !== undefined) query = query.where('day_id', '=', day_id);
    await query.execute();
  }

  /** AS13 (`moveAssignment`'s source-day read) — `SELECT day_id FROM day_assignments WHERE id = ?`. */
  async getDayId(id: number): Promise<number | undefined> {
    const platform = this.getEntityManager().getPlatform();
    // `day_id` is `persist(false)` (the physical FK mirror of the `day`
    // relation) — a bare `'da.day_id'` select hits the same trap
    // `assignmentWithPlaceSelect`'s `category_id` comment documents;
    // `columnRef` selects the literal physical column instead.
    const row = await this.qb('da')
      .select([columnRef(platform, 'da.day_id').as('day_id')])
      .where({ id })
      .execute<{ day_id: number } | undefined>('get', false);
    return row?.day_id;
  }

  /**
   * `moveAssignment`'s Tour check: `SELECT place_id FROM day_assignments
   * WHERE id = ?`, `columnRef` for the same `persist(false)` reason as
   * {@link getDayId} above.
   */
  async getPlaceId(id: number): Promise<number | undefined> {
    const platform = this.getEntityManager().getPlatform();
    const row = await this.qb('da')
      .select([columnRef(platform, 'da.place_id').as('place_id')])
      .where({ id })
      .execute<{ place_id: number } | undefined>('get', false);
    return row?.place_id;
  }

  /** AS14 — `UPDATE day_assignments SET day_id = ?, order_index = ? WHERE id = ?`. */
  async moveToDay(id: number, day_id: number, order_index: number): Promise<void> {
    await this.nativeUpdate({ id }, { day: day_id, order_index });
  }

  /**
   * AS16 (`updateTime`'s pre-write read) — `SELECT da.day_id,
   * COALESCE(da.assignment_time, p.place_time, acc.check_in) AS start FROM
   * day_assignments da JOIN places p ON da.place_id = p.id LEFT JOIN
   * day_accommodations acc ON acc.id = da.accommodation_id WHERE da.id = ?`.
   * Kysely (see `AssignmentTimeSortKyselyDB`'s docstring for why: no ORM
   * relation to `day_accommodations` exists to `.join()` through).
   */
  async effectiveStart(id: number): Promise<{ day_id: number; start: string | null } | undefined> {
    const row = await this.kysely<AssignmentTimeSortKyselyDB>()
      .selectFrom('day_assignments as da')
      .innerJoin('places as p', 'p.id', 'da.place_id')
      .leftJoin('day_accommodations as acc', 'acc.id', 'da.accommodation_id')
      .select((eb) => ['da.day_id as day_id', eb.fn.coalesce('da.assignment_time', 'p.place_time', 'acc.check_in').as('start')])
      .where('da.id', '=', id)
      .executeTakeFirst();
    return row as { day_id: number; start: string | null } | undefined;
  }

  /**
   * AS17 — `UPDATE day_assignments SET assignment_time = ?, assignment_end_time = ? WHERE id = ?`.
   * The falsy-clears-to-null coercion (`placeTime || null`) stays in the
   * service (AS17's ruling); this writes the already-decided values.
   */
  async setTimes(id: number, assignment_time: string | null, assignment_end_time: string | null): Promise<void> {
    await this.nativeUpdate({ id }, { assignment_time, assignment_end_time });
  }

  /**
   * AS18 (`sortDayByTime`'s day-wide read) — `SELECT da.id, da.order_index,
   * COALESCE(da.assignment_time, p.place_time, acc.check_in) as
   * effective_time, (p.lat IS NOT NULL AND p.lng IS NOT NULL) as located
   * FROM day_assignments da JOIN places p ON da.place_id = p.id LEFT JOIN
   * day_accommodations acc ON acc.id = da.accommodation_id WHERE da.day_id
   * = ? ORDER BY da.order_index ASC, da.created_at ASC, da.id ASC`. Same
   * Kysely escape hatch as `effectiveStart`. The computed boolean column is
   * expressed with the expression builder's own comparison/`.and()`
   * combinators — never the banned `sql` tag — and SQLite returns it as the
   * same `0`/`1` integer the legacy raw statement did.
   */
  async listForTimeSort(day_id: number): Promise<DayStopRow[]> {
    const rows = await this.kysely<AssignmentTimeSortKyselyDB>()
      .selectFrom('day_assignments as da')
      .innerJoin('places as p', 'p.id', 'da.place_id')
      .leftJoin('day_accommodations as acc', 'acc.id', 'da.accommodation_id')
      .select((eb) => [
        'da.id as id',
        'da.order_index as order_index',
        eb.fn.coalesce('da.assignment_time', 'p.place_time', 'acc.check_in').as('effective_time'),
        eb.and([eb('p.lat', 'is not', null), eb('p.lng', 'is not', null)]).as('located'),
      ])
      .where('da.day_id', '=', day_id)
      .orderBy('da.order_index', 'asc')
      .orderBy('da.created_at', 'asc')
      .orderBy('da.id', 'asc')
      // `$castTo` (Task 9 fix wave, B-L1): Kysely infers `located` as its own
      // `SqlBool` type from `eb.and(...)`, not the `0`/`1` integer
      // `DayStopRow.located` declares (the value SQLite actually returns for
      // a boolean expression) — a straight `as DayStopRow[]` is rejected as
      // an unrelated-type cast, which is what forced the `as unknown as`
      // bridge. `$castTo` retypes the builder itself before `execute()`
      // runs, so the result is `DayStopRow[]` with no intermediate `unknown`.
      .$castTo<DayStopRow>()
      .execute();
    return rows;
  }

  /** AS24 — `UPDATE day_assignments SET end_day = ? WHERE id = ?`. */
  async setEndDay(id: number, end_day: number): Promise<void> {
    await this.nativeUpdate({ id }, { end_day });
  }

  /** AS25 — `UPDATE day_assignments SET notes = ? WHERE id = ?`. */
  async setNotes(id: number, notes: string | null): Promise<void> {
    await this.nativeUpdate({ id }, { notes });
  }

  /** AS26 — `UPDATE day_assignments SET leg_transport_mode = ? WHERE id = ?`. */
  async setLegMode(id: number, mode: string | null): Promise<void> {
    await this.nativeUpdate({ id }, { leg_transport_mode: mode });
  }

  /** AS27 — `UPDATE day_assignments SET incoming_leg_transport_mode = ? WHERE id = ?`. */
  async setIncomingLegMode(id: number, mode: string | null): Promise<void> {
    await this.nativeUpdate({ id }, { incoming_leg_transport_mode: mode });
  }

  /**
   * AS32 (`AssignmentsService.clearDay`, #2470) — `SELECT id FROM
   * day_assignments WHERE day_id = ?`, no ORDER BY (unlike AC1's
   * {@link listIdsForDay}).
   */
  async listIdsToClear(day_id: number): Promise<number[]> {
    const rows = await this.qb('da')
      .select(['da.id'])
      .where({ day: day_id })
      .execute<{ id: number }[]>('all', false);
    return rows.map((r) => r.id);
  }

  /** AS33 (`AssignmentsService.clearDay`, #2470) — `DELETE FROM day_assignments WHERE day_id = ?`. */
  async deleteForDay(day_id: number): Promise<void> {
    await this.nativeDelete({ day: day_id });
  }

  /** AS34 (`AssignmentsService.setRouteExcluded`, #2532) — `UPDATE day_assignments SET route_excluded = ? WHERE id = ?`. */
  async setRouteExcluded(id: number, route_excluded: number): Promise<void> {
    await this.nativeUpdate({ id }, { route_excluded });
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 4 (`PlacesService.exportGpx`) — appended per the task-4
  // brief's "task-3-report.md" pointer ("DayAssignmentsRepository for the
  // PL30 GPX itinerary read if it fits there"). Unlike AS16/AS18, this join
  // (`day_assignments` -> `days`, `day_assignments` -> `places`) is fully
  // expressible through the entity's own declared relations (`da.day`,
  // `da.place`) — no `day_accommodations`-shaped gap — so the QueryBuilder is
  // used directly rather than Kysely.
  // ---------------------------------------------------------------------------

  /**
   * PL30 (`places.service.ts::exportGpx`) — `SELECT d.day_number, d.date,
   * d.title, p.name, p.lat, p.lng FROM days d JOIN day_assignments da ON
   * da.day_id = d.id JOIN places p ON p.id = da.place_id WHERE d.trip_id = ?
   * AND p.lat IS NOT NULL AND p.lng IS NOT NULL ORDER BY d.day_number,
   * da.order_index` — rooted here on `day_assignments` instead of `days`
   * (the legacy statement's own `FROM` root) because both joins the legacy
   * statement needs (`day_assignments -> days`, `day_assignments -> places`)
   * are single hops FROM this entity, while `days` has no direct relation to
   * `places`. Same result set, same ordering; the root alias choice is not
   * observable from the row shape.
   */
  async listItineraryForGpx(trip_id: string | number): Promise<{
    day_number: number; date: string | null; title: string | null;
    name: string; lat: number; lng: number;
  }[]> {
    return this.qb('da')
      .join('da.day', 'd')
      .join('da.place', 'p')
      .select(['d.day_number', 'd.date', 'd.title', 'p.name', 'p.lat', 'p.lng'])
      .where('d.trip_id = ? AND p.lat IS NOT NULL AND p.lng IS NOT NULL', [trip_id])
      .orderBy({ 'd.day_number': 'asc', 'da.order_index': 'asc' })
      .execute<{ day_number: number; date: string | null; title: string | null; name: string; lat: number; lng: number }[]>('all', false);
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 8 (`TripsService.copy`) — additive.
  // ---------------------------------------------------------------------------

  /**
   * TP48 (`trips.service.ts::copy`'s assignments read) — `SELECT da.* FROM
   * day_assignments da JOIN days d ON d.id = da.day_id WHERE d.trip_id = ?`,
   * no `ORDER BY` (matching the legacy statement, which relies on SQLite's
   * own rowid-ascending scan order — the copy loop's insertion order tracks
   * the source's own, same reasoning as `PlacesRepository.listAllForTrip`).
   */
  async listAllForTrip(trip_id: number | string): Promise<DayAssignmentRow[]> {
    return this.qb('da')
      .join('da.day', 'd')
      .select(['da.*'])
      .where('d.trip_id = ?', [trip_id])
      .execute<DayAssignmentRow[]>('all', false);
  }

  /**
   * TP49 (`trips.service.ts::copy`'s assignment INSERT) — the 10-column
   * `INSERT INTO day_assignments (day_id, place_id, order_index, notes,
   * reservation_status, reservation_notes, reservation_datetime,
   * assignment_time, assignment_end_time, end_day) VALUES (...)`. A
   * different column set from AS8's `insertAssignment` (5 columns: `day_id`,
   * `place_id`, `order_index`, `notes`, `accommodation_id` — no reservation/
   * time/end_day fields, and `accommodation_id` is stamped separately here,
   * AFTER the bookings loop, via {@link setAccommodation} below, TP57) — the
   * copy carries a source assignment's reservation snapshot and timing
   * verbatim, values already fully resolved by the caller (`a.end_day ?? 0`
   * stays the service's own decision, `DaysRepository.createDay`'s split).
   */
  async insertAssignmentCopy(input: {
    day_id: number;
    place_id: number;
    order_index: number | null;
    notes: string | null;
    reservation_status: string | null;
    reservation_notes: string | null;
    reservation_datetime: string | null;
    assignment_time: string | null;
    assignment_end_time: string | null;
    end_day: number;
    /** MDT-02: the copied tour keeps its stops' keys, so a day holding one of its stages keeps holding it. */
    tour_stage_key?: string | null;
  }): Promise<number> {
    return await this.insert({
      day: input.day_id,
      place: input.place_id,
      order_index: input.order_index,
      notes: input.notes,
      reservation_status: input.reservation_status,
      reservation_notes: input.reservation_notes,
      reservation_datetime: input.reservation_datetime,
      assignment_time: input.assignment_time,
      assignment_end_time: input.assignment_end_time,
      end_day: input.end_day,
      tour_stage_key: input.tour_stage_key ?? null,
    });
  }

  /**
   * TP57 (`trips.service.ts::copy`'s post-bookings-loop stamp) — `UPDATE
   * day_assignments SET accommodation_id = ? WHERE id = ?`. Run once per
   * copied stay-stop, AFTER the `day_accommodations` bookings are copied
   * (Plan 3d's own table — the bookings loop itself stays raw, `// TPn —
   * Plan 3d`), because only then does the copied accommodation's id exist
   * to stamp on. `accommodation_id` is a plain `p.integer()` column on this
   * entity, not a relation (`AssignmentTimeSortKyselyDB`'s docstring), so a
   * typed `nativeUpdate` partial reaches it directly.
   */
  async setAccommodation(id: number, accommodation_id: number): Promise<void> {
    await this.nativeUpdate({ id }, { accommodation_id });
  }

  // ---------------------------------------------------------------------------
  // Plan 3d Task 1 (`RoadtripPlanService`) — additive, per this task's own
  // file-ownership rule ("all additive methods on Days/Places/DayAssignments
  // repositories").
  // ---------------------------------------------------------------------------

  /**
   * RPL2 (`roadtrip-plan.service.ts::context`'s `visits` read) — the
   * cluster's most dialect-specific SELECT (inventory §17b):
   *
   * ```sql
   * SELECT a.id, a.day_id, a.order_index, a.place_id, p.name, p.lat, p.lng,
   *   COALESCE(a.assignment_time, p.place_time) AS time,
   *   COALESCE(a.assignment_end_time, p.end_time) AS end_time,
   *   p.duration_minutes, a.end_day,
   *   a.leg_transport_mode, a.incoming_leg_transport_mode, p.stop_type, p.fill_percent,
   *   a.accommodation_id, stay.id AS stay_id, stay.check_in, stay.check_out, checkout.day_number AS checkout_day
   * FROM day_assignments a
   * JOIN days d ON d.id = a.day_id
   * JOIN places p ON p.id = a.place_id
   * LEFT JOIN day_accommodations stay
   *   ON stay.id = (SELECT id FROM day_accommodations WHERE place_id = p.id AND start_day_id = d.id ORDER BY id LIMIT 1)
   * LEFT JOIN days checkout ON checkout.id = stay.end_day_id
   * WHERE d.trip_id = ?
   * ORDER BY d.day_number, a.order_index, a.created_at
   * ```
   *
   * A correlated scalar subquery INSIDE a `LEFT JOIN … ON` clause — no
   * QueryBuilder shape expresses this (§17b), and no MikroORM relation
   * connects a place+check-in-day pair to its `day_accommodations` row (the
   * stay is matched by `place_id`+`start_day_id`, not by
   * `a.accommodation_id` — deliberately: the inventory's own RPL2 note),
   * so this is `this.kysely()` from the start, same escape-hatch order as
   * `effectiveStart`/`listForTimeSort` above. `days` is
   * joined twice under two different aliases (`d`, `checkout`) — ordinary
   * Kysely self-join aliasing, no separate interface entry needed since both
   * resolve against the same `days` table shape.
   */
  async listRoadtripVisits(trip_id: number): Promise<RoadtripVisitRow[]> {
    const rows = await this.kysely<RoadtripVisitsKyselyDB>()
      .selectFrom('day_assignments as a')
      .innerJoin('days as d', 'd.id', 'a.day_id')
      .innerJoin('places as p', 'p.id', 'a.place_id')
      .leftJoin('day_accommodations as stay', (join) =>
        join.on('stay.id', '=', (eb) =>
          eb
            .selectFrom('day_accommodations as da2')
            .select('da2.id')
            .whereRef('da2.place_id', '=', 'p.id')
            .whereRef('da2.start_day_id', '=', 'd.id')
            .orderBy('da2.id', 'asc')
            .limit(1),
        ),
      )
      .leftJoin('days as checkout', 'checkout.id', 'stay.end_day_id')
      .select((eb) => [
        'a.id as id',
        'a.day_id as day_id',
        'a.order_index as order_index',
        'a.place_id as place_id',
        'p.name as name',
        'p.lat as lat',
        'p.lng as lng',
        eb.fn.coalesce('a.assignment_time', 'p.place_time').as('time'),
        eb.fn.coalesce('a.assignment_end_time', 'p.end_time').as('end_time'),
        'p.duration_minutes as duration_minutes',
        'a.end_day as end_day',
        'a.leg_transport_mode as leg_transport_mode',
        'a.incoming_leg_transport_mode as incoming_leg_transport_mode',
        'p.stop_type as stop_type',
        'p.fill_percent as fill_percent',
        'a.accommodation_id as accommodation_id',
        'stay.id as stay_id',
        'stay.check_in as check_in',
        'stay.check_out as check_out',
        'checkout.day_number as checkout_day',
      ])
      .where('d.trip_id', '=', trip_id)
      .orderBy('d.day_number', 'asc')
      .orderBy('a.order_index', 'asc')
      .orderBy('a.created_at', 'asc')
      .$castTo<RoadtripVisitRow>()
      .execute();
    return rows;
  }

  // ---------------------------------------------------------------------------
  // Plan 3d Task 3 (`AccommodationsService`) — additive, per this task's own
  // file-ownership rule ("additive methods on Days/Places/DayAssignments/
  // Reservations repositories where a read belongs there").
  // ---------------------------------------------------------------------------

  /** AC1 (`AccommodationsService.announceMirror`) — `SELECT id FROM day_assignments WHERE day_id = ? ORDER BY order_index`, once per touched day. */
  async listIdsForDay(day_id: number): Promise<number[]> {
    const rows = await this.qb('da')
      .select(['da.id'])
      .where({ day: day_id })
      .orderBy({ order_index: 'asc' })
      .execute<{ id: number }[]>('all', false);
    return rows.map((r) => r.id);
  }

  /**
   * AC7 (`night-seat.ts`'s `SeatRow`, read by `AccommodationsService` and
   * `DaysService` through `seatIndexWith`/`seatHolds`; `reseat-booked-nights.ts`
   * runs the same statement raw inside migration 242) — `SELECT da.id,
   * da.order_index, CASE WHEN other.id IS NULL THEN
   * COALESCE(da.assignment_time, p.place_time) ELSE other.check_in END AS at,
   * other.id AS night_id, (p.lat IS NOT NULL AND p.lng IS NOT NULL) AS
   * located FROM day_assignments da JOIN places p ON p.id = da.place_id LEFT
   * JOIN day_accommodations other ON other.id = da.accommodation_id WHERE
   * da.day_id = ? ORDER BY da.order_index ASC, da.created_at ASC, da.id ASC`.
   * `locatedStopIdsWith` reads the via positions off these same rows
   * (`located`), so a night and its vias are measured by one statement.
   * Same Kysely escape hatch as {@link effectiveStart}/{@link listForTimeSort}
   * (no ORM relation to `day_accommodations`); `located` and the `$castTo`
   * follow `listForTimeSort`.
   */
  async listSeatRows(day_id: number): Promise<DaySeatRow[]> {
    const rows = await this.kysely<AssignmentTimeSortKyselyDB>()
      .selectFrom('day_assignments as da')
      .innerJoin('places as p', 'p.id', 'da.place_id')
      .leftJoin('day_accommodations as other', 'other.id', 'da.accommodation_id')
      .select((eb) => [
        'da.id as id',
        'da.order_index as order_index',
        eb
          .case()
          .when('other.id', 'is', null)
          .then(eb.fn.coalesce('da.assignment_time', 'p.place_time'))
          .else(eb.ref('other.check_in'))
          .end()
          .as('at'),
        'other.id as night_id',
        eb.and([eb('p.lat', 'is not', null), eb('p.lng', 'is not', null)]).as('located'),
      ])
      .where('da.day_id', '=', day_id)
      .orderBy('da.order_index', 'asc')
      .orderBy('da.created_at', 'asc')
      .orderBy('da.id', 'asc')
      .$castTo<DaySeatRow>()
      .execute();
    return rows;
  }

  /**
   * AC18/AC24 (`AccommodationsService.relocateOwnStop`/`mirrorStay`) — one
   * method, two call shapes (D4): `SELECT id FROM day_assignments WHERE
   * day_id = ? AND place_id = ? AND id != ?` (AC18, with `exclude_id`) and
   * `SELECT id FROM day_assignments WHERE day_id = ? AND place_id = ?`
   * (AC24, without).
   */
  async existsForDayAndPlace(day_id: number, place_id: number, exclude_id?: number): Promise<boolean> {
    const query = this.qb('da').select(['da.id']).where({ day: day_id, place: place_id });
    if (exclude_id !== undefined) query.andWhere({ id: { $ne: exclude_id } });
    const row = await query.execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * AC19 (`AccommodationsService.relocateOwnStop`) — `UPDATE day_assignments
   * SET order_index = order_index - 1 WHERE day_id = ? AND order_index > ?`,
   * a column-from-column update (`columnIncrementedBy`, {@link shiftOrderFrom}'s
   * precedent).
   */
  async closeGap(day_id: number, from_index: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.qb()
      .update({ order_index: columnIncrementedBy(platform, 'order_index', -1) })
      .where({ day: day_id, order_index: { $gt: from_index } })
      .execute('run');
  }

  /**
   * AC20 (`AccommodationsService.relocateOwnStop`) — `SELECT MAX(order_index)
   * AS max FROM day_assignments WHERE day_id = ? AND id != ?`, read the same
   * way {@link maxOrderIndex} is (an ordered `limit(1)`, null NOT pre-folded —
   * the caller's own `max.max !== null ? max.max : -1` check needs to tell
   * "no rows" from a stored `0`).
   */
  async maxOrderIndexExcluding(day_id: number, exclude_id: number): Promise<number | null> {
    const row = await this.qb('da')
      .select('da.order_index')
      .where({ day: day_id, id: { $ne: exclude_id } })
      .orderBy({ order_index: 'desc' })
      .limit(1)
      .execute<{ order_index: number | null } | undefined>('get', false);
    return row?.order_index ?? null;
  }

  /** AC21 (`AccommodationsService.relocateOwnStop`) — `UPDATE day_assignments SET day_id = ?, place_id = ?, order_index = ? WHERE id = ?`. */
  async relocate(id: number, day_id: number, place_id: number, order_index: number): Promise<void> {
    await this.nativeUpdate({ id }, { day: day_id, place: place_id, order_index });
  }

  /**
   * AC22 (`AccommodationsService.relocateOwnStop`) — `UPDATE day_assignments
   * SET order_index = order_index + 1 WHERE day_id = ? AND order_index >= ?
   * AND id != ?`, the same column-from-column shape as {@link shiftOrderFrom}
   * with an extra exclusion.
   */
  async shiftFromExcluding(day_id: number, from_index: number, exclude_id: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.qb()
      .update({ order_index: columnIncrementedBy(platform, 'order_index', 1) })
      .where({ day: day_id, order_index: { $gte: from_index }, id: { $ne: exclude_id } })
      .execute('run');
  }

  /** AC25 (`AccommodationsService.ownStops`) — `SELECT id, day_id, place_id, order_index FROM day_assignments WHERE accommodation_id = ?`. `day_id`/`place_id` are `persist(false)` relation mirrors — `columnRef`, the same trap {@link getDayId} documents. */
  async listOwnedByStay(accommodation_id: number): Promise<{ id: number; day_id: number; place_id: number; order_index: number | null }[]> {
    const platform = this.getEntityManager().getPlatform();
    return await this.qb('da')
      .select(['da.id', columnRef(platform, 'da.day_id').as('day_id'), columnRef(platform, 'da.place_id').as('place_id'), 'da.order_index'])
      .where({ accommodation_id })
      .execute<{ id: number; day_id: number; place_id: number; order_index: number | null }[]>('all', false);
  }

  /** AC26 (`AccommodationsService.releaseStops`, `keepStop` branch) — `UPDATE day_assignments SET accommodation_id = NULL WHERE id = ?`. */
  async clearStay(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { accommodation_id: null });
  }

  // ---------------------------------------------------------------------------
  // Plan 3e Task 1 (`FilesService.findForeignLinkTarget`, R12) — additive,
  // append-only per that task's own file-ownership rule.
  // ---------------------------------------------------------------------------

  /**
   * FL3 (`FilesService.findForeignLinkTarget`'s assignment branch) — `SELECT
   * 1 FROM day_assignments a JOIN days d ON a.day_id = d.id WHERE a.id = ?
   * AND d.trip_id = ?`, re-expressed as "what trip does this row belong to"
   * via its `day` relation (R12 — "DayAssignmentsRepository.findTripId via
   * its days join"; `day_assignments` has no `trip_id` column of its own).
   * The same join shape `ReservationsRepository.getAssignmentTripId`
   * (RS22) already used from a DIFFERENT repository before this file was
   * this task's own to append to — this copy lives here instead, per R12's
   * "one method per target table, on that table's own repository" ruling.
   */
  async findTripId(id: number): Promise<number | undefined> {
    const platform = this.getEntityManager().getPlatform();
    const row = await this.qb('da')
      .join('da.day', 'd')
      .select([columnRef(platform, 'd.trip_id').as('trip_id')])
      .where({ id })
      .execute<{ trip_id: number } | undefined>('get', false);
    return row?.trip_id;
  }
}
