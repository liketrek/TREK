import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 96 (`db/migrations.ts`).
 *
 * Migration 90: Pros/Cons for journey entries
 */
export class Migration20200101013600_pros_cons_for_journey_entries extends Migration {
  override name = 'Migration20200101013600_pros_cons_for_journey_entries';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'journey_entries', 'pros_cons', `pros_cons TEXT`);
  }
}
