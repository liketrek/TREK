import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 232 (`db/migrations.ts`).
 *
 * The country an entry happened in, resolved once from its coordinates.
 * For the flag on the timeline card. Resolved on write rather than on read
 * because the answer never changes and the polygon test should not run on
 * every render of every entry.
 */
export class Migration20200101035200_the_country_an_entry_happened_in_resolved extends Migration {
  override name = 'Migration20200101035200_the_country_an_entry_happened_in_resolved';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'journey_entries', 'country_code', `country_code TEXT`);
  }
}
