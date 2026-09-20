import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 109 (`db/migrations.ts`).
 *
 * Migration 108: Disk cache metadata for remote-provider photo thumbnails (Immich / Synology)
 */
export class Migration20200101014900_disk_cache_metadata_for_remote_provider_photo extends Migration {
  override name = 'Migration20200101014900_disk_cache_metadata_for_remote_provider_photo';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS trek_photo_cache_meta (
        cache_key  TEXT    PRIMARY KEY,
        content_type TEXT  NOT NULL DEFAULT 'image/jpeg',
        fetched_at INTEGER NOT NULL
      )
    `);

    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_trek_photo_cache_meta_fetched_at ON trek_photo_cache_meta (fetched_at)`,
    );
  }
}
