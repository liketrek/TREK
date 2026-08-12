// Per-trip booking-route visibility, persisted in localStorage under
// `trek:visible-connections:<tripId>` (see useTripPlanner.ts). Two modes:
//   'only'        — nothing shown except `ids`
//   'all-except'  — everything routable shown except `ids`
// The account-wide "always show booking routes" setting only decides which
// mode a trip starts in the first time it's ever touched (see
// resolveEffectiveConnections) — once a trip has a stored preference, that
// preference always wins, regardless of the account setting's current value.

export type ConnectionsMode = 'only' | 'all-except'

export interface StoredConnections {
  mode: ConnectionsMode
  ids: number[]
}

function isNumberArray(v: unknown): v is number[] {
  return Array.isArray(v) && v.every(n => typeof n === 'number')
}

/**
 * Parses the raw localStorage value for a trip's route-visibility
 * preference. Returns null when nothing has ever been stored (the caller
 * should fall back to the account-wide default in that case — see
 * resolveEffectiveConnections). Accepts the legacy bare-array format (from
 * before the 'all-except' mode existed) as an 'only' mode for backward
 * compatibility with values already sitting in users' browsers.
 */
export function parseStoredConnections(raw: string | null): StoredConnections | null {
  if (raw === null) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (isNumberArray(parsed)) return { mode: 'only', ids: parsed }
  if (
    parsed && typeof parsed === 'object' && !Array.isArray(parsed) &&
    ((parsed as { mode?: unknown }).mode === 'only' || (parsed as { mode?: unknown }).mode === 'all-except') &&
    isNumberArray((parsed as { ids?: unknown }).ids)
  ) {
    const obj = parsed as { mode: ConnectionsMode; ids: number[] }
    return { mode: obj.mode, ids: obj.ids }
  }
  return null
}

/**
 * The mode/ids actually in effect for a trip: the stored preference if the
 * trip has one, otherwise the account-wide default (all routes shown, or
 * none) as an ephemeral, unwritten fallback.
 */
export function resolveEffectiveConnections(stored: StoredConnections | null, alwaysShowRoutesDefault: boolean): StoredConnections {
  if (stored) return stored
  return alwaysShowRoutesDefault ? { mode: 'all-except', ids: [] } : { mode: 'only', ids: [] }
}

/** The concrete set of reservation ids visible right now. */
export function resolveVisibleConnectionIds(effective: StoredConnections, routableIds: number[]): number[] {
  if (effective.mode === 'only') return effective.ids
  const excluded = new Set(effective.ids)
  return routableIds.filter(id => !excluded.has(id))
}

/**
 * Applies one reservation's toggle to the current stored preference,
 * materializing the account-default fallback first if the trip has no
 * stored preference yet. Toggling just flips the id's membership in `ids` —
 * under 'only' that turns it on/off directly; under 'all-except' it
 * removes/re-adds it from the exception list.
 */
export function toggleConnectionId(stored: StoredConnections | null, alwaysShowRoutesDefault: boolean, id: number): StoredConnections {
  const base = resolveEffectiveConnections(stored, alwaysShowRoutesDefault)
  const ids = base.ids.includes(id) ? base.ids.filter(x => x !== id) : [...base.ids, id]
  return { mode: base.mode, ids }
}

/**
 * Flips the whole trip between "show everything" and "show nothing" (the
 * toolbar's bulk show-all/hide-all button), materializing the account
 * default first if needed. Always starts the new mode with an empty
 * ids list — an explicit bulk action discards whatever per-leg overrides
 * applied to the mode it's leaving.
 */
export function toggleAllConnections(stored: StoredConnections | null, alwaysShowRoutesDefault: boolean): StoredConnections {
  const base = resolveEffectiveConnections(stored, alwaysShowRoutesDefault)
  return base.mode === 'all-except' ? { mode: 'only', ids: [] } : { mode: 'all-except', ids: [] }
}
