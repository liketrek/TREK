import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 155 (`db/migrations.ts`).
 *
 * Migration 155: plugin system scaffold (#plugins). A plugin is a row here;
 * its code lives on the /plugins volume and (once the runtime lands) runs in
 * an isolated child process. This migration only lays down the registry
 * tables — nothing executes yet. Own data lives in a per-plugin sqlite file
 * under /plugins-data, never in these tables.
 */
export class Migration20200101023500_plugin_system_scaffold extends Migration {
  override name = 'Migration20200101023500_plugin_system_scaffold';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS plugins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL DEFAULT 'integration',
        icon TEXT DEFAULT 'Blocks',
        version TEXT,
        api_version INTEGER DEFAULT 1,
        min_trek_version TEXT,
        permissions TEXT DEFAULT '[]',
        granted_permissions TEXT DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'inactive',
        config TEXT DEFAULT '{}',
        source_repo TEXT,
        source_commit TEXT,
        sha256 TEXT,
        crash_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        reviewed_at TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS plugin_meta_migrations (
        plugin_id TEXT NOT NULL,
        migration_id TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (plugin_id, migration_id)
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS plugin_error_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plugin_id TEXT NOT NULL,
        ts DATETIME DEFAULT CURRENT_TIMESTAMP,
        level TEXT NOT NULL DEFAULT 'error',
        message TEXT,
        stack TEXT
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_plugin_error_log_plugin ON plugin_error_log(plugin_id, ts)`);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS plugin_settings_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plugin_id TEXT NOT NULL,
        field_key TEXT NOT NULL,
        label TEXT,
        input_type TEXT NOT NULL DEFAULT 'text',
        placeholder TEXT,
        hint TEXT,
        required INTEGER NOT NULL DEFAULT 0,
        secret INTEGER NOT NULL DEFAULT 0,
        scope TEXT NOT NULL DEFAULT 'instance',
        options TEXT,
        oauth_config TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        UNIQUE (plugin_id, field_key)
      )
    `);
  }
}
