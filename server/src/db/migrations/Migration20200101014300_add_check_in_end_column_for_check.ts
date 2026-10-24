import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 103 (`db/migrations.ts`).
 *
 * Migration 102: Add check_in_end column for check-in time ranges
 */
export class Migration20200101014300_add_check_in_end_column_for_check extends Migration {
  override name = 'Migration20200101014300_add_check_in_end_column_for_check';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'day_accommodations', 'check_in_end', `check_in_end TEXT`);
  }
}
