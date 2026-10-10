import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 165 (`db/migrations.ts`).
 *
 * Per-user plugin settings (#plugins). A plugin can declare `scope:'user'`
 * settings fields (e.g. an API key or a personal preference); each USER stores
 * their own values here, separate from the admin-owned instance `plugins.config`.
 * Secrets are encrypted with the same apiKeyCrypto as instance secrets and are
 * never echoed back to the client (masked). Runtime reads the acting user's row.
 */
export class Migration20200101024500_per_user_plugin_settings extends Migration {
  override name = 'Migration20200101024500_per_user_plugin_settings';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS plugin_user_config (
        plugin_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        config TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (plugin_id, user_id)
      )
    `);
  }
}
