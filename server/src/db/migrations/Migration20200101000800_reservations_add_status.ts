import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 8 (`db/migrations.ts`).
 */
export class Migration20200101000800_reservations_add_status extends Migration {
  override name = 'Migration20200101000800_reservations_add_status';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'reservations', 'status', `status TEXT DEFAULT 'pending'`);
  }
}
