import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 231 (`db/migrations.ts`).
 *
 * A suggestion the traveller has waved away.
 * Skeletons are real rows, and the trip sync decides what to create by asking
 * which source places already have one. Deleting a dismissed suggestion would
 * therefore bring it straight back on the next sync. So it stays, marked, and
 * drops out of every read instead — which also leaves a way back.
 * Appended LAST: the array is index-addressed against schema_version.
 */
export class Migration20200101035100_a_suggestion_the_traveller_has_waved_away extends Migration {
  override name = 'Migration20200101035100_a_suggestion_the_traveller_has_waved_away';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'journey_entries', 'dismissed', `dismissed INTEGER NOT NULL DEFAULT 0`);
  }
}
