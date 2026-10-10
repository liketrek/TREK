import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 88 (`db/migrations.ts`).
 *
 * Make oauth_clients.user_id nullable to support anonymous RFC 7591 DCR clients.
 *
 * The legacy step ran outside a transaction so it could `PRAGMA foreign_keys =
 * OFF` around the drop-and-rename — SQLite ignores that pragma inside an open
 * transaction, and `oauth_tokens`/`oauth_consents` point at this table. Here the
 * migration stays transactional and uses `defer_foreign_keys` instead, which is
 * the in-transaction equivalent: enforcement is postponed to the commit, by
 * which point the rename has made every reference valid again.
 */
export class Migration20200101012800_make_oauth_clients extends Migration {
  override name = 'Migration20200101012800_make_oauth_clients';

  override async up(): Promise<void> {
    await this.execute(`PRAGMA defer_foreign_keys = ON`);
    await this.execute(`
      CREATE TABLE IF NOT EXISTS oauth_clients_new (
        id                 TEXT PRIMARY KEY,
        user_id            INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name               TEXT NOT NULL,
        client_id          TEXT UNIQUE NOT NULL,
        client_secret_hash TEXT NOT NULL,
        redirect_uris      TEXT NOT NULL DEFAULT '[]',
        allowed_scopes     TEXT NOT NULL DEFAULT '[]',
        created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_public          INTEGER NOT NULL DEFAULT 0,
        created_via        TEXT NOT NULL DEFAULT 'settings_ui'
      )
    `);
    await this.execute(
      `INSERT INTO oauth_clients_new SELECT id, user_id, name, client_id, client_secret_hash, redirect_uris, allowed_scopes, created_at, is_public, created_via FROM oauth_clients`,
    );
    await this.execute(`DROP TABLE oauth_clients`);
    await this.execute(`ALTER TABLE oauth_clients_new RENAME TO oauth_clients`);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_oauth_clients_user ON oauth_clients(user_id)`);
    await this.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_clients_client_id ON oauth_clients(client_id)`);
  }
}
