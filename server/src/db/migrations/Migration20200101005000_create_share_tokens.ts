import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 50 (`db/migrations.ts`).
 */
export class Migration20200101005000_create_share_tokens extends Migration {
  override name = 'Migration20200101005000_create_share_tokens';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS share_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        created_by INTEGER NOT NULL REFERENCES users(id),
        share_map INTEGER DEFAULT 1,
        share_bookings INTEGER DEFAULT 1,
        share_packing INTEGER DEFAULT 0,
        share_budget INTEGER DEFAULT 0,
        share_collab INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}
