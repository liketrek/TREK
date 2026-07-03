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
  /** Where the widget mounts: dashboard sidebar (default) or as a hero-bar overlay. */
  slot?: 'sidebar' | 'hero';
}

export interface PluginCapabilities {
  widget?: WidgetCapability;
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
  type: 'integration' | 'page' | 'widget';
  trek?: string;
  minTrekVersion?: string;
  nativeModules: boolean;
  permissions: string[];
  egress: string[];
  settings: ManifestSettingField[];
  capabilities: PluginCapabilities;
}

const ID_RE = /^[a-z][a-z0-9-]{2,39}$/;
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const TYPES = new Set(['integration', 'page', 'widget']);

export class ManifestError extends Error {}

export function parseManifest(raw: unknown): PluginManifest {
  if (!raw || typeof raw !== 'object') throw new ManifestError('manifest is not an object');
  const m = raw as Record<string, unknown>;

  const id = str(m.id, 'id');
  if (!ID_RE.test(id)) throw new ManifestError(`invalid id "${id}" (lowercase slug, 3–40 chars)`);
  const version = str(m.version, 'version');
  if (!SEMVER_RE.test(version)) throw new ManifestError(`invalid version "${version}"`);
  const type = str(m.type, 'type');
  if (!TYPES.has(type)) throw new ManifestError(`invalid type "${type}"`);

  if (m.nativeModules === true) throw new ManifestError('native modules are not allowed');

  const permissions = arr(m.permissions).map(String);
  const unknown = permissions.filter((p) => !isKnownPermission(p));
  if (unknown.length) throw new ManifestError(`unknown permission(s): ${unknown.join(', ')}`);

  const egress = arr(m.egress).map(String);
  if (permissions.some((p) => p === 'http:outbound' || p.startsWith('http:outbound:')) && egress.length === 0) {
    throw new ManifestError('http:outbound declared but egress[] is empty');
  }
  if (egress.includes('*')) throw new ManifestError('egress[] must not contain a bare "*"');

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
  };
}

function parseCapabilities(raw: unknown): PluginCapabilities {
  if (!raw || typeof raw !== 'object') return {};
  const c = raw as Record<string, unknown>;
  const out: PluginCapabilities = {};
  if (c.widget && typeof c.widget === 'object') {
    const w = c.widget as Record<string, unknown>;
    const slot = optStr(w.slot);
    if (slot && slot !== 'sidebar' && slot !== 'hero') throw new ManifestError(`invalid widget slot "${slot}"`);
    out.widget = {
      title: optStr(w.title),
      defaultSize: optStr(w.defaultSize),
      slot: (slot as WidgetCapability['slot']) ?? 'sidebar',
    };
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
