import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 23 (`db/migrations.ts`).
 */
export class Migration20200101002300_reservations_add_assignment_id extends Migration {
  override name = 'Migration20200101002300_reservations_add_assignment_id';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'reservations',
      'assignment_id',
      `assignment_id INTEGER REFERENCES day_assignments(id) ON DELETE SET NULL`,
    );
  }
}
