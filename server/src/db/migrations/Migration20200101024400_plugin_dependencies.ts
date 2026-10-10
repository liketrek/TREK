import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 164 (`db/migrations.ts`).
 *
 * Plugin dependencies (#plugins): a plugin's trek-plugin.json can now declare
 * `requiredAddons` (addon ids that must be enabled to activate) and
 * `pluginDependencies` ({id, version-range} of other plugins that must be
 * installed + satisfied). Stored as one JSON blob and populated by the
 * discovery upsert on every install path. Legacy rows default to '{}' (no deps).
 */
export class Migration20200101024400_plugin_dependencies extends Migration {
  override name = 'Migration20200101024400_plugin_dependencies';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'plugins', 'dependencies', `dependencies TEXT NOT NULL DEFAULT '{}'`);
  }
}
