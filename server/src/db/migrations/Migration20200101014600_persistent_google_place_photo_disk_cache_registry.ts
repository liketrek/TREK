import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 106 (`db/migrations.ts`).
 *
 * Migration 105: Persistent Google place photo disk cache registry
 */
export class Migration20200101014600_persistent_google_place_photo_disk_cache_registry extends Migration {
  override name = 'Migration20200101014600_persistent_google_place_photo_disk_cache_registry';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS google_place_photo_meta (
        place_id   TEXT    PRIMARY KEY,
        attribution TEXT,
        fetched_at INTEGER NOT NULL,
        error_at   INTEGER
      )
    `);
  }
}
