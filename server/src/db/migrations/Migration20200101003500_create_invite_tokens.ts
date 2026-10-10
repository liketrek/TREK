import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 35 (`db/migrations.ts`).
 */
export class Migration20200101003500_create_invite_tokens extends Migration {
  override name = 'Migration20200101003500_create_invite_tokens';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS invite_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE NOT NULL,
        max_uses INTEGER NOT NULL DEFAULT 1,
        used_count INTEGER NOT NULL DEFAULT 0,
        expires_at TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}
