/**
 * Map tile prefetcher — warms the Workbox 'map-tiles' cache for a trip's
 * bounding box so maps render offline.
 *
 * Algorithm:
 *   1. Compute bbox from trip's place coordinates + padding.
 *   2. For zooms 10–16, enumerate tile XYZ coordinates within bbox.
 *   3. Stop when cumulative tile estimate exceeds MAX_TILES (~50 MB).
 *   4. Fetch each tile URL so the Service Worker CacheFirst handler caches it,
 *      at most TILE_CONCURRENCY at a time.
 *
 * The throttle is the important part: a wide trip enumerates thousands of
 * tiles, and dispatching them all at once buries every request the app itself
 * makes behind them in the Service Worker's fetch queue — the UI then sits on
 * a blank screen until the burst drains.
 *
 * Tile URL template format: Leaflet-compatible {z}/{x}/{y} with optional
 * {s} (subdomain) and {r} (retina suffix).
 */

import type { Place } from '../types'
import { offlineDb, upsertSyncMeta } from '../db/offlineDb'
import { isAuthed } from './authGate'
import { normalizeTileUrl, withTileApiKey } from '../utils/tileUrl'
import { CARTO_LIGHT } from '../constants/mapDefaults'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Estimated average tile size in KB (raster basemap tiles ~15 KB). */
const AVG_TILE_KB = 15

/**
 * Hard cap on prefetched tiles (~180 MB).
 *
 * MUST stay in sync with the Workbox 'map-tiles' `maxEntries` in
 * client/vite.config.js (kept equal). If this budget exceeds the SW cache size,
 * the LRU evicts freshly-prefetched tiles on arrival and the offline map goes
 * blank — which is exactly the bug this value was raised (from ~3413) to fix.
 */
export const MAX_TILES = Math.floor((180 * 1024) / AVG_TILE_KB) // = 12288

/**
 * Tile requests in flight at once.
 *
 * Low on purpose: these are background downloads competing with the live app
 * for the Service Worker's fetch handler, the connection pool and the origin's
 * IndexedDB queue (Workbox writes an expiration record per cached tile).
 */
export const TILE_CONCURRENCY = 6

/** Name of the Workbox runtime cache holding map tiles (see vite.config.js). */
const TILE_CACHE = 'map-tiles'

const DEFAULT_TILE_URL = CARTO_LIGHT

/**
 * Must stay identical to Leaflet's `subdomains` default ('abc'), because the
 * index is taken modulo the list length: a fourth entry here shifts the host
 * for most tiles away from the one the TileLayer will ask for, so the prefetch
 * fills the cache under URLs the map never requests. It also produced the dead
 * d.tile.openstreetmap.org lookups in #1733.
 */
const SUBDOMAINS = ['a', 'b', 'c']

/**
 * Pick the subdomain from the tile coordinates, the way Leaflet does.
 *
 * It has to be a pure function of x/y: a rotating counter hands the same tile a
 * different host on every run, which both defeats the cache lookup below and
 * stores the tile once per host.
 */
function subdomainFor(x: number, y: number): string {
  return SUBDOMAINS[Math.abs(x + y) % SUBDOMAINS.length]
}

// ── Tile math ──────────────────────────────────────────────────────────────────

/** Longitude → tile X at given zoom. */
export function lngToTileX(lng: number, zoom: number): number {
  return Math.floor(((lng + 180) / 360) * Math.pow(2, zoom))
}

/** Latitude → tile Y at given zoom (Web Mercator, y increases southward). */
export function latToTileY(lat: number, zoom: number): number {
  const n = Math.pow(2, zoom)
  const latRad = (lat * Math.PI) / 180
  return Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  )
}

/** Expand a single-point bbox to min 0.1° span (~10 km) in each axis. */
function ensureMinSpan(min: number, max: number, minSpan = 0.1): [number, number] {
  if (max - min < minSpan) {
    const mid = (min + max) / 2
    return [mid - minSpan / 2, mid + minSpan / 2]
  }
  return [min, max]
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface TileBbox {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

// ── Core logic ────────────────────────────────────────────────────────────────

/**
 * Compute the bounding box for a list of places with optional padding.
 * Returns null if no places have coordinates.
 */
export function computeBbox(places: Place[], paddingFraction = 0.1): TileBbox | null {
  const valid = places.filter(p => p.lat !== null && p.lng !== null)
  if (valid.length === 0) return null

  const lats = valid.map(p => p.lat as number)
  const lngs = valid.map(p => p.lng as number)

  const [rawMinLat, rawMaxLat] = ensureMinSpan(Math.min(...lats), Math.max(...lats))
  const [rawMinLng, rawMaxLng] = ensureMinSpan(Math.min(...lngs), Math.max(...lngs))

  const latPad = (rawMaxLat - rawMinLat) * paddingFraction
  const lngPad = (rawMaxLng - rawMinLng) * paddingFraction

  return {
    minLat: Math.max(-85.0511, rawMinLat - latPad),
    maxLat: Math.min(85.0511, rawMaxLat + latPad),
    minLng: Math.max(-180, rawMinLng - lngPad),
    maxLng: Math.min(180, rawMaxLng + lngPad),
  }
}

/**
 * Count tiles that would be fetched across the zoom range for a bbox.
 * Used to enforce the size guard without actually fetching.
 */
export function countTiles(bbox: TileBbox, minZoom: number, maxZoom: number): number {
  let total = 0
  for (let z = minZoom; z <= maxZoom; z++) {
    const minX = lngToTileX(bbox.minLng, z)
    const maxX = lngToTileX(bbox.maxLng, z)
    const minY = latToTileY(bbox.maxLat, z) // northern edge → smaller y
    const maxY = latToTileY(bbox.minLat, z) // southern edge → larger y
    total += (maxX - minX + 1) * (maxY - minY + 1)
    if (total > MAX_TILES) return total
  }
  return total
}

/**
 * Build the concrete tile URL for given z/x/y from a Leaflet template.
 * Rotates through subdomains (a–c).
 *
 * The template is normalized first: this function is also reached with a raw
 * admin default rather than the value from the settings store, so the OSM
 * sharding rewrite has to happen here too.
 *
 * The CARTO key is appended here as well, and it has to be: the Workbox cache is
 * keyed on the whole URL including the query, so a tile prefetched without the
 * key is a tile the map never asks for.
 */
export function buildTileUrl(template: string, z: number, x: number, y: number, cartoKey?: string): string {
  return withTileApiKey(normalizeTileUrl(template), cartoKey)
    .replace('{z}', String(z))
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('{s}', subdomainFor(x, y))
    .replace('{r}', '')
}

/**
 * Enumerate the tile coordinates to prefetch, lowest zoom first, stopping at
 * the zoom level whose tiles would push the total past MAX_TILES.
 */
function enumerateTiles(
  bbox: TileBbox,
  minZoom: number,
  maxZoom: number,
): Array<[z: number, x: number, y: number]> {
  const coords: Array<[number, number, number]> = []

  for (let z = minZoom; z <= maxZoom; z++) {
    const minX = lngToTileX(bbox.minLng, z)
    const maxX = lngToTileX(bbox.maxLng, z)
    const minY = latToTileY(bbox.maxLat, z)
    const maxY = latToTileY(bbox.minLat, z)

    if (coords.length + (maxX - minX + 1) * (maxY - minY + 1) > MAX_TILES) break

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) coords.push([z, x, y])
    }
  }

  return coords
}

/** Open the tile cache, or null where Cache Storage isn't available. */
async function openTileCache(): Promise<Cache | null> {
  try {
    if (typeof caches === 'undefined') return null
    return await caches.open(TILE_CACHE)
  } catch {
    return null
  }
}

/**
 * Prefetch tiles for a bbox into the Service Worker cache.
 * Stops at the zoom level where the size cap would be exceeded.
 * No-ops when:
 *   - offline
 *   - no active Service Worker (tiles won't be cached anyway)
 *   - total tile count exceeds MAX_TILES before even starting zoom 10
 *
 * Resolves once every tile has been dealt with, so callers that need the tiles
 * on disk ("prepare for offline") can simply await it. Callers that don't
 * (background sync) leave the promise floating.
 *
 * Returns the number of tiles actually fetched — tiles already in the cache are
 * skipped without touching the network.
 */
export async function prefetchTiles(
  bbox: TileBbox,
  tileUrlTemplate: string,
  minZoom = 10,
  maxZoom = 16,
  cartoKey?: string,
): Promise<number> {
  if (!navigator.onLine) return 0
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return 0

  const coords = enumerateTiles(bbox, minZoom, maxZoom)
  if (coords.length === 0) return 0

  // Checking Cache Storage from here is far cheaper than letting the request
  // reach the SW's CacheFirst handler, so a resumed or repeated prefetch over a
  // warm cache costs almost nothing.
  const cache = await openTileCache()

  let cursor = 0
  let fetched = 0

  async function worker(): Promise<void> {
    while (cursor < coords.length) {
      // Going offline or logging out mid-run abandons the rest of the queue.
      if (!navigator.onLine || !isAuthed()) return

      const [z, x, y] = coords[cursor++]
      const url = buildTileUrl(tileUrlTemplate, z, x, y, cartoKey)

      if (cache && (await cache.match(url))) continue

      // The SW CacheFirst handler stores the response.
      await fetch(url, { mode: 'no-cors' }).catch(() => {})
      fetched++
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(TILE_CONCURRENCY, coords.length) }, worker),
  )

  return fetched
}

/**
 * Drop the pre-downloaded map-tile cache. Called when the user turns off
 * "store map tiles offline" (#1135 ask 2) so the bulk tile storage — the real
 * "whole world map" concern — is reclaimed immediately.
 */
export async function clearTileCache(): Promise<void> {
  try {
    if (typeof caches !== 'undefined') await caches.delete(TILE_CACHE)
  } catch {
    /* Cache Storage unavailable (no SW / private mode) — nothing to clear */
  }

  // Drop the recorded bboxes too, otherwise prefetchTilesForTrip would consider
  // these trips done and never refill the cache we just emptied.
  try {
    const metas = await offlineDb.syncMeta.toArray()
    await Promise.all(
      metas
        .filter(m => m.tilesBbox !== null)
        .map(m => upsertSyncMeta({ ...m, tilesBbox: null })),
    )
  } catch (err) {
    console.error('[tilePrefetch] failed to reset tile bboxes:', err)
  }
}

/** Same bbox to within ~1 m — i.e. the trip's places haven't moved. */
function sameBbox(a: [number, number, number, number], b: TileBbox): boolean {
  return (
    Math.abs(a[0] - b.minLng) < 1e-5 &&
    Math.abs(a[1] - b.minLat) < 1e-5 &&
    Math.abs(a[2] - b.maxLng) < 1e-5 &&
    Math.abs(a[3] - b.maxLat) < 1e-5
  )
}

/**
 * Full pipeline: compute bbox → guard → prefetch → update syncMeta.
 * Designed to be called fire-and-forget from tripSyncManager.
 *
 * Set `force` to prefetch even when this bbox was already covered by an earlier
 * run — the "prepare for offline" path does, so the user gets a guarantee
 * rather than a promise based on our own bookkeeping.
 */
export async function prefetchTilesForTrip(
  tripId: number,
  places: Place[],
  tileUrlTemplate?: string,
  force = false,
  cartoKey?: string,
): Promise<void> {
  const template = tileUrlTemplate || DEFAULT_TILE_URL
  const bbox = computeBbox(places)
  if (!bbox) return

  // Unchanged bbox → the tiles are already there. Skipping outright keeps a
  // routine login from re-walking thousands of tile URLs just to find them all
  // cached.
  const existing = await offlineDb.syncMeta.get(tripId)
  if (!force && existing?.tilesBbox && sameBbox(existing.tilesBbox, bbox)) return

  // Zoom-clamp rather than skip: prefetchTiles fills zooms low→high and stops
  // once MAX_TILES is reached, so large (region / road-trip) bboxes still get
  // their lower zooms cached instead of being skipped entirely.
  //
  // NOTE: opaque (no-cors) tile responses are padded by Chromium to ~7 MB each
  // for quota accounting, so the real on-disk budget is far below 180 MB. We
  // keep no-cors deliberately: switching to cors would break self-hosted/custom
  // tile providers that don't send CORS headers. To stop the browser evicting
  // these tiles under the inflated quota, we request persistent storage at app
  // init instead (sync/persistentStorage.ts).
  const fetched = await prefetchTiles(bbox, template, 10, 16, cartoKey)

  // Update syncMeta with bbox and tile count
  const meta = await offlineDb.syncMeta.get(tripId)
  if (meta) {
    await upsertSyncMeta({
      ...meta,
      tilesBbox: [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat],
    })
  }

  if (fetched > 0) {
    console.info(`[tilePrefetch] trip ${tripId}: cached ${fetched} tiles`)
  }
}
