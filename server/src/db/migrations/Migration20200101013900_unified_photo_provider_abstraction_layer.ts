import { columnNames, tableExists } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

const TRIP_PHOTOS_NEW = `
  CREATE TABLE trip_photos_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_id INTEGER NOT NULL REFERENCES trek_photos(id) ON DELETE CASCADE,
    shared INTEGER NOT NULL DEFAULT 1,
    album_link_id INTEGER REFERENCES trip_album_links(id) ON DELETE SET NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(trip_id, user_id, photo_id)
  )
`;

/**
 * Legacy migration step 99 (`db/migrations.ts`).
 *
 * Unified Photo Provider Abstraction Layer (#584). A central `trek_photos`
 * registry; `trip_photos` and `journey_photos` stop carrying provider details
 * and reference it by `photo_id` instead.
 *
 * `trip_photos` arrived in several shapes over the releases, so the copy reads
 * whichever columns the database actually has.
 */
export class Migration20200101013900_unified_photo_provider_abstraction_layer extends Migration {
  override name = 'Migration20200101013900_unified_photo_provider_abstraction_layer';

  override async up(): Promise<void> {
    // 1. The central photo registry.
    await this.execute(`
      CREATE TABLE IF NOT EXISTS trek_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL,
        asset_id TEXT,
        owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        file_path TEXT,
        thumbnail_path TEXT,
        width INTEGER,
        height INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await this.execute(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_trek_photos_provider_asset ON trek_photos(provider, asset_id, owner_id) WHERE asset_id IS NOT NULL`,
    );
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_trek_photos_owner ON trek_photos(owner_id)`);

    // 2. trip_photos → trek_photos + photo_id FK.
    if (await tableExists(this, 'trip_photos')) {
      const names = await columnNames(this, 'trip_photos');
      const hasProvider = names.has('provider');
      const assetCol = names.has('asset_id') ? 'asset_id' : names.has('immich_asset_id') ? 'immich_asset_id' : null;

      if (assetCol) {
        const providerExpr = hasProvider ? 'provider' : `'immich'`;
        // Qualified alias needed in the JOIN, where both tables have `provider`.
        const providerJoinExpr = hasProvider ? 'tp.provider' : `'immich'`;
        const sharedExpr = names.has('shared') ? 'shared' : '1';
        const addedAtExpr = names.has('added_at') ? 'COALESCE(added_at, CURRENT_TIMESTAMP)' : 'CURRENT_TIMESTAMP';
        const albumLinkExpr = names.has('album_link_id') ? 'album_link_id' : 'NULL';

        await this.execute(`
          INSERT OR IGNORE INTO trek_photos (provider, asset_id, owner_id, created_at)
          SELECT DISTINCT ${providerExpr}, ${assetCol}, user_id, ${addedAtExpr}
          FROM trip_photos
          WHERE ${assetCol} IS NOT NULL AND TRIM(${assetCol}) != ''
        `);
        await this.execute(TRIP_PHOTOS_NEW);
        await this.execute(`
          INSERT OR IGNORE INTO trip_photos_new (trip_id, user_id, photo_id, shared, album_link_id, added_at)
          SELECT tp.trip_id, tp.user_id, tkp.id, ${sharedExpr}, ${albumLinkExpr}, ${addedAtExpr}
          FROM trip_photos tp
          JOIN trek_photos tkp ON tkp.provider = ${providerJoinExpr} AND tkp.asset_id = tp.${assetCol} AND tkp.owner_id = tp.user_id
        `);
      } else {
        // No asset column at all — recreate empty.
        await this.execute(TRIP_PHOTOS_NEW);
      }

      await this.execute(`DROP TABLE trip_photos`);
      await this.execute(`ALTER TABLE trip_photos_new RENAME TO trip_photos`);
      await this.execute(`CREATE INDEX IF NOT EXISTS idx_trip_photos_trip ON trip_photos(trip_id)`);
      await this.execute(`CREATE INDEX IF NOT EXISTS idx_trip_photos_photo ON trip_photos(photo_id)`);
    }

    // 3. journey_photos → trek_photos + photo_id FK.
    if (await tableExists(this, 'journey_photos')) {
      await this.execute(`
        INSERT OR IGNORE INTO trek_photos (provider, asset_id, owner_id, width, height, created_at)
        SELECT DISTINCT provider, asset_id, owner_id, width, height, created_at
        FROM journey_photos
        WHERE provider != 'local' AND asset_id IS NOT NULL AND TRIM(asset_id) != ''
      `);
      // Local photos are unique per row, so no de-duplication.
      await this.execute(`
        INSERT INTO trek_photos (provider, file_path, thumbnail_path, width, height, created_at)
        SELECT 'local', file_path, thumbnail_path, width, height, created_at
        FROM journey_photos
        WHERE provider = 'local' AND file_path IS NOT NULL
      `);

      await this.execute(`
        CREATE TABLE journey_photos_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entry_id INTEGER NOT NULL,
          photo_id INTEGER NOT NULL REFERENCES trek_photos(id) ON DELETE CASCADE,
          caption TEXT,
          sort_order INTEGER DEFAULT 0,
          shared INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (entry_id) REFERENCES journey_entries(id) ON DELETE CASCADE
        )
      `);
      await this.execute(`
        INSERT INTO journey_photos_new (entry_id, photo_id, caption, sort_order, shared, created_at)
        SELECT jp.entry_id, tkp.id, jp.caption, jp.sort_order, jp.shared, jp.created_at
        FROM journey_photos jp
        JOIN trek_photos tkp ON tkp.provider = jp.provider AND tkp.asset_id = jp.asset_id AND tkp.owner_id = jp.owner_id
        WHERE jp.provider != 'local' AND jp.asset_id IS NOT NULL
      `);
      await this.execute(`
        INSERT INTO journey_photos_new (entry_id, photo_id, caption, sort_order, shared, created_at)
        SELECT jp.entry_id, tkp.id, jp.caption, jp.sort_order, jp.shared, jp.created_at
        FROM journey_photos jp
        JOIN trek_photos tkp ON tkp.provider = 'local' AND tkp.file_path = jp.file_path
        WHERE jp.provider = 'local' AND jp.file_path IS NOT NULL
      `);
      await this.execute(`DROP TABLE journey_photos`);
      await this.execute(`ALTER TABLE journey_photos_new RENAME TO journey_photos`);
      await this.execute(`CREATE INDEX IF NOT EXISTS idx_journey_photos_entry ON journey_photos(entry_id)`);
      await this.execute(`CREATE INDEX IF NOT EXISTS idx_journey_photos_photo ON journey_photos(photo_id)`);
    }
  }
}
