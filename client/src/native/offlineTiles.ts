import type { AddProtocolAction, GetResourceResponse, RequestParameters } from 'maplibre-gl'
import { VECTOR_CACHE } from '../sync/glPrefetcher'
import { isNativeIos } from './platform'

/**
 * Offline vector maps for the iOS app.
 *
 * In a browser the service worker answers MapLibre's requests from the
 * 'gl-map-offline' cache that glPrefetcher fills for trips marked for offline.
 * The iOS app has no service worker, so nothing reads that cache there. This
 * protocol takes the service worker's place: the style URL is rewritten to
 * trek-offline://, every https URL inside the style and its TileJSON gets the
 * same scheme, and the handler serves them from the cache or the network.
 *
 * Mapbox GL has no protocol hook, so a Mapbox basemap stays online-only in
 * the app.
 */

export const OFFLINE_SCHEME = 'trek-offline'
const PREFIX = `${OFFLINE_SCHEME}://`

export function offlineTilesActive(): boolean {
  return isNativeIos() && typeof caches !== 'undefined'
}

export function toOfflineUrl(url: string): string {
  return url.startsWith('https://') ? PREFIX + url.slice('https://'.length) : url
}

export function fromOfflineUrl(url: string): string {
  return url.startsWith(PREFIX) ? 'https://' + url.slice(PREFIX.length) : url
}

/** The style URL to hand MapLibre: rewritten inside the iOS app, untouched anywhere else. */
export function offlineStyle<T>(style: T): T {
  return offlineTilesActive() && typeof style === 'string' ? (toOfflineUrl(style) as T) : style
}

type Doc = Record<string, unknown>

const isDoc = (value: unknown): value is Doc => typeof value === 'object' && value !== null && !Array.isArray(value)
const rewriteList = (value: unknown): unknown => (Array.isArray(value) ? value.map((v) => (typeof v === 'string' ? toOfflineUrl(v) : v)) : value)

/**
 * Points the URLs inside a style document or a TileJSON at the protocol, so
 * that MapLibre asks this handler for the sprite, the glyphs, the TileJSON and
 * the tiles as well, not only for the style.
 */
export function rewriteDocument(doc: unknown): unknown {
  if (!isDoc(doc)) return doc
  const out: Doc = { ...doc }
  if ('tiles' in out) out.tiles = rewriteList(out.tiles)
  if (typeof out.glyphs === 'string') out.glyphs = toOfflineUrl(out.glyphs)
  if (typeof out.sprite === 'string') out.sprite = toOfflineUrl(out.sprite)
  else if (Array.isArray(out.sprite)) {
    out.sprite = out.sprite.map((entry) => (isDoc(entry) && typeof entry.url === 'string' ? { ...entry, url: toOfflineUrl(entry.url) } : entry))
  }
  if (isDoc(out.sources)) {
    out.sources = Object.fromEntries(Object.entries(out.sources).map(([id, source]) => {
      if (!isDoc(source)) return [id, source]
      const rewritten: Doc = { ...source }
      if (typeof rewritten.url === 'string') rewritten.url = toOfflineUrl(rewritten.url)
      if ('tiles' in rewritten) rewritten.tiles = rewriteList(rewritten.tiles)
      return [id, rewritten]
    }))
  }
  return out
}

/**
 * Documents are asked of the network first so a changed style shows up, and
 * fall back to the cache offline. Tiles, glyphs and sprites never change under
 * their URL, so the cache goes first and saves the round trip.
 */
async function load(url: string, networkFirst: boolean, signal: AbortSignal): Promise<Response> {
  const cache = await caches.open(VECTOR_CACHE)
  if (!networkFirst) {
    const cached = await cache.match(url)
    if (cached) return cached
  }
  try {
    const response = await fetch(url, { mode: 'cors', signal })
    if (response.ok) return response
    if (!networkFirst) return response
  } catch (err) {
    if (signal.aborted || !networkFirst) throw err
  }
  const cached = await cache.match(url)
  if (cached) return cached
  throw new Error(`Not available offline: ${url}`)
}

export const offlineProtocol: AddProtocolAction = async (params: RequestParameters, abortController: AbortController): Promise<GetResourceResponse<unknown>> => {
  const url = fromOfflineUrl(params.url)
  const response = await load(url, params.type === 'json', abortController.signal)
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
  if (params.type === 'json') return { data: rewriteDocument(await response.json()) }
  if (params.type === 'string') return { data: await response.text() }
  return { data: await response.arrayBuffer() }
}

export function installOfflineProtocol(maplibre: { addProtocol: (name: string, action: AddProtocolAction) => void }): void {
  if (offlineTilesActive()) maplibre.addProtocol(OFFLINE_SCHEME, offlineProtocol)
}
