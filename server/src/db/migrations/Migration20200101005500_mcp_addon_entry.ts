import { execBestEffort } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 55 (`db/migrations.ts`).
 *
 * MCP addon entry.
 */
export class Migration20200101005500_mcp_addon_entry extends Migration {
  override name = 'Migration20200101005500_mcp_addon_entry';

  override async up(): Promise<void> {
    await execBestEffort(
      this,
      `INSERT OR IGNORE INTO addons (id, name, description, type, icon, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['mcp', 'MCP', 'Model Context Protocol for AI assistant integration', 'integration', 'Terminal', 0, 12],
    );
  }
}
