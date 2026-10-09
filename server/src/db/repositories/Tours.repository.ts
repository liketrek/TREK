import type { AssertRowKeys } from './_shared/rows';
import type { Tours } from '../entities/Tours.entity';
import { TrekRepository } from './_shared/trek-repository';

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
  max_hiking_difficulty: number;
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
  max_hiking_difficulty: number;
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
  max_hiking_difficulty: number;
}

/** What a route edit replaces on an existing tour. */
export type TourUpdate = Omit<TourInsert, 'place_id' | 'planned_duration_minutes' | 'break_additional_minutes'> & {
  planned_duration_minutes?: number | null;
  break_additional_minutes?: number | null;
};

interface ToursKyselyDB {
  tours: TourRow;
  places: { id: number; trip_id: number; name: string; description: string | null; website: string | null };
  day_assignments: { id: number; day_id: number; place_id: number };
  tour_waypoints: { id: number; place_id: number };
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
        eb.exists(eb.selectFrom('day_assignments as da').select('da.id').whereRef('da.place_id', '=', 'p.id')).as('planned'),
        eb.exists(eb.selectFrom('tour_waypoints as tw').select('tw.id').whereRef('tw.place_id', '=', 'p.id')).as('has_waypoints'),
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

  /** TO3 — `SELECT 1 FROM tours WHERE place_id = ?`: whether the place is a tour. */
  async existsForPlace(place_id: number): Promise<boolean> {
    const row = await this.db().selectFrom('tours').select('place_id').where('place_id', '=', place_id).executeTakeFirst();
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
  async insertTour(input: TourInsert): Promise<void> {
    await this.insert({
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
    });
  }

  /**
   * TO8 — a copied tour keeps every column, `created_at` included, so the
   * copy lists its tours in the source's order.
   */
  async insertCopy(place_id: number, row: Omit<TourRow, 'place_id'>): Promise<void> {
    await this.db()
      .insertInto('tours')
      .values({ ...row, place_id })
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
        ...(input.planned_duration_minutes !== undefined ? { planned_duration_minutes: input.planned_duration_minutes } : {}),
        ...(input.break_additional_minutes !== undefined ? { break_additional_minutes: input.break_additional_minutes } : {}),
        match_confidence: input.match_confidence,
        max_hiking_difficulty: input.max_hiking_difficulty,
      })
      .where('place_id', '=', place_id)
      .where('place_id', 'in', (eb) => eb.selectFrom('places').select('id').where('trip_id', '=', trip_id))
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0) > 0;
  }
}

function toListRow<R extends Omit<TourListRow, 'planned' | 'has_waypoints'> & { planned: unknown; has_waypoints: unknown }>(r: R): TourListRow {
  return { ...r, planned: Number(r.planned), has_waypoints: Number(r.has_waypoints) };
}
