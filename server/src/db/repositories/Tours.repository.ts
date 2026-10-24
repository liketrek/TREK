import { type Tours, type TToursOrigin, ToursOrigin } from '../entities/Tours.entity';
import type { DB } from '../kysely/db';
import type { AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';
import { toLibraryRow, toListRow } from './tour-rows';
import type {
  BikeProfile,
  PaddleBoatType,
  PaddleLakeStyle,
  PaddleWaterContext,
  RunProfile,
  SkiDiscipline,
  SkiTechnique,
} from '@trek/shared';

/**
 * A tour as the Tours list and detail read it: the `tours` facet joined with
 * its owning place's name, plus two read-model flags (`planned`: the place
 * sits on at least one day; `has_waypoints`: the route editor saved control
 * points for it). SQLite hands both flags back as 0/1.
 */
export interface TourListRow {
  place_id: number;
  name: string;
  description?: string | null;
  website?: string | null;
  tour_type: string;
  distance: number | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  duration: number | null;
  planned_duration_minutes: number | null;
  break_additional_minutes: number | null;
  difficulty: string | null;
  wanderer_ref: string | null;
  match_confidence: number | null;
  max_hiking_difficulty: number | null;
  derived_from_place_id: number | null;
  origin: string;
  /** BIK-01: a bike tour's profile; NULL on every other type. */
  bike_profile: string | null;
  /** RUN-01: a run's profile and the pace it is planned at, seconds per km; NULL on every other type. */
  run_profile: string | null;
  run_pace_seconds_per_km: number | null;
  /** SKI-02: a ski tour's discipline and, for cross-country, its technique; NULL on every other type. */
  ski_discipline: string | null;
  ski_technique: string | null;
  /** A ski tour's piste router options and build, still JSON text; absent where a read does not take it. */
  ski_options?: string | null;
  boat_type: string | null;
  water_context: string | null;
  paddle_speed_kmh: number | null;
  portage_speed_kmh: number | null;
  paddle_lake_style: string | null;
  /** The marks laid onto a recorded track, still JSON text. */
  track_marks: string | null;
  has_recorded_track: number;
  planned: number;
  has_waypoints: number;
  /** CW-11: 1 while the owning place has no line, a city walk saved with its stations only. */
  route_missing: number;
  /** P2C-03: the tour's technical revision. */
  revision: number;
  /** MF-08: a hike's routing preferences, still JSON text. */
  hiking_preferences: string | null;
  /** ACT-01: the first and last time on an imported track's points; NULL without times. */
  track_started_at: string | null;
  track_ended_at: string | null;
  /** MDT-01: how many of its stops end a stage; 0 for a day tour. */
  stage_ends: number;
}

/** LIB-02: a tour of another trip as the take-over list reads it, with the trip it is in. */
export interface TourLibraryRow {
  place_id: number;
  name: string;
  description: string | null;
  tour_type: string;
  distance: number | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  duration: number | null;
  planned_duration_minutes: number | null;
  break_additional_minutes: number | null;
  max_hiking_difficulty: number | null;
  origin: string;
  trip_id: number;
  trip_title: string;
  has_waypoints: number;
}

/** Every `tours` column, as the trip copy reads and re-inserts it. */
export interface TourRow {
  place_id: number;
  tour_type: string;
  distance: number | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  duration: number | null;
  planned_duration_minutes: number | null;
  break_additional_minutes: number | null;
  difficulty: string | null;
  wanderer_ref: string | null;
  match_confidence: number | null;
  created_at: string | null;
  max_hiking_difficulty: number | null;
  derived_from_place_id: number | null;
  recorded_route_geometry: string | null;
  origin: string;
  origin_file_name: string | null;
  boat_type: string | null;
  water_context: string | null;
  paddle_speed_kmh: number | null;
  portage_speed_kmh: number | null;
  paddle_lake_style: string | null;
  track_marks: string | null;
  revision: number;
  hiking_preferences: string | null;
  taken_over_from_trip_title: string | null;
  taken_over_from_tour_name: string | null;
  bike_profile: string | null;
  run_profile: string | null;
  run_pace_seconds_per_km: number | null;
  ski_discipline: string | null;
  ski_technique: string | null;
  track_started_at: string | null;
  track_ended_at: string | null;
  ski_options: string | null;
}
const _tourRowKeys: AssertRowKeys<TourRow, Tours> = true;

/** What a create or a GPX import writes; the unset metadata columns stay NULL. */
export interface TourInsert {
  place_id: number;
  tour_type: string;
  distance: number | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  duration: number | null;
  planned_duration_minutes: number | null;
  break_additional_minutes?: number | null;
  match_confidence: number | null;
  max_hiking_difficulty: number | null;
  /** BIK-01: a bike tour's profile; left out, NULL. */
  bike_profile?: BikeProfile | null;
  /** RUN-01: a run's profile and its pace, seconds per km; left out, NULL. */
  run_profile?: RunProfile | null;
  run_pace_seconds_per_km?: number | null;
  /** SKI-02: a ski tour's discipline and technique; left out, NULL. */
  ski_discipline?: SkiDiscipline | null;
  ski_technique?: SkiTechnique | null;
  /** A ski tour's piste router options and build as JSON text; left out, NULL. */
  ski_options?: string | null;
  /** A paddle tour's boat, water and chosen speed; left out, a hike's NULLs. */
  boat_type?: PaddleBoatType | null;
  water_context?: PaddleWaterContext | null;
  paddle_speed_kmh?: number | null;
  portage_speed_kmh?: number | null;
  paddle_lake_style?: PaddleLakeStyle | null;
  /** MF-08: a hike's routing preferences as JSON text; left out, none. */
  hiking_preferences?: string | null;
}

/** What a route edit replaces on an existing tour: the type and everything that belongs to it. */
/** The planned times of a tour as P8 writes them, null where there is none. */
interface TourTimesUpdate {
  planned_duration_minutes: number | null;
  break_additional_minutes: number | null;
}

export type TourUpdate = Omit<
  TourInsert,
  | 'place_id'
  | 'planned_duration_minutes'
  | 'break_additional_minutes'
  | 'bike_profile'
  | 'run_profile'
  | 'run_pace_seconds_per_km'
  | 'ski_discipline'
  | 'ski_technique'
  | 'boat_type'
  | 'water_context'
  | 'paddle_speed_kmh'
  | 'portage_speed_kmh'
  | 'paddle_lake_style'
> & {
  planned_duration_minutes?: number | null;
  break_additional_minutes?: number | null;
  bike_profile: BikeProfile | null;
  run_profile: RunProfile | null;
  run_pace_seconds_per_km: number | null;
  ski_discipline: SkiDiscipline | null;
  ski_technique: SkiTechnique | null;
  boat_type: PaddleBoatType | null;
  water_context: PaddleWaterContext | null;
  paddle_speed_kmh: number | null;
  portage_speed_kmh: number | null;
  paddle_lake_style: PaddleLakeStyle | null;
};

/** SKI-02: a ski track classified again: its discipline and, for cross-country, its technique. */
export interface TourSkiUpdate {
  ski_discipline: SkiDiscipline;
  ski_technique: SkiTechnique | null;
}

/** A recorded track's paddle plan (PAD-03, PAD-07): its speeds, its marks and the time they make. */
export interface TourPaddlePlanUpdate {
  paddle_speed_kmh: number | null;
  portage_speed_kmh: number | null;
  track_marks: string | null;
  duration: number | null;
}

type ToursKyselyDB = Pick<
  DB,
  | 'tours'
  | 'places'
  | 'day_assignments'
  | 'tour_waypoints'
  | 'tour_sources'
  | 'days'
  | 'tour_obstacle_reviews'
  | 'tour_packing_links'
  | 'trips'
>;

/** One day a tour of the trip sits on, in the order of the trip. */
/** MDT-02: a point of a tour as the stages a day can hold are read from it. */
export interface TourStagePointRow {
  role: 'start' | 'via' | 'end';
  lat: number;
  lng: number;
  key?: string;
  stage_end?: boolean;
  shaping?: boolean;
}

export interface TourDayRow {
  place_id: number;
  day_id: number;
  day_number: number;
  date: string | null;
  title: string | null;
  /** MDT-02: the stage of a multi-day tour the day holds, by its starting stop's key; null for the whole tour. */
  tour_stage_key: string | null;
}

/**
 * Where one tour came from, as the provenance contract reads it: the facet's
 * own record (origin, the GPX file name, when it was saved, the wanderer
 * reference), the import's snapshot row when there is one, and the name of the
 * import a planned tour came from while that import is still in the trip.
 */
export interface TourProvenanceRow {
  origin: string;
  taken_over_from_trip_title: string | null;
  taken_over_from_tour_name: string | null;
  origin_file_name: string | null;
  created_at: string | null;
  wanderer_ref: string | null;
  has_recorded_track: number;
  derived_from_place_id: number | null;
  derived_from_name: string | null;
  source_instance: string | null;
  source_external_id: string | null;
  source_external_url: string | null;
  source_external_updated: string | null;
  source_imported_at: string | null;
  source_content_hash: string | null;
  source_local_hash: string | null;
  route_geometry: string | null;
  name: string;
}

/**
 * `tours` — the facet that makes a place a tour (#2586). Keyed on the owning
 * place, so it carries no trip of its own: every trip-scoped statement here
 * joins `places` for the predicate. Deleting the place cascades the row and
 * its `tour_waypoints`.
 *
 * Kysely throughout: the list projection needs two correlated `EXISTS`
 * subqueries, and the trip-scoped update and the day check join tables the
 * entity has no relation path to.
 */
export class ToursRepository extends TrekRepository<Tours> {
  private db() {
    return this.kysely<ToursKyselyDB>();
  }

  /** The shared SELECT of {@link listForTrip} and {@link findInTrip}. */
  private listQuery() {
    return this.db()
      .selectFrom('tours as t')
      .innerJoin('places as p', 'p.id', 't.place_id')
      .select((eb) => [
        'p.id as place_id',
        'p.name as name',
        'p.description as description',
        'p.website as website',
        't.tour_type as tour_type',
        't.distance as distance',
        't.elevation_gain as elevation_gain',
        't.elevation_loss as elevation_loss',
        't.duration as duration',
        't.planned_duration_minutes as planned_duration_minutes',
        't.break_additional_minutes as break_additional_minutes',
        't.difficulty as difficulty',
        't.wanderer_ref as wanderer_ref',
        't.match_confidence as match_confidence',
        't.max_hiking_difficulty as max_hiking_difficulty',
        't.derived_from_place_id as derived_from_place_id',
        't.origin as origin',
        't.bike_profile as bike_profile',
        't.run_profile as run_profile',
        't.run_pace_seconds_per_km as run_pace_seconds_per_km',
        't.ski_discipline as ski_discipline',
        't.ski_technique as ski_technique',
        't.ski_options as ski_options',
        't.boat_type as boat_type',
        't.water_context as water_context',
        't.paddle_speed_kmh as paddle_speed_kmh',
        't.portage_speed_kmh as portage_speed_kmh',
        't.paddle_lake_style as paddle_lake_style',
        't.track_marks as track_marks',
        't.revision as revision',
        't.hiking_preferences as hiking_preferences',
        't.track_started_at as track_started_at',
        't.track_ended_at as track_ended_at',
        eb('t.recorded_route_geometry', 'is not', null).as('has_recorded_track'),
        eb('p.route_geometry', 'is', null).as('route_missing'),
        eb
          .exists(eb.selectFrom('day_assignments as da').select('da.id').whereRef('da.place_id', '=', 'p.id'))
          .as('planned'),
        eb
          .exists(eb.selectFrom('tour_waypoints as tw').select('tw.id').whereRef('tw.place_id', '=', 'p.id'))
          .as('has_waypoints'),
        eb
          .selectFrom('tour_waypoints as ts')
          .select((count) => count.fn.countAll<number>().as('n'))
          .whereRef('ts.place_id', '=', 'p.id')
          .where('ts.stage_end', '=', 1)
          .as('stage_ends'),
      ]);
  }

  /**
   * TO1 — `SELECT p.id AS place_id, p.name, t.*, EXISTS(day_assignments) AS
   * planned, EXISTS(tour_waypoints) AS has_waypoints FROM tours t JOIN places
   * p ON p.id = t.place_id WHERE p.trip_id = ? ORDER BY t.created_at DESC`,
   * newest first. The place id breaks ties inside one CURRENT_TIMESTAMP second.
   */
  async listForTrip(trip_id: number): Promise<TourListRow[]> {
    const rows = await this.listQuery()
      .where('p.trip_id', '=', trip_id)
      .orderBy('t.created_at', 'desc')
      .orderBy('t.place_id', 'desc')
      .execute();
    return rows.map(toListRow);
  }

  /** TO2 — {@link listForTrip}'s projection for one place, `undefined` unless it is a tour of that trip. */
  async findInTrip(trip_id: number, place_id: number): Promise<TourListRow | undefined> {
    const row = await this.listQuery().where('p.trip_id', '=', trip_id).where('p.id', '=', place_id).executeTakeFirst();
    return row ? toListRow(row) : undefined;
  }

  /**
   * LIB-02: the tours of the given trips, as the take-over list reads them,
   * narrowed by a type or one of those trips; the newest trip first, its
   * newest tour first, at most `limit`. Never a trip outside `trip_ids`, which
   * the caller resolved from the user's own access.
   */
  async listForLibrary(
    trip_ids: readonly number[],
    filter: { tour_type?: string; trip_id?: number },
    limit: number,
  ): Promise<TourLibraryRow[]> {
    if (trip_ids.length === 0) return [];
    let query = this.libraryQuery().where('p.trip_id', 'in', [...trip_ids]);
    if (filter.trip_id !== undefined) query = query.where('p.trip_id', '=', filter.trip_id);
    if (filter.tour_type) query = query.where('t.tour_type', '=', filter.tour_type);
    const rows = await query
      .orderBy('p.trip_id', 'desc')
      .orderBy('t.created_at', 'desc')
      .orderBy('t.place_id', 'desc')
      .limit(limit)
      .execute();
    return rows.map(toLibraryRow);
  }

  /** LIB-02: how many tours each of the given trips holds, with its title, for the trip filter. */
  async countForLibrary(
    trip_ids: readonly number[],
  ): Promise<Array<{ id: number; title: string; tour_count: number }>> {
    if (trip_ids.length === 0) return [];
    const rows = await this.db()
      .selectFrom('tours as t')
      .innerJoin('places as p', 'p.id', 't.place_id')
      .innerJoin('trips as tr', 'tr.id', 'p.trip_id')
      .select((eb) => ['tr.id as id', 'tr.title as title', eb.fn.countAll<number>().as('tour_count')])
      .where('p.trip_id', 'in', [...trip_ids])
      .groupBy(['tr.id', 'tr.title'])
      .orderBy('tr.id', 'desc')
      .execute();
    return rows.map((row) => ({ id: row.id, title: row.title, tour_count: Number(row.tour_count) }));
  }

  /** LIB-02: one tour of the given trips for its preview, with its line and how many control points it has. */
  async findForLibrary(
    trip_ids: readonly number[],
    place_id: number,
  ): Promise<(TourLibraryRow & { route_geometry: string | null; waypoint_count: number }) | undefined> {
    if (trip_ids.length === 0) return undefined;
    const row = await this.libraryQuery()
      .select((eb) => [
        'p.route_geometry as route_geometry',
        eb
          .selectFrom('tour_waypoints as tw')
          .select(eb.fn.countAll<number>().as('n'))
          .whereRef('tw.place_id', '=', 'p.id')
          .as('waypoint_count'),
      ])
      .where('p.trip_id', 'in', [...trip_ids])
      .where('p.id', '=', place_id)
      .executeTakeFirst();
    return row
      ? { ...toLibraryRow(row), route_geometry: row.route_geometry, waypoint_count: Number(row.waypoint_count ?? 0) }
      : undefined;
  }

  private libraryQuery() {
    return this.db()
      .selectFrom('tours as t')
      .innerJoin('places as p', 'p.id', 't.place_id')
      .innerJoin('trips as tr', 'tr.id', 'p.trip_id')
      .select((eb) => [
        'p.id as place_id',
        'p.name as name',
        'p.description as description',
        't.tour_type as tour_type',
        't.distance as distance',
        't.elevation_gain as elevation_gain',
        't.elevation_loss as elevation_loss',
        't.duration as duration',
        't.planned_duration_minutes as planned_duration_minutes',
        't.break_additional_minutes as break_additional_minutes',
        't.max_hiking_difficulty as max_hiking_difficulty',
        't.origin as origin',
        'tr.id as trip_id',
        'tr.title as trip_title',
        eb
          .exists(eb.selectFrom('tour_waypoints as tw').select('tw.id').whereRef('tw.place_id', '=', 'p.id'))
          .as('has_waypoints'),
      ]);
  }

  /** Where a tour of this trip came from; `undefined` unless the place is a tour of that trip. */
  async findProvenance(trip_id: number, place_id: number): Promise<TourProvenanceRow | undefined> {
    return await this.db()
      .selectFrom('tours as t')
      .innerJoin('places as p', 'p.id', 't.place_id')
      .leftJoin('tour_sources as s', 's.place_id', 't.place_id')
      .leftJoin('places as d', (join) =>
        join.onRef('d.id', '=', 't.derived_from_place_id').on('d.trip_id', '=', trip_id),
      )
      .select((eb) => [
        't.origin as origin',
        't.origin_file_name as origin_file_name',
        't.taken_over_from_trip_title as taken_over_from_trip_title',
        't.taken_over_from_tour_name as taken_over_from_tour_name',
        't.created_at as created_at',
        't.wanderer_ref as wanderer_ref',
        eb('t.recorded_route_geometry', 'is not', null).as('has_recorded_track'),
        't.derived_from_place_id as derived_from_place_id',
        'd.name as derived_from_name',
        's.instance as source_instance',
        's.external_id as source_external_id',
        's.external_url as source_external_url',
        's.external_updated as source_external_updated',
        's.imported_at as source_imported_at',
        's.content_hash as source_content_hash',
        's.local_hash as source_local_hash',
        'p.route_geometry as route_geometry',
        'p.name as name',
      ])
      .where('p.trip_id', '=', trip_id)
      .where('p.id', '=', place_id)
      .executeTakeFirst()
      .then((row) => (row ? { ...row, has_recorded_track: Number(row.has_recorded_track) } : undefined));
  }

  /**
   * A copied tour keeps the import record of the tour it was copied from, so a
   * trip copy still says where its imports came from and when. Nothing happens
   * for a tour without one.
   */
  /** The line of every paddle tour of a trip, for its check bench (PAD-09). */
  async listPaddleLinesForTrip(trip_id: number): Promise<Array<{ place_id: number; route_geometry: string | null }>> {
    return await this.db()
      .selectFrom('tours as t')
      .innerJoin('places as p', 'p.id', 't.place_id')
      .select(['t.place_id', 'p.route_geometry'])
      .where('p.trip_id', '=', trip_id)
      .where('t.tour_type', '=', 'kayak')
      .orderBy('t.place_id', 'asc')
      .execute();
  }

  /** A copied tour takes the decisions about its obstacles along, bound to what they were decided on. */
  async copyObstacleReviews(source_place_id: number, place_id: number): Promise<void> {
    await this.db()
      .insertInto('tour_obstacle_reviews')
      .columns([
        'place_id',
        'obstacle_key',
        'decision',
        'note',
        'route_fingerprint',
        'source_fingerprint',
        'obstacle_snapshot',
        'decided_at',
        'decided_by',
      ])
      .expression((eb) =>
        eb
          .selectFrom('tour_obstacle_reviews')
          .select((inner) => [
            inner.val(place_id).as('place_id'),
            'obstacle_key',
            'decision',
            'note',
            'route_fingerprint',
            'source_fingerprint',
            'obstacle_snapshot',
            'decided_at',
            'decided_by',
          ])
          .where('place_id', '=', source_place_id),
      )
      .execute();
  }

  async copySource(source_place_id: number, place_id: number): Promise<void> {
    await this.db()
      .insertInto('tour_sources')
      .columns([
        'place_id',
        'provider',
        'instance',
        'external_id',
        'external_url',
        'external_updated',
        'content_hash',
        'local_hash',
        'imported_by',
        'imported_at',
      ])
      .expression((eb) =>
        eb
          .selectFrom('tour_sources')
          .select((inner) => [
            inner.val(place_id).as('place_id'),
            'provider',
            'instance',
            'external_id',
            'external_url',
            'external_updated',
            'content_hash',
            'local_hash',
            'imported_by',
            'imported_at',
          ])
          .where('place_id', '=', source_place_id),
      )
      .execute();
  }

  /**
   * P2D-XD-01: the packing list or category a copied tour pointed at, onto its
   * copy in the copied trip, whose packing list is copied too. Nothing for a
   * tour that pointed at nothing.
   */
  async copyPackingLink(source_place_id: number, place_id: number): Promise<void> {
    await this.db()
      .insertInto('tour_packing_links')
      .columns(['place_id', 'category', 'linked_by', 'linked_at'])
      .expression((eb) =>
        eb
          .selectFrom('tour_packing_links')
          .select((inner) => [inner.val(place_id).as('place_id'), 'category', 'linked_by', 'linked_at'])
          .where('place_id', '=', source_place_id),
      )
      .execute();
  }

  /** The days every tour of a trip sits on, each tour and day once, in day order, with the stage a day holds (MDT-02). */
  async listTourDays(trip_id: number): Promise<TourDayRow[]> {
    return await this.db()
      .selectFrom('day_assignments as da')
      .innerJoin('tours as t', 't.place_id', 'da.place_id')
      .innerJoin('days as d', 'd.id', 'da.day_id')
      .select([
        'da.place_id as place_id',
        'd.id as day_id',
        'd.day_number as day_number',
        'd.date as date',
        'd.title as title',
        'da.tour_stage_key as tour_stage_key',
      ])
      .where('d.trip_id', '=', trip_id)
      .distinct()
      .orderBy('d.day_number', 'asc')
      .orderBy('da.place_id', 'asc')
      .execute();
  }

  /** CW-11: a day of this trip with its date, for a city walk proposed on it; `undefined` for a day of another trip. */
  async dayOfTrip(trip_id: number, day_id: number): Promise<{ id: number; date: string | null } | undefined> {
    return await this.db()
      .selectFrom('days')
      .select(['id', 'date'])
      .where('id', '=', day_id)
      .where('trip_id', '=', trip_id)
      .executeTakeFirst();
  }

  /** TO3 — `SELECT 1 FROM tours WHERE place_id = ?`: whether the place is a tour. */
  async existsForPlace(place_id: number): Promise<boolean> {
    const row = await this.db()
      .selectFrom('tours')
      .select('place_id')
      .where('place_id', '=', place_id)
      .executeTakeFirst();
    return !!row;
  }

  /** TO4 — `SELECT place_id FROM tours WHERE place_id IN (...)`: which of these places are tours. */
  async listTourPlaceIds(place_ids: number[]): Promise<number[]> {
    if (place_ids.length === 0) return [];
    const rows = await this.db().selectFrom('tours').select('place_id').where('place_id', 'in', place_ids).execute();
    return rows.map((r) => r.place_id);
  }

  /**
   * TO5 — `SELECT 1 FROM day_assignments da JOIN tours t ON t.place_id =
   * da.place_id WHERE da.day_id = ? AND da.place_id = ? [AND da.id != ?]`.
   *
   * A tour fills its day, so one day holds it at most once. Create and move
   * both ask this inside the transaction that writes the assignment; move
   * passes the assignment being moved so it does not collide with itself.
   * False for an ordinary place, which may sit on a day any number of times.
   */
  async isOnDay(day_id: number, place_id: number, except_assignment_id?: number): Promise<boolean> {
    let query = this.db()
      .selectFrom('day_assignments as da')
      .innerJoin('tours as t', 't.place_id', 'da.place_id')
      .select('da.id')
      .where('da.day_id', '=', day_id)
      .where('da.place_id', '=', place_id);
    if (except_assignment_id !== undefined) query = query.where('da.id', '!=', except_assignment_id);
    return !!(await query.executeTakeFirst());
  }

  /**
   * MDT-02: the points of a tour as its stages are read from them, in route
   * order: role, key, stage end and where each sits. None for a place that is
   * no tour, or a tour without points of its own.
   */
  async listStagePoints(place_id: number): Promise<TourStagePointRow[]> {
    const rows = await this.db()
      .selectFrom('tour_waypoints')
      .select(['role', 'station_key', 'stage_end', 'shaping', 'lat', 'lng'])
      .where('place_id', '=', place_id)
      .orderBy('sequence', 'asc')
      // The column's CHECK holds it to the three roles.
      .$narrowType<{ role: TourStagePointRow['role'] }>()
      .execute();
    return rows.map((row) => ({
      role: row.role,
      lat: row.lat,
      lng: row.lng,
      ...(row.station_key ? { key: row.station_key } : {}),
      ...(row.stage_end ? { stage_end: true } : {}),
      ...(row.shaping ? { shaping: true } : {}),
    }));
  }

  /**
   * MDT-02: the day assignment holding this stage of a tour (by the key of the
   * stop it starts at), with its day; `undefined` while the stage is on no day.
   */
  async findTourStage(place_id: number, tour_stage_key: string): Promise<{ id: number; day_id: number } | undefined> {
    return await this.db()
      .selectFrom('day_assignments')
      .select(['id', 'day_id'])
      .where('place_id', '=', place_id)
      .where('tour_stage_key', '=', tour_stage_key)
      .executeTakeFirst();
  }

  /**
   * MDT-02: takes off their days the stages of a tour whose starting stop is
   * not among `keys` (every stage, for none), and answers what it took, so a
   * stage a changed tour no longer has leaves no day holding it. The caller
   * owns the transaction: the tour's points are written in the same one.
   */
  async deleteTourStagesNotIn(
    place_id: number,
    keys: readonly string[],
  ): Promise<Array<{ id: number; day_id: number }>> {
    let query = this.db()
      .selectFrom('day_assignments')
      .select(['id', 'day_id'])
      .where('place_id', '=', place_id)
      .where('tour_stage_key', 'is not', null);
    if (keys.length > 0) query = query.where('tour_stage_key', 'not in', [...keys]);
    const gone = await query.orderBy('id', 'asc').execute();
    if (gone.length > 0) {
      await this.db()
        .deleteFrom('day_assignments')
        .where(
          'id',
          'in',
          gone.map((row) => row.id),
        )
        .execute();
    }
    return gone;
  }

  /** TO6 — every `tours` row of a trip's places, for the trip copy to remap. */
  async listRowsForTrip(trip_id: number): Promise<TourRow[]> {
    return await this.db()
      .selectFrom('tours as t')
      .innerJoin('places as p', 'p.id', 't.place_id')
      .selectAll('t')
      .where('p.trip_id', '=', trip_id)
      .orderBy('t.place_id', 'asc')
      .execute();
  }

  /** TO7 — `INSERT INTO tours (place_id, tour_type, distance, ...) VALUES (...)`. */
  /**
   * `wanderer_ref` and `difficulty` are set only by an import from a source that
   * carries them, `derived_from_place_id` only by a tour planned from an import.
   * `origin` says which way the tour came in (planned here unless an import
   * says otherwise), `origin_file_name` the GPX file it was read from.
   */
  async insertTour(
    input: TourInsert & {
      wanderer_ref?: string | null;
      difficulty?: string | null;
      derived_from_place_id?: number | null;
      origin?: TToursOrigin;
      origin_file_name?: string | null;
      track_marks?: string | null;
      taken_over_from_trip_title?: string | null;
      taken_over_from_tour_name?: string | null;
      /** ACT-01: the times the import read off the track's points, canonical DATETIME text. */
      track_started_at?: string | null;
      track_ended_at?: string | null;
    },
  ): Promise<void> {
    await this.insert({
      origin: input.origin ?? ToursOrigin.TREK,
      origin_file_name: input.origin_file_name ?? null,
      derivedFromPlace: input.derived_from_place_id ?? null,
      wanderer_ref: input.wanderer_ref ?? null,
      difficulty: input.difficulty ?? null,
      place: input.place_id,
      tourTypeRef: input.tour_type,
      distance: input.distance,
      elevation_gain: input.elevation_gain,
      elevation_loss: input.elevation_loss,
      duration: input.duration,
      planned_duration_minutes: input.planned_duration_minutes,
      break_additional_minutes: input.break_additional_minutes ?? null,
      match_confidence: input.match_confidence,
      max_hiking_difficulty: input.max_hiking_difficulty,
      bike_profile: input.bike_profile ?? null,
      run_profile: input.run_profile ?? null,
      run_pace_seconds_per_km: input.run_pace_seconds_per_km ?? null,
      ski_discipline: input.ski_discipline ?? null,
      ski_technique: input.ski_technique ?? null,
      ski_options: input.ski_options ?? null,
      boat_type: input.boat_type ?? null,
      water_context: input.water_context ?? null,
      paddle_speed_kmh: input.paddle_speed_kmh ?? null,
      portage_speed_kmh: input.portage_speed_kmh ?? null,
      paddle_lake_style: input.paddle_lake_style ?? null,
      track_marks: input.track_marks ?? null,
      hiking_preferences: input.hiking_preferences ?? null,
      taken_over_from_trip_title: input.taken_over_from_trip_title ?? null,
      taken_over_from_tour_name: input.taken_over_from_tour_name ?? null,
      track_started_at: input.track_started_at ?? null,
      track_ended_at: input.track_ended_at ?? null,
    });
  }

  /**
   * TO8 — a copied tour keeps every column, `created_at` included, so the
   * copy lists its tours in the source's order. A tour planned from an import
   * points at the copied import (`copiedPlaceIds` maps source to copy), never
   * back into the source trip.
   */
  async insertCopy(
    place_id: number,
    row: Omit<TourRow, 'place_id'>,
    copiedPlaceIds: ReadonlyMap<number, number>,
  ): Promise<void> {
    const derivedFrom = row.derived_from_place_id;
    await this.db()
      .insertInto('tours')
      .values({
        ...row,
        place_id,
        derived_from_place_id: derivedFrom === null ? null : (copiedPlaceIds.get(derivedFrom) ?? null),
        // A copy is a tour of its own, not a revision of the one it came from.
        revision: 1,
      })
      .execute();
  }

  /**
   * P2C-03: raises the tour's revision by one and answers the new one. Given
   * the revision a write was based on, only that revision is raised, so a
   * write against a tour that moved on meanwhile changes nothing and answers
   * null. Runs inside the write's transaction, as the first change it makes.
   */
  async advanceRevision(place_id: number, expected?: number | null): Promise<number | null> {
    let query = this.db()
      .updateTable('tours')
      .set((eb) => ({ revision: eb('revision', '+', 1) }))
      .where('place_id', '=', place_id);
    if (expected != null) query = query.where('revision', '=', expected);
    const row = await query.returning('revision').executeTakeFirst();
    return row?.revision ?? null;
  }

  /** The tour's current revision, `undefined` when the place is no tour. */
  async revisionOf(place_id: number): Promise<number | undefined> {
    const row = await this.db()
      .selectFrom('tours')
      .select('revision')
      .where('place_id', '=', place_id)
      .executeTakeFirst();
    return row?.revision;
  }

  /**
   * TO9 — `UPDATE tours SET tour_type = ?, distance = ?, ... WHERE place_id =
   * ? AND place_id IN (SELECT id FROM places WHERE trip_id = ?)`. Returns
   * whether a row of that trip was updated.
   */
  async updateInTrip(trip_id: number, place_id: number, input: TourUpdate): Promise<boolean> {
    const result = await this.db()
      .updateTable('tours')
      .set({
        tour_type: input.tour_type,
        distance: input.distance,
        elevation_gain: input.elevation_gain,
        elevation_loss: input.elevation_loss,
        duration: input.duration,
        ...(input.planned_duration_minutes !== undefined
          ? { planned_duration_minutes: input.planned_duration_minutes }
          : {}),
        ...(input.break_additional_minutes !== undefined
          ? { break_additional_minutes: input.break_additional_minutes }
          : {}),
        match_confidence: input.match_confidence,
        max_hiking_difficulty: input.max_hiking_difficulty,
        bike_profile: input.bike_profile,
        run_profile: input.run_profile,
        run_pace_seconds_per_km: input.run_pace_seconds_per_km,
        ski_discipline: input.ski_discipline,
        ski_technique: input.ski_technique,
        ...(input.ski_options !== undefined ? { ski_options: input.ski_options } : {}),
        boat_type: input.boat_type,
        water_context: input.water_context,
        paddle_speed_kmh: input.paddle_speed_kmh,
        portage_speed_kmh: input.portage_speed_kmh,
        paddle_lake_style: input.paddle_lake_style,
        ...(input.hiking_preferences !== undefined ? { hiking_preferences: input.hiking_preferences } : {}),
      })
      .where('place_id', '=', place_id)
      .where('place_id', 'in', (eb) => eb.selectFrom('places').select('id').where('trip_id', '=', trip_id))
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0) > 0;
  }

  /**
   * P8: a tour's planned times alone, as update_tour_details changes them;
   * nothing else of the tour is touched. Returns whether a row of that trip was updated.
   */
  async updateTimesInTrip(trip_id: number, place_id: number, input: TourTimesUpdate): Promise<boolean> {
    const result = await this.db()
      .updateTable('tours')
      .set({
        planned_duration_minutes: input.planned_duration_minutes,
        break_additional_minutes: input.break_additional_minutes,
      })
      .where('place_id', '=', place_id)
      .where('place_id', 'in', (eb) => eb.selectFrom('places').select('id').where('trip_id', '=', trip_id))
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0) > 0;
  }

  /**
   * The paddle plan of a recorded track of the trip: its speeds, the marks
   * laid onto it and the moving time they make. The track itself is not
   * touched. Returns whether a row of that trip was updated.
   */
  async updatePaddlePlanInTrip(trip_id: number, place_id: number, input: TourPaddlePlanUpdate): Promise<boolean> {
    const result = await this.db()
      .updateTable('tours')
      .set({
        paddle_speed_kmh: input.paddle_speed_kmh,
        portage_speed_kmh: input.portage_speed_kmh,
        track_marks: input.track_marks,
        duration: input.duration,
      })
      .where('place_id', '=', place_id)
      .where('place_id', 'in', (eb) => eb.selectFrom('places').select('id').where('trip_id', '=', trip_id))
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0) > 0;
  }

  /**
   * SKI-02: a ski track of the trip classified again, its discipline and
   * technique only; the track and everything else stay as they are. Returns
   * whether a row of that trip was updated.
   */
  async updateSkiInTrip(trip_id: number, place_id: number, input: TourSkiUpdate): Promise<boolean> {
    const result = await this.db()
      .updateTable('tours')
      .set({ ski_discipline: input.ski_discipline, ski_technique: input.ski_technique })
      .where('place_id', '=', place_id)
      .where('place_id', 'in', (eb) => eb.selectFrom('places').select('id').where('trip_id', '=', trip_id))
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0) > 0;
  }

  /**
   * Keeps an import's recorded line before it is planned over for the first
   * time: copies the place's line into the tour while the tour has no
   * waypoints and nothing kept yet. One statement, so it cannot keep a line
   * that a concurrent edit already replaced.
   */
  async keepRecordedTrack(place_id: number): Promise<void> {
    await this.db()
      .updateTable('tours')
      .set((eb) => ({
        recorded_route_geometry: eb
          .selectFrom('places')
          .select('places.route_geometry')
          .where('places.id', '=', place_id),
      }))
      .where('place_id', '=', place_id)
      .where('recorded_route_geometry', 'is', null)
      .where((eb) =>
        eb.not(
          eb.exists(
            eb.selectFrom('tour_waypoints').select('tour_waypoints.id').where('tour_waypoints.place_id', '=', place_id),
          ),
        ),
      )
      .execute();
  }

  /** The recorded line kept for a tour of the trip, or null when it has none. */
  async findRecordedTrack(trip_id: number, place_id: number): Promise<string | null> {
    const row = await this.db()
      .selectFrom('tours as t')
      .innerJoin('places as p', 'p.id', 't.place_id')
      .select('t.recorded_route_geometry')
      .where('t.place_id', '=', place_id)
      .where('p.trip_id', '=', trip_id)
      .executeTakeFirst();
    return row?.recorded_route_geometry ?? null;
  }

  /** Forgets the kept line once the tour has gone back to it. */
  async clearRecordedTrack(place_id: number): Promise<void> {
    await this.nativeUpdate({ place: place_id }, { recorded_route_geometry: null });
  }
}
