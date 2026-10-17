import { type Tours, type TToursOrigin, ToursOrigin } from '../entities/Tours.entity';
import type { DB } from '../kysely/db';
import type { AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';
import type { PaddleBoatType, PaddleLakeStyle, PaddleWaterContext } from '@trek/shared';

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
  /** A paddle tour's boat, water and chosen speed; left out, a hike's NULLs. */
  boat_type?: PaddleBoatType | null;
  water_context?: PaddleWaterContext | null;
  paddle_speed_kmh?: number | null;
  portage_speed_kmh?: number | null;
  paddle_lake_style?: PaddleLakeStyle | null;
}

/** What a route edit replaces on an existing tour: the type and everything that belongs to it. */
export type TourUpdate = Omit<
  TourInsert,
  | 'place_id'
  | 'planned_duration_minutes'
  | 'break_additional_minutes'
  | 'boat_type'
  | 'water_context'
  | 'paddle_speed_kmh'
  | 'portage_speed_kmh'
  | 'paddle_lake_style'
> & {
  planned_duration_minutes?: number | null;
  break_additional_minutes?: number | null;
  boat_type: PaddleBoatType | null;
  water_context: PaddleWaterContext | null;
  paddle_speed_kmh: number | null;
  portage_speed_kmh: number | null;
  paddle_lake_style: PaddleLakeStyle | null;
};

/** A recorded track's paddle plan (PAD-03, PAD-07): its speeds, its marks and the time they make. */
export interface TourPaddlePlanUpdate {
  paddle_speed_kmh: number | null;
  portage_speed_kmh: number | null;
  track_marks: string | null;
  duration: number | null;
}

type ToursKyselyDB = Pick<
  DB,
  'tours' | 'places' | 'day_assignments' | 'tour_waypoints' | 'tour_sources' | 'days' | 'tour_obstacle_reviews'
>;

/** One day a tour of the trip sits on, in the order of the trip. */
export interface TourDayRow {
  place_id: number;
  day_id: number;
  day_number: number;
  date: string | null;
  title: string | null;
}

/**
 * Where one tour came from, as the provenance contract reads it: the facet's
 * own record (origin, the GPX file name, when it was saved, the wanderer
 * reference), the import's snapshot row when there is one, and the name of the
 * import a planned tour came from while that import is still in the trip.
 */
export interface TourProvenanceRow {
  origin: string;
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
        't.boat_type as boat_type',
        't.water_context as water_context',
        't.paddle_speed_kmh as paddle_speed_kmh',
        't.portage_speed_kmh as portage_speed_kmh',
        't.paddle_lake_style as paddle_lake_style',
        't.track_marks as track_marks',
        eb('t.recorded_route_geometry', 'is not', null).as('has_recorded_track'),
        eb
          .exists(eb.selectFrom('day_assignments as da').select('da.id').whereRef('da.place_id', '=', 'p.id'))
          .as('planned'),
        eb
          .exists(eb.selectFrom('tour_waypoints as tw').select('tw.id').whereRef('tw.place_id', '=', 'p.id'))
          .as('has_waypoints'),
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

  /** The days every tour of a trip sits on, each tour and day once, in day order. */
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
      ])
      .where('d.trip_id', '=', trip_id)
      .distinct()
      .orderBy('d.day_number', 'asc')
      .orderBy('da.place_id', 'asc')
      .execute();
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
      boat_type: input.boat_type ?? null,
      water_context: input.water_context ?? null,
      paddle_speed_kmh: input.paddle_speed_kmh ?? null,
      portage_speed_kmh: input.portage_speed_kmh ?? null,
      paddle_lake_style: input.paddle_lake_style ?? null,
      track_marks: input.track_marks ?? null,
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
      })
      .execute();
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
        boat_type: input.boat_type,
        water_context: input.water_context,
        paddle_speed_kmh: input.paddle_speed_kmh,
        portage_speed_kmh: input.portage_speed_kmh,
        paddle_lake_style: input.paddle_lake_style,
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

function toListRow<
  R extends Omit<TourListRow, 'planned' | 'has_waypoints' | 'has_recorded_track'> & {
    planned: unknown;
    has_waypoints: unknown;
    has_recorded_track: unknown;
  },
>(r: R): TourListRow {
  return {
    ...r,
    planned: Number(r.planned),
    has_waypoints: Number(r.has_waypoints),
    has_recorded_track: Number(r.has_recorded_track),
  };
}
