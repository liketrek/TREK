import type { PluginEgressHosts } from '../entities/PluginEgressHosts.entity';
import { TrekRepository } from './_shared/trek-repository';

export class PluginEgressHostsRepository extends TrekRepository<PluginEgressHosts> {
  /** PR20 — `SELECT host FROM plugin_egress_hosts WHERE plugin_id = ? ORDER BY host` (`operatorEgressHosts`). Caller wraps this in its own try/catch — a slimmed test schema without this table never blocks activation. */
  async listHostsForPlugin(pluginId: string): Promise<string[]> {
    const rows = await this.find({ plugin_id: pluginId }, { fields: ['host'], orderBy: { host: 'asc' } });
    return rows.map((r) => r.host);
  }

  /** PS1 — `SELECT COUNT(*) AS n FROM plugin_egress_hosts WHERE plugin_id = ?` (`plugins.service.ts#egressHostCount`). Caller wraps this in its own try/catch → 0. */
  async countForPlugin(pluginId: string): Promise<number> {
    return await this.count({ plugin_id: pluginId });
  }

  /**
   * PR22/PR23 — `setOperatorEgressHosts`'s DELETE+loop-INSERT: `DELETE FROM
   * plugin_egress_hosts WHERE plugin_id = ?` then, per host, `INSERT OR IGNORE INTO
   * plugin_egress_hosts (plugin_id, host) VALUES (?, ?)`.
   *
   * **R-uninstall's ONE named transaction** (the plan's "For the user" line): the CALLER
   * (`PluginRuntimeService.setOperatorEgressHosts`) wraps this call in `uow.transactional`
   * — this method issues the same two-step DELETE-then-INSERT-loop shape the legacy code
   * did, but now atomically, so a crash mid-write leaves the OLD host set intact instead
   * of a plugin with zero egress hosts. `INSERT OR IGNORE` -> `onConflictAction: 'ignore'`
   * against the `(plugin_id, host)` unique pair, unchanged from the legacy statement.
   */
  async replaceAllForPlugin(pluginId: string, hosts: string[]): Promise<void> {
    await this.nativeDelete({ plugin_id: pluginId });
    for (const host of hosts) {
      await this.upsert(
        { plugin_id: pluginId, host },
        { onConflictFields: ['plugin_id', 'host'], onConflictAction: 'ignore' },
      );
    }
  }

  /** PR36 (uninstall cascade) — `DELETE FROM plugin_egress_hosts WHERE plugin_id = ?`. The caller wraps this in its own try/catch (table absent on a slimmed test schema is tolerated here). */
  async deleteAllForPlugin(pluginId: string): Promise<void> {
    await this.nativeDelete({ plugin_id: pluginId });
  }
}
