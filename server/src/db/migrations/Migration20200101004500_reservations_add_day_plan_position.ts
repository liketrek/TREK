import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 45 (`db/migrations.ts`).
 */
export class Migration20200101004500_reservations_add_day_plan_position extends Migration {
  override name = 'Migration20200101004500_reservations_add_day_plan_position';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'reservations', 'day_plan_position', `day_plan_position REAL DEFAULT NULL`);
  }
}
