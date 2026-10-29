/**
 * Client for the TREK Places API.
 *
 * The index behind it is Overture Places, built monthly and served from a
 * server the project runs. It replaces the two things TREK used to do badly:
 * searching through Nominatim, which its own usage policy forbids for
 * autocomplete, and paying Google for a text search whose terms then forbid
 * storing what comes back.
 *
 * Everything here is read-only and cacheable. There is no key to configure:
 * service-identity adds the installation's headers and reads each answer, and a
 * refused key falls back to the shared pool. The failure modes stay the network
 * and the service being down, both of which fall back to what TREK did before.
 */
import { readEnv, getAppUrl } from '../../app-config';
import { serviceIdentitySlot } from '../service-identity/service-identity.interface';
import { toApiLang } from './maps.helpers';
import {
  normalizePlaceWebsite,
  skiRouteBuildSchema,
  winterIndexRowSchema,
  winterMetaSchema,
  type WinterIndex,
  type WinterIndexRow,
  type WinterMeta,
} from '@trek/shared';

import { createHash } from 'node:crypto';
import { z } from 'zod';

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
 * The service's own limits on one /v1/nearby request: it refuses a `limit`
 * above the first and a `category` list longer than the second with a 422.
 * A refused request reads like a failure to the caller, so a request is cut to
 * fit them before it leaves (maps-index.helpers' indexRequests).
 */
export const INDEX_MAX_LIMIT = 100;
export const INDEX_MAX_CATEGORY_CHARS = 200;

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

interface Breaker {
  failures: number;
  openUntil: number;
}

/**
 * Place search (autocomplete, full search, the category pills, the offline
 * download, the lookup by id) shares one breaker. The OpenStreetMap layers
 * Tours reads have their own: the service answers a heavy layer query with a
 * 503 when it interrupts it, and a view of routes may run its full 20 s, so a
 * few busy layer answers would otherwise send every keystroke to the fallback
 * for a minute although the service is there. The other way round, a layer's
 * 404 for "not built yet" would clear the count of real search failures.
 */
const searchBreaker: Breaker = { failures: 0, openUntil: 0 };
const layersBreaker: Breaker = { failures: 0, openUntil: 0 };

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
  for (const breaker of [searchBreaker, layersBreaker]) {
    breaker.failures = 0;
    breaker.openUntil = 0;
  }
}

const SWITCHED_OFF_MESSAGE = 'TREK Places API is switched off on this instance';

/**
 * Why a call to one of the service's OpenStreetMap layers gave no answer, for
 * a caller that has another source to ask: the operator switched the index off
 * (`off`), the service answered 404 because it has not built the layer yet
 * (`not_built`), or anything else went wrong on the way (`failed`).
 */
export type TrekPlacesMiss = 'off' | 'not_built' | 'failed';

export function trekPlacesMiss(err: unknown): TrekPlacesMiss {
  if ((err as { status?: number } | null)?.status === 404) return 'not_built';
  if (err instanceof Error && err.message === SWITCHED_OFF_MESSAGE) return 'off';
  return 'failed';
}

export function trekPlacesBaseUrl(): string {
  const configured = (readEnv().maps.trekPlacesUrl || '').trim();
  return (configured || DEFAULT_TREK_PLACES_URL).replace(/\/+$/, '');
}

/**
 * TREK_PLACES_ENABLED=false is the operator's word that nothing leaves for
 * the index. Every caller checks it before asking, and this is the one place
 * every request passes, so a caller that did not is still stopped here. Ahead
 * of the breaker: a refusal says nothing about reachability.
 */
function assertEnabled(): void {
  if (!readEnv().maps.trekPlacesEnabled) {
    throw new Error(SWITCHED_OFF_MESSAGE);
  }
}

/**
 * Whether a breaker holds requests back right now, for a caller with a batch
 * to stop early. The winter downloads are layer reads, so they ask the layers'.
 */
export function trekPlacesHeldBack(breaker: Breaker = layersBreaker): boolean {
  return Date.now() < breaker.openUntil;
}

/** Refuses a request while its breaker holds them back. */
function assertBreakerClosed(breaker: Breaker): void {
  if (Date.now() < breaker.openUntil) {
    throw new Error('TREK Places API unreachable, not retrying yet');
  }
}

/** A failed request, counted against its breaker when it says something about reachability. */
function noteFailure(err: unknown, breaker: Breaker): void {
  if (countsAgainstReachability(err)) {
    breaker.failures += 1;
    if (breaker.failures >= BREAKER_FAILURES_BEFORE_OPEN) {
      breaker.openUntil = Date.now() + BREAKER_COOLDOWN_MS;
      // Back to the threshold rather than to zero: when the cooldown ends,
      // one more failure re-opens the breaker instead of buying another four
      // full timeouts.
      breaker.failures = BREAKER_FAILURES_BEFORE_OPEN - 1;
    }
  } else {
    // The service answered. A 404 is an answer.
    breaker.failures = 0;
  }
}

/** A request carrying who is asking: the instance token, and the installation key where it may go. */
async function identifiedFetch(url: URL, headers: Record<string, string>, signal: AbortSignal): Promise<Response> {
  const identity = serviceIdentitySlot.get();
  const res = await fetch(url, {
    signal,
    headers: { ...headers, 'X-TREK-Instance': instanceToken(), ...identity.headersFor(url) },
  });
  identity.observe(url, res);
  return res;
}

function statusError(status: number): Error & { status: number } {
  const err = new Error(`TREK Places API ${status}`) as Error & { status: number };
  err.status = status;
  return err;
}

async function getJson<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  opts: { maxBytes?: number; timeoutMs?: number; breaker?: Breaker } = {},
): Promise<T> {
  const breaker = opts.breaker ?? searchBreaker;
  assertEnabled();
  const url = new URL(trekPlacesBaseUrl() + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  assertBreakerClosed(breaker);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? TIMEOUT_MS);
  try {
    const res = await identifiedFetch(url, { Accept: 'application/json' }, controller.signal);
    if (!res.ok) throw statusError(res.status);
    // Read with a cap rather than res.json(): a hostile or broken upstream
    // should not be able to hand us an unbounded body to buffer.
    const text = await readCapped(res, opts.maxBytes ?? MAX_BYTES);
    const parsed = JSON.parse(text) as T;
    // An answer of any kind means the service is there.
    breaker.failures = 0;
    return parsed;
  } catch (err: unknown) {
    noteFailure(err, breaker);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The reader's language in the form the service takes, or nothing.
 *
 * Optional on every call that returns places: without it the service answers
 * exactly as it did before it knew languages. With it, localities come back in
 * the reader's language where OpenStreetMap has one, and the OSM layer's rows
 * are named in it too (#2592). TREK's own codes go through toApiLang first
 * (`br` is Brazilian Portuguese here and Breton there). Anything that is still
 * not a language tag is left off rather than sent: the service refuses it with
 * a 422, and a refused keystroke would drop to the fallback for nothing.
 * Regional Chinese (`zh-TW`) is passed as it is; the service maps it onto the
 * script OpenStreetMap keys by.
 */
const SERVICE_LANG = /^[A-Za-z]{2,3}([_-][A-Za-z0-9]{2,8}){0,2}$/;
export function serviceLang(lang: string | undefined): string | undefined {
  if (!lang?.trim()) return undefined;
  const tag = toApiLang(lang);
  return tag.length <= 20 && SERVICE_LANG.test(tag) ? tag : undefined;
}

async function readCapped(res: Response, max: number): Promise<string> {
  if (!res.body) return res.text();
  return (await readCappedBytes(res, max)).toString('utf8');
}

async function readCappedBytes(res: Response, max: number): Promise<Buffer> {
  const reader = res.body?.getReader();
  if (!reader) {
    const whole = Buffer.from(await res.arrayBuffer());
    if (whole.length > max) throw new Error('TREK Places API response too large');
    return whole;
  }
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
  return Buffer.concat(chunks);
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
 * quietly get nothing. What it does carry, when the search was made with a
 * language, is `locality`: the settlement the place is in, named in that
 * language. Without a language the field is absent, as it always was.
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
  locality?: string | null;
  distance_km?: number;
}

export type TrekSearchHit = TrekPlace | TrekOsmPlace;

export const isOsmHit = (hit: TrekSearchHit): hit is TrekOsmPlace => hit.source === 'openstreetmap';

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

/**
 * The layer's `locality` as a name or null. It is the one field of that row
 * TREK prints as it came, so a number, an object or a blank from a broken
 * upstream must not reach the suggestion line.
 */
function withLocality(hit: TrekSearchHit): TrekSearchHit {
  if (!isOsmHit(hit) || hit.locality === undefined) return hit;
  const locality = typeof hit.locality === 'string' ? hit.locality.trim() : '';
  return { ...hit, locality: locality || null };
}

export async function trekPlacesSearch(
  query: string,
  opts: { lat?: number; lng?: number; limit?: number; sources?: string; lang?: string } = {},
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
    lang: serviceLang(opts.lang),
  });
  return Array.isArray(body.results) ? body.results.map(withLocality) : [];
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
 * place is worse than one that returns none. Each entry is a category path, and
 * a place belongs to it when its own path is that path or lies under it, so
 * `food_and_drink>restaurant` answers the italian restaurant two levels down.
 *
 * Paths, not bare leaf names: the index matches a term anywhere inside
 * `category` and `category_path`, and a bare `park` brought car parks, `garden`
 * furniture stores and `bar` barbers (#2663). A full path does not occur inside
 * an unrelated one, and {@link indexRowTerm} drops whatever still slips through.
 * Overture renames a branch now and then; a path that stops existing answers
 * nothing, and the pill falls back to Overpass instead of answering wrong.
 */
export const POI_CATEGORY_TO_TREK: Record<string, string[]> = {
  restaurant: ['food_and_drink>restaurant', 'food_and_drink>casual_eatery'],
  cafe: ['food_and_drink>casual_eatery>cafe', 'food_and_drink>non_alcoholic_beverage_venue>coffee_shop'],
  bar: ['food_and_drink>alcoholic_beverage_venue', 'arts_and_entertainment>nightlife_venue'],
  hotel: ['lodging'],
  sights: ['cultural_and_historic>historic_site', 'cultural_and_historic>memorial_site>monument'],
  museum: [
    'arts_and_entertainment>museum',
    'arts_and_entertainment>arts_and_crafts_space>art_gallery',
    'arts_and_entertainment>performing_arts_venue',
    'arts_and_entertainment>movie_theater',
  ],
  nature: [
    'sports_and_recreation>park',
    'geographic_entities>built_feature>garden',
    'geographic_entities>land_feature>beach',
    'geographic_entities>land_feature>nature_reserve',
    'geographic_entities>land_feature>mountain',
  ],
  activity: [
    'arts_and_entertainment>amusement_attraction>amusement_park',
    'arts_and_entertainment>animal_attraction>zoo',
    'arts_and_entertainment>animal_attraction>aquarium',
    'sports_and_recreation>park>water_park',
  ],
  shopping: ['shopping'],
  supermarket: ['shopping>food_and_beverage_store', 'shopping>convenience_store'],
  // What a drive needs rather than what a city visit does (#1797). The corridor
  // search asks for these by name, and without them every corridor query fell
  // through to Overpass — the one path where that hurts most, because a single
  // search fans out over sixteen boxes.
  fuel: ['travel_and_transportation>fueling_station>gas_station'],
  charging: ['travel_and_transportation>fueling_station>ev_charging_station'],
  rest_area: ['travel_and_transportation>ground_transport_facility_or_service>road_structures_and_service>rest_stop'],
  campsite: ['lodging>campground', 'lodging>rv_park'],
  // What the search along a tour asks for (PLN-02, CW-05), each path checked
  // against a live answer of the index: museums and galleries alone, without
  // the theatres and cinemas of `museum`; parks and gardens alone, without the
  // beaches and mountains `nature` brings; the market square and its farmers'
  // and night markets; a summit.
  museum_gallery: ['arts_and_entertainment>museum', 'arts_and_entertainment>arts_and_crafts_space>art_gallery'],
  park: ['sports_and_recreation>park', 'geographic_entities>built_feature>garden'],
  market: ['shopping>market'],
  peak: ['geographic_entities>land_feature>mountain'],
};

/**
 * The term of {@link POI_CATEGORY_TO_TREK} a row belongs to, the most specific
 * one when several fit, or undefined when none does. A row is judged by its path
 * where it has one and by its leaf where the index left the path empty.
 */
export function indexRowTerm(terms: Iterable<string>, leaf: string | null, path: string | null): string | undefined {
  let best: string | undefined;
  for (const term of terms) {
    const fits = path
      ? path === term || path.startsWith(`${term}>`)
      : !!leaf && leaf === term.slice(term.lastIndexOf('>') + 1);
    if (fits && (best === undefined || term.length > best.length)) best = term;
  }
  return best;
}

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
  opts: { radius?: number; limit?: number; category?: string; lang?: string } = {},
): Promise<TrekNearbyPlace[]> {
  const body = await getJson<{ results: TrekNearbyPlace[] }>('/v1/nearby', {
    lat,
    lng,
    radius: Math.round(opts.radius ?? 1500),
    limit: opts.limit ?? 50,
    category: opts.category,
    lang: serviceLang(opts.lang),
  });
  return Array.isArray(body.results) ? body.results : [];
}

/**
 * The bounds of one /v1/highlights request, as the service takes them: a
 * request outside them is refused with a 422, so one is clamped to fit before
 * it leaves, and a coordinate that is no coordinate is not asked at all.
 */
const HIGHLIGHTS_MIN_RADIUS_M = 10;
const HIGHLIGHTS_MAX_RADIUS_M = 20_000;
const HIGHLIGHTS_DEFAULT_RADIUS_M = 1000;
const HIGHLIGHTS_MAX_LIMIT = 100;
const HIGHLIGHTS_DEFAULT_LIMIT = 30;

/**
 * One well known place of the service's OpenStreetMap layer: a row with a
 * Wikidata item that QRank ranks, `qrank` its page views. `name` is in the
 * language asked where the layer has it, else the local one.
 */
const trekHighlightSchema = z.object({
  osmType: z.enum(['node', 'way', 'relation']),
  osmId: z.number().int().positive(),
  name: z.string().trim().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  category: z.string().nullable(),
  osmTag: z.string(),
  wikidata: z.string().regex(/^Q\d+$/),
  qrank: z.number().int().nonnegative(),
  distanceMetres: z.number().nonnegative(),
});
export type TrekHighlight = z.infer<typeof trekHighlightSchema>;

export interface TrekHighlights {
  highlights: TrekHighlight[];
  /** The QRank release the ranks are from, or null when the service does not say. */
  qrankRelease: string | null;
}

/** A whole number within the bounds; anything that is no number takes the lower one. */
const clampedInt = (value: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : min;

/**
 * The service's answer as rows TREK can trust: a row of another shape is
 * dropped on its own rather than failing the others, since the layer is read
 * beside the rest of a search and a broken row should cost that row only.
 */
function readHighlights(body: unknown): TrekHighlights {
  const answer = z
    .object({ highlights: z.array(z.unknown()).catch([]), qrankRelease: z.string().nullable().catch(null) })
    .catch({ highlights: [], qrankRelease: null })
    .parse(body);
  const highlights = answer.highlights.flatMap((row) => {
    const parsed = trekHighlightSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
  return { highlights, qrankRelease: answer.qrankRelease };
}

/**
 * The best known places around a coordinate, by QRank and then nearest. An
 * older layer without ranks answers an empty list, never an error; a service
 * that is down throws like every other call here, and the caller goes on
 * without highlights.
 */
export async function trekPlacesHighlights(
  lat: number,
  lng: number,
  opts: { radius?: number; limit?: number; lang?: string } = {},
): Promise<TrekHighlights> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { highlights: [], qrankRelease: null };
  }
  try {
    const body = await getJson<unknown>('/v1/highlights', {
      lat,
      lng,
      radius: clampedInt(opts.radius ?? HIGHLIGHTS_DEFAULT_RADIUS_M, HIGHLIGHTS_MIN_RADIUS_M, HIGHLIGHTS_MAX_RADIUS_M),
      limit: clampedInt(opts.limit ?? HIGHLIGHTS_DEFAULT_LIMIT, 1, HIGHLIGHTS_MAX_LIMIT),
      lang: serviceLang(opts.lang),
    });
    return readHighlights(body);
  } catch (err) {
    // A service older than the endpoint knows no highlights, as an old layer knows no ranks.
    if ((err as { status?: number }).status === 404) return { highlights: [], qrankRelease: null };
    throw err;
  }
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
 *
 * No language here, on purpose: the offline package is stored once per trip and
 * read in whatever language the app is in later, and its contract carries none.
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

export async function trekPlacesById(gers: string, opts: { lang?: string } = {}): Promise<TrekPlace | null> {
  try {
    const body = await getJson<{ place: TrekPlace }>(`/v1/place/${encodeURIComponent(gers)}`, {
      lang: serviceLang(opts.lang),
    });
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
  const address = [p.address?.freeform, p.address?.postcode, p.address?.locality].filter(Boolean).join(', ');
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
    // The index keeps websites as Overture has them, often without a scheme.
    website: normalizePlaceWebsite(p.contact?.website),
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

/**
 * The service's two OpenStreetMap layers TREK reads elements from: the ways
 * layer (`/v1/ways`), the tags of the ways under a tour, and the routes layer
 * (`/v1/routes`), the route relations around a map view with their ways. Both
 * used to be questions to the public Overpass mirrors and are answered from
 * the planet the service builds every month, in Overpass' own element form, so
 * the readers TREK already had read them as they are. Both answer 404 while
 * their layer is not built; {@link trekPlacesMiss} tells that apart, and the
 * caller asks Overpass then.
 *
 * Neither is cached on the far side (`no-store`), and neither carries more than
 * the ids of ways or the edges of a box, the same that went to Overpass.
 */

/** The most way ids one /v1/ways request takes; the service refuses more with a 400. */
const WAYS_MAX_IDS = 500;
/** A batch of ways is a few lookups by key; not a keystroke, but somebody is looking at the tour. */
const WAYS_TIMEOUT_MS = 10_000;

/**
 * A routes answer carries the line of every way in the box: the service stops
 * at 250 000 points, some 40 bytes each with the node ids beside them, so a
 * full answer is near ten megabytes. Read once per map view and kept, so the
 * deadline is the area download's.
 */
const ROUTES_TIMEOUT_MS = 20_000;
const ROUTES_MAX_BYTES = 16 * 1024 * 1024;
/** The service's bounds on `limitRelations` and `limitWays`. */
const ROUTES_MAX_RELATIONS = 200;
const ROUTES_MAX_WAYS = 4000;
/** No way or relation of the planet has more members or points than this; a longer list is not one. */
const ROUTES_MAX_LIST = 20_000;

const osmIdSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const osmTagsSchema = z.record(z.string(), z.string());

const trekWayTagsSchema = z.object({
  type: z.literal('way'),
  id: osmIdSchema,
  tags: osmTagsSchema.default({}),
});
/** One way of the ways layer, as `way(id:...);out tags;` answers it: only the keys the layer keeps. */
type TrekWayTags = z.infer<typeof trekWayTagsSchema>;

const pointSchema = z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) });
const memberSchema = z.object({ type: z.enum(['node', 'way', 'relation']), ref: osmIdSchema, role: z.string() });

const trekRouteWayFields = z.object({
  type: z.literal('way'),
  id: osmIdSchema,
  tags: osmTagsSchema.default({}),
  nodes: z.array(osmIdSchema).max(ROUTES_MAX_LIST),
  geometry: z.array(pointSchema).max(ROUTES_MAX_LIST),
});
/** A line is read node by node beside its places; one that does not pair them is no line. */
const trekRouteWaySchema = trekRouteWayFields.refine((way) => way.nodes.length === way.geometry.length);
const trekRouteRelationSchema = z.object({
  type: z.literal('relation'),
  id: osmIdSchema,
  tags: osmTagsSchema.default({}),
  members: z.array(memberSchema).max(ROUTES_MAX_LIST),
});
const trekRouteElementSchema = z.union([trekRouteRelationSchema, trekRouteWaySchema]);
type TrekRouteElement = z.infer<typeof trekRouteElementSchema>;

export interface TrekPlacesRoutes {
  /** The relations with all their members, then their ways in the box, as Overpass answers `out body geom`. */
  elements: TrekRouteElement[];
  /** The service stopped at one of its caps: more relations, ways or points than one answer carries. */
  truncated: boolean;
}

/**
 * The route types TREK asks for. The service knows more (hiking, bicycle, mtb,
 * piste) and answers 404 for a type it has not built.
 */
export type TrekPlacesRouteType = 'horse';

/** The rows of an answer of the right shape that are themselves of the right shape. */
function validRows<T>(rows: readonly unknown[], schema: z.ZodType<T>): T[] {
  return rows.flatMap((row) => {
    const parsed = schema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
}

const elementsAnswerSchema = z.object({ elements: z.array(z.unknown()) });

/**
 * One request of at most WAYS_MAX_IDS ids. A way the layer does not know is
 * left out, as Overpass leaves it out; a row of another shape, or for an id
 * that was not asked, is left out on its own. An answer without `elements`
 * is no answer: read as an empty one, every way of the tour would be kept as
 * having no grade.
 */
async function trekPlacesWaysPart(ids: readonly number[]): Promise<TrekWayTags[]> {
  const body = await getJson<unknown>(
    '/v1/ways',
    { ids: ids.join(',') },
    { timeoutMs: WAYS_TIMEOUT_MS, breaker: layersBreaker },
  );
  const answer = elementsAnswerSchema.safeParse(body);
  if (!answer.success) throw new Error('TREK Places API answered /v1/ways without elements');
  const asked = new Set(ids);
  return validRows(answer.data.elements, trekWayTagsSchema).filter((way) => asked.has(way.id));
}

/**
 * What the ways layer answered for a tour: every batch (`complete`), or the
 * batches before the one that failed, with the ids that batch and the ones
 * after it held, and why it failed. The caller asks another source for those
 * ids only, never again for the ways already answered.
 */
export type TrekWaysAnswer =
  | { complete: true; ways: TrekWayTags[] }
  | { complete: false; ways: TrekWayTags[]; unanswered: number[]; failure: unknown };

/**
 * The tags of OpenStreetMap ways by id, from the ways layer. Asked in batches
 * of WAYS_MAX_IDS, one after another. When the first batch fails the call
 * throws, as the layer gave nothing. When a later one fails, nothing more is
 * asked (a service that just failed would mostly cost one more deadline per
 * batch) and the answer says which ids are still open.
 */
export async function trekPlacesWays(ids: readonly number[]): Promise<TrekWaysAnswer> {
  const wanted = [...new Set(ids)].filter((id) => osmIdSchema.safeParse(id).success);
  const starts = Array.from({ length: Math.ceil(wanted.length / WAYS_MAX_IDS) }, (_, index) => index * WAYS_MAX_IDS);
  return starts.reduce<Promise<TrekWaysAnswer>>(
    async (previous, start) => {
      const done = await previous;
      if (!done.complete) return done;
      try {
        const part = await trekPlacesWaysPart(wanted.slice(start, start + WAYS_MAX_IDS));
        return { complete: true, ways: [...done.ways, ...part] };
      } catch (failure: unknown) {
        if (start === 0) throw failure;
        return { complete: false, ways: done.ways, unanswered: wanted.slice(start), failure };
      }
    },
    Promise.resolve<TrekWaysAnswer>({ complete: true, ways: [] }),
  );
}

/**
 * The route relations of one type that reach into a box, with their members
 * and those of their ways that lie in it, from the routes layer. The box is
 * sent as it is: the service takes at most a degree a side and refuses more
 * with a 400, which the caller reads as a failure like any other.
 */
export async function trekPlacesRoutes(
  bbox: { south: number; west: number; north: number; east: number },
  type: TrekPlacesRouteType,
  limits: { relations: number; ways: number },
): Promise<TrekPlacesRoutes> {
  const body = await getJson<unknown>(
    '/v1/routes',
    {
      bbox: [bbox.south, bbox.west, bbox.north, bbox.east].join(','),
      type,
      limitRelations: clampedInt(limits.relations, 1, ROUTES_MAX_RELATIONS),
      limitWays: clampedInt(limits.ways, 1, ROUTES_MAX_WAYS),
    },
    { maxBytes: ROUTES_MAX_BYTES, timeoutMs: ROUTES_TIMEOUT_MS, breaker: layersBreaker },
  );
  const answer = elementsAnswerSchema.extend({ truncated: z.unknown().optional() }).safeParse(body);
  if (!answer.success) throw new Error('TREK Places API answered /v1/routes without elements');
  return {
    elements: validRows(answer.data.elements, trekRouteElementSchema),
    truncated: answer.data.truncated === true,
  };
}

// ── Winter layer ─────────────────────────────────────────────────────────────

/**
 * What the winter layer answers a conditional request: nothing new since the
 * tag the caller holds, or the body as sent with its tag. None of its three
 * endpoints takes a coordinate, so the service learns only which area a
 * planner loaded, never where anyone clicked.
 */
export type TrekPlacesWinterBody = { status: 'not_modified' } | { status: 'ok'; bytes: Buffer; etag: string | null };

const WINTER_META = { timeoutMs: 5_000, maxBytes: 64 * 1024 };
/**
 * The host caps the index it stores at 8 MB of gzip and sends it packed;
 * fetch unpacks it before it is read, so the cap here is on the unpacked
 * JSON, which is several times larger. 64 MB holds whatever the host's cap
 * lets through and still bounds a body that is not the index at all.
 */
const WINTER_INDEX = { timeoutMs: 15_000, maxBytes: 64 * 1024 * 1024 };
const WINTER_AREA = { timeoutMs: 30_000, maxBytes: 32 * 1024 * 1024 };
const WINTER_AREA_ID = /^[a-z]:[0-9]+(-[0-9a-z]+)?$/;

/** An ETag without its quotes and weak mark. */
function bareTag(value: string | null): string | null {
  let tag = value?.trim() ?? '';
  if (tag.startsWith('W/')) tag = tag.slice(2);
  if (tag.length >= 2 && tag.startsWith('"') && tag.endsWith('"')) tag = tag.slice(1, -1);
  return tag || null;
}

/** The head of the index; its rows are read one by one. */
const winterIndexHeadSchema = z.object({
  build: skiRouteBuildSchema,
  format: z.number().int(),
  areas: z.array(z.unknown()),
});

async function getWinter(
  path: string,
  accept: string,
  etag: string | null,
  limits: { timeoutMs: number; maxBytes: number },
): Promise<TrekPlacesWinterBody> {
  assertEnabled();
  const url = new URL(trekPlacesBaseUrl() + path);
  assertBreakerClosed(layersBreaker);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), limits.timeoutMs);
  try {
    const headers: Record<string, string> = { Accept: accept };
    if (etag) headers['If-None-Match'] = `"${etag}"`;
    const res = await identifiedFetch(url, headers, controller.signal);
    if (res.status === 304 && etag) {
      layersBreaker.failures = 0;
      return { status: 'not_modified' };
    }
    if (!res.ok) throw statusError(res.status);
    const bytes = await readCappedBytes(res, limits.maxBytes);
    layersBreaker.failures = 0;
    return { status: 'ok', bytes, etag: bareTag(res.headers.get('etag')) };
  } catch (err: unknown) {
    noteFailure(err, layersBreaker);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Which build the winter layer serves, and the SHA-256 that tells a new index from the one kept. */
export async function trekPlacesWinterMeta(): Promise<WinterMeta> {
  const answer = await getWinter('/v1/winter/meta', 'application/json', null, WINTER_META);
  if (answer.status !== 'ok') throw new Error('TREK Places winter meta came back empty');
  return winterMetaSchema.parse(JSON.parse(answer.bytes.toString('utf8')));
}

export type TrekPlacesWinterIndex =
  { status: 'not_modified' } | { status: 'ok'; index: WinterIndex; sha256: string; dropped: number };

/**
 * Every ski area with its box, size and checksum, unless the index the caller
 * holds (`etag`, its SHA-256) is still the current one. The checksum returned
 * is that of the JSON as read, for the caller to hold against the meta's
 * `indexSha`. A row that does not read as an area is dropped on its own and
 * counted; the head of the index must read, or nothing does.
 */
export async function trekPlacesWinterIndex(etag: string | null): Promise<TrekPlacesWinterIndex> {
  const answer = await getWinter('/v1/winter/index', 'application/json', etag, WINTER_INDEX);
  if (answer.status !== 'ok') return answer;
  const head = winterIndexHeadSchema.parse(JSON.parse(answer.bytes.toString('utf8')));
  const areas: WinterIndexRow[] = [];
  for (const row of head.areas) {
    const parsed = winterIndexRowSchema.safeParse(row);
    if (parsed.success) areas.push(parsed.data);
  }
  return {
    status: 'ok',
    index: { build: head.build, format: head.format, areas },
    sha256: createHash('sha256').update(answer.bytes).digest('hex'),
    dropped: head.areas.length - areas.length,
  };
}

/**
 * One area's graph, gzip-packed SGR1 exactly as the service stores it, unless
 * the copy the caller holds (`etag`, its SHA-256) is still current. The caller
 * checks the bytes against the index's checksum before keeping them.
 */
export async function trekPlacesWinterArea(id: string, etag: string | null): Promise<TrekPlacesWinterBody> {
  if (!WINTER_AREA_ID.test(id) || id.length > 64) throw new Error(`Not a ski area id: ${id}`);
  return getWinter(`/v1/winter/area/${encodeURIComponent(id)}`, 'application/vnd.trek.sgraph', etag, WINTER_AREA);
}
