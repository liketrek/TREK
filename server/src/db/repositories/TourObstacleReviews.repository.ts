import type { TourObstacleReviews, TTourObstacleReviewsDecision } from '../entities/TourObstacleReviews.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/** `decision` narrowed to the four values the column's CHECK constraint allows. */
type ReviewsDB = {
  tour_obstacle_reviews: Omit<DB['tour_obstacle_reviews'], 'decision'> & { decision: TTourObstacleReviewsDecision };
  places: DB['places'];
};

/** One stored decision, its snapshot still JSON text and its time the stored text. */
export interface TourObstacleReviewRow {
  place_id: number;
  obstacle_key: string;
  decision: TTourObstacleReviewsDecision;
  note: string | null;
  route_fingerprint: string;
  source_fingerprint: string;
  obstacle_snapshot: string;
  decided_at: string;
  decided_by: number | null;
}

export type TourObstacleReviewWrite = Omit<TourObstacleReviewRow, 'place_id'>;

const COLUMNS = [
  'r.place_id',
  'r.obstacle_key',
  'r.decision',
  'r.note',
  'r.route_fingerprint',
  'r.source_fingerprint',
  'r.obstacle_snapshot',
  'r.decided_at',
  'r.decided_by',
] as const;

/**
 * `tour_obstacle_reviews`: what the paddlers decided about the obstacles on a
 * tour (PAD-06), each bound to the route and the data it was decided on. A
 * decision goes with its tour; nothing here removes one the data no longer
 * holds.
 */
export class TourObstacleReviewsRepository extends TrekRepository<TourObstacleReviews> {
  private db() {
    return this.kysely<ReviewsDB>();
  }

  async listForPlace(place_id: number): Promise<TourObstacleReviewRow[]> {
    return await this.db()
      .selectFrom('tour_obstacle_reviews as r')
      .select(COLUMNS)
      .where('r.place_id', '=', place_id)
      .orderBy('r.obstacle_key', 'asc')
      .execute();
  }

  /** Every decision on the tours of one trip, for its tours list. */
  async listForTrip(trip_id: number): Promise<TourObstacleReviewRow[]> {
    return await this.db()
      .selectFrom('tour_obstacle_reviews as r')
      .innerJoin('places as p', 'p.id', 'r.place_id')
      .select(COLUMNS)
      .where('p.trip_id', '=', trip_id)
      .orderBy('r.place_id', 'asc')
      .orderBy('r.obstacle_key', 'asc')
      .execute();
  }

  /** Writes decisions, each replacing the one stored for its obstacle; the caller holds the transaction. */
  async writeMany(place_id: number, rows: readonly TourObstacleReviewWrite[]): Promise<void> {
    await this.db()
      .insertInto('tour_obstacle_reviews')
      .values(rows.map((row) => ({ ...row, place_id })))
      .onConflict((oc) =>
        oc.columns(['place_id', 'obstacle_key']).doUpdateSet((eb) => ({
          decision: eb.ref('excluded.decision'),
          note: eb.ref('excluded.note'),
          route_fingerprint: eb.ref('excluded.route_fingerprint'),
          source_fingerprint: eb.ref('excluded.source_fingerprint'),
          obstacle_snapshot: eb.ref('excluded.obstacle_snapshot'),
          decided_at: eb.ref('excluded.decided_at'),
          decided_by: eb.ref('excluded.decided_by'),
        })),
      )
      .execute();
  }

  /** Removes the decisions about the given obstacles; returns how many went. */
  async deleteKeys(place_id: number, keys: readonly string[]): Promise<number> {
    const result = await this.db()
      .deleteFrom('tour_obstacle_reviews')
      .where('place_id', '=', place_id)
      .where('obstacle_key', 'in', [...keys])
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0);
  }
}
