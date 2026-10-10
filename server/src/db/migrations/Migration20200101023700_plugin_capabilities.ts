import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 157 (`db/migrations.ts`).
 *
 * Migration 157: plugin capabilities (from trek-plugin.json) — the client
 * needs them to place widgets (e.g. widget.slot 'hero' renders as an overlay
 * on the boarding-pass bar instead of the dashboard sidebar).
 */
export class Migration20200101023700_plugin_capabilities extends Migration {
  override name = 'Migration20200101023700_plugin_capabilities';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'plugins', 'capabilities', `capabilities TEXT NOT NULL DEFAULT '{}'`);
  }
}
