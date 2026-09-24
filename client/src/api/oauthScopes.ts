// Human-readable scope definitions for the OAuth consent page.
// Must stay in sync with server/src/mcp/scopes.ts

export interface ScopeInfo {
  label: string
  description: string
  group: string
}

export interface ScopeKeys {
  labelKey: string
  descriptionKey: string
  groupKey: string
}

export const SCOPE_GROUPS: Record<string, ScopeKeys> = {
  'trips:read':          { labelKey: 'oauth.scope.trips:read.label',          descriptionKey: 'oauth.scope.trips:read.description',          groupKey: 'oauth.scope.group.trips' },
  'trips:write':         { labelKey: 'oauth.scope.trips:write.label',         descriptionKey: 'oauth.scope.trips:write.description',         groupKey: 'oauth.scope.group.trips' },
  'trips:delete':        { labelKey: 'oauth.scope.trips:delete.label',        descriptionKey: 'oauth.scope.trips:delete.description',        groupKey: 'oauth.scope.group.trips' },
  'trips:share':         { labelKey: 'oauth.scope.trips:share.label',         descriptionKey: 'oauth.scope.trips:share.description',         groupKey: 'oauth.scope.group.trips' },
  'places:read':         { labelKey: 'oauth.scope.places:read.label',         descriptionKey: 'oauth.scope.places:read.description',         groupKey: 'oauth.scope.group.places' },
  'places:write':        { labelKey: 'oauth.scope.places:write.label',        descriptionKey: 'oauth.scope.places:write.description',        groupKey: 'oauth.scope.group.places' },
  'collections:read':    { labelKey: 'oauth.scope.collections:read.label',    descriptionKey: 'oauth.scope.collections:read.description',    groupKey: 'oauth.scope.group.collections' },
  'collections:write':   { labelKey: 'oauth.scope.collections:write.label',   descriptionKey: 'oauth.scope.collections:write.description',   groupKey: 'oauth.scope.group.collections' },
  'atlas:read':          { labelKey: 'oauth.scope.atlas:read.label',          descriptionKey: 'oauth.scope.atlas:read.description',          groupKey: 'oauth.scope.group.atlas' },
  'atlas:write':         { labelKey: 'oauth.scope.atlas:write.label',         descriptionKey: 'oauth.scope.atlas:write.description',         groupKey: 'oauth.scope.group.atlas' },
  'packing:read':        { labelKey: 'oauth.scope.packing:read.label',        descriptionKey: 'oauth.scope.packing:read.description',        groupKey: 'oauth.scope.group.packing' },
  'packing:write':       { labelKey: 'oauth.scope.packing:write.label',       descriptionKey: 'oauth.scope.packing:write.description',       groupKey: 'oauth.scope.group.packing' },
  'todos:read':          { labelKey: 'oauth.scope.todos:read.label',          descriptionKey: 'oauth.scope.todos:read.description',          groupKey: 'oauth.scope.group.todos' },
  'todos:write':         { labelKey: 'oauth.scope.todos:write.label',         descriptionKey: 'oauth.scope.todos:write.description',         groupKey: 'oauth.scope.group.todos' },
  'budget:read':         { labelKey: 'oauth.scope.budget:read.label',         descriptionKey: 'oauth.scope.budget:read.description',         groupKey: 'oauth.scope.group.budget' },
  'budget:write':        { labelKey: 'oauth.scope.budget:write.label',        descriptionKey: 'oauth.scope.budget:write.description',        groupKey: 'oauth.scope.group.budget' },
  'reservations:read':   { labelKey: 'oauth.scope.reservations:read.label',   descriptionKey: 'oauth.scope.reservations:read.description',   groupKey: 'oauth.scope.group.reservations' },
  'reservations:write':  { labelKey: 'oauth.scope.reservations:write.label',  descriptionKey: 'oauth.scope.reservations:write.description',  groupKey: 'oauth.scope.group.reservations' },
  'collab:read':         { labelKey: 'oauth.scope.collab:read.label',         descriptionKey: 'oauth.scope.collab:read.description',         groupKey: 'oauth.scope.group.collab' },
  'collab:write':        { labelKey: 'oauth.scope.collab:write.label',        descriptionKey: 'oauth.scope.collab:write.description',        groupKey: 'oauth.scope.group.collab' },
  'notifications:read':  { labelKey: 'oauth.scope.notifications:read.label',  descriptionKey: 'oauth.scope.notifications:read.description',  groupKey: 'oauth.scope.group.notifications' },
  'notifications:write': { labelKey: 'oauth.scope.notifications:write.label', descriptionKey: 'oauth.scope.notifications:write.description', groupKey: 'oauth.scope.group.notifications' },
  'vacay:read':          { labelKey: 'oauth.scope.vacay:read.label',          descriptionKey: 'oauth.scope.vacay:read.description',          groupKey: 'oauth.scope.group.vacay' },
  'vacay:write':         { labelKey: 'oauth.scope.vacay:write.label',         descriptionKey: 'oauth.scope.vacay:write.description',         groupKey: 'oauth.scope.group.vacay' },
  'geo:read':            { labelKey: 'oauth.scope.geo:read.label',            descriptionKey: 'oauth.scope.geo:read.description',            groupKey: 'oauth.scope.group.geo' },
  'weather:read':        { labelKey: 'oauth.scope.weather:read.label',        descriptionKey: 'oauth.scope.weather:read.description',        groupKey: 'oauth.scope.group.weather' },
  'journey:read':        { labelKey: 'oauth.scope.journey:read.label',        descriptionKey: 'oauth.scope.journey:read.description',        groupKey: 'oauth.scope.group.journey' },
  'journey:write':       { labelKey: 'oauth.scope.journey:write.label',       descriptionKey: 'oauth.scope.journey:write.description',       groupKey: 'oauth.scope.group.journey' },
  'journey:share':       { labelKey: 'oauth.scope.journey:share.label',       descriptionKey: 'oauth.scope.journey:share.description',       groupKey: 'oauth.scope.group.journey' },
  'files:read':          { labelKey: 'oauth.scope.files:read.label',          descriptionKey: 'oauth.scope.files:read.description',          groupKey: 'oauth.scope.group.files' },
  'files:write':         { labelKey: 'oauth.scope.files:write.label',         descriptionKey: 'oauth.scope.files:write.description',         groupKey: 'oauth.scope.group.files' },
  'files:content':       { labelKey: 'oauth.scope.files:content.label',       descriptionKey: 'oauth.scope.files:content.description',       groupKey: 'oauth.scope.group.files' },
  'settings:read':       { labelKey: 'oauth.scope.settings:read.label',       descriptionKey: 'oauth.scope.settings:read.description',       groupKey: 'oauth.scope.group.settings' },
  'settings:write':      { labelKey: 'oauth.scope.settings:write.label',      descriptionKey: 'oauth.scope.settings:write.description',      groupKey: 'oauth.scope.group.settings' },
  'plugins:use':         { labelKey: 'oauth.scope.plugins:use.label',         descriptionKey: 'oauth.scope.plugins:use.description',         groupKey: 'oauth.scope.group.plugins' },
}

export const ALL_SCOPES = Object.keys(SCOPE_GROUPS)

/**
 * Scopes a client preset must never tick for you.
 *
 * The presets are written as "everything except deletes", so a new scope joins
 * them silently. That is right for a new read or write scope on data the user
 * already owns, and wrong for plugins:use: it turns on third-party tool
 * execution, which nobody would have chosen by installing an editor.
 */
export const PRESET_OPT_IN_ONLY = new Set(['plugins:use'])

/** The five full-access presets: everything destructive or opt-in-only removed. */
export const PRESET_SCOPES_DEFAULT = ALL_SCOPES.filter(s => !s.includes(':delete') && !PRESET_OPT_IN_ONLY.has(s))

/** The read-only preset (VS Code). Kept beside the default so the pair stays visible. */
export const PRESET_SCOPES_READONLY = ALL_SCOPES.filter(s => s.endsWith(':read') && !PRESET_OPT_IN_ONLY.has(s))

// Group all scopes for the client registration form
export const SCOPE_GROUP_NAMES = [...new Set(Object.values(SCOPE_GROUPS).map(s => s.groupKey))]

export function getScopesByGroup(t: (key: string) => string): Record<string, Array<{ scope: string } & ScopeInfo>> {
  const groups: Record<string, Array<{ scope: string } & ScopeInfo>> = {}
  for (const [scope, keys] of Object.entries(SCOPE_GROUPS)) {
    const group = t(keys.groupKey)
    if (!groups[group]) groups[group] = []
    groups[group].push({ scope, label: t(keys.labelKey), description: t(keys.descriptionKey), group })
  }
  return groups
}
