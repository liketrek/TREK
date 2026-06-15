/**
 * Map tile prefetcher — warms the Workbox 'map-tiles' cache for a trip's
 * bounding box so maps render offline.
 *
 * Algorithm:
 *   1. Compute bbox from trip's place coordinates + padding.
 *   2. For zooms 10–16, enumerate tile XYZ coordinates within bbox.
 *   3. Stop when cumulative tile estimate exceeds MAX_TILES (~50 MB).
 *   4. Fetch each tile URL so the Service Worker CacheFirst handler caches it.
 *
 * Tile URL template format: Leaflet-compatible {z}/{x}/{y} with optional
 * {s} (subdomain) and {r} (retina suffix).
 */

import type { Place } from '../types'
import { offlineDb, upsertSyncMeta } from '../db/offlineDb'

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

const DEFAULT_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

const SUBDOMAINS = ['a', 'b', 'c', 'd']
let _subIdx = 0
function nextSubdomain(): string {
  return SUBDOMAINS[_subIdx++ % SUBDOMAINS.length]
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
 * Rotates through subdomains (a–d).
 */
export function buildTileUrl(template: string, z: number, x: number, y: number): string {
  return template
    .replace('{z}', String(z))
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('{s}', nextSubdomain())
    .replace('{r}', '')
}

/**
 * Prefetch tiles for a bbox into the Service Worker cache.
 * Stops at the zoom level where the size cap would be exceeded.
 * No-ops when:
 *   - offline
 *   - no active Service Worker (tiles won't be cached anyway)
 *   - total tile count exceeds MAX_TILES before even starting zoom 10
 */
export async function prefetchTiles(
  bbox: TileBbox,
  tileUrlTemplate: string,
  minZoom = 10,
  maxZoom = 16,
): Promise<number> {
  if (!navigator.onLine) return 0
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return 0

  let fetched = 0

  for (let z = minZoom; z <= maxZoom; z++) {
    const minX = lngToTileX(bbox.minLng, z)
    const maxX = lngToTileX(bbox.maxLng, z)
    const minY = latToTileY(bbox.maxLat, z)
    const maxY = latToTileY(bbox.minLat, z)
    const count = (maxX - minX + 1) * (maxY - minY + 1)

    if (fetched + count > MAX_TILES) break

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const url = buildTileUrl(tileUrlTemplate, z, x, y)
        // Fire-and-forget: SW CacheFirst handler stores the response
        fetch(url, { mode: 'no-cors' }).catch(() => {})
        fetched++
      }
    }
  }

  return fetched
}

/**
 * Full pipeline: compute bbox → guard → prefetch → update syncMeta.
 * Designed to be called fire-and-forget from tripSyncManager.
 */
export async function prefetchTilesForTrip(
  tripId: number,
  places: Place[],
  tileUrlTemplate?: string,
): Promise<void> {
  const template = tileUrlTemplate || DEFAULT_TILE_URL
  const bbox = computeBbox(places)
  if (!bbox) return

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
  const fetched = await prefetchTiles(bbox, template)

  // Update syncMeta with bbox and tile count
  const meta = await offlineDb.syncMeta.get(tripId)
  if (meta) {
    await upsertSyncMeta({
      ...meta,
      tilesBbox: [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat],
    })
  }

  if (fetched > 0) {
    console.info(`[tilePrefetch] trip ${tripId}: queued ${fetched} tiles for caching`)
  }
}
