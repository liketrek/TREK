import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 163 (`db/migrations.ts`).
 *
 * #1446: guests are per-trip people, but their display name lived in the globally
 * UNIQUE users.username, so a second "Jake" on another trip was auto-renamed to
 * "Jake 2". Add a non-unique display_name; new guests store the human name here and
 * get a uuid-based username that is never shown (the member views COALESCE to it).
 */
export class Migration20200101024300_1446_guests_are_per_trip_people_but extends Migration {
  override name = 'Migration20200101024300_1446_guests_are_per_trip_people_but';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'display_name', `display_name TEXT`);
  }
}
