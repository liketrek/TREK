import type { PluginScheduledTasks } from '../entities/PluginScheduledTasks.entity';
import { TrekRepository } from './_shared/trek-repository';

/** HR7's insert-only shape (`schedulerSet`'s VALUES list — `payload`/`every_ms` are always caller-supplied, never defaulted the way `id`/`created_at` are). */
export interface PluginScheduledTaskUpsertInput {
  plugin_id: string;
  name: string;
  due_at: number;
  payload: string;
  every_ms: number | null;
}

/** PR4 — the sweep's own due-task projection. */
export interface DueScheduledTaskRow {
  id: number;
  plugin_id: string;
  name: string;
  payload: string;
  every_ms: number | null;
}

export class PluginScheduledTasksRepository extends TrekRepository<PluginScheduledTasks> {
  /**
   * PR4 — `` SELECT id, plugin_id, name, payload, every_ms FROM plugin_scheduled_tasks
   * WHERE due_at <= ? AND plugin_id IN (${ph}) ORDER BY due_at LIMIT 200 `` (`fireDueScheduled`'s
   * sweep window). `pluginIds` — never an empty array: the caller (`fireDueScheduled`)
   * already returns early when `supervisor.activeIds()` is empty, the same short-circuit
   * the legacy `IN (${ph})` string-building avoided running against.
   */
  async findDueForPlugins(now: number, pluginIds: string[], limit = 200): Promise<DueScheduledTaskRow[]> {
    const rows = await this.find(
      { due_at: { $lte: now }, plugin_id: { $in: pluginIds } },
      { fields: ['id', 'plugin_id', 'name', 'payload', 'every_ms'], orderBy: { due_at: 'asc' }, limit },
    );
    return rows.map((r) => ({
      id: r.id,
      plugin_id: r.plugin_id,
      name: r.name,
      payload: r.payload,
      every_ms: r.every_ms ?? null,
    }));
  }

  /**
   * PR5 — `UPDATE plugin_scheduled_tasks SET due_at = ? WHERE id = ?` — re-arm BEFORE
   * the fire (crash-safety ordering, preserved exactly by the caller).
   *
   * **Deviation, named (task-2-report.md), the SAME spirit as R-uninstall's egress-host
   * transaction — a second, small, deliberate correctness fix, not silent parity**: the
   * legacy statement had no `due_at` guard, but the legacy CALL SITE never needed one —
   * `better-sqlite3` is synchronous and the claim-then-act loop had no `await` between
   * the SELECT and this UPDATE, so two "concurrent" JS calls to `fireDueScheduled` could
   * never actually interleave at the DB level (the first ran to completion before the
   * second's own SELECT even started). Converting the SELECT and this UPDATE into
   * separately-awaited repository calls removes that accidental atomicity: two
   * overlapping ticks (a real possibility once a tick can run longer than the 30s
   * cadence) can both read the SAME due row before either claims it, delivering it
   * TWICE (proven by `RACE-SCHED-001` before this guard was added). Adding `due_at <=
   * now` here (the SAME condition the SELECT already used) makes the claim atomic and
   * idempotent per row: whichever pass's UPDATE lands first moves `due_at` forward, so
   * the LOSING pass's own `due_at <= now` no longer matches and its `nativeUpdate`
   * affects zero rows — the caller uses that to skip delivery rather than double-fire.
   */
  async rearm(id: number, dueAt: number, claimedFromDueAt: number): Promise<boolean> {
    const changed = await this.nativeUpdate({ id, due_at: { $lte: claimedFromDueAt } }, { due_at: dueAt });
    return changed > 0;
  }

  /** PR6 — `DELETE FROM plugin_scheduled_tasks WHERE id = ?` (a one-shot task, deleted before the fire). Same atomic-claim guard as `rearm` above, same reason. */
  async deleteById(id: number, claimedFromDueAt: number): Promise<boolean> {
    const changed = await this.nativeDelete({ id, due_at: { $lte: claimedFromDueAt } });
    return changed > 0;
  }

  /** PR37 (uninstall cascade) — `DELETE FROM plugin_scheduled_tasks WHERE plugin_id = ?`. */
  async deleteAllForPlugin(pluginId: string): Promise<void> {
    await this.nativeDelete({ plugin_id: pluginId });
  }

  // -----------------------------------------------------------------------
  // HR5–HR8 (Plan 3j Task 5, `plugins/host/rpc/host-surface.rpc.ts`'s
  // `scheduler.set`/`scheduler.cancel` RPC handlers — a plugin's own
  // request to schedule/cancel one of its named tasks, distinct from PR4–
  // PR10's sweep-tick statements above).
  // -----------------------------------------------------------------------

  /** HR5 — `SELECT id FROM plugin_scheduled_tasks WHERE plugin_id = ? AND name = ?`, existence-only (the pre-quota check `schedulerSet` runs before counting). */
  async existsForPluginAndName(pluginId: string, name: string): Promise<boolean> {
    const row = await this.findOne({ plugin_id: pluginId, name }, { fields: ['id'] });
    return row !== null;
  }

  /** HR6 — `SELECT COUNT(*) AS c FROM plugin_scheduled_tasks WHERE plugin_id = ?`, the `SCHED_MAX` DoS-quota count. */
  async countForPlugin(pluginId: string): Promise<number> {
    return await this.count({ plugin_id: pluginId });
  }

  /**
   * HR7 — `` INSERT INTO plugin_scheduled_tasks (plugin_id, name, due_at,
   * payload, every_ms) VALUES (?, ?, ?, ?, ?) ON CONFLICT (plugin_id, name)
   * DO UPDATE SET due_at = excluded.due_at, payload = excluded.payload,
   * every_ms = excluded.every_ms `` — the composite-key upsert on
   * `(plugin_id, name)` (the entity's own `uniques`, `PluginScheduledTasks
   * .entity.ts`): re-scheduling the same name replaces it in place. No
   * COALESCE — every non-key column is re-assigned verbatim from `excluded`
   * — so `em.upsert`'s `onConflictMergeFields` expresses it directly,
   * `PluginUserConfigRepository.upsertConfig`'s own precedent for a plain
   * (non-merging) composite upsert.
   */
  async upsertTask(input: PluginScheduledTaskUpsertInput): Promise<void> {
    await this.upsert(
      {
        plugin_id: input.plugin_id,
        name: input.name,
        due_at: input.due_at,
        payload: input.payload,
        every_ms: input.every_ms,
      },
      {
        onConflictFields: ['plugin_id', 'name'],
        onConflictAction: 'merge',
        onConflictMergeFields: ['due_at', 'payload', 'every_ms'],
      },
    );
  }

  /** HR8 — `DELETE FROM plugin_scheduled_tasks WHERE plugin_id = ? AND name = ?` (`scheduler.cancel`), returning whether a row existed (`.changes > 0`). */
  async deleteByPluginAndName(pluginId: string, name: string): Promise<boolean> {
    const changed = await this.nativeDelete({ plugin_id: pluginId, name });
    return changed > 0;
  }

  /**
   * Plan 3j Task 7 fix wave, must-land 3 (task-7-review.md): HR5 (the
   * pre-write existence check), HR6 (the `SCHED_MAX` count gate) and HR7
   * (the upsert) made atomic — the SAME shape and SAME reason as
   * `PluginEntityMetadataRepository.upsertValueCapped` (must-land 2): two
   * concurrent `scheduler.set` calls for two different new task names on the
   * same plugin could both read `count < max` before either's write landed
   * (live: 130 rows on a 100 cap). `this.getEntityManager().transactional` —
   * no new constructor dependency on `HostSurfaceRpc`, for the same
   * `tests/helpers/plugin-host.ts` (dirty, mid-edit by a concurrent Plan 4
   * task) reason `upsertValueCapped`'s docstring gives. Returns whether the
   * write happened; `false` means a NEW task name was blocked by the cap.
   */
  async upsertTaskCapped(input: PluginScheduledTaskUpsertInput, maxTasks: number): Promise<boolean> {
    return this.getEntityManager().transactional(async () => {
      const exists = await this.existsForPluginAndName(input.plugin_id, input.name);
      if (!exists) {
        const n = await this.countForPlugin(input.plugin_id);
        if (n >= maxTasks) return false;
      }
      await this.upsertTask(input);
      return true;
    });
  }
}
