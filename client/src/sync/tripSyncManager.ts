/**
 * Trip sync manager — seeds Dexie with trip data for offline use.
 *
 * Cache scope: trips where end_date >= today OR end_date is null/empty.
 * Eviction: trips where end_date < today - 7 days.
 * File blobs: all non-photo files (MIME type != image/*) for cached trips.
 *
 * Call syncAll() on:
 *   - login success
 *   - trip list refresh (DashboardPage)
 *   - WS reconnect (phase 7)
 */
import { tripsApi, tagsApi, categoriesApi } from '../api/client'
import {
  offlineDb,
  upsertTrip,
  upsertDays,
  upsertPlaces,
  upsertPackingItems,
  upsertTodoItems,
  upsertBudgetItems,
  upsertReservations,
  upsertTripFiles,
  upsertAccommodations,
  upsertTripMembers,
  upsertTags,
  upsertCategories,
  upsertSyncMeta,
  clearTripData,
  enforceBlobBudget,
} from '../db/offlineDb'
import { prefetchTilesForTrip } from './tilePrefetcher'
import { isAuthed } from './authGate'
import { getOfflinePrefs, isTripOfflineEnabled } from './offlinePrefs'
import { useSettingsStore } from '../store/settingsStore'
import type { Trip, Day, Place, PackingItem, TodoItem, BudgetItem, Reservation, TripFile, Accommodation, TripMember } from '../types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TripBundle {
  trip: Trip
  days: Day[]
  places: Place[]
  packingItems: PackingItem[]
  todoItems: TodoItem[]
  budgetItems: BudgetItem[]
  reservations: Reservation[]
  files: TripFile[]
  accommodations: Accommodation[]
  members: TripMember[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function shouldCache(trip: Trip): boolean {
  if (!trip.end_date) return true            // no end date → cache forever
  return trip.end_date >= todayStr()          // ongoing or future
}

function isStale(trip: Trip): boolean {
  if (!trip.end_date) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  return trip.end_date < cutoff.toISOString().slice(0, 10)
}

function isPhoto(file: TripFile): boolean {
  return file.mime_type.startsWith('image/')
}

// Videos can be hundreds of MB — never prefetch them into the bounded offline
// blob cache, or a single clip would evict the trip's real documents (#823).
function isVideo(file: TripFile): boolean {
  return file.mime_type.startsWith('video/')
}

// ── Core logic ────────────────────────────────────────────────────────────────

/** Fetch bundle + write all entities for one trip into Dexie. */
async function syncTrip(tripId: number): Promise<void> {
  const bundle = await tripsApi.bundle(tripId) as TripBundle

  await upsertTrip(bundle.trip)
  await upsertDays(bundle.days)
  await upsertPlaces(bundle.places)
  await upsertPackingItems(bundle.packingItems)
  await upsertTodoItems(bundle.todoItems)
  await upsertBudgetItems(bundle.budgetItems)
  await upsertReservations(bundle.reservations)
  await upsertTripFiles(bundle.files)
  await upsertAccommodations(bundle.accommodations || [])
  await upsertTripMembers(tripId, bundle.members || [])
  await upsertSyncMeta({
    tripId,
    lastSyncedAt: Date.now(),
    status: 'idle',
    tilesBbox: null,
    filesCachedCount: 0,
  })
}

/** Cache non-photo file blobs for a trip. Fire-and-forget safe. */
async function cacheFilesForTrip(files: TripFile[]): Promise<void> {
  const nonPhotos = files.filter(f => f.url && !isPhoto(f) && !isVideo(f))
  let cached = 0

  for (const file of nonPhotos) {
    // Skip if already cached
    const existing = await offlineDb.blobCache.get(file.url!)
    if (existing) { cached++; continue }

    try {
      const resp = await fetch(file.url!, { credentials: 'include' })
      if (!resp.ok) continue
      const blob = await resp.blob()
      await offlineDb.blobCache.put({ url: file.url!, tripId: file.trip_id, blob, bytes: blob.size, mime: file.mime_type, cachedAt: Date.now() })
      cached++
    } catch {
      // Network failure — skip this file, will retry next sync
    }
  }

  // Keep the blob cache within its size/count budget after adding new files.
  if (cached > 0) await enforceBlobBudget().catch(() => {})

  // Update filesCachedCount in syncMeta
  const tripId = files[0]?.trip_id
  if (tripId) {
    const meta = await offlineDb.syncMeta.get(tripId)
    if (meta) await upsertSyncMeta({ ...meta, filesCachedCount: cached })
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Progress callback payload for a {@link tripSyncManager.prepareForOffline} run. */
export interface PrepareProgress {
  /** Current stage. 'done' fires once at the end. */
  phase: 'trips' | 'files' | 'tiles' | 'done'
  /** 1-based index of the trip currently processed in this phase. */
  current: number
  /** Total trips to process in this phase. */
  total: number
  /** Name of the trip currently processed (for the UI). */
  label?: string
}

let _syncing = false

/**
 * Decide which trips to cache and which to drop, honouring both the date rule
 * and the user's per-trip offline choices (#1135 ask 2). Returns the trips to
 * sync; clears Dexie for stale or user-disabled trips as a side effect.
 */
async function reconcileTrips(trips: Trip[]): Promise<Trip[]> {
  const stale = trips.filter(isStale)
  // Trips the user turned off explicitly are evicted regardless of date.
  const disabled = trips.filter(t => !isTripOfflineEnabled(t.id))
  await Promise.all([...stale, ...disabled].map(t => clearTripData(t.id).catch(console.error)))
  return trips.filter(t => shouldCache(t) && isTripOfflineEnabled(t.id))
}

export const tripSyncManager = {
  /**
   * Sync all cache-eligible trips.
   * Evicts stale and user-disabled trips. Caches file blobs + map tiles in the
   * background. No-ops when offline.
   */
  async syncAll(): Promise<void> {
    if (_syncing || !navigator.onLine || !isAuthed()) return
    _syncing = true
    try {
      const { trips } = await tripsApi.list() as { trips: Trip[] }
      const toSync = await reconcileTrips(trips)

      for (const trip of toSync) {
        try {
          await syncTrip(trip.id)
        } catch (err) {
          console.error(`[tripSync] failed for trip ${trip.id}:`, err)
        }
      }

      // Cache global user data (tags + categories) — fire-and-forget
      tagsApi.list().then(d => upsertTags(d.tags)).catch(() => {})
      categoriesApi.list().then(d => upsertCategories(d.categories)).catch(() => {})

      // Cache file blobs + map tiles in background (don't block syncAll)
      const cacheTiles = getOfflinePrefs().cacheTiles
      const tileUrl = useSettingsStore.getState().settings.map_tile_url || undefined
      for (const trip of toSync) {
        const files = await offlineDb.tripFiles.where('trip_id').equals(trip.id).toArray()
        cacheFilesForTrip(files).catch(console.error)

        if (cacheTiles) {
          const places = await offlineDb.places.where('trip_id').equals(trip.id).toArray()
          prefetchTilesForTrip(trip.id, places, tileUrl).catch(console.error)
        }
      }
    } finally {
      _syncing = false
    }
  },

  /**
   * "Prepare for offline" (#1135 ask 1): a fully-awaited sync the user runs while
   * still online so everything they need is guaranteed on-device before they go
   * offline. Unlike syncAll, this AWAITS file-blob and map-tile downloads and
   * reports progress, so the UI can show a real completion state instead of
   * resolving the moment the requests are merely dispatched.
   *
   * Returns the number of trips prepared.
   */
  async prepareForOffline(onProgress?: (p: PrepareProgress) => void): Promise<number> {
    if (_syncing || !navigator.onLine || !isAuthed()) return 0
    _syncing = true
    try {
      const { trips } = await tripsApi.list() as { trips: Trip[] }
      const toSync = await reconcileTrips(trips)
      const total = toSync.length

      // 1) Trip bundles (structured data).
      let i = 0
      for (const trip of toSync) {
        onProgress?.({ phase: 'trips', current: ++i, total, label: trip.title })
        try {
          await syncTrip(trip.id)
        } catch (err) {
          console.error(`[tripSync] prepare failed for trip ${trip.id}:`, err)
        }
      }

      // Global user data (tags + categories) — awaited here.
      await Promise.all([
        tagsApi.list().then(d => upsertTags(d.tags)).catch(() => {}),
        categoriesApi.list().then(d => upsertCategories(d.categories)).catch(() => {}),
      ])

      // 2) File blobs — awaited so "prepared" really means downloaded.
      i = 0
      for (const trip of toSync) {
        onProgress?.({ phase: 'files', current: ++i, total, label: trip.title })
        const files = await offlineDb.tripFiles.where('trip_id').equals(trip.id).toArray()
        await cacheFilesForTrip(files).catch(console.error)
      }

      // 3) Map tiles — awaited, and only when the user opted to store them.
      if (getOfflinePrefs().cacheTiles) {
        const tileUrl = useSettingsStore.getState().settings.map_tile_url || undefined
        i = 0
        for (const trip of toSync) {
          onProgress?.({ phase: 'tiles', current: ++i, total, label: trip.title })
          const places = await offlineDb.places.where('trip_id').equals(trip.id).toArray()
          await prefetchTilesForTrip(trip.id, places, tileUrl, true).catch(console.error)
        }
      }

      onProgress?.({ phase: 'done', current: total, total })
      return total
    } finally {
      _syncing = false
    }
  },

  /** Reset syncing flag — useful in tests. */
  _resetSyncing(): void {
    _syncing = false
  },
}
