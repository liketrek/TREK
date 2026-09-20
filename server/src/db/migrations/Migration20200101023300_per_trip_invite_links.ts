import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 153 (`db/migrations.ts`).
 *
 * Migration 153: per-trip invite links (#1143). One rotating token per trip;
 * a logged-in existing user who opens the link joins the trip as a member.
 * Deleting the trip drops the token (CASCADE); the creator is nulled if their
 * account is removed so the link keeps working.
 */
export class Migration20200101023300_per_trip_invite_links extends Migration {
  override name = 'Migration20200101023300_per_trip_invite_links';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS trip_invite_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        expires_at TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_trip_invite_tokens_token ON trip_invite_tokens(token)`);
  }
}
