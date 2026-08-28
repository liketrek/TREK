/**
 * Pre-download of a vector basemap, for the trips the user marked for offline.
 *
 * The raster prefetcher next door walks a {z}/{x}/{y} template and is done. A
 * vector style is four different things instead: the style document, the
 * TileJSON it points at, the sprite sheet and the glyph ranges its labels are
 * set in, and only then the .pbf tiles themselves.
 *
 * It is cheaper than what it replaces, not more expensive. Measured over the
 * Berlin bounding box TREK would compute: raster z10-16 is 2237 requests and
 * 34.6 MB and stops being useful above z16, while vector z10-14 is 177 requests
 * and 32.1 MB and stays sharp at every zoom above that, because MapLibre scales
 * the z14 tile rather than asking for another one.
 *
 * The style, sprite and glyphs are per device rather than per trip: about
 * 980 KB once, not per journey.
 */
import { computeBbox, lngToTileX, latToTileY, type TileBbox } from './tilePrefetcher'
import type { Place } from '../types'

/** OpenFreeMap serves vector tiles up to z14 and overzooms from there. */
const VECTOR_MAX_ZOOM = 14
const VECTOR_MIN_ZOOM = 10

/** Requests in flight, kept low for the same reason the raster side keeps it low. */
const CONCURRENCY = 6

/**
 * Hard cap on vector tiles per run. Each is far larger than a raster tile but
 * there are far fewer of them; this is roughly the same byte budget.
 */
const MAX_VECTOR_TILES = 2000

/** Workbox runtime cache for the vector basemap (see vite.config.js). */
const VECTOR_CACHE = 'gl-map-offline'

/**
 * Latin glyph ranges. A label needs the range its codepoints fall in, and Latin
 * text lives in the first few; asking for all 256 ranges would download megabytes
 * of CJK nobody on this map is going to render.
 */
const GLYPH_RANGES = ['0-255', '256-511', '512-767', '768-1023', '1024-1279', '1280-1535', '1536-1791', '8192-8447', '8448-8703']

interface StyleDoc {
  sprite?: string
  glyphs?: string
  sources?: Record<string, { url?: string; tiles?: string[] }>
  layers?: { layout?: { 'text-font'?: string[] } }[]
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    // cors, not no-cors: an opaque response cannot be read, and MapLibre would
    // find a zero-byte body in the cache. OpenFreeMap sends access-control-allow-origin.
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/** Every font stack the style actually asks for, deduped. */
function fontStacks(style: StyleDoc): string[] {
  const stacks = new Set<string>()
  for (const layer of style.layers ?? []) {
    const fonts = layer.layout?.['text-font']
    if (fonts?.length) stacks.add(fonts.join(','))
  }
  return [...stacks]
}

/**
 * Warm one URL into the cache, unless it is already there.
 *
 * Checking Cache Storage directly is much cheaper than letting the request reach
 * the Service Worker's handler, so a repeated or resumed run over a warm cache
 * costs almost nothing. Same reasoning as the raster side.
 */
async function warm(cache: Cache | null, url: string): Promise<boolean> {
  try {
    if (cache && (await cache.match(url))) return false
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return false
    await cache?.put(url, res.clone())
    return true
  } catch {
    return false
  }
}

async function openVectorCache(): Promise<Cache | null> {
  try {
    return await caches.open(VECTOR_CACHE)
  } catch {
    return null
  }
}

/** Tile coordinates covering the box, low zoom first so a truncated run is still useful. */
function enumerateVectorTiles(bbox: TileBbox, minZoom: number, maxZoom: number): [number, number, number][] {
  const out: [number, number, number][] = []
  for (let z = minZoom; z <= maxZoom; z++) {
    const x0 = lngToTileX(bbox.minLng, z)
    const x1 = lngToTileX(bbox.maxLng, z)
    const y0 = latToTileY(bbox.maxLat, z)
    const y1 = latToTileY(bbox.minLat, z)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
        out.push([z, x, y])
        if (out.length >= MAX_VECTOR_TILES) return out
      }
    }
  }
  return out
}

/**
 * The device-wide half: the style, its TileJSON, the sprite and the glyphs.
 * Returns the tile URL template, or null when the style could not be read.
 */
export async function prefetchStyleAssets(styleUrl: string): Promise<string | null> {
  const cache = await openVectorCache()
  const style = await fetchJson<StyleDoc>(styleUrl)
  if (!style) return null
  await warm(cache, styleUrl)

  if (style.sprite) {
    // Both densities, both parts: a style asks for whichever matches the screen.
    await Promise.all([
      warm(cache, `${style.sprite}.json`),
      warm(cache, `${style.sprite}.png`),
      warm(cache, `${style.sprite}@2x.json`),
      warm(cache, `${style.sprite}@2x.png`),
    ])
  }

  if (style.glyphs) {
    const stacks = fontStacks(style)
    await Promise.all(
      stacks.flatMap(stack =>
        GLYPH_RANGES.map(range =>
          warm(cache, style.glyphs!.replace('{fontstack}', encodeURIComponent(stack)).replace('{range}', range)),
        ),
      ),
    )
  }

  // The vector source is a TileJSON reference, and the tile path it hands back
  // carries a planet version. Asking without that segment answers 200 with an
  // empty body, so the template has to come from the TileJSON rather than be
  // guessed.
  for (const source of Object.values(style.sources ?? {})) {
    if (source.tiles?.[0]) return source.tiles[0]
    if (source.url) {
      await warm(cache, source.url)
      const tileJson = await fetchJson<{ tiles?: string[] }>(source.url)
      if (tileJson?.tiles?.[0]) return tileJson.tiles[0]
    }
  }
  return null
}

export interface VectorPrefetchResult {
  tiles: number
  template: string | null
}

/**
 * Pre-download the vector basemap covering a trip's places.
 *
 * `isCancelled` is checked between tiles so going offline or logging out
 * abandons the rest of the queue rather than finishing it in the background.
 */
export async function prefetchVectorForPlaces(
  places: Place[],
  styleUrl: string,
  isCancelled: () => boolean = () => false,
): Promise<VectorPrefetchResult> {
  if (!navigator.onLine) return { tiles: 0, template: null }

  const bbox = computeBbox(places)
  if (!bbox) return { tiles: 0, template: null }

  const template = await prefetchStyleAssets(styleUrl)
  if (!template || isCancelled()) return { tiles: 0, template }

  const cache = await openVectorCache()
  const coords = enumerateVectorTiles(bbox, VECTOR_MIN_ZOOM, VECTOR_MAX_ZOOM)

  let cursor = 0
  let fetched = 0

  async function worker(): Promise<void> {
    while (cursor < coords.length) {
      if (isCancelled() || !navigator.onLine) return
      const next = coords[cursor++]
      if (!next) return
      const [z, x, y] = next
      const url = template!
        .replace('{z}', String(z))
        .replace('{x}', String(x))
        .replace('{y}', String(y))
      if (await warm(cache, url)) fetched++
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  return { tiles: fetched, template }
}

/** Drop the offline vector basemap, alongside the raster cache. */
export async function clearVectorCache(): Promise<void> {
  try {
    await caches.delete(VECTOR_CACHE)
  } catch {
    // Nothing to clear, or storage is unavailable; the caller cannot act on it.
  }
}
