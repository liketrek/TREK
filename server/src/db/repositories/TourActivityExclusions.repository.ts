import type { TourActivityExclusions } from '../entities/TourActivityExclusions.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type ExclusionsDB = Pick<DB, 'tour_activity_exclusions'>;

/**
 * `tour_activity_exclusions` (STA-02): the tours a user left out of their own
 * activity sums. Personal: every statement names the user, so one person's
 * choice never reaches anyone else's sums. The caller checks that the user
 * can open the tour's trip before writing.
 */
export class TourActivityExclusionsRepository extends TrekRepository<TourActivityExclusions> {
  private db() {
    return this.kysely<ExclusionsDB>();
  }

  /** The tours the user left out, by place id. */
  async listPlaceIds(user_id: number): Promise<number[]> {
    const rows = await this.db()
      .selectFrom('tour_activity_exclusions')
      .select('place_id')
      .where('user_id', '=', user_id)
      .orderBy('place_id', 'asc')
      .execute();
    return rows.map((row) => row.place_id);
  }

  /** Leaves the tour out of the user's sums; a second call changes nothing. */
  async exclude(user_id: number, place_id: number): Promise<void> {
    await this.db()
      .insertInto('tour_activity_exclusions')
      .values({ user_id, place_id })
      .onConflict((oc) => oc.columns(['user_id', 'place_id']).doNothing())
      .execute();
  }

  /** Counts the tour again; nothing to do when it was not left out. */
  async include(user_id: number, place_id: number): Promise<void> {
    await this.db()
      .deleteFrom('tour_activity_exclusions')
      .where('user_id', '=', user_id)
      .where('place_id', '=', place_id)
      .execute();
  }
}
