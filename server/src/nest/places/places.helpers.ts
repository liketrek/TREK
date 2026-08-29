import { XMLParser } from 'fast-xml-parser';
import unzipper from 'unzipper';
import {
  externalIdsOf,
  normalizePlaceName,
  placeMatchStrategies,
  type PlaceMatchCandidate,
} from '@trek/shared';
import type { Place } from '../../types';
import type { PlaceWithTags } from '../database/database.service';
import type { KmlImportSummary } from './kml-import.helpers';
import type { PlacePhotoCacheService } from '../place-photos/place-photo-cache.service';
import { haversineMetres } from '../common/geo';

/**
 * Pure helpers and module-scope constants of the places domain, moved verbatim
 * out of the legacy services/placeService.ts when it went DI-native. Same
 * split as maps.helpers.ts / transit.helpers.ts / files.constants.ts: nothing
 * here touches the DB, so it stays plain exports rather than becoming methods
 * on PlacesService — which also keeps the frozen-at-import XML parsers a
 * single shared instance and lets the KMZ unpacker be unit-tested on its own.
 */

const gpxParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['wpt', 'trkpt', 'rtept', 'trk', 'trkseg', 'rte'].includes(name),
});

const kmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  isArray: (name) => ['Placemark', 'Folder', 'Document'].includes(name),
  // Treat <description> as raw text so mixed-content HTML (e.g. <br/>, <i>)
  // is returned as a string instead of a parsed object.
  stopNodes: ['*.description'],
});

export { gpxParser, kmlParser };

export const KMZ_DECOMPRESSED_SIZE_LIMIT = 50 * 1024 * 1024; // 50 MB

// Re-exported so the importers that already read these from here keep working,
// while the values themselves live in @trek/shared with the rule that uses them.
export { COORD_DEDUP_TOLERANCE, externalIdsOf } from '@trek/shared';

/** Cap on a provider list-import response body — the payload is attacker-influenced via the list id. */
export const MAX_LIST_RESPONSE_BYTES = 8 * 1024 * 1024; // 8 MB

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

export interface ListImportError {
  error: string;
  status: number;
}

export interface GpxImportOptions {
  importWaypoints?: boolean;
  importRoutes?: boolean;
  importTracks?: boolean;
  /** Source filename used to name unnamed routes/tracks (keeps multiple imports distinct). */
  defaultName?: string;
}

export interface KmlImportOptions {
  importPoints?: boolean;
  importPaths?: boolean;
}

// Reclaim a deleted place's cached marker photo if nothing else references it.
// The cache key is the Google place_id, or — for coordinate-only places — the
// pseudo-id embedded in the stored proxy URL (/api/maps/place-photo/{id}/bytes).
export async function reclaimPhotoCache(cache: PlacePhotoCacheService, googlePlaceId: string | null, imageUrl: string | null): Promise<void> {
  const candidates = new Set<string>();
  if (googlePlaceId) candidates.add(googlePlaceId);
  const m = imageUrl?.match(/^\/api\/maps\/place-photo\/(.+)\/bytes$/);
  if (m) { try { candidates.add(decodeURIComponent(m[1])); } catch { /* malformed url */ } }
  for (const id of candidates) {
    try { await cache.removeIfUnreferenced(id); } catch { /* best-effort */ }
  }
}

// ---------------------------------------------------------------------------
// Import deduplication helpers
// ---------------------------------------------------------------------------

export interface DedupSet {
  names: Set<string>;
  coords: Array<{ lat: number; lng: number }>;
  /** Provider ids (google_place_id, google_ftid, osm_id) of the places already in the trip. */
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
          Math.abs(c.lat - strategy.lat) <= strategy.tolerance &&
          Math.abs(c.lng - strategy.lng) <= strategy.tolerance,
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
// Google Maps list id parsing
// ---------------------------------------------------------------------------

export function googleMapsHexId(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const raw = String(value).trim();
  if (/^0x[0-9a-f]+$/i.test(raw)) return raw.toLowerCase();
  if (!/^-?\d+$/.test(raw)) return null;
  try {
    const parsed = BigInt(raw);
    const unsigned = parsed < 0n ? (1n << 64n) + parsed : parsed;
    return `0x${unsigned.toString(16)}`;
  } catch {
    return null;
  }
}

export function googleMapsFeatureIdFromItem(item: unknown): string | null {
  if (!Array.isArray(item)) return null;
  const candidates = [
    Array.isArray(item[1]) ? item[1][6] : null,
    Array.isArray(item[7]) ? item[7][1] : null,
  ];

  for (const ids of candidates) {
    if (!Array.isArray(ids) || ids.length < 2) continue;
    const first = googleMapsHexId(ids[0]);
    const second = googleMapsHexId(ids[1]);
    if (first && second) return `${first}:${second}`;
  }

  return null;
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
// KMZ unpacking
// ---------------------------------------------------------------------------

export async function unpackKmzToKml(
  kmzBuffer: Buffer,
  decompressedSizeLimit = KMZ_DECOMPRESSED_SIZE_LIMIT,
): Promise<Buffer> {
  let zip;
  try {
    zip = await unzipper.Open.buffer(kmzBuffer);
  } catch {
    throw new Error('Invalid KMZ archive.');
  }

  const kmlEntries = zip.files.filter((entry) => !entry.path.endsWith('/') && entry.path.toLowerCase().endsWith('.kml'));
  if (kmlEntries.length === 0) {
    throw new Error('KMZ archive does not contain a KML file.');
  }

  const preferredEntry = kmlEntries.find((entry) => entry.path.toLowerCase().endsWith('doc.kml')) || kmlEntries[0];

  if (preferredEntry.uncompressedSize > decompressedSizeLimit) {
    throw new Error('KMZ archive exceeds the maximum allowed decompressed size.');
  }

  return preferredEntry.buffer();
}
