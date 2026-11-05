import type { PlaceWithTagsRow as PlaceWithTags } from '../../db/repositories/Places.repository';
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

export type { GpxImportOptions, KmlImportOptions } from '../place-import/place-import.types';

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
  /**
   * The places with a line, keyed by name and course (`trackKey`): a track to import
   * matches only these (#2810), and only one that runs the same way (#2870). Absent
   * where none is read.
   */
  tracks?: Set<string>;
  coords: Array<{ lat: number; lng: number }>;
  /** Provider ids (google_place_id, google_ftid, osm_id, amap_poi_id) of the places already in the trip. */
  externalIds: Set<string>;
}

/**
 * A candidate for the dedup set; `track` when it is a line (a GPX track or route, a
 * KML path), with that line in `routeGeometry`.
 */
export type DedupCandidate = PlaceMatchCandidate & { track?: boolean; routeGeometry?: string | null };

/**
 * Where a line starts, ends and how far it reaches, to about a hundred metres: two
 * hikes a watch names alike ("Afternoon Hike") differ here, while the same file read
 * again gives the same answer however its points were rounded or thinned. Empty for
 * a line that does not parse.
 */
function lineCourse(routeGeometry: string | null | undefined): string {
  let points: unknown;
  try {
    points = JSON.parse(routeGeometry ?? '');
  } catch {
    return '';
  }
  if (!Array.isArray(points)) return '';
  const line = points.filter(
    (p): p is [number, number] => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]),
  );
  if (line.length === 0) return '';
  // A loop rather than Math.min(...): a recorded day holds more points than a call takes arguments.
  let [south, west] = line[0];
  let [north, east] = line[0];
  for (const [lat, lng] of line) {
    south = Math.min(south, lat);
    north = Math.max(north, lat);
    west = Math.min(west, lng);
    east = Math.max(east, lng);
  }
  const [first, last] = [line[0], line[line.length - 1]];
  return [first[0], first[1], last[0], last[1], south, west, north, east].map((v) => v.toFixed(3)).join(',');
}

/** An imported row as the dedup set reads it: a line when it carries one. */
export function lineCandidate(
  name: string | null | undefined,
  row: { lat: number | null; lng: number | null; routeGeometry?: string | null },
): DedupCandidate {
  return { name, lat: row.lat, lng: row.lng, track: !!row.routeGeometry, routeGeometry: row.routeGeometry };
}

/** A track's entry in `DedupSet.tracks`: its normalized name and its course. */
function trackKey(name: string, routeGeometry: string | null | undefined): string {
  return `${name}\u0000${lineCourse(routeGeometry)}`;
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
export function isPlaceDuplicate(candidate: DedupCandidate, dedup: DedupSet): boolean {
  for (const strategy of placeMatchStrategies(candidate)) {
    if (strategy.by === 'externalId') {
      if (dedup.externalIds.has(strategy.id)) return true;
    } else if (strategy.by === 'name') {
      // A track is the same as a track of that name that runs the same way, never as a
      // sight of that name: a watch names a hike after the place it went to (#2810), and
      // two hikes of one day alike (#2870).
      if (candidate.track) {
        if (dedup.tracks?.has(trackKey(strategy.name, candidate.routeGeometry))) return true;
      } else if (dedup.names.has(strategy.name)) {
        return true;
      }
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

/**
 * The lookup of the places already in a trip: names lowercased and trimmed,
 * coordinates only for unnamed rows, provider ids for every row. Provider ids
 * are collected named or not: they are what lets a renamed place still be
 * recognised on a re-import (#1550).
 */
export function dedupSetOf(
  rows: ReadonlyArray<
    { name: string | null; lat: number | null; lng: number | null; route_geometry?: string | null } & Parameters<
      typeof externalIdsOf
    >[0]
  >,
): DedupSet {
  const names = new Set<string>();
  const tracks = new Set<string>();
  const coords: Array<{ lat: number; lng: number }> = [];
  const externalIds = new Set<string>();
  for (const row of rows) {
    for (const id of externalIdsOf(row)) externalIds.add(id);
    if (row.name) {
      names.add(row.name.trim().toLowerCase());
      if (row.route_geometry) tracks.add(trackKey(row.name.trim().toLowerCase(), row.route_geometry));
    } else if (row.lat != null && row.lng != null) {
      coords.push({ lat: row.lat, lng: row.lng });
    }
  }
  return { names, tracks, coords, externalIds };
}

/** Record a newly inserted place so subsequent candidates in the same batch are checked against it. */
export function trackInsertedInDedupSet(place: DedupCandidate, dedup: DedupSet): void {
  for (const id of externalIdsOf(place)) dedup.externalIds.add(id);
  const normalizedName = normalizePlaceName(place.name);
  if (normalizedName) {
    dedup.names.add(normalizedName);
    if (place.track) (dedup.tracks ??= new Set()).add(trackKey(normalizedName, place.routeGeometry));
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
