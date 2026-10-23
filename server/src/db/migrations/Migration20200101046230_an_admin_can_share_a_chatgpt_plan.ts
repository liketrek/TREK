import { Migration } from '@mikro-orm/migrations';

/**
 * An admin may share their own ChatGPT sign-in with everyone, so a ChatGPT
 * connection can be the instance connection too. The table refused that with
 * `CHECK(kind <> 'chatgpt' OR scope = 'user')`, and saving the shared plan
 * failed on it.
 *
 * SQLite cannot drop a CHECK in place, so the table is rebuilt without that
 * one; every other check stays as it was. Nothing references
 * `ai_connections`, so the old table can go before the new one takes its
 * name. Ids are copied, so a connection keeps its id.
 */
export class Migration20200101046230_an_admin_can_share_a_chatgpt_plan extends Migration {
  override name = 'Migration20200101046230_an_admin_can_share_a_chatgpt_plan';

  override up(): void {
    this.addSql(`
      CREATE TABLE ai_connections_new (
        id INTEGER PRIMARY KEY,
        scope TEXT NOT NULL CHECK(scope IN ('instance', 'user')),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        kind TEXT NOT NULL CHECK(kind IN ('anthropic', 'openai', 'gemini', 'openrouter', 'chatgpt', 'custom')),
        model TEXT NOT NULL,
        base_url TEXT,
        secrets TEXT,
        secrets_version INTEGER NOT NULL DEFAULT 0,
        hint TEXT,
        account TEXT,
        status TEXT NOT NULL DEFAULT 'ok' CHECK(status IN ('ok', 'needs_reauth', 'signed_out', 'error')),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK((scope = 'user') = (user_id IS NOT NULL)),
        CHECK(kind <> 'custom' OR (scope = 'instance' AND base_url IS NOT NULL)),
        CHECK(base_url IS NULL OR kind = 'custom')
      )
    `);
    this.addSql(`
      INSERT INTO ai_connections_new (
        id, scope, user_id, kind, model, base_url, secrets, secrets_version, hint, account, status, created_at, updated_at
      )
      SELECT
        id, scope, user_id, kind, model, base_url, secrets, secrets_version, hint, account, status, created_at, updated_at
      FROM ai_connections
    `);
    this.addSql('DROP TABLE ai_connections');
    this.addSql('ALTER TABLE ai_connections_new RENAME TO ai_connections');
    this.addSql(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_connections_user ON ai_connections(user_id) WHERE user_id IS NOT NULL',
    );
    this.addSql(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_connections_instance ON ai_connections(scope) WHERE user_id IS NULL',
    );
  }
}
