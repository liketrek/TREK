import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 115 (`db/migrations.ts`).
 *
 * Migration: password reset — add password_version for session
 * invalidation, and a token table keyed by SHA-256 hash (raw tokens
 * never hit the DB).
 */
export class Migration20200101015500_password_reset extends Migration {
  override name = 'Migration20200101015500_password_reset';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'password_version', `password_version INTEGER NOT NULL DEFAULT 0`);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        consumed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_ip TEXT
      )
    `);

    await this.execute(`CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens(user_id)`);

    await this.execute(`CREATE INDEX IF NOT EXISTS idx_prt_hash ON password_reset_tokens(token_hash)`);
  }
}
