/**
 * Network mode — the single source of truth for whether the app should behave
 * as if it were offline right now.
 *
 * Two inputs combine here:
 *   - the real browser state (`navigator.onLine`)
 *   - a user-controlled "force offline" override (the Settings → Offline toggle)
 *
 * The repo layer, the mutation queue and the sync triggers all gate on
 * `isEffectivelyOffline()` instead of reading `navigator.onLine` directly, so a
 * forced-offline session routes every read to the Dexie cache and every write to
 * the mutation queue exactly as a genuine disconnection would. The override is
 * persisted so it survives a reload (a user who forced offline before boarding a
 * plane stays offline after the PWA is relaunched).
 *
 * Forcing offline does NOT pretend the network is gone for everything: it is the
 * caller's job (Settings → Offline) to pre-download first and only then flip the
 * switch. See tripSyncManager.prepareForOffline().
 */

const STORAGE_KEY = 'trek_forced_offline'

let _forced = readPersisted()
const listeners = new Set<() => void>()

function readPersisted(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function persist(v: boolean): void {
  try {
    if (v) localStorage.setItem(STORAGE_KEY, '1')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* private mode / quota — the in-memory flag still governs this session */
  }
}

function notify(): void {
  listeners.forEach(fn => {
    try { fn() } catch { /* a listener throwing must not break the others */ }
  })
}

/** True when the user has manually forced the app into offline mode. */
export function isForcedOffline(): boolean {
  return _forced
}

/** Flip the manual force-offline override and notify subscribers. */
export function setForcedOffline(v: boolean): void {
  if (_forced === v) return
  _forced = v
  persist(v)
  notify()
}

/**
 * True when the app should treat itself as offline: either the browser is
 * genuinely offline OR the user forced offline mode. This is the flag the
 * offline read/write paths must gate on.
 */
export function isEffectivelyOffline(): boolean {
  return _forced || !navigator.onLine
}

/** Convenience inverse of {@link isEffectivelyOffline}. */
export function isEffectivelyOnline(): boolean {
  return !isEffectivelyOffline()
}

/**
 * Subscribe to network-mode changes (force-offline toggled, or the browser's own
 * online/offline events). Returns an unsubscribe function. Registers the global
 * browser listeners lazily on first subscription.
 */
export function onNetworkModeChange(fn: () => void): () => void {
  ensureBrowserListeners()
  listeners.add(fn)
  return () => listeners.delete(fn)
}

let _browserListenersBound = false
function ensureBrowserListeners(): void {
  if (_browserListenersBound || typeof window === 'undefined') return
  _browserListenersBound = true
  window.addEventListener('online', notify)
  window.addEventListener('offline', notify)
}

/** Reset state — test helper only. */
export function _resetNetworkMode(): void {
  _forced = false
  listeners.clear()
}
