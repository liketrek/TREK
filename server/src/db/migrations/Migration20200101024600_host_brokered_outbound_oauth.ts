import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 166 (`db/migrations.ts`).
 *
 * Host-brokered outbound OAuth (#plugins). A plugin becomes an OAuth *client* of a
 * third-party service; the HOST runs authorize->callback->token->refresh with
 * PKCE+state and owns the tokens — the plugin never sees the refresh token. Tokens
 * are per-user + encrypted at rest; the in-flight PKCE verifier/state is short-lived.
 */
export class Migration20200101024600_host_brokered_outbound_oauth extends Migration {
  override name = 'Migration20200101024600_host_brokered_outbound_oauth';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS plugin_oauth_tokens (
        plugin_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        expires_at INTEGER,
        scope TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (plugin_id, user_id)
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS plugin_oauth_state (
        state TEXT PRIMARY KEY,
        plugin_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        verifier TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
  }
}
