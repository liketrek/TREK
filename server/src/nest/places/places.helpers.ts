import type { PlaceWithTagsRow as PlaceWithTags } from '../../db/repositories/Places.repository';
import type { Place } from '../../types';
import { haversineMetres } from '../common/geo';
import type { KmlImportSummary } from '../place-import/place-import.types';
import type { PlacePhotoCacheService } from '../place-photos/place-photo-cache.service';
import { externalIdsOf, normalizePlaceName, placeMatchStrategies, type PlaceMatchCandidate } from '@trek/shared';

/**
 * Pure helpers and module-scope constants of the places domain, moved verbatim
 * out of the legacy services/placeService.ts when it went DI-native. Same
 * split as maps.helpers.ts / transit.helpers.ts / files.constants.ts: nothing
 * here touches the DB, so it stays plain exports rather than becoming methods
 * on PlacesService. Reading files and shared lists (the XML parsers, the KMZ
 * unpacker, the list fetchers) lives in place-import/.
 */

// Re-exported so the importers that already read these from here keep working,
// while the values themselves live in @trek/shared with the rule that uses them.
export { COORD_DEDUP_TOLERANCE, externalIdsOf } from '@trek/shared';

export type { GpxImportOptions, KmlImportOptions, ListImportError } from '../place-import/place-import.types';

/**
 * Escape the LIKE metacharacters in a user-supplied search term so `%` and `_`
 * match literally. Pairs with `LIKE ? ESCAPE '\\'` at the call site; the
 * backslash itself is escaped first so a trailing one cannot orphan the escape.
 */
export function escapeLikePattern(term: string): string {
  return term.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/** Opt-in Places-API enrichment for list imports (#886). */
export interface ListImportOptions {
  enrich?: boolean;
  userId?: number;
  lang?: string;
}

export interface PlaceWithCategory extends Place {
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
}

export interface PlaceImportResult {
  places: PlaceWithTags[];
  count: number;
  summary: KmlImportSummary;
}

export interface GpxImportResult {
  places: PlaceWithTags[];
  count: number;
  skipped: number;
}

export interface ListImportResult {
  places: PlaceWithTags[];
  listName: string;
  skipped: number;
}

// Reclaim a deleted place's cached marker photo if nothing else references it.
// The cache key is the Google place_id, or — for coordinate-only places — the
// pseudo-id embedded in the stored proxy URL (/api/maps/place-photo/{id}/bytes).
export async function reclaimPhotoCache(
  cache: PlacePhotoCacheService,
  googlePlaceId: string | null,
  imageUrl: string | null,
): Promise<void> {
  const candidates = new Set<string>();
  if (googlePlaceId) candidates.add(googlePlaceId);
  const m = imageUrl?.match(/^\/api\/maps\/place-photo\/(.+)\/bytes$/);
  if (m) {
    try {
      candidates.add(decodeURIComponent(m[1]));
    } catch {
      /* malformed url */
    }
  }
  for (const id of candidates) {
    try {
      await cache.removeIfUnreferenced(id);
    } catch {
      /* best-effort */
    }
  }
}

// ---------------------------------------------------------------------------
// Import deduplication helpers
// ---------------------------------------------------------------------------

export interface DedupSet {
  names: Set<string>;
  coords: Array<{ lat: number; lng: number }>;
  /** Provider ids (google_place_id, google_ftid, osm_id, amap_poi_id) of the places already in the trip. */
  externalIds: Set<string>;
}

/**
 * Returns true if a candidate place is already represented in the dedup set.
 *
 * The in-memory half of the matching rule; `PlacesService.findMatchingPlaceId` is
 * the SQL half. Both walk the same strategy list from @trek/shared, so neither can
 * reach for a KIND of match the other would not — which is exactly what had
 * happened: the SQL copy fell back to coordinates on a named candidate, and this
 * one deliberately never does (see place-match.ts for why).
 *
 * Shared order, not shared comparison: SQLite `lower()` is ASCII-only where
 * JavaScript's is not, and only unnamed rows contribute coordinates to a dedup
 * set. `findDuplicatePlace` spells out where the two still answer differently.
 */
export function isPlaceDuplicate(candidate: PlaceMatchCandidate, dedup: DedupSet): boolean {
  for (const strategy of placeMatchStrategies(candidate)) {
    if (strategy.by === 'externalId') {
      if (dedup.externalIds.has(strategy.id)) return true;
    } else if (strategy.by === 'name') {
      if (dedup.names.has(strategy.name)) return true;
    } else if (
      dedup.coords.some(
        (c) =>
          Math.abs(c.lat - strategy.lat) <= strategy.tolerance && Math.abs(c.lng - strategy.lng) <= strategy.tolerance,
      )
    ) {
      return true;
    }
  }
  return false;
}

/** Record a newly inserted place so subsequent candidates in the same batch are checked against it. */
export function trackInsertedInDedupSet(place: PlaceMatchCandidate, dedup: DedupSet): void {
  for (const id of externalIdsOf(place)) dedup.externalIds.add(id);
  const normalizedName = normalizePlaceName(place.name);
  if (normalizedName) {
    dedup.names.add(normalizedName);
  } else if (place.lat != null && place.lng != null) {
    dedup.coords.push({ lat: place.lat, lng: place.lng });
  }
}

// ---------------------------------------------------------------------------
// Import enrichment (#886) — the pure half of the former
// services/placeEnrichment.ts; the DB/websocket/Maps half is PlacesService.
// ---------------------------------------------------------------------------

/** A place the import produced — only the fields enrichment reads/writes. */
export interface EnrichablePlace {
  id: number;
  name: string;
  lat: number;
  lng: number;
  google_place_id?: string | null;
  google_ftid?: string | null;
  address?: string | null;
  website?: string | null;
  phone?: string | null;
  image_url?: string | null;
}

/** How close a search hit must be to the imported coordinates to be trusted. */
export const MATCH_RADIUS_METERS = 250;
/** Bias the text search to roughly the imported area. */
export const SEARCH_BIAS_RADIUS_METERS = 2000;
/** Concurrent enrichment lookups — small, to stay friendly to the Maps quota. */
export const ENRICH_CONCURRENCY = 3;

// The free address backfill is one Nominatim request per place on the throttled
// background lane (~1/s), so a normal list costs seconds. Past this it stops being
// a backfill and starts being bulk geocoding, which Nominatim's usage policy asks
// people not to do — so it stops rather than queueing for an hour.
export const ADDRESS_BACKFILL_MAX_PLACES = 250;

/**
 * Pick the search result that is the same place as the import: it must be a
 * Google result (have a google_place_id) with coordinates within
 * MATCH_RADIUS_METERS of the imported point. Returns the closest such hit, or
 * null when nothing is close enough — in which case the place is left as
 * imported rather than risking a wrong-place overwrite (common-name / romanized
 * lists). Exported for unit testing.
 */
export function pickEnrichmentMatch(
  candidates: Record<string, unknown>[],
  target: { lat: number; lng: number },
  maxMeters: number = MATCH_RADIUS_METERS,
): Record<string, unknown> | null {
  let best: { c: Record<string, unknown>; dist: number } | null = null;
  for (const c of candidates || []) {
    const gpid = c.google_place_id;
    const lat = c.lat;
    const lng = c.lng;
    if (typeof gpid !== 'string' || !gpid) continue;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    const dist = haversineMetres(target.lat, target.lng, lat, lng);
    if (dist > maxMeters) continue;
    if (!best || dist < best.dist) best = { c, dist };
  }
  return best?.c ?? null;
}

export async function mapWithConcurrency<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      await fn(item);
    }
  });
  await Promise.all(workers);
}

/** Trim to a non-empty string, else null — the enrichment "only fill real values" guard. */
export const trimOrNull = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

// ---------------------------------------------------------------------------
// KML folder → trip category
// ---------------------------------------------------------------------------

export function buildCategoryNameLookup(categories: { id: number; name: string }[]): Map<string, number> {
  const lookup = new Map<string, number>();
  for (const category of categories) {
    const normalizedName = category.name.trim().toLowerCase();
    if (!normalizedName) continue;
    if (!lookup.has(normalizedName)) {
      lookup.set(normalizedName, category.id);
    }
  }
  return lookup;
}

export function resolveCategoryIdForFolder(folderName: string | null, lookup: Map<string, number>): number | null {
  if (!folderName) return null;
  const normalizedFolder = folderName.trim().toLowerCase();
  if (!normalizedFolder) return null;
  return lookup.get(normalizedFolder) ?? null;
}
