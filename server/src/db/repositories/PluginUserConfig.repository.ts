import { currentTimestamp } from '../dialect/sql-functions';
import type { PluginUserConfig } from '../entities/PluginUserConfig.entity';
import { TrekRepository } from './_shared/trek-repository';

/** `exportUserData`'s own per-user config scan. */
export interface PluginUserConfigRow {
  plugin_id: string;
  config: string;
}

export class PluginUserConfigRepository extends TrekRepository<PluginUserConfig> {
  /**
   * PS7/PS9/PS11 — `SELECT config FROM plugin_user_config WHERE plugin_id = ? AND user_id
   * = ?`, byte-identical text at THREE call sites in `plugins.service.ts` (`getUserConfig`'s
   * own read, `setUserConfig`'s pre-write existence check, `getUserConfigDecrypted`'s read)
   * — collapsed onto one method per the brief's own naming of this triple-duplicate.
   */
  async findConfig(pluginId: string, userId: number): Promise<string | null> {
    const row = await this.findOne({ plugin_id: pluginId, user_id: userId }, { fields: ['config'] });
    return row?.config ?? null;
  }

  /** `exportUserData`'s GDPR fold — `SELECT plugin_id, config FROM plugin_user_config WHERE user_id = ?`. */
  async listForUser(userId: number): Promise<PluginUserConfigRow[]> {
    const rows = await this.find({ user_id: userId }, { fields: ['plugin_id', 'config'] });
    return rows.map((r) => ({ plugin_id: r.plugin_id, config: r.config }));
  }

  /**
   * PS10 — `` INSERT INTO plugin_user_config (plugin_id, user_id, config, updated_at)
   * VALUES (?, ?, ?, datetime('now')) ON CONFLICT(plugin_id, user_id) DO UPDATE SET
   * config = excluded.config, updated_at = excluded.updated_at `` — the composite-key
   * upsert on `(plugin_id, user_id)`, the entity's own primary key. `currentTimestamp`
   * (`src/db/dialect/sql-functions.ts`) renders the same `CURRENT_TIMESTAMP`/`datetime('now')`
   * text SQLite already treats as equivalent, bound once per statement execution so the
   * inserted row and the `excluded.updated_at` merge target agree, matching the legacy
   * single-statement `datetime('now')` call exactly.
   */
  async upsertConfig(pluginId: string, userId: number, config: string): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.upsert(
      { plugin_id: pluginId, user_id: userId, config, updated_at: currentTimestamp(platform) },
      {
        onConflictFields: ['plugin_id', 'user_id'],
        onConflictAction: 'merge',
        onConflictMergeFields: ['config', 'updated_at'],
      },
    );
  }

  /** PR41 (uninstall cascade) — `DELETE FROM plugin_user_config WHERE plugin_id = ?`. */
  async deleteAllForPlugin(pluginId: string): Promise<void> {
    await this.nativeDelete({ plugin_id: pluginId });
  }
}
