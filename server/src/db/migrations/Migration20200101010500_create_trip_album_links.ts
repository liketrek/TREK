import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 65 (`db/migrations.ts`).
 */
export class Migration20200101010500_create_trip_album_links extends Migration {
  override name = 'Migration20200101010500_create_trip_album_links';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS trip_album_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        immich_album_id TEXT NOT NULL,
        album_name TEXT NOT NULL DEFAULT '',
        sync_enabled INTEGER NOT NULL DEFAULT 1,
        last_synced_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(trip_id, user_id, immich_album_id)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_trip_album_links_trip ON trip_album_links(trip_id)`);
  }
}
