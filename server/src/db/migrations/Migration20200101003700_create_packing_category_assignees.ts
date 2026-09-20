import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 37 (`db/migrations.ts`).
 */
export class Migration20200101003700_create_packing_category_assignees extends Migration {
  override name = 'Migration20200101003700_create_packing_category_assignees';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS packing_category_assignees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        category_name TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(trip_id, category_name, user_id)
      )
    `);
  }
}
