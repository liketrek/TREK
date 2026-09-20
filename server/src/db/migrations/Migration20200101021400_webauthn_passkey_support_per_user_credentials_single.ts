import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 134 (`db/migrations.ts`).
 *
 * WebAuthn / passkey support: per-user credentials + single-use login
 * challenges. Additive (CREATE TABLE IF NOT EXISTS) so existing installs are
 * untouched; both tables also live in schema.ts for fresh installs.
 */
export class Migration20200101021400_webauthn_passkey_support_per_user_credentials_single extends Migration {
  override name = 'Migration20200101021400_webauthn_passkey_support_per_user_credentials_single';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS webauthn_credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        credential_id TEXT NOT NULL UNIQUE,
        public_key BLOB NOT NULL,
        counter INTEGER NOT NULL DEFAULT 0,
        transports TEXT,
        device_type TEXT,
        backed_up INTEGER NOT NULL DEFAULT 0,
        name TEXT,
        aaguid TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user ON webauthn_credentials(user_id)`);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS webauthn_challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challenge TEXT NOT NULL UNIQUE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires ON webauthn_challenges(expires_at)`);
  }
}
