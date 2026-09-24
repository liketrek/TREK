// ---------------------------------------------------------------------------
// OAuth 2.1 scope definitions for TREK MCP
// ---------------------------------------------------------------------------

export const SCOPES = {
  TRIPS_READ:          'trips:read',
  TRIPS_WRITE:         'trips:write',
  TRIPS_DELETE:        'trips:delete',
  TRIPS_SHARE:         'trips:share',
  PLACES_READ:         'places:read',
  PLACES_WRITE:        'places:write',
  COLLECTIONS_READ:    'collections:read',
  COLLECTIONS_WRITE:   'collections:write',
  ATLAS_READ:          'atlas:read',
  ATLAS_WRITE:         'atlas:write',
  PACKING_READ:        'packing:read',
  PACKING_WRITE:       'packing:write',
  TODOS_READ:          'todos:read',
  TODOS_WRITE:         'todos:write',
  BUDGET_READ:         'budget:read',
  BUDGET_WRITE:        'budget:write',
  RESERVATIONS_READ:   'reservations:read',
  RESERVATIONS_WRITE:  'reservations:write',
  COLLAB_READ:         'collab:read',
  COLLAB_WRITE:        'collab:write',
  NOTIFICATIONS_READ:  'notifications:read',
  NOTIFICATIONS_WRITE: 'notifications:write',
  VACAY_READ:          'vacay:read',
  VACAY_WRITE:         'vacay:write',
  GEO_READ:            'geo:read',
  WEATHER_READ:        'weather:read',
  JOURNEY_READ:        'journey:read',
  JOURNEY_WRITE:       'journey:write',
  JOURNEY_SHARE:       'journey:share',
  FILES_READ:          'files:read',
  FILES_WRITE:         'files:write',
  // A third mode rather than a second group: listing what a trip carries and
  // reading the bytes of a booking PDF are different privileges, and the plugin
  // host already draws that line (db:read:files vs db:read:files:content). Not
  // implied by files:write, the way journey:share is not implied by
  // journey:write. The policy's fallback branch covers both.
  FILES_CONTENT:       'files:content',
  SETTINGS_READ:       'settings:read',
  SETTINGS_WRITE:      'settings:write',
  // One coarse scope, and a fourth mode rather than a per-plugin group. Which
  // plugins are installed is runtime data, so a per-plugin scope cannot be
  // statically enumerated: it would break the ${group}:${mode} derivation and
  // the AssertExact guards in nest-mcp-policy.ts, and its consent copy could
  // not be written ahead of time for a third-party plugin name. Tokens issued
  // before a plugin existed could never carry its scope either.
  //
  // Per-plugin granularity already exists one layer down, as the admin's
  // mcp:tools grant, and that is the real boundary: this scope only decides
  // whether plugin tools are advertised to a client at all.
  PLUGINS_USE:         'plugins:use',
} as const;

export type Scope = typeof SCOPES[keyof typeof SCOPES];

/** 'trips' | 'places' | ... — derived from SCOPES; adding a scope extends it. */
export type ScopeGroup = Scope extends `${infer G}:${string}` ? G : never;

export const ALL_SCOPES: Scope[] = Object.values(SCOPES) as Scope[];

/**
 * Scopes a client must ask for BY NAME, never handed out by a default.
 *
 * plugins:use runs third-party code as the caller. Nobody registering an MCP
 * client intends to turn that on implicitly, so it is excluded from the DCR
 * fallback below and from the client-side presets (see PRESET_OPT_IN_ONLY in
 * client/src/api/oauthScopes.ts). Asking for it explicitly still works.
 */
export const OPT_IN_ONLY_SCOPES: readonly Scope[] = ['plugins:use'];

/**
 * What a Dynamic Client Registration gets when it names no scopes at all.
 *
 * The consent screen is a second gate, not the only one: a scope in this list
 * is pre-selected there, so "the user still approves it" is not a reason to
 * include something they never asked for.
 */
export const DEFAULT_CLIENT_SCOPES: Scope[] = ALL_SCOPES.filter((s) => !OPT_IN_ONLY_SCOPES.includes(s));

export interface ScopeInfo {
  label: string;
  description: string;
  group: string;
}

export const SCOPE_INFO: Record<Scope, ScopeInfo> = {
  'trips:read':          { label: 'View trips & itineraries',   description: 'Read trips, days, day notes, and members',                              group: 'Trips' },
  'trips:write':         { label: 'Edit trips & itineraries',   description: 'Create and update trips, days, notes, and manage members',              group: 'Trips' },
  'trips:delete':        { label: 'Delete trips',               description: 'Permanently delete entire trips — this action is irreversible',          group: 'Trips' },
  'trips:share':         { label: 'Manage share links',         description: 'Create, update, and revoke public share links for trips',               group: 'Trips' },
  'places:read':         { label: 'View places & map data',     description: 'Read places, day assignments, tags, and categories',                    group: 'Places' },
  'places:write':        { label: 'Manage places',              description: 'Create, update, and delete places, assignments, and tags',              group: 'Places' },
  'collections:read':    { label: 'View collections',           description: 'Read saved-place collections, their places, ratings, labels, and members', group: 'Collections' },
  'collections:write':   { label: 'Manage collections',         description: 'Create/edit collections, save, rate, label and copy places, and share lists', group: 'Collections' },
  'atlas:read':          { label: 'View Atlas',                 description: 'Read visited countries, regions, and bucket list',                      group: 'Atlas' },
  'atlas:write':         { label: 'Manage Atlas',               description: 'Mark countries and regions visited, manage bucket list',                group: 'Atlas' },
  'packing:read':        { label: 'View packing lists',         description: 'Read packing items, bags, and category assignees',                      group: 'Packing' },
  'packing:write':       { label: 'Manage packing lists',       description: 'Add, update, delete, toggle, and reorder packing items and bags',       group: 'Packing' },
  'todos:read':          { label: 'View to-do lists',           description: 'Read trip to-do items and category assignees',                          group: 'To-dos' },
  'todos:write':         { label: 'Manage to-do lists',         description: 'Create, update, toggle, delete, and reorder to-do items',               group: 'To-dos' },
  'budget:read':         { label: 'View budget',                description: 'Read budget items and expense breakdown',                               group: 'Budget' },
  'budget:write':        { label: 'Manage budget',              description: 'Create, update, and delete budget items',                               group: 'Budget' },
  'reservations:read':   { label: 'View reservations',          description: 'Read reservations and accommodation details',                           group: 'Reservations' },
  'reservations:write':  { label: 'Manage reservations',        description: 'Create, update, delete, and reorder reservations',                     group: 'Reservations' },
  'collab:read':         { label: 'View collaboration',         description: 'Read collab notes, polls, and messages',                               group: 'Collaboration' },
  'collab:write':        { label: 'Manage collaboration',       description: 'Create, update, and delete collab notes, polls, and messages',          group: 'Collaboration' },
  'notifications:read':  { label: 'View notifications',         description: 'Read in-app notifications and unread counts',                          group: 'Notifications' },
  'notifications:write': { label: 'Manage notifications',       description: 'Mark notifications as read and respond to them',                       group: 'Notifications' },
  'vacay:read':          { label: 'View vacation plans',        description: 'Read vacation planning data, entries, and stats',                      group: 'Vacation' },
  'vacay:write':         { label: 'Manage vacation plans',      description: 'Create and manage vacation entries, holidays, and team plans',          group: 'Vacation' },
  'geo:read':            { label: 'Maps, geocoding & transit',  description: 'Search locations and public transit routes, resolve map URLs, and reverse geocode coordinates', group: 'Geo' },
  'weather:read':        { label: 'Weather forecasts',          description: 'Fetch weather forecasts for trip locations and dates',                  group: 'Weather' },
  'journey:read':        { label: 'View journeys',              description: 'Read journeys, entries, and contributor list',                          group: 'Journey' },
  'journey:write':       { label: 'Manage journeys',            description: 'Create, update, and delete journeys and their entries',                 group: 'Journey' },
  'journey:share':       { label: 'Manage journey links',       description: 'Create, update, and revoke public share links for journeys',            group: 'Journey' },
  'files:read':          { label: 'View trip files',            description: 'List the documents on a trip: names, sizes, who uploaded them, what they link to', group: 'Files' },
  'files:write':         { label: 'Organise trip files',        description: 'Rename and describe files, link them to bookings and places, star and trash them', group: 'Files' },
  'files:content':       { label: 'Read file contents',         description: 'Read what is inside an uploaded document, such as a booking PDF or a ticket', group: 'Files' },
  'settings:read':       { label: 'View your preferences',      description: 'Read units, time format, language, default currency, and start page',   group: 'Settings' },
  'settings:write':      { label: 'Change your preferences',    description: 'Change units, time format, language, default currency, and start page. Never stored API keys', group: 'Settings' },
  'plugins:use':         { label: 'Run plugin tools',           description: 'Let this client call tools published by the plugins an administrator installed and approved. Each plugin acts with the access it was already granted, not with the scopes on this token', group: 'Plugins' },
};

// ---------------------------------------------------------------------------
// Scope enforcement helpers
// null scopes = static trek_ token = full access
// ---------------------------------------------------------------------------

/** trips:read OR trips:write OR trips:delete OR trips:share all grant read access to trips */
export function canReadTrips(scopes: string[] | null): boolean {
  if (!scopes) return true;
  return scopes.some(s => s === 'trips:read' || s === 'trips:write' || s === 'trips:delete' || s === 'trips:share');
}

/** group:write grants write access; for trips canReadTrips handles read */
export function canWrite(scopes: string[] | null, group: ScopeGroup): boolean {
  if (!scopes) return true;
  return scopes.includes(`${group}:write`);
}

/** group:read OR group:write grant read access */
export function canRead(scopes: string[] | null, group: ScopeGroup): boolean {
  if (!scopes) return true;
  return scopes.some(s => s === `${group}:read` || s === `${group}:write`);
}

/** trips:delete is a separate scope from trips:write */
export function canDeleteTrips(scopes: string[] | null): boolean {
  if (!scopes) return true;
  return scopes.includes('trips:delete');
}

/** trips:share is a separate scope for managing public share links */
export function canShareTrips(scopes: string[] | null): boolean {
  if (!scopes) return true;
  return scopes.includes('trips:share');
}

/**
 * files:content is a separate scope from files:read: a token may list a trip's
 * documents without being allowed to read what is inside them.
 */
export function canReadFileContent(scopes: string[] | null): boolean {
  if (!scopes) return true;
  return scopes.includes('files:content');
}

/** journey:share is a separate scope for managing public share links for journeys */
export function canShareJourneys(scopes: string[] | null): boolean {
  if (!scopes) return true;
  return scopes.includes('journey:share');
}

export function validateScopes(requestedScopes: string[]): { valid: boolean; invalid: string[] } {
  const invalid = requestedScopes.filter(s => !ALL_SCOPES.includes(s as Scope));
  return { valid: invalid.length === 0, invalid };
}
