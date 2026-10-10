import type { PluginActions } from '../entities/PluginActions.entity';
import { TrekRepository } from './_shared/trek-repository';
import type { PluginActionScope } from '@trek/shared';

/** `actionsOf`'s own projection — mapped to `PluginActionDescriptor` in the service. */
export interface PluginActionRow {
  action_key: string;
  label: string;
  hint: string | null;
  danger: number;
  scope: PluginActionScope;
}

export class PluginActionsRepository extends TrekRepository<PluginActions> {
  /** PS3 (`plugins.service.ts#instanceActionsCount`) — `SELECT COUNT(*) AS n FROM plugin_actions WHERE plugin_id = ? AND scope = 'instance'`. Caller wraps this in its own try/catch → 0. */
  async countForPluginScope(pluginId: string, scope: PluginActionScope): Promise<number> {
    return await this.count({ plugin_id: pluginId, scope });
  }

  /** `actionsOf` — `SELECT action_key, label, hint, danger, scope FROM plugin_actions WHERE plugin_id = ? AND scope = ? ORDER BY sort_order`. Caller wraps this in its own try/catch → []. */
  async listForPluginScope(pluginId: string, scope: PluginActionScope): Promise<PluginActionRow[]> {
    const rows = await this.find(
      { plugin_id: pluginId, scope },
      { fields: ['action_key', 'label', 'hint', 'danger', 'scope'], orderBy: { sort_order: 'asc' } },
    );
    return rows.map((r) => ({
      action_key: r.action_key,
      label: r.label,
      hint: r.hint ?? null,
      danger: r.danger,
      scope: r.scope as PluginActionScope,
    }));
  }

  /** PR35 (uninstall cascade) — `DELETE FROM plugin_actions WHERE plugin_id = ?`. The caller wraps this in its own try/catch (table absent on a slimmed test schema is tolerated here). */
  async deleteAllForPlugin(pluginId: string): Promise<void> {
    await this.nativeDelete({ plugin_id: pluginId });
  }

  /**
   * DI6 (Plan 3j Task 3, `install/discovery.ts#upsert`) — `INSERT INTO plugin_actions
   * (plugin_id, action_key, label, hint, danger, scope, sort_order) VALUES (?,?,?,?,?,?,?)`,
   * looped once per manifest action, paired with DI5's `deleteAllForPlugin` above (the
   * same delete-then-reinsert re-declare sequence). `insertMany` over a per-row loop:
   * one batched native insert, same rows the legacy per-row `.run()` loop produced. A
   * no-op on an empty manifest `actions[]`.
   */
  async insertActions(pluginId: string, actions: NewPluginActionRow[]): Promise<void> {
    if (!actions.length) return;
    await this.insertMany(
      actions.map((a) => ({
        plugin_id: pluginId,
        action_key: a.action_key,
        label: a.label,
        hint: a.hint,
        danger: a.danger,
        scope: a.scope,
        sort_order: a.sort_order,
      })),
    );
  }
}

/** DI6's own row shape — `discoverPlugins#upsert`'s per-manifest-action insert. */
export interface NewPluginActionRow {
  action_key: string;
  label: string;
  hint: string | null;
  danger: number;
  scope: PluginActionScope;
  sort_order: number;
}
