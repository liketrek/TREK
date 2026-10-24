import { addColumnIfMissing, execBestEffort } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 43 (`db/migrations.ts`).
 *
 * Immich integration: per-user credentials, the linked-asset table, and the
 * Photos addon tile (disabled by default).
 */
export class Migration20200101004300_users_add_immich_url extends Migration {
  override name = 'Migration20200101004300_users_add_immich_url';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'immich_url', `immich_url TEXT`);
    await addColumnIfMissing(this, 'users', 'immich_api_key', `immich_api_key TEXT`);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS trip_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        immich_asset_id TEXT NOT NULL,
        shared INTEGER NOT NULL DEFAULT 1,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(trip_id, user_id, immich_asset_id)
      )
    `);

    await execBestEffort(
      this,
      `INSERT INTO addons (id, name, type, icon, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
      ['memories', 'Photos', 'trip', 'Image', 0, 7],
    );
  }
}
