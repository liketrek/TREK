import { Place } from '../../types';

import fs from 'fs';
import zlib from 'zlib';
import {
  assetPath,
  createFeatureSplitter,
  getCountryFromCoords,
  isPointInCountryBox,
  loadAdmin0Gz,
  pointInGeometry,
  type Box,
  type CompactGeom,
} from '../../utils/country-borders';
import { cacheKeyFor, getCached, nominatimFetch, setCached } from '../geo/nominatim.client';

// ── Pure geo machinery for the atlas domain ─────────────────────────────────
//
// Plain module on purpose (same class as maps.helpers.ts / tripAccess): no DI,
// no DB access, no Nest imports. The caches below (admin1 per-country store,
// geocode/region caches, the shared Nominatim throttle and the geocodingInFlight
// dedup set) are file-scoped so their lifetime stays process-global no matter how
// many AtlasService instances exist (container singleton + test helpers) —
// instance state would duplicate the multi-MB indexes the #1576 OOM fix exists
// to avoid and split the ≥1.1s Nominatim throttle.
// Relocated verbatim from the legacy services/atlasService.ts fold.

// The country lookup lives in utils/country-borders.ts, which the maps domain imports
// as well; it is re-exported here so its existing callers keep importing it from atlas-geo.
export { getCountryFromCoords, isPointInCountryBox };

// ── Bundled boundary GeoJSON (admin-0 countries + admin-1 regions) ─────────
//
// Where the bundles come from, the path they are read from, the admin-0 gz bytes and
// the country index built on them are in utils/country-borders.ts. The admin-1 half
// is below.
//
// Neither parsed bundle is cached. admin0 (~145MB) and admin1 (~260MB) parsed at once are
// what exhausted a 512MB host while using Atlas (#1576). Instead we retain only compact
// derivatives: the raw admin0 .gz bytes for direct serving, a Float64Array poly/box index
// for server-side point-in-polygon (see buildCountryIndexes in utils/country-borders.ts),
// and admin1 pre-split per country into ready-to-serve GeoJSON strings, built by
// streaming the gz so the full bundle is never materialised in one piece.

/** admin-0 country borders as gzipped GeoJSON bytes, served to the client map with
 *  Content-Encoding: gzip so the server never holds the parsed FeatureCollection. */
export function getCountryGeoGz(): Buffer | null {
  return loadAdmin0Gz();
}

/** Parsed admin-0 FeatureCollection, parsed on demand (not cached). Not on the client hot
 *  path — the map is served the gz bytes via getCountryGeoGz — but kept for internal/test
 *  callers that need the objects. */
export function getCountryGeo(): any {
  const gz = loadAdmin0Gz();
  if (!gz) return { type: 'FeatureCollection', features: [] };
  return JSON.parse(zlib.gunzipSync(gz).toString('utf8'));
}

export async function getRegionGeo(countryCodes: string[]): Promise<any> {
  const store = await getAdmin1Store();
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const code of countryCodes) {
    const c = code.toUpperCase();
    if (seen.has(c)) continue;
    seen.add(c);
    const s = store.get(c);
    if (s) parts.push(s);
  }
  if (parts.length === 0) return { type: 'FeatureCollection', features: [] };
  // Each stored value is that country's features as comma-joined GeoJSON text; wrap the
  // requested subset into one FeatureCollection and parse only that (per-viewport, small).
  return JSON.parse(`{"type":"FeatureCollection","features":[${parts.join(',')}]}`);
}

// admin1 regions, pre-split per ISO_A2 into comma-joined feature text. Built once by
// streaming the gz through a brace-depth splitter that emits one Feature at a time, so the
// ~260MB full parse never happens (it OOMs a 512MB host). Concurrent first-callers share
// one in-flight build via admin1Building.
let admin1Store: Map<string, string> | null = null;
let admin1Building: Promise<Map<string, string>> | null = null;

function getAdmin1Store(): Promise<Map<string, string>> {
  if (admin1Store) return Promise.resolve(admin1Store);
  // `=== null`, not `!admin1Building`: a Promise in a boolean condition is what
  // no-misused-promises/checksConditionals exists to catch, and the distinction
  // matters once every DB-touching method returns one.
  if (admin1Building === null) {
    admin1Building = buildAdmin1Store().then((s) => {
      admin1Store = s;
      admin1Building = null;
      return s;
    });
  }
  return admin1Building;
}

function buildAdmin1Store(): Promise<Map<string, string>> {
  const file = assetPath('admin1');
  if (!fs.existsSync(file)) {
    console.warn(`[Atlas] admin1.geojson.gz missing — run \`node scripts/build-atlas-geo.mjs\``);
    return Promise.resolve(new Map());
  }
  // Concatenate each country's features straight into the store as we stream, rather than
  // collecting arrays and joining at the end (that doubling, plus the source bundle's
  // whitespace, peaked high enough to OOM a 512MB host on the first build). Re-serialising
  // each feature via JSON drops the source formatting (~114MB → ~68MB retained) and the
  // parse/stringify garbage is per-feature and short-lived.
  const store = new Map<string, string>();
  const split = createFeatureSplitter((text) => {
    const f = JSON.parse(text);
    const code = f.properties?.iso_a2?.toUpperCase();
    if (!code) return; // features with a null iso_a2 are skipped, matching the old filter
    const compact = JSON.stringify(f);
    const prev = store.get(code);
    store.set(code, prev ? prev + ',' + compact : compact);
  });
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(zlib.createGunzip())
      .on('data', (chunk: Buffer) => split(chunk.toString('utf8')))
      .on('end', () => {
        console.log(`[Atlas] Indexed admin1 GeoJSON: ${store.size} countries`);
        resolve(store);
      })
      .on('error', reject);
  });
}

// ── Country names, for the address fallback ─────────────────────────────────

export const NAME_TO_CODE: Record<string, string> = {
  germany: 'DE',
  deutschland: 'DE',
  france: 'FR',
  frankreich: 'FR',
  spain: 'ES',
  spanien: 'ES',
  italy: 'IT',
  italien: 'IT',
  'united kingdom': 'GB',
  uk: 'GB',
  england: 'GB',
  'united states': 'US',
  usa: 'US',
  netherlands: 'NL',
  niederlande: 'NL',
  austria: 'AT',
  osterreich: 'AT',
  switzerland: 'CH',
  schweiz: 'CH',
  portugal: 'PT',
  greece: 'GR',
  griechenland: 'GR',
  turkey: 'TR',
  turkei: 'TR',
  croatia: 'HR',
  kroatien: 'HR',
  'czech republic': 'CZ',
  tschechien: 'CZ',
  czechia: 'CZ',
  poland: 'PL',
  polen: 'PL',
  sweden: 'SE',
  schweden: 'SE',
  norway: 'NO',
  norwegen: 'NO',
  denmark: 'DK',
  danemark: 'DK',
  finland: 'FI',
  finnland: 'FI',
  belgium: 'BE',
  belgien: 'BE',
  ireland: 'IE',
  irland: 'IE',
  hungary: 'HU',
  ungarn: 'HU',
  romania: 'RO',
  rumanien: 'RO',
  bulgaria: 'BG',
  bulgarien: 'BG',
  japan: 'JP',
  china: 'CN',
  australia: 'AU',
  australien: 'AU',
  canada: 'CA',
  kanada: 'CA',
  mexico: 'MX',
  mexiko: 'MX',
  brazil: 'BR',
  brasilien: 'BR',
  argentina: 'AR',
  argentinien: 'AR',
  thailand: 'TH',
  indonesia: 'ID',
  indonesien: 'ID',
  india: 'IN',
  indien: 'IN',
  egypt: 'EG',
  agypten: 'EG',
  morocco: 'MA',
  marokko: 'MA',
  'south africa': 'ZA',
  sudafrika: 'ZA',
  'new zealand': 'NZ',
  neuseeland: 'NZ',
  iceland: 'IS',
  island: 'IS',
  luxembourg: 'LU',
  luxemburg: 'LU',
  slovenia: 'SI',
  slowenien: 'SI',
  slovakia: 'SK',
  slowakei: 'SK',
  estonia: 'EE',
  estland: 'EE',
  latvia: 'LV',
  lettland: 'LV',
  lithuania: 'LT',
  litauen: 'LT',
  serbia: 'RS',
  serbien: 'RS',
  israel: 'IL',
  russia: 'RU',
  russland: 'RU',
  ukraine: 'UA',
  vietnam: 'VN',
  'south korea': 'KR',
  sudkorea: 'KR',
  philippines: 'PH',
  philippinen: 'PH',
  malaysia: 'MY',
  colombia: 'CO',
  kolumbien: 'CO',
  peru: 'PE',
  chile: 'CL',
  iran: 'IR',
  iraq: 'IQ',
  irak: 'IQ',
  pakistan: 'PK',
  kenya: 'KE',
  kenia: 'KE',
  nigeria: 'NG',
  'saudi arabia': 'SA',
  'saudi-arabien': 'SA',
  albania: 'AL',
  albanien: 'AL',
  georgia: 'GE',
  georgien: 'GE',
  montenegro: 'ME',
  'north macedonia': 'MK',
  nordmazedonien: 'MK',
  macedonia: 'MK',
  bosnia: 'BA',
  'bosnia and herzegovina': 'BA',
  bosnien: 'BA',
  kosovo: 'XK',
  cyprus: 'CY',
  zypern: 'CY',
  malta: 'MT',
  tunisia: 'TN',
  tunesien: 'TN',
  jordan: 'JO',
  jordanien: 'JO',
  lebanon: 'LB',
  libanon: 'LB',
  ghana: 'GH',
  ethiopia: 'ET',
  athiopien: 'ET',
  tanzania: 'TZ',
  uganda: 'UG',
  singapore: 'SG',
  taiwan: 'TW',
  nepal: 'NP',
  'sri lanka': 'LK',
  cambodia: 'KH',
  kambodscha: 'KH',
  myanmar: 'MM',
  burma: 'MM',
  laos: 'LA',
  mongolia: 'MN',
  mongolei: 'MN',
  kazakhstan: 'KZ',
  kasachstan: 'KZ',
  uzbekistan: 'UZ',
  usbekistan: 'UZ',
  kyrgyzstan: 'KG',
  kirgisistan: 'KG',
  tajikistan: 'TJ',
  tadschikistan: 'TJ',
  turkmenistan: 'TM',
  'costa rica': 'CR',
  panama: 'PA',
  ecuador: 'EC',
  uruguay: 'UY',
  cuba: 'CU',
  kuba: 'CU',
  'dominican republic': 'DO',
  'dominikanische republik': 'DO',
  jamaica: 'JM',
  haiti: 'HT',
  honduras: 'HN',
  guatemala: 'GT',
  'el salvador': 'SV',
  nicaragua: 'NI',
  bolivia: 'BO',
  'bolivia plurinational state of': 'BO',
  paraguay: 'PY',
  venezuela: 'VE',
  'trinidad and tobago': 'TT',
  trinidad: 'TT',
  oman: 'OM',
  kuwait: 'KW',
  qatar: 'QA',
  bahrain: 'BH',
  syria: 'SY',
  syrien: 'SY',
  yemen: 'YE',
  jemen: 'YE',
  palestine: 'PS',
  palastina: 'PS',
  moldova: 'MD',
  'republic of moldova': 'MD',
  moldawien: 'MD',
  libya: 'LY',
  libyen: 'LY',
  sudan: 'SD',
  eritrea: 'ER',
  djibouti: 'DJ',
  senegal: 'SN',
  cameroon: 'CM',
  kamerun: 'CM',
  'ivory coast': 'CI',
  "cote d'ivoire": 'CI',
  mali: 'ML',
  niger: 'NE',
  'burkina faso': 'BF',
  togo: 'TG',
  benin: 'BJ',
  guinea: 'GN',
  'dr congo': 'CD',
  'democratic republic of the congo': 'CD',
  'republic of the congo': 'CG',
  congo: 'CG',
  angola: 'AO',
  namibia: 'NA',
  botswana: 'BW',
  zimbabwe: 'ZW',
  zambia: 'ZM',
  malawi: 'MW',
  mozambique: 'MZ',
  mozambik: 'MZ',
  madagascar: 'MG',
  rwanda: 'RW',
  burundi: 'BI',
  somalia: 'SO',
  'papua new guinea': 'PG',
  brunei: 'BN',
  'hong kong': 'HK',
  'hong kong sar': 'HK',
  macau: 'MO',
  macao: 'MO',
  'macau sar': 'MO',
  'san marino': 'SM',
  vatican: 'VA',
  'vatican city': 'VA',
  'holy see': 'VA',
  monaco: 'MC',
  liechtenstein: 'LI',
  gibraltar: 'GI',
  'puerto rico': 'PR',
};

// ── Geocoding helpers ───────────────────────────────────────────────────────

export async function reverseGeocodeCountry(lat: number, lng: number): Promise<string | null> {
  const key = cacheKeyFor(lat, lng, 'country');
  const hit = getCached<string | null>(key);
  if (hit !== undefined) return hit;
  try {
    const res = await nominatimFetch(
      'reverse',
      new URLSearchParams({ lat: String(lat), lon: String(lng), format: 'json', zoom: '3', 'accept-language': 'en' }),
      { lane: 'background', timeoutMs: 10_000 },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: { country_code?: string } };
    const code = data.address?.country_code?.toUpperCase() || null;
    setCached(key, code);
    return code;
  } catch {
    return null;
  }
}

// ── Region geometry, for the ring test in utils/country-borders.ts ──────────

// Flatten a GeoJSON Polygon/MultiPolygon into the same compact form the country index uses,
// plus one bounding box per part (a part-box, like buildCountryIndexes builds, so an
// archipelago-style region — Illes Balears, Canarias, … — gets one tight box per island
// group rather than one box spanning the whole span between them). Used to resolve admin1
// regions against the bundle, which are parsed per country on demand rather than held whole.
function compactGeomFromGeometry(geometry: { type: string; coordinates: unknown }): { geom: CompactGeom; boxes: Box[] } {
  const parts = (geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates) as number[][][][];
  const rings: Float64Array[] = [];
  const polyRingCounts: number[] = [];
  const boxes: Box[] = [];
  for (const part of parts) {
    polyRingCounts.push(part.length);
    for (const ring of part) {
      const flat = new Float64Array(ring.length * 2);
      for (let i = 0; i < ring.length; i++) {
        flat[2 * i] = ring[i][0];
        flat[2 * i + 1] = ring[i][1];
      }
      rings.push(flat);
    }
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    for (const [lng, lat] of part[0]) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    boxes.push([minLng, minLat, maxLng, maxLat]);
  }
  return { geom: { rings, polyRingCounts }, boxes };
}

/**
 * `allowBareCode` decides whether a trailing two-letter uppercase segment counts as
 * a country. It only does when the caller can sanity-check the answer against
 * coordinates, because that segment is far more often a state or province than a
 * country: "…, New York, NY", "…, Toronto, ON". Half of those abbreviations are
 * real ISO codes as well (CA, DE, LA, IN, MD, GA, PA, VA), so a list of valid
 * country codes does not separate them, and the other half are codes for nothing
 * at all, which used to inflate the Atlas country count with places that could
 * never appear on the map or in the continent bars (#2111).
 */
export function getCountryFromAddress(address: string | null, allowBareCode = true): string | null {
  if (!address) return null;
  const parts = address
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const last = parts[parts.length - 1];
  const normalized = last.toLowerCase();
  if (NAME_TO_CODE[normalized]) return NAME_TO_CODE[normalized];
  if (NAME_TO_CODE[last]) return NAME_TO_CODE[last];
  if (allowBareCode && last.length === 2 && last === last.toUpperCase()) return last;
  return null;
}

// ── Resolve a place to a country code (bbox -> address -> geocode) ──────────
//
// Coordinates are tried FIRST and, when they resolve, trusted outright — getCountryFromCoords
// is a real point-in-polygon test against the same borders the map renders. Address parsing
// is only a fallback. It used to run first, but its "2-letter uppercase last segment = ISO
// code" heuristic collides with US state abbreviations that are ALSO real ISO country codes
// (DE=Germany, GA=Georgia, IN=India, LA=Laos, MA=Morocco, MO=Macau, PA=Panama, VA=Vatican,
// CA=Canada, ...) — a place stored as "..., San Francisco, CA" resolved to Canada, not the
// United States, whenever address ran first. When coordinates are present but didn't resolve
// to any country, the address result is sanity-gated against that country's own admin0
// bounding box (isPointInCountryBox) before being trusted — the same guard the region-level
// address fallback uses. A place with no coordinates at all has nothing to gate against, so
// it does not get the bare-code branch at all (#2111): a spelled-out country name still
// resolves there, a lone "NY" or "CA" no longer does. Guessing produced both phantom
// countries that nothing downstream could draw and confidently wrong ones.
async function resolveCountryCode(place: Place): Promise<string | null> {
  const hasCoords = !!(place.lat && place.lng);
  if (hasCoords) {
    const fromCoords = getCountryFromCoords(place.lat!, place.lng!);
    if (fromCoords) return fromCoords;
  }
  const fromAddress = getCountryFromAddress(place.address, hasCoords);
  if (fromAddress && (!hasCoords || isPointInCountryBox(fromAddress, place.lat!, place.lng!))) {
    return fromAddress;
  }
  if (hasCoords) {
    return await reverseGeocodeCountry(place.lat!, place.lng!);
  }
  return null;
}

export function resolveCountryCodeSync(place: Pick<Place, 'lat' | 'lng' | 'address'>): string | null {
  const hasCoords = !!(place.lat && place.lng);
  if (hasCoords) {
    const fromCoords = getCountryFromCoords(place.lat!, place.lng!);
    if (fromCoords) return fromCoords;
  }
  const fromAddress = getCountryFromAddress(place.address, hasCoords);
  if (fromAddress && (!hasCoords || isPointInCountryBox(fromAddress, place.lat!, place.lng!))) {
    return fromAddress;
  }
  return null;
}

// ── Sub-national region resolution ────────────────────────────────────────

export interface RegionInfo {
  country_code: string;
  region_code: string;
  region_name: string;
}

// Tracks place IDs currently being geocoded in the background to prevent duplicate enqueuing.
// Exported so AtlasService's background-geocode loops (container + bridge instances) share
// one dedup set.
export const geocodingInFlight = new Set<number>();

const regionCache = new Map<string, RegionInfo | null>();

// ── Point-in-polygon over the bundled admin1 regions ────────────────────────
//
// Nominatim's reverse-geocode address levels (province, autonomous community, borough, …)
// don't line up with whatever granularity geoBoundaries ships per country — e.g. Nominatim
// gives Barcelona the *province* code ES-B while the bundle only has the *autonomous-
// community* level (Catalonia), and Belgium/Italy's bundle only has a handful of top-level
// regions while Nominatim returns provinces. Comparing those codes/names (even accent/dash-
// normalized) can never match because they name different levels of subdivision. Resolving
// the place's own lat/lng directly against the SAME polygons the client renders — like
// getCountryFromCoords does for admin0 (#1331) — sidesteps the whole class of bug: the
// stored region_code/region_name are then guaranteed to equal a bundle feature.
//
// The admin1 bundle is streamed and held as per-country GeoJSON text (never parsed whole,
// #1576), so a country's region features are parsed and flattened to CompactGeom on first
// use and cached — only visited countries ever pay the parse.
type RegionFeature = { code: string; name: string; nameEn: string; geom: CompactGeom; boxes: Box[] };
const regionFeatureCache = new Map<string, RegionFeature[]>();

async function getRegionFeatures(countryCode: string): Promise<RegionFeature[]> {
  const cc = countryCode.toUpperCase();
  const cached = regionFeatureCache.get(cc);
  if (cached) return cached;
  const store = await getAdmin1Store();
  const text = store.get(cc);
  if (!text) {
    regionFeatureCache.set(cc, []);
    return [];
  }
  let features: { properties?: Record<string, string>; geometry?: { type: string; coordinates: unknown } }[];
  try {
    features = JSON.parse(`{"type":"FeatureCollection","features":[${text}]}`).features ?? [];
  } catch {
    regionFeatureCache.set(cc, []);
    return [];
  }
  const out: RegionFeature[] = [];
  for (const f of features) {
    const code = f.properties?.iso_3166_2;
    if (!code || !f.geometry) continue;
    const { geom, boxes } = compactGeomFromGeometry(f.geometry);
    out.push({
      code,
      name: f.properties?.name || code,
      nameEn: f.properties?.name_en || f.properties?.name || code,
      geom,
      boxes,
    });
  }
  regionFeatureCache.set(cc, out);
  return out;
}

// Resolve (lat,lng) to a bundled admin1 region within the given country, smallest
// matching-part-first (mirroring getCountryFromCoords' candidate ranking) so a point near
// a shared border prefers the tighter-fitting candidate. Returns null when the country has
// no admin1 coverage in the bundle or the point falls outside every polygon (simplification
// gaps at coastlines, etc.) — callers should fall back to reverse geocoding.
export async function getRegionFromCoords(countryCode: string, lat: number, lng: number): Promise<RegionInfo | null> {
  const features = await getRegionFeatures(countryCode);
  if (features.length === 0) return null;
  const candidates: { f: RegionFeature; area: number }[] = [];
  for (const f of features) {
    for (const [minLng, minLat, maxLng, maxLat] of f.boxes) {
      if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
        candidates.push({ f, area: (maxLng - minLng) * (maxLat - minLat) });
        break;
      }
    }
  }
  candidates.sort((a, b) => a.area - b.area);
  for (const { f } of candidates) {
    if (pointInGeometry(lng, lat, f.geom)) {
      return { country_code: countryCode.toUpperCase(), region_code: f.code, region_name: f.nameEn || f.name };
    }
  }
  return null;
}

// Returns the OSM address object, {} for an "ok but empty" response (so it is cached as
// a definitive miss), or null for a transient failure (so it is retried next time).
async function fetchNominatimAddress(lat: number, lng: number, zoom: number): Promise<Record<string, string> | null> {
  try {
    const res = await nominatimFetch(
      'reverse',
      new URLSearchParams({ lat: String(lat), lon: String(lng), format: 'json', zoom: String(zoom), 'accept-language': 'en' }),
      { lane: 'background', timeoutMs: 10_000 },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: Record<string, string> };
    return data.address ?? {};
  } catch {
    return null;
  }
}

function buildRegionInfo(address: Record<string, string>, preferFinest: boolean): RegionInfo | null {
  const countryCode = address.country_code?.toUpperCase() || null;
  // Coarse path (almost every country) lands on the admin-1 level that matches Natural
  // Earth directly; the finest path is used only to rescue codes that are too broad.
  let regionCode = preferFinest
    ? address['ISO3166-2-lvl8'] ||
      address['ISO3166-2-lvl7'] ||
      address['ISO3166-2-lvl6'] ||
      address['ISO3166-2-lvl5'] ||
      null
    : address['ISO3166-2-lvl6'] || address['ISO3166-2-lvl5'] || address['ISO3166-2-lvl4'] || null;
  // Normalize: FR-75C → FR-75 (strip trailing letter suffixes for GeoJSON compatibility)
  if (regionCode && /^[A-Z]{2}-\d+[A-Z]$/i.test(regionCode)) {
    regionCode = regionCode.replace(/[A-Z]$/i, '');
  }
  const regionName = preferFinest
    ? address.city ||
      address.county ||
      address.state_district ||
      address.borough ||
      address.state ||
      address.province ||
      address.region ||
      null
    : address.state || address.province || address.region || address.county || address.city || null;
  if (!countryCode || !regionName) return null;
  return {
    country_code: countryCode,
    region_code: regionCode || `${countryCode}-${regionName.substring(0, 3).toUpperCase()}`,
    region_name: regionName,
  };
}

/**
 * The offline half of reverseGeocodeRegion: the bundled admin1 polygons, then the
 * box-gated address fallback. Null when the bundle has no answer for the point, which
 * is where reverseGeocodeRegion goes on to ask Nominatim. Deterministic and uncached,
 * so it is also what the one time place_regions repair re-derives rows with (#2527).
 */
export async function resolveRegionFromBundle(lat: number, lng: number, placeAddress?: string | null): Promise<RegionInfo | null> {
  // Prefer resolving directly against the bundled polygons: offline, deterministic, and —
  // unlike Nominatim's address levels — guaranteed to match a feature the client can
  // actually highlight. Falls through to reverse geocoding when the country has no admin1
  // coverage or the point lands outside every polygon.
  const coordCountry = getCountryFromCoords(lat, lng);
  if (coordCountry) {
    const fromBundle = await getRegionFromCoords(coordCountry, lat, lng);
    if (fromBundle) return fromBundle;
  }
  // The coordinate-only lookup found no matching region — either no country polygon contains
  // the point, or a simplified admin0 border put it in the WRONG country (a place on the
  // Luxembourg side of the Sauer river fell inside Germany's simplified box). Retry against
  // the place's own stored address, the same order resolveCountryCode(Sync) uses for country
  // resolution — but only as a fallback: trusting it FIRST regressed places whose address
  // ends in a US state abbreviation that collides with a real ISO code (e.g. "...CA" parsed
  // as Canada instead of California), which coordinates alone already resolve correctly.
  //
  // Sanity-gate the address country against its own admin0 BOX (not the tighter polygon —
  // the Luxembourg case needs a country whose exact border misses this very point) before
  // trusting a region match in it.
  const addressCountry = getCountryFromAddress(placeAddress ?? null);
  if (addressCountry && addressCountry !== coordCountry && isPointInCountryBox(addressCountry, lat, lng)) {
    return getRegionFromCoords(addressCountry, lat, lng);
  }
  return null;
}

export async function reverseGeocodeRegion(lat: number, lng: number, placeAddress?: string | null): Promise<RegionInfo | null> {
  // The address takes part in the answer only through the country it names, so that
  // country is part of the key. Keyed by coordinates alone, a place whose address was
  // corrected on a border point got the old answer back from memory (#2527).
  const key = `${cacheKeyFor(lat, lng, 'region')}|${getCountryFromAddress(placeAddress ?? null) ?? ''}`;
  if (regionCache.has(key)) return regionCache.get(key)!;

  const fromBundle = await resolveRegionFromBundle(lat, lng, placeAddress);
  if (fromBundle) {
    regionCache.set(key, fromBundle);
    return fromBundle;
  }

  // Only reached when the bundle's own polygons for this country don't cover the point at
  // all (coastal/simplification gaps) — a genuinely rare miss. Nominatim's coarse address
  // level (state/province) is what the bundle carries for most countries; GB is the
  // exception and ships at county/borough level (#1974), which is also what its old
  // Natural Earth polygons had.
  const address = await fetchNominatimAddress(lat, lng, 8);
  if (!address) return null; // transient failure — leave uncached so a later call retries
  const info = buildRegionInfo(address, false);
  regionCache.set(key, info);
  return info;
}
