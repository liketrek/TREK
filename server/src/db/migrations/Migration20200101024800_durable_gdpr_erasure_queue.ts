import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 168 (`db/migrations.ts`).
 *
 * Durable GDPR erasure queue (#plugins). When a TREK account is deleted, every
 * installed plugin holding `hook:user-data` gets a pending row here so its own
 * deleteUserData handler runs even if the plugin was offline at delete time —
 * erasure must not be lost across a restart, so it is persisted (unlike the
 * best-effort event buffer). The row is removed once the plugin acknowledges,
 * and all of a plugin's rows are purged on uninstall. UNIQUE(plugin_id, user_id)
 * makes re-enqueue idempotent.
 */
export class Migration20200101024800_durable_gdpr_erasure_queue extends Migration {
  override name = 'Migration20200101024800_durable_gdpr_erasure_queue';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS plugin_user_erasure_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plugin_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (plugin_id, user_id)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_plugin_erasure_plugin ON plugin_user_erasure_queue (plugin_id)`);
  }
}
