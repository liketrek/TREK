import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 198 (`db/migrations.ts`).
 *
 * A deliberate non-latest plugin install sets `update_hold`: the row leaves the
 * update banner and "Update all" until the admin resumes updates, or until an
 * install lands back on the newest compatible version. Only an EXPLICIT version
 * pick ever sets it — dependency resolution pins versions too, but never
 * deliberately. Appended LAST — the array is index-addressed against schema_version.
 */
export class Migration20200101031800_a_deliberate_non_latest_plugin_install_sets extends Migration {
  override name = 'Migration20200101031800_a_deliberate_non_latest_plugin_install_sets';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'plugins', 'update_hold', `update_hold INTEGER NOT NULL DEFAULT 0`);
  }
}
