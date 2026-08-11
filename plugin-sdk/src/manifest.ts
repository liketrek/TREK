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
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  apiVersion: number;
  /** The semver RANGE of TREK versions this plugin supports (">=3.2.0 <4.0.0"). */
  trek: string;
  type: 'integration' | 'page' | 'widget' | 'trip-page';
  permissions: string[];
  egress: string[];
  nativeModules?: boolean;
  requiredAddons: string[];
  pluginDependencies: PluginDependency[];
}
export interface ValidationResult {
  ok: boolean;
  errors: string[];
  manifest?: PluginManifest;
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
export const KNOWN_PERMISSIONS = [
  'db:own',
  'db:read:trips', 'db:read:users', 'db:read:costs', 'db:read:packing', 'db:read:files',
  'db:read:files:content', 'db:read:collab',
  'db:read:journal', 'db:read:atlas', 'db:read:vacay', 'db:read:daynotes', 'db:read:collections',
  'db:read:categories', 'db:read:tags', 'db:read:todos',
  'db:write:costs', 'db:write:places', 'db:write:days', 'db:write:itinerary', 'db:write:trips',
  'db:write:reservations', 'db:write:accommodations', 'db:write:packing', 'db:write:files',
  'db:write:collab', 'db:write:members', 'db:write:collections', 'db:write:atlas', 'db:write:vacay',
  'db:write:journal', 'db:write:tags', 'db:write:todos', 'db:write:daynotes',
  'db:create:trips',
  'db:meta',
  'ws:broadcast:trip', 'ws:broadcast:user',
  'hook:photo-provider', 'hook:calendar-source', 'hook:place-detail-provider', 'hook:trip-warning-provider',
  'hook:table-contributor', 'hook:map-marker-provider', 'hook:pdf-section-provider', 'hook:atlas-layer-provider',
  'hook:journal-entry-provider', 'hook:trip-card-provider', 'hook:notification-channel', 'hook:user-data',
  'events:subscribe', 'jobs:run', 'http:outbound',
  'weather:read', 'rates:read', 'notify:send', 'ai:invoke', 'oauth:client',
];

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
        ? `"trek" is not a satisfiable semver range: "${m.trek}" (e.g. ">=3.2.0 <4.0.0")`
        : 'missing "trek" — declare the TREK versions this plugin supports, e.g. ">=3.2.0 <4.0.0"',
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
  return {
    ok: true,
    errors: [],
    manifest: {
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
    },
  };
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
