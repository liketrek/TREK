import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 74 (`db/migrations.ts`).
 *
 * Migration 68: Todo items
 */
export class Migration20200101011400_todo_items extends Migration {
  override name = 'Migration20200101011400_todo_items';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS todo_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        checked INTEGER DEFAULT 0,
        category TEXT,
        sort_order INTEGER DEFAULT 0,
        due_date TEXT,
        description TEXT,
        assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        priority INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_todo_items_trip_id ON todo_items(trip_id)`);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS todo_category_assignees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        category_name TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(trip_id, category_name, user_id)
      )
    `);
  }
}
