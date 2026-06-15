/**
 * Sync triggers — register event listeners that flush the mutation queue
 * and/or run a full trip sync based on the connectivity trigger source.
 *
 * Trigger matrix:
 *   window 'online'          → flush mutations + full syncAll (network truly back)
 *   visibilitychange visible → flush mutations only (avoid hammering server on tab switch)
 *   periodic 30s             → flush mutations only
 *   WS reconnect             → flush mutations only (no syncAll — avoids rate-limiter
 *                              on server restart / socket timeout while already online)
 *
 * Call `registerSyncTriggers()` once on app mount.
 * Call `unregisterSyncTriggers()` on unmount / logout.
 */
import { mutationQueue } from './mutationQueue'
import { tripSyncManager } from './tripSyncManager'
import { setPreReconnectHook, setRefetchCallback, getActiveTrips } from '../api/websocket'
import { useTripStore } from '../store/tripStore'

const PERIODIC_MS = 30_000

let _intervalId: ReturnType<typeof setInterval> | null = null
let _registered = false

/** Pull the latest server state for every open trip into the Zustand store. */
function rehydrateActiveTrips() {
  const store = useTripStore.getState()
  for (const tripId of getActiveTrips()) {
    store.hydrateActiveTrip(tripId).catch(console.error)
  }
}

/**
 * Network came back — flush local writes first, then re-seed Dexie for all
 * cacheable trips and re-hydrate the open trip's store so a collaborator's
 * edits made while we were offline appear without navigating away.
 */
function onOnline() {
  mutationQueue.flush()
    .catch(console.error)
    .finally(() => {
      tripSyncManager.syncAll().catch(console.error)
      rehydrateActiveTrips()
    })
}

/** Tab became visible — flush only; don't trigger a potentially expensive syncAll. */
function onVisibility() {
  if (!document.hidden && navigator.onLine) {
    mutationQueue.flush().catch(console.error)
  }
}

/** Periodic heartbeat — drain any lingering pending mutations. */
function onPeriodic() {
  if (navigator.onLine) {
    mutationQueue.flush().catch(console.error)
  }
}

export function registerSyncTriggers(): void {
  if (_registered) return
  _registered = true

  // WS reconnect: flush mutations only — no syncAll to avoid triggering rate
  // limiters when the socket drops and reconnects while the device is online.
  setPreReconnectHook(() => mutationQueue.flush())
  // After the reconnect flush, pull canonical state for the open trip back into
  // the store (the WS layer awaits the flush hook before invoking this).
  setRefetchCallback(tripId => {
    useTripStore.getState().hydrateActiveTrip(tripId).catch(console.error)
  })

  window.addEventListener('online', onOnline)
  document.addEventListener('visibilitychange', onVisibility)
  _intervalId = setInterval(onPeriodic, PERIODIC_MS)
}

export function unregisterSyncTriggers(): void {
  if (!_registered) return
  _registered = false

  setPreReconnectHook(null)
  setRefetchCallback(null)
  window.removeEventListener('online', onOnline)
  document.removeEventListener('visibilitychange', onVisibility)
  if (_intervalId !== null) {
    clearInterval(_intervalId)
    _intervalId = null
  }
}
