import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 41 (`db/migrations.ts`).
 */
export class Migration20200101004100_create_bucket_list extends Migration {
  override name = 'Migration20200101004100_create_bucket_list';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS bucket_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        lat REAL,
        lng REAL,
        country_code TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}
