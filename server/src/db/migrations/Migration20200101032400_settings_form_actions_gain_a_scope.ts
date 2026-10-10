import { addColumnIfMissing, columnNames } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 204 (`db/migrations.ts`).
 *
 * Settings-form actions gain a scope (#plugins): 'user' renders on the user
 * Settings tab, 'instance' in the admin instance-settings dialog. Existing rows
 * predate the column and were all user-tab buttons, so the default keeps them
 * where they were.
 */
export class Migration20200101032400_settings_form_actions_gain_a_scope extends Migration {
  override name = 'Migration20200101032400_settings_form_actions_gain_a_scope';

  override async up(): Promise<void> {
    // An empty column list means the table does not exist on this database.
    const names = await columnNames(this, 'plugin_actions');
    if (names.size === 0) return;
    await addColumnIfMissing(this, 'plugin_actions', 'scope', `scope TEXT NOT NULL DEFAULT 'user'`);
  }
}
