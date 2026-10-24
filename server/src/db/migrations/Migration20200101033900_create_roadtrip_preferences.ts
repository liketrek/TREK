import { Migration } from '@mikro-orm/migrations';
import { ROADTRIP_PREFERENCE_KEYS } from '@trek/shared';

/**
 * Legacy migration step 219 (`db/migrations.ts`).
 *
 * Per-trip road-trip preferences, seeded from whatever the trip owner had set
 * globally so an existing trip keeps behaving the way it did.
 */
export class Migration20200101033900_create_roadtrip_preferences extends Migration {
  override name = 'Migration20200101033900_create_roadtrip_preferences';

  override async up(): Promise<void> {
    await this.execute(
      `CREATE TABLE IF NOT EXISTS roadtrip_preferences (trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE, key TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (trip_id, key))`,
    );
    for (const key of ROADTRIP_PREFERENCE_KEYS) {
      await this.execute(
        `INSERT OR IGNORE INTO roadtrip_preferences (trip_id, key, value) SELECT t.id, s.key, s.value FROM trips t JOIN settings s ON s.user_id = t.user_id WHERE s.key = ? AND s.value IS NOT NULL`,
        [key],
      );
    }
  }
}
