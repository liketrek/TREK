import { execBestEffort } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 57 (`db/migrations.ts`).
 *
 * Ensure MCP addon type is 'integration'.
 */
export class Migration20200101005700_ensure_mcp_addon_type_is_integration extends Migration {
  override name = 'Migration20200101005700_ensure_mcp_addon_type_is_integration';

  override async up(): Promise<void> {
    await execBestEffort(this, `UPDATE addons SET type = 'integration' WHERE id = 'mcp'`);
  }
}
