/**
 * The permission families TREK enforces OUTSIDE the ctx object — and the single
 * PermissionDenied both the dev server and the mock host throw.
 *
 * ctx methods are gated at call time (an ungranted ctx.trips.getById throws). But a
 * hook, an event subscription and a job are gated BEFORE the plugin is ever reached:
 * the supervisor simply never selects an ungranted plugin as a provider, never
 * delivers it an event, and never schedules its jobs. That failure is SILENT in
 * production — the plugin installs, activates, and then does nothing at all — so dev
 * and the mock driver must be the place it becomes loud.
 */

/** Thrown by the dev server and the mock host for any ungranted capability. */
export class PermissionDenied extends Error {}

/**
 * hooks.<key> → the permission that must ALSO be granted for TREK to ever call it.
 * Mirrors HOOK_PERMISSION in the host's supervisor (plugin-supervisor.ts): a plugin
 * provides a hook only if it BOTH implements it and holds this grant.
 */
export const HOOK_PERMISSION: Readonly<Record<string, string>> = {
  photoProvider: 'hook:photo-provider',
  calendarSource: 'hook:calendar-source',
  placeDetailProvider: 'hook:place-detail-provider',
  warningProvider: 'hook:trip-warning-provider',
  tableContributor: 'hook:table-contributor',
  mapMarkerProvider: 'hook:map-marker-provider',
  pdfSectionProvider: 'hook:pdf-section-provider',
  atlasLayerProvider: 'hook:atlas-layer-provider',
  journalEntryProvider: 'hook:journal-entry-provider',
  tripCardProvider: 'hook:trip-card-provider',
  notificationChannel: 'hook:notification-channel',
};

/** Gates the GDPR handlers (deleteUserData / exportUserData). Not a hooks.* key. */
export const USER_DATA_PERMISSION = 'hook:user-data';
/** Gates event subscriptions — without it the host delivers the plugin nothing. */
export const EVENTS_PERMISSION = 'events:subscribe';
/** Gates jobs, and the ctx.scheduler timers that fire `scheduled`. */
export const JOBS_PERMISSION = 'jobs:run';

const HTTP_OUTBOUND = 'http:outbound:';

/** The structural shape of a loaded plugin that grantGaps needs. */
export interface PluginEntryPoints {
  jobs?: unknown[];
  scheduled?: unknown;
  events?: unknown[];
  deleteUserData?: unknown;
  exportUserData?: unknown;
  hooks?: Record<string, unknown>;
}

/** An entry point the plugin implements but has no permission to actually run. */
export interface GrantGap {
  /** What the plugin implements, e.g. `hooks.warningProvider` or `jobs`. */
  entryPoint: string;
  /** The permission the manifest is missing. */
  permission: string;
  /** What TREK does instead — always a silent no-op, hence the warning. */
  consequence: string;
}

/**
 * Every entry point the plugin implements without the permission that makes TREK
 * call it. Pure, so both the dev banner and the tests can use it.
 *
 * The consequence is worth spelling out to the author: production does NOT throw
 * here, it just never invokes them — "my plugin does nothing and logs nothing" is
 * exactly the bug this catches.
 */
export function grantGaps(plugin: PluginEntryPoints, grants: ReadonlySet<string>): GrantGap[] {
  const gaps: GrantGap[] = [];
  const gap = (entryPoint: string, permission: string, noun: string) => {
    if (!grants.has(permission)) gaps.push({ entryPoint, permission, consequence: `TREK will never ${noun}` });
  };

  for (const key of Object.keys(plugin.hooks ?? {})) {
    const perm = HOOK_PERMISSION[key];
    // An unknown hooks.* key is the plugin's business (the host ignores it), not a gap.
    if (perm && plugin.hooks?.[key]) gap(`hooks.${key}`, perm, `call this hook`);
  }
  if (plugin.jobs?.length) gap('jobs', JOBS_PERMISSION, 'schedule your jobs');
  if (typeof plugin.scheduled === 'function') gap('scheduled', JOBS_PERMISSION, 'let you arm a timer (ctx.scheduler is denied)');
  if (plugin.events?.length) gap('events', EVENTS_PERMISSION, 'deliver you any event');
  if (typeof plugin.deleteUserData === 'function') gap('deleteUserData', USER_DATA_PERMISSION, 'call your GDPR erasure handler');
  if (typeof plugin.exportUserData === 'function') gap('exportUserData', USER_DATA_PERMISSION, 'call your GDPR export handler');
  return gaps;
}

/**
 * The hosts a plugin may actually reach. TREK builds its runtime network allowlist
 * from the `http:outbound:<host>` PERMISSIONS — the manifest's `egress[]` array is
 * the consent-screen declaration and is never read at runtime. A bare `http:outbound`
 * with no host suffix therefore reaches nothing.
 */
export function grantedHosts(grants: Iterable<string>): string[] {
  return [...grants]
    .filter((p) => p.startsWith(HTTP_OUTBOUND))
    .map((p) => p.slice(HTTP_OUTBOUND.length))
    .filter(Boolean); // a bare `http:outbound:` names no host
}
