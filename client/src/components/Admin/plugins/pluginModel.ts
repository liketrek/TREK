import { PLUGIN_PERMISSIONS } from '@trek/shared';
import { AlertTriangle, Blocks, Puzzle } from 'lucide-react';
import type { ComponentType } from 'react';
import { bypassChip, bypassOffer, type RangeWarning, type TrekRangeBypass } from '../useRangeBypass';

export interface PluginDep {
  id: string;
  version: string;
}
export interface VersionMismatch {
  id: string;
  wanted: string;
  installed: string;
}
type DependencyStatus = 'ok' | 'addonDisabled' | 'missingPlugin' | 'hostIncompatible';
interface PluginDependencies {
  requiredAddons: string[];
  pluginDependencies: PluginDep[];
}
interface DependencyIssues {
  disabledAddons: string[];
  missing: PluginDep[];
  versionMismatch: VersionMismatch[];
}

export interface PluginRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  icon: string | null;
  version: string | null;
  status: string;
  enabled: number;
  last_error: string | null;
  reviewed_at: string | null;
  source_repo: string | null;
  permissions: string;
  capabilities: string;
  /** The plugin needs OPERATOR-supplied egress hosts (a self-hosted target). */
  operatorEgress?: boolean;
  /** How many hosts the admin has added: 0 means the plugin can't reach anything yet. */
  egressHostCount?: number;
  /** How many `scope:'instance'` settings fields the plugin declares, gates the
   * "Instance settings" menu item without a per-plugin fetch. */
  instanceSettingsCount?: number;
  /** How many `scope:'instance'` actions the plugin declares, a plugin with actions
   * but no settings fields still needs the menu item to run them. */
  instanceActionsCount?: number;
  dependencies?: PluginDependencies;
  dependencyStatus?: DependencyStatus;
  dependencyIssues?: DependencyIssues;
  /** The TREK versions the plugin says it supports; null if it never declared any. */
  trekRange?: string | null;
  /** The TREK this server is running, the server does the semver, the client just shows it. */
  hostVersion?: string;
  /** Non-null while the plugin runs outside its declared range on the operator's say-so. */
  trekRangeBypassed?: TrekRangeBypass | null;
  /** The author's signature was verified and their key pinned at install. False means the
   * bytes matched the registry's sha256 and nothing more, one fewer guarantee. */
  signed?: boolean;
  /** Short form of the pinned key, for eyeballing against what the author reads out. */
  keyFingerprint?: string | null;
  /** Why an update was refused, if one was. `version` is the version that was refused. */
  updateBlock?: { code: string; detail: string | null; version: string | null } | null;
  /** A deliberate non-latest install paused updates: out of the banner/Update all until resumed. */
  updateHold?: boolean;
}
export interface RegistryItem {
  id: string;
  name: string;
  author: string;
  description: string;
  repo: string;
  homepage?: string | null;
  type: string;
  /** Lucide icon name from the registry entry; absent → Blocks. */
  icon?: string | null;
  latest: string | null;
  minTrekVersion: string | null;
  /** The latest version's declared TREK range; null on a legacy registry entry. */
  trek?: string | null;
  hostVersion?: string;
  /** Whether the LATEST version can be installed on this TREK. Computed server-side. */
  compatible?: boolean;
  /** Newest installable version: the latest, an older fallback, or null if none fits. */
  latestCompatible?: string | null;
  reviewedAt: string | null;
  downloadCount?: number | null;
  screenshotUrl: string | null;
  requiredAddons?: string[];
  pluginDependencies?: PluginDep[];
  /** The latest version ships an author signature and the entry declares a key. */
  signed?: boolean;
  /** The full key: public, and carried in full because re-trust compares it exactly. */
  authorPublicKey?: string | null;
}
/** One published version, with its SERVER-computed compat verdict (the client has no semver). */
export interface VersionInfo {
  version: string;
  publishedAt: string | null;
  size: number | null;
  signed: boolean;
  /** The declared TREK requirement, or null when the entry carries no bounds at all. */
  trek: string | null;
  compatible: boolean;
}
export interface RegistryDetail extends RegistryItem {
  size: number | null;
  publishedAt: string | null;
  /** Every published version, newest first: the version picker's data. */
  versions?: VersionInfo[];
  manifest: {
    // Optional because a registry may omit an empty list, the detail view has to
    // degrade rather than throw halfway through its render.
    permissions?: string[];
    egress?: string[];
    /** The plugin needs OPERATOR-supplied hosts, its egress list is not the whole story. */
    operatorEgress?: boolean;
    settings?: Array<{ key: string; label: string; inputType: string; scope: string; required: boolean }>;
    license: string | null;
    icon: string | null;
    requiredAddons?: string[];
    pluginDependencies?: PluginDep[];
    /** Display slice of the manifest's capabilities, drives the same chips as an installed row. */
    capabilities?: {
      widget?: { slot?: string };
      tripPage?: { replaces?: string[] };
      /** Tools the plugin will publish on the MCP server once mcp:tools is granted. */
      mcpTools?: Array<{ name: string; title?: string; description: string }>;
      /** Explore-pill categories it adds (#1781), checked again before anything draws them. */
      poiCategories?: unknown;
    };
  } | null;
}

/** 409 error-body shape from POST /activate when a dependency blocks activation. */
export interface ActivateErr {
  response?: {
    status?: number;
    data?: {
      code?: string;
      error?: string;
      newPermissions?: string[];
      newEgress?: string[];
      addons?: string[];
      missing?: PluginDep[];
      versionMismatch?: VersionMismatch[];
    };
  };
}

/** The server's error envelope. Reading `code`, not the message text, is what lets the
 * UI tell a rotated key (overridable) from a signature that doesn't verify (never). */
export function errBody(e: unknown): { error?: string; code?: string } {
  return (e as { response?: { data?: { error?: string; code?: string } } })?.response?.data ?? {};
}

/** The ONE signature refusal an admin may override, because a rotation has a benign
 * explanation. SIGNATURE_INVALID / _MISSING / _INCOMPLETE mean the bytes are not what the
 * author signed: those get an explanation and no override button at all. */
const RETRUSTABLE = 'SIGNATURE_KEY_CHANGED';
export const SIGNATURE_CODES = [RETRUSTABLE, 'SIGNATURE_INVALID', 'SIGNATURE_MISSING', 'SIGNATURE_INCOMPLETE'];

/**
 * What the signature dialog needs to talk about a plugin, deliberately NOT a PluginRow.
 *
 * A refusal can land on a plugin that is not installed (a fresh install from Discover, or a
 * dependency being downloaded), and those have no row. Keying the dialog off PluginRow meant
 * the lookup missed and the refusal silently degraded to a toast, on the very path where an
 * admin most often meets these codes for the first time. Name + pinned fingerprint is all the
 * dialog ever reads, and both a row and a registry entry can supply that.
 */
export type SigSubject = { id: string; name: string; keyFingerprint: string | null };

/**
 * Is a recorded update block still describing the version on offer?
 *
 * Once the registry offers something NEWER than the version that was refused, the block
 * describes an artifact nobody is being offered anymore, so it reads as stale and the
 * admin can simply re-attempt (the next install re-verifies and either succeeds or
 * re-blocks with fresh values). When the registry is unreachable we can't prove staleness,
 * so the block stands: silently dropping the last thing we knew would be the worse failure.
 */
export function blockIsCurrent(p: PluginRow, latestVer?: string): boolean {
  if (!p.updateBlock) return false;
  // A block describes a refused REGISTRY update. Once a plugin is sideloaded or dev-linked
  // it has left the registry trust model: the running code is whatever the admin supplied,
  // and a block about an author signing key says nothing about it. The server clears the
  // block on both paths; this makes it impossible to render a stale one regardless.
  if (!isRegistrySourced(p.source_repo)) return false;
  if (!latestVer || !p.updateBlock.version) return true;
  return latestVer === p.updateBlock.version;
}

export type T = (k: string, p?: Record<string, unknown>) => string;
export type TypeFilter = 'all' | 'widget' | 'page' | 'integration' | 'trip-page';
export type StatusFilter = 'all' | 'on' | 'off' | 'update' | 'err';
export type SortKey = 'name' | 'recent' | 'updates' | 'downloads';

// Known permissions → human-readable i18n key; unknown ones render as raw code.
// Generated from the host's protocol/envelope.ts by
// server/scripts/gen-plugin-facts.ts - this used to be a hand-kept fourth copy.
export const PERM_KEYS = PLUGIN_PERMISSIONS;

export const KNOWN_TYPES = ['widget', 'page', 'integration', 'trip-page'];

export function isNewer(a: string, b: string): boolean {
  const nums = (v: string) =>
    v
      .split('-')[0]
      .split('.')
      .map((n) => Number.parseInt(n, 10) || 0);
  const pa = nums(a),
    pb = nums(b);
  for (let i = 0; i < 3; i++) {
    const x = pa[i] || 0,
      y = pb[i] || 0;
    if (x !== y) return x > y;
  }
  return !a.includes('-') && b.includes('-');
}

export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  try {
    const v = JSON.parse(raw || '') as T;
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export interface DepChip {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  blocked: boolean;
  warn?: boolean;
}

// A plugin's declared dependencies as chips: a required addon (amber when that
// addon is disabled), a plugin dependency (amber when missing / version-mismatched),
// or the TREK version itself (amber when this server has outgrown the plugin's range,
// which is the one blocker the admin cannot fix by flipping something else on).
export function deriveDeps(p: PluginRow, t: T): DepChip[] {
  const out: DepChip[] = [];
  const issues = p.dependencyIssues;
  if (p.dependencyStatus === 'hostIncompatible') {
    out.push({
      icon: AlertTriangle,
      label: p.trekRange
        ? t('admin.plugins.dep.trekIncompatible', { range: p.trekRange, host: p.hostVersion ?? '?' })
        : t('admin.plugins.dep.trekUnknown'),
      blocked: true,
    });
  }
  const bypassed = bypassChip(p.trekRangeBypassed, t); // TREK_PLUGINS_IGNORE_TREK_RANGE: a warning, not a blocker
  if (bypassed) out.push(bypassed);
  for (const a of p.dependencies?.requiredAddons ?? []) {
    out.push({
      icon: Blocks,
      label: t('admin.plugins.cap.requiresAddon', { addon: a }),
      blocked: !!issues?.disabledAddons.includes(a),
    });
  }
  for (const d of p.dependencies?.pluginDependencies ?? []) {
    const blocked = !!(
      issues?.missing.some((m) => m.id === d.id) || issues?.versionMismatch.some((m) => m.id === d.id)
    );
    out.push({ icon: Puzzle, label: t('admin.plugins.cap.dependsOn', { id: d.id, version: d.version }), blocked });
  }
  return out;
}

/**
 * What the Install button may do for a registry item.
 *
 * The server already decided compatibility: it owns the semver, and a second
 * implementation here would eventually disagree with the install gate and offer a button
 * that 400s. This only picks the wording. Note the middle case: when the newest release
 * has outrun this TREK but an older one still fits, offer THAT version rather than a dead
 * grey button. The plugin is perfectly usable, just not at its newest.
 */
export function installOffer(
  item: RegistryItem,
  t: T,
  ignoreTrekRange = false
): { blocked: boolean; version?: string; label: string; title?: string; warn?: RangeWarning } {
  if (item.compatible !== false) return { blocked: false, label: t('admin.plugins.install') };
  const title = item.trek
    ? t('admin.plugins.dep.trekIncompatible', { range: item.trek, host: item.hostVersion ?? '?' })
    : t('admin.plugins.dep.trekUnknown');
  if (ignoreTrekRange) return bypassOffer(item, t, title); // TREK_PLUGINS_IGNORE_TREK_RANGE: "Install anyway"
  if (item.latestCompatible) {
    return {
      blocked: false,
      version: item.latestCompatible,
      label: t('admin.plugins.installCompatible', { version: item.latestCompatible }),
      title,
    };
  }
  return { blocked: true, label: t('admin.plugins.incompatible'), title };
}

/**
 * Whether a plugin came from the REGISTRY (as opposed to a manual upload or a dev-link).
 *
 * This is the precedence rule for the trust badges, and it is load-bearing: `signed`
 * derives from the pinned author key while sideloaded/dev-linked derive from source_repo,
 * so the states are NOT mutually exclusive in the data. A sideloaded plugin genuinely has
 * no pinned key, and a naive render would put "Unsigned" *and* "Sideloaded" side by side.
 * The source badge wins, it already says something strictly stronger, and doubling up
 * dilutes the amber into wallpaper, which is exactly what makes a warning worthless.
 */
export function isRegistrySourced(sourceRepo: string | null | undefined): boolean {
  return !!sourceRepo && sourceRepo !== 'local:upload' && sourceRepo !== 'local:link';
}

// 1234 -> "1.2k": GitHub-style compact download counts for the browse cards.
// The M threshold sits at the k-rounding boundary so 999 950 is "1M", not "1000k".
export function formatCompactCount(n: number): string {
  if (n >= 999_500) return `${Math.round(n / 100_000) / 10}M`;
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
  return String(n);
}

/** Client-side twin of the server's fingerprint: head…tail of the base64 payload. Display
 * only, every equality check that matters happens server-side against the full key. */
export function fingerprint(key: string | null): string | null {
  if (!key) return null;
  const payload = key
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('untrusted comment'))
    .pop();
  if (!payload) return null;
  return payload.length <= 20 ? payload : `${payload.slice(0, 8)}…${payload.slice(-8)}`;
}

export function statusLabel(s: StatusFilter, t: T): string {
  return s === 'all'
    ? t('admin.plugins.allStatuses')
    : s === 'on'
      ? t('admin.plugins.status.active')
      : s === 'off'
        ? t('admin.plugins.stateOff')
        : s === 'update'
          ? t('admin.plugins.filterUpdate')
          : t('admin.plugins.status.error');
}
export function sortLabel(s: SortKey, t: T): string {
  return s === 'name'
    ? t('admin.plugins.sortName')
    : s === 'recent'
      ? t('admin.plugins.sortRecent')
      : s === 'downloads'
        ? t('admin.plugins.sortDownloads')
        : t('admin.plugins.sortUpdates');
}

// A held plugin (deliberate non-latest install) is deliberately NOT an update candidate:
// the admin just rolled it back, and the banner nagging them straight back would make
// the rollback fight the UI. The row carries its own "paused" marker + resume instead.
export function isUpdateAvailable(p: PluginRow, latest: Record<string, string>): boolean {
  return !!(p.version && !p.updateHold && latest[p.id] && isNewer(latest[p.id], p.version));
}

/** The installed list after the search, type and status filters, sorted. */
export function filterInstalled(
  plugins: PluginRow[],
  {
    q,
    typeFilter,
    statusFilter,
    sort,
  }: { q: string; typeFilter: TypeFilter; statusFilter: StatusFilter; sort: SortKey },
  latest: Record<string, string>
): PluginRow[] {
  const updateAvailable = (p: PluginRow) => isUpdateAvailable(p, latest);
  const term = q.trim().toLowerCase();
  let rows = plugins.filter((p) => {
    const matchesText = !term || `${p.name} ${p.description ?? ''}`.toLowerCase().includes(term);
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    const st =
      statusFilter === 'all'
        ? true
        : statusFilter === 'on'
          ? p.enabled === 1 && p.status !== 'error'
          : statusFilter === 'off'
            ? p.enabled === 0
            : statusFilter === 'update'
              ? updateAvailable(p)
              : p.status === 'error';
    return matchesText && matchesType && st;
  });
  rows = [...rows].sort((a, b) => {
    if (sort === 'updates') {
      const ua = updateAvailable(a) ? 0 : 1,
        ub = updateAvailable(b) ? 0 : 1;
      if (ua !== ub) return ua - ub;
    }
    return a.name.localeCompare(b.name);
  });
  return rows;
}

/** The registry list after the search and type filters, sorted; null while it loads. */
export function filterRegistry(
  registry: RegistryItem[] | null,
  { q, typeFilter, sort }: { q: string; typeFilter: TypeFilter; sort: SortKey }
): RegistryItem[] | null {
  if (!registry) return null;
  const term = q.trim().toLowerCase();
  let items = registry.filter((r) => {
    const matchesText = !term || `${r.name} ${r.author} ${r.description}`.toLowerCase().includes(term);
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    return matchesText && matchesType;
  });
  items = [...items].sort((a, b) => {
    if (sort === 'downloads') return (b.downloadCount ?? 0) - (a.downloadCount ?? 0) || a.name.localeCompare(b.name);
    if (sort === 'recent')
      return (
        (Date.parse(b.reviewedAt ?? '') || 0) - (Date.parse(a.reviewedAt ?? '') || 0) || a.name.localeCompare(b.name)
      );
    return a.name.localeCompare(b.name);
  });
  return items;
}

/** What the signature refusal dialog says, and the re-trust it may offer. */
export function signatureBlockView(code: string, entry: RegistryItem | undefined) {
  const canRetrust = code === RETRUSTABLE;
  const newKey = entry?.authorPublicKey ?? null;
  const version = entry?.latest ?? null;
  // Only offer the override when we actually hold the new key + version to send: the
  // request carries both, and the server compares the key exactly.
  const retrust = canRetrust && newKey && version ? { newKey, version } : null;

  const bodyKey =
    code === RETRUSTABLE
      ? 'admin.plugins.sig.keyChangedBody'
      : code === 'SIGNATURE_MISSING'
        ? 'admin.plugins.sig.missingBody'
        : code === 'SIGNATURE_INCOMPLETE'
          ? 'admin.plugins.sig.incompleteBody'
          : 'admin.plugins.sig.invalidBody';

  return { canRetrust, newKey, retrust, bodyKey };
}

/** The dependencies a blocked activation still needs: the missing ones, then the outdated ones. */
export function dependencyRows(data: { missing: PluginDep[]; versionMismatch: VersionMismatch[] }) {
  const rows: Array<{ id: string; constraint: string; installed?: string }> = [
    ...data.missing.map((d) => ({ id: d.id, constraint: d.version })),
    ...data.versionMismatch.map((d) => ({ id: d.id, constraint: d.wanted, installed: d.installed })),
  ];
  return rows;
}
