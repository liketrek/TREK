import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 31 (`db/migrations.ts`).
 */
export class Migration20200101003100_reservations_add_reservation_end_time extends Migration {
  override name = 'Migration20200101003100_reservations_add_reservation_end_time';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'reservations', 'reservation_end_time', `reservation_end_time TEXT`);
  }
}
