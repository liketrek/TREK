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
 * src/app-config/README.md), so every instance shares one cache.
 *
 * Never imports MapsService: providers sit below the orchestrator
 * (lint:boundaries holds that).
 */
import { nominatimFetch, type GeoLane } from '../../geo/nominatim.client';
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
  buildOsmDetails,
  OSM_PLACE_ID,
  type OverpassPoi,
} from '../maps.helpers';
import { readWikiIdentity } from './wiki-identity';
import { Injectable } from '@nestjs/common';
import { normalizePlaceWebsite } from '@trek/shared';

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

// POST the query to all mirrors at once and return the first one that answers with
// valid JSON. Throws {status:502} only if every mirror fails. Racing (rather than
// trying one-by-one) keeps latency at the fastest reachable mirror instead of the
// sum of every dead mirror's timeout.
async function overpassFetch(query: string): Promise<OverpassPoiElement[]> {
  const body = `data=${encodeURIComponent(query)}`;
  const controllers: AbortController[] = [];

  const attempt = async (url: string): Promise<OverpassPoiElement[]> => {
    const ctrl = new AbortController();
    controllers.push(ctrl);
    const timer = setTimeout(() => ctrl.abort(), OVERPASS_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`Overpass ${res.status} @ ${url}`);
      const data = (await res.json()) as { elements?: OverpassPoiElement[]; remark?: string };
      // Overpass signals an internal timeout / runtime error via `remark` while
      // still answering HTTP 200 — often fast, with an empty or partial element
      // set. Treat that as a failed attempt so a healthy mirror wins the race
      // instead of this fast-but-empty answer, and so the all-mirrors-failed path
      // still surfaces a real error to the client instead of a silent "no places".
      if (data.remark) throw new Error(`Overpass remark @ ${url}: ${data.remark}`);
      if (!Array.isArray(data.elements)) throw new Error(`Overpass non-OSM body @ ${url}`);
      return data.elements;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    // Promise.any resolves with the first mirror to return valid JSON, and only
    // rejects (AggregateError) once every mirror has failed.
    return await Promise.any(OVERPASS_MIRRORS.map(attempt));
  } catch (err) {
    // Log WHY every endpoint failed (connection refused, aborted/timed out, non-OSM
    // body, …) so an operator can tell blocked egress / a firewall from a transiently
    // overloaded mirror — otherwise this is a bare 502 with no breadcrumb (see #1309).
    const reasons =
      err instanceof AggregateError
        ? err.errors.map((e) => (e instanceof Error ? e.message : String(e))).join(' | ')
        : err instanceof Error
          ? err.message
          : String(err);
    console.error(`[Overpass] all ${OVERPASS_MIRRORS.length} endpoint(s) failed — ${reasons}`);
    throw Object.assign(new Error('Could not reach any Overpass endpoint'), { status: 502 });
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

@Injectable()
export class OsmClient {
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
  ): Promise<{ suggestions: { placeId: string; mainText: string; secondaryText: string }[]; source: 'nominatim' }> {
    try {
      const places = await this.searchNominatim(input, lang);
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
    // One or several categories in one query. Each OSM selector belongs to exactly one
    // category, so a hit can still be labelled with the category it answered.
    const categories = parsePoiCategories(category);
    if (!categories.length) throw Object.assign(new Error('Unknown POI category'), { status: 400 });
    const categoryOfFilter = new Map<string, string>();
    for (const key of categories) {
      const own = CATEGORY_OSM_FILTERS[key];
      if (!own) throw Object.assign(new Error('Unknown POI category'), { status: 400 });
      for (const f of own) categoryOfFilter.set(f, key);
    }
    const filters = [...categoryOfFilter.keys()];
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
    const cached = POI_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.at < POI_CACHE_TTL_MS) return cached.value;
    if (cached) POI_CACHE.delete(cacheKey); // expired — drop it before refetching

    // Overpass wants the box as (south,west,north,east) = (minLat,minLng,maxLat,maxLng).
    const box = `(${south},${west},${north},${east})`;
    const selectors = filters
      .map((f) => {
        const [k, v] = f.split('=');
        return `  nwr["${k}"="${v}"]${box};`;
      })
      .join('\n');
    // `out center tags <n>` returns ways/relations with a computed center and caps
    // the result count in one round-trip.
    const query = `[out:json][timeout:${OVERPASS_QUERY_TIMEOUT_S}];\n(\n${selectors}\n);\nout center tags ${cap + 25};`;

    const elements = await overpassFetch(query);

    const pois: OverpassPoi[] = [];
    for (const el of elements) {
      const tags = el.tags || {};
      // `operator` comes last but matters for the road categories: petrol stations,
      // charging points and service areas are routinely mapped with an operator and no
      // name, and dropping those would empty the road trip corridor over long stretches.
      const name = tags[`name:${osmLang}`] || tags['int_name'] || tags.name || tags.brand || tags.operator || null;
      if (!name) continue; // unnamed POIs aren't useful to add to a plan
      // A shut-down place is not somewhere to plan a visit (#1341). OSM usually
      // re-tags one with a `disused:`/`abandoned:` prefix, and those never match
      // the selectors above — but plenty keep their original tag and gain a marker
      // instead, and those do come back. `opening_hours=closed`/`off` is the same
      // statement in the hours field.
      if (tags.disused === 'yes' || tags.abandoned === 'yes') continue;
      if (tags.opening_hours === 'closed' || tags.opening_hours === 'off') continue;
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (lat == null || lng == null) continue;
      const matched =
        filters.find((f) => {
          const [k, v] = f.split('=');
          return tags[k] === v;
        }) || filters[0];
      const addr =
        [tags['addr:street'], tags['addr:housenumber'], tags['addr:postcode'], tags['addr:city']]
          .filter(Boolean)
          .join(' ') || null;
      pois.push({
        osm_id: `${el.type}:${el.id}`,
        name,
        lat,
        lng,
        category: categoryOfFilter.get(matched) ?? categories[0],
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
        // Only where it means something. Every POI carries `capacity` and `fee` for its
        // own reasons — a restaurant's capacity is seats — so reading them as charging
        // data anywhere else would be wrong on most of the map.
        charging: categoryOfFilter.get(matched) === 'charging' ? readChargingInfo(tags) : null,
        source: 'openstreetmap',
      });
    }
    const truncated = pois.length > cap;
    const value: PoiSearchResult = { pois: pois.slice(0, cap), source: 'openstreetmap', truncated, clamped };
    // FIFO eviction: a Map preserves insertion order, so the first key is the oldest.
    if (POI_CACHE.size >= POI_CACHE_MAX) POI_CACHE.delete(POI_CACHE.keys().next().value as string);
    POI_CACHE.set(cacheKey, { at: Date.now(), value });
    return value;
  }
}
