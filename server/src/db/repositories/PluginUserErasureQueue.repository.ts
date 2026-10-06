import type { PluginUserErasureQueue } from '../entities/PluginUserErasureQueue.entity';
import { TrekRepository } from './_shared/trek-repository';

/** The drain's own pending-row projection. */
export interface PendingErasureRow {
  id: number;
  plugin_id: string;
  user_id: number;
}

/** `plugin_id`/`id` — the columns the orphan-scan's correlated `NOT IN (SELECT id FROM plugins)` subquery needs. */
interface PluginUserErasureQueueKyselyDB {
  plugin_user_erasure_queue: { id: number; plugin_id: string; user_id: number };
  plugins: { id: string };
}

export class PluginUserErasureQueueRepository extends TrekRepository<PluginUserErasureQueue> {
  /** PR8 — `INSERT OR IGNORE INTO plugin_user_erasure_queue (plugin_id, user_id) VALUES (?, ?)` (idempotent — a duplicate enqueue for the same pair is a no-op). */
  async insertIgnore(pluginId: string, userId: number): Promise<void> {
    await this.upsert(
      { plugin_id: pluginId, user_id: userId },
      { onConflictFields: ['plugin_id', 'user_id'], onConflictAction: 'ignore' },
    );
  }

  /**
   * `runDrainOnce`'s orphan scan — `SELECT DISTINCT plugin_id FROM plugin_user_erasure_queue
   * WHERE plugin_id NOT IN (SELECT id FROM plugins)`. A cross-table correlated `NOT IN`
   * has no `FilterQuery` equivalent, so this goes through `this.kysely()`.
   */
  async listOrphanPluginIds(): Promise<string[]> {
    const db = this.kysely<PluginUserErasureQueueKyselyDB>();
    const rows = await db
      .selectFrom('plugin_user_erasure_queue')
      .select('plugin_id')
      .distinct()
      .where('plugin_id', 'not in', db.selectFrom('plugins').select('id'))
      .execute();
    return rows.map((r) => r.plugin_id);
  }

  /**
   * `runDrainOnce`'s reap (a truly orphaned data dir) / `uninstall`'s `deleteData` branch —
   * `DELETE FROM plugin_user_erasure_queue WHERE plugin_id = ?` (identical text, two call sites).
   */
  async deleteAllForPlugin(pluginId: string): Promise<void> {
    await this.nativeDelete({ plugin_id: pluginId });
  }

  /**
   * `runDrainOnce`'s delivery window — `` SELECT id, plugin_id, user_id FROM
   * plugin_user_erasure_queue WHERE plugin_id IN (${ph}) ORDER BY id LIMIT 200 ``.
   * `pluginIds` — never empty: the caller already returns early when
   * `supervisor.activeIds()` is empty.
   */
  async findPendingForPlugins(pluginIds: string[], limit = 200): Promise<PendingErasureRow[]> {
    const rows = await this.find(
      { plugin_id: { $in: pluginIds } },
      { fields: ['id', 'plugin_id', 'user_id'], orderBy: { id: 'asc' }, limit },
    );
    return rows.map((r) => ({ id: r.id, plugin_id: r.plugin_id, user_id: r.user_id }));
  }

  /** `runDrainOnce`'s ACK — `DELETE FROM plugin_user_erasure_queue WHERE id = ?` (a delivered row). */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }
}
