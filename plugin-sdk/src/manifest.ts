/**
 * Manifest validation (#plugins, M6). Identical rules to the TREK server's
 * loader, so `trek-plugin validate` locally == the registry CI gate. Returns a
 * result (no throw) so the CLI can print every problem at once.
 */

import { minVersion, validRange } from 'semver';

export interface PluginDependency {
  id: string;
  version: string;
}
export interface ManifestSettingField {
  key: string;
  label?: string;
  input_type?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  secret?: boolean;
  scope?: 'instance' | 'user';
  options?: Array<string | number | { value: string | number; label?: string }>;
  oauth?: { initPath?: string; callbackPath?: string };
}
export interface ManifestAction {
  key: string;
  label?: string;
  hint?: string;
  danger?: boolean;
}
export interface ManifestCapabilities {
  settingsUi?: boolean;
  widget?: { title?: string; defaultSize?: string; slot?: 'sidebar' | 'hero' | 'place-detail' | 'day-detail' | 'reservation-detail' };
  tripPage?: { replaces?: string[]; position?: number };
  notificationChannel?: { title?: string; events?: string[] };
  routeProfiles?: Array<{ id: string; label: string; icon?: string }>;
  /** MCP tools published via the mcpToolProvider hook. Requires `mcp:tools`. */
  mcpTools?: Array<{
    name: string;
    title?: string;
    description: string;
    inputSchema?: Record<string, unknown>;
    annotations?: {
      readOnlyHint?: boolean;
      destructiveHint?: boolean;
      idempotentHint?: boolean;
      openWorldHint?: boolean;
    };
  }>;
  provides?: string[];
  emits?: string[];
}
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  /** The semver RANGE of TREK versions this plugin supports (">=4.0.0 <5.0.0"). */
  trek: string;
  type: 'integration' | 'page' | 'widget' | 'trip-page';
  apiVersion?: number;
  permissions?: string[];
  egress?: string[];
  nativeModules?: boolean;
  operatorEgress?: boolean;
  requiredAddons?: string[];
  pluginDependencies?: PluginDependency[];
  capabilities?: ManifestCapabilities;
  settings?: ManifestSettingField[];
  actions?: ManifestAction[];
  icon?: string;
  author?: string;
  description?: string;
  homepage?: string;
  tags?: string[];
  license?: string;
}
export interface NormalizedManifest extends PluginManifest {
  apiVersion: number;
  permissions: string[];
  egress: string[];
  nativeModules: false;
  requiredAddons: string[];
  pluginDependencies: PluginDependency[];
}
export interface ValidationResult {
  ok: boolean;
  errors: string[];
  manifest?: NormalizedManifest;
}

const ID_RE = /^[a-z][a-z0-9-]{2,39}$/;
// Ids that would collide with admin API route segments — refused by the server's
// install loader, so surface it locally too.
const RESERVED_IDS = new Set(['registry', 'install', 'rescan']);
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
// Addon-id format (lowercase slug, underscores allowed e.g. `llm_parsing`).
const ADDON_ID_RE = /^[a-z][a-z0-9_]{1,39}$/;
// Mirror of the server's ADDON_IDS (server/src/addons.ts). Kept in sync so
// `trek-plugin validate` can WARN on an addon id TREK doesn't know — never a hard
// error (a plugin built for a newer TREK may reference an addon this SDK predates).
export const KNOWN_ADDONS = [
  'mcp', 'packing', 'budget', 'documents', 'vacay', 'atlas', 'collab', 'journey', 'airtrail', 'llm_parsing', 'collections',
];
// An outbound host: exact hostname (single-label sibling or dotted FQDN) or a
// `*.`-wildcard with a multi-label suffix. No `*`, no `*.`, no whole-TLD `*.com`,
// no spaces (mirrors the server manifest validator).
const HOST_RE = /^(\*\.[a-z0-9-]+(\.[a-z0-9-]+)+|[a-z0-9-]+(\.[a-z0-9-]+)*)$/i;
const TYPES = ['integration', 'page', 'widget', 'trip-page'];

/** Mirrors the server's settings-key rules (install/manifest.ts). */
const SETTING_KEY_RE = /^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/;
const RESERVED_SETTING_KEYS = new Set(['constructor', 'prototype', '__proto__']);

/**
 * Events a plugin notification channel may carry (mirrors the server's
 * PLUGIN_CHANNEL_EVENTS). Admin-scoped and in-app-only events are excluded.
 */
export const CHANNEL_EVENTS = [
  'trip_invite',
  'booking_change',
  'trip_reminder',
  'todo_due',
  'vacay_invite',
  'collection_invite',
  'photos_shared',
  'collab_message',
  'packing_tagged',
  'plugin_notification',
];
// Mirror of the server's KNOWN_PERMISSIONS (server envelope.ts) — the host hard-rejects
// anything not in this list at activation, so validate must know the full set.
//
// This is THE list. `create`'s permission picker is built from it (see PERMISSION_FAMILIES
// in cli/ui.ts, which only supplies the grouping and hints), so a permission added here can
// never again go missing from the scaffolder — test/cli.test.ts fails until it has an entry.
export { KNOWN_PERMISSIONS } from './generated/host-facts.js';
import { KNOWN_PERMISSIONS } from './generated/host-facts.js';

function isKnownPermission(p: string): boolean {
  return KNOWN_PERMISSIONS.includes(p) || p.startsWith('http:outbound:');
}

/**
 * A semver range a plugin may declare in `trek`. Mirrors the server's isValidTrekRange.
 *
 * validRange() alone is not enough: ">=4.0.0 <3.0.0" is a valid range no version can ever
 * satisfy, so a plugin declaring it would be uninstallable everywhere with nothing to
 * explain why. minVersion() is null for exactly that, and throws on junk like "latest".
 */
export function isSatisfiableRange(r: unknown): r is string {
  if (typeof r !== 'string' || !r.trim()) return false;
  if (validRange(r) === null) return false;
  try {
    return minVersion(r) !== null;
  } catch {
    return false;
  }
}

/** A range that admits literally every TREK version, past and future ("*", "x", ">=0"). */
export function isUnboundedRange(r: string): boolean {
  return isSatisfiableRange(r) && validRange(r) === '*';
}

export function validateManifest(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const m = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  if (!raw || typeof raw !== 'object') return { ok: false, errors: ['manifest is not an object'] };

  const req = (k: string) => {
    if (typeof m[k] !== 'string' || !m[k]) errors.push(`missing/invalid "${k}"`);
  };
  req('id'); req('name'); req('version'); req('type');

  if (typeof m.id === 'string' && !ID_RE.test(m.id)) errors.push(`id "${m.id}" must be a lowercase slug (3–40 chars)`);
  if (typeof m.id === 'string' && RESERVED_IDS.has(m.id)) errors.push(`id "${m.id}" is reserved`);
  if (typeof m.version === 'string' && !SEMVER_RE.test(m.version)) errors.push(`version "${m.version}" is not semver`);
  if (typeof m.type === 'string' && !TYPES.includes(m.type)) errors.push(`type must be one of ${TYPES.join('/')}`);
  // TREK refuses to install a plugin that doesn't say which TREK versions it runs on, so
  // an author must find that out here rather than from a rejected install.
  if (!isSatisfiableRange(m.trek)) {
    errors.push(
      typeof m.trek === 'string' && m.trek
        ? `"trek" is not a satisfiable semver range: "${m.trek}" (e.g. ">=4.0.0 <5.0.0")`
        : 'missing "trek" — declare the TREK versions this plugin supports, e.g. ">=4.0.0 <5.0.0"',
    );
  }
  if (m.apiVersion !== undefined && typeof m.apiVersion !== 'number') errors.push('apiVersion must be a number');
  if (m.nativeModules === true) errors.push('native modules are not allowed (v1)');

  const permissions = Array.isArray(m.permissions) ? m.permissions.map(String) : [];
  for (const p of permissions) if (!isKnownPermission(p)) errors.push(`unknown permission: ${p}`);
  for (const p of permissions) {
    if (p.startsWith('http:outbound:') && !HOST_RE.test(p.slice('http:outbound:'.length))) {
      errors.push(`invalid http:outbound host "${p.slice('http:outbound:'.length)}"`);
    }
  }

  const egress = Array.isArray(m.egress) ? m.egress.map(String) : [];
  const wantsOutbound = permissions.some((p) => p === 'http:outbound' || p.startsWith('http:outbound:'));
  // Empty egress[] is legal only with operatorEgress: the hosts are admin-supplied
  // post-install. Until an admin adds one the child blocks ALL outbound — not allow-all.
  if (wantsOutbound && egress.length === 0 && m.operatorEgress !== true) {
    errors.push('http:outbound declared but egress[] is empty (set operatorEgress: true if the hosts are admin-supplied)');
  }
  if (egress.includes('*')) errors.push('egress[] must not contain a bare "*"');
  for (const h of egress) if (!HOST_RE.test(h)) errors.push(`invalid egress host "${h}"`);

  // A plugin whose target host only the OPERATOR knows (a self-hosted Gotify/ntfy).
  // The admin adds the real hosts post-install; see Plugin-Development → Egress.
  if (m.operatorEgress !== undefined && typeof m.operatorEgress !== 'boolean') {
    errors.push('operatorEgress must be a boolean');
  }
  if (m.operatorEgress === true && !permissions.some((p) => p === 'http:outbound' || p.startsWith('http:outbound:'))) {
    errors.push('operatorEgress requires an http:outbound permission');
  }

  const capabilities = (m.capabilities ?? undefined) as {
    widget?: { slot?: unknown };
    tripPage?: { replaces?: unknown; position?: unknown };
    notificationChannel?: { title?: unknown; events?: unknown };
    routeProfiles?: unknown;
    mcpTools?: unknown;
    provides?: unknown;
    emits?: unknown;
    settingsUi?: unknown;
  } | undefined;
  if (capabilities?.settingsUi !== undefined && typeof capabilities.settingsUi !== 'boolean') {
    errors.push('capabilities.settingsUi must be a boolean');
  }
  const widget = capabilities?.widget;
  if (widget?.slot !== undefined && widget.slot !== 'sidebar' && widget.slot !== 'hero' && widget.slot !== 'place-detail' && widget.slot !== 'day-detail' && widget.slot !== 'reservation-detail') {
    errors.push(`widget slot must be "sidebar", "hero", "place-detail", "day-detail" or "reservation-detail", got "${String(widget.slot)}"`);
  }
  // Mirrors the server's REPLACEABLE_TABS — 'plan' is never replaceable.
  const tripPage = capabilities?.tripPage;
  if (tripPage !== undefined) {
    const REPLACEABLE = ['transports', 'buchungen', 'listen', 'finanzplan', 'dateien', 'collab'];
    if (tripPage.replaces !== undefined) {
      if (!Array.isArray(tripPage.replaces)) errors.push('capabilities.tripPage.replaces must be an array');
      else for (const t of tripPage.replaces) {
        if (typeof t !== 'string' || !REPLACEABLE.includes(t)) errors.push(`capabilities.tripPage.replaces: "${String(t)}" is not a replaceable tab (${REPLACEABLE.join(', ')})`);
      }
    }
    if (tripPage.position !== undefined && (typeof tripPage.position !== 'number' || !Number.isInteger(tripPage.position) || tripPage.position < 0 || tripPage.position > 50)) {
      errors.push('capabilities.tripPage.position must be an integer between 0 and 50');
    }
  }
  // Mirrors the server's PLUGIN_CHANNEL_EVENTS. Admin-scoped events (version_available)
  // and inapp-only ones are absent by design: a plugin channel never carries them.
  const notificationChannel = capabilities?.notificationChannel;
  if (notificationChannel !== undefined) {
    if (!permissions.includes('hook:notification-channel')) {
      errors.push('capabilities.notificationChannel requires the "hook:notification-channel" permission');
    }
    if (notificationChannel.title !== undefined && typeof notificationChannel.title !== 'string') {
      errors.push('capabilities.notificationChannel.title must be a string');
    }
    if (notificationChannel.events !== undefined) {
      if (!Array.isArray(notificationChannel.events)) errors.push('capabilities.notificationChannel.events must be an array');
      else for (const e of notificationChannel.events) {
        if (typeof e !== 'string' || !CHANNEL_EVENTS.includes(e)) {
          errors.push(`capabilities.notificationChannel.events: "${String(e)}" is not a plugin-deliverable event (${CHANNEL_EVENTS.join(', ')})`);
        }
      }
    }
  }
  // Mirrors the server's routeProfiles parsing: the planner's route picker shows these,
  // so they must be well-formed and only exist alongside the routeProvider grant.
  const routeProfiles = capabilities?.routeProfiles;
  // Normalized routeProfiles entries (icon dropped when non-string, like the server's
  // optStr()) — populated only when routeProfiles is present and shaped as an array;
  // used to build the output below in place of the raw, possibly-dirty input array.
  let normalizedRouteProfiles: Array<{ id: string; label: string; icon?: string }> | undefined;
  if (routeProfiles !== undefined) {
    if (!permissions.includes('hook:route-provider')) {
      errors.push('capabilities.routeProfiles requires the "hook:route-provider" permission');
    }
    if (!Array.isArray(routeProfiles)) errors.push('capabilities.routeProfiles must be an array');
    else {
      if (routeProfiles.length > 3) errors.push('capabilities.routeProfiles: at most 3 profiles');
      const seen = new Set<string>();
      normalizedRouteProfiles = [];
      for (const v of routeProfiles) {
        const p = (v && typeof v === 'object' ? v : {}) as { id?: unknown; label?: unknown; icon?: unknown };
        const id = typeof p.id === 'string' ? p.id : '';
        if (!/^[a-z][a-z0-9-]{0,23}$/.test(id)) errors.push('capabilities.routeProfiles: id must be lowercase [a-z][a-z0-9-], max 24 chars');
        else if (seen.has(id)) errors.push(`capabilities.routeProfiles: duplicate id "${id}"`);
        else seen.add(id);
        const label = typeof p.label === 'string' ? p.label.trim() : '';
        if (!label || label.length > 40) errors.push('capabilities.routeProfiles: label is required (max 40 chars)');
        // icon is optional; a non-string icon is silently dropped, not rejected — mirrors
        // the server's optStr() (server/src/nest/plugins/install/manifest.ts:519-521),
        // which returns undefined for a non-string value rather than throwing. Length is
        // never rejected either — the server slices to 40 chars at install time.
        const icon = typeof p.icon === 'string' ? p.icon : undefined;
        normalizedRouteProfiles.push(icon !== undefined ? { id, label, icon } : { id, label });
      }
    }
  }
  // MCP tools go into every user's assistant context, so the declaration is
  // checked here too rather than only at install: an author should hear about a
  // malformed one from `trek-plugin validate`, not from a tool that never shows up.
  const mcpTools = capabilities?.mcpTools;
  if (mcpTools !== undefined) {
    if (!permissions.includes('mcp:tools')) {
      errors.push('capabilities.mcpTools requires the "mcp:tools" permission');
    }
    if (!Array.isArray(mcpTools)) errors.push('capabilities.mcpTools must be an array');
    else {
      if (mcpTools.length > 8) errors.push('capabilities.mcpTools: at most 8 tools');
      const seenTools = new Set<string>();
      for (const v of mcpTools) {
        if (!v || typeof v !== 'object' || Array.isArray(v)) {
          errors.push('capabilities.mcpTools entries must be objects');
          continue;
        }
        const t = v as Record<string, unknown>;
        const name = typeof t.name === 'string' ? t.name : '';
        if (!/^[a-z0-9_]{1,48}$/.test(name)) {
          errors.push('capabilities.mcpTools: name must be lowercase [a-z0-9_], max 48 chars');
          continue;
        }
        if (seenTools.has(name)) errors.push(`capabilities.mcpTools: duplicate name "${name}"`);
        seenTools.add(name);
        if (typeof t.description !== 'string' || !t.description.trim()) {
          errors.push(`capabilities.mcpTools["${name}"]: description is required`);
        }
        if (t.inputSchema !== undefined) {
          const schema = t.inputSchema as Record<string, unknown> | null;
          if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
            errors.push(`capabilities.mcpTools["${name}"]: inputSchema must be an object`);
          } else if (schema.type !== undefined && schema.type !== 'object') {
            errors.push(`capabilities.mcpTools["${name}"]: inputSchema root type must be "object"`);
          }
        }
      }
    }
  }

  // Settings keys become JSON object keys in the plugin's stored config, so they are
  // constrained (mirrors the server's SETTING_KEY_RE). `__proto__`/`constructor` would
  // resolve off Object.prototype on read and make a required field look configured for
  // a user who configured nothing.
  if (Array.isArray(m.settings)) {
    for (const s of m.settings as Array<Record<string, unknown>>) {
      if (!s || typeof s !== 'object' || s.key === undefined) continue;
      const key = String(s.key);
      if (!key) continue;
      if (!SETTING_KEY_RE.test(key) || RESERVED_SETTING_KEYS.has(key)) {
        errors.push(`invalid settings key "${key}" (letters, digits, . _ - ; must start with a letter; 1–64 chars)`);
      }
      if (s.scope !== undefined && s.scope !== 'user' && s.scope !== 'instance') {
        errors.push(`settings["${key}"].scope must be "user" or "instance"`);
      }
      if (s.options !== undefined) {
        if (!Array.isArray(s.options)) {
          errors.push('settings option list must be an array');
        } else {
          for (const o of s.options) {
            if (typeof o === 'string' || typeof o === 'number') continue;
            if (o && typeof o === 'object') {
              const value = (o as { value?: unknown }).value;
              if (value === undefined || value === null || String(value) === '') {
                errors.push('settings option must have a non-empty "value"');
              }
            } else {
              errors.push(`invalid settings option ${JSON.stringify(o)} (expected a string or { value, label })`);
            }
          }
        }
      }
      if (s.oauth !== undefined) {
        if (!s.oauth || typeof s.oauth !== 'object' || Array.isArray(s.oauth)) {
          errors.push('settings oauth must be an object');
        } else {
          for (const k of ['initPath', 'callbackPath'] as const) {
            const v = (s.oauth as Record<string, unknown>)[k];
            if (v !== undefined && typeof v !== 'string') errors.push(`settings oauth.${k} must be a string`);
          }
        }
      }
    }
  }
  // Settings-page action buttons ("Test connection"). Keys share the settings-key rules.
  if (m.actions !== undefined) {
    if (!Array.isArray(m.actions)) errors.push('actions must be an array');
    else {
      if (m.actions.length > 8) errors.push('at most 8 actions');
      const seen = new Set<string>();
      for (const a of m.actions as Array<Record<string, unknown>>) {
        if (!a || typeof a !== 'object') { errors.push('each action must be an object'); continue; }
        const key = String(a.key ?? '');
        if (!key) { errors.push('action must have a "key"'); continue; }
        if (!SETTING_KEY_RE.test(key) || RESERVED_SETTING_KEYS.has(key)) errors.push(`invalid action key "${key}"`);
        if (seen.has(key)) errors.push(`duplicate action "${key}"`);
        seen.add(key);
        if (a.label !== undefined && typeof a.label !== 'string') errors.push(`action "${key}" label must be a string`);
      }
    }
  }
  validateCapabilityNames(capabilities?.provides, 'provides', errors);
  validateCapabilityNames(capabilities?.emits, 'emits', errors);

  const requiredAddons = validateRequiredAddons(m.requiredAddons, errors);
  const pluginDependencies = validatePluginDependencies(m.pluginDependencies, typeof m.id === 'string' ? m.id : '', errors);

  if (errors.length) return { ok: false, errors };
  const manifest: NormalizedManifest = {
    id: m.id as string,
    name: m.name as string,
    version: m.version as string,
    apiVersion: typeof m.apiVersion === 'number' ? m.apiVersion : 1,
    trek: m.trek as string,
    type: m.type as PluginManifest['type'],
    permissions,
    egress,
    nativeModules: false,
    requiredAddons,
    pluginDependencies,
  };
  // Carried through verbatim when present — absent stays absent (no undefined keys) — except
  // routeProfiles, which is rebuilt from normalizedRouteProfiles so a dropped (non-string)
  // icon doesn't leak the raw input value back out.
  if (m.capabilities !== undefined) {
    const rawCapabilities = m.capabilities as ManifestCapabilities;
    manifest.capabilities = normalizedRouteProfiles !== undefined
      ? { ...rawCapabilities, routeProfiles: normalizedRouteProfiles }
      : rawCapabilities;
  }
  if (m.settings !== undefined) manifest.settings = m.settings as ManifestSettingField[];
  if (m.actions !== undefined) manifest.actions = m.actions as ManifestAction[];
  if (m.operatorEgress !== undefined) manifest.operatorEgress = m.operatorEgress as boolean;
  if (m.icon !== undefined) manifest.icon = m.icon as string;
  if (m.author !== undefined) manifest.author = m.author as string;
  if (m.description !== undefined) manifest.description = m.description as string;
  if (m.homepage !== undefined) manifest.homepage = m.homepage as string;
  if (m.tags !== undefined) manifest.tags = m.tags as string[];
  if (m.license !== undefined) manifest.license = m.license as string;
  return { ok: true, errors: [], manifest };
}

// Export/event names exposed to other plugins (dots allowed for event names).
const CAPABILITY_NAME_RE = /^[a-zA-Z][a-zA-Z0-9._-]{0,63}$/;

function validateCapabilityNames(raw: unknown, field: string, errors: string[]): void {
  if (raw === undefined) return;
  if (!Array.isArray(raw)) {
    errors.push(`capabilities.${field} must be an array of names`);
    return;
  }
  for (const v of raw) {
    if (typeof v !== 'string' || !CAPABILITY_NAME_RE.test(v)) errors.push(`invalid capabilities.${field} entry "${String(v)}"`);
  }
}

function validateRequiredAddons(raw: unknown, errors: string[]): string[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    errors.push('requiredAddons must be an array of addon ids');
    return [];
  }
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== 'string' || !ADDON_ID_RE.test(v)) {
      errors.push(`invalid requiredAddons entry "${String(v)}"`);
      continue;
    }
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

function validatePluginDependencies(raw: unknown, selfId: string, errors: string[]): PluginDependency[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    errors.push('pluginDependencies must be an array of { id, version }');
    return [];
  }
  const out: PluginDependency[] = [];
  for (const v of raw) {
    if (!v || typeof v !== 'object') {
      errors.push('each pluginDependencies entry must be an object');
      continue;
    }
    const d = v as Record<string, unknown>;
    const id = typeof d.id === 'string' ? d.id : '';
    const version = typeof d.version === 'string' ? d.version : '';
    if (!ID_RE.test(id)) errors.push(`invalid pluginDependencies id "${id}"`);
    else if (RESERVED_IDS.has(id)) errors.push(`pluginDependencies id "${id}" is reserved`);
    else if (id === selfId) errors.push(`plugin "${selfId}" cannot depend on itself`);
    else if (out.some((e) => e.id === id)) errors.push(`duplicate pluginDependencies id "${id}"`);
    if (!version || validRange(version) === null) errors.push(`invalid pluginDependencies version range "${version}" for "${id || '?'}"`);
    if (ID_RE.test(id) && !RESERVED_IDS.has(id) && id !== selfId && version && validRange(version) !== null && !out.some((e) => e.id === id)) {
      out.push({ id, version });
    }
  }
  return out;
}
