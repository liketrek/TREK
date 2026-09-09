/**
 * Client for the TREK Places API.
 *
 * The index behind it is Overture Places, built monthly and served from a
 * server the project runs. It replaces the two things TREK used to do badly:
 * searching through Nominatim, which its own usage policy forbids for
 * autocomplete, and paying Google for a text search whose terms then forbid
 * storing what comes back.
 *
 * Everything here is read-only, unauthenticated and cacheable. There is no key
 * to configure and no quota to exhaust, so the failure modes are the network
 * and the service being down, both of which fall back to what TREK did before.
 */
import { readEnv, getAppUrl } from '../../app-config';

/** The public instance. An operator may point at their own copy instead. */
export const DEFAULT_TREK_PLACES_URL = 'https://places.liketrek.com';

/**
 * Short on purpose. This sits in front of a keystroke, and a slow answer is
 * worse than no answer: the caller falls back to the old path rather than
 * leaving somebody watching a spinner.
 */
const TIMEOUT_MS = 3500;

/** A search answer is a few kB. A megabyte means something is wrong upstream. */
const MAX_BYTES = 1_000_000;

/**
 * The area download is the one call that is neither short nor interactive.
 *
 * It runs from the offline prefetch, asks for thousands of rows at once, and
 * nobody is watching a spinner while it does. Holding it to the search budget
 * capped a Rostock-sized city at the megabyte the prefetch was measured to need
 * and threw, which the caller could only report as "index unavailable" — the
 * trip then went offline with an empty place cache and nothing said so.
 *
 * Budgeted per row rather than as a flat number so the ceiling follows the
 * limit the caller actually asked for, with a floor for small boxes.
 */
const AREA_TIMEOUT_MS = 20_000;
const AREA_BYTES_PER_ROW = 1_200;
const AREA_MIN_BYTES = 2_000_000;

export interface TrekPlace {
  gers: string;
  name: string;
  lat: number;
  lng: number;
  category: string | null;
  categoryPath: string | null;
  confidence: number | null;
  address: {
    freeform: string | null;
    locality: string | null;
    postcode: string | null;
    region: string | null;
    country: string | null;
  };
  contact: {
    website: string | null;
    phone: string | null;
    email: string | null;
    socials: string[] | null;
  };
  brand: { name: string | null; wikidata: string | null } | null;
  source: string;
  /**
   * Opening hours in OSM syntax, plus where they came from. The index carries
   * them for a small share of places; the rest are read from the schema.org
   * data the operator publishes on their own site, in the same page fetch the
   * description comes from.
   */
  hours: { osm: string; source: string | null; sourceUrl: string | null } | null;
  /** Quoted from the place's own site, when it publishes one for machines. */
  description?: { text: string; source: string | null; sourceUrl: string | null } | null;
  score?: number;
}

export interface TrekPlacesSearchResponse {
  query: string;
  results: TrekPlace[];
}

/**
 * One opaque string per instance, so the service can rate-limit per caller
 * instead of per IP. Derived from the instance URL rather than generated and
 * stored: it must be stable across restarts, and it must not be anything that
 * identifies a person. It is never resolved back to anything on the far side.
 */
function instanceToken(): string {
  // getAppUrl(), not the raw APP_URL. The variable is commented out in the
  // shipped compose file, so reading it raw gave every default install the same
  // string — and a token every caller shares is not a caller. One install
  // running a large import would then rate-limit all the others, who would fall
  // back to Nominatim with nothing to point at. The resolver falls through to
  // ALLOWED_ORIGINS and then to the port, so an unconfigured instance still
  // differs from its neighbours.
  const url = getAppUrl();
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
  }
  return `trek-${(hash >>> 0).toString(36)}`;
}

/**
 * Stop asking a service that is not answering.
 *
 * Every call site here is in front of something a person is waiting for, and
 * each one falls back to the old path when the index fails — but it pays the
 * timeout first, every single time. An instance behind a firewall that drops
 * rather than refuses, or one whose network simply cannot reach the service,
 * therefore pays it on every keystroke of autocomplete and on every one of the
 * three queries a booking import runs per venue. Ten venues is over a hundred
 * seconds of waiting for an answer that was never going to come.
 *
 * So: after a few consecutive failures, fail instantly for a while instead of
 * dialling out. One request pays the timeout, the rest are free, and after the
 * cooldown the next call tries again for real — if it works, the count resets
 * and nothing was permanently switched off.
 *
 * Counted per process, deliberately. This guards the instance's own latency,
 * not the service, so it neither needs nor deserves storage.
 */
const BREAKER_FAILURES_BEFORE_OPEN = 4;
const BREAKER_COOLDOWN_MS = 60_000;
let breakerFailures = 0;
let breakerOpenUntil = 0;

/**
 * Whether a failure says anything about reachability.
 *
 * A 404 does not: "no such place" is a perfectly good answer, and
 * trekPlacesById turns it into null. Nor does an oversized body, which means
 * the service answered and answered too much. What counts is a request that
 * never came back, and a server error, because both mean asking again costs the
 * same and returns the same.
 */
function countsAgainstReachability(err: unknown): boolean {
  const status = (err as { status?: number } | null)?.status;
  if (typeof status === 'number') return status >= 500 || status === 429;
  return !(err instanceof Error && err.message === 'TREK Places API response too large');
}

/** Test seam: the breaker is process state, so a suite has to be able to clear it. */
export function resetTrekPlacesBreaker(): void {
  breakerFailures = 0;
  breakerOpenUntil = 0;
}

export function trekPlacesBaseUrl(): string {
  const configured = (readEnv().maps.trekPlacesUrl || '').trim();
  return (configured || DEFAULT_TREK_PLACES_URL).replace(/\/+$/, '');
}

async function getJson<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  opts: { maxBytes?: number; timeoutMs?: number } = {},
): Promise<T> {
  const url = new URL(trekPlacesBaseUrl() + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }

  if (Date.now() < breakerOpenUntil) {
    throw new Error('TREK Places API unreachable, not retrying yet');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'X-TREK-Instance': instanceToken(),
      },
    });
    if (!res.ok) {
      const err = new Error(`TREK Places API ${res.status}`) as Error & { status: number };
      err.status = res.status;
      throw err;
    }
    // Read with a cap rather than res.json(): a hostile or broken upstream
    // should not be able to hand us an unbounded body to buffer.
    const text = await readCapped(res, opts.maxBytes ?? MAX_BYTES);
    const parsed = JSON.parse(text) as T;
    // An answer of any kind means the service is there.
    breakerFailures = 0;
    return parsed;
  } catch (err: unknown) {
    if (countsAgainstReachability(err)) {
      breakerFailures += 1;
      if (breakerFailures >= BREAKER_FAILURES_BEFORE_OPEN) {
        breakerOpenUntil = Date.now() + BREAKER_COOLDOWN_MS;
        // Back to the threshold rather than to zero: when the cooldown ends,
        // one more failure re-opens the breaker instead of buying another four
        // full timeouts.
        breakerFailures = BREAKER_FAILURES_BEFORE_OPEN - 1;
      }
    } else {
      // The service answered. A 404 is an answer.
      breakerFailures = 0;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function readCapped(res: Response, max: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return res.text();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new Error('TREK Places API response too large');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * A row from the service's OpenStreetMap layer, which answers alongside the
 * index when `sources` asks for it.
 *
 * A different shape from TrekPlace, and that is the point rather than an
 * oversight: the layer carries every name form a place is known under, which is
 * what the index does not have. `name` is the one that matched the query and
 * `local_name` the one written on the building, so a German searching "Tokio
 * Hauptbahnhof" gets that as the label and 東京駅丸の内駅舎 underneath.
 *
 * It has no address block. OpenStreetMap does not carry one per node, and
 * inventing an empty one here would let a caller read `address.locality` and
 * quietly get nothing.
 */
export interface TrekOsmPlace {
  /** Always `osm:<type>/<id>`, e.g. `osm:node/9712313`. */
  id: string;
  osm_type: 'node' | 'way' | 'relation';
  osm_id: number;
  name: string;
  local_name: string | null;
  lat: number;
  lng: number;
  category: string | null;
  source: 'openstreetmap';
  distance_km?: number;
}

export type TrekSearchHit = TrekPlace | TrekOsmPlace;

export const isOsmHit = (hit: TrekSearchHit): hit is TrekOsmPlace =>
  hit.source === 'openstreetmap';

/**
 * Turn the layer's id into the form the rest of this service already speaks.
 *
 * `osm:node/9712313` becomes `node:9712313`, which is what OSM_PLACE_ID matches
 * and what getPlaceDetails resolves through the existing OpenStreetMap path.
 * Without this the suggestion would carry an id nothing downstream recognises,
 * and picking it would fail after the user had already chosen it.
 */
export function osmPlaceId(hit: TrekOsmPlace): string {
  return `${hit.osm_type}:${hit.osm_id}`;
}

export async function trekPlacesSearch(
  query: string,
  opts: { lat?: number; lng?: number; limit?: number; sources?: string } = {},
): Promise<TrekSearchHit[]> {
  const body = await getJson<{ results?: TrekSearchHit[] }>('/v1/search', {
    q: query,
    lat: opts.lat,
    lng: opts.lng,
    limit: opts.limit ?? 10,
    // Left off unless asked for, so the service applies its own default. That
    // default is the index alone, which is what every existing caller here
    // wants: the explicit search path already asks Nominatim in parallel, and
    // adding the layer there would return the same OpenStreetMap places twice.
    sources: opts.sources,
  });
  return Array.isArray(body.results) ? body.results : [];
}

/** The index-only rows of a mixed result, for callers that need Overture fields. */
export function indexHitsOnly(hits: TrekSearchHit[]): TrekPlace[] {
  return hits.filter((h): h is TrekPlace => !isOsmHit(h));
}

/**
 * The planner's category pills, mapped onto Overture categories.
 *
 * Deliberately a hand-written map rather than a guess at runtime: the two
 * taxonomies do not line up, and a pill that quietly returns the wrong kind of
 * place is worse than one that returns none. Each entry is a substring matched
 * against `category` and `category_path`, so `eat_and_drink>cafe` answers the
 * cafe pill without listing every leaf.
 */
export const POI_CATEGORY_TO_TREK: Record<string, string[]> = {
  restaurant: ['restaurant', 'casual_eatery', 'fast_food'],
  cafe: ['cafe', 'coffee_shop'],
  bar: ['bar', 'pub', 'nightclub', 'brewery'],
  hotel: ['hotel', 'lodging', 'hostel', 'motel', 'bed_and_breakfast'],
  sights: ['historic_site', 'landmark_and_historical_building', 'monument', 'castle', 'tourist_attraction'],
  museum: ['museum', 'art_gallery', 'performing_arts', 'theater'],
  nature: ['park', 'garden', 'beach', 'nature_preserve', 'mountain'],
  activity: ['amusement_park', 'zoo', 'aquarium', 'water_park', 'theme_park'],
  shopping: ['shopping', 'shopping_center', 'department_store', 'market'],
  supermarket: ['grocery_store', 'food_and_beverage_store', 'convenience_store', 'supermarket'],
  // What a drive needs rather than what a city visit does (#1797). The corridor
  // search asks for these by name, and without them every corridor query fell
  // through to Overpass — the one path where that hurts most, because a single
  // search fans out over sixteen boxes.
  fuel: ['gas_station', 'fueling_station'],
  charging: ['ev_charging_station'],
  rest_area: ['rest_stop'],
  campsite: ['campground', 'rv_park'],
};

export interface TrekNearbyPlace extends TrekPlace {
  distanceMetres: number;
}

/**
 * Places around a coordinate, nearest first. Served from an R-Tree, so it
 * answers in milliseconds where the Overpass mirrors this used to ask are
 * regularly overloaded and answer in seconds or not at all.
 */
export async function trekPlacesNearby(
  lat: number,
  lng: number,
  opts: { radius?: number; limit?: number; category?: string } = {},
): Promise<TrekNearbyPlace[]> {
  const body = await getJson<{ results: TrekNearbyPlace[] }>('/v1/nearby', {
    lat,
    lng,
    radius: Math.round(opts.radius ?? 1500),
    limit: opts.limit ?? 50,
    category: opts.category,
  });
  return Array.isArray(body.results) ? body.results : [];
}

export interface TrekPlacesArea {
  count: number;
  truncated: boolean;
  results: TrekPlace[];
}

/**
 * Every place in a box, best first. What an instance takes once so the trip
 * keeps working with no network.
 *
 * The API caps the box at 1.5 degrees a side and the row count at 20000; both
 * are its call, not ours, and a `truncated` answer is passed through honestly
 * rather than smoothed over. A client that believed it had the whole area would
 * search offline and quietly miss places.
 */
export async function trekPlacesArea(
  bbox: { minLat: number; minLng: number; maxLat: number; maxLng: number },
  limit = 2000,
): Promise<TrekPlacesArea> {
  const body = await getJson<TrekPlacesArea>(
    '/v1/bbox',
    { ...bbox, limit },
    {
      maxBytes: Math.max(AREA_MIN_BYTES, limit * AREA_BYTES_PER_ROW),
      timeoutMs: AREA_TIMEOUT_MS,
    },
  );
  return {
    count: Number(body.count) || 0,
    truncated: !!body.truncated,
    results: Array.isArray(body.results) ? body.results : [],
  };
}

export async function trekPlacesById(gers: string): Promise<TrekPlace | null> {
  try {
    const body = await getJson<{ place: TrekPlace }>(`/v1/place/${encodeURIComponent(gers)}`, {});
    return body.place ?? null;
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

/**
 * Map a TREK place onto the record shape the client already reads.
 *
 * Deliberately the same shape Nominatim and Google produce, so nothing on the
 * client had to learn a third format. `osm_id` carries the GERS id prefixed
 * with `gers:`, because that field is where the client already looks for "the
 * provider's id for this place", and the prefix keeps it from being mistaken
 * for an OSM reference by code that parses it.
 */
export function toPlaceRecord(p: TrekPlace): Record<string, unknown> {
  const address = [p.address?.freeform, p.address?.postcode, p.address?.locality]
    .filter(Boolean)
    .join(', ');
  return {
    google_place_id: null,
    google_ftid: null,
    osm_id: `gers:${p.gers}`,
    name: p.name,
    address: address || p.address?.locality || '',
    lat: Number.isFinite(p.lat) ? p.lat : null,
    lng: Number.isFinite(p.lng) ? p.lng : null,
    // Ratings exist nowhere in open data, and saying so with null is honest.
    rating: null,
    website: p.contact?.website ?? null,
    phone: p.contact?.phone ?? null,
    email: p.contact?.email ?? null,
    category: p.category ?? null,
    brand: p.brand?.name ?? null,
    // The chain's Wikidata item, under the key that says so. It must NOT go
    // into `wikidata`: that field means "the article about this place", and the
    // enrichment ladder reads it as such — a branch would then be illustrated
    // with the chain's logo and described as the company, which is the failure
    // readBrandIdentity and WIKI_IDENTITY_TAGS exist to prevent.
    'brand:wikidata': p.brand?.wikidata ?? null,
    // Carried rather than dropped: the enrichment wants exactly this field a
    // moment later, and re-fetching the same place to get it made adding one
    // place cost two full round trips to the index. Left as the service shaped
    // it — the reader validates the URL before it becomes a link.
    description: p.description ?? null,
    source: 'trek-places',
  };
}
