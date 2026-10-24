import { Migration } from '@mikro-orm/migrations';

/**
 * The connections the trip assistant talks to a language model through: at most
 * one the admin sets up for everyone (`scope = 'instance'`, no user) and at most
 * one per user (`scope = 'user'`).
 *
 * `secrets` is one encrypted JSON blob (an API key, or ChatGPT's access and
 * refresh tokens), rotated as a whole by scripts/migrate-encryption.ts, and
 * `secrets_version` counts its writes so a token refresh can replace it only if
 * nobody else did in between. `account` holds what a sign-in leaves that is not
 * secret (ChatGPT's issued client id, the account's subject and scopes), so a
 * signed-out connection can sign in again as the same registration. `hint` is
 * what the settings show instead of the secret.
 *
 * Two kinds are bound to one side: a ChatGPT plan is personal and never the
 * instance connection, and a custom base URL (an Ollama in the LAN, say) is
 * only ever the admin's (#1772). The checks refuse the other combinations.
 */
export class Migration20200101046200_a_user_can_connect_an_ai_provider extends Migration {
  override name = 'Migration20200101046200_a_user_can_connect_an_ai_provider';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS ai_connections (
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
        CHECK(kind <> 'chatgpt' OR scope = 'user'),
        CHECK(kind <> 'custom' OR (scope = 'instance' AND base_url IS NOT NULL)),
        CHECK(base_url IS NULL OR kind = 'custom')
      )
    `);
    this.addSql(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_connections_user ON ai_connections(user_id) WHERE user_id IS NOT NULL',
    );
    this.addSql(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_connections_instance ON ai_connections(scope) WHERE user_id IS NULL',
    );
  }
}
