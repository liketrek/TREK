import { db } from '../db/database';
import { Trip, Place } from '../types';
import { CONTINENT_MAP } from '@trek/shared';

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// ── Bundled boundary GeoJSON (admin-0 countries + admin-1 regions) ─────────
//
// Sourced from geoBoundaries (CC BY 4.0), normalized + quantized offline by
// scripts/build-atlas-geo.mjs into gzipped FeatureCollections under server/assets.
// They are read + decompressed once and cached in memory — no network at runtime.
// (Replaces the previous runtime fetch of Natural Earth, which was stale for recent
// sub-national reforms and depicts some contested borders in unwanted ways.)
//
// __dirname is server/dist/services at runtime and server/src/services under vitest;
// both resolve ../../assets to server/assets.

// Neither parsed bundle is cached. admin0 (~145MB) and admin1 (~260MB) parsed at once are
// what exhausted a 512MB host while using Atlas (#1576). Instead we retain only compact
// derivatives: the raw admin0 .gz bytes for direct serving, a Float64Array poly/box index
// for server-side point-in-polygon (see buildCountryIndexes), and admin1 pre-split per
// country into ready-to-serve GeoJSON strings, built by streaming the gz so the full
// bundle is never materialised in one piece.

function assetPath(name: 'admin0' | 'admin1'): string {
  return path.join(__dirname, '..', '..', 'assets', 'atlas', `${name}.geojson.gz`);
}

let admin0Gz: Buffer | null | undefined;
function loadAdmin0Gz(): Buffer | null {
  if (admin0Gz !== undefined) return admin0Gz;
  const file = assetPath('admin0');
  if (!fs.existsSync(file)) {
    console.warn(`[Atlas] admin0.geojson.gz missing — run \`node scripts/build-atlas-geo.mjs\``);
    return (admin0Gz = null);
  }
  return (admin0Gz = fs.readFileSync(file));
}

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
  if (!admin1Building) {
    admin1Building = buildAdmin1Store().then((s) => {
      admin1Store = s;
      admin1Building = null;
      return s;
    });
  }
  return admin1Building;
}

// Feed arbitrary gunzip chunks; invokes onFeature(text) once per top-level Feature object
// inside "features":[ … ]. `pending` holds only the unconsumed tail (at most one partial
// feature + the current chunk), keeping memory flat regardless of bundle size.
function createFeatureSplitter(onFeature: (text: string) => void): (chunk: string) => void {
  let pending = '';
  let started = false;
  // Scan progress is carried across chunks so each character is examined exactly once.
  // A large Feature (e.g. Canada, ~5.5MB) spans hundreds of gunzip chunks; re-scanning the
  // accumulated partial from the start on every chunk was O(n²) per feature and pushed the
  // one-time admin1 build past the 15s test timeout under coverage/CI (#1576-followup).
  let scanning = false; // currently inside a Feature object?
  let depth = 0,
    inStr = false,
    esc = false;
  let scanPos = 0,
    featStart = 0; // resume point + current feature start, in `pending`
  return (chunk: string) => {
    pending += chunk;
    if (!started) {
      const fi = pending.indexOf('"features"');
      if (fi === -1) return;
      const br = pending.indexOf('[', fi);
      if (br === -1) return;
      pending = pending.slice(br + 1);
      started = true;
      scanPos = 0;
    }
    const n = pending.length;
    while (scanPos < n) {
      if (!scanning) {
        const c = pending[scanPos];
        if (c === ' ' || c === '\n' || c === '\r' || c === '\t' || c === ',') {
          scanPos++;
          continue;
        }
        if (c === ']') {
          scanPos = n;
          break;
        }
        if (c !== '{') {
          scanPos++;
          continue;
        }
        scanning = true;
        depth = 0;
        inStr = false;
        esc = false;
        featStart = scanPos;
      }
      let end = -1;
      for (let j = scanPos; j < n; j++) {
        const c = pending[j];
        if (inStr) {
          if (esc) esc = false;
          else if (c === '\\') esc = true;
          else if (c === '"') inStr = false;
        } else if (c === '"') inStr = true;
        else if (c === '{') depth++;
        else if (c === '}') {
          if (--depth === 0) {
            end = j + 1;
            scanPos = j + 1;
            break;
          }
        }
      }
      if (end === -1) {
        scanPos = n;
        break;
      } // partial feature — resume from n next chunk
      onFeature(pending.slice(featStart, end));
      scanning = false;
    }
    // Drop the fully-consumed prefix, keeping at most the current partial feature.
    const keepFrom = scanning ? featStart : scanPos;
    if (keepFrom > 0) {
      pending = pending.slice(keepFrom);
      scanPos -= keepFrom;
      if (scanning) featStart -= keepFrom;
    }
  };
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

// ── Geocode cache ───────────────────────────────────────────────────────────

const geocodeCache = new Map<string, string | null>();

function roundKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function cacheKey(lat: number, lng: number): string {
  return roundKey(lat, lng);
}

export function getCached(lat: number, lng: number): string | null | undefined {
  const key = cacheKey(lat, lng);
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;
  return undefined;
}

export function setCache(lat: number, lng: number, code: string | null): void {
  geocodeCache.set(cacheKey(lat, lng), code);
}

// Periodically trim the cache so it doesn't grow unbounded
const CACHE_MAX = 50_000;
const CACHE_CLEANUP_MS = 10 * 60 * 1000;
setInterval(() => {
  if (geocodeCache.size > CACHE_MAX) {
    const keys = [...geocodeCache.keys()];
    const toDelete = keys.slice(0, keys.length - CACHE_MAX);
    for (const k of toDelete) geocodeCache.delete(k);
  }
}, CACHE_CLEANUP_MS).unref();

// ── Bounding-box lookup tables ──────────────────────────────────────────────

// Territories that have their own ISO code but no admin0 polygon in the bundle.
// Without a polygon they can't be point-in-polygon tested, so they rely purely on
// their box and win via the smallest-box tie-break in getCountryFromCoords()
// (e.g. Hong Kong/Macau over China, Gibraltar over Spain).
const MICRO_TERRITORY_BOXES: Record<string, [number, number, number, number]> = {
  HK: [113.83, 22.15, 114.43, 22.56],
  MO: [113.53, 22.1, 113.6, 22.21],
  GI: [-5.36, 36.11, -5.33, 36.16],
  PR: [-67.3, 17.88, -65.22, 18.53],
  PS: [34.2, 29.5, 35.6, 32.6],
  XK: [20.0, 41.9, 21.8, 43.3],
};

// A polygon-less micro-territory box only auto-wins the smallest-box tie-break when it is
// TIGHT around the enclave. HK(0.25°²), MO(0.008), GI(0.0015) and PR(1.35) hug their
// territory, so a point inside them really is in that territory. PS(4.34) and XK(2.52) are
// loose regional rectangles that sprawl across a sovereign neighbour (PS over Israel, XK
// over North Macedonia) — a point there usually belongs to the neighbour, so those boxes
// must NOT auto-win; they defer to the neighbour's real polygon first (see #1490-class fix
// below). This threshold sits between PR and XK.
const MICRO_BOX_MAX_AREA = 2.0;

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

let lastNominatimCall = 0;

// Shared throttle: enforces ≥1.1s between any Nominatim request, across all callers.
async function throttleNominatim() {
  const elapsed = Date.now() - lastNominatimCall;
  if (elapsed < 1100) await new Promise((r) => setTimeout(r, 1100 - elapsed));
  lastNominatimCall = Date.now();
}

export async function reverseGeocodeCountry(lat: number, lng: number): Promise<string | null> {
  const key = roundKey(lat, lng);
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;
  await throttleNominatim();
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=3&accept-language=en`,
      {
        headers: { 'User-Agent': 'TREK Travel Planner (https://github.com/liketrek/TREK)' },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: { country_code?: string } };
    const code = data.address?.country_code?.toUpperCase() || null;
    geocodeCache.set(key, code);
    return code;
  } catch {
    return null;
  }
}

// ── Point-in-polygon over the bundled admin0 borders (#1331) ─────────────────

// Ray-casting (even-odd) test of (lng,lat) against a single GeoJSON ring.
// Ray-cast on a flat [lng,lat,lng,lat,…] ring. Same algorithm as the classic number[][]
// version, but the coordinates live in a Float64Array so the parsed admin0 geometry (with
// its millions of tiny [lng,lat] arrays, ~145MB) need not be retained — only these rings.
function pointInFlatRing(lng: number, lat: number, ring: Float64Array): boolean {
  let inside = false;
  const n = ring.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[2 * i],
      yi = ring[2 * i + 1];
    const xj = ring[2 * j],
      yj = ring[2 * j + 1];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// True when (lng,lat) falls inside a compact Polygon/MultiPolygon, honouring holes.
// `rings` is every ring flattened; `polyRingCounts[k]` is how many rings polygon k owns
// (its first ring is the outer boundary, the rest are holes).
function pointInGeometry(lng: number, lat: number, geom: CompactGeom): boolean {
  let ri = 0;
  for (const rc of geom.polyRingCounts) {
    if (pointInFlatRing(lng, lat, geom.rings[ri])) {
      let inHole = false;
      for (let h = 1; h < rc; h++) {
        if (pointInFlatRing(lng, lat, geom.rings[ri + h])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
    ri += rc;
  }
  return false;
}

// Compact polygon geometry: rings flattened into Float64Arrays, grouped into polygons by
// polyRingCounts. Replaces the retained parsed GeoJSON geometry.
type CompactGeom = { rings: Float64Array[]; polyRingCounts: number[] };
type Box = [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]

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

// ISO_A2 → compact admin0 geometry + bounding boxes, derived from the bundled admin0
// borders on first use. The parsed FeatureCollection is dropped after this runs; only the
// Float64Array rings and boxes are retained (≈1MB vs the ≈145MB parsed geometry, #1576).
//
// The boxes used to be a hand-maintained table, which drifted: 43 countries (NG, BY,
// GL, KP, TD, SS, …) had no box at all, so their coordinates fell into a *neighbour's*
// box instead and resolved to the wrong country — Lagos came out as Benin, Minsk as
// Russia (#1490). Deriving them from the same polygons we already ship keeps the two
// in lockstep and can't drift again.
//
// One box is stored PER GEOMETRY PART, not per country. A single box around a country
// that straddles the antimeridian (RU, US, FJ, KI) would span nearly the whole globe;
// per-part boxes keep Alaska and Chukotka separate and handle the ±180 wrap for free.
let countryPolyIndex: Map<string, CompactGeom> | null = null;
let countryBoxIndex: Map<string, Box[]> | null = null;

function buildCountryIndexes(): void {
  const polys = new Map<string, CompactGeom>();
  const boxes = new Map<string, Box[]>();

  const gz = loadAdmin0Gz();
  if (gz) {
    // Parse ONE feature at a time off the gunzipped string rather than JSON.parse-ing the
    // whole FeatureCollection: the full parse transiently allocates ~285MB (the 145MB
    // object graph plus intermediates) and V8 keeps those pages, which alone exhausts a
    // 512MB host before admin1 even loads (#1576).
    const json = zlib.gunzipSync(gz).toString('utf8');
    const consume = createFeatureSplitter((text) => {
      const f = JSON.parse(text);
      const raw = f.properties?.ISO_A2;
      if (!raw || raw === '-99' || !f.geometry) return;
      const code = String(raw).toUpperCase();

      const parts = (
        f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
      ) as number[][][][];
      const rings: Float64Array[] = [];
      const polyRingCounts: number[] = [];
      const codeBoxes = boxes.get(code) ?? [];
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
        // Bounding box from the part's outer ring (part[0]).
        let minLng = Infinity,
          minLat = Infinity,
          maxLng = -Infinity,
          maxLat = -Infinity;
        for (const [lng, lat] of part[0]) {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
        codeBoxes.push([minLng, minLat, maxLng, maxLat]);
      }
      // Matches the previous index exactly: geometry is overwritten (last feature for a
      // code wins) while boxes accumulate across a code's features.
      polys.set(code, { rings, polyRingCounts });
      boxes.set(code, codeBoxes);
    });
    consume(json);
  }

  // Micro-territories aren't in admin0 — give them their box, but no polygon.
  for (const [code, box] of Object.entries(MICRO_TERRITORY_BOXES)) {
    if (!boxes.has(code)) boxes.set(code, [box]);
  }

  countryPolyIndex = polys;
  countryBoxIndex = boxes;
}

function getCountryPolyIndex(): Map<string, CompactGeom> {
  if (!countryPolyIndex) buildCountryIndexes();
  return countryPolyIndex!;
}

function getCountryBoxIndex(): Map<string, Box[]> {
  if (!countryBoxIndex) buildCountryIndexes();
  return countryBoxIndex!;
}

// Broad sanity check — is (lat,lng) anywhere within the country's own admin0 bounding
// box(es)? Deliberately looser than the polygon test in getCountryFromCoords: a genuine
// border-simplification miss (a point just outside the exact border) still needs to pass
// this, so it only rejects a country that isn't even in the right part of the globe. Used
// to gate the address-derived fallback in both country and region resolution.
export function isPointInCountryBox(countryCode: string, lat: number, lng: number): boolean {
  const boxes = getCountryBoxIndex().get(countryCode.toUpperCase());
  if (!boxes) return false;
  return boxes.some(([minLng, minLat, maxLng, maxLat]) => lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng);
}

export function getCountryFromCoords(lat: number, lng: number): string | null {
  // Cheap prefilter: every country with a part-box containing the point. Keep the
  // area of the matching part so overlapping candidates can be ranked below.
  const candidates: { code: string; area: number }[] = [];
  for (const [code, boxes] of getCountryBoxIndex()) {
    for (const [minLng, minLat, maxLng, maxLat] of boxes) {
      if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
        candidates.push({ code, area: (maxLng - minLng) * (maxLat - minLat) });
        break;
      }
    }
  }
  if (candidates.length === 0) return null;

  // Boxes overlap near borders, so a point can sit in several — picking the smallest
  // box alone mis-assigns a point just across the border (#1331). Disambiguate with
  // the real admin0 polygon: try candidates smallest-box-first and return the one whose
  // polygon actually contains the point. A candidate with no polygon (a micro-territory
  // like HK/MO/GI) keeps the smallest-box win — but only when its box is tight enough to
  // trust (MICRO_BOX_MAX_AREA); a loose regional box (PS/XK) defers to a real neighbour
  // polygon so it can't steal a point that lies inside that sovereign (Tel Aviv → IL,
  // Skopje → MK), while a genuine PS/XK point still lands on the deferred box below.
  //
  // This runs even for a lone candidate. Short-circuiting a single match was what let a
  // point resolve to a country whose polygon plainly excludes it (#1490).
  candidates.sort((a, b) => a.area - b.area);
  const polys = getCountryPolyIndex();
  let looseBoxFallback: string | null = null;
  for (const { code, area } of candidates) {
    const poly = polys.get(code);
    if (!poly) {
      if (area <= MICRO_BOX_MAX_AREA) return code;
      if (looseBoxFallback === null) looseBoxFallback = code;
      continue;
    }
    if (pointInGeometry(lng, lat, poly)) return code;
  }
  // No tight micro-box and no polygon contained the point — prefer a deferred loose box
  // (a real PS/XK point), else fall back to the smallest box (coastal slop / data gap).
  return looseBoxFallback ?? candidates[0].code;
}

export function getCountryFromAddress(address: string | null): string | null {
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
  if (last.length === 2 && last === last.toUpperCase()) return last;
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
// the address is trusted directly there, as before.
async function resolveCountryCode(place: Place): Promise<string | null> {
  const hasCoords = !!(place.lat && place.lng);
  if (hasCoords) {
    const fromCoords = getCountryFromCoords(place.lat!, place.lng!);
    if (fromCoords) return fromCoords;
  }
  const fromAddress = getCountryFromAddress(place.address);
  if (fromAddress && (!hasCoords || isPointInCountryBox(fromAddress, place.lat!, place.lng!))) {
    return fromAddress;
  }
  if (hasCoords) {
    return await reverseGeocodeCountry(place.lat!, place.lng!);
  }
  return null;
}

function resolveCountryCodeSync(place: Place): string | null {
  const hasCoords = !!(place.lat && place.lng);
  if (hasCoords) {
    const fromCoords = getCountryFromCoords(place.lat!, place.lng!);
    if (fromCoords) return fromCoords;
  }
  const fromAddress = getCountryFromAddress(place.address);
  if (fromAddress && (!hasCoords || isPointInCountryBox(fromAddress, place.lat!, place.lng!))) {
    return fromAddress;
  }
  return null;
}

// ── Shared query: all trips the user owns or is a member of ─────────────────

function getUserTrips(userId: number): Trip[] {
  return db
    .prepare(
      `
    SELECT DISTINCT t.* FROM trips t
    LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
    WHERE t.user_id = ? OR m.user_id = ?
    ORDER BY t.start_date DESC
  `,
    )
    .all(userId, userId, userId) as Trip[];
}

function getPlacesForTrips(tripIds: number[]): Place[] {
  if (tripIds.length === 0) return [];
  const placeholders = tripIds.map(() => '?').join(',');
  return db.prepare(`SELECT * FROM places WHERE trip_id IN (${placeholders})`).all(...tripIds) as Place[];
}

// ── Country resolution (batch DB cache + sync fallback + background geocoding) ──

function resolvePlaceCountries(places: Place[]): Map<number, string> {
  const out = new Map<number, string>();
  const geoPlaces = places.filter((p) => p.lat && p.lng);
  const placeIds = geoPlaces.map((p) => p.id);

  const cached =
    placeIds.length > 0
      ? (db
          .prepare(
            `SELECT place_id, country_code FROM place_regions WHERE place_id IN (${placeIds.map(() => '?').join(',')})`,
          )
          .all(...placeIds) as { place_id: number; country_code: string }[])
      : [];
  const cachedMap = new Map(cached.map((r) => [r.place_id, r.country_code]));

  const uncachedForGeocode: Place[] = [];
  for (const p of places) {
    const fromDb = cachedMap.get(p.id);
    if (fromDb) {
      out.set(p.id, fromDb);
      continue;
    }
    const sync = resolveCountryCodeSync(p);
    if (sync) {
      out.set(p.id, sync);
      continue;
    }
    if (p.lat && p.lng && !geocodingInFlight.has(p.id)) {
      uncachedForGeocode.push(p);
    }
  }

  if (uncachedForGeocode.length > 0) {
    const insertStmt = db.prepare(
      'INSERT OR REPLACE INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, ?, ?, ?)',
    );
    for (const p of uncachedForGeocode) geocodingInFlight.add(p.id);
    void (async () => {
      try {
        for (const place of uncachedForGeocode) {
          try {
            const info = await reverseGeocodeRegion(place.lat!, place.lng!, place.address);
            if (info) insertStmt.run(place.id, info.country_code, info.region_code, info.region_name);
          } catch {
            /* continue */
          } finally {
            geocodingInFlight.delete(place.id);
          }
        }
      } catch {
        for (const p of uncachedForGeocode) geocodingInFlight.delete(p.id);
      }
    })();
  }

  return out;
}

// ── getStats ────────────────────────────────────────────────────────────────

export async function getStats(userId: number) {
  const trips = getUserTrips(userId);
  const tripIds = trips.map((t) => t.id);

  if (tripIds.length === 0) {
    const hiddenOnly = getHiddenCountries(userId);
    const manualCountries = db.prepare('SELECT country_code FROM visited_countries WHERE user_id = ?').all(userId) as {
      country_code: string;
    }[];
    const countries = manualCountries
      .filter((mc) => !hiddenOnly.has(mc.country_code))
      .map((mc) => ({ code: mc.country_code, placeCount: 0, tripCount: 0, firstVisit: null, lastVisit: null }));
    return {
      countries,
      trips: [],
      stats: { totalTrips: 0, totalPlaces: 0, totalCountries: countries.length, totalDays: 0 },
    };
  }

  const places = getPlacesForTrips(tripIds);

  interface CountryEntry {
    code: string;
    places: { id: number; name: string; lat: number | null; lng: number | null }[];
    tripIds: Set<number>;
  }
  const placeCountries = resolvePlaceCountries(places);
  const countrySet = new Map<string, CountryEntry>();
  for (const place of places) {
    const code = placeCountries.get(place.id);
    if (code) {
      if (!countrySet.has(code)) {
        countrySet.set(code, { code, places: [], tripIds: new Set() });
      }
      countrySet
        .get(code)!
        .places.push({ id: place.id, name: place.name, lat: place.lat ?? null, lng: place.lng ?? null });
      countrySet.get(code)!.tripIds.add(place.trip_id);
    }
  }

  let totalDays = 0;
  for (const trip of trips) {
    if (trip.start_date && trip.end_date) {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0) totalDays += diff;
    }
  }

  const countries = [...countrySet.values()].map((c) => {
    const countryTrips = trips.filter((t) => c.tripIds.has(t.id));
    const dates = countryTrips
      .map((t) => t.start_date)
      .filter(Boolean)
      .sort();
    return {
      code: c.code,
      placeCount: c.places.length,
      tripCount: c.tripIds.size,
      firstVisit: dates[0] || null,
      lastVisit: dates[dates.length - 1] || null,
    };
  });

  const citySet = new Set<string>();
  for (const place of places) {
    if (place.address) {
      const parts = place.address
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      // The last part is the country; the city is usually right before it, but a
      // full formatted address can have a postal code sitting between them
      // (e.g. "Bucharest, 010071, Romania"). Walk back from the country and take
      // the first part that still has letters once digits/postal noise is stripped.
      const candidates = parts.length >= 2 ? parts.slice(0, -1) : parts;
      let city = '';
      for (let i = candidates.length - 1; i >= 0; i--) {
        const cleaned = candidates[i].replace(/[\d\-\u2212\u3012]+/g, '').trim();
        if (cleaned) {
          city = cleaned.toLowerCase();
          break;
        }
      }
      if (city) citySet.add(city);
    }
  }
  const totalCities = citySet.size;

  // Countries the user explicitly removed. Only the zero-count passes below are
  // suppressed — a country with real places isn't removable in the UI anyway, and once
  // the user adds a place there the tombstone should stop mattering (#1490).
  const hidden = getHiddenCountries(userId);

  // Merge manually marked countries
  const manualCountries = db.prepare('SELECT country_code FROM visited_countries WHERE user_id = ?').all(userId) as {
    country_code: string;
  }[];
  for (const mc of manualCountries) {
    if (hidden.has(mc.country_code)) continue;
    if (!countries.find((c) => c.code === mc.country_code)) {
      countries.push({ code: mc.country_code, placeCount: 0, tripCount: 0, firstVisit: null, lastVisit: null });
    }
  }

  // Merge countries reached only by a transport booking. Those store geocoded from/to
  // coordinates in reservation_endpoints but create no place row, so they never show up
  // via resolvePlaceCountries above and would otherwise be missed (#1366).
  // Only 'from'/'to' legs count as actually reached — a 'stop' is an intermediate
  // connection/layover (e.g. a plane change) the traveler never really visited.
  const endpoints = db
    .prepare(
      `
    SELECT DISTINCT e.lat, e.lng
    FROM reservation_endpoints e
    JOIN reservations r ON e.reservation_id = r.id
    WHERE r.trip_id IN (${tripIds.map(() => '?').join(',')}) AND e.role IN ('from', 'to')
  `,
    )
    .all(...tripIds) as { lat: number; lng: number }[];
  for (const e of endpoints) {
    const code = getCountryFromCoords(e.lat, e.lng);
    if (code && !hidden.has(code) && !countries.find((c) => c.code === code)) {
      countries.push({ code, placeCount: 0, tripCount: 0, firstVisit: null, lastVisit: null });
    }
  }

  const mostVisited = countries.length > 0 ? countries.reduce((a, b) => (a.placeCount > b.placeCount ? a : b)) : null;

  const continents: Record<string, number> = {};
  countries.forEach((c) => {
    const cont = CONTINENT_MAP[c.code] || 'Other';
    continents[cont] = (continents[cont] || 0) + 1;
  });

  const now = new Date().toISOString().split('T')[0];
  const pastTrips = trips
    .filter((t) => t.end_date && t.end_date <= now)
    .sort((a, b) => b.end_date!.localeCompare(a.end_date!));
  const lastTrip: {
    id: number;
    title: string;
    start_date?: string | null;
    end_date?: string | null;
    countryCode?: string;
  } | null = pastTrips[0]
    ? {
        id: pastTrips[0].id,
        title: pastTrips[0].title,
        start_date: pastTrips[0].start_date,
        end_date: pastTrips[0].end_date,
      }
    : null;
  if (lastTrip) {
    const lastTripPlaces = places.filter((p) => p.trip_id === lastTrip.id);
    for (const p of lastTripPlaces) {
      const code = resolveCountryCodeSync(p);
      if (code) {
        lastTrip.countryCode = code;
        break;
      }
    }
  }

  const futureTrips = trips
    .filter((t) => t.start_date && t.start_date > now)
    .sort((a, b) => a.start_date!.localeCompare(b.start_date!));
  const nextTrip: { id: number; title: string; start_date?: string | null; daysUntil?: number } | null = futureTrips[0]
    ? { id: futureTrips[0].id, title: futureTrips[0].title, start_date: futureTrips[0].start_date }
    : null;
  if (nextTrip) {
    const diff = Math.ceil((new Date(nextTrip.start_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    nextTrip.daysUntil = Math.max(0, diff);
  }

  const tripYears = new Set(trips.filter((t) => t.start_date).map((t) => parseInt(t.start_date!.split('-')[0])));
  let streak = 0;
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 2000; y--) {
    if (tripYears.has(y)) streak++;
    else break;
  }
  const firstYear = tripYears.size > 0 ? Math.min(...tripYears) : null;

  return {
    countries,
    stats: {
      totalTrips: trips.length,
      totalPlaces: places.length,
      totalCountries: countries.length,
      totalDays,
      totalCities,
    },
    mostVisited,
    continents,
    lastTrip,
    nextTrip,
    streak,
    firstYear,
    tripsThisYear: trips.filter((t) => t.start_date && t.start_date.startsWith(String(currentYear))).length,
  };
}

// ── getCountryPlaces ────────────────────────────────────────────────────────

export function getCountryPlaces(userId: number, code: string) {
  const trips = getUserTrips(userId);
  const tripIds = trips.map((t) => t.id);
  if (tripIds.length === 0) return { places: [], trips: [], manually_marked: false };

  const places = getPlacesForTrips(tripIds);

  const matchingPlaces: {
    id: number;
    name: string;
    address: string | null;
    lat: number | null;
    lng: number | null;
    trip_id: number;
  }[] = [];
  const matchingTripIds = new Set<number>();

  for (const place of places) {
    const pCode = resolveCountryCodeSync(place);
    if (pCode === code) {
      matchingPlaces.push({
        id: place.id,
        name: place.name,
        address: place.address ?? null,
        lat: place.lat ?? null,
        lng: place.lng ?? null,
        trip_id: place.trip_id,
      });
      matchingTripIds.add(place.trip_id);
    }
  }

  const matchingTrips = trips
    .filter((t) => matchingTripIds.has(t.id))
    .map((t) => ({ id: t.id, title: t.title, start_date: t.start_date, end_date: t.end_date }));

  const isManuallyMarked = !!db
    .prepare('SELECT 1 FROM visited_countries WHERE user_id = ? AND country_code = ?')
    .get(userId, code);
  return { places: matchingPlaces, trips: matchingTrips, manually_marked: isManuallyMarked };
}

// ── Mark / unmark country ───────────────────────────────────────────────────

export function listVisitedCountries(userId: number): { country_code: string; created_at: string }[] {
  return db
    .prepare('SELECT country_code, created_at FROM visited_countries WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as { country_code: string; created_at: string }[];
}

/** Countries the user explicitly removed, which getStats must not re-derive (#1490). */
export function getHiddenCountries(userId: number): Set<string> {
  const rows = db.prepare('SELECT country_code FROM hidden_countries WHERE user_id = ?').all(userId) as {
    country_code: string;
  }[];
  return new Set(rows.map((r) => r.country_code));
}

export function markCountryVisited(userId: number, code: string): void {
  db.prepare('INSERT OR IGNORE INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(userId, code);
  // Marking it visited again lifts a previous removal.
  db.prepare('DELETE FROM hidden_countries WHERE user_id = ? AND country_code = ?').run(userId, code);
}

export function unmarkCountryVisited(userId: number, code: string): void {
  db.prepare('DELETE FROM visited_countries WHERE user_id = ? AND country_code = ?').run(userId, code);
  db.prepare('DELETE FROM visited_regions WHERE user_id = ? AND country_code = ?').run(userId, code);
  // A country derived from a place or a transport endpoint has no visited_countries row,
  // so the deletes above are no-ops and getStats would re-derive it on the next request.
  // Tombstone it so the removal actually sticks (#1490).
  db.prepare('INSERT OR IGNORE INTO hidden_countries (user_id, country_code) VALUES (?, ?)').run(userId, code);
}

// ── Mark / unmark region ────────────────────────────────────────────────────

export function listManuallyVisitedRegions(
  userId: number,
): { region_code: string; region_name: string; country_code: string }[] {
  return db
    .prepare(
      'SELECT region_code, region_name, country_code FROM visited_regions WHERE user_id = ? ORDER BY created_at DESC',
    )
    .all(userId) as { region_code: string; region_name: string; country_code: string }[];
}

/** Regions the user explicitly removed, which getVisitedRegions must not re-derive. */
export function getHiddenRegions(userId: number): Set<string> {
  const rows = db.prepare('SELECT region_code FROM hidden_regions WHERE user_id = ?').all(userId) as { region_code: string }[];
  return new Set(rows.map(r => r.region_code));
}

// Bundled/geocoded region codes are always "<countryCode>-<rest>" (ISO 3166-2 format, and
// buildRegionInfo's synthesized fallback follows the same convention) — used to recover a
// region's country when there's no visited_regions row to read it from (a place-derived
// region was never inserted there).
function countryCodeFromRegionCode(regionCode: string): string {
  return (regionCode.split('-')[0] || '').toUpperCase();
}

export function markRegionVisited(userId: number, regionCode: string, regionName: string, countryCode: string): void {
  db.prepare('INSERT OR IGNORE INTO visited_regions (user_id, region_code, region_name, country_code) VALUES (?, ?, ?, ?)').run(userId, regionCode, regionName, countryCode);
  // Re-marking lifts a previous removal of the region itself...
  db.prepare('DELETE FROM hidden_regions WHERE user_id = ? AND region_code = ?').run(userId, regionCode);
  // ...and of the parent country, which the "last region removed" cascade in
  // unmarkRegionVisited below may have hidden — otherwise marking a region visited again
  // would leave its country invisible.
  db.prepare('INSERT OR IGNORE INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(userId, countryCode);
  db.prepare('DELETE FROM hidden_countries WHERE user_id = ? AND country_code = ?').run(userId, countryCode);
}

// True when the given country still has at least one region that would show as visited —
// derived from place_regions or manually marked — after excluding the given user's hidden
// regions. Used to decide whether removing a region should cascade into hiding the country.
function hasVisibleRegionForCountry(userId: number, countryCode: string, hidden: Set<string>): boolean {
  const tripIds = getUserTrips(userId).map(t => t.id);
  const placeIds = getPlacesForTrips(tripIds).filter(p => p.lat && p.lng).map(p => p.id);
  const placeRegionCodes = placeIds.length > 0
    ? (db.prepare(
        `SELECT DISTINCT region_code FROM place_regions WHERE country_code = ? AND place_id IN (${placeIds.map(() => '?').join(',')})`
      ).all(countryCode, ...placeIds) as { region_code: string }[]).map(r => r.region_code)
    : [];
  const manualRegionCodes = (db.prepare(
    'SELECT region_code FROM visited_regions WHERE user_id = ? AND country_code = ?'
  ).all(userId, countryCode) as { region_code: string }[]).map(r => r.region_code);
  return [...placeRegionCodes, ...manualRegionCodes].some(code => !hidden.has(code));
}

export function unmarkRegionVisited(userId: number, regionCode: string): void {
  const region = db.prepare('SELECT country_code FROM visited_regions WHERE user_id = ? AND region_code = ?').get(userId, regionCode) as { country_code: string } | undefined;
  const countryCode = region?.country_code || countryCodeFromRegionCode(regionCode);

  db.prepare('DELETE FROM visited_regions WHERE user_id = ? AND region_code = ?').run(userId, regionCode);

  // Tombstone unconditionally, not just for a manually-marked region — a region derived
  // from real place data (the common case) needs to be dismissable too, mirroring
  // unmarkCountryVisited's tombstone for a place-derived country (#1490).
  if (countryCode) {
    db.prepare('INSERT OR IGNORE INTO hidden_regions (user_id, region_code, country_code) VALUES (?, ?, ?)').run(userId, regionCode, countryCode);

    // If that was the country's last visible region, hide the country too — otherwise it
    // keeps showing "visited" on the world map with nothing left to drill into.
    const hidden = getHiddenRegions(userId);
    if (!hasVisibleRegionForCountry(userId, countryCode, hidden)) {
      unmarkCountryVisited(userId, countryCode);
    }
  }
}

// ── Sub-national region resolution ────────────────────────────────────────

export interface RegionInfo {
  country_code: string;
  region_code: string;
  region_name: string;
}

// Tracks place IDs currently being geocoded in the background to prevent duplicate enqueuing.
const geocodingInFlight = new Set<number>();

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
  await throttleNominatim();
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=${zoom}&accept-language=en`,
      {
        headers: { 'User-Agent': 'TREK Travel Planner (https://github.com/liketrek/TREK)' },
        signal: AbortSignal.timeout(10_000),
      },
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

async function reverseGeocodeRegion(lat: number, lng: number, placeAddress?: string | null): Promise<RegionInfo | null> {
  const key = roundKey(lat, lng);
  if (regionCache.has(key)) return regionCache.get(key)!;

  // Prefer resolving directly against the bundled polygons: offline, deterministic, and —
  // unlike Nominatim's address levels — guaranteed to match a feature the client can
  // actually highlight. Falls through to reverse geocoding when the country has no admin1
  // coverage or the point lands outside every polygon.
  const coordCountry = getCountryFromCoords(lat, lng);
  if (coordCountry) {
    const fromBundle = await getRegionFromCoords(coordCountry, lat, lng);
    if (fromBundle) {
      regionCache.set(key, fromBundle);
      return fromBundle;
    }
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
    const fromAddress = await getRegionFromCoords(addressCountry, lat, lng);
    if (fromAddress) {
      regionCache.set(key, fromAddress);
      return fromAddress;
    }
  }

  // Only reached when the bundle's own polygons for this country don't cover the point at
  // all (coastal/simplification gaps) — a genuinely rare miss. Nominatim's coarse address
  // level (state/province) is what the bundle actually carries; the former GB "rescue" to a
  // finer county/borough level targeted the old Natural Earth polygons and produced a code
  // the current geoBoundaries bundle can never match, so it was removed.
  const address = await fetchNominatimAddress(lat, lng, 8);
  if (!address) return null; // transient failure — leave uncached so a later call retries
  const info = buildRegionInfo(address, false);
  regionCache.set(key, info);
  return info;
}

export async function getVisitedRegions(
  userId: number,
): Promise<{ regions: Record<string, { code: string; name: string; placeCount: number }[]> }> {
  const trips = getUserTrips(userId);
  const tripIds = trips.map((t) => t.id);
  const places = getPlacesForTrips(tripIds);

  // Check DB cache first
  const placeIds = places.filter((p) => p.lat && p.lng).map((p) => p.id);
  const cached =
    placeIds.length > 0
      ? (db
          .prepare(`SELECT * FROM place_regions WHERE place_id IN (${placeIds.map(() => '?').join(',')})`)
          .all(...placeIds) as { place_id: number; country_code: string; region_code: string; region_name: string }[])
      : [];
  const cachedMap = new Map(cached.map((c) => [c.place_id, c]));

  // Kick off background geocoding for uncached places; return cached data immediately.
  const uncached = places.filter((p) => p.lat && p.lng && !cachedMap.has(p.id) && !geocodingInFlight.has(p.id));
  if (uncached.length > 0) {
    const insertStmt = db.prepare(
      'INSERT OR REPLACE INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, ?, ?, ?)',
    );
    for (const p of uncached) geocodingInFlight.add(p.id);
    void (async () => {
      try {
        for (const place of uncached) {
          try {
            const info = await reverseGeocodeRegion(place.lat!, place.lng!, place.address);
            if (info) insertStmt.run(place.id, info.country_code, info.region_code, info.region_name);
          } catch {
            // individual failure — continue with remaining places
          } finally {
            geocodingInFlight.delete(place.id);
          }
        }
      } catch {
        for (const p of uncached) geocodingInFlight.delete(p.id);
      }
    })();
  }

  // Group by country → regions with place counts
  const regionMap: Record<string, Map<string, { code: string; name: string; placeCount: number }>> = {};
  for (const [, entry] of cachedMap) {
    if (!regionMap[entry.country_code]) regionMap[entry.country_code] = new Map();
    const existing = regionMap[entry.country_code].get(entry.region_code);
    if (existing) {
      existing.placeCount++;
    } else {
      regionMap[entry.country_code].set(entry.region_code, {
        code: entry.region_code,
        name: entry.region_name,
        placeCount: 1,
      });
    }
  }

  const result: Record<string, { code: string; name: string; placeCount: number; manuallyMarked?: boolean }[]> = {};
  for (const [country, regions] of Object.entries(regionMap)) {
    result[country] = [...regions.values()];
  }

  // Merge manually marked regions
  const manualRegions = listManuallyVisitedRegions(userId);
  for (const r of manualRegions) {
    if (!result[r.country_code]) result[r.country_code] = [];
    if (!result[r.country_code].find((x) => x.code === r.region_code)) {
      result[r.country_code].push({ code: r.region_code, name: r.region_name, placeCount: 0, manuallyMarked: true });
    }
  }

  // Suppress regions the user explicitly removed, same as getStats does for countries
  // via getHiddenCountries (#1490) — otherwise a region derived fresh from place_regions
  // (or a manual mark) on every request could never actually be dismissed.
  const hidden = getHiddenRegions(userId);
  if (hidden.size > 0) {
    for (const country of Object.keys(result)) {
      result[country] = result[country].filter(r => !hidden.has(r.code));
      if (result[country].length === 0) delete result[country];
    }
  }

  return { regions: result };
}

// ── Bucket list CRUD ────────────────────────────────────────────────────────

export function listBucketList(userId: number) {
  return db.prepare('SELECT * FROM bucket_list WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

export function createBucketItem(
  userId: number,
  data: {
    name: string;
    lat?: number | null;
    lng?: number | null;
    country_code?: string | null;
    notes?: string | null;
    target_date?: string | null;
  },
) {
  const result = db
    .prepare(
      'INSERT INTO bucket_list (user_id, name, lat, lng, country_code, notes, target_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      userId,
      data.name.trim(),
      data.lat ?? null,
      data.lng ?? null,
      data.country_code ?? null,
      data.notes ?? null,
      data.target_date ?? null,
    );
  return db.prepare('SELECT * FROM bucket_list WHERE id = ?').get(result.lastInsertRowid);
}

export function updateBucketItem(
  userId: number,
  itemId: string | number,
  data: {
    name?: string;
    notes?: string;
    lat?: number | null;
    lng?: number | null;
    country_code?: string | null;
    target_date?: string | null;
  },
) {
  const item = db.prepare('SELECT * FROM bucket_list WHERE id = ? AND user_id = ?').get(itemId, userId);
  if (!item) return null;
  db.prepare(
    `UPDATE bucket_list SET
    name = COALESCE(?, name),
    notes = CASE WHEN ? THEN ? ELSE notes END,
    lat = CASE WHEN ? THEN ? ELSE lat END,
    lng = CASE WHEN ? THEN ? ELSE lng END,
    country_code = CASE WHEN ? THEN ? ELSE country_code END,
    target_date = CASE WHEN ? THEN ? ELSE target_date END
    WHERE id = ?`,
  ).run(
    data.name?.trim() || null,
    data.notes !== undefined ? 1 : 0,
    data.notes !== undefined ? data.notes || null : null,
    data.lat !== undefined ? 1 : 0,
    data.lat !== undefined ? data.lat || null : null,
    data.lng !== undefined ? 1 : 0,
    data.lng !== undefined ? data.lng || null : null,
    data.country_code !== undefined ? 1 : 0,
    data.country_code !== undefined ? data.country_code || null : null,
    data.target_date !== undefined ? 1 : 0,
    data.target_date !== undefined ? data.target_date || null : null,
    itemId,
  );
  return db.prepare('SELECT * FROM bucket_list WHERE id = ?').get(itemId);
}

export function deleteBucketItem(userId: number, itemId: string | number): boolean {
  const item = db.prepare('SELECT * FROM bucket_list WHERE id = ? AND user_id = ?').get(itemId, userId);
  if (!item) return false;
  db.prepare('DELETE FROM bucket_list WHERE id = ?').run(itemId);
  return true;
}
