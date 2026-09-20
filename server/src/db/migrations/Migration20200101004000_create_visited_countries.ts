import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 40 (`db/migrations.ts`).
 */
export class Migration20200101004000_create_visited_countries extends Migration {
  override name = 'Migration20200101004000_create_visited_countries';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS visited_countries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        country_code TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, country_code)
      )
    `);
  }
}
