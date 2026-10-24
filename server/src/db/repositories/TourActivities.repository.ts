import type { TourActivities } from '../entities/TourActivities.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type ActivitiesDB = Pick<
  DB,
  'tour_activities' | 'tours' | 'places' | 'day_assignments' | 'days' | 'trips' | 'assignment_participants'
>;

/** One assignment of a recording to a tour, as the trip's tour list names it. */
export interface TourActivityRefRow {
  id: number;
  place_id: number;
  track_place_id: number;
  assignment_id: number | null;
}

/**
 * One assignment with what the detail shows of its recording: the name and
 * provenance it has in the trip, its line (the place's, or the line it kept
 * when it was planned over since), and the times the import read off it.
 */
export interface TourActivityRow extends TourActivityRefRow {
  day_id: number | null;
  assigned_at: string;
  track_name: string;
  track_origin: string;
  track_file_name: string | null;
  track_created_at: string | null;
  track_route_geometry: string | null;
  track_recorded_route_geometry: string | null;
  track_started_at: string | null;
  track_ended_at: string | null;
}

/**
 * STA-02: one tour of a trip the user can open, once per day assignment it has
 * (once with `assignment_id` NULL when it is on no day), with what the activity
 * sums need: its plan's measures, the import it was planned from, the day's
 * date, and who the execution names as taking part (`participant_count`, and
 * `joined` 1 when the user is one of them).
 */
export interface TourStatsExecutionRow {
  place_id: number;
  name: string;
  tour_type: string;
  distance: number | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  derived_from_place_id: number | null;
  trip_id: number;
  trip_title: string;
  assignment_id: number | null;
  date: string | null;
  /** MDT-02: the stage of a multi-day tour the day holds, by the key of its first stop; null for the whole tour. */
  tour_stage_key: string | null;
  participant_count: number;
  joined: number;
}

/** STA-02: a recording assigned to a tour, with the line its values are read from. */
export interface TourStatsTrackRow {
  place_id: number;
  track_place_id: number;
  assignment_id: number | null;
  track_name: string;
  track_route_geometry: string | null;
  track_recorded_route_geometry: string | null;
}

/** What an assignment writes: the tour, its recording, the execution and who confirmed it. */
interface TourActivityInsert {
  place_id: number;
  track_place_id: number;
  assignment_id: number | null;
  assigned_by: number | null;
}

/**
 * `tour_activities` (ACT-01): the recordings assigned to the tours of a trip.
 * Every read here is scoped to one trip through both tours' places, so a row
 * never reaches across trips even if an id does. Kysely throughout: the reads
 * join the tours and places of both sides.
 */
export class TourActivitiesRepository extends TrekRepository<TourActivities> {
  private db() {
    return this.kysely<ActivitiesDB>();
  }

  /** The assignments of one tour of the trip, with their recordings, oldest first. */
  async listForPlace(trip_id: number, place_id: number): Promise<TourActivityRow[]> {
    return await this.db()
      .selectFrom('tour_activities as a')
      .innerJoin('places as p', 'p.id', 'a.place_id')
      .innerJoin('places as tp', 'tp.id', 'a.track_place_id')
      .innerJoin('tours as tt', 'tt.place_id', 'a.track_place_id')
      .leftJoin('day_assignments as da', 'da.id', 'a.assignment_id')
      .select([
        'a.id as id',
        'a.place_id as place_id',
        'a.track_place_id as track_place_id',
        'a.assignment_id as assignment_id',
        'da.day_id as day_id',
        'a.assigned_at as assigned_at',
        'tp.name as track_name',
        'tt.origin as track_origin',
        'tt.origin_file_name as track_file_name',
        'tt.created_at as track_created_at',
        'tp.route_geometry as track_route_geometry',
        'tt.recorded_route_geometry as track_recorded_route_geometry',
        'tt.track_started_at as track_started_at',
        'tt.track_ended_at as track_ended_at',
      ])
      .where('a.place_id', '=', place_id)
      .where('p.trip_id', '=', trip_id)
      .where('tp.trip_id', '=', trip_id)
      .orderBy('a.id', 'asc')
      .execute();
  }

  /** Every assignment between tours of the trip, for its tour list. */
  async listForTrip(trip_id: number): Promise<TourActivityRefRow[]> {
    return await this.db()
      .selectFrom('tour_activities as a')
      .innerJoin('places as p', 'p.id', 'a.place_id')
      .select(['a.id', 'a.place_id', 'a.track_place_id', 'a.assignment_id'])
      .where('p.trip_id', '=', trip_id)
      .orderBy('a.id', 'asc')
      .execute();
  }

  /** The assignment a recording is part of, whichever tour it documents; undefined while it documents none. */
  async findByTrack(track_place_id: number): Promise<TourActivityRefRow | undefined> {
    return await this.db()
      .selectFrom('tour_activities')
      .select(['id', 'place_id', 'track_place_id', 'assignment_id'])
      .where('track_place_id', '=', track_place_id)
      .executeTakeFirst();
  }

  /** Whether a tour has any recording assigned to it. */
  async hasActivities(place_id: number): Promise<boolean> {
    const row = await this.db()
      .selectFrom('tour_activities')
      .select('id')
      .where('place_id', '=', place_id)
      .executeTakeFirst();
    return !!row;
  }

  /**
   * Clears the way for a new assignment of `track_place_id` to this execution
   * of the tour: the recordings the execution had (a day has one; "no day" can
   * have several once the days they were on are gone), and the execution this
   * recording had on the same tour. Inside the caller's transaction, before
   * {@link insertActivity}.
   */
  async clearFor(place_id: number, track_place_id: number, assignment_id: number | null): Promise<void> {
    await this.db()
      .deleteFrom('tour_activities')
      .where('place_id', '=', place_id)
      .where((eb) =>
        eb.or([
          assignment_id === null ? eb('assignment_id', 'is', null) : eb('assignment_id', '=', assignment_id),
          eb('track_place_id', '=', track_place_id),
        ]),
      )
      .execute();
  }

  /**
   * STA-02: every tour of the given trips with each of its day assignments, for
   * the user's activity sums. The day is read only when it is a day of the
   * tour's own trip. Never a trip outside `trip_ids`, which the caller resolved
   * from the user's own access.
   */
  async listExecutionsForStats(trip_ids: readonly number[], user_id: number): Promise<TourStatsExecutionRow[]> {
    if (trip_ids.length === 0) return [];
    const rows = await this.db()
      .selectFrom('tours as t')
      .innerJoin('places as p', 'p.id', 't.place_id')
      .innerJoin('trips as tr', 'tr.id', 'p.trip_id')
      .leftJoin('day_assignments as da', 'da.place_id', 'p.id')
      .leftJoin('days as d', (join) => join.onRef('d.id', '=', 'da.day_id').onRef('d.trip_id', '=', 'p.trip_id'))
      .select((eb) => [
        'p.id as place_id',
        'p.name as name',
        't.tour_type as tour_type',
        't.distance as distance',
        't.elevation_gain as elevation_gain',
        't.elevation_loss as elevation_loss',
        't.derived_from_place_id as derived_from_place_id',
        'tr.id as trip_id',
        'tr.title as trip_title',
        'da.id as assignment_id',
        'd.date as date',
        'da.tour_stage_key as tour_stage_key',
        eb
          .selectFrom('assignment_participants as ap')
          .select(eb.fn.countAll<number>().as('n'))
          .whereRef('ap.assignment_id', '=', 'da.id')
          .as('participant_count'),
        eb
          .exists(
            eb
              .selectFrom('assignment_participants as me')
              .select('me.id')
              .whereRef('me.assignment_id', '=', 'da.id')
              .where('me.user_id', '=', user_id),
          )
          .as('joined'),
      ])
      .where('p.trip_id', 'in', [...trip_ids])
      .orderBy('p.id', 'asc')
      .orderBy('da.id', 'asc')
      .execute();
    return rows.map((row) => ({
      ...row,
      participant_count: Number(row.participant_count ?? 0),
      joined: Number(row.joined),
    }));
  }

  /** STA-02: the recordings assigned to tours of the given trips, each with its line, both tours in the same trip. */
  async listTracksForStats(trip_ids: readonly number[]): Promise<TourStatsTrackRow[]> {
    if (trip_ids.length === 0) return [];
    return await this.db()
      .selectFrom('tour_activities as a')
      .innerJoin('places as p', 'p.id', 'a.place_id')
      .innerJoin('places as tp', 'tp.id', 'a.track_place_id')
      .innerJoin('tours as tt', 'tt.place_id', 'a.track_place_id')
      .select([
        'a.place_id as place_id',
        'a.track_place_id as track_place_id',
        'a.assignment_id as assignment_id',
        'tp.name as track_name',
        'tp.route_geometry as track_route_geometry',
        'tt.recorded_route_geometry as track_recorded_route_geometry',
      ])
      .where('p.trip_id', 'in', [...trip_ids])
      .whereRef('tp.trip_id', '=', 'p.trip_id')
      .orderBy('a.id', 'asc')
      .execute();
  }

  /** Writes one assignment and answers its id. */
  async insertActivity(input: TourActivityInsert): Promise<number> {
    const row = await this.db().insertInto('tour_activities').values(input).returning('id').executeTakeFirstOrThrow();
    return row.id;
  }

  /** Removes one assignment of this tour; answers whether there was one. */
  async removeFromPlace(place_id: number, id: number): Promise<boolean> {
    const result = await this.db()
      .deleteFrom('tour_activities')
      .where('id', '=', id)
      .where('place_id', '=', place_id)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
