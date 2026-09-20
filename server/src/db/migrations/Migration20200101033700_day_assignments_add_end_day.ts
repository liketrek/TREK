import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 217 (`db/migrations.ts`).
 */
export class Migration20200101033700_day_assignments_add_end_day extends Migration {
  override name = 'Migration20200101033700_day_assignments_add_end_day';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'day_assignments', 'end_day', `end_day INTEGER NOT NULL DEFAULT 0`);
  }
}
