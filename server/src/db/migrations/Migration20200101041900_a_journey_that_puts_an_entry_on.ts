import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 258 (`db/migrations.ts`).
 *
 * A journey that puts an entry on the map where its first photo was taken
 * (#1003). Off unless the owner turns it on: an entry somebody placed by hand is
 * never moved, but an entry left without a place on purpose should not grow one
 * either just because a picture was added.
 */
export class Migration20200101041900_a_journey_that_puts_an_entry_on extends Migration {
  override name = 'Migration20200101041900_a_journey_that_puts_an_entry_on';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'journeys', 'photo_location', `photo_location INTEGER NOT NULL DEFAULT 0`);
  }
}
