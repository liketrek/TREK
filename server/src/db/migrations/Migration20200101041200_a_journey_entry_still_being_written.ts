import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 251 (`db/migrations.ts`).
 *
 * A journey entry still being written (#696): contributors see it, the public
 * share page does not. Its own flag, since `visibility` defaults to 'private' on
 * every entry and filtering on it would empty every shared journey.
 */
export class Migration20200101041200_a_journey_entry_still_being_written extends Migration {
  override name = 'Migration20200101041200_a_journey_entry_still_being_written';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'journey_entries', 'is_draft', `is_draft INTEGER NOT NULL DEFAULT 0`);
  }
}
