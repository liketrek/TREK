import { addColumnIfMissing, execBestEffort } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 26 (`db/migrations.ts`).
 */
export class Migration20200101002600_day_assignments_add_assignment_time extends Migration {
  override name = 'Migration20200101002600_day_assignments_add_assignment_time';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'day_assignments', 'assignment_time', `assignment_time TEXT`);

    await addColumnIfMissing(this, 'day_assignments', 'assignment_end_time', `assignment_end_time TEXT`);

    await execBestEffort(
      this,
      `
      UPDATE day_assignments SET
      assignment_time = (SELECT place_time FROM places WHERE places.id = day_assignments.place_id),
      assignment_end_time = (SELECT end_time FROM places WHERE places.id = day_assignments.place_id)
    `,
    );
  }
}
