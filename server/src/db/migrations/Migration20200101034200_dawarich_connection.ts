import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 222 (`db/migrations.ts`).
 *
 * Dawarich connection (#2279). Its own table rather than more `users` columns,
 * which is where the AirTrail connection lives: that was the right call while
 * AirTrail was the only integration of this shape, and this is the second. It
 * also carries sync state (cursor, last error, probed capabilities) that has no
 * business sitting on the identity row. Credentials for a personal location
 * archive stay strictly apart from anything shared on a trip.
 */
export class Migration20200101034200_dawarich_connection extends Migration {
  override name = 'Migration20200101034200_dawarich_connection';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS dawarich_connections (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        url TEXT,
        api_key TEXT,
        allow_insecure_tls INTEGER NOT NULL DEFAULT 0,
        sync_enabled INTEGER NOT NULL DEFAULT 1,
        last_sync_at TEXT,
        last_sync_state TEXT NOT NULL DEFAULT 'never',
        last_sync_error TEXT,
        capabilities TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}
