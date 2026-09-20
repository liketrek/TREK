import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 54 (`db/migrations.ts`).
 *
 * MCP long-lived API tokens
 */
export class Migration20200101005400_mcp_long_lived_api_tokens extends Migration {
  override name = 'Migration20200101005400_mcp_long_lived_api_tokens';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS mcp_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        token_prefix TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME
      )
    `);
  }
}
