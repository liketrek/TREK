import { currentTimestampKysely } from '../dialect/kysely-functions';
import type { TourDrafts } from '../entities/TourDrafts.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type DraftsDB = Pick<DB, 'tour_drafts'>;

/** A user's draft of the Tours planner in one trip, as it was last written. */
interface TourDraftRow {
  payload: string;
  updated_at: string;
}

/**
 * `tour_drafts`: the Tours planner's unsaved draft, one per user and trip.
 * Personal: every statement names the user, so nobody reads or replaces
 * another traveller's draft. The payload is the planner's own text, stored
 * and handed back whole; the caller checks that the user can open the trip.
 */
export class TourDraftsRepository extends TrekRepository<TourDrafts> {
  private db() {
    return this.kysely<DraftsDB>();
  }

  /** The user's draft in the trip; undefined while there is none. */
  async findFor(trip_id: number, user_id: number): Promise<TourDraftRow | undefined> {
    return await this.db()
      .selectFrom('tour_drafts')
      .select(['payload', 'updated_at'])
      .where('trip_id', '=', trip_id)
      .where('user_id', '=', user_id)
      .executeTakeFirst();
  }

  /** Keeps the draft, replacing the one before it; answers it as stored, with its time. */
  async put(trip_id: number, user_id: number, payload: string): Promise<TourDraftRow> {
    const platform = this.getEntityManager().getPlatform();
    return await this.db()
      .insertInto('tour_drafts')
      .values({ trip_id, user_id, payload })
      .onConflict((oc) =>
        oc.columns(['trip_id', 'user_id']).doUpdateSet((eb) => ({
          payload: eb.ref('excluded.payload'),
          // The clock in the spelling of the live database: CURRENT_TIMESTAMP is no function call.
          updated_at: currentTimestampKysely(platform),
        })),
      )
      .returning(['payload', 'updated_at'])
      .executeTakeFirstOrThrow();
  }

  /** Forgets the user's draft in the trip; false when there was none. */
  async remove(trip_id: number, user_id: number): Promise<boolean> {
    const result = await this.db()
      .deleteFrom('tour_drafts')
      .where('trip_id', '=', trip_id)
      .where('user_id', '=', user_id)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
