import { columnNames, tableExists } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

const TRIP_PHOTOS_DDL = `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'immich',
  shared INTEGER NOT NULL DEFAULT 1,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trip_id, user_id, asset_id, provider)
`;

/**
 * Legacy migration step 67 (`db/migrations.ts`).
 *
 * Normalize trip_photos to the provider-based schema used by current routes.
 * The table arrived in two shapes — Immich-only (`immich_asset_id`) and the
 * provider-aware one — so the rebuild reads whichever columns are actually
 * present and fills the rest with the Immich defaults.
 */
export class Migration20200101010700_create_trip_photos extends Migration {
  override name = 'Migration20200101010700_create_trip_photos';

  override async up(): Promise<void> {
    if (!(await tableExists(this, 'trip_photos'))) {
      await this.execute(`CREATE TABLE trip_photos (${TRIP_PHOTOS_DDL})`);
      await this.execute(`CREATE INDEX IF NOT EXISTS idx_trip_photos_trip ON trip_photos(trip_id)`);
      return;
    }

    const names = await columnNames(this, 'trip_photos');
    const assetSource = names.has('asset_id') ? 'asset_id' : names.has('immich_asset_id') ? 'immich_asset_id' : null;
    if (!assetSource) return;

    const providerExpr = names.has('provider')
      ? `CASE WHEN provider IS NULL OR provider = '' THEN 'immich' ELSE provider END`
      : `'immich'`;
    const sharedExpr = names.has('shared') ? 'COALESCE(shared, 1)' : '1';
    const addedAtExpr = names.has('added_at') ? 'COALESCE(added_at, CURRENT_TIMESTAMP)' : 'CURRENT_TIMESTAMP';

    await this.execute(`CREATE TABLE trip_photos_new (${TRIP_PHOTOS_DDL})`);
    await this.execute(`
      INSERT OR IGNORE INTO trip_photos_new (trip_id, user_id, asset_id, provider, shared, added_at)
      SELECT trip_id, user_id, ${assetSource}, ${providerExpr}, ${sharedExpr}, ${addedAtExpr}
      FROM trip_photos
      WHERE ${assetSource} IS NOT NULL AND TRIM(${assetSource}) != ''
    `);
    await this.execute(`DROP TABLE trip_photos`);
    await this.execute(`ALTER TABLE trip_photos_new RENAME TO trip_photos`);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_trip_photos_trip ON trip_photos(trip_id)`);
  }
}
