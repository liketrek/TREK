import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 44 (`db/migrations.ts`).
 */
export class Migration20200101004400_create_file_links extends Migration {
  override name = 'Migration20200101004400_create_file_links';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS file_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL REFERENCES trip_files(id) ON DELETE CASCADE,
        reservation_id INTEGER REFERENCES reservations(id) ON DELETE CASCADE,
        assignment_id INTEGER REFERENCES day_assignments(id) ON DELETE CASCADE,
        place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(file_id, reservation_id),
        UNIQUE(file_id, assignment_id),
        UNIQUE(file_id, place_id)
      )
    `);
  }
}
