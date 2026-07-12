import { Injectable, type OnModuleInit, type OnModuleDestroy } from '@nestjs/common';
import semver from 'semver';
import { db } from '../../db/database';
import { pluginsEnabled } from './kill-switch';
import { setPluginEventSink } from '../../plugin-event-sink';
import { setUserDeletedSink } from '../../plugin-user-lifecycle';
import { setPluginChannelSource, pluginChannelId, type ChannelMessage, type ExternalChannel } from '../../services/notifications/channelRegistry';
import { readUserSettingsDecrypted, hasRequiredUserSettings } from './plugins.service';
import { PLUGIN_CHANNEL_EVENTS } from './install/manifest';
import { stripEmoji } from './text-sanitize';
import { applyStagedPluginTrees, setStagedRestoreApplier } from './plugin-backup';
import { decrypt_api_key } from '../../services/apiKeyCrypto';
import { PluginSupervisor, type PluginRouteInfo } from './supervisor/plugin-supervisor';
import fs from 'node:fs';
import path from 'node:path';
import { createRealRpcHost, closePluginDataDb } from './host/create-rpc-host';
import { ForbiddenResource } from './host/rpc-host';
import { removePluginData } from './host/plugin-data.service';
import { isKnownPermission } from './protocol/envelope';
import { discoverPlugins } from './install/discovery';
import { parseJsonText, parseManifest } from './install/manifest';
import { scanForNativeBinaries } from './install/native-scan';
import { devLinkEnabled, DEV_LINK_SOURCE } from './dev-link';
import { pluginCodeDir, pluginDataDir } from './paths';
import { PluginRegistryService } from './registry/registry.service';
import { isAddonEnabled } from '../../services/adminService';
import type { PluginDependency } from './install/manifest';
import type { VersionMismatch, PluginDepRow } from './dependencies';
import { parseDependencies, disabledRequiredAddons, resolveDependencyState, enableOrder, findDependentsTransitive, DependencyCycleError } from './dependencies';

const HTTP_OUTBOUND = 'http:outbound:';

// Mirrors HOST_RE in install/manifest.ts: an exact hostname or a `*.`-prefixed wildcard
// with a real multi-label suffix. Rejects a bare `*`, a whole-TLD wildcard, a scheme and
// any embedded space — the string is interpolated into the egress guard and the CSP.
const EGRESS_HOST_RE = /^(\*\.[a-z0-9-]+(\.[a-z0-9-]+)+|[a-z0-9-]+(\.[a-z0-9-]+)*)$/i;

/** Hosts an admin added post-install for a plugin that declared `operatorEgress`. */
function operatorEgressHosts(id: string): string[] {
  try {
    return (db.prepare('SELECT host FROM plugin_egress_hosts WHERE plugin_id = ? ORDER BY host').all(id) as Array<{ host: string }>)
      .map((r) => r.host);
  } catch {
    return []; // table absent (a slimmed test app) — never block activation
  }
}

/**
 * Remove `<plugins>/<id>` whether it is a real directory, a POSIX symlink or a
 * Windows junction — WITHOUT ever following a dev-link into (and deleting) the
 * author's source. A symlink is unlinked; a junction (which lstats as a directory
 * on Windows) is rmdir'd (drops the reparse point, not the target); a real dir is
 * recursively removed. A no-op if nothing is there.
 */
function removePluginCodeEntry(dest: string): void {
  let lst: fs.Stats;
  try {
    lst = fs.lstatSync(dest);
  } catch {
    return; // nothing to remove
  }
  if (lst.isSymbolicLink()) {
    fs.unlinkSync(dest); // POSIX symlink -> drop the link only
    return;
  }
  if (process.platform === 'win32' && lst.isDirectory()) {
    // A junction lstats as a directory; rmdir removes the junction itself, not the
    // target. A REAL non-empty dir throws ENOTEMPTY -> fall through to a full remove.
    try {
      fs.rmdirSync(dest);
      return;
    } catch {
      /* real, non-empty directory */
    }
  }
  fs.rmSync(dest, { recursive: true, force: true });
}

/** Thrown when (re-)activating would grant permissions the admin hasn't consented to. */
export class PluginConsentRequired extends Error {
  constructor(message: string, readonly newPermissions: string[] = [], readonly newEgress: string[] = []) {
    super(message);
  }
}

export type PluginDependencyCode = 'ADDON_DISABLED' | 'DEPENDENCY_MISSING';

/**
 * Thrown when a plugin can't activate because a required addon is disabled or a
 * declared plugin dependency is missing / version-mismatched. The controller maps
 * it to a 409 carrying `code` + `detail` so the admin UI can offer the right fix.
 */
export class PluginDependencyError extends Error {
  constructor(
    message: string,
    readonly code: PluginDependencyCode,
    readonly detail: { addons?: string[]; missing?: PluginDependency[]; versionMismatch?: VersionMismatch[] } = {},
  ) {
    super(message);
    this.name = 'PluginDependencyError';
  }
}

/**
 * Owns the isolated-plugin runtime lifecycle inside NestJS (#plugins, M2).
 * Bridges the DB registry (`plugins` rows) to the process supervisor: activate
 * spawns the child with its granted permissions + decrypted instance config,
 * deactivate kills it, and status/errors are persisted back to the DB. Boots all
 * `active` plugins on startup when the runtime is enabled.
 */

@Injectable()
export class PluginRuntimeService implements OnModuleInit, OnModuleDestroy {
  // The rpc-host factory is bound to `this` as the inter-plugin router, so a
  // plugin's ctx.plugins.call / ctx.events.emit resolve through callPlugin/
  // emitPluginEvent below (which own the dependency-edge authorization).
  private readonly supervisor = new PluginSupervisor((id, granted) => createRealRpcHost(id, granted, this), {
    // Both hooks run from child lifecycle EventEmitter callbacks (exit / stderr 'data'),
    // so a throw here becomes an uncaughtException that has no host-side handler. During a
    // restore the core DB is briefly CLOSED (closeDb → the db proxy throws on access), so a
    // status/log write in that window would otherwise take the whole process down mid-
    // restore. Swallow any DB error — a missed status row / log line is never worth a crash.
    onStatus: (id, status, error) => {
      try {
        db.prepare('UPDATE plugins SET status = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, error ?? null, id);
      } catch { /* DB unavailable (e.g. mid-restore) — a status write must never crash the host */ }
    },
    onLog: (id, level, msg) => {
      if (level !== 'error' && level !== 'warn') return;
      try {
        db.prepare('INSERT INTO plugin_error_log (plugin_id, level, message) VALUES (?, ?, ?)').run(id, level, msg);
        // Retention: a crash-looping plugin emits a stderr line per restart, so an
        // uncapped table grows without bound in the shared trek.db. Keep only the
        // most recent LOG_RETENTION rows per plugin (the admin view shows 200).
        pruneErrorLog(id);
      } catch { /* DB unavailable — a log line must never crash the host */ }
    },
  });

  // Filesystem watchers for dev-linked plugins (id -> watcher), so a rebuild of the
  // author's source auto-reloads. Empty unless dev-link is used.
  private readonly linkWatchers = new Map<string, fs.FSWatcher>();

  // Sweeps plugin_scheduled_tasks for due callbacks and fires them on active plugins.
  private schedulerSweep: ReturnType<typeof setInterval> | null = null;
  // Coalesces overlapping erasure drains (the sweep and enqueue both trigger one).
  private drainInFlight: Promise<void> | null = null;

  // Optional at the type level so tests can `new PluginRuntimeService()` without a
  // registry; Nest always injects the real one (the provider is in the module).
  constructor(private readonly registry?: PluginRegistryService) {}

  onModuleInit(): void {
    if (!pluginsEnabled()) return;
    // If a restore staged plugin trees, swap them into place NOW — before we open any
    // plugin DB below. This is where a restored backup's plugin data/code actually
    // takes effect (the restore itself only stages, since the runtime holds the DBs
    // open). No-op when nothing was staged. Defensive: never blocks boot.
    try {
      const applied = applyStagedPluginTrees();
      if (applied.length) console.log(`[plugins] applied staged restore: ${applied.join(', ')}`);
    } catch { /* reconcile must never stop the server from starting */ }
    // Let a live restore apply its staged plugin trees IMMEDIATELY instead of leaving
    // them for an arbitrary future boot: quiesce every plugin (closing its DB handles)
    // then swap. Plugins stay down until the app restart the restore already requires.
    setStagedRestoreApplier(async () => {
      await this.supervisor.shutdownAll();
      applyStagedPluginTrees();
    });
    // Forward core trip events to plugins that subscribed (events:subscribe). The
    // sink is name-only + fire-and-forget, so it can never block a core broadcast.
    setPluginEventSink((tripId, event, meta) => this.supervisor.deliverEvent(tripId, event, meta));
    // Expose plugin notification channels to the (plain, non-Nest) notification
    // service. Pull-based: it calls this on every dispatch, so enabling or removing
    // a plugin takes effect immediately with nothing to invalidate.
    setPluginChannelSource(() => this.notificationChannels());
    // Fan a deleted account out to plugins so they can erase their own per-user data.
    // Enqueued durably (survives restart), so nothing is lost if a plugin is offline.
    setUserDeletedSink((userId) => this.enqueueUserErasure(userId));
    // Discover plugins placed on the volume (registers new ones inactive), then
    // boot the ones an admin had already activated — in dependency order so a
    // plugin's dependencies come up before it does. The whole block is defensive:
    // boot must NEVER block app init, even in a context without plugin tables
    // (e.g. a slimmed-down test app that only imports AdminModule).
    try {
      discoverPlugins(db);
      const installed = this.installedDepRows();
      const enabledIds = [...installed.values()].filter((r) => r.enabled).map((r) => r.id);
      let order: string[];
      try {
        order = enableOrder(enabledIds, installed);
      } catch {
        // A cycle among enabled plugins — fall back to arbitrary order; each plugin's
        // own gate still refuses to spawn, so nothing boots into a broken state.
        order = enabledIds;
      }
      for (const id of order) {
        this.activate(id).catch((e) => {
          // A plugin whose required addon is off (or a dependency is missing) at boot
          // must not stay marked enabled — reconcile the row so the UI reflects reality.
          if (e instanceof PluginDependencyError || e instanceof DependencyCycleError) {
            this.deactivate(id).catch(() => {});
          }
          /* other failures: status is persisted as error by the supervisor hook */
        });
      }
    } catch {
      /* discovery/boot must never block app init */
    }
    // Fire due scheduled tasks (persistent, userless) on a coarse tick — the
    // scheduler is minute-granularity by contract, so 30s precision is plenty and
    // cheap. Unref'd so it never holds the process open.
    this.schedulerSweep = setInterval(() => {
      this.fireDueScheduled();
      void this.drainUserErasures();
    }, 30_000);
    this.schedulerSweep.unref?.();
  }

  /** Fire every scheduled task that is due on an ACTIVE plugin; re-arm recurring
   * ones, delete one-shots. The row is re-armed/deleted BEFORE the fire so a crash
   * mid-callback can't double-fire; an inactive plugin's tasks are left untouched so
   * they run on the next sweep after it reactivates. Never throws. */
  private fireDueScheduled(): void {
    if (!pluginsEnabled()) return;
    try {
      // Scope the window to ACTIVE plugins so a backlog of past-due rows belonging to
      // inactive plugins can't fill the LIMIT and starve active plugins' timers.
      const active = this.supervisor.activeIds();
      if (active.length === 0) return;
      const now = Date.now();
      const ph = active.map(() => '?').join(',');
      const due = db
        .prepare(`SELECT id, plugin_id, name, payload, every_ms FROM plugin_scheduled_tasks WHERE due_at <= ? AND plugin_id IN (${ph}) ORDER BY due_at LIMIT 200`)
        .all(now, ...active) as Array<{ id: number; plugin_id: string; name: string; payload: string; every_ms: number | null }>;
      for (const t of due) {
        if (!this.supervisor.isActive(t.plugin_id)) continue; // leave for a later sweep
        if (t.every_ms) db.prepare('UPDATE plugin_scheduled_tasks SET due_at = ? WHERE id = ?').run(now + t.every_ms, t.id);
        else db.prepare('DELETE FROM plugin_scheduled_tasks WHERE id = ?').run(t.id);
        let payload: unknown = null;
        try { payload = JSON.parse(t.payload); } catch { /* corrupt payload -> null */ }
        this.supervisor.deliverScheduled(t.plugin_id, t.name, payload);
      }
    } catch {
      /* a sweep must never break the runtime */
    }
  }

  /** Queue a GDPR erasure for every installed plugin that holds hook:user-data, then
   * try to deliver immediately. Persisted first (INSERT OR IGNORE, idempotent) so the
   * erasure survives a restart and reaches a plugin that is offline right now. Never
   * throws — a bookkeeping error must not fail the account deletion that triggered it. */
  private enqueueUserErasure(userId: number): void {
    try {
      const rows = db.prepare('SELECT id, permissions FROM plugins').all() as Array<{ id: string; permissions: string | null }>;
      const insert = db.prepare('INSERT OR IGNORE INTO plugin_user_erasure_queue (plugin_id, user_id) VALUES (?, ?)');
      for (const r of rows) {
        let perms: unknown;
        try { perms = JSON.parse(r.permissions ?? '[]'); } catch { perms = []; }
        if (Array.isArray(perms) && perms.includes('hook:user-data')) insert.run(r.id, userId);
      }
    } catch {
      /* enqueue is best-effort; a later sweep reconciles from whatever landed */
    }
    void this.drainUserErasures();
  }

  /** Deliver queued erasures to active plugins, dropping each row only once the plugin
   * ACKs. Rows for inactive plugins are left for a later sweep / their reactivation.
   * Never throws. */
  private drainUserErasures(): Promise<void> {
    // Coalesce onto the drain already in flight. Both the 30s sweep and enqueue trigger
    // a drain, and a pass awaits per-row delivery (up to the invoke timeout each), so
    // running two concurrently would select the SAME rows and deliver an erasure twice.
    // A caller that awaits still waits for a full pass (the in-flight one).
    if (this.drainInFlight) return this.drainInFlight;
    this.drainInFlight = this.runDrainOnce().finally(() => { this.drainInFlight = null; });
    return this.drainInFlight;
  }

  private async runDrainOnce(): Promise<void> {
    if (!pluginsEnabled()) return;
    try {
      // Reap a queued erasure only when its plugin is gone from the registry AND its data
      // dir is actually deleted — then the data (and the obligation) is truly gone. A plugin
      // uninstalled with "keep data" (deleteData=false) removes the plugins row but
      // DELIBERATELY keeps the data dir and the queue row so a same-id reinstall can still
      // honour the erasure (see uninstall()); reaping on registry-absence alone would wipe
      // exactly those preserved obligations. A deleteData=true uninstall already clears the
      // rows itself, so this only ever needs to catch a truly orphaned data dir.
      const orphans = db
        .prepare('SELECT DISTINCT plugin_id FROM plugin_user_erasure_queue WHERE plugin_id NOT IN (SELECT id FROM plugins)')
        .all() as Array<{ plugin_id: string }>;
      for (const { plugin_id } of orphans) {
        if (!fs.existsSync(pluginDataDir(plugin_id))) {
          db.prepare('DELETE FROM plugin_user_erasure_queue WHERE plugin_id = ?').run(plugin_id);
        }
      }
      // Only ACTIVE plugins can be delivered to; scope the window to them so a backlog
      // of erasures for permanently-inactive plugins can't starve deliverable ones.
      const active = this.supervisor.activeIds();
      if (active.length === 0) return;
      const ph = active.map(() => '?').join(',');
      const pending = db
        .prepare(`SELECT id, plugin_id, user_id FROM plugin_user_erasure_queue WHERE plugin_id IN (${ph}) ORDER BY id LIMIT 200`)
        .all(...active) as Array<{ id: number; plugin_id: string; user_id: number }>;
      for (const row of pending) {
        if (!this.supervisor.isActive(row.plugin_id)) continue; // retry after it reactivates
        const done = await this.supervisor.deliverUserErasure(row.plugin_id, row.user_id);
        if (done) db.prepare('DELETE FROM plugin_user_erasure_queue WHERE id = ?').run(row.id);
      }
    } catch {
      /* a drain pass must never break the runtime */
    }
  }

  /** GDPR portability: aggregate what every granted plugin holds about a user. An active
   * plugin whose export ERRORED and an inactive granted plugin are both flagged `pending`
   * (rather than silently omitted), so the export never reads as complete while missing data. */
  async exportUserData(userId: number): Promise<Array<{ pluginId: string; data?: unknown; pending?: boolean; settings?: Record<string, unknown>; oauthConnected?: boolean }>> {
    const out: Array<{ pluginId: string; data?: unknown; pending?: boolean; settings?: Record<string, unknown>; oauthConnected?: boolean }> = [];
    if (!pluginsEnabled()) return out;
    const rows = db.prepare('SELECT id, permissions FROM plugins').all() as Array<{ id: string; permissions: string | null }>;
    for (const r of rows) {
      if (this.supervisor.isActive(r.id)) {
        const res = await this.supervisor.collectUserExport(r.id, userId);
        if (res === undefined) continue;                       // not granted → nothing to export
        if (res.ok) out.push({ pluginId: r.id, data: res.data });
        else out.push({ pluginId: r.id, pending: true });      // errored/timed out → incomplete, retryable
      } else {
        // An inactive plugin can't export now — but if it holds hook:user-data it MAY
        // hold this user's data. Flag it as pending (rather than silently omitting it)
        // so the admin knows to reactivate it to complete a data-access request.
        let perms: unknown;
        try { perms = JSON.parse(r.permissions ?? '[]'); } catch { perms = []; }
        if (Array.isArray(perms) && perms.includes('hook:user-data')) out.push({ pluginId: r.id, pending: true });
      }
    }

    // Fold in the host-side per-user data TREK stores itself (what erasePluginUserData
    // deletes) so an access request isn't asymmetric with erasure: the user's plugin
    // settings (secret fields masked) and which plugins they OAuth-linked. Raw tokens
    // are never exported. This is supplementary to each plugin's own-db export above, so
    // an unexpected failure here must not drop that primary data — it's best-effort.
    try {
      const byId = new Map(out.map((o) => [o.pluginId, o]));
      const entryFor = (pluginId: string) => {
        let e = byId.get(pluginId);
        if (!e) { e = { pluginId }; out.push(e); byId.set(pluginId, e); }
        return e;
      };
      const secretKeys = new Map<string, Set<string>>();
      for (const f of db.prepare("SELECT plugin_id, field_key FROM plugin_settings_fields WHERE scope = 'user' AND secret = 1").all() as Array<{ plugin_id: string; field_key: string }>) {
        let s = secretKeys.get(f.plugin_id);
        if (!s) { s = new Set(); secretKeys.set(f.plugin_id, s); }
        s.add(f.field_key);
      }
      for (const c of db.prepare('SELECT plugin_id, config FROM plugin_user_config WHERE user_id = ?').all(userId) as Array<{ plugin_id: string; config: string }>) {
        let cfg: Record<string, unknown> = {};
        try { cfg = JSON.parse(c.config || '{}'); } catch { /* ignore */ }
        const secrets = secretKeys.get(c.plugin_id) ?? new Set<string>();
        const masked: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(cfg)) masked[k] = secrets.has(k) ? '***' : v;
        entryFor(c.plugin_id).settings = masked;
      }
      for (const t of db.prepare('SELECT DISTINCT plugin_id FROM plugin_oauth_tokens WHERE user_id = ?').all(userId) as Array<{ plugin_id: string }>) {
        entryFor(t.plugin_id).oauthConnected = true;
      }
    } catch (err) {
      console.warn('[plugins] GDPR export: host-side settings/oauth fold failed', err);
    }
    return out;
  }

  /**
   * Disable every plugin that can no longer run now that `addonId` was turned off:
   * plugins that require the addon, plus everything that (transitively) depends on
   * them. Called from the admin addon-toggle handler. No-op for an addon no plugin
   * requires. Returns the ids actually deactivated.
   */
  async deactivateForDisabledAddon(addonId: string): Promise<string[]> {
    const rows = db.prepare('SELECT id, version, enabled, dependencies FROM plugins').all() as PluginDepRow[];
    const directlyAffected = rows
      .filter((r) => r.enabled && parseDependencies(r.dependencies).requiredAddons.includes(addonId))
      .map((r) => r.id);
    const affected = new Set<string>(directlyAffected);
    for (const id of directlyAffected) for (const dep of findDependentsTransitive(id, rows)) affected.add(dep);
    const enabledById = new Map(rows.map((r) => [r.id, r.enabled]));
    const toDisable = [...affected].filter((id) => enabledById.get(id));
    for (const id of toDisable) await this.deactivate(id).catch(() => {});
    return toDisable;
  }

  /** Re-scan the plugins volume on demand (admin action). */
  rescan(): { discovered: string[]; skipped: string[] } {
    return discoverPlugins(db);
  }

  async onModuleDestroy(): Promise<void> {
    setPluginEventSink(null);
    setUserDeletedSink(null);
    setStagedRestoreApplier(null);
    if (this.schedulerSweep) { clearInterval(this.schedulerSweep); this.schedulerSweep = null; }
    for (const w of this.linkWatchers.values()) {
      try { w.close(); } catch { /* ignore */ }
    }
    this.linkWatchers.clear();
    await this.supervisor.shutdownAll();
  }

  /**
   * Spawn a plugin from its DB row (granted permissions + decrypted config).
   *
   * A plain activate may NEVER widen what the admin already consented to — that is
   * what stops a plugin left off pending an update's re-consent from silently
   * gaining the new rights via the row's enable toggle. The FIRST activation of a
   * freshly-installed plugin (no prior grant) is itself the consent for its
   * declared set; widening an already-consented set requires `consentWiden` (the
   * update consent dialog), and otherwise throws PluginConsentRequired.
   */
  async activate(id: string, consentWiden = false): Promise<void> {
    const installed = this.installedDepRows();
    // Deps-first order over the installed graph (throws DependencyCycleError on a
    // cycle). Missing deps aren't in `installed` so they don't appear here — the
    // per-node gate reports those separately.
    const order = enableOrder([id], installed);
    const rootInstalled = installed.has(id);

    // Read-only pre-flight over the whole chain BEFORE mutating anything, so a
    // blocked dependency never leaves the chain half-activated. Only the target
    // may consent-widen; dependencies are auto-enabled at their existing grant.
    const toCheck = rootInstalled ? order : [id];
    for (const nodeId of toCheck) this.assertActivatable(nodeId, installed, nodeId === id ? consentWiden : false);

    // Enable dependencies first (skip ones already enabled), then the target.
    for (const nodeId of order) {
      if (nodeId !== id && installed.get(nodeId)?.enabled) continue;
      await this.spawnActivated(nodeId);
    }
  }

  /** All plugin rows projected to what the dependency helpers reason over. */
  private installedDepRows(): Map<string, PluginDepRow> {
    const rows = db.prepare('SELECT id, version, enabled, dependencies FROM plugins').all() as PluginDepRow[];
    return new Map(rows.map((r) => [r.id, r]));
  }

  /**
   * Read-only activation gate for one plugin — throws (without mutating) if it may
   * not activate. Checks run most- to least-severe: permission re-consent →
   * required addon disabled → missing/mismatched plugin dependency.
   */
  private assertActivatable(id: string, installed: Map<string, PluginDepRow>, consentWiden: boolean): void {
    const row = db.prepare('SELECT permissions, granted_permissions, dependencies FROM plugins WHERE id = ?').get(id) as
      | { permissions: string; granted_permissions: string; dependencies: string | null }
      | undefined;
    if (!row) throw new Error(`plugin ${id} not found`);

    const declared = parseArray(row.permissions).filter(isKnownPermission);
    const granted = parseArray(row.granted_permissions);
    const newGrants = declared.filter((p) => !granted.includes(p));
    // "Ever consented" is a non-empty granted_permissions string (even '[]' — the
    // consent to zero perms). Only the very first activation (marker '') may grant
    // the declared set without an explicit consent; any later widening needs one.
    const everConsented = !!row.granted_permissions;
    if (everConsented && newGrants.length > 0 && !consentWiden) {
      const newEgress = newGrants.filter((p) => p.startsWith(HTTP_OUTBOUND)).map((p) => p.slice(HTTP_OUTBOUND.length)).filter(Boolean);
      const newPermissions = newGrants.filter((p) => !p.startsWith(HTTP_OUTBOUND));
      throw new PluginConsentRequired(`plugin ${id} requests new permissions; explicit re-consent is required`, newPermissions, newEgress);
    }

    const deps = parseDependencies(row.dependencies);
    const disabledAddons = disabledRequiredAddons(deps, isAddonEnabled);
    if (disabledAddons.length) {
      throw new PluginDependencyError(`plugin ${id} requires disabled addon(s): ${disabledAddons.join(', ')}`, 'ADDON_DISABLED', {
        addons: disabledAddons,
      });
    }
    const state = resolveDependencyState(deps, installed);
    if (state.missing.length || state.versionMismatch.length) {
      throw new PluginDependencyError(`plugin ${id} has unmet plugin dependencies`, 'DEPENDENCY_MISSING', {
        missing: state.missing,
        versionMismatch: state.versionMismatch,
      });
    }
  }

  /** Mark a (pre-validated) plugin enabled and spawn its child. */
  private async spawnActivated(id: string): Promise<void> {
    const row = db.prepare('SELECT permissions, config FROM plugins WHERE id = ?').get(id) as
      | { permissions: string; config: string }
      | undefined;
    if (!row) throw new Error(`plugin ${id} not found`);
    const declared = parseArray(row.permissions).filter(isKnownPermission);
    // Mark it enabled (admin intent) so it reboots after restarts/crashes.
    db.prepare('UPDATE plugins SET granted_permissions = ?, enabled = 1 WHERE id = ?').run(JSON.stringify(declared), id);
    const config = decryptConfig(parseObject(row.config));
    const manifestHosts = declared.filter((p) => p.startsWith(HTTP_OUTBOUND)).map((p) => p.slice(HTTP_OUTBOUND.length));
    // Union in the hosts the ADMIN added post-install. A plugin that talks to a
    // self-hosted service can't name the operator's hostname in its manifest, so without
    // this a community plugin (a Gotify channel, an ntfy channel) serves nobody. Only a
    // plugin that DECLARED operatorEgress can have hosts, so the install-time consent
    // still bounds what is possible — and it is always the admin, never an end user,
    // who widens it. The egress list is spawn-time only, which is why changing it
    // re-spawns the plugin (see setOperatorEgressHosts).
    const egress = [...new Set([...manifestHosts, ...operatorEgressHosts(id)])];
    await this.supervisor.activate(id, new Set(declared), config, egress);
  }

  /** Hosts an admin added for this plugin (empty unless it declared `operatorEgress`). */
  operatorEgressHosts(id: string): string[] {
    return operatorEgressHosts(id);
  }

  /** Does this plugin's manifest declare that it needs operator-supplied hosts? */
  wantsOperatorEgress(id: string): boolean {
    const row = db.prepare('SELECT operator_egress FROM plugins WHERE id = ?').get(id) as { operator_egress: number } | undefined;
    return row?.operator_egress === 1;
  }

  /**
   * Replace the admin-supplied egress hosts for a plugin, then RE-SPAWN it so the child's
   * guard picks the new list up — `installEgressGuard` runs once at init and a second
   * `init` is deliberately refused, so there is no way to widen a live child's allow-list.
   */
  async setOperatorEgressHosts(id: string, hosts: string[]): Promise<string[]> {
    if (!this.wantsOperatorEgress(id)) {
      throw new ForbiddenResource(`plugin ${id} did not declare operatorEgress`);
    }
    const clean: string[] = [];
    for (const raw of hosts) {
      const host = String(raw ?? '').trim().toLowerCase().replace(/\.$/, '');
      if (!host) continue;
      // Same shape the manifest enforces — this string is interpolated into the egress
      // guard AND the iframe CSP connect-src, so a bare `*` or a scheme must never land.
      if (host === '*' || !EGRESS_HOST_RE.test(host)) throw new ForbiddenResource(`invalid host "${raw}"`);
      if (!clean.includes(host)) clean.push(host);
    }
    db.transaction(() => {
      db.prepare('DELETE FROM plugin_egress_hosts WHERE plugin_id = ?').run(id);
      const ins = db.prepare('INSERT OR IGNORE INTO plugin_egress_hosts (plugin_id, host) VALUES (?, ?)');
      for (const h of clean) ins.run(id, h);
    })();
    // Re-spawn so a live child actually gets the new allow-list.
    if (this.isActive(id)) {
      await this.supervisor.disable(id);
      await this.activate(id);
    }
    return clean;
  }

  async deactivate(id: string): Promise<void> {
    await this.supervisor.disable(id);
    closePluginDataDb(id);
    db.prepare("UPDATE plugins SET status = 'inactive', enabled = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  }

  /**
   * Admin-initiated deactivation: turn `id` off AND every plugin that (transitively)
   * depends on it — a dependent can't run without its dependency (its ctx.plugins.call
   * would fail), so it must not be left enabled. Dependents are stopped before the
   * dependency. Returns every id actually deactivated (dependents first, then `id`).
   *
   * This is separate from the low-level `deactivate()` so the internal stop-then-
   * restart of update()/sideload() never disables a plugin's dependents.
   */
  async deactivateWithDependents(id: string): Promise<string[]> {
    const rows = db.prepare('SELECT id, version, enabled, dependencies FROM plugins').all() as PluginDepRow[];
    const enabledById = new Map(rows.map((r) => [r.id, r.enabled]));
    // findDependentsTransitive returns nearest-first; reverse so the deepest dependent
    // (the furthest caller) stops before the plugin it depends on.
    const dependents = findDependentsTransitive(id, rows).filter((d) => enabledById.get(d)).reverse();
    const order = [...dependents, id];
    for (const pid of order) await this.deactivate(pid).catch(() => {});
    return order;
  }

  /**
   * Update a plugin to the registry's latest version with a re-consent gate: the
   * new version's declared permissions are diffed against what the admin already
   * granted. Nothing new → the plugin is transparently restarted on the new code.
   * Anything new (a permission or an outbound host) → the plugin is left INACTIVE
   * and the delta is returned, so the caller can show it and only re-activate on
   * an explicit admin click. An update never silently widens what a plugin may do.
   *
   * Install runs first so a failed download/signature/integrity check leaves the
   * currently-running child untouched (it keeps serving the old code from memory).
   */
  async update(id: string): Promise<{ version: string; activated: boolean; newPermissions: string[]; newEgress: string[] }> {
    const before = db.prepare('SELECT enabled, granted_permissions FROM plugins WHERE id = ?').get(id) as
      | { enabled: number; granted_permissions: string }
      | undefined;
    if (!before) throw new Error(`plugin ${id} not found`);
    if (!this.registry) throw new Error('registry service unavailable');
    const wasEnabled = before.enabled === 1;
    const granted = new Set(parseArray(before.granted_permissions));

    const res = await this.registry.install(id); // swaps code + refreshes declared permissions; keeps granted

    const declared = parseArray(
      (db.prepare('SELECT permissions FROM plugins WHERE id = ?').get(id) as { permissions: string }).permissions,
    ).filter(isKnownPermission);
    const newGrants = declared.filter((p) => !granted.has(p));
    const newEgress = newGrants.filter((p) => p.startsWith(HTTP_OUTBOUND)).map((p) => p.slice(HTTP_OUTBOUND.length)).filter(Boolean);
    const newPermissions = newGrants.filter((p) => !p.startsWith(HTTP_OUTBOUND));

    if (wasEnabled) await this.deactivate(id); // stop the old child now that new code is in place
    if (newGrants.length === 0 && wasEnabled) {
      await this.activate(id); // no wider rights → transparent restart on the new code
      return { version: res.version, activated: true, newPermissions, newEgress };
    }
    // New rights requested (or it was already disabled): leave it inactive until
    // an admin explicitly consents by activating it.
    return { version: res.version, activated: false, newPermissions, newEgress };
  }

  /**
   * Sideload a plugin from an uploaded archive (admin "Upload plugin"). Extracts +
   * validates into staging first, stops any running child of the same id (its code
   * dir is about to be replaced, and on Windows the child holds file locks), then
   * commits it as an INACTIVE sideloaded plugin. Never auto-activates — the admin
   * re-activates (and re-consents to permissions) explicitly.
   */
  async sideload(bytes: Buffer): Promise<{ id: string; version: string; replaced: boolean }> {
    if (!this.registry) throw new Error('registry service unavailable');
    const staged = this.registry.stageUpload(bytes);
    try {
      const replaced = !!db.prepare('SELECT id FROM plugins WHERE id = ?').get(staged.id);
      // Force any replaced plugin INACTIVE before the swap: stop a running child
      // (it holds file locks and would keep executing stale code) AND clear the
      // active flag, so replaced code can never keep running — or even show active
      // — without a fresh activation + permission consent. deactivate() no-ops on
      // a plugin that isn't running.
      if (replaced) await this.deactivate(staged.id);
      this.registry.commitUpload(staged); // moves code + registers INACTIVE, then clears staging
      return { id: staged.id, version: staged.version, replaced };
    } catch (e) {
      // A failure before commitUpload leaves staging behind — clean it up.
      try { fs.rmSync(staged.stagingDir, { recursive: true, force: true }); } catch {}
      throw e;
    }
  }

  /**
   * DEV-ONLY: register a plugin from a LOCAL built directory and hot-reload it
   * against this instance's REAL data. Symlinks `<plugins>/<id>` at the author's
   * dir (so the supervisor forks the local code with ZERO loader change), validates
   * the manifest + refuses native binaries like a sideload, registers it INACTIVE,
   * and starts an fs.watch that re-forks on rebuild. Gated behind TREK_PLUGINS_DEV_LINK
   * on top of the controller's admin + kill-switch gates — see dev-link.ts for why.
   */
  async link(sourceDir: string): Promise<{ id: string; version: string; replaced: boolean }> {
    if (!devLinkEnabled()) throw new Error('dev-link is disabled (set TREK_PLUGINS_DEV_LINK=1)');
    if (!path.isAbsolute(sourceDir)) throw new Error('the dev-link path must be absolute');
    const manifestPath = path.join(sourceDir, 'trek-plugin.json');
    if (!fs.existsSync(manifestPath)) throw new Error(`no trek-plugin.json at ${sourceDir}`);
    const manifest = parseManifest(parseJsonText(fs.readFileSync(manifestPath, 'utf8')));
    if (!fs.existsSync(path.join(sourceDir, 'server', 'index.js'))) {
      throw new Error('no built server/index.js — build the plugin first (the loader runs the compiled artifact, not TS source)');
    }
    if (scanForNativeBinaries(sourceDir).length) throw new Error('directory contains native binaries');

    const id = manifest.id;
    const existing = db.prepare('SELECT source_repo FROM plugins WHERE id = ?').get(id) as { source_repo?: string } | undefined;
    // Never clobber a REAL installed plugin (registry/sideload) — only re-point a link.
    if (existing && existing.source_repo !== DEV_LINK_SOURCE) {
      throw new Error(`a plugin '${id}' is already installed — uninstall it before dev-linking that id`);
    }

    const dest = pluginCodeDir(id);
    const replaced = !!existing;
    if (replaced) await this.deactivate(id); // stop the child (stale code / file locks) before re-pointing
    this.stopWatch(id);
    removePluginCodeEntry(dest); // drop any prior link — never follows into the author's source
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.symlinkSync(sourceDir, dest, 'junction'); // Windows junction (no elevation); POSIX ignores the type -> dir symlink
    discoverPlugins(db); // registers/updates the row from the linked manifest, INACTIVE
    db.prepare(
      `UPDATE plugins SET source_repo = ?, source_commit = NULL, sha256 = NULL, author_pubkey = NULL, status = 'inactive', enabled = 0 WHERE id = ?`,
    ).run(DEV_LINK_SOURCE, id);
    this.watchLinked(id, sourceDir);
    return { id, version: manifest.version, replaced };
  }

  /**
   * DEV-ONLY: re-fork a dev-linked plugin so it picks up freshly-built code. This is
   * the same deactivate->activate primitive the supervisor uses; the acting-user +
   * capability gates are unchanged, so it keeps running against real, membership-gated
   * data. Only re-activates if it was active (preserving the admin's on/off intent);
   * a manifest that widened its permissions still requires explicit re-consent.
   */
  async reload(id: string): Promise<void> {
    if (!devLinkEnabled()) throw new Error('dev-link is disabled (set TREK_PLUGINS_DEV_LINK=1)');
    const row = db.prepare('SELECT source_repo FROM plugins WHERE id = ?').get(id) as { source_repo?: string } | undefined;
    if (!row) throw new Error(`plugin ${id} not found`);
    if (row.source_repo !== DEV_LINK_SOURCE) throw new Error(`plugin ${id} is not dev-linked`);
    const wasActive = this.isActive(id);
    await this.deactivate(id);
    if (wasActive) await this.activate(id);
  }

  /** Best-effort fs.watch on a linked plugin's built output that debounces -> reload. */
  private watchLinked(id: string, sourceDir: string): void {
    this.stopWatch(id);
    const serverDir = path.join(sourceDir, 'server'); // the loader runs server/index.js
    try {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const watcher = fs.watch(serverDir, { recursive: true }, () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if (this.isActive(id)) void this.reload(id).catch(() => {}); // only re-fork a running plugin
        }, 400); // debounce a rebuild's write burst into one re-fork
        timer.unref?.();
      });
      watcher.on('error', () => this.stopWatch(id));
      this.linkWatchers.set(id, watcher);
    } catch {
      /* fs.watch(recursive) is best-effort; POST /:id/reload still works */
    }
  }

  private stopWatch(id: string): void {
    const w = this.linkWatchers.get(id);
    if (w) {
      try { w.close(); } catch { /* ignore */ }
      this.linkWatchers.delete(id);
    }
  }

  /** Stop the plugin, remove its code, and optionally delete all its data. */
  async uninstall(id: string, deleteData: boolean): Promise<void> {
    await this.supervisor.disable(id);
    this.stopWatch(id);
    closePluginDataDb(id);
    // Code always goes; the DB metadata + fields go so it disappears from the UI.
    // Link-safe: a dev-linked plugin only drops the symlink, never the author's source.
    removePluginCodeEntry(pluginCodeDir(id));
    db.prepare('DELETE FROM plugins WHERE id = ?').run(id);
    db.prepare('DELETE FROM plugin_settings_fields WHERE plugin_id = ?').run(id);
    try { db.prepare('DELETE FROM plugin_actions WHERE plugin_id = ?').run(id); } catch { /* table absent */ }
    // The admin's egress consent dies with the plugin. Unconditional: leaving it would
    // silently grant a LATER plugin that reuses this id the hosts the admin approved for
    // a different one.
    try { db.prepare('DELETE FROM plugin_egress_hosts WHERE plugin_id = ?').run(id); } catch { /* table absent */ }
    // Scheduled tasks are operational (not user data), so they go unconditionally —
    // a scheduled callback for a plugin that no longer exists must never fire.
    db.prepare('DELETE FROM plugin_scheduled_tasks WHERE plugin_id = ?').run(id);
    // If it was a notification channel, retire the channel too. Unconditional, for the
    // same reason as the settings fields: these are TREK's config ABOUT the plugin, and
    // leaving them means a later plugin that reuses this id silently inherits every
    // user's opt-outs and the admin's enablement.
    this.retireNotificationChannel(id);
    if (deleteData) {
      removePluginData(id);
      db.prepare('DELETE FROM plugin_error_log WHERE plugin_id = ?').run(id);
      db.prepare("DELETE FROM settings WHERE key LIKE ?").run(`plugin:${id}:%`);
      db.prepare('DELETE FROM plugin_entity_metadata WHERE plugin_id = ?').run(id);
      // Per-user secrets + OAuth tokens/state live in their own tables, NOT under
      // settings — without these a "delete all data" leaves encrypted API keys and
      // refresh tokens behind, silently re-adopted if a plugin with the same id is
      // reinstalled. The migration ledger goes too, so a reinstall re-runs cleanly.
      db.prepare('DELETE FROM plugin_user_config WHERE plugin_id = ?').run(id);
      db.prepare('DELETE FROM plugin_oauth_tokens WHERE plugin_id = ?').run(id);
      db.prepare('DELETE FROM plugin_oauth_state WHERE plugin_id = ?').run(id);
      db.prepare('DELETE FROM plugin_meta_migrations WHERE plugin_id = ?').run(id);
      db.prepare('DELETE FROM plugin_capability_audit WHERE plugin_id = ?').run(id);
      // The plugin's data dir is gone now, so any pending GDPR erasure for it is moot.
      // But when deleteData is FALSE we deliberately KEEP the queue rows: the data dir
      // (which may still hold a deleted user's rows) survives, so the erasure obligation
      // must survive too — a reinstall of the same id drains the queue and honours it.
      db.prepare('DELETE FROM plugin_user_erasure_queue WHERE plugin_id = ?').run(id);
    }
  }

  isActive(id: string): boolean {
    return this.supervisor.isActive(id);
  }

  /** Declared outbound hosts (from http:outbound:<host> grants) for the frame CSP. */
  outboundHostsOf(id: string): string[] {
    const row = db.prepare('SELECT granted_permissions FROM plugins WHERE id = ?').get(id) as
      | { granted_permissions: string }
      | undefined;
    if (!row) return [];
    return parseArray(row.granted_permissions)
      .filter((p) => p.startsWith('http:outbound:'))
      .map((p) => p.slice('http:outbound:'.length))
      .filter(Boolean);
  }
  routesOf(id: string): PluginRouteInfo[] {
    return this.supervisor.routesOf(id);
  }
  invoke(id: string, method: string, params: Record<string, unknown>, actingUserId?: number): Promise<unknown> {
    return this.supervisor.invoke(id, method, params, { actingUserId });
  }
  /** Ids of active plugins implementing a provider hook (e.g. 'placeDetailProvider'). */
  providersOf(hook: string): string[] {
    return this.supervisor.providersOf(hook);
  }
  /**
   * Ask ONE plugin's provider hook for data (host→plugin). A tighter default
   * timeout than a route call so a slow provider can't delay the core response;
   * the acting user is host-bound so any trip read the hook makes is membership-checked.
   */
  invokeHook(id: string, hook: string, fn: string, args: unknown[], actingUserId?: number, timeoutMs = 5000): Promise<unknown> {
    // Defense-in-depth: only a plugin that both implements the hook AND holds the
    // hook:* grant (providersOf enforces both) may be invoked, even if a caller
    // passes an id directly rather than one returned by providersOf.
    if (!this.supervisor.providersOf(hook).includes(id)) {
      return Promise.reject(new Error(`plugin ${id} is not a granted provider of ${hook}`));
    }
    return this.supervisor.invoke(id, 'invoke.hook', { hook, fn, args }, { actingUserId, timeoutMs });
  }

  // ── Inter-plugin router (implements PluginCallRouter; #plugins deps) ──────────

  /**
   * Route `caller`'s ctx.plugins.call to `target`'s export. Authorization is the
   * dependency edge — the caller must declare `target` as a version-satisfied
   * `pluginDependency` — plus the target must expose `fn` (declared in its manifest
   * `capabilities.provides` AND implemented, as reported at load). The acting user
   * is forwarded, so the target's export runs membership-checked as the caller's user.
   */
  callPlugin(callerId: string, targetId: string, fn: string, args: unknown, actingUserId: number | undefined): Promise<unknown> {
    if (!this.supervisor.isActive(targetId)) {
      return Promise.reject(new ForbiddenResource(`plugin ${targetId} is not active`));
    }
    if (!this.dependsOnSatisfied(callerId, targetId)) {
      return Promise.reject(new ForbiddenResource(`plugin ${callerId} does not declare ${targetId} as a satisfied dependency`));
    }
    if (!this.capabilityList(targetId, 'provides').includes(fn) || !this.supervisor.exportsOf(targetId).includes(fn)) {
      return Promise.reject(new ForbiddenResource(`plugin ${targetId} does not export "${fn}"`));
    }
    return this.supervisor.invoke(targetId, 'invoke.export', { fn, args }, { actingUserId, timeoutMs: 5000 });
  }

  /**
   * Fan out an event emitted by `source` to every active plugin that (a) subscribed
   * to `(source, event)` and (b) declares `source` as a satisfied dependency. The
   * source must declare `event` in its manifest `capabilities.emits`. Fire-and-forget.
   */
  emitPluginEvent(sourceId: string, event: string, payload: unknown): void {
    if (!this.capabilityList(sourceId, 'emits').includes(event)) {
      throw new ForbiddenResource(`plugin ${sourceId} does not declare event "${event}"`);
    }
    for (const subscriberId of this.supervisor.subscribersOf(sourceId, event)) {
      if (!this.dependsOnSatisfied(subscriberId, sourceId)) continue;
      this.supervisor
        .invoke(subscriberId, 'invoke.pluginEvent', { source: sourceId, event, payload }, { actingUserId: undefined, timeoutMs: 5000 })
        .catch(() => {
          /* a subscriber that throws/times out must not affect the emitter or peers */
        });
    }
  }

  /** True if `caller` declares `target` as a plugin dependency whose range the
   * installed target version satisfies. */
  private dependsOnSatisfied(callerId: string, targetId: string): boolean {
    const caller = db.prepare('SELECT dependencies FROM plugins WHERE id = ?').get(callerId) as { dependencies: string | null } | undefined;
    const target = db.prepare('SELECT version FROM plugins WHERE id = ?').get(targetId) as { version: string | null } | undefined;
    if (!caller || !target) return false;
    const dep = parseDependencies(caller.dependencies).pluginDependencies.find((d) => d.id === targetId);
    if (!dep) return false;
    return semver.satisfies(target.version ?? '0.0.0', dep.version, { includePrerelease: true });
  }

  /**
   * Drop every trace of a plugin's notification channel: the per-user event opt-outs
   * and the id in the admin's `notification_channels` list.
   */
  private retireNotificationChannel(id: string): void {
    // Drop the users' per-event opt-outs for this channel. A plugin channel is never
    // listed in the admin's `notification_channels` CSV (it is active by virtue of the
    // plugin being enabled), so there is nothing to scrub there.
    //
    // Defensive, like the boot path above: an uninstall must still complete in a context
    // without the notification tables (a slimmed test app that imports only the plugin
    // module).
    try {
      db.prepare('DELETE FROM notification_channel_preferences WHERE channel = ?').run(pluginChannelId(id));
    } catch { /* no notifications schema here — nothing to retire */ }
  }

  /**
   * Every active, granted `notificationChannel` provider, as an ExternalChannel the
   * notification service can dispatch to. Rebuilt on every read (the registry pulls
   * through setPluginChannelSource), so a plugin that is disabled or uninstalled
   * simply stops being a channel — no cache to invalidate.
   *
   * The label, the event set and the configured-check are all answered from the
   * manifest and the DB, with no IPC: the child is only ever woken to actually send.
   */
  notificationChannels(): ExternalChannel[] {
    if (!pluginsEnabled()) return [];
    return this.supervisor.providersOf('notificationChannel').map((id) => {
      const row = db.prepare('SELECT name, capabilities FROM plugins WHERE id = ?').get(id) as
        | { name: string; capabilities: string }
        | undefined;
      let cap: { title?: string; events?: string[] } = {};
      try {
        cap = ((JSON.parse(row?.capabilities || '{}') as Record<string, unknown>).notificationChannel ?? {}) as typeof cap;
      } catch { /* a malformed capabilities blob just means "no overrides" */ }

      const allowed = new Set(cap.events?.length ? cap.events : PLUGIN_CHANNEL_EVENTS);

      return {
        id: pluginChannelId(id),
        source: 'plugin' as const,
        // A plugin-supplied display string, bounded and emoji-stripped like every other
        // one the host renders (cf. the calendar/photo controllers) — it becomes a column
        // header in the notification preferences matrix.
        label: stripEmoji(String(cap.title || row?.name || id)).slice(0, 40) || id,
        // Where the user actually configures this channel. Settings is ONE page with a
        // tab, not a route per plugin — a `/settings/plugins/<id>` path would 404.
        settingsPath: '/settings?tab=plugins',
        // Admin-scoped events never reach a plugin channel — PLUGIN_CHANNEL_EVENTS
        // excludes them, and a manifest can only narrow that set, never widen it.
        supportsEvent: (event: string) => allowed.has(event),
        isConfiguredFor: (userId: number) => hasRequiredUserSettings(id, userId),
        sendToUser: (userId: number, msg: ChannelMessage) =>
          this.invokeHook(
            id,
            'notificationChannel',
            'send',
            [{ event: msg.event, title: msg.title, body: msg.body, url: msg.url, tripName: msg.tripName }, readUserSettingsDecrypted(id, userId)],
            // No acting user: a notification is host-initiated for an arbitrary
            // recipient, so the hook gets the recipient's config as an argument
            // rather than the right to read anything AS them.
            undefined,
            8000,
          ),
        test: async (userId: number) => {
          try {
            await this.invokeHook(id, 'notificationChannel', 'test', [readUserSettingsDecrypted(id, userId)], undefined, 8000);
            return { success: true };
          } catch (e) {
            return { success: false, error: e instanceof Error ? e.message : String(e) };
          }
        },
      };
    });
  }

  /** The settings-page action buttons a plugin declared (descriptors, from the DB). */
  actionsOf(id: string): Array<{ key: string; label: string; hint?: string; danger: boolean }> {
    try {
      return (
        db.prepare('SELECT action_key, label, hint, danger FROM plugin_actions WHERE plugin_id = ? ORDER BY sort_order').all(id) as Array<{
          action_key: string; label: string; hint: string | null; danger: number;
        }>
      ).map((r) => ({ key: r.action_key, label: r.label, hint: r.hint ?? undefined, danger: r.danger === 1 }));
    } catch {
      return []; // table absent (a slimmed test app)
    }
  }

  /**
   * Run a settings-page action for the user who clicked it. The acting user is bound
   * host-side (never named by the plugin), so the action reads THAT user's settings and
   * any trip read it makes is membership-checked against them.
   */
  async invokeAction(id: string, key: string, actingUserId: number): Promise<{ ok: boolean; message?: string }> {
    if (!this.actionsOf(id).some((a) => a.key === key)) {
      throw new ForbiddenResource(`plugin ${id} did not declare action "${key}"`);
    }
    const cap = (v: unknown) => stripEmoji(String(v)).slice(0, 200);
    try {
      const raw = (await this.supervisor.invoke(id, 'invoke.action', { key }, { actingUserId, timeoutMs: 15_000 })) as
        | { ok?: unknown; message?: unknown }
        | undefined;
      // The message is plugin-supplied and rendered to the user — bound it like every
      // other plugin string the host displays.
      return { ok: raw?.ok !== false, message: raw?.message === undefined ? undefined : cap(raw.message) };
    } catch (e) {
      // A plugin that throws is reporting a FAILED action, not a server fault — that is
      // the documented contract ("throwing == { ok: false }"), and it is the normal path
      // for "your credentials don't work". Surface the reason to the user.
      return { ok: false, message: cap(e instanceof Error ? e.message : 'Action failed') };
    }
  }

  /** A plugin's declared `capabilities.provides`/`capabilities.emits` (from the DB). */
  private capabilityList(id: string, field: 'provides' | 'emits'): string[] {
    const row = db.prepare('SELECT capabilities FROM plugins WHERE id = ?').get(id) as { capabilities: string } | undefined;
    if (!row) return [];
    try {
      const c = JSON.parse(row.capabilities || '{}') as Record<string, unknown>;
      const v = c[field];
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }
}

function parseArray(json: string): string[] {
  try {
    const v = JSON.parse(json || '[]');
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
function parseObject(json: string): Record<string, unknown> {
  try {
    const v = JSON.parse(json || '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
/** Decrypt secret config values transparently (decrypt_api_key passes plaintext through). */
function decryptConfig(config: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    out[k] = typeof v === 'string' ? decrypt_api_key(v) : v;
  }
  return out;
}

const LOG_RETENTION = 500; // rows kept per plugin (the admin view shows the newest 200)
/** Trim a plugin's error log to the most recent LOG_RETENTION rows. Cheap: onLog
 * only fires on warn/error, so this never runs on the hot path. */
function pruneErrorLog(pluginId: string): void {
  db.prepare(
    `DELETE FROM plugin_error_log WHERE plugin_id = ? AND id NOT IN (
       SELECT id FROM plugin_error_log WHERE plugin_id = ? ORDER BY id DESC LIMIT ${LOG_RETENTION}
     )`,
  ).run(pluginId, pluginId);
}
