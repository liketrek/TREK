import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 42 (`db/migrations.ts`).
 */
export class Migration20200101004200_vacay_plans_add_weekend_days extends Migration {
  override name = 'Migration20200101004200_vacay_plans_add_weekend_days';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'vacay_plans', 'weekend_days', `weekend_days TEXT DEFAULT '0,6'`);
  }
}
