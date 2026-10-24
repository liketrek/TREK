import { columnNames, tableExists } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

const ALBUM_LINKS_DDL = `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  album_id TEXT NOT NULL,
  album_name TEXT NOT NULL DEFAULT '',
  sync_enabled INTEGER NOT NULL DEFAULT 1,
  last_synced_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trip_id, user_id, provider, album_id)
`;

/**
 * Legacy migration step 68 (`db/migrations.ts`).
 *
 * Normalize trip_album_links to the provider + album_id schema used by current
 * routes, reading whichever of the two historical shapes the database has.
 */
export class Migration20200101010800_create_trip_album_links extends Migration {
  override name = 'Migration20200101010800_create_trip_album_links';

  override async up(): Promise<void> {
    if (!(await tableExists(this, 'trip_album_links'))) {
      await this.execute(`CREATE TABLE trip_album_links (${ALBUM_LINKS_DDL})`);
      await this.execute(`CREATE INDEX IF NOT EXISTS idx_trip_album_links_trip ON trip_album_links(trip_id)`);
      return;
    }

    const names = await columnNames(this, 'trip_album_links');
    const albumIdSource = names.has('album_id') ? 'album_id' : names.has('immich_album_id') ? 'immich_album_id' : null;
    if (!albumIdSource) return;

    const providerExpr = names.has('provider')
      ? `CASE WHEN provider IS NULL OR provider = '' THEN 'immich' ELSE provider END`
      : `'immich'`;
    const albumNameExpr = names.has('album_name') ? `COALESCE(album_name, '')` : `''`;
    const syncEnabledExpr = names.has('sync_enabled') ? 'COALESCE(sync_enabled, 1)' : '1';
    const lastSyncedExpr = names.has('last_synced_at') ? 'last_synced_at' : 'NULL';
    const createdAtExpr = names.has('created_at') ? 'COALESCE(created_at, CURRENT_TIMESTAMP)' : 'CURRENT_TIMESTAMP';

    await this.execute(`CREATE TABLE trip_album_links_new (${ALBUM_LINKS_DDL})`);
    await this.execute(`
      INSERT OR IGNORE INTO trip_album_links_new (trip_id, user_id, provider, album_id, album_name, sync_enabled, last_synced_at, created_at)
      SELECT trip_id, user_id, ${providerExpr}, ${albumIdSource}, ${albumNameExpr}, ${syncEnabledExpr}, ${lastSyncedExpr}, ${createdAtExpr}
      FROM trip_album_links
      WHERE ${albumIdSource} IS NOT NULL AND TRIM(${albumIdSource}) != ''
    `);
    await this.execute(`DROP TABLE trip_album_links`);
    await this.execute(`ALTER TABLE trip_album_links_new RENAME TO trip_album_links`);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_trip_album_links_trip ON trip_album_links(trip_id)`);
  }
}
