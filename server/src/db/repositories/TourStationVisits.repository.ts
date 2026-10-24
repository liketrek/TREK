import { currentTimestampKysely } from '../dialect/kysely-functions';
import type { TourStationVisits, TTourStationVisitsStatus } from '../entities/TourStationVisits.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/** `status` narrowed to the two values the column's CHECK constraint allows. */
type VisitsDB = {
  tour_station_visits: Omit<DB['tour_station_visits'], 'status'> & { status: TTourStationVisitsStatus };
  day_assignments: DB['day_assignments'];
  days: DB['days'];
};

/** One station of a city walk visited or skipped on one of its days. */
export interface TourStationVisitRow {
  assignment_id: number;
  station_key: string;
  status: TTourStationVisitsStatus;
}

/**
 * `tour_station_visits` (CW-03): how far a city walk got on a day, per day
 * assignment and station key. A station without a row is still planned; a
 * visit goes with its assignment.
 */
export class TourStationVisitsRepository extends TrekRepository<TourStationVisits> {
  private db() {
    return this.kysely<VisitsDB>();
  }

  /** A day assignment of this trip: the place it puts on which day; undefined for one of another trip or none. */
  async assignmentInTrip(
    assignment_id: number,
    trip_id: number,
  ): Promise<{ place_id: number; day_id: number } | undefined> {
    return await this.db()
      .selectFrom('day_assignments as da')
      .innerJoin('days as d', 'd.id', 'da.day_id')
      .select(['da.place_id', 'da.day_id'])
      .where('da.id', '=', assignment_id)
      .where('d.trip_id', '=', trip_id)
      .executeTakeFirst();
  }

  /**
   * The assignment that puts this place on this day of this trip; undefined where there is none.
   * A walk put on one day twice answers its first assignment, the one with the lowest id.
   */
  async assignmentOnDay(trip_id: number, place_id: number, day_id: number): Promise<number | undefined> {
    const row = await this.db()
      .selectFrom('day_assignments as da')
      .innerJoin('days as d', 'd.id', 'da.day_id')
      .select('da.id')
      .where('da.place_id', '=', place_id)
      .where('da.day_id', '=', day_id)
      .where('d.trip_id', '=', trip_id)
      .orderBy('da.id', 'asc')
      .executeTakeFirst();
    return row?.id;
  }

  /** Every visit on the days of one trip, for its day plan. */
  async listForTrip(trip_id: number): Promise<TourStationVisitRow[]> {
    return await this.db()
      .selectFrom('tour_station_visits as v')
      .innerJoin('day_assignments as da', 'da.id', 'v.assignment_id')
      .innerJoin('days as d', 'd.id', 'da.day_id')
      .select(['v.assignment_id', 'v.station_key', 'v.status'])
      .where('d.trip_id', '=', trip_id)
      .orderBy('v.assignment_id', 'asc')
      .orderBy('v.station_key', 'asc')
      .execute();
  }

  /**
   * MCP-T02: every visit of one walk of this trip, on every day it is on, with
   * the day; a proposed change keeps each of these stations as it is. Ordered
   * by day and key; none of another trip.
   */
  async listForPlace(trip_id: number, place_id: number): Promise<Array<{ day_id: number } & TourStationVisitRow>> {
    return await this.db()
      .selectFrom('tour_station_visits as v')
      .innerJoin('day_assignments as da', 'da.id', 'v.assignment_id')
      .innerJoin('days as d', 'd.id', 'da.day_id')
      .select(['da.day_id', 'v.assignment_id', 'v.station_key', 'v.status'])
      .where('da.place_id', '=', place_id)
      .where('d.trip_id', '=', trip_id)
      .orderBy('da.day_id', 'asc')
      .orderBy('v.station_key', 'asc')
      .execute();
  }

  /** The visits of one day assignment. */
  async listForAssignment(assignment_id: number): Promise<TourStationVisitRow[]> {
    return await this.db()
      .selectFrom('tour_station_visits as v')
      .select(['v.assignment_id', 'v.station_key', 'v.status'])
      .where('v.assignment_id', '=', assignment_id)
      .orderBy('v.station_key', 'asc')
      .execute();
  }

  /** Marks a station visited or skipped on that day, replacing what it was. */
  async set(assignment_id: number, station_key: string, status: TTourStationVisitsStatus): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.db()
      .insertInto('tour_station_visits')
      .values({ assignment_id, station_key, status })
      .onConflict((oc) =>
        oc.columns(['assignment_id', 'station_key']).doUpdateSet((eb) => ({
          status: eb.ref('excluded.status'),
          // The clock in the spelling of the live database: CURRENT_TIMESTAMP is no function call.
          updated_at: currentTimestampKysely(platform),
        })),
      )
      .execute();
  }

  /** Takes a station back to planned on that day. */
  async clear(assignment_id: number, station_key: string): Promise<void> {
    await this.db()
      .deleteFrom('tour_station_visits')
      .where('assignment_id', '=', assignment_id)
      .where('station_key', '=', station_key)
      .execute();
  }

  /**
   * Drops the visits of stations a walk no longer has, on every day it is on;
   * answers the day assignments that lost one, each once.
   */
  async dropStationsNotIn(place_id: number, keep: readonly string[]): Promise<number[]> {
    const assignments = this.db().selectFrom('day_assignments').select('id').where('place_id', '=', place_id);
    let query = this.db().deleteFrom('tour_station_visits').where('assignment_id', 'in', assignments);
    if (keep.length > 0) query = query.where('station_key', 'not in', [...keep]);
    const dropped = await query.returning('assignment_id').execute();
    return [...new Set(dropped.map((row) => row.assignment_id))].sort((a, b) => a - b);
  }
}
