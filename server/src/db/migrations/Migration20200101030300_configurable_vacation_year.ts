import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 183 (`db/migrations.ts`).
 *
 * Configurable vacation year (#737): per-user leave-year window. 'calendar' keeps
 * the Jan 1–Dec 31 default (unchanged for everyone); 'fiscal' starts on a fixed
 * month/day; 'anniversary' starts on the month/day of the hire date. The year
 * integer still names a period; the service resolves it to a [start,end) range.
 */
export class Migration20200101030300_configurable_vacation_year extends Migration {
  override name = 'Migration20200101030300_configurable_vacation_year';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS vacay_user_settings (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        year_type TEXT NOT NULL DEFAULT 'calendar',
        year_start_month INTEGER NOT NULL DEFAULT 1,
        year_start_day INTEGER NOT NULL DEFAULT 1,
        hire_date TEXT
      )
    `);
  }
}
