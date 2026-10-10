import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 56 (`db/migrations.ts`).
 *
 * Index on mcp_tokens.token_hash
 */
export class Migration20200101005600_index_on_mcp_tokens extends Migration {
  override name = 'Migration20200101005600_index_on_mcp_tokens';

  override up(): void {
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS idx_mcp_tokens_hash ON mcp_tokens(token_hash)`);
  }
}
