import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 205 (`db/migrations.ts`).
 *
 * A journal entry that is not a stop (discussion #2064).
 * Studio draws its route and prints its distance from every entry that
 * carries coordinates, and that is right until the journal starts at the
 * home airport: the night before the flight, the stopover, the place the
 * trip was planned from all become stops, and the distance counts the legs
 * to and from them. The traveller knows which of those are the journey and
 * which are the way there, so the switch sits on the entry. The entry stays
 * in the journal; it is only left out of the arithmetic.
 * DEFAULT 0: every existing entry keeps counting, which is what it did.
 * Appended LAST: the array is index-addressed against schema_version.
 */
export class Migration20200101032500_a_journal_entry_that_is_not_a extends Migration {
  override name = 'Migration20200101032500_a_journal_entry_that_is_not_a';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'journey_entries', 'stats_excluded', `stats_excluded INTEGER NOT NULL DEFAULT 0`);
  }
}
