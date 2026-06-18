import { db } from '../db/database';
import { decrypt_api_key } from './apiKeyCrypto';
import { safeFetchFollow, SsrfBlockedError } from '../utils/ssrfGuard';
import { getAppUrl } from './notifications';

// ── Google API call counter ───────────────────────────────────────────────────

let googleApiCallCount = 0;

function googleFetch(endpoint: string, label: string, init?: RequestInit): Promise<Response> {
  googleApiCallCount++;
  console.debug(`[Google API] #${googleApiCallCount} ${label} → ${endpoint}`);
  const referer = process.env.APP_URL ? getAppUrl() : undefined;
  return fetch(endpoint, {
    ...init,
    headers: { ...(referer ? { Referer: referer } : {}), ...(init?.headers as Record<string, string> ?? {}) },
  });
}

// ── Interfaces ───────────────────────────────────────────────────────────────

interface NominatimResult {
  osm_type: string;
  osm_id: string;
  name?: string;
  display_name?: string;
  lat: string;
  lon: string;
}

interface OverpassElement {
  tags?: Record<string, string>;
}

interface WikiCommonsPage {
  imageinfo?: { url?: string; thumburl?: string; extmetadata?: { Artist?: { value?: string } } }[];
}

interface GooglePlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  types?: string[];
}

interface GoogleAutocompleteSuggestion {
  placePrediction?: {
    placeId: string;
    structuredFormat?: {
      mainText?: { text: string };
      secondaryText?: { text: string };
    };
  };
}

interface GooglePlaceDetails extends GooglePlaceResult {
  userRatingCount?: number;
  regularOpeningHours?: { weekdayDescriptions?: string[]; openNow?: boolean };
  googleMapsUri?: string;
  editorialSummary?: { text: string };
  reviews?: { authorAttribution?: { displayName?: string; photoUri?: string }; rating?: number; text?: { text?: string }; relativePublishTimeDescription?: string }[];
  photos?: { name: string; authorAttributions?: { displayName?: string }[] }[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const UA = 'TREK Travel Planner (https://github.com/mauriceboe/TREK)';

// TREK's internal language codes mostly coincide with valid BCP-47 codes, but a
// couple don't: 'br' is Brazilian Portuguese here (BCP-47 'pt-BR'; bare 'br' is
// Breton) and 'gr' is Greek (BCP-47 'el'). Outbound geo APIs (Google Places,
// Nominatim) expect BCP-47, so normalise before sending — otherwise names and
// opening hours come back in the wrong language. Codes not listed here pass
// through unchanged (they are already valid), as do locale forms the client
// sometimes sends (e.g. 'pt-BR').
const API_LANG_OVERRIDES: Record<string, string> = {
  br: 'pt-BR',
  gr: 'el',
  'el-GR': 'el',
};
function toApiLang(lang: string | undefined, fallback = 'en'): string {
  const code = (lang || '').trim();
  if (!code) return fallback;
  return API_LANG_OVERRIDES[code] ?? code;
}

// ── Photo cache (disk-backed) ────────────────────────────────────────────────
import * as placePhotoCache from './placePhotoCache';

// ── Concurrency limiter for outbound photo fetches ───────────────────────────
// Caps simultaneous Wikimedia/Google photo requests so a bulk import of hundreds
// of places cannot monopolise the event loop or trigger external API rate limits.
const MAX_CONCURRENT_PHOTO_FETCHES = 5;
let photoFetchActive = 0;
const photoFetchQueue: Array<() => void> = [];

function acquirePhotoFetchSlot(): Promise<void> {
  if (photoFetchActive < MAX_CONCURRENT_PHOTO_FETCHES) {
    photoFetchActive++;
    return Promise.resolve();
  }
  return new Promise(resolve => photoFetchQueue.push(resolve));
}

function releasePhotoFetchSlot(): void {
  const next = photoFetchQueue.shift();
  if (next) {
    next();
  } else {
    photoFetchActive--;
  }
}

// ── API key retrieval ────────────────────────────────────────────────────────

export function getMapsKey(userId: number): string | null {
  const user = db.prepare('SELECT maps_api_key FROM users WHERE id = ?').get(userId) as { maps_api_key: string | null } | undefined;
  const user_key = decrypt_api_key(user?.maps_api_key);
  if (user_key) return user_key;
  const admin = db.prepare("SELECT maps_api_key FROM users WHERE role = 'admin' AND maps_api_key IS NOT NULL AND maps_api_key != '' LIMIT 1").get() as { maps_api_key: string } | undefined;
  return decrypt_api_key(admin?.maps_api_key) || null;
}

// ── Nominatim search ─────────────────────────────────────────────────────────

export async function searchNominatim(query: string, lang?: string) {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '10',
    'accept-language': toApiLang(lang),
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': UA },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Nominatim API error: ${response.status} ${response.statusText}${text ? ' - ' + text.substring(0, 200) : ''}`);
  }
  const data = await response.json() as NominatimResult[];
  return data.map(item => ({
    google_place_id: null,
    osm_id: `${item.osm_type}:${item.osm_id}`,
    name: item.name || item.display_name?.split(',')[0] || '',
    address: item.display_name || '',
    lat: parseFloat(item.lat) || null,
    lng: parseFloat(item.lon) || null,
    rating: null,
    website: null,
    phone: null,
    source: 'openstreetmap',
  }));
}

// ── Nominatim lookup (by OSM ID) ────────────────────────────────────────────

export async function lookupNominatim(osmType: string, osmId: string, lang?: string): Promise<{
  name: string; address: string; lat: number | null; lng: number | null;
} | null> {
  const typePrefix = osmType.charAt(0).toUpperCase(); // N, W, R
  const params = new URLSearchParams({
    osm_ids: `${typePrefix}${osmId}`,
    format: 'json',
    'accept-language': toApiLang(lang),
  });
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/lookup?${params}`, {
      headers: { 'User-Agent': UA },
    });
    if (!res.ok) return null;
    const data = await res.json() as NominatimResult[];
    const item = data[0];
    if (!item) return null;
    return {
      name: item.name || item.display_name?.split(',')[0] || '',
      address: item.display_name || '',
      lat: parseFloat(item.lat) || null,
      lng: parseFloat(item.lon) || null,
    };
  } catch { return null; }
}

// ── Overpass API (OSM details) ───────────────────────────────────────────────

export async function fetchOverpassDetails(osmType: string, osmId: string): Promise<OverpassElement | null> {
  const typeMap: Record<string, string> = { node: 'node', way: 'way', relation: 'rel' };
  const oType = typeMap[osmType];
  if (!oType) return null;
  const query = `[out:json][timeout:5];${oType}(${osmId});out tags;`;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return null;
    const data = await res.json() as { elements?: OverpassElement[] };
    return data.elements?.[0] || null;
  } catch { return null; }
}

// ── Overpass POI search (by category within a viewport bbox) ─────────────────
// Powers the "explore places on the map" pill. OSM-ONLY by design — this never
// calls Google, even when a Google key is configured.

export interface OverpassPoi {
  osm_id: string; // 'node:123' | 'way:123' | 'relation:123' (matches the placeId format elsewhere)
  name: string;
  lat: number;
  lng: number;
  category: string; // the requested pill category key, e.g. 'restaurant'
  poi_type: string; // the raw OSM tag that matched, e.g. 'amenity=restaurant'
  address: string | null;
  website: string | null;
  phone: string | null;
  opening_hours: string | null;
  cuisine: string | null;
  source: 'openstreetmap';
}

// Each pill category → the OSM tag selectors it searches. Keys here are the
// contract with the client's POI_CATEGORIES (same keys, label/icon/colour live
// client-side).
const CATEGORY_OSM_FILTERS: Record<string, string[]> = {
  restaurant: ['amenity=restaurant', 'amenity=fast_food'],
  cafe: ['amenity=cafe'],
  bar: ['amenity=bar', 'amenity=pub', 'amenity=nightclub'],
  hotel: ['tourism=hotel', 'tourism=hostel', 'tourism=guest_house', 'tourism=apartment', 'tourism=motel'],
  sights: ['tourism=attraction', 'tourism=viewpoint', 'historic=monument', 'historic=castle', 'historic=memorial', 'historic=ruins'],
  museum: ['tourism=museum', 'tourism=gallery', 'tourism=artwork', 'amenity=theatre'],
  nature: ['leisure=park', 'leisure=garden', 'natural=beach', 'natural=peak'],
  activity: ['tourism=theme_park', 'tourism=zoo', 'tourism=aquarium', 'leisure=water_park'],
  shopping: ['shop=mall', 'shop=department_store', 'amenity=marketplace'],
  supermarket: ['shop=supermarket', 'shop=convenience'],
};

export const POI_CATEGORY_KEYS = Object.keys(CATEGORY_OSM_FILTERS);

interface OverpassPoiElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface PoiSearchResult {
  pois: OverpassPoi[];
  source: 'openstreetmap';
  truncated: boolean;
  // True when the requested viewport was too large and got shrunk to a centred
  // window before querying — the results then cover the middle of the view only.
  clamped: boolean;
}

// Public Overpass mirrors, queried in PARALLEL (first valid response wins).
// Reachability and load vary a lot by network/region — the canonical instance is
// frequently overloaded (504s) and some community mirrors are unreachable from
// certain networks. Racing them means whichever mirror is fastest-reachable for
// this user answers, and an overloaded or blocked one never blocks the others.
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
// Per-mirror cap. Because mirrors race in parallel this is also the worst-case
// total wait before every mirror is given up on and a 502 is returned.
const OVERPASS_TIMEOUT_MS = 12000;
// Largest viewport side we send to Overpass. A country/continent-sized bbox makes
// Overpass scan millions of elements and time out; clamping to a centred window
// keeps the query cheap so the explore pill returns fast at ANY zoom level.
const MAX_BBOX_SPAN_DEG = 0.5;

// Short-lived cache so panning back over / re-toggling the same area doesn't
// re-hit Overpass. Keyed by category + rounded (post-clamp) bbox.
const POI_CACHE = new Map<string, { at: number; value: PoiSearchResult }>();
const POI_CACHE_TTL_MS = 5 * 60 * 1000;
// Cap the number of cached areas so panning across the globe can't grow the map
// without bound (entries are evicted oldest-first once the cap is reached).
const POI_CACHE_MAX = 500;

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
      const data = await res.json() as { elements?: OverpassPoiElement[]; remark?: string };
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
  } catch {
    throw Object.assign(new Error('Overpass request failed'), { status: 502 });
  } finally {
    // Cancel the slower/losing requests — we already have (or have given up on) a result.
    controllers.forEach(c => { try { c.abort(); } catch { /* noop */ } });
  }
}

export async function searchOverpassPois(
  category: string,
  bbox: { south: number; west: number; north: number; east: number },
  limit = 60,
): Promise<PoiSearchResult> {
  const filters = CATEGORY_OSM_FILTERS[category];
  if (!filters) throw Object.assign(new Error('Unknown POI category'), { status: 400 });

  // Clamp an oversized viewport to a centred window so the query stays cheap and
  // returns fast at any zoom, instead of timing out / 502-ing on a huge area.
  let { south, west, north, east } = bbox;
  let clamped = false;
  if (north - south > MAX_BBOX_SPAN_DEG) {
    const c = (north + south) / 2;
    south = c - MAX_BBOX_SPAN_DEG / 2;
    north = c + MAX_BBOX_SPAN_DEG / 2;
    clamped = true;
  }
  if (east - west > MAX_BBOX_SPAN_DEG) {
    const c = (east + west) / 2;
    west = c - MAX_BBOX_SPAN_DEG / 2;
    east = c + MAX_BBOX_SPAN_DEG / 2;
    clamped = true;
  }

  // Serve repeat pans/toggles of the same area straight from the cache.
  const cacheKey = `${category}|${south.toFixed(2)},${west.toFixed(2)},${north.toFixed(2)},${east.toFixed(2)}|${limit}`;
  const cached = POI_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.at < POI_CACHE_TTL_MS) return cached.value;
  if (cached) POI_CACHE.delete(cacheKey); // expired — drop it before refetching

  // Overpass wants the box as (south,west,north,east) = (minLat,minLng,maxLat,maxLng).
  const box = `(${south},${west},${north},${east})`;
  const selectors = filters.map(f => {
    const [k, v] = f.split('=');
    return `  nwr["${k}"="${v}"]${box};`;
  }).join('\n');
  // `out center tags <n>` returns ways/relations with a computed center and caps
  // the result count in one round-trip.
  const query = `[out:json][timeout:20];\n(\n${selectors}\n);\nout center tags ${limit + 25};`;

  const elements = await overpassFetch(query);

  const pois: OverpassPoi[] = [];
  for (const el of elements) {
    const tags = el.tags || {};
    const name = tags.name || tags['name:en'] || tags.brand || null;
    if (!name) continue; // unnamed POIs aren't useful to add to a plan
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;
    const matched = filters.find(f => { const [k, v] = f.split('='); return tags[k] === v; }) || filters[0];
    const addr = [tags['addr:street'], tags['addr:housenumber'], tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(' ') || null;
    pois.push({
      osm_id: `${el.type}:${el.id}`,
      name,
      lat,
      lng,
      category,
      poi_type: matched,
      address: addr,
      website: tags.website || tags['contact:website'] || null,
      phone: tags.phone || tags['contact:phone'] || null,
      opening_hours: tags.opening_hours || null,
      cuisine: tags.cuisine || null,
      source: 'openstreetmap',
    });
  }
  const truncated = pois.length > limit;
  const value: PoiSearchResult = { pois: pois.slice(0, limit), source: 'openstreetmap', truncated, clamped };
  // FIFO eviction: a Map preserves insertion order, so the first key is the oldest.
  if (POI_CACHE.size >= POI_CACHE_MAX) POI_CACHE.delete(POI_CACHE.keys().next().value as string);
  POI_CACHE.set(cacheKey, { at: Date.now(), value });
  return value;
}

// ── Opening hours parsing ────────────────────────────────────────────────────

export function parseOpeningHours(ohString: string): { weekdayDescriptions: string[]; openNow: boolean | null } {
  const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const result: string[] = LONG.map(d => `${d}: ?`);

  // Parse segments like "Mo-Fr 09:00-18:00; Sa 10:00-14:00"
  for (const segment of ohString.split(';')) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:\s*,\s*(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))?)*)\s+(.+)$/i);
    if (!match) continue;
    const [, daysPart, timePart] = match;
    const dayIndices = new Set<number>();
    for (const range of daysPart.split(',')) {
      const parts = range.trim().split('-').map(d => DAYS.indexOf(d.trim()));
      if (parts.length === 2 && parts[0] >= 0 && parts[1] >= 0) {
        for (let i = parts[0]; i !== (parts[1] + 1) % 7; i = (i + 1) % 7) dayIndices.add(i);
        dayIndices.add(parts[1]);
      } else if (parts[0] >= 0) {
        dayIndices.add(parts[0]);
      }
    }
    for (const idx of dayIndices) {
      result[idx] = `${LONG[idx]}: ${timePart.trim()}`;
    }
  }

  // Compute openNow
  let openNow: boolean | null = null;
  try {
    const now = new Date();
    const jsDay = now.getDay();
    const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
    const todayLine = result[dayIdx];
    const timeRanges = [...todayLine.matchAll(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g)];
    if (timeRanges.length > 0) {
      const nowMins = now.getHours() * 60 + now.getMinutes();
      openNow = timeRanges.some(m => {
        const start = parseInt(m[1]) * 60 + parseInt(m[2]);
        const end = parseInt(m[3]) * 60 + parseInt(m[4]);
        return end > start ? nowMins >= start && nowMins < end : nowMins >= start || nowMins < end;
      });
    }
  } catch { /* best effort */ }

  return { weekdayDescriptions: result, openNow };
}

// ── Build standardized OSM details ───────────────────────────────────────────

export function buildOsmDetails(tags: Record<string, string>, osmType: string, osmId: string) {
  let opening_hours: string[] | null = null;
  let open_now: boolean | null = null;
  if (tags.opening_hours) {
    const parsed = parseOpeningHours(tags.opening_hours);
    const hasData = parsed.weekdayDescriptions.some(line => !line.endsWith('?'));
    if (hasData) {
      opening_hours = parsed.weekdayDescriptions;
      open_now = parsed.openNow;
    }
  }
  return {
    website: tags['contact:website'] || tags.website || null,
    phone: tags['contact:phone'] || tags.phone || null,
    opening_hours,
    open_now,
    osm_url: `https://www.openstreetmap.org/${osmType}/${osmId}`,
    summary: tags.description || null,
    source: 'openstreetmap' as const,
  };
}

// ── Wikimedia Commons photo lookup ───────────────────────────────────────────

export async function fetchWikimediaPhoto(lat: number, lng: number, name?: string): Promise<{ photoUrl: string; attribution: string | null } | null> {
  // Strategy 1: Search Wikipedia for the place name -> get the article image
  if (name) {
    try {
      const searchParams = new URLSearchParams({
        action: 'query', format: 'json',
        titles: name,
        prop: 'pageimages',
        piprop: 'thumbnail',
        pithumbsize: '400',
        pilimit: '1',
        redirects: '1',
      });
      const res = await fetch(`https://en.wikipedia.org/w/api.php?${searchParams}`, { headers: { 'User-Agent': UA } });
      if (res.ok) {
        const data = await res.json() as { query?: { pages?: Record<string, { thumbnail?: { source?: string } }> } };
        const pages = data.query?.pages;
        if (pages) {
          for (const page of Object.values(pages)) {
            if (page.thumbnail?.source) {
              return { photoUrl: page.thumbnail.source, attribution: 'Wikipedia' };
            }
          }
        }
      }
    } catch { /* fall through to geosearch */ }
  }

  // Strategy 2: Wikimedia Commons geosearch by coordinates
  const params = new URLSearchParams({
    action: 'query', format: 'json',
    generator: 'geosearch',
    ggsprimary: 'all',
    ggsnamespace: '6',
    ggsradius: '300',
    ggscoord: `${lat}|${lng}`,
    ggslimit: '5',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: '400',
  });
  try {
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const data = await res.json() as { query?: { pages?: Record<string, WikiCommonsPage & { imageinfo?: { mime?: string }[] }> } };
    const pages = data.query?.pages;
    if (!pages) return null;
    for (const page of Object.values(pages)) {
      const info = page.imageinfo?.[0];
      // Only use actual photos (JPEG/PNG), skip SVGs and PDFs
      const mime = (info as { mime?: string })?.mime || '';
      if (info?.url && (mime.startsWith('image/jpeg') || mime.startsWith('image/png'))) {
        const attribution = info.extmetadata?.Artist?.value?.replace(/<[^>]+>/g, '').trim() || null;
        // iiurlwidth=400 makes Commons also return a scaled thumburl. Prefer it —
        // info.url is the full-resolution original (multi-megapixel camera exports).
        return { photoUrl: info.thumburl ?? info.url, attribution };
      }
    }
    return null;
  } catch { return null; }
}

// ── Search places (Google or Nominatim fallback) ─────────────────────────────

export async function searchPlaces(userId: number, query: string, lang?: string, locationBias?: { lat: number; lng: number; radius?: number }): Promise<{ places: Record<string, unknown>[]; source: string }> {
  const apiKey = getMapsKey(userId);

  if (!apiKey) {
    const places = await searchNominatim(query, lang);
    return { places, source: 'openstreetmap' };
  }

  const searchBody: Record<string, unknown> = { textQuery: query, languageCode: toApiLang(lang) };
  // Bias results toward the caller's area when supplied — without it Google Text
  // Search falls back to the API key's billing region, which skews foreign-region queries.
  if (locationBias) {
    searchBody.locationBias = {
      circle: {
        center: { latitude: locationBias.lat, longitude: locationBias.lng },
        radius: locationBias.radius ?? 50000,
      },
    };
  }

  const response = await googleFetch('https://places.googleapis.com/v1/places:searchText', 'searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.websiteUri,places.nationalPhoneNumber,places.types',
    },
    body: JSON.stringify(searchBody),
  });

  const data = await response.json() as { places?: GooglePlaceResult[]; error?: { message?: string } };

  if (!response.ok) {
    const err = new Error(data.error?.message || 'Google Places API error') as Error & { status: number };
    err.status = response.status;
    throw err;
  }

  const places = (data.places || []).map((p: GooglePlaceResult) => ({
    google_place_id: p.id,
    name: p.displayName?.text || '',
    address: p.formattedAddress || '',
    lat: p.location?.latitude || null,
    lng: p.location?.longitude || null,
    rating: p.rating || null,
    website: p.websiteUri || null,
    phone: p.nationalPhoneNumber || null,
    types: p.types || [],
    source: 'google',
  }));

  return { places, source: 'google' };
}

// ── Autocomplete (Google or Nominatim fallback) ─────────────────────────────

export async function autocompletePlaces(
  userId: number,
  input: string,
  lang?: string,
  locationBias?: { low: { lat: number; lng: number }; high: { lat: number; lng: number } },
): Promise<{ suggestions: { placeId: string; mainText: string; secondaryText: string }[]; source: string }> {
  const apiKey = getMapsKey(userId);

  if (!apiKey) {
    return autocompleteNominatim(input, lang);
  }

  const body: Record<string, unknown> = {
    input,
    languageCode: toApiLang(lang),
  };
  if (locationBias) {
    body.locationBias = {
      rectangle: {
        low: { latitude: locationBias.low.lat, longitude: locationBias.low.lng },
        high: { latitude: locationBias.high.lat, longitude: locationBias.high.lng },
      },
    };
  }

  const response = await googleFetch('https://places.googleapis.com/v1/places:autocomplete', 'autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json() as { suggestions?: GoogleAutocompleteSuggestion[]; error?: { message?: string } };

  if (!response.ok) {
    const err = new Error(data.error?.message || 'Google Places Autocomplete error') as Error & { status: number };
    err.status = response.status;
    throw err;
  }

  const suggestions = (data.suggestions || [])
    .filter((s) => s.placePrediction)
    .slice(0, 5)
    .map((s) => ({
      placeId: s.placePrediction!.placeId,
      mainText: s.placePrediction!.structuredFormat?.mainText?.text || '',
      secondaryText: s.placePrediction!.structuredFormat?.secondaryText?.text || '',
    }));

  return { suggestions, source: 'google' };
}

async function autocompleteNominatim(
  input: string,
  lang?: string,
): Promise<{ suggestions: { placeId: string; mainText: string; secondaryText: string }[]; source: string }> {
  try {
    const places = await searchNominatim(input, lang);
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

// ── Place details (Google or OSM) ────────────────────────────────────────────

export async function getPlaceDetails(userId: number, placeId: string, lang?: string): Promise<{ place: Record<string, unknown> }> {
  // OSM details: placeId is "node:123456" or "way:123456" etc.
  if (placeId.includes(':')) {
    const [osmType, osmId] = placeId.split(':');
    const element = await fetchOverpassDetails(osmType, osmId);
    const details = buildOsmDetails(element?.tags || {}, osmType, osmId);

    // Fetch Nominatim only when Overpass lacks coordinates or address
    const d = details as Record<string, unknown>;
    const needsNominatim = !d.lat || !d.lng || !d.address;
    const nominatim = needsNominatim ? await lookupNominatim(osmType, osmId, lang) : null;

    return {
      place: {
        ...details,
        name: (d.name as string) || nominatim?.name || element?.tags?.name || '',
        address: (d.address as string) || nominatim?.address || '',
        lat: d.lat ?? nominatim?.lat ?? null,
        lng: d.lng ?? nominatim?.lng ?? null,
        osm_id: placeId,
      },
    };
  }

  // Google details
  const langKey = toApiLang(lang, 'de');
  const apiKey = getMapsKey(userId);
  if (!apiKey) {
    throw Object.assign(new Error('Google Maps API key not configured'), { status: 400 });
  }

  // Check DB cache first (lean mask, expanded=0) — 7-day TTL
  const DETAILS_TTL = 7 * 24 * 60 * 60 * 1000;
  const cached = db.prepare(
    'SELECT payload_json, fetched_at FROM place_details_cache WHERE place_id = ? AND lang = ? AND expanded = 0'
  ).get(placeId, langKey) as { payload_json: string; fetched_at: number } | undefined;
  if (cached && Date.now() - cached.fetched_at < DETAILS_TTL) return { place: JSON.parse(cached.payload_json) };

  const response = await googleFetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=${langKey}`, `getPlaceDetails(${placeId})`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,websiteUri,nationalPhoneNumber,regularOpeningHours,googleMapsUri',
    },
  });

  const data = await response.json() as GooglePlaceDetails & { error?: { message?: string } };

  if (!response.ok) {
    const err = new Error(data.error?.message || 'Google Places API error') as Error & { status: number };
    err.status = response.status;
    throw err;
  }

  const place = {
    google_place_id: data.id,
    name: data.displayName?.text || '',
    address: data.formattedAddress || '',
    lat: data.location?.latitude || null,
    lng: data.location?.longitude || null,
    rating: data.rating || null,
    rating_count: data.userRatingCount || null,
    website: data.websiteUri || null,
    phone: data.nationalPhoneNumber || null,
    opening_hours: data.regularOpeningHours?.weekdayDescriptions || null,
    open_now: data.regularOpeningHours?.openNow ?? null,
    google_maps_url: data.googleMapsUri || null,
    summary: null,
    reviews: [],
    source: 'google' as const,
    cached_at: Date.now(),
  };

  try {
    db.prepare(
      'INSERT OR REPLACE INTO place_details_cache (place_id, lang, expanded, payload_json, fetched_at) VALUES (?, ?, 0, ?, ?)'
    ).run(placeId, langKey, JSON.stringify(place), Date.now());
  } catch (dbErr) {
    console.error('Failed to cache place details:', dbErr);
  }

  return { place };
}

export async function getPlaceDetailsExpanded(userId: number, placeId: string, lang?: string, refresh = false): Promise<{ place: Record<string, unknown> }> {
  const langKey = toApiLang(lang, 'de');
  const apiKey = getMapsKey(userId);
  if (!apiKey) throw Object.assign(new Error('Google Maps API key not configured'), { status: 400 });

  // Check DB cache for expanded result
  if (!refresh) {
    const cached = db.prepare(
      'SELECT payload_json FROM place_details_cache WHERE place_id = ? AND lang = ? AND expanded = 1'
    ).get(placeId, langKey) as { payload_json: string } | undefined;
    if (cached) return { place: JSON.parse(cached.payload_json) };
  }

  const response = await googleFetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=${langKey}`, `getPlaceDetailsExpanded(${placeId})`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,websiteUri,nationalPhoneNumber,regularOpeningHours,googleMapsUri,reviews,editorialSummary',
    },
  });

  const data = await response.json() as GooglePlaceDetails & { error?: { message?: string } };

  if (!response.ok) {
    const err = new Error(data.error?.message || 'Google Places API error') as Error & { status: number };
    err.status = response.status;
    throw err;
  }

  const place = {
    google_place_id: data.id,
    name: data.displayName?.text || '',
    address: data.formattedAddress || '',
    lat: data.location?.latitude || null,
    lng: data.location?.longitude || null,
    rating: data.rating || null,
    rating_count: data.userRatingCount || null,
    website: data.websiteUri || null,
    phone: data.nationalPhoneNumber || null,
    opening_hours: data.regularOpeningHours?.weekdayDescriptions || null,
    open_now: data.regularOpeningHours?.openNow ?? null,
    google_maps_url: data.googleMapsUri || null,
    summary: data.editorialSummary?.text || null,
    reviews: (data.reviews || []).slice(0, 5).map((r: NonNullable<GooglePlaceDetails['reviews']>[number]) => ({
      author: r.authorAttribution?.displayName || null,
      rating: r.rating || null,
      text: r.text?.text || null,
      time: r.relativePublishTimeDescription || null,
      photo: r.authorAttribution?.photoUri || null,
    })),
    source: 'google' as const,
    cached_at: Date.now(),
  };

  try {
    db.prepare(
      'INSERT OR REPLACE INTO place_details_cache (place_id, lang, expanded, payload_json, fetched_at) VALUES (?, ?, 1, ?, ?)'
    ).run(placeId, langKey, JSON.stringify(place), Date.now());
  } catch (dbErr) {
    console.error('Failed to cache expanded place details:', dbErr);
  }

  return { place };
}

// ── Place photo (Google or Wikimedia, disk-cached) ────────────────────────────

export async function getPlacePhoto(
  userId: number,
  placeId: string,
  lat: number,
  lng: number,
  name?: string,
): Promise<{ photoUrl: string; attribution: string | null }> {
  // Disk cache hit — serve immediately, no Google call
  const diskHit = placePhotoCache.get(placeId);
  if (diskHit) return { photoUrl: diskHit.photoUrl, attribution: diskHit.attribution };

  // Recent error — don't hammer the API
  if (placePhotoCache.getErrored(placeId)) {
    throw Object.assign(new Error('(Cache) No photo available'), { status: 404 });
  }

  // Deduplicate concurrent requests for the same placeId
  const existing = placePhotoCache.getInFlight(placeId);
  if (existing) {
    const result = await existing;
    if (!result) throw Object.assign(new Error('(Cache) No photo available'), { status: 404 });
    return { photoUrl: `/api/maps/place-photo/${encodeURIComponent(placeId)}/bytes`, attribution: result.attribution };
  }

  const fetchPromise = (async (): Promise<{ filePath: string; attribution: string | null } | null> => {
    await acquirePhotoFetchSlot();
    try {
    const apiKey = getMapsKey(userId);
    const isCoordLookup = placeId.startsWith('coords:');

    // Coordinate-based Wikipedia/Wikimedia lookup. Used for coordinate-only
    // (right-click) places and as a fallback when a Google place yields no photo,
    // so a place added via search still gets a marker image when Google returns
    // nothing. Returns null (without marking an error) so the caller decides.
    const fetchWikimediaFallback = async (): Promise<{ filePath: string; attribution: string | null } | null> => {
      if (isNaN(lat) || isNaN(lng)) return null;
      try {
        const wiki = await fetchWikimediaPhoto(lat, lng, name);
        if (!wiki) return null;
        // Follow redirects manually so each hop (the image URL can 3xx to a CDN
        // host) is re-validated against the SSRF guard, not just the first URL.
        const imgRes = await safeFetchFollow(wiki.photoUrl, undefined, { bypassInternalIpAllowed: true });
        if (!imgRes.ok) return null;
        const bytes = Buffer.from(await imgRes.arrayBuffer());
        const cached = await placePhotoCache.put(placeId, bytes, wiki.attribution);
        return { filePath: cached.filePath, attribution: cached.attribution };
      } catch {
        return null;
      }
    };

    // Google Places photo for a Google place_id. Returns null (without marking an
    // error) on any miss — no key, URL-shaped id, request rejected, no photos, or
    // a failed media download — so the caller can fall back to Wikimedia.
    const fetchGooglePhoto = async (): Promise<{ filePath: string; attribution: string | null } | null> => {
      // URL-shaped placeIds aren't Google IDs — legacy DBs may store raw photo URLs in image_url
      if (!apiKey || /^https?:\/\//i.test(placeId)) return null;

      // Fetch details to get the photo name
      const detailsRes = await googleFetch(`https://places.googleapis.com/v1/places/${placeId}`, `getPlacePhoto/details(${placeId})`, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'photos',
        },
      });
      const body = await detailsRes.text();
      if (!detailsRes.ok) {
        console.error('Google Places photo details error:', detailsRes.status, body.slice(0, 200));
        return null;
      }
      let details: GooglePlaceDetails & { error?: { message?: string } };
      try { details = body ? JSON.parse(body) : { photos: [] }; }
      catch { return null; }
      if (!details.photos?.length) return null;

      const photo = details.photos[0];
      const photoName = photo.name;
      const attribution = photo.authorAttributions?.[0]?.displayName || null;

      // Fetch actual image bytes
      const mediaRes = await googleFetch(
        `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400`,
        `getPlacePhoto/media(${placeId})`,
        { headers: { 'X-Goog-Api-Key': apiKey } }
      );
      if (!mediaRes.ok) return null;

      const bytes = Buffer.from(await mediaRes.arrayBuffer());
      if (!bytes.length) return null;

      const cached = await placePhotoCache.put(placeId, bytes, attribution);

      // Persist stable proxy URL to database
      try {
        db.prepare(
          'UPDATE places SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE google_place_id = ? AND (image_url IS NULL OR image_url = \'\')'
        ).run(cached.photoUrl, placeId);
      } catch (dbErr) {
        console.error('Failed to persist photo URL to database:', dbErr);
      }

      return { filePath: cached.filePath, attribution };
    };

    // Prefer the Google photo (higher quality); if Google yields nothing, fall
    // back to the same coordinate-based Wikipedia/OSM lookup that right-click
    // places use. Coordinate-only ids skip Google entirely.
    if (!isCoordLookup) {
      const googlePhoto = await fetchGooglePhoto();
      if (googlePhoto) return googlePhoto;
    }

    const fallback = await fetchWikimediaFallback();
    if (fallback) return fallback;

    placePhotoCache.markError(placeId);
    return null;
    } finally {
      releasePhotoFetchSlot();
    }
  })();

  placePhotoCache.setInFlight(placeId, fetchPromise);

  const result = await fetchPromise;
  if (!result) throw Object.assign(new Error('No photo available'), { status: 404 });
  return { photoUrl: `/api/maps/place-photo/${encodeURIComponent(placeId)}/bytes`, attribution: result.attribution };
}

// ── Reverse geocoding ────────────────────────────────────────────────────────

export async function reverseGeocode(lat: string, lng: string, lang?: string): Promise<{ name: string | null; address: string | null }> {
  const params = new URLSearchParams({
    lat, lon: lng, format: 'json', addressdetails: '1', zoom: '18',
    'accept-language': toApiLang(lang),
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: { 'User-Agent': UA },
  });
  if (!response.ok) return { name: null, address: null };
  const data = await response.json() as { name?: string; display_name?: string; address?: Record<string, string> };
  const addr = data.address || {};
  const name = data.name || addr.tourism || addr.amenity || addr.shop || addr.building || addr.road || null;
  return { name, address: data.display_name || null };
}

// ── Resolve Google Maps URL ──────────────────────────────────────────────────

export async function resolveGoogleMapsUrl(url: string): Promise<{ lat: number; lng: number; name: string | null; address: string | null }> {
  let resolvedUrl = url;

  // Extract coordinates from a string (URL or page body). Google Maps encodes
  // them several ways: /@lat,lng,zoom · !3dlat!4dlng (map data param) · ?q=/?ll=.
  const extractCoords = (s: string): { lat: number; lng: number } | null => {
    const at = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) };
    const data = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (data) return { lat: parseFloat(data[1]), lng: parseFloat(data[2]) };
    const q = s.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) };
    return null;
  };

  const followRedirects = async (target: string, init?: RequestInit): Promise<Response> => {
    try {
      return await safeFetchFollow(
        target,
        { signal: AbortSignal.timeout(10000), ...init },
        { bypassInternalIpAllowed: true },
      );
    } catch (err) {
      if (err instanceof SsrfBlockedError) {
        throw Object.assign(new Error('URL blocked by SSRF check'), { status: 403 });
      }
      throw err;
    }
  };

  // Follow redirects for short URLs (goo.gl, maps.app.goo.gl) and for Google Maps
  // URLs that carry no inline coordinates — e.g. ?cid= links (the format
  // get_place_details returns) and "Share"-button links. The redirect target
  // usually carries the !3d!4d data param we can then parse. Redirects are
  // followed manually so every hop is SSRF-re-checked.
  const parsed = new URL(url);
  const GOOGLE_MAPS_HOSTS = ['goo.gl', 'maps.app.goo.gl', 'google.com', 'www.google.com', 'maps.google.com'];
  const isShort = ['goo.gl', 'maps.app.goo.gl'].includes(parsed.hostname);
  const isGoogleMaps = GOOGLE_MAPS_HOSTS.includes(parsed.hostname);
  if (isShort || (isGoogleMaps && !extractCoords(url))) {
    resolvedUrl = (await followRedirects(url)).url || resolvedUrl;
  }

  let coords = extractCoords(resolvedUrl);

  // Still nothing (e.g. a cid page whose final URL lacks coordinates): fetch the
  // page body once and parse the coordinates out of the embedded map data.
  if (!coords) {
    try {
      const pageRes = await followRedirects(resolvedUrl, {
        headers: { 'User-Agent': 'TREK-Travel-Planner/1.0' },
      });
      coords = extractCoords(await pageRes.text());
    } catch (err) {
      if ((err as { status?: number })?.status === 403) throw err; // SSRF block — surface it
      // Otherwise fall through to the not-found error below.
    }
  }

  // Extract place name from URL path: /place/Place+Name/@...
  let placeName: string | null = null;
  const placeMatch = resolvedUrl.match(/\/place\/([^/@]+)/);
  if (placeMatch) {
    placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
  }

  if (!coords || isNaN(coords.lat) || isNaN(coords.lng)) {
    throw Object.assign(new Error('Could not extract coordinates from URL'), { status: 400 });
  }
  const { lat, lng } = coords;

  // Reverse geocode to get address
  const nominatimRes = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    { headers: { 'User-Agent': 'TREK-Travel-Planner/1.0' }, signal: AbortSignal.timeout(8000) }
  );
  const nominatim = await nominatimRes.json() as { display_name?: string; name?: string; address?: Record<string, string> };

  const name = placeName || nominatim.name || nominatim.address?.tourism || nominatim.address?.building || null;
  const address = nominatim.display_name || null;

  return { lat, lng, name, address };
}
