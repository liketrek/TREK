import type { TourWaypoints } from '../entities/TourWaypoints.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/** One saved routing control point of a tour, in route order. */
export interface TourWaypointRow {
  lat: number;
  lng: number;
  role: 'start' | 'via' | 'end';
  sequence: number;
}

/** {@link TourWaypointRow} plus the tour it belongs to, as the trip copy reads it. */
export interface TourWaypointWithPlaceRow extends TourWaypointRow {
  place_id: number;
}

/** `role` narrowed to the three values the column's CHECK constraint allows. */
type TourWaypointsKyselyDB = Pick<DB, 'places'> & {
  tour_waypoints: Omit<DB['tour_waypoints'], 'role'> & { role: TourWaypointRow['role'] };
};

/**
 * `tour_waypoints` — the start, via and end points the route editor saved
 * for a tour, so reopening it restores the controls rather than only the
 * derived line. Rows hang off `tours(place_id)` and go with the tour.
 */
export class TourWaypointsRepository extends TrekRepository<TourWaypoints> {
  private db() {
    return this.kysely<TourWaypointsKyselyDB>();
  }

  /** TW1 — `SELECT lat, lng, role, sequence FROM tour_waypoints WHERE place_id = ? ORDER BY sequence`. */
  async listForPlace(place_id: number): Promise<TourWaypointRow[]> {
    return await this.db()
      .selectFrom('tour_waypoints')
      .select(['lat', 'lng', 'role', 'sequence'])
      .where('place_id', '=', place_id)
      .orderBy('sequence', 'asc')
      .execute();
  }

  /** TW2 — every waypoint of a trip's tours, for the trip copy to remap by place. */
  async listForTrip(trip_id: number): Promise<TourWaypointWithPlaceRow[]> {
    return await this.db()
      .selectFrom('tour_waypoints as tw')
      .innerJoin('places as p', 'p.id', 'tw.place_id')
      .select(['tw.place_id', 'tw.lat', 'tw.lng', 'tw.role', 'tw.sequence'])
      .where('p.trip_id', '=', trip_id)
      .orderBy('tw.place_id', 'asc')
      .orderBy('tw.sequence', 'asc')
      .execute();
  }

  /**
   * TW3 — `INSERT INTO tour_waypoints (place_id, lat, lng, role, sequence)
   * VALUES (...)` for each point. The caller owns the transaction: a create
   * writes the tour first, an edit clears the old points first.
   */
  async insertForPlace(place_id: number, waypoints: readonly TourWaypointRow[]): Promise<void> {
    if (waypoints.length === 0) return;
    await this.insertMany(
      waypoints.map((w) => ({ place: place_id, lat: w.lat, lng: w.lng, role: w.role, sequence: w.sequence })),
    );
  }

  /** TW4 — `DELETE FROM tour_waypoints WHERE place_id = ?`. */
  async deleteForPlace(place_id: number): Promise<void> {
    await this.nativeDelete({ place: place_id });
  }
}
