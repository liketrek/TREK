/**
 * The OAuth scopes a client can ask TREK for: the one list the server checks
 * tokens against, the consent screen draws and the client presets pick from.
 * Server-side checks (`canRead`, `canWrite`, …) and the English `SCOPE_INFO`
 * stay in `server/src/mcp/scopes.ts`; the labels the UI shows are the
 * `oauth.scope.<scope>.label` keys in the locales.
 */
export const SCOPES = {
  TRIPS_READ: 'trips:read',
  TRIPS_WRITE: 'trips:write',
  TRIPS_DELETE: 'trips:delete',
  TRIPS_SHARE: 'trips:share',
  PLACES_READ: 'places:read',
  PLACES_WRITE: 'places:write',
  TOURS_READ: 'tours:read',
  TOURS_WRITE: 'tours:write',
  ROADTRIP_READ: 'roadtrip:read',
  ROADTRIP_WRITE: 'roadtrip:write',
  COLLECTIONS_READ: 'collections:read',
  COLLECTIONS_WRITE: 'collections:write',
  ATLAS_READ: 'atlas:read',
  ATLAS_WRITE: 'atlas:write',
  PACKING_READ: 'packing:read',
  PACKING_WRITE: 'packing:write',
  TODOS_READ: 'todos:read',
  TODOS_WRITE: 'todos:write',
  BUDGET_READ: 'budget:read',
  BUDGET_WRITE: 'budget:write',
  RESERVATIONS_READ: 'reservations:read',
  RESERVATIONS_WRITE: 'reservations:write',
  COLLAB_READ: 'collab:read',
  COLLAB_WRITE: 'collab:write',
  NOTIFICATIONS_READ: 'notifications:read',
  NOTIFICATIONS_WRITE: 'notifications:write',
  VACAY_READ: 'vacay:read',
  VACAY_WRITE: 'vacay:write',
  GEO_READ: 'geo:read',
  WEATHER_READ: 'weather:read',
  JOURNEY_READ: 'journey:read',
  JOURNEY_WRITE: 'journey:write',
  JOURNEY_SHARE: 'journey:share',
  STUDIO_READ: 'studio:read',
  STUDIO_WRITE: 'studio:write',
  FILES_READ: 'files:read',
  FILES_WRITE: 'files:write',
  FILES_CONTENT: 'files:content',
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
  PLUGINS_USE: 'plugins:use',
} as const;

export type Scope = (typeof SCOPES)[keyof typeof SCOPES];

/** 'trips' | 'places' | ... — derived from SCOPES; adding a scope extends it. */
export type ScopeGroup = Scope extends `${infer G}:${string}` ? G : never;

export const ALL_SCOPES: readonly Scope[] = Object.values(SCOPES);

/** The group half of a scope: 'trips' for 'trips:read'. */
export function scopeGroup(scope: Scope): ScopeGroup {
  return scope.slice(0, scope.indexOf(':')) as ScopeGroup;
}

/**
 * Scopes a client must ask for BY NAME, never handed out by a default or ticked
 * by a preset. plugins:use runs third-party code as the caller.
 */
export const OPT_IN_ONLY_SCOPES: readonly Scope[] = ['plugins:use'];

/**
 * The core of what a client usually needs: the trip, its places and days, the
 * map and weather, packing, budget, bookings and to-dos, and read access to
 * files, settings and notifications. What Dynamic Client Registration hands out
 * when a client names no scopes, and what the client presets tick. The heavier
 * families (tours, road trip, the journey and its Studio, collections, atlas,
 * vacay, collab) stay one tick away on the same screen.
 */
export const CORE_CLIENT_SCOPES: readonly Scope[] = [
  'trips:read',
  'trips:write',
  'places:read',
  'places:write',
  'geo:read',
  'weather:read',
  'packing:read',
  'packing:write',
  'budget:read',
  'budget:write',
  'reservations:read',
  'reservations:write',
  'todos:read',
  'todos:write',
  'files:read',
  'settings:read',
  'notifications:read',
];

/** The read-only preset: every read scope a default may hand out. */
export const READONLY_CLIENT_SCOPES: readonly Scope[] = ALL_SCOPES.filter(
  (s) => s.endsWith(':read') && !OPT_IN_ONLY_SCOPES.includes(s),
);

/**
 * Groups split off an older one: tours and road trip from trips (road trip also
 * from places, where its route import lived), the journey's Studio from the
 * journey. A client registered before the split asks for the older group only;
 * for one release that request also covers the newer groups the client is
 * allowed (`withImpliedScopes`), and the migration that introduced the groups
 * extended the grants already stored. Remove after that release.
 */
export const IMPLIED_SCOPE_GROUPS: Readonly<Partial<Record<ScopeGroup, readonly ScopeGroup[]>>> = {
  trips: ['tours', 'roadtrip'],
  places: ['roadtrip'],
  journey: ['studio'],
};

const SCOPE_SET: ReadonlySet<string> = new Set(ALL_SCOPES);

/** The scopes `scopes` implies through IMPLIED_SCOPE_GROUPS, mode for mode (read → read, write → write). */
export function impliedScopes(scopes: readonly string[]): Scope[] {
  const implied = new Set<Scope>();
  for (const scope of scopes) {
    const [group, mode] = scope.split(':');
    for (const target of IMPLIED_SCOPE_GROUPS[group as ScopeGroup] ?? []) {
      const candidate = `${target}:${mode}`;
      if (SCOPE_SET.has(candidate)) implied.add(candidate as Scope);
    }
  }
  return [...implied];
}

/**
 * `requested` plus what it implies, as far as `allowed` permits: a client
 * allowed tours that asks for trips gets tours too; a client registered with
 * the core set (no tours) does not.
 */
export function withImpliedScopes(requested: readonly string[], allowed: readonly string[]): string[] {
  const extra = impliedScopes(requested).filter((s) => allowed.includes(s) && !requested.includes(s));
  return [...requested, ...extra];
}
