import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 77 (`db/migrations.ts`).
 */
export class Migration20200101011700_create_visited_regions extends Migration {
  override name = 'Migration20200101011700_create_visited_regions';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS visited_regions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        region_code TEXT NOT NULL,
        region_name TEXT NOT NULL,
        country_code TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, region_code)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_visited_regions_country ON visited_regions(country_code)`);
  }
}
