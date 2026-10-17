import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 216 (`db/migrations.ts`).
 */
export class Migration20200101033600_create_school_holiday_countries extends Migration {
  override name = 'Migration20200101033600_create_school_holiday_countries';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS school_holiday_countries (
        code TEXT PRIMARY KEY, name TEXT NOT NULL
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS school_holiday_regions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country TEXT NOT NULL REFERENCES school_holiday_countries(code),
        name TEXT NOT NULL COLLATE NOCASE, revision INTEGER NOT NULL DEFAULT 1,
        UNIQUE(country, name)
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS school_holiday_periods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        region_id INTEGER NOT NULL REFERENCES school_holiday_regions(id) ON DELETE CASCADE,
        name TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL,
        CHECK (end_date >= start_date)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_school_holiday_periods_region ON school_holiday_periods(region_id)`);
  }
}
