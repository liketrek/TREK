import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 9 (`db/migrations.ts`).
 */
export class Migration20200101000900_trip_files_add_reservation_id extends Migration {
  override name = 'Migration20200101000900_trip_files_add_reservation_id';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'trip_files',
      'reservation_id',
      `reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL`,
    );
  }
}
