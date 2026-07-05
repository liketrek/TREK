import { Injectable, type OnModuleInit, type OnModuleDestroy } from '@nestjs/common';
import semver from 'semver';
import { db } from '../../db/database';
import { pluginsEnabled } from './kill-switch';
import { setPluginEventSink } from '../../plugin-event-sink';
import { decrypt_api_key } from '../../services/apiKeyCrypto';
import { PluginSupervisor, type PluginRouteInfo } from './supervisor/plugin-supervisor';
import fs from 'node:fs';
import { createRealRpcHost, closePluginDataDb } from './host/create-rpc-host';
import { ForbiddenResource } from './host/rpc-host';
import { removePluginData } from './host/plugin-data.service';
import { isKnownPermission } from './protocol/envelope';
import { discoverPlugins } from './install/discovery';
import { pluginCodeDir } from './paths';
import { PluginRegistryService } from './registry/registry.service';
import { isAddonEnabled } from '../../services/adminService';
import type { PluginDependency } from './install/manifest';
import type { VersionMismatch, PluginDepRow } from './dependencies';
import { parseDependencies, disabledRequiredAddons, resolveDependencyState, enableOrder, findDependentsTransitive, DependencyCycleError } from './dependencies';

const HTTP_OUTBOUND = 'http:outbound:';

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
    onStatus: (id, status, error) => {
      db.prepare('UPDATE plugins SET status = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        status,
        error ?? null,
        id,
      );
    },
    onLog: (id, level, msg) => {
      if (level === 'error' || level === 'warn') {
        db.prepare('INSERT INTO plugin_error_log (plugin_id, level, message) VALUES (?, ?, ?)').run(id, level, msg);
      }
    },
  });

  // Optional at the type level so tests can `new PluginRuntimeService()` without a
  // registry; Nest always injects the real one (the provider is in the module).
  constructor(private readonly registry?: PluginRegistryService) {}

  onModuleInit(): void {
    if (!pluginsEnabled()) return;
    // Forward core trip events to plugins that subscribed (events:subscribe). The
    // sink is name-only + fire-and-forget, so it can never block a core broadcast.
    setPluginEventSink((tripId, event) => this.supervisor.deliverEvent(tripId, event));
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
    const egress = declared.filter((p) => p.startsWith(HTTP_OUTBOUND)).map((p) => p.slice(HTTP_OUTBOUND.length));
    await this.supervisor.activate(id, new Set(declared), config, egress);
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

  /** Stop the plugin, remove its code, and optionally delete all its data. */
  async uninstall(id: string, deleteData: boolean): Promise<void> {
    await this.supervisor.disable(id);
    closePluginDataDb(id);
    // Code always goes; the DB metadata + fields go so it disappears from the UI.
    fs.rmSync(pluginCodeDir(id), { recursive: true, force: true });
    db.prepare('DELETE FROM plugins WHERE id = ?').run(id);
    db.prepare('DELETE FROM plugin_settings_fields WHERE plugin_id = ?').run(id);
    if (deleteData) {
      removePluginData(id);
      db.prepare('DELETE FROM plugin_error_log WHERE plugin_id = ?').run(id);
      db.prepare("DELETE FROM settings WHERE key LIKE ?").run(`plugin:${id}:%`);
      db.prepare('DELETE FROM plugin_entity_metadata WHERE plugin_id = ?').run(id);
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
