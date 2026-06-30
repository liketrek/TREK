/**
 * Offline preferences — device-local choices about WHAT gets stored offline and
 * HOW sync conflicts are resolved (discussion #1135, asks 2 and 3).
 *
 * These live in localStorage rather than the server user-settings because they
 * are inherently per-device: how much storage a phone should spend on map tiles,
 * or which trips to keep on this particular device, has nothing to do with the
 * account and everything to do with the hardware in the user's hand.
 *
 *   cacheTiles        — global on/off for pre-downloading map tiles. Off keeps
 *                       the cache to trip data + documents only ("not the whole
 *                       world map"). See tripSyncManager / clearTileCache.
 *   disabledTripIds   — trips the user explicitly excluded from offline storage.
 *                       Everything else that is date-eligible is cached.
 *   conflictStrategy  — what to do when an offline edit collides with a newer
 *                       server change: 'ask' surfaces a per-conflict picker,
 *                       'mine'/'server' resolve automatically.
 */

export type ConflictStrategy = 'ask' | 'mine' | 'server'

export interface OfflinePrefs {
  cacheTiles: boolean
  disabledTripIds: number[]
  conflictStrategy: ConflictStrategy
}

const STORAGE_KEY = 'trek_offline_prefs'

const DEFAULTS: OfflinePrefs = {
  cacheTiles: true,
  disabledTripIds: [],
  conflictStrategy: 'ask',
}

let _prefs: OfflinePrefs = read()
const listeners = new Set<() => void>()

function read(): OfflinePrefs {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<OfflinePrefs>
    return {
      cacheTiles: typeof parsed.cacheTiles === 'boolean' ? parsed.cacheTiles : DEFAULTS.cacheTiles,
      disabledTripIds: Array.isArray(parsed.disabledTripIds) ? parsed.disabledTripIds.filter(n => typeof n === 'number') : [],
      conflictStrategy: parsed.conflictStrategy === 'mine' || parsed.conflictStrategy === 'server' ? parsed.conflictStrategy : 'ask',
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function write(next: OfflinePrefs): void {
  _prefs = next
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* best-effort */ }
  listeners.forEach(fn => { try { fn() } catch { /* isolate listeners */ } })
}

/** Current snapshot (a copy — callers must not mutate it in place). */
export function getOfflinePrefs(): OfflinePrefs {
  return { ..._prefs, disabledTripIds: [..._prefs.disabledTripIds] }
}

export function setCacheTiles(on: boolean): void {
  if (_prefs.cacheTiles === on) return
  write({ ..._prefs, cacheTiles: on })
}

export function setConflictStrategy(strategy: ConflictStrategy): void {
  if (_prefs.conflictStrategy === strategy) return
  write({ ..._prefs, conflictStrategy: strategy })
}

/** True when this trip should be cached offline (i.e. not explicitly disabled). */
export function isTripOfflineEnabled(tripId: number): boolean {
  return !_prefs.disabledTripIds.includes(tripId)
}

/** Turn offline storage for a single trip on or off. */
export function setTripOfflineEnabled(tripId: number, on: boolean): void {
  const has = _prefs.disabledTripIds.includes(tripId)
  if (on && !has) return
  if (!on && has) return
  const disabledTripIds = on
    ? _prefs.disabledTripIds.filter(id => id !== tripId)
    : [..._prefs.disabledTripIds, tripId]
  write({ ..._prefs, disabledTripIds })
}

/** Subscribe to preference changes. Returns an unsubscribe function. */
export function onOfflinePrefsChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Reset to defaults — test helper only. */
export function _resetOfflinePrefs(): void {
  _prefs = { ...DEFAULTS }
  listeners.clear()
}
