import type { MapsPlaceEnrichmentResult } from '@trek/shared';

/**
 * The place an enrichment consumer is describing — the editor's details column
 * and the view-mode photo gallery both use this shape.
 */
export interface PlaceDetailsSelection {
  placeId?: string;
  lat: number;
  lng: number;
  name: string;
  /** The picked search result, so the server can skip its own details lookup. */
  details?: Record<string, unknown>;
}

/**
 * Module-level cache plus sessionStorage, same shape as usePlaceDetails in
 * PlaceInspector. Clicking back and forth between two search results must not
 * pay for the provider fan-out twice, and the gallery must reuse the pictures
 * the editor already fetched for the same place.
 */
const enrichmentCache = new Map<string, Stored>();

/** A kept answer and when it was fetched. */
interface Stored {
  at: number;
  value: MapsPlaceEnrichmentResult;
}

/**
 * How long a kept answer is reused. A saved place reopened for editing carries
 * no community version, so its key never changes: without an end, a picture
 * another installation contributed would stay out of this tab until it closed.
 * The server keeps an empty answer for the same ten minutes.
 */
const KEEP_MS = 10 * 60 * 1000;

/** Test seam: the module-level cache otherwise leaks between cases. */
export function __clearEnrichmentCacheForTests(): void {
  enrichmentCache.clear();
}

function readSession(key: string): Stored | undefined {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Stored) : undefined;
  } catch {
    return undefined;
  }
}

function writeSession(key: string, value: Stored): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota — the in-memory cache still helps for this session */
  }
}

/**
 * Bumped with the server's CACHE_VERSION. sessionStorage outlives a deploy, so
 * without it the tab that was open while the fix shipped keeps replaying the
 * answer the fix was about — and reports it as still broken.
 */
const ENRICH_CACHE_V = 5;

export function cacheKeyFor(selection: PlaceDetailsSelection, language: string): string {
  const id = selection.placeId || `coords:${selection.lat}:${selection.lng}`;
  // A place of the TREK index names the version of the community values it is
  // served with; a new version is a new answer, not the one this tab kept.
  const version = selection.details?.community_version;
  const community = typeof version === 'number' ? `_c${version}` : '';
  return `enrich_v${ENRICH_CACHE_V}_${id}${community}_${language}`;
}

/** The answer if it was already fetched this session, else undefined. */
export function readCachedEnrichment(
  selection: PlaceDetailsSelection,
  language: string
): MapsPlaceEnrichmentResult | undefined {
  const key = cacheKeyFor(selection, language);
  const cached = enrichmentCache.get(key) ?? readSession(key);
  if (!cached || typeof cached.at !== 'number' || Date.now() - cached.at >= KEEP_MS) {
    enrichmentCache.delete(key);
    return undefined;
  }
  enrichmentCache.set(key, cached);
  return cached.value;
}

export function storeEnrichment(
  selection: PlaceDetailsSelection,
  language: string,
  value: MapsPlaceEnrichmentResult
): void {
  const key = cacheKeyFor(selection, language);
  const stored = { at: Date.now(), value };
  enrichmentCache.set(key, stored);
  writeSession(key, stored);
}
