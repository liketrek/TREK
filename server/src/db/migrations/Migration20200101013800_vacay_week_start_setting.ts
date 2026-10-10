import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 98 (`db/migrations.ts`).
 *
 * Migration: Vacay week_start setting (0=Sunday, 1=Monday default)
 */
export class Migration20200101013800_vacay_week_start_setting extends Migration {
  override name = 'Migration20200101013800_vacay_week_start_setting';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'vacay_plans', 'week_start', `week_start INTEGER NOT NULL DEFAULT 1`);
  }
}
