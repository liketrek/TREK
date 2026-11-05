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
import { computeBbox, tileRange, type TileBbox } from './tilePrefetcher'
import type { Place } from '../types'

/** OpenFreeMap serves vector tiles up to z14 and overzooms from there. */
const VECTOR_MAX_ZOOM = 14
// Zoom 0, not 10: MapLibre can only overzoom upward, so a wide trip opening at
// its fitBounds zoom (z6–9) rendered nothing offline with a z10 floor (#2180).
// The low zooms cost a few dozen tiles at most.
const VECTOR_MIN_ZOOM = 0

/** Requests in flight, kept low for the same reason the raster side keeps it low. */
const CONCURRENCY = 6

/**
 * Hard cap on vector tiles per run. Each is far larger than a raster tile but
 * there are far fewer of them; this is roughly the same byte budget.
 */
const MAX_VECTOR_TILES = 2000

/** Workbox runtime cache for the vector basemap (see vite.config.js). */
export const VECTOR_CACHE = 'gl-map-offline'

/**
 * Latin glyph ranges. A label needs the range its codepoints fall in, and Latin
 * text lives in the first few; asking for all 256 ranges would download megabytes
 * of CJK nobody on this map is going to render.
 */
const GLYPH_RANGES = ['0-255', '256-511', '512-767', '768-1023', '1024-1279', '1280-1535', '1536-1791', '8192-8447', '8448-8703']

interface StyleSource {
  type?: string
  url?: string
  tiles?: string[]
  minzoom?: number
  maxzoom?: number
}

/** One tiled source of the style, with the zooms it actually serves. */
interface TileSource {
  template: string
  minZoom: number
  maxZoom: number
  vector: boolean
}

interface StyleDoc {
  sprite?: string
  glyphs?: string
  sources?: Record<string, StyleSource>
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

/**
 * Tile URLs covering the box, vector sources first and low zoom first within
 * each, so a truncated run is still useful. A source is only asked for the
 * zooms it serves: OpenFreeMap's shaded relief stops at z6 and answers 404
 * above it.
 */
function enumerateTileUrls(bbox: TileBbox, sources: TileSource[]): string[] {
  const out: string[] = []
  for (const source of sources) {
    for (let z = Math.max(source.minZoom, VECTOR_MIN_ZOOM); z <= Math.min(source.maxZoom, VECTOR_MAX_ZOOM); z++) {
      if (!pushZoomTiles(out, source.template, bbox, z)) return out
    }
  }
  return out
}

/** One zoom's tiles of a source onto `out`; false once the run is full. */
function pushZoomTiles(out: string[], template: string, bbox: TileBbox, z: number): boolean {
  // Same screen-widened rectangle as the raster side: the opening fitBounds
  // view shows more than the places extent on the non-limiting axis (#2180).
  const { minX, maxX, minY, maxY } = tileRange(bbox, z)
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      out.push(template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y)))
      if (out.length >= MAX_VECTOR_TILES) return false
    }
  }
  return true
}

/**
 * The style's tiled sources, vector first. A source given as a TileJSON
 * reference gets its template and zooms from there: the tile path carries a
 * planet version, and asking without that segment answers 200 with an empty
 * body, so it cannot be guessed. A source without tiles (GeoJSON) is skipped.
 */
async function readTileSources(style: StyleDoc, cache: Cache | null): Promise<TileSource[]> {
  const out: TileSource[] = []
  for (const source of Object.values(style.sources ?? {})) {
    let { tiles, minzoom, maxzoom } = source
    if (!tiles?.[0] && source.url) {
      await warm(cache, source.url)
      const tileJson = await fetchJson<{ tiles?: string[]; minzoom?: number; maxzoom?: number }>(source.url)
      tiles = tileJson?.tiles
      minzoom ??= tileJson?.minzoom
      maxzoom ??= tileJson?.maxzoom
    }
    if (!tiles?.[0]) continue
    out.push({
      template: tiles[0],
      minZoom: minzoom ?? VECTOR_MIN_ZOOM,
      maxZoom: maxzoom ?? VECTOR_MAX_ZOOM,
      vector: source.type !== 'raster' && source.type !== 'raster-dem',
    })
  }
  return out.sort((a, b) => Number(b.vector) - Number(a.vector))
}

/**
 * The device-wide half: the style, its TileJSON, the sprite and the glyphs.
 * Returns the vector tile URL template, or null when the style could not be read.
 */
export async function prefetchStyleAssets(styleUrl: string): Promise<string | null> {
  return (await prefetchStyle(styleUrl))?.[0]?.template ?? null
}

async function prefetchStyle(styleUrl: string): Promise<TileSource[] | null> {
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

  return readTileSources(style, cache)
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

  const sources = await prefetchStyle(styleUrl)
  const template = sources?.[0]?.template ?? null
  if (!sources?.length || isCancelled()) return { tiles: 0, template }

  const cache = await openVectorCache()
  const urls = enumerateTileUrls(bbox, sources)

  let cursor = 0
  let fetched = 0

  async function worker(): Promise<void> {
    while (cursor < urls.length) {
      if (isCancelled() || !navigator.onLine) return
      const url = urls[cursor++]
      if (!url) return
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
