import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 30 (`db/migrations.ts`).
 */
export class Migration20200101003000_trip_files_add_note_id extends Migration {
  override name = 'Migration20200101003000_trip_files_add_note_id';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'trip_files',
      'note_id',
      `note_id INTEGER REFERENCES collab_notes(id) ON DELETE SET NULL`,
    );

    await addColumnIfMissing(this, 'collab_notes', 'website', `website TEXT`);
  }
}
