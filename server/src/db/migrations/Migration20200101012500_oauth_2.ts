import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 85 (`db/migrations.ts`).
 *
 * Migration: OAuth 2.1 clients, consents, and tokens for MCP
 */
export class Migration20200101012500_oauth_2 extends Migration {
  override name = 'Migration20200101012500_oauth_2';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS oauth_clients (
        id                 TEXT PRIMARY KEY,
        user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name               TEXT NOT NULL,
        client_id          TEXT UNIQUE NOT NULL,
        client_secret_hash TEXT NOT NULL,
        redirect_uris      TEXT NOT NULL DEFAULT '[]',
        allowed_scopes     TEXT NOT NULL DEFAULT '[]',
        created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_oauth_clients_user ON oauth_clients(user_id)`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_clients_client_id ON oauth_clients(client_id)`);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS oauth_consents (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id  TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scopes     TEXT NOT NULL DEFAULT '[]',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(client_id, user_id)
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        id                        INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id                 TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
        user_id                   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        access_token_hash         TEXT UNIQUE NOT NULL,
        refresh_token_hash        TEXT UNIQUE NOT NULL,
        scopes                    TEXT NOT NULL DEFAULT '[]',
        access_token_expires_at   DATETIME NOT NULL,
        refresh_token_expires_at  DATETIME NOT NULL,
        revoked_at                DATETIME,
        created_at                DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_tokens(user_id)`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_tokens_access  ON oauth_tokens(access_token_hash)`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_tokens_refresh ON oauth_tokens(refresh_token_hash)`);
  }
}
