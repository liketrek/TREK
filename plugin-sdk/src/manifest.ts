/**
 * Manifest validation (#plugins, M6). Identical rules to the TREK server's
 * loader, so `trek-plugin validate` locally == the registry CI gate. Returns a
 * result (no throw) so the CLI can print every problem at once.
 */

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  apiVersion: number;
  type: 'integration' | 'page' | 'widget';
  permissions: string[];
  egress: string[];
  nativeModules?: boolean;
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
// An outbound host: exact hostname (single-label sibling or dotted FQDN) or a
// `*.`-wildcard with a multi-label suffix. No `*`, no `*.`, no whole-TLD `*.com`,
// no spaces (mirrors the server manifest validator).
const HOST_RE = /^(\*\.[a-z0-9-]+(\.[a-z0-9-]+)+|[a-z0-9-]+(\.[a-z0-9-]+)*)$/i;
const TYPES = ['integration', 'page', 'widget'];
const KNOWN_PERMISSIONS = [
  'db:own', 'db:read:trips', 'db:read:users', 'ws:broadcast:trip', 'ws:broadcast:user',
  'hook:photo-provider', 'hook:calendar-source', 'http:outbound',
];

function isKnownPermission(p: string): boolean {
  return KNOWN_PERMISSIONS.includes(p) || p.startsWith('http:outbound:');
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
  if (wantsOutbound && egress.length === 0) errors.push('http:outbound declared but egress[] is empty');
  if (egress.includes('*')) errors.push('egress[] must not contain a bare "*"');
  for (const h of egress) if (!HOST_RE.test(h)) errors.push(`invalid egress host "${h}"`);

  const widget = (m.capabilities as { widget?: { slot?: unknown } } | undefined)?.widget;
  if (widget?.slot !== undefined && widget.slot !== 'sidebar' && widget.slot !== 'hero') {
    errors.push(`widget slot must be "sidebar" or "hero", got "${String(widget.slot)}"`);
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    errors: [],
    manifest: {
      id: m.id as string,
      name: m.name as string,
      version: m.version as string,
      apiVersion: typeof m.apiVersion === 'number' ? m.apiVersion : 1,
      type: m.type as PluginManifest['type'],
      permissions,
      egress,
      nativeModules: false,
    },
  };
}
