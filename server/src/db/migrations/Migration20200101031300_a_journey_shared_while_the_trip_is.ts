import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 193 (`db/migrations.ts`).
 *
 * A journey shared while the trip is still running reads like a blog, and a
 * blog puts the newest entry first (#1614). The owner decides per share link,
 * because it is a property of how the link is meant to be read, not of the
 * journey. Off by default: an already-published link must not reorder itself
 * under its readers.
 */
export class Migration20200101031300_a_journey_shared_while_the_trip_is extends Migration {
  override name = 'Migration20200101031300_a_journey_shared_while_the_trip_is';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'journey_share_tokens', 'newest_first', `newest_first INTEGER NOT NULL DEFAULT 0`);
  }
}
