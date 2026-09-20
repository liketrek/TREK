import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 200 (`db/migrations.ts`).
 *
 * Separate an integration key from an MCP token (#2089).
 * Both live in mcp_tokens and until now both opened everything a token can
 * open. That was fine while /mcp was the only consumer; with a public REST
 * surface it means a key somebody minted for a chat client also reads their
 * trips over HTTP, and a key minted for an integration can drive every MCP
 * tool. One credential, two very different blast radii.
 * `kind` splits them, and every existing row becomes 'mcp' — that is what
 * they were issued for, and silently widening a key that is already in
 * somebody's config would be the opposite of what this migration is for.
 * Appended LAST: the array is index-addressed against schema_version.
 */
export class Migration20200101032000_separate_an_integration_key_from_an_mcp extends Migration {
  override name = 'Migration20200101032000_separate_an_integration_key_from_an_mcp';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'mcp_tokens', 'kind', `kind TEXT NOT NULL DEFAULT 'mcp'`);
  }
}
