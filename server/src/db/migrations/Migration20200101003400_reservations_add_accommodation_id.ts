import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 34 (`db/migrations.ts`).
 */
export class Migration20200101003400_reservations_add_accommodation_id extends Migration {
  override name = 'Migration20200101003400_reservations_add_accommodation_id';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'reservations',
      'accommodation_id',
      `accommodation_id INTEGER REFERENCES day_accommodations(id) ON DELETE SET NULL`,
    );

    await addColumnIfMissing(this, 'reservations', 'metadata', `metadata TEXT`);
  }
}
