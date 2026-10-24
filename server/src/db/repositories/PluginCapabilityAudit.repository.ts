import type { PluginCapabilityAudit } from '../entities/PluginCapabilityAudit.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/**
 * Plan 3j Task 2 note: this repository's ONLY method today is the uninstall
 * cascade's own delete (PR45) — R-hash-chain's own read/append/prune surface
 * (`host/plugin-audit.ts`) belongs to Task 3, which adds its own additive
 * methods to this same repository. Do NOT confuse this table with the global,
 * admin-facing `audit_log` (3i's `AuditLogRepository`) — two unrelated "audit"
 * systems (plan3j-inputs.md corrections §4).
 *
 * Plan 3j Task 3 note: the methods below are the promised additive surface —
 * `pruneKeepingNewest`/`lastHash`/`insertRow`/`forUser`/`forPlugin`/`budgetSeed`,
 * backing `host/plugin-audit.ts` (R-hash-chain) and `host/plugin-host-state.ts`'s
 * `budgetFor` seed read (HS1). PR45's `deleteAllForPlugin` above is untouched.
 */
export class PluginCapabilityAuditRepository extends TrekRepository<PluginCapabilityAudit> {
  /** PR45 (uninstall cascade, `deleteData` branch) — `DELETE FROM plugin_capability_audit WHERE plugin_id = ?`. */
  async deleteAllForPlugin(pluginId: string): Promise<void> {
    await this.nativeDelete({ plugin_id: pluginId });
  }

  // -----------------------------------------------------------------------
  // Plan 3j Task 3 — R-hash-chain (host/plugin-audit.ts) + HS1 (plugin-host-state.ts)
  // -----------------------------------------------------------------------

  /**
   * PA1 (`pruneAudit`'s amortized retention) — `` DELETE FROM plugin_capability_audit
   * WHERE plugin_id = ? AND id NOT IN (SELECT id FROM plugin_capability_audit WHERE
   * plugin_id = ? ORDER BY id DESC LIMIT ?) ``. Same `NOT IN (subquery … ORDER BY …
   * LIMIT)` shape as `PluginErrorLogRepository#pruneKeepingRecent` — no `nativeDelete`/
   * `FilterQuery` equivalent (no correlated-subquery support), so this goes through
   * `this.kysely()` (`_shared/trek-repository.ts`'s escape hatch). The `keep` count is
   * a `?`-bound `limit()` call, never interpolated into SQL text.
   */
  async pruneKeepingNewest(pluginId: string, keep: number): Promise<void> {
    const db = this.kysely<PluginCapabilityAuditKyselyDB>();
    await db
      .deleteFrom('plugin_capability_audit')
      .where('plugin_id', '=', pluginId)
      .where(
        'id',
        'not in',
        db
          .selectFrom('plugin_capability_audit')
          .select('id')
          .where('plugin_id', '=', pluginId)
          .orderBy('id', 'desc')
          .limit(keep),
      )
      .execute();
  }

  /**
   * PA2 (`appendAudit`'s chain read) — `SELECT hash FROM plugin_capability_audit
   * WHERE plugin_id = ? ORDER BY id DESC LIMIT 1`. `null` means "no prior row for
   * this plugin" (a fresh chain) — `appendAudit` folds that into `''` the same way
   * the legacy `?.hash ?? ''` did.
   */
  async lastHash(pluginId: string): Promise<string | null> {
    const row = await this.findOne({ plugin_id: pluginId }, { fields: ['hash'], orderBy: { id: 'desc' } });
    return row?.hash ?? null;
  }

  /**
   * PA3 (`appendAudit`'s own write) — `INSERT INTO plugin_capability_audit
   * (plugin_id, acting_user_id, method, resource, code, ts, prev_hash, hash)
   * VALUES (?,?,?,?,?,?,?,?)`. The hash itself (and `ts`, computed in JS as
   * `new Date().toISOString()` BEFORE the hash) is computed by the caller —
   * `appendAudit` in `host/plugin-audit.ts` — never here: this method persists
   * the already-hashed row byte-for-byte, so R-hash-chain's construction stays
   * visible and testable in one place.
   */
  async insertRow(entry: NewAuditRow): Promise<void> {
    await this.insert({
      plugin_id: entry.plugin_id,
      acting_user_id: entry.acting_user_id,
      method: entry.method,
      resource: entry.resource,
      code: entry.code,
      ts: entry.ts,
      prev_hash: entry.prev_hash,
      hash: entry.hash,
    });
  }

  /**
   * PA4 (`readAuditForUser`) — `SELECT a.ts, a.plugin_id, p.name AS plugin_name,
   * a.method, a.resource, a.code FROM plugin_capability_audit a LEFT JOIN plugins
   * p ON p.id = a.plugin_id WHERE a.acting_user_id = ? ORDER BY a.id DESC LIMIT ?`.
   * Kysely against the literal `plugins` table, the same `AuditLogRepository
   * #listPage` LEFT-JOIN precedent (a deleted/never-existing plugin leaves
   * `plugin_name` null, the row itself still returned) — no `PluginsRepository`
   * dependency: the join only needs the table, not that repository's own methods.
   */
  async forUser(userId: number, limit: number): Promise<AuditForUserRow[]> {
    const rows = await this.kysely<PluginCapabilityAuditKyselyDB>()
      .selectFrom('plugin_capability_audit as a')
      .leftJoin('plugins as p', 'p.id', 'a.plugin_id')
      .select(['a.ts', 'a.plugin_id', 'p.name as plugin_name', 'a.method', 'a.resource', 'a.code'])
      .where('a.acting_user_id', '=', userId)
      .orderBy('a.id', 'desc')
      .limit(limit)
      .execute();
    return rows.map((r) => ({
      ts: r.ts,
      plugin_id: r.plugin_id,
      plugin_name: r.plugin_name ?? null,
      method: r.method,
      resource: r.resource,
      code: r.code,
    }));
  }

  /**
   * PA5 (`readAudit`, admin per-plugin view) — `SELECT ts, acting_user_id, method,
   * resource, code FROM plugin_capability_audit WHERE plugin_id = ? ORDER BY id
   * DESC LIMIT ?`.
   */
  async forPlugin(pluginId: string, limit: number): Promise<AuditForPluginRow[]> {
    const rows = await this.find(
      { plugin_id: pluginId },
      { fields: ['ts', 'acting_user_id', 'method', 'resource', 'code'], orderBy: { id: 'desc' }, limit },
    );
    return rows.map((r) => ({
      ts: r.ts,
      acting_user_id: r.acting_user_id ?? null,
      method: r.method,
      resource: r.resource ?? null,
      code: r.code,
    }));
  }

  /**
   * HS1 (`plugin-host-state.ts#budgetFor`'s seed read) — `SELECT method, COUNT(*)
   * AS n FROM plugin_capability_audit WHERE plugin_id = ? AND code = 'ok' AND
   * ts >= ? AND method IN ('ai.complete','ai.extract','notify.send') GROUP BY
   * method`. A GROUP BY aggregate — Kysely, same escape-hatch rule as PA1/PA4.
   */
  async budgetSeed(pluginId: string, since: string): Promise<Array<{ method: string; n: number }>> {
    const rows = await this.kysely<PluginCapabilityAuditKyselyDB>()
      .selectFrom('plugin_capability_audit')
      .select(({ fn }) => ['method', fn.count<number>('id').as('n')])
      .where('plugin_id', '=', pluginId)
      .where('code', '=', 'ok')
      .where('ts', '>=', since)
      .where('method', 'in', ['ai.complete', 'ai.extract', 'notify.send'])
      .groupBy('method')
      .execute();
    return rows.map((r) => ({ method: r.method, n: Number(r.n) }));
  }
}

/** The column set `insertRow` writes — everything `appendAudit` has already computed. */
export interface NewAuditRow {
  plugin_id: string;
  acting_user_id: number | null;
  method: string;
  resource: string | null;
  code: string;
  ts: string;
  prev_hash: string | null;
  hash: string;
}

/** `forUser`'s own projection (PA4). */
export interface AuditForUserRow {
  ts: string;
  plugin_id: string;
  plugin_name: string | null;
  method: string;
  resource: string | null;
  code: string;
}

/** `forPlugin`'s own projection (PA5). */
export interface AuditForPluginRow {
  ts: string;
  acting_user_id: number | null;
  method: string;
  resource: string | null;
  code: string;
}

/** The tables `pruneKeepingNewest`/`forUser`/`budgetSeed`'s escape-hatch queries touch. */
type PluginCapabilityAuditKyselyDB = Pick<DB, 'plugin_capability_audit' | 'plugins'>;
