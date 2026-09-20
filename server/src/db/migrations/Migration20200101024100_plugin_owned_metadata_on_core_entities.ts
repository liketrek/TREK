import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 161 (`db/migrations.ts`).
 *
 * Migration 161: plugin-owned metadata on core entities (#1429). A namespaced
 * key/value store so a plugin can attach data to a trip/place/day WITHOUT
 * forking the core schema. One row per (plugin, entity, key); a plugin only
 * ever sees its own rows. entity_type is polymorphic (no cross-table FK), so
 * rows are purged by plugin_id on uninstall; entity deletes leave harmless
 * orphans that the plugin's own reads never surface.
 */
export class Migration20200101024100_plugin_owned_metadata_on_core_entities extends Migration {
  override name = 'Migration20200101024100_plugin_owned_metadata_on_core_entities';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS plugin_entity_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plugin_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        value TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (plugin_id, entity_type, entity_id, key)
      )
    `);

    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_plugin_meta_entity ON plugin_entity_metadata (plugin_id, entity_type, entity_id)`,
    );
  }
}
