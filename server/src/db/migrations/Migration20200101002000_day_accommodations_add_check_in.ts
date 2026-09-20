import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 20 (`db/migrations.ts`).
 */
export class Migration20200101002000_day_accommodations_add_check_in extends Migration {
  override name = 'Migration20200101002000_day_accommodations_add_check_in';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'day_accommodations', 'check_in', `check_in TEXT`);

    await addColumnIfMissing(this, 'day_accommodations', 'check_out', `check_out TEXT`);

    await addColumnIfMissing(this, 'day_accommodations', 'confirmation', `confirmation TEXT`);
  }
}
