import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 171 (`db/migrations.ts`).
 *
 * Settings-page action buttons a plugin contributes ("Test connection", "Sync now").
 * Descriptors only — the handler lives in the plugin's code and is invoked host-side
 * with the CLICKING user bound, so it can read that user's own settings.
 */
export class Migration20200101025100_settings_page_action_buttons_a_plugin_contributes extends Migration {
  override name = 'Migration20200101025100_settings_page_action_buttons_a_plugin_contributes';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS plugin_actions (
        plugin_id TEXT NOT NULL,
        action_key TEXT NOT NULL,
        label TEXT NOT NULL,
        hint TEXT,
        danger INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (plugin_id, action_key)
      )
    `);
  }
}
