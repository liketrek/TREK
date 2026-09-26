import type { MapsPlaceEnrichmentResult } from '@trek/shared'

/**
 * The place an enrichment consumer is describing — the editor's details column
 * and the view-mode photo gallery both use this shape.
 */
export interface PlaceDetailsSelection {
  placeId?: string
  lat: number
  lng: number
  name: string
  /** The picked search result, so the server can skip its own details lookup. */
  details?: Record<string, unknown>
}

/**
 * Module-level cache plus sessionStorage, same shape as usePlaceDetails in
 * PlaceInspector. Clicking back and forth between two search results must not
 * pay for the provider fan-out twice, and the gallery must reuse the pictures
 * the editor already fetched for the same place.
 */
const enrichmentCache = new Map<string, MapsPlaceEnrichmentResult>()

/** Test seam: the module-level cache otherwise leaks between cases. */
export function __clearEnrichmentCacheForTests(): void {
  enrichmentCache.clear()
}

function readSession(key: string): MapsPlaceEnrichmentResult | undefined {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as MapsPlaceEnrichmentResult) : undefined
  } catch {
    return undefined
  }
}

function writeSession(key: string, value: MapsPlaceEnrichmentResult): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode / quota — the in-memory cache still helps for this session */
  }
}

/**
 * Bumped with the server's CACHE_VERSION. sessionStorage outlives a deploy, so
 * without it the tab that was open while the fix shipped keeps replaying the
 * answer the fix was about — and reports it as still broken.
 */
const ENRICH_CACHE_V = 4

export function cacheKeyFor(selection: PlaceDetailsSelection, language: string): string {
  const id = selection.placeId || `coords:${selection.lat}:${selection.lng}`
  return `enrich_v${ENRICH_CACHE_V}_${id}_${language}`
}

/** The answer if it was already fetched this session, else undefined. */
export function readCachedEnrichment(
  selection: PlaceDetailsSelection,
  language: string,
): MapsPlaceEnrichmentResult | undefined {
  const key = cacheKeyFor(selection, language)
  const cached = enrichmentCache.get(key) ?? readSession(key)
  if (cached) enrichmentCache.set(key, cached)
  return cached
}

export function storeEnrichment(
  selection: PlaceDetailsSelection,
  language: string,
  value: MapsPlaceEnrichmentResult,
): void {
  const key = cacheKeyFor(selection, language)
  enrichmentCache.set(key, value)
  writeSession(key, value)
}
