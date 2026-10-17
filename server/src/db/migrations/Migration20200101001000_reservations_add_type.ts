import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 10 (`db/migrations.ts`).
 */
export class Migration20200101001000_reservations_add_type extends Migration {
  override name = 'Migration20200101001000_reservations_add_type';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'reservations', 'type', `type TEXT DEFAULT 'other'`);
  }
}
