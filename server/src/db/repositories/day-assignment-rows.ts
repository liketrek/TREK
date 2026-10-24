/**
 * The rows `DayAssignmentsRepository` answers with, and the Kysely table
 * shapes its hand-built statements are typed against: what a day assignment
 * is read as, kept apart from the statements that read it.
 */
import type { DayAssignments } from '../entities/DayAssignments.entity';
import type { DB } from '../kysely/db';
import { type AssertRowKeys } from './_shared/rows';

/**
 * The DY1/DY3/AS1/AS3 assignment-with-place projection row (Plan 3c Task 2's
 * report is the contract for Task 3, which consumes this unchanged):
 *
 * ```sql
 * SELECT da.*, p.id as place_id, p.name as place_name, p.description as place_description,
 *   p.lat, p.lng, p.address, p.category_id, p.price, p.currency as place_currency,
 *   COALESCE(da.assignment_time, p.place_time) as place_time,
 *   COALESCE(da.assignment_end_time, p.end_time) as end_time,
 *   p.duration_minutes, p.notes as place_notes,
 *   p.image_url, p.transport_mode, p.google_place_id, p.google_ftid, p.osm_id, p.amap_poi_id,
 *   p.website, p.phone, p.stop_type, p.fill_percent,
 *   t.place_id AS tour_place_id,
 *   CASE WHEN t.place_id IS NOT NULL THEN p.route_geometry END AS tour_route_geometry,
 *   c.name as category_name, c.color as category_color, c.icon as category_icon
 * FROM day_assignments da
 * JOIN places p ON da.place_id = p.id
 * LEFT JOIN tours t ON t.place_id = p.id
 * LEFT JOIN categories c ON p.category_id = c.id
 * WHERE <da.id = ? | da.day_id = ? | da.day_id IN (...)>
 * [ORDER BY da.order_index ASC, da.created_at ASC]
 * ```
 *
 * `da.*` selects every scalar column of `DayAssignments` (`place_id` among
 * them, the physical FK column) and then `p.id as place_id` selects it again
 * under the same output key; the legacy statement did this too, and
 * better-sqlite3's row object keeps the LAST column with a given name, so
 * `place_id` on the wire is always `p.id`, not `da.place_id` (they agree by
 * the JOIN condition regardless). Nullability here is the physical column's,
 * not `AssignmentRow`'s (types.ts) narrower claims (rule 16): a place with
 * no category genuinely nulls `category_name`/`category_color`/
 * `category_icon` through the LEFT JOIN even though `Categories.name` itself
 * is NOT NULL.
 */
export interface AssignmentWithPlaceRow extends DayAssignmentRow {
  place_name: string;
  place_description: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  category_id: number | null;
  price: number | null;
  place_currency: string | null;
  place_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  place_notes: string | null;
  image_url: string | null;
  transport_mode: string | null;
  google_place_id: string | null;
  google_ftid: string | null;
  osm_id: string | null;
  amap_poi_id: string | null;
  website: string | null;
  phone: string | null;
  stop_type: string | null;
  fill_percent: number | null;
  /** The place's id when it is a Tour (its `tours` facet row), else null. */
  tour_place_id: number | null;
  /** The place's `route_geometry`, but only for a Tour; null for every other place. */
  tour_route_geometry: string | null;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
}

/**
 * {@link DayAssignmentsRepository.listPublicForShare}'s projection (SH9):
 * {@link AssignmentWithPlaceRow} minus the six columns a public share link
 * must not leak, and minus the two Tour facet columns the share projection
 * never selected.
 */
export type SharePublicAssignmentRow = Omit<
  AssignmentWithPlaceRow,
  | 'google_place_id'
  | 'google_ftid'
  | 'osm_id'
  | 'amap_poi_id'
  | 'stop_type'
  | 'fill_percent'
  | 'tour_place_id'
  | 'tour_route_geometry'
>;

/**
 * A `day_assignments` row exactly as `AS12` (`AssignmentsService
 * .getAssignmentForTrip`) re-selects it: every scalar column of the entity
 * (`da.*`), scoped by a two-hop join to `days` for the trip check (Task 3).
 */
export interface DayAssignmentRow {
  id: number;
  day_id: number;
  place_id: number;
  order_index: number | null;
  notes: string | null;
  reservation_status: string | null;
  reservation_notes: string | null;
  reservation_datetime: string | null;
  created_at: string | null;
  assignment_time: string | null;
  assignment_end_time: string | null;
  leg_transport_mode: string | null;
  incoming_leg_transport_mode: string | null;
  end_day: number;
  accommodation_id: number | null;
  route_excluded: number;
  /** MDT-02: the stage of a multi-day tour the day holds, by its starting stop's key; null for anything else. */
  tour_stage_key: string | null;
}

const _dayAssignmentRowKeys: AssertRowKeys<DayAssignmentRow, DayAssignments> = true;

/** AS18's stop, exactly as `AssignmentsService.sortDayByTime`/`chronoOrder` read it. */
export interface DayStopRow {
  id: number;
  order_index: number | null;
  effective_time: string | null;
  located: number;
}

/** AC7's row ({@link DayAssignmentsRepository.listSeatRows}), `night-seat.ts`'s `SeatRow`. */
export interface DaySeatRow {
  id: number;
  order_index: number | null;
  at: string | null;
  night_id: number | null;
  located: number;
}

/**
 * `day_assignments`/`places`/`day_accommodations`'s shape for AS16
 * (`effectiveStart`) and AS18 (`listForTimeSort`), an explicit `TDB` type
 * argument for `this.kysely()` (per `WebauthnChallengesRepository
 * .claimChallenge`'s docstring: entity-metadata inference is not what a
 * hand-written statement wants). There is no MikroORM relation from
 * `DayAssignments` to `DayAccommodations`: `accommodation_id` is a plain
 * `p.integer()` column on this entity, not a `manyToOne` (`day_accommodations`
 * is Plan 3d's table; adding the relation means touching
 * `src/db/entities/DayAssignments.entity.ts`, out of this task's scope). So
 * the QueryBuilder's relation-path `.join()` cannot express the LEFT JOIN at
 * all. Kysely joining the physical table name directly is the sanctioned
 * next step down D3's escape-hatch order (`find/findOne → nativeUpdate →
 * qb() → em.getKysely()`).
 */
export type AssignmentTimeSortKyselyDB = Pick<DB, 'day_assignments' | 'places' | 'day_accommodations'>;

/**
 * RPL2's row, exactly as `RoadtripPlanService.context`'s old local `VisitRow`
 * interface declared it: the stay the visit stands for on its check-in day
 * (never `a.accommodation_id`, see the method docstring), and the checkout
 * day's `day_number`, both `null` for a visit with no linked stay.
 * `accommodation_id` is the stay whose booking wrote this stop (null for one
 * the traveller placed), and `order_index` is the stop's slot in the day plan
 * the carrier terminals are seated against.
 */
export interface RoadtripVisitRow {
  id: number;
  day_id: number;
  order_index: number;
  place_id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  end_day: number;
  leg_transport_mode: string | null;
  incoming_leg_transport_mode: string | null;
  stop_type: string | null;
  fill_percent: number | null;
  accommodation_id: number | null;
  stay_id: number | null;
  check_in: string | null;
  check_out: string | null;
  checkout_day: number | null;
}

/**
 * `day_assignments`/`days`/`places`/`day_accommodations`'s shape for RPL2
 * (`listRoadtripVisits`), the same Kysely-typed-DB-interface shape
 * `AssignmentTimeSortKyselyDB` above uses. `days` is joined twice under two
 * aliases (`d`, `checkout`); both resolve against this one `days` entry.
 */
export type RoadtripVisitsKyselyDB = Pick<DB, 'day_assignments' | 'days' | 'places' | 'day_accommodations'>;
