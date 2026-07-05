import semver from 'semver';
import { isKnownPermission } from '../protocol/envelope';

/**
 * Parse + validate a plugin's trek-plugin.json (#plugins, M4). Kept deliberately
 * strict: unknown permissions, missing required fields, or a declared native
 * module all fail here, before a plugin is ever registered. (The published SDK's
 * shared Zod schema will supersede this in M6; the checks stay identical.)
 */

export interface ManifestSettingField {
  key: string;
  label?: string;
  input_type?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  secret?: boolean;
  scope?: 'instance' | 'user';
  options?: Array<{ value: string; label: string }>;
  oauth?: { initPath?: string; callbackPath?: string };
}

export interface WidgetCapability {
  title?: string;
  defaultSize?: string;
  /** Where the widget mounts: dashboard sidebar (default), hero-bar overlay, or the
   * trip planner's place-detail panel (scoped to the selected place). */
  slot?: 'sidebar' | 'hero' | 'place-detail';
}

export interface PluginCapabilities {
  widget?: WidgetCapability;
  /** Function names this plugin exposes to its dependents via ctx.plugins.call. */
  provides?: string[];
  /** Event names this plugin publishes to its dependents via ctx.events.emit. */
  emits?: string[];
}

/** A declared dependency on another plugin, pinned by a semver range. */
export interface PluginDependency {
  id: string;
  version: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  apiVersion: number;
  author?: string;
  description?: string;
  homepage?: string;
  icon?: string;
  type: 'integration' | 'page' | 'widget' | 'trip-page';
  trek?: string;
  minTrekVersion?: string;
  nativeModules: boolean;
  permissions: string[];
  egress: string[];
  settings: ManifestSettingField[];
  capabilities: PluginCapabilities;
  /** Addon ids that must be enabled for this plugin to activate (format-only here). */
  requiredAddons: string[];
  /** Other plugins that must be installed + version-satisfied to activate. */
  pluginDependencies: PluginDependency[];
}

const ID_RE = /^[a-z][a-z0-9-]{2,39}$/;
// Addon ids are lowercase slugs that may contain underscores (e.g. `llm_parsing`).
// Validated format-only: existence is checked at activation, so a plugin declaring
// an unknown addon still installs but can never enable (matches "allow install").
const ADDON_ID_RE = /^[a-z][a-z0-9_]{1,39}$/;
// An outbound host: an exact hostname (single-label like a `redis` sibling
// service, or a dotted FQDN) OR a `*.`-prefixed wildcard that MUST have a real
// multi-label suffix. Rejects `*`, `*.`, whole-TLD `*.com`, schemes, and any
// embedded space — all of which would otherwise widen egress or inject a CSP
// source token when the host is interpolated into connect-src.
const HOST_RE = /^(\*\.[a-z0-9-]+(\.[a-z0-9-]+)+|[a-z0-9-]+(\.[a-z0-9-]+)*)$/i;
// Static path segments under /api/admin/plugins — a plugin id must never shadow them
// (id "registry" would collide with GET registry/:id vs :id/errors routing).
const RESERVED_IDS = new Set(['registry', 'install', 'rescan']);
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
// 'trip-page' mounts the plugin's sandboxed UI as a tab inside every trip planner
// (tripId-scoped), with no dashboard presence — unlike 'page' (dashboard nav).
const TYPES = new Set(['integration', 'page', 'widget', 'trip-page']);

export class ManifestError extends Error {}

/** JSON.parse that tolerates a UTF-8 BOM (0xFEFF) — manifests written on Windows often carry one. */
export function parseJsonText(text: string): unknown {
  return JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
}

export function parseManifest(raw: unknown): PluginManifest {
  if (!raw || typeof raw !== 'object') throw new ManifestError('manifest is not an object');
  const m = raw as Record<string, unknown>;

  const id = str(m.id, 'id');
  if (!ID_RE.test(id)) throw new ManifestError(`invalid id "${id}" (lowercase slug, 3–40 chars)`);
  if (RESERVED_IDS.has(id)) throw new ManifestError(`reserved id "${id}"`);
  const version = str(m.version, 'version');
  if (!SEMVER_RE.test(version)) throw new ManifestError(`invalid version "${version}"`);
  const type = str(m.type, 'type');
  if (!TYPES.has(type)) throw new ManifestError(`invalid type "${type}"`);

  if (m.nativeModules === true) throw new ManifestError('native modules are not allowed');

  const permissions = arr(m.permissions).map(String);
  const unknown = permissions.filter((p) => !isKnownPermission(p));
  if (unknown.length) throw new ManifestError(`unknown permission(s): ${unknown.join(', ')}`);

  // Validate the host portion of every per-host outbound permission: this is the
  // string the runtime egress guard AND the iframe CSP connect-src are built from.
  const badOutbound = permissions
    .filter((p) => p.startsWith('http:outbound:'))
    .map((p) => p.slice('http:outbound:'.length))
    .find((h) => !HOST_RE.test(h));
  if (badOutbound !== undefined) throw new ManifestError(`invalid http:outbound host "${badOutbound}"`);

  const egress = arr(m.egress).map(String);
  if (permissions.some((p) => p === 'http:outbound' || p.startsWith('http:outbound:')) && egress.length === 0) {
    throw new ManifestError('http:outbound declared but egress[] is empty');
  }
  if (egress.includes('*')) throw new ManifestError('egress[] must not contain a bare "*"');
  const badEgress = egress.find((h) => !HOST_RE.test(h));
  if (badEgress !== undefined) throw new ManifestError(`invalid egress host "${badEgress}"`);

  const trek = optStr(m.trek);
  return {
    id,
    name: str(m.name, 'name'),
    version,
    apiVersion: typeof m.apiVersion === 'number' ? m.apiVersion : 1,
    author: optStr(m.author),
    description: optStr(m.description),
    homepage: optStr(m.homepage),
    icon: optStr(m.icon) ?? 'Blocks',
    type: type as PluginManifest['type'],
    trek,
    minTrekVersion: trek ? (trek.match(/(\d+\.\d+\.\d+)/)?.[1] ?? undefined) : undefined,
    nativeModules: false,
    permissions,
    egress,
    settings: parseSettings(m.settings),
    capabilities: parseCapabilities(m.capabilities),
    requiredAddons: parseRequiredAddons(m.requiredAddons),
    pluginDependencies: parsePluginDependencies(m.pluginDependencies, id),
  };
}

/** Validate `requiredAddons`: a de-duplicated list of well-formed addon-id slugs. */
function parseRequiredAddons(raw: unknown): string[] {
  const out: string[] = [];
  for (const v of arr(raw)) {
    if (typeof v !== 'string' || !ADDON_ID_RE.test(v)) throw new ManifestError(`invalid requiredAddons entry "${String(v)}"`);
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

/**
 * Validate `pluginDependencies`: each `{ id, version }` must reference a valid,
 * non-self, non-reserved plugin id and a parseable semver range. Duplicate ids
 * are rejected so a dependency can't be declared with two conflicting ranges.
 */
function parsePluginDependencies(raw: unknown, selfId: string): PluginDependency[] {
  const out: PluginDependency[] = [];
  for (const v of arr(raw)) {
    if (!v || typeof v !== 'object') throw new ManifestError('each pluginDependencies entry must be an object');
    const d = v as Record<string, unknown>;
    const id = str(d.id, 'pluginDependencies.id');
    if (!ID_RE.test(id)) throw new ManifestError(`invalid pluginDependencies id "${id}"`);
    if (RESERVED_IDS.has(id)) throw new ManifestError(`reserved pluginDependencies id "${id}"`);
    if (id === selfId) throw new ManifestError(`plugin "${selfId}" cannot depend on itself`);
    if (out.some((e) => e.id === id)) throw new ManifestError(`duplicate pluginDependencies id "${id}"`);
    const version = str(d.version, 'pluginDependencies.version');
    if (semver.validRange(version) === null) throw new ManifestError(`invalid pluginDependencies version range "${version}" for "${id}"`);
    out.push({ id, version });
  }
  return out;
}

// Export function / event names exposed to other plugins. Kept to a safe
// identifier shape (dots allowed for event names like `rate.updated`).
const CAPABILITY_NAME_RE = /^[a-zA-Z][a-zA-Z0-9._-]{0,63}$/;

function parseCapabilities(raw: unknown): PluginCapabilities {
  if (!raw || typeof raw !== 'object') return {};
  const c = raw as Record<string, unknown>;
  const out: PluginCapabilities = {};
  if (c.widget && typeof c.widget === 'object') {
    const w = c.widget as Record<string, unknown>;
    const slot = optStr(w.slot);
    if (slot && slot !== 'sidebar' && slot !== 'hero' && slot !== 'place-detail') throw new ManifestError(`invalid widget slot "${slot}"`);
    out.widget = {
      title: optStr(w.title),
      defaultSize: optStr(w.defaultSize),
      slot: (slot as WidgetCapability['slot']) ?? 'sidebar',
    };
  }
  const provides = parseCapabilityNames(c.provides, 'provides');
  if (provides.length) out.provides = provides;
  const emits = parseCapabilityNames(c.emits, 'emits');
  if (emits.length) out.emits = emits;
  return out;
}

/** Validate a `provides`/`emits` array: de-duplicated, well-formed names. */
function parseCapabilityNames(raw: unknown, field: string): string[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new ManifestError(`capabilities.${field} must be an array of names`);
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== 'string' || !CAPABILITY_NAME_RE.test(v)) throw new ManifestError(`invalid capabilities.${field} entry "${String(v)}"`);
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

function parseSettings(raw: unknown): ManifestSettingField[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .map((s): ManifestSettingField => ({
      key: String(s.key ?? ''),
      label: optStr(s.label),
      input_type: optStr(s.input_type) ?? 'text',
      placeholder: optStr(s.placeholder),
      hint: optStr(s.hint),
      required: !!s.required,
      secret: !!s.secret,
      scope: s.scope === 'user' ? 'user' : 'instance',
      options: Array.isArray(s.options) ? (s.options as Array<{ value: string; label: string }>) : undefined,
      oauth: s.oauth && typeof s.oauth === 'object' ? (s.oauth as { initPath?: string; callbackPath?: string }) : undefined,
    }))
    .filter((s) => s.key);
}

function str(v: unknown, name: string): string {
  if (typeof v !== 'string' || !v) throw new ManifestError(`missing/invalid "${name}"`);
  return v;
}
function optStr(v: unknown): string | undefined {
  return typeof v === 'string' && v ? v : undefined;
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
