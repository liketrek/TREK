import type { PluginErrorLog } from '../entities/PluginErrorLog.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/** PR2 delivery row / plugins.service.ts `errors()`'s own projection. */
export interface PluginErrorLogRow {
  ts: string;
  level: string;
  message: string;
}

/** The tables `pruneKeepingRecent`'s own `this.kysely()` escape hatch (`_shared/trek-repository.ts`) reads, for its correlated subquery on `id`/`plugin_id`. */
type PluginErrorLogKyselyDB = Pick<DB, 'plugin_error_log'>;

export class PluginErrorLogRepository extends TrekRepository<PluginErrorLog> {
  /** PR2 — `INSERT INTO plugin_error_log (plugin_id, level, message) VALUES (?, ?, ?)` (the supervisor's `onLog` callback — §4a, lazily resolved, own try/catch swallow unchanged in the caller). */
  async insertLog(pluginId: string, level: string, message: string): Promise<void> {
    await this.insert({ plugin_id: pluginId, level, message });
  }

  /**
   * PR3 — `` DELETE FROM plugin_error_log WHERE plugin_id = ? AND id NOT IN (
   *  SELECT id FROM plugin_error_log WHERE plugin_id = ? ORDER BY id DESC LIMIT ${retention}
   * ) `` (`pruneErrorLog`'s retention trim). The `NOT IN (subquery … ORDER BY … LIMIT)`
   * shape has no `nativeDelete`/`FilterQuery` equivalent (no correlated-subquery support),
   * so this is one of the few statements per repository that goes through `this.kysely()`
   * (`_shared/trek-repository.ts`'s escape hatch) rather than the QueryBuilder — the
   * `retention` count is a `?`-bound `limit()` call, never interpolated into SQL text.
   */
  async pruneKeepingRecent(pluginId: string, retention: number): Promise<void> {
    const db = this.kysely<PluginErrorLogKyselyDB>();
    await db
      .deleteFrom('plugin_error_log')
      .where('plugin_id', '=', pluginId)
      .where(
        'id',
        'not in',
        db
          .selectFrom('plugin_error_log')
          .select('id')
          .where('plugin_id', '=', pluginId)
          .orderBy('id', 'desc')
          .limit(retention),
      )
      .execute();
  }

  /** PR38 (uninstall cascade) / plugins.service.ts's `clearErrors` — `DELETE FROM plugin_error_log WHERE plugin_id = ?` (identical text, two call sites). */
  async deleteAllForPlugin(pluginId: string): Promise<void> {
    await this.nativeDelete({ plugin_id: pluginId });
  }

  /** plugins.service.ts `errors()` — `SELECT ts, level, message FROM plugin_error_log WHERE plugin_id = ? ORDER BY ts DESC, id DESC LIMIT 200`. */
  async listRecent(pluginId: string, limit = 200): Promise<PluginErrorLogRow[]> {
    const rows = await this.find(
      { plugin_id: pluginId },
      { fields: ['ts', 'level', 'message'], orderBy: [{ ts: 'desc' }, { id: 'desc' }], limit },
    );
    return rows.map((r) => ({ ts: r.ts ?? '', level: r.level, message: r.message ?? '' }));
  }
}
