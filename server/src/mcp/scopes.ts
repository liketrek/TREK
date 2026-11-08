import { ALL_SCOPES as SHARED_ALL_SCOPES, CORE_CLIENT_SCOPES, type Scope, type ScopeGroup } from '@trek/shared';

/**
 * The catalogue itself (SCOPES, the groups, the presets and the implied-scope
 * map of the tours / road trip / Studio split) lives in @trek/shared
 * (`shared/src/oauth/scopes.ts`), so the consent screen and the client presets
 * read the same list the server checks. What stays here is the server's side:
 * the English SCOPE_INFO and the checks.
 */
export {
  CORE_CLIENT_SCOPES,
  IMPLIED_SCOPE_GROUPS,
  OPT_IN_ONLY_SCOPES,
  SCOPES,
  withImpliedScopes,
  type Scope,
  type ScopeGroup,
} from '@trek/shared';

export const ALL_SCOPES: Scope[] = [...SHARED_ALL_SCOPES];

/**
 * What a Dynamic Client Registration (or a client ID metadata document) gets
 * when it names no scopes at all: the core set. The heavier families are one
 * tick away on the consent screen, and a scope in this list is pre-selected
 * there, so "the user still approves it" is not a reason to include something
 * they never asked for. `lint:mcp-surface` measures it as its `core` session.
 */
export const DEFAULT_CLIENT_SCOPES: Scope[] = [...CORE_CLIENT_SCOPES];

export interface ScopeInfo {
  label: string;
  description: string;
  group: string;
}

export const SCOPE_INFO: Record<Scope, ScopeInfo> = {
  'trips:read': {
    label: 'View trips & itineraries',
    description: 'Read trips, days, day notes, and members',
    group: 'Trips',
  },
  'trips:write': {
    label: 'Edit trips & itineraries',
    description: 'Create and update trips, days, notes, and manage members',
    group: 'Trips',
  },
  'trips:delete': {
    label: 'Delete trips',
    description: 'Permanently delete entire trips — this action is irreversible',
    group: 'Trips',
  },
  'trips:share': {
    label: 'Manage share links',
    description: 'Create, update, and revoke public share links for trips',
    group: 'Trips',
  },
  'places:read': {
    label: 'View places & map data',
    description: 'Read places, day assignments, tags, and categories',
    group: 'Places',
  },
  'places:write': {
    label: 'Manage places',
    description: 'Create, update, and delete places, assignments, and tags',
    group: 'Places',
  },
  'tours:read': {
    label: 'View tours',
    description: 'Read hikes, walks, rides, paddle and ski tours with their stops and packing',
    group: 'Tours',
  },
  'tours:write': {
    label: 'Plan tours',
    description: 'Propose, create, edit and delete tours, their stops, activities and packing links',
    group: 'Tours',
  },
  'roadtrip:read': {
    label: 'View road trips',
    description: 'Read routes, driving days, charging stops and road hazards',
    group: 'Road trip',
  },
  'roadtrip:write': {
    label: 'Plan road trips',
    description: 'Calculate routes, set driving days and preferences, and import routes',
    group: 'Road trip',
  },
  'collections:read': {
    label: 'View collections',
    description: 'Read saved-place collections, their places, ratings, labels, and members',
    group: 'Collections',
  },
  'collections:write': {
    label: 'Manage collections',
    description: 'Create/edit collections, save, rate, label and copy places, and share lists',
    group: 'Collections',
  },
  'atlas:read': {
    label: 'View Atlas',
    description: 'Read visited countries, regions, and bucket list',
    group: 'Atlas',
  },
  'atlas:write': {
    label: 'Manage Atlas',
    description: 'Mark countries and regions visited, manage bucket list',
    group: 'Atlas',
  },
  'packing:read': {
    label: 'View packing lists',
    description: 'Read packing items, bags, and category assignees',
    group: 'Packing',
  },
  'packing:write': {
    label: 'Manage packing lists',
    description: 'Add, update, delete, toggle, and reorder packing items and bags',
    group: 'Packing',
  },
  'todos:read': {
    label: 'View to-do lists',
    description: 'Read trip to-do items and category assignees',
    group: 'To-dos',
  },
  'todos:write': {
    label: 'Manage to-do lists',
    description: 'Create, update, toggle, delete, and reorder to-do items',
    group: 'To-dos',
  },
  'budget:read': { label: 'View budget', description: 'Read budget items and expense breakdown', group: 'Budget' },
  'budget:write': { label: 'Manage budget', description: 'Create, update, and delete budget items', group: 'Budget' },
  'reservations:read': {
    label: 'View reservations',
    description: 'Read reservations and accommodation details',
    group: 'Reservations',
  },
  'reservations:write': {
    label: 'Manage reservations',
    description: 'Create, update, delete, and reorder reservations',
    group: 'Reservations',
  },
  'collab:read': {
    label: 'View collaboration',
    description: 'Read collab notes, polls, and messages',
    group: 'Collaboration',
  },
  'collab:write': {
    label: 'Manage collaboration',
    description: 'Create, update, and delete collab notes, polls, and messages',
    group: 'Collaboration',
  },
  'notifications:read': {
    label: 'View notifications',
    description: 'Read in-app notifications and unread counts',
    group: 'Notifications',
  },
  'notifications:write': {
    label: 'Manage notifications',
    description: 'Mark notifications as read and respond to them',
    group: 'Notifications',
  },
  'vacay:read': {
    label: 'View vacation plans',
    description: 'Read vacation planning data, entries, and stats',
    group: 'Vacation',
  },
  'vacay:write': {
    label: 'Manage vacation plans',
    description: 'Create and manage vacation entries, holidays, and team plans',
    group: 'Vacation',
  },
  'geo:read': {
    label: 'Maps, geocoding & transit',
    description: 'Search locations and public transit routes, resolve map URLs, and reverse geocode coordinates',
    group: 'Geo',
  },
  'weather:read': {
    label: 'Weather forecasts',
    description: 'Fetch weather forecasts for trip locations and dates',
    group: 'Weather',
  },
  'journey:read': {
    label: 'View journeys',
    description: 'Read journeys, entries, and contributor list',
    group: 'Journey',
  },
  'journey:write': {
    label: 'Manage journeys',
    description: 'Create, update, and delete journeys and their entries',
    group: 'Journey',
  },
  'journey:share': {
    label: 'Manage journey links',
    description: 'Create, update, and revoke public share links for journeys',
    group: 'Journey',
  },
  'studio:read': {
    label: 'View journey books',
    description: 'Read the pages, design and photos of a journey book',
    group: 'Studio',
  },
  'studio:write': {
    label: 'Design journey books',
    description: 'Create, edit, restyle and restore the pages of a journey book',
    group: 'Studio',
  },
  'files:read': {
    label: 'View trip files',
    description: 'List the documents on a trip: names, sizes, who uploaded them, what they link to',
    group: 'Files',
  },
  'files:write': {
    label: 'Organise trip files',
    description: 'Rename and describe files, link them to bookings and places, star and trash them',
    group: 'Files',
  },
  'files:content': {
    label: 'Read file contents',
    description: 'Read what is inside an uploaded document, such as a booking PDF or a ticket',
    group: 'Files',
  },
  'settings:read': {
    label: 'View your preferences',
    description: 'Read units, time format, language, default currency, and start page',
    group: 'Settings',
  },
  'settings:write': {
    label: 'Change your preferences',
    description: 'Change units, time format, language, default currency, and start page. Never stored API keys',
    group: 'Settings',
  },
  'plugins:use': {
    label: 'Run plugin tools',
    description:
      'Let this client call tools published by the plugins an administrator installed and approved. Each plugin acts with the access it was already granted, not with the scopes on this token',
    group: 'Plugins',
  },
};

// ---------------------------------------------------------------------------
// Scope enforcement helpers
// null scopes = static trek_ token = full access
// ---------------------------------------------------------------------------

/** trips:read OR trips:write OR trips:delete OR trips:share all grant read access to trips */
export function canReadTrips(scopes: string[] | null): boolean {
  if (!scopes) return true;
  return scopes.some((s) => s === 'trips:read' || s === 'trips:write' || s === 'trips:delete' || s === 'trips:share');
}

/** group:write grants write access; for trips canReadTrips handles read */
export function canWrite(scopes: string[] | null, group: ScopeGroup): boolean {
  if (!scopes) return true;
  return scopes.includes(`${group}:write`);
}

/** group:read OR group:write grant read access */
export function canRead(scopes: string[] | null, group: ScopeGroup): boolean {
  if (!scopes) return true;
  return scopes.some((s) => s === `${group}:read` || s === `${group}:write`);
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
  const invalid = requestedScopes.filter((s) => !ALL_SCOPES.includes(s as Scope));
  return { valid: invalid.length === 0, invalid };
}
