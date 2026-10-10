import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 33 (`db/migrations.ts`).
 */
export class Migration20200101003300_trip_files_add_uploaded_by extends Migration {
  override name = 'Migration20200101003300_trip_files_add_uploaded_by';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'trip_files',
      'uploaded_by',
      `uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL`,
    );

    await addColumnIfMissing(this, 'trip_files', 'starred', `starred INTEGER DEFAULT 0`);

    await addColumnIfMissing(this, 'trip_files', 'deleted_at', `deleted_at TEXT`);
  }
}
