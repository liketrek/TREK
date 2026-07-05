import semver from 'semver';
import type { PluginDependency } from './install/manifest';

/**
 * Pure dependency-reasoning helpers for the plugin runtime (#plugins). Kept
 * side-effect free (no DB, no process) so the activation gate, the addon-disable
 * cascade, and the registry resolver can all share — and unit-test — the same
 * logic. The DB layer hands these functions plain rows; they never query.
 */

export interface PluginDependencies {
  requiredAddons: string[];
  pluginDependencies: PluginDependency[];
}

/** The subset of a `plugins` row these helpers reason over. */
export interface PluginDepRow {
  id: string;
  version: string | null;
  enabled: number;
  /** The `dependencies` JSON blob column (may be null/legacy '{}'). */
  dependencies: string | null;
}

/** Thrown when the dependency graph contains a cycle (A → B → A). */
export class DependencyCycleError extends Error {
  constructor(readonly cyclePath: string[]) {
    super(`plugin dependency cycle: ${cyclePath.join(' -> ')}`);
    this.name = 'DependencyCycleError';
  }
}

const EMPTY: PluginDependencies = { requiredAddons: [], pluginDependencies: [] };

/** Parse the stored `dependencies` JSON blob, tolerating legacy/garbage values. */
export function parseDependencies(raw: string | null | undefined): PluginDependencies {
  if (!raw) return { requiredAddons: [], pluginDependencies: [] };
  try {
    const o = JSON.parse(raw) as Partial<PluginDependencies>;
    return {
      requiredAddons: Array.isArray(o.requiredAddons) ? o.requiredAddons.filter((a): a is string => typeof a === 'string') : [],
      pluginDependencies: Array.isArray(o.pluginDependencies)
        ? o.pluginDependencies.filter(
            (d): d is PluginDependency =>
              !!d && typeof d === 'object' && typeof (d as PluginDependency).id === 'string' && typeof (d as PluginDependency).version === 'string',
          )
        : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

/** Required addon ids that are currently NOT enabled — these block activation. */
export function disabledRequiredAddons(deps: PluginDependencies, isAddonEnabled: (id: string) => boolean): string[] {
  return deps.requiredAddons.filter((a) => !isAddonEnabled(a));
}

export interface VersionMismatch {
  id: string;
  /** The declared semver range. */
  wanted: string;
  /** The installed version that fails the range. */
  installed: string;
}

export interface DependencyState {
  /** Declared deps not installed at all. */
  missing: PluginDependency[];
  /** Installed but the version is outside the declared range. */
  versionMismatch: VersionMismatch[];
  /** Installed + satisfied but currently disabled (auto-enable candidates). */
  satisfiedDisabled: string[];
  /** Installed + satisfied + already enabled. */
  satisfiedActive: string[];
}

/** Classify each declared plugin dependency against what is installed. */
export function resolveDependencyState(deps: PluginDependencies, installed: Map<string, PluginDepRow>): DependencyState {
  const state: DependencyState = { missing: [], versionMismatch: [], satisfiedDisabled: [], satisfiedActive: [] };
  for (const dep of deps.pluginDependencies) {
    const row = installed.get(dep.id);
    if (!row) {
      state.missing.push(dep);
      continue;
    }
    const installedVersion = row.version ?? '0.0.0';
    if (!semver.satisfies(installedVersion, dep.version, { includePrerelease: true })) {
      state.versionMismatch.push({ id: dep.id, wanted: dep.version, installed: installedVersion });
      continue;
    }
    if (row.enabled) state.satisfiedActive.push(dep.id);
    else state.satisfiedDisabled.push(dep.id);
  }
  return state;
}

/** Plugins whose `pluginDependencies` reference `pluginId` (direct dependents). */
export function findDependents(pluginId: string, rows: PluginDepRow[]): string[] {
  return rows.filter((r) => parseDependencies(r.dependencies).pluginDependencies.some((d) => d.id === pluginId)).map((r) => r.id);
}

/**
 * All plugins that (transitively) depend on `pluginId`. Used by the addon-disable
 * cascade: disabling the addon disables the plugins that require it AND everything
 * downstream of those. Order is leaf-most last is NOT guaranteed; callers only
 * need the set for deactivation.
 */
export function findDependentsTransitive(pluginId: string, rows: PluginDepRow[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>([pluginId]);
  const queue = [pluginId];
  while (queue.length) {
    const cur = queue.shift() as string;
    for (const dep of findDependents(cur, rows)) {
      if (seen.has(dep)) continue;
      seen.add(dep);
      out.push(dep);
      queue.push(dep);
    }
  }
  return out;
}

/**
 * Deps-first activation order for the given root ids over the installed graph.
 * Edges to plugins that are NOT installed are ignored here (the activation gate
 * reports those as missing separately). Throws {@link DependencyCycleError} on a
 * back-edge. Passing multiple roots (boot) yields one global order with each
 * plugin appearing once, dependencies always before their dependents.
 */
export function enableOrder(ids: string[], installed: Map<string, PluginDepRow>): string[] {
  const order: string[] = [];
  const done = new Set<string>();
  const stack: string[] = [];
  const visit = (cur: string): void => {
    if (done.has(cur)) return;
    const cycleAt = stack.indexOf(cur);
    if (cycleAt !== -1) throw new DependencyCycleError([...stack.slice(cycleAt), cur]);
    const row = installed.get(cur);
    if (!row) return; // not installed — the gate handles it upstream
    stack.push(cur);
    for (const dep of parseDependencies(row.dependencies).pluginDependencies) visit(dep.id);
    stack.pop();
    done.add(cur);
    order.push(cur);
  };
  for (const id of ids) visit(id);
  return order;
}
