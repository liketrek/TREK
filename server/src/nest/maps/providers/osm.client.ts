/**
 * OpenStreetMap: Nominatim for names and coordinates, Overpass for tags and
 * points of interest.
 *
 * The keyless floor every install falls back to, and deliberately NOT a
 * PlacesProvider (see places-provider.ts): it has no credential, and its
 * details path is a Nominatim/Overpass merge rather than one lookup. MapsService
 * decides when OpenStreetMap is asked; this client only knows how to ask it,
 * through the shared Nominatim client (one throttle for the whole process) and
 * the Overpass mirrors the operator configured.
 *
 * The POI cache and the mirror list are module state on purpose, frozen at load
 * the way they were in the service ("frozen on purpose", see
 * src/app-config/README.md), so every instance shares one cache. The pause the
 * search along a line takes after every Overpass endpoint failed it is the
 * instance's own: MapsModule provides one client per process.
 *
 * Never imports MapsService: providers sit below the orchestrator
 * (lint:boundaries holds that).
 */
import { logWarn } from '../../audit/audit-log.logger';
import { nominatimFetch, type GeoLane } from '../../geo/nominatim.client';
import { OVERPASS_ALONG_QUERY_TIMEOUT_S, aroundPath, overpassAlongQuery } from '../maps-along.helpers';
import { nearbyOverpassQuery, overpassNearbyRecords } from '../maps-nearby.helpers';
import {
  UA,
  toApiLang,
  CATEGORY_OSM_FILTERS,
  parsePoiCategories,
  clampPoiBbox,
  resolveOverpassEndpoints,
  resolveOverpassTimeoutMs,
  OVERPASS_QUERY_TIMEOUT_S,
  haversineMetres,
  namesOverlap,
  readChargingInfo,
  readBikeChargingInfo,
  buildOsmDetails,
  OSM_PLACE_ID,
  type OverpassPoi,
} from '../maps.helpers';
import { overpassSelector, tagsMatchFilter } from '../osm-filter.helpers';
import { OverpassBusy, hedged, lastAnsweredFirst, retryAfterMs, soonestRetryMs } from '../overpass-hedge.helpers';
import { readWikiIdentity } from './wiki-identity';
import { Injectable } from '@nestjs/common';
import { normalizePlaceWebsite } from '@trek/shared';
import type { LatLng } from '@trek/shared/roadtrip';

function nominatimCategory(item: { class?: string; type?: string }): string | null {
  if (!item.class || !item.type || item.type === 'yes') return null;
  return item.class === 'shop' ? `shop_${item.type}` : item.type;
}

interface NominatimResult {
  osm_type: string;
  osm_id: string;
  /** The main OSM tag, key and value: `class` "tourism" with `type` "hotel". */
  class?: string;
  type?: string;
  name?: string;
  display_name?: string;
  lat: string;
  lon: string;
  extratags?: Record<string, string> | null;
}

export interface OverpassElement {
  tags?: Record<string, string>;
}

interface OverpassPoiElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface PoiSearchResult {
  pois: OverpassPoi[];
  /**
   * Which index answered. Not decoration: this branch calls naming the sources
   * a licence obligation rather than a courtesy, and Overture carries more than
   * OpenStreetMap under more than one licence, so stamping its rows as OSM is a
   * wrong attribution rather than a rounding of one.
   */
  source: 'openstreetmap' | 'trek-places';
  truncated: boolean;
  // True when the requested viewport was too large and got shrunk to a centred
  // window before querying — the results then cover the middle of the view only.
  clamped: boolean;
}

/** A Nominatim reverse answer as it came, for the callers that pick their own fields. */
export interface NominatimReverse {
  display_name?: string;
  name?: string;
  address?: Record<string, string>;
}

// Tighter than the wiki calls, because this one sits at the FRONT of a chain:
// identity, then sitelinks, then the extract. Nominatim answers a bounded
// search in 0.2-0.7s in practice, so anything past a couple of seconds is a bad
// day at the provider rather than a slow answer worth waiting for.
const IDENTITY_TIMEOUT_MS = 2500;

// The explicit search asks Nominatim alongside the index, and the pair costs
// the slower one. The index gives up after 3.5 s and the browser after 8 s, so a
// Nominatim that accepts the connection and then sits on it (the public service
// under load, a self-hosted one that hung) has to give up in between: without a
// deadline of its own the request rides undici's 300 s default, and the index's
// answer is thrown away with the request that timed out waiting for it. The
// deadline starts after the throttle wait, so it measures the answer alone:
// generous for a slow one, still inside the browser's budget with the wait
// added on.
const SEARCH_TIMEOUT_MS = 6000;

// Frozen at module load, same timing as the legacy service ("frozen on purpose",
// see src/app-config/README.md).
const OVERPASS_MIRRORS = resolveOverpassEndpoints();
const OVERPASS_TIMEOUT_MS = resolveOverpassTimeoutMs();
// Short-lived cache so panning back over / re-toggling the same area doesn't
// re-hit Overpass. Keyed by category + rounded (post-clamp) bbox.
const POI_CACHE = new Map<string, { at: number; value: PoiSearchResult }>();
const POI_CACHE_TTL_MS = 5 * 60 * 1000;
// Cap the number of cached areas so panning across the globe can't grow the map
// without bound (entries are evicted oldest-first once the cap is reached).
const POI_CACHE_MAX = 500;
/**
 * Hard ceiling on one POI answer, however many categories it carries. A corridor search
 * asks for four kinds at once; without a ceiling a dense city box would return a payload
 * nobody reads and every mirror pays for.
 */
export const POI_RESULT_CAP = 240;

/** The mirror that answered last, asked first by a hedged query. */
let lastAnsweredMirror: string | null = null;

// POST the query to the mirrors and return the first one that answers with
// valid JSON. Throws {status:502} only if every mirror fails, with the shortest
// wait a busy mirror asked for as `retryAfterMs` when one named it. Without
// `hedgeMs` every mirror is asked at once, so latency is the fastest reachable
// mirror's; with it they are asked one after another (overpass-hedge.helpers),
// so a quick answer costs one mirror's slot instead of every mirror's.
async function overpassFetch(
  query: string,
  timeoutMs = OVERPASS_TIMEOUT_MS,
  hedgeMs = 0,
): Promise<OverpassPoiElement[]> {
  const body = `data=${encodeURIComponent(query)}`;
  const controllers: AbortController[] = [];

  const attempt = async (url: string): Promise<OverpassPoiElement[]> => {
    const ctrl = new AbortController();
    controllers.push(ctrl);
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: ctrl.signal,
      });
      // A mirror out of slots for this IP: busy, not down, and it may say for how long.
      if (res.status === 429) throw new OverpassBusy(url, retryAfterMs(res.headers.get('retry-after')));
      if (!res.ok) throw new Error(`Overpass ${res.status} @ ${url}`);
      const data = (await res.json()) as { elements?: OverpassPoiElement[]; remark?: string };
      // Overpass signals an internal timeout / runtime error via `remark` while
      // still answering HTTP 200 — often fast, with an empty or partial element
      // set. Treat that as a failed attempt so a healthy mirror wins the race
      // instead of this fast-but-empty answer, and so the all-mirrors-failed path
      // still surfaces a real error to the client instead of a silent "no places".
      if (data.remark) throw new Error(`Overpass remark @ ${url}: ${data.remark}`);
      if (!Array.isArray(data.elements)) throw new Error(`Overpass non-OSM body @ ${url}`);
      lastAnsweredMirror = url;
      return data.elements;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    // Either way the first mirror to return valid JSON wins, and only once every
    // mirror has failed does it reject (AggregateError).
    return await (hedgeMs > 0
      ? hedged(lastAnsweredFirst(OVERPASS_MIRRORS, lastAnsweredMirror), attempt, hedgeMs)
      : Promise.any(OVERPASS_MIRRORS.map(attempt)));
  } catch (err) {
    // Log WHY every endpoint failed (connection refused, aborted/timed out, non-OSM
    // body, …) so an operator can tell blocked egress / a firewall from a transiently
    // overloaded mirror — otherwise this is a bare 502 with no breadcrumb (see #1309).
    const errors: unknown[] = err instanceof AggregateError ? err.errors : [err];
    const reasons = errors.map((e) => (e instanceof Error ? e.message : String(e))).join(' | ');
    console.error(`[Overpass] all ${OVERPASS_MIRRORS.length} endpoint(s) failed — ${reasons}`);
    const wait = soonestRetryMs(errors);
    throw Object.assign(new Error('Could not reach any Overpass endpoint'), {
      status: 502,
      ...(wait !== null ? { retryAfterMs: wait } : {}),
    });
  } finally {
    // Cancel the slower/losing requests — we already have (or have given up on) a result.
    controllers.forEach((c) => {
      try {
        c.abort();
      } catch {
        /* noop */
      }
    });
  }
}

/** The kinds of a POI request and the OSM selectors that answer each, every selector labelled with its kind. */
interface PoiFilters {
  categories: string[];
  filters: string[];
  categoryOfFilter: Map<string, string>;
}

/** One or several categories as Overpass selectors; an unknown one refuses the whole request. */
function poiFilters(category: string): PoiFilters {
  // Each OSM selector belongs to exactly one category, so a hit can still be
  // labelled with the category it answered.
  const categories = parsePoiCategories(category);
  if (!categories.length) throw Object.assign(new Error('Unknown POI category'), { status: 400 });
  const categoryOfFilter = new Map<string, string>();
  for (const key of categories) {
    const own = CATEGORY_OSM_FILTERS[key];
    if (!own) throw Object.assign(new Error('Unknown POI category'), { status: 400 });
    for (const f of own) categoryOfFilter.set(f, key);
  }
  return { categories, filters: [...categoryOfFilter.keys()], categoryOfFilter };
}

/** Keeps an answer in the POI cache, dropping the oldest entry once the cache is full. */
function cachePoiAnswer(cacheKey: string, value: PoiSearchResult): void {
  // FIFO eviction: a Map preserves insertion order, so the first key is the oldest.
  if (POI_CACHE.size >= POI_CACHE_MAX) POI_CACHE.delete(POI_CACHE.keys().next().value as string);
  POI_CACHE.set(cacheKey, { at: Date.now(), value });
}

/** A fresh cached answer, or undefined; an expired one is dropped on the way. */
function cachedPoiAnswer(cacheKey: string): PoiSearchResult | undefined {
  const cached = POI_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.at < POI_CACHE_TTL_MS) return cached.value;
  if (cached) POI_CACHE.delete(cacheKey); // expired: drop it before refetching
  return undefined;
}

/**
 * The kinds whose places OSM rarely names, kept unnamed by the search along a
 * tour: a tap, a hut, a bench with a view. An unnamed garden or memorial
 * plaque is no place to suggest, so every other kind still needs a name.
 */
const KEPT_UNNAMED_ALONG: ReadonlySet<string> = new Set([
  'drinking_water',
  'toilets',
  'shelter',
  'picnic',
  'viewpoint',
  'peak',
  'slipway',
  'bike_repair',
  // A charging point is often mapped with neither a name nor an operator.
  'ebike_charging',
]);

/**
 * The kinds the map search keeps unnamed. It wants names everywhere else, but most
 * e-bike charging points carry neither a name nor an operator, and dropping them
 * would answer `search_pois` with a fraction of what the tour search finds.
 */
const KEPT_UNNAMED_EXPLORE: ReadonlySet<string> = new Set(['ebike_charging']);

/**
 * What a charging station states, read only where it means something. Every POI
 * carries `capacity` and `fee` for its own reasons (a restaurant's capacity is
 * seats), so reading them as charging data anywhere else would be wrong on most
 * of the map.
 */
function chargingOf(category: string, tags: Record<string, string>): OverpassPoi['charging'] {
  if (category === 'charging') return readChargingInfo(tags);
  if (category === 'ebike_charging') return readBikeChargingInfo(tags);
  return null;
}

/**
 * Overpass elements as POI rows, each labelled with the category its selector
 * belongs to. An unnamed element is dropped unless its category is one of
 * `keptUnnamed`; a shut-down place never comes back.
 */
function readPois(
  elements: OverpassPoiElement[],
  match: PoiFilters,
  osmLang: string,
  keptUnnamed: ReadonlySet<string>,
): OverpassPoi[] {
  const { filters, categoryOfFilter, categories } = match;
  const pois: OverpassPoi[] = [];
  for (const el of elements) {
    const tags = el.tags || {};
    const matched = filters.find((f) => tagsMatchFilter(tags, f)) || filters[0];
    const category = categoryOfFilter.get(matched) ?? categories[0];
    // `operator` comes last but matters for the road categories: petrol stations,
    // charging points and service areas are routinely mapped with an operator and no
    // name, and dropping those would empty the road trip corridor over long stretches.
    const name = tags[`name:${osmLang}`] || tags['int_name'] || tags.name || tags.brand || tags.operator || null;
    if (!name && !keptUnnamed.has(category)) continue; // unnamed POIs aren't useful to add to a plan
    // A shut-down place is not somewhere to plan a visit (#1341). OSM usually
    // re-tags one with a `disused:`/`abandoned:` prefix, and those never match
    // the selectors above, but plenty keep their original tag and gain a marker
    // instead, and those do come back. `opening_hours=closed`/`off` is the same
    // statement in the hours field.
    if (tags.disused === 'yes' || tags.abandoned === 'yes') continue;
    if (tags.opening_hours === 'closed' || tags.opening_hours === 'off') continue;
    const charging = chargingOf(category, tags);
    // A charger that does not say bicycles may charge is never passed off as an e-bike one.
    if (category === 'ebike_charging' && !charging) continue;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;
    const addr =
      [tags['addr:street'], tags['addr:housenumber'], tags['addr:postcode'], tags['addr:city']]
        .filter(Boolean)
        .join(' ') || null;
    pois.push({
      osm_id: `${el.type}:${el.id}`,
      name: name ?? '',
      lat,
      lng,
      category,
      poi_type: matched,
      address: addr,
      website: normalizePlaceWebsite(tags.website) ?? normalizePlaceWebsite(tags['contact:website']),
      phone: tags.phone || tags['contact:phone'] || null,
      opening_hours: tags.opening_hours || null,
      cuisine: tags.cuisine || null,
      brand: tags.brand || tags.operator || null,
      // Only the plain Q-id form is passed on; anything else would be a lookup we
      // would have to guess at.
      brand_wikidata: /^Q[0-9]+$/.test(tags['brand:wikidata'] || '') ? tags['brand:wikidata'] : null,
      charging,
      source: 'openstreetmap',
    });
  }
  return pois;
}

/**
 * How long the search along a line waits for Overpass: the query's own
 * deadline and two seconds to hand the answer back. It sits inside one request
 * a person is waiting on, beside the index, so it gives up well before the
 * explore pill's budget, and OVERPASS_TIMEOUT_MS does not apply to it.
 */
const OVERPASS_ALONG_TIMEOUT_MS = (OVERPASS_ALONG_QUERY_TIMEOUT_S + 2) * 1000;

/**
 * How long the search along a line holds back once every endpoint failed it.
 * While the public mirrors do not answer, each search would wait out the
 * whole deadline only to name the same kinds unavailable; after the pause the
 * next search asks again for real. Inside it one probe goes through every
 * OVERPASS_ALONG_PROBE_MS, so a mirror back early is found by the next retry.
 */
export const OVERPASS_ALONG_COOLDOWN_MS = 3 * 60 * 1000;

/**
 * How often a search along a line may probe Overpass during the cooldown; a
 * busy mirror's Retry-After stretches it, never beyond the cooldown. The
 * searches beside the probe wait for its answer and ask after it if it ended
 * the cooldown; outside a probe they are refused at once.
 */
export const OVERPASS_ALONG_PROBE_MS = 20 * 1000;

/**
 * How long a search along a line waits for one mirror before it asks the next
 * one as well: most answers take well under this, so a healthy mirror costs
 * one slot instead of all four.
 */
export const OVERPASS_ALONG_HEDGE_MS = 1500;

/**
 * A stretch of a search along a line refused during the cooldown: nothing was
 * asked, and the cooldown is logged once rather than with every search.
 */
export class OverpassCoolingDown extends Error {
  constructor() {
    super('Overpass unreachable, not retrying yet');
    this.name = 'OverpassCoolingDown';
  }
}

@Injectable()
export class OsmClient {
  /** Until when the search along a line holds back after every endpoint failed it; 0 while it asks. */
  private overpassAlongCooldownUntil = 0;
  /** When the next probe of the cooldown may go out. */
  private overpassAlongProbeAt = 0;
  /** The probe in flight, which the stretches beside it wait for. */
  private overpassAlongProbe: Promise<unknown> | null = null;
  /** When an along query was last answered, so a failure that settles after an answer starts no cooldown. */
  private overpassAlongAnsweredAt = 0;
  /** Whether this cooldown's first skip was logged, so the log holds one line per cooldown. */
  private overpassAlongSkipLogged = false;

  // ── Nominatim search ───────────────────────────────────────────────────────

  /**
   * `lane` defaults to interactive because most callers are a keystroke.
   *
   * Bulk callers must pass 'background': booking-import geocodes every venue and
   * every uncoordinated endpoint of an import in one request loop, which is up
   * to thirty sequential calls. On the interactive lane those thirty take the
   * next slot each time, so somebody typing in the place search waits behind the
   * whole import. Yielding does not make the import faster, it stops it from
   * being the only thing the process will do for half a minute.
   */
  async searchNominatim(
    query: string,
    lang?: string,
    lane: GeoLane = 'interactive',
    bias?: { lat: number; lng: number },
  ) {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      // Free, same request: this is where a place's wikidata/wikipedia/commons
      // tags live. Without them the enrichment column can only fall back to
      // "photos taken within 300m", which around a city centre is passers-by
      // and the neighbouring building.
      extratags: '1',
      limit: '10',
      'accept-language': toApiLang(lang),
    });
    // Prefer the area the caller is looking at, never restrict to it
    // (bounded=0). Without this, "Hase-dera" returns the temple of that name in
    // Nara rather than the one in Kamakura the user is standing next to; with
    // bounded=1 a search for somewhere genuinely far away would return nothing.
    if (bias) {
      const d = 0.5;
      params.set('viewbox', [bias.lng - d, bias.lat - d, bias.lng + d, bias.lat + d].join(','));
      params.set('bounded', '0');
    }
    // Through the shared client: one throttle for the whole process.
    const response = await nominatimFetch('search', params, { lane, timeoutMs: SEARCH_TIMEOUT_MS });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `Nominatim API error: ${response.status} ${response.statusText}${text ? ' - ' + text.substring(0, 200) : ''}`,
      );
    }
    const data = (await response.json()) as NominatimResult[];
    return data.map((item) => {
      // Number.isFinite, not `|| null`: a place on the equator or prime
      // meridian has a legitimate 0 coordinate.
      const lat = Number.parseFloat(item.lat);
      const lng = Number.parseFloat(item.lon);
      return {
        google_place_id: null,
        google_ftid: null,
        osm_id: `${item.osm_type}:${item.osm_id}`,
        name: item.name || item.display_name?.split(',')[0] || '',
        address: item.display_name || '',
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        rating: null,
        website: null,
        phone: null,
        // What the place is, so the add form can preselect a category (#2282). A shop's
        // value is the ware ("bakery"), so the key goes first and says it is a shop.
        category: nominatimCategory(item),
        source: 'openstreetmap',
        ...readWikiIdentity(item.extratags),
      };
    });
  }

  /** Suggestions out of a Nominatim search, for an install with neither the index nor a key. */
  async autocompleteNominatim(
    input: string,
    lang?: string,
    bias?: { lat: number; lng: number },
  ): Promise<{ suggestions: { placeId: string; mainText: string; secondaryText: string }[]; source: 'nominatim' }> {
    try {
      const places = await this.searchNominatim(input, lang, 'interactive', bias);
      const suggestions = places
        .filter((p) => p.osm_id && p.osm_id.includes(':') && p.osm_id.split(':')[1] !== '')
        .slice(0, 5)
        .map((p) => {
          const parts = (p.address || '').split(',').map((s) => s.trim());
          return {
            placeId: p.osm_id,
            mainText: p.name || parts[0] || '',
            secondaryText: parts.slice(1).join(', '),
          };
        });
      return { suggestions, source: 'nominatim' };
    } catch (err) {
      console.error('Nominatim autocomplete failed:', err);
      return { suggestions: [], source: 'nominatim' };
    }
  }

  /**
   * Finds the OpenStreetMap record for a place we only know by name and
   * coordinate, and hands back its tags.
   *
   * This is what gives a Google place a free identity. Google's payload has no
   * `wikidata`, no `wikipedia` and no `wikimedia_commons` — it never had — so
   * without this the entire free half of the enrichment column is unreachable
   * for anyone who configured a Google key, which is the opposite of how this
   * feature is meant to work. OSM knows these places perfectly well; nobody was
   * asking it.
   *
   * Two gates keep it from describing the wrong building, because a confident
   * description of somewhere else is worse than none:
   *   - the match has to be within `maxDistanceM` of where we are looking, and
   *   - it has to share a substantial word with the name we are looking for.
   * Among what survives, Nominatim's own `importance` decides — that is what
   * separates the Brandenburg Gate from the underground station named after it.
   */
  async resolveOsmIdentity(
    name: string,
    lat: number,
    lng: number,
    opts: { lang?: string; maxDistanceM?: number; signal?: AbortSignal } = {},
  ): Promise<{ tags: Record<string, string>; osmUrl: string | null; matchedName: string } | null> {
    const query = (name || '').trim();
    if (!query || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const maxDistanceM = opts.maxDistanceM ?? 2000;

    // ~2km box around the point, so Nominatim ranks locally instead of handing
    // back the most famous place on earth with this name.
    const d = 0.02;
    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      extratags: '1',
      limit: '5',
      bounded: '1',
      viewbox: `${lng - d},${lat - d},${lng + d},${lat + d}`,
      'accept-language': toApiLang(opts.lang),
    });

    try {
      // The caller's deadline is handed in rather than built here, so the
      // throttle wait cannot eat it before the request starts.
      const res = await nominatimFetch('search', params, {
        signal: opts.signal,
        timeoutMs: IDENTITY_TIMEOUT_MS,
      });
      if (!res.ok) return null;
      // Nominatim answers rate limiting in plain text, not JSON.
      const data = (await res.json()) as (NominatimResult & { importance?: number })[];
      if (!Array.isArray(data)) return null;

      const best = data
        .map((item) => ({
          item,
          lat: Number.parseFloat(item.lat),
          lng: Number.parseFloat(item.lon),
        }))
        .filter(({ item, lat: hitLat, lng: hitLng }) => {
          if (!Number.isFinite(hitLat) || !Number.isFinite(hitLng)) return false;
          if (haversineMetres(lat, lng, hitLat, hitLng) > maxDistanceM) return false;
          const label = item.name || item.display_name?.split(',')[0] || '';
          return namesOverlap(query, label);
        })
        .sort((a, b) => {
          const byImportance = (b.item.importance ?? 0) - (a.item.importance ?? 0);
          if (byImportance !== 0) return byImportance;
          return haversineMetres(lat, lng, a.lat, a.lng) - haversineMetres(lat, lng, b.lat, b.lng);
        })[0];

      if (!best) return null;
      return {
        tags: best.item.extratags ?? {},
        osmUrl:
          best.item.osm_type && best.item.osm_id
            ? `https://www.openstreetmap.org/${best.item.osm_type}/${best.item.osm_id}`
            : null,
        matchedName: best.item.name || best.item.display_name?.split(',')[0] || query,
      };
    } catch {
      return null;
    }
  }

  // ── Nominatim lookup (by OSM ID) ───────────────────────────────────────────

  async lookupNominatim(
    osmType: string,
    osmId: string,
    lang?: string,
  ): Promise<{
    name: string;
    address: string;
    lat: number | null;
    lng: number | null;
    extratags: Record<string, string> | null;
  } | null> {
    const typePrefix = osmType.charAt(0).toUpperCase(); // N, W, R
    const params = new URLSearchParams({
      osm_ids: `${typePrefix}${osmId}`,
      format: 'json',
      // Overpass is the richer source but it is also the one that times out;
      // whatever Nominatim already knows costs nothing extra here.
      extratags: '1',
      'accept-language': toApiLang(lang),
    });
    try {
      const res = await nominatimFetch('lookup', params);
      if (!res.ok) return null;
      const data = (await res.json()) as NominatimResult[];
      const item = data[0];
      if (!item) return null;
      const lat = Number.parseFloat(item.lat);
      const lng = Number.parseFloat(item.lon);
      return {
        name: item.name || item.display_name?.split(',')[0] || '',
        address: item.display_name || '',
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        extratags: item.extratags ?? null,
      };
    } catch {
      return null;
    }
  }

  // ── Nominatim reverse ──────────────────────────────────────────────────────

  /** The name and address Nominatim gives a point, or nulls when it answers with an error. */
  async reverse(
    lat: string,
    lng: string,
    lang?: string,
    opts?: { lane?: GeoLane; timeoutMs?: number; locality?: boolean },
  ): Promise<{ name: string | null; address: string | null }> {
    const params = new URLSearchParams({
      lat,
      lon: lng,
      format: 'json',
      addressdetails: '1',
      zoom: opts?.locality ? '10' : '18',
      'accept-language': toApiLang(lang),
    });
    const response = await nominatimFetch('reverse', params, opts);
    if (!response.ok) return { name: null, address: null };
    const data = (await response.json()) as NominatimReverse;
    const addr = data.address || {};
    const name = opts?.locality
      ? addr.city || addr.town || addr.village || addr.municipality || data.name || null
      : data.name || addr.tourism || addr.amenity || addr.shop || addr.building || addr.road || null;
    return { name, address: data.display_name || null };
  }

  /**
   * The raw reverse answer for a point a pasted link carried, in Nominatim's
   * default language. A non-ok answer (5xx, 429) is an empty object: the
   * coordinates are already known, so the caller still has something to return.
   */
  async reverseRaw(lat: number, lng: number): Promise<NominatimReverse> {
    const res = await nominatimFetch(
      'reverse',
      new URLSearchParams({ lat: String(lat), lon: String(lng), format: 'json', addressdetails: '1' }),
      { timeoutMs: 8000 },
    );
    return res.ok ? ((await res.json()) as NominatimReverse) : {};
  }

  /**
   * The details record of an OpenStreetMap element id (`node:123`, `way:4`,
   * `relation:5`), or null for anything else with a colon in it.
   */
  async elementDetails(placeId: string, lang?: string): Promise<Record<string, unknown> | null> {
    // Only an element type with a numeric id is looked up. The id is written
    // into an Overpass query and a Nominatim lookup as it came in, and nothing
    // else with a colon in it (a legacy image URL, a coordinate pseudo-id) has
    // a details source: answering those with an empty record cost two
    // requests that could not succeed, and let anything after the colon be
    // sent as a query of its own.
    if (!OSM_PLACE_ID.test(placeId)) return null;
    const [osmType, osmId] = placeId.split(':');
    // buildOsmDetails never yields name/address/coordinates — Nominatim is
    // always the source for those (Overpass contributes the tag-derived rest).
    const [element, nominatim] = await Promise.all([
      this.fetchOverpassDetails(osmType, osmId),
      this.lookupNominatim(osmType, osmId, lang),
    ]);
    // Overpass has the fuller tag set and wins where both answer, but it is
    // also the one that goes down — overpass-api.de is regularly overloaded.
    // Nominatim's extratags carry the wikidata/wikipedia/commons tags too, so
    // a place keeps its pictures and its description when Overpass times out
    // instead of falling back to "photographed within 300m".
    const details = buildOsmDetails({ ...(nominatim?.extratags ?? {}), ...(element?.tags ?? {}) }, osmType, osmId);

    return {
      ...details,
      name: nominatim?.name || element?.tags?.name || '',
      address: nominatim?.address || '',
      lat: nominatim?.lat ?? null,
      lng: nominatim?.lng ?? null,
      osm_id: placeId,
    };
  }

  // ── Overpass API (OSM details) ─────────────────────────────────────────────

  async fetchOverpassDetails(osmType: string, osmId: string): Promise<OverpassElement | null> {
    const typeMap: Record<string, string> = { node: 'node', way: 'way', relation: 'rel' };
    const oType = typeMap[osmType];
    if (!oType) return null;
    // The id is the one thing written into the query, and the query is a
    // language. An OSM element id is a number and nothing else; anything with
    // more in it is a statement of its own, sent under TREK's shared user agent.
    if (!/^\d+$/.test(osmId)) return null;
    const query = `[out:json][timeout:5];${oType}(${osmId});out tags;`;
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        // The query asks Overpass for 5 s; a public instance that is overloaded
        // takes the connection and then sits on it.
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { elements?: OverpassElement[] };
      return data.elements?.[0] || null;
    } catch {
      return null;
    }
  }

  /** Places of any kind around a point, from the Overpass mirrors, nearest first (#976). */
  async nearby(
    origin: { lat: number; lng: number },
    radius: number,
    limit: number,
    osmLang: string,
  ): Promise<Record<string, unknown>[]> {
    const elements = await overpassFetch(nearbyOverpassQuery(origin.lat, origin.lng, radius, limit));
    return overpassNearbyRecords(elements, origin, osmLang, limit);
  }

  // ── Overpass POI search (by category within a viewport bbox) ───────────────
  // Powers the "explore places on the map" pill. OSM-ONLY by design — this never
  // calls Google, even when a Google key is configured.

  async searchOverpassPois(
    category: string,
    bbox: { south: number; west: number; north: number; east: number },
    lang?: string,
    limit = 60,
  ): Promise<PoiSearchResult> {
    // One or several categories in one query.
    const match = poiFilters(category);
    const { categories, filters } = match;
    // Each category gets its own share of the cap, or a mixed search would spend the
    // whole budget on whichever kind happens to be densest.
    const cap = Math.min(limit * categories.length, POI_RESULT_CAP);

    // Clamp an oversized viewport to a centred window so the query stays cheap and
    // returns fast at any zoom, instead of timing out / 502-ing on a huge area.
    const searchWindow = clampPoiBbox(bbox);
    const { south, west, north, east } = searchWindow.bbox;
    const clamped = searchWindow.clamped;

    // OSM `name:*` tags are keyed by language subtag: prefer the user's language
    // (the same localization the search/autocomplete path asks the geocoder for)
    // over the native `name`. `int_name` is OSM's international/romanized name — a
    // sensible fallback before the native one. Part of the cache key so a cached
    // area isn't served with another language's titles.
    const osmLang = toApiLang(lang).split('-')[0].toLowerCase();

    // Serve repeat pans/toggles of the same area straight from the cache.
    const cacheKey = `${[...categories].sort((a, b) => a.localeCompare(b)).join('+')}|${osmLang}|${south.toFixed(2)},${west.toFixed(2)},${north.toFixed(2)},${east.toFixed(2)}|${cap}`;
    const cached = cachedPoiAnswer(cacheKey);
    if (cached) return cached;

    // Overpass wants the box as (south,west,north,east) = (minLat,minLng,maxLat,maxLng).
    const box = `(${south},${west},${north},${east})`;
    const selectors = filters.map((f) => `  ${overpassSelector(f, box)};`).join('\n');
    // `out center tags <n>` returns ways/relations with a computed center and caps
    // the result count in one round-trip.
    const query = `[out:json][timeout:${OVERPASS_QUERY_TIMEOUT_S}];\n(\n${selectors}\n);\nout center tags ${cap + 25};`;

    const pois = readPois(await overpassFetch(query), match, osmLang, KEPT_UNNAMED_EXPLORE);
    const truncated = pois.length > cap;
    const value: PoiSearchResult = { pois: pois.slice(0, cap), source: 'openstreetmap', truncated, clamped };
    cachePoiAnswer(cacheKey, value);
    return value;
  }

  /**
   * POIs of one or several categories near a line (PLN-02): one Overpass query
   * for the candidates of the line's box within reach of the line itself, so
   * the cap is spent on the corridor rather than on the box. Unnamed taps,
   * huts and the like stay, because they are what a hike looks for, while an
   * unnamed garden or cafe is dropped as on the explore pill. A short deadline
   * of its own; failing throws as the explore pill's search does. During the
   * cooldown after every endpoint failed, a stretch still cached is answered
   * from the cache, one beside the probe waits for it, and any other throws
   * OverpassCoolingDown at once.
   */
  async searchOverpassPoisAlong(
    category: string,
    line: LatLng[],
    corridorM: number,
    lang?: string,
    limit = 30,
  ): Promise<PoiSearchResult> {
    const match = poiFilters(category);
    const cap = Math.min(limit * match.categories.length, POI_RESULT_CAP);
    const path = aroundPath(line, corridorM);
    const osmLang = toApiLang(lang).split('-')[0].toLowerCase();
    const kinds = [...match.categories].sort((a, b) => a.localeCompare(b)).join('+');
    const points = path.points.map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join(';');
    const cacheKey = `along|${kinds}|${osmLang}|${path.radiusM}|${points}|${cap}`;
    const cached = cachedPoiAnswer(cacheKey);
    if (cached) return cached;
    // Neither a new search nor a later stretch of one under way waits for mirrors that just failed,
    // but one in a while probes them, so a retry finds them back. A stretch beside the probe waits
    // for its answer instead, so a probe that ends the cooldown answers its whole search.
    if (this.overpassAlongProbe !== null || this.skipsOverpassAlong()) {
      await this.overpassAlongProbe?.catch(() => undefined);
      if (this.skipsOverpassAlong()) throw new OverpassCoolingDown();
    }

    const query = overpassAlongQuery(match.filters, path, cap);
    const elements = await (Date.now() < this.overpassAlongCooldownUntil
      ? this.probeOverpassAlong(query)
      : this.fetchOverpassAlong(query));
    const pois = readPois(elements, match, osmLang, KEPT_UNNAMED_ALONG);
    const value: PoiSearchResult = {
      pois: pois.slice(0, cap),
      source: 'openstreetmap',
      truncated: pois.length > cap,
      clamped: false,
    };
    cachePoiAnswer(cacheKey, value);
    return value;
  }

  /**
   * Whether the search along a line leaves Overpass alone right now, because
   * every endpoint failed it within the last OVERPASS_ALONG_COOLDOWN_MS and
   * no probe is due yet. Its kinds are then unavailable at once instead of
   * after the whole deadline. The first skip of each cooldown is logged.
   */
  skipsOverpassAlong(): boolean {
    if (this.overpassAlongRetryAfterMs() === 0) return false;
    if (!this.overpassAlongSkipLogged) {
      this.overpassAlongSkipLogged = true;
      const until = new Date(this.overpassAlongCooldownUntil).toISOString();
      logWarn(
        `[Maps] OpenStreetMap along a line: every Overpass endpoint failed, so only a probe now and then asks it until ${until}`,
      );
    }
    return true;
  }

  /** How long until a search along a line asks Overpass again, a probe included; 0 when it would now. */
  overpassAlongRetryAfterMs(): number {
    const now = Date.now();
    if (now >= this.overpassAlongCooldownUntil) return 0;
    return Math.max(0, Math.min(this.overpassAlongProbeAt, this.overpassAlongCooldownUntil) - now);
  }

  /**
   * The along query sent as the cooldown's probe. Until it settles no other
   * probe goes out, even once the next is due, since asking every mirror in
   * turn can outlast OVERPASS_ALONG_PROBE_MS.
   */
  private async probeOverpassAlong(query: string): Promise<OverpassPoiElement[]> {
    this.overpassAlongProbeAt = Date.now() + OVERPASS_ALONG_PROBE_MS;
    const probe = this.fetchOverpassAlong(query);
    this.overpassAlongProbe = probe;
    try {
      return await probe;
    } finally {
      this.overpassAlongProbe = null;
    }
  }

  /**
   * The along query on the mirrors, one after another. An answer ends the
   * cooldown; every endpoint failing starts or stretches it, unless another
   * along query was answered while this one was in flight: Overpass is up
   * then, and only this query failed. A failed probe keeps the cooldown's
   * log line, so one outage is one line.
   */
  private async fetchOverpassAlong(query: string): Promise<OverpassPoiElement[]> {
    const askedAt = Date.now();
    try {
      const elements = await overpassFetch(query, OVERPASS_ALONG_TIMEOUT_MS, OVERPASS_ALONG_HEDGE_MS);
      this.overpassAlongAnsweredAt = Date.now();
      this.overpassAlongCooldownUntil = 0;
      this.overpassAlongProbeAt = 0;
      return elements;
    } catch (err) {
      // overpassFetch throws only once every mirror has failed.
      if (this.overpassAlongAnsweredAt < askedAt) {
        const now = Date.now();
        const busyFor = (err as { retryAfterMs?: number }).retryAfterMs ?? 0;
        if (now >= this.overpassAlongCooldownUntil) this.overpassAlongSkipLogged = false;
        this.overpassAlongCooldownUntil = now + OVERPASS_ALONG_COOLDOWN_MS;
        this.overpassAlongProbeAt =
          now + Math.min(Math.max(busyFor, OVERPASS_ALONG_PROBE_MS), OVERPASS_ALONG_COOLDOWN_MS);
      }
      throw err;
    }
  }
}
