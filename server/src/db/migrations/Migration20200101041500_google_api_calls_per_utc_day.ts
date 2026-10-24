import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 254 (`db/migrations.ts`).
 *
 * Google API calls per UTC day (#1582), so the admin's daily ceiling has
 * something to count against. One row a day, nothing about who searched.
 */
export class Migration20200101041500_google_api_calls_per_utc_day extends Migration {
  override name = 'Migration20200101041500_google_api_calls_per_utc_day';

  override async up(): Promise<void> {
    await this.execute(
      `CREATE TABLE IF NOT EXISTS google_api_usage (day TEXT PRIMARY KEY, calls INTEGER NOT NULL DEFAULT 0)`,
    );
  }
}
