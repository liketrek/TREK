import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { db } from '../db/database';
import { Trip, Place } from '../types';
import { CONTINENT_MAP } from '@trek/shared';

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

const geoBundleCache = new Map<string, any>();

function loadGeoBundle(name: 'admin0' | 'admin1'): any {
  const cached = geoBundleCache.get(name);
  if (cached) return cached;
  const file = path.join(__dirname, '..', '..', 'assets', 'atlas', `${name}.geojson.gz`);
  if (!fs.existsSync(file)) {
    console.warn(`[Atlas] ${name}.geojson.gz missing — run \`node scripts/build-atlas-geo.mjs\``);
    const empty = { type: 'FeatureCollection', features: [] };
    geoBundleCache.set(name, empty);
    return empty;
  }
  const geo = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'));
  geoBundleCache.set(name, geo);
  console.log(`[Atlas] Loaded ${name} GeoJSON: ${geo.features?.length || 0} features`);
  return geo;
}

/** Full admin-0 country-border FeatureCollection (for the client map's country layer). */
export function getCountryGeo(): any {
  return loadGeoBundle('admin0');
}

export async function getRegionGeo(countryCodes: string[]): Promise<any> {
  const geo = loadGeoBundle('admin1');
  if (!geo) return { type: 'FeatureCollection', features: [] };
  const codes = new Set(countryCodes.map(c => c.toUpperCase()));
  const features = geo.features.filter((f: any) => codes.has(f.properties?.iso_a2?.toUpperCase()));
  return { type: 'FeatureCollection', features };
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
  HK:[113.83,22.15,114.43,22.56],MO:[113.53,22.10,113.60,22.21],
  GI:[-5.36,36.11,-5.33,36.16],PR:[-67.30,17.88,-65.22,18.53],
  PS:[34.2,29.5,35.6,32.6],XK:[20.0,41.9,21.8,43.3],
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
  'germany':'DE','deutschland':'DE','france':'FR','frankreich':'FR','spain':'ES','spanien':'ES',
  'italy':'IT','italien':'IT','united kingdom':'GB','uk':'GB','england':'GB','united states':'US',
  'usa':'US','netherlands':'NL','niederlande':'NL','austria':'AT','osterreich':'AT','switzerland':'CH',
  'schweiz':'CH','portugal':'PT','greece':'GR','griechenland':'GR','turkey':'TR','turkei':'TR',
  'croatia':'HR','kroatien':'HR','czech republic':'CZ','tschechien':'CZ','czechia':'CZ',
  'poland':'PL','polen':'PL','sweden':'SE','schweden':'SE','norway':'NO','norwegen':'NO',
  'denmark':'DK','danemark':'DK','finland':'FI','finnland':'FI','belgium':'BE','belgien':'BE',
  'ireland':'IE','irland':'IE','hungary':'HU','ungarn':'HU','romania':'RO','rumanien':'RO',
  'bulgaria':'BG','bulgarien':'BG','japan':'JP','china':'CN','australia':'AU','australien':'AU',
  'canada':'CA','kanada':'CA','mexico':'MX','mexiko':'MX','brazil':'BR','brasilien':'BR',
  'argentina':'AR','argentinien':'AR','thailand':'TH','indonesia':'ID','indonesien':'ID',
  'india':'IN','indien':'IN','egypt':'EG','agypten':'EG','morocco':'MA','marokko':'MA',
  'south africa':'ZA','sudafrika':'ZA','new zealand':'NZ','neuseeland':'NZ','iceland':'IS','island':'IS',
  'luxembourg':'LU','luxemburg':'LU','slovenia':'SI','slowenien':'SI','slovakia':'SK','slowakei':'SK',
  'estonia':'EE','estland':'EE','latvia':'LV','lettland':'LV','lithuania':'LT','litauen':'LT',
  'serbia':'RS','serbien':'RS','israel':'IL','russia':'RU','russland':'RU','ukraine':'UA',
  'vietnam':'VN','south korea':'KR','sudkorea':'KR','philippines':'PH','philippinen':'PH',
  'malaysia':'MY','colombia':'CO','kolumbien':'CO','peru':'PE','chile':'CL','iran':'IR',
  'iraq':'IQ','irak':'IQ','pakistan':'PK','kenya':'KE','kenia':'KE','nigeria':'NG',
  'saudi arabia':'SA','saudi-arabien':'SA','albania':'AL','albanien':'AL',
  'georgia':'GE','georgien':'GE','montenegro':'ME','north macedonia':'MK','nordmazedonien':'MK',
  'macedonia':'MK','bosnia':'BA','bosnia and herzegovina':'BA','bosnien':'BA','kosovo':'XK',
  'cyprus':'CY','zypern':'CY','malta':'MT','tunisia':'TN','tunesien':'TN','jordan':'JO','jordanien':'JO',
  'lebanon':'LB','libanon':'LB','ghana':'GH','ethiopia':'ET','athiopien':'ET','tanzania':'TZ','uganda':'UG',
  'singapore':'SG','taiwan':'TW','nepal':'NP','sri lanka':'LK','cambodia':'KH','kambodscha':'KH',
  'myanmar':'MM','burma':'MM','laos':'LA','mongolia':'MN','mongolei':'MN','kazakhstan':'KZ','kasachstan':'KZ',
  'uzbekistan':'UZ','usbekistan':'UZ','kyrgyzstan':'KG','kirgisistan':'KG','tajikistan':'TJ','tadschikistan':'TJ',
  'turkmenistan':'TM','costa rica':'CR','panama':'PA','ecuador':'EC','uruguay':'UY','cuba':'CU','kuba':'CU',
  'dominican republic':'DO','dominikanische republik':'DO','jamaica':'JM','haiti':'HT','honduras':'HN',
  'guatemala':'GT','el salvador':'SV','nicaragua':'NI','bolivia':'BO','bolivia plurinational state of':'BO',
  'paraguay':'PY','venezuela':'VE','trinidad and tobago':'TT','trinidad':'TT',
  'oman':'OM','kuwait':'KW','qatar':'QA','bahrain':'BH',
  'syria':'SY','syrien':'SY','yemen':'YE','jemen':'YE','palestine':'PS','palastina':'PS',
  'moldova':'MD','republic of moldova':'MD','moldawien':'MD',
  'libya':'LY','libyen':'LY','sudan':'SD','eritrea':'ER','djibouti':'DJ',
  'senegal':'SN','cameroon':'CM','kamerun':'CM','ivory coast':'CI','cote d\'ivoire':'CI',
  'mali':'ML','niger':'NE','burkina faso':'BF','togo':'TG','benin':'BJ','guinea':'GN',
  'dr congo':'CD','democratic republic of the congo':'CD','republic of the congo':'CG','congo':'CG',
  'angola':'AO','namibia':'NA','botswana':'BW','zimbabwe':'ZW','zambia':'ZM','malawi':'MW',
  'mozambique':'MZ','mozambik':'MZ','madagascar':'MG','rwanda':'RW','burundi':'BI',
  'somalia':'SO','papua new guinea':'PG','brunei':'BN',
  'hong kong':'HK','hong kong sar':'HK','macau':'MO','macao':'MO','macau sar':'MO',
  'san marino':'SM','vatican':'VA','vatican city':'VA','holy see':'VA','monaco':'MC',
  'liechtenstein':'LI','gibraltar':'GI','puerto rico':'PR',
};

// ── Geocoding helpers ───────────────────────────────────────────────────────

let lastNominatimCall = 0;

// Shared throttle: enforces ≥1.1s between any Nominatim request, across all callers.
async function throttleNominatim() {
  const elapsed = Date.now() - lastNominatimCall;
  if (elapsed < 1100) await new Promise(r => setTimeout(r, 1100 - elapsed));
  lastNominatimCall = Date.now();
}

export async function reverseGeocodeCountry(lat: number, lng: number): Promise<string | null> {
  const key = roundKey(lat, lng);
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;
  await throttleNominatim();
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=3&accept-language=en`, {
      headers: { 'User-Agent': 'TREK Travel Planner (https://github.com/mauriceboe/TREK)' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { address?: { country_code?: string } };
    const code = data.address?.country_code?.toUpperCase() || null;
    geocodeCache.set(key, code);
    return code;
  } catch {
    return null;
  }
}

// ── Point-in-polygon over the bundled admin0 borders (#1331) ─────────────────

// Ray-casting (even-odd) test of (lng,lat) against a single GeoJSON ring.
function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// True when (lng,lat) falls inside a Polygon/MultiPolygon, honouring holes.
function pointInGeometry(lng: number, lat: number, geom: { type: string; coordinates: number[][][] | number[][][][] }): boolean {
  const polygons = (geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates) as number[][][][];
  for (const poly of polygons) {
    if (!pointInRing(lng, lat, poly[0])) continue;
    let inHole = false;
    for (let h = 1; h < poly.length; h++) {
      if (pointInRing(lng, lat, poly[h])) { inHole = true; break; }
    }
    if (!inHole) return true;
  }
  return false;
}

type Geometry = { type: string; coordinates: number[][][] | number[][][][] };
type Box = [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]

// ISO_A2 → admin0 geometry + bounding boxes, both derived from the bundled admin0
// borders on first use and cached.
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
let countryPolyIndex: Map<string, Geometry> | null = null;
let countryBoxIndex: Map<string, Box[]> | null = null;

function buildCountryIndexes(): void {
  const polys = new Map<string, Geometry>();
  const boxes = new Map<string, Box[]>();

  for (const f of loadGeoBundle('admin0').features ?? []) {
    const raw = f.properties?.ISO_A2;
    if (!raw || raw === '-99' || !f.geometry) continue;
    const code = String(raw).toUpperCase();
    polys.set(code, f.geometry);

    const parts = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][][];
    const codeBoxes = boxes.get(code) ?? [];
    for (const part of parts) {
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
      for (const [lng, lat] of part[0]) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      codeBoxes.push([minLng, minLat, maxLng, maxLat]);
    }
    boxes.set(code, codeBoxes);
  }

  // Micro-territories aren't in admin0 — give them their box, but no polygon.
  for (const [code, box] of Object.entries(MICRO_TERRITORY_BOXES)) {
    if (!boxes.has(code)) boxes.set(code, [box]);
  }

  countryPolyIndex = polys;
  countryBoxIndex = boxes;
}

function getCountryPolyIndex(): Map<string, Geometry> {
  if (!countryPolyIndex) buildCountryIndexes();
  return countryPolyIndex!;
}

function getCountryBoxIndex(): Map<string, Box[]> {
  if (!countryBoxIndex) buildCountryIndexes();
  return countryBoxIndex!;
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
  const parts = address.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const last = parts[parts.length - 1];
  const normalized = last.toLowerCase();
  if (NAME_TO_CODE[normalized]) return NAME_TO_CODE[normalized];
  if (NAME_TO_CODE[last]) return NAME_TO_CODE[last];
  if (last.length === 2 && last === last.toUpperCase()) return last;
  return null;
}

// ── Resolve a place to a country code (address -> bbox -> geocode) ──────────

async function resolveCountryCode(place: Place): Promise<string | null> {
  let code = getCountryFromAddress(place.address);
  if (!code && place.lat && place.lng) {
    code = getCountryFromCoords(place.lat, place.lng);
  }
  if (!code && place.lat && place.lng) {
    code = await reverseGeocodeCountry(place.lat, place.lng);
  }
  return code;
}

function resolveCountryCodeSync(place: Place): string | null {
  let code = getCountryFromAddress(place.address);
  if (!code && place.lat && place.lng) {
    code = getCountryFromCoords(place.lat, place.lng);
  }
  return code;
}

// ── Shared query: all trips the user owns or is a member of ─────────────────

function getUserTrips(userId: number): Trip[] {
  return db.prepare(`
    SELECT DISTINCT t.* FROM trips t
    LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
    WHERE t.user_id = ? OR m.user_id = ?
    ORDER BY t.start_date DESC
  `).all(userId, userId, userId) as Trip[];
}

function getPlacesForTrips(tripIds: number[]): Place[] {
  if (tripIds.length === 0) return [];
  const placeholders = tripIds.map(() => '?').join(',');
  return db.prepare(`SELECT * FROM places WHERE trip_id IN (${placeholders})`).all(...tripIds) as Place[];
}

// ── Country resolution (batch DB cache + sync fallback + background geocoding) ──

function resolvePlaceCountries(places: Place[]): Map<number, string> {
  const out = new Map<number, string>();
  const geoPlaces = places.filter(p => p.lat && p.lng);
  const placeIds = geoPlaces.map(p => p.id);

  const cached = placeIds.length > 0
    ? (db.prepare(
        `SELECT place_id, country_code FROM place_regions WHERE place_id IN (${placeIds.map(() => '?').join(',')})`
      ).all(...placeIds) as { place_id: number; country_code: string }[])
    : [];
  const cachedMap = new Map(cached.map(r => [r.place_id, r.country_code]));

  const uncachedForGeocode: Place[] = [];
  for (const p of places) {
    const fromDb = cachedMap.get(p.id);
    if (fromDb) { out.set(p.id, fromDb); continue; }
    const sync = resolveCountryCodeSync(p);
    if (sync) { out.set(p.id, sync); continue; }
    if (p.lat && p.lng && !geocodingInFlight.has(p.id)) {
      uncachedForGeocode.push(p);
    }
  }

  if (uncachedForGeocode.length > 0) {
    const insertStmt = db.prepare(
      'INSERT OR REPLACE INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, ?, ?, ?)'
    );
    for (const p of uncachedForGeocode) geocodingInFlight.add(p.id);
    void (async () => {
      try {
        for (const place of uncachedForGeocode) {
          try {
            const info = await reverseGeocodeRegion(place.lat!, place.lng!);
            if (info) insertStmt.run(place.id, info.country_code, info.region_code, info.region_name);
          } catch { /* continue */ }
          finally { geocodingInFlight.delete(place.id); }
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
  const tripIds = trips.map(t => t.id);

  if (tripIds.length === 0) {
    const hiddenOnly = getHiddenCountries(userId);
    const manualCountries = db.prepare('SELECT country_code FROM visited_countries WHERE user_id = ?').all(userId) as { country_code: string }[];
    const countries = manualCountries
      .filter(mc => !hiddenOnly.has(mc.country_code))
      .map(mc => ({ code: mc.country_code, placeCount: 0, tripCount: 0, firstVisit: null, lastVisit: null }));
    return { countries, trips: [], stats: { totalTrips: 0, totalPlaces: 0, totalCountries: countries.length, totalDays: 0 } };
  }

  const places = getPlacesForTrips(tripIds);

  interface CountryEntry { code: string; places: { id: number; name: string; lat: number | null; lng: number | null }[]; tripIds: Set<number> }
  const placeCountries = resolvePlaceCountries(places);
  const countrySet = new Map<string, CountryEntry>();
  for (const place of places) {
    const code = placeCountries.get(place.id);
    if (code) {
      if (!countrySet.has(code)) {
        countrySet.set(code, { code, places: [], tripIds: new Set() });
      }
      countrySet.get(code)!.places.push({ id: place.id, name: place.name, lat: place.lat ?? null, lng: place.lng ?? null });
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

  const countries = [...countrySet.values()].map(c => {
    const countryTrips = trips.filter(t => c.tripIds.has(t.id));
    const dates = countryTrips.map(t => t.start_date).filter(Boolean).sort();
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
      const parts = place.address.split(',').map((s: string) => s.trim()).filter(Boolean);
      // The last part is the country; the city is usually right before it, but a
      // full formatted address can have a postal code sitting between them
      // (e.g. "Bucharest, 010071, Romania"). Walk back from the country and take
      // the first part that still has letters once digits/postal noise is stripped.
      const candidates = parts.length >= 2 ? parts.slice(0, -1) : parts;
      let city = '';
      for (let i = candidates.length - 1; i >= 0; i--) {
        const cleaned = candidates[i].replace(/[\d\-\u2212\u3012]+/g, '').trim();
        if (cleaned) { city = cleaned.toLowerCase(); break; }
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
  const manualCountries = db.prepare('SELECT country_code FROM visited_countries WHERE user_id = ?').all(userId) as { country_code: string }[];
  for (const mc of manualCountries) {
    if (hidden.has(mc.country_code)) continue;
    if (!countries.find(c => c.code === mc.country_code)) {
      countries.push({ code: mc.country_code, placeCount: 0, tripCount: 0, firstVisit: null, lastVisit: null });
    }
  }

  // Merge countries reached only by a transport booking. Those store geocoded from/to
  // coordinates in reservation_endpoints but create no place row, so they never show up
  // via resolvePlaceCountries above and would otherwise be missed (#1366).
  // Only 'from'/'to' legs count as actually reached — a 'stop' is an intermediate
  // connection/layover (e.g. a plane change) the traveler never really visited.
  const endpoints = db.prepare(`
    SELECT DISTINCT e.lat, e.lng
    FROM reservation_endpoints e
    JOIN reservations r ON e.reservation_id = r.id
    WHERE r.trip_id IN (${tripIds.map(() => '?').join(',')}) AND e.role IN ('from', 'to')
  `).all(...tripIds) as { lat: number; lng: number }[];
  for (const e of endpoints) {
    const code = getCountryFromCoords(e.lat, e.lng);
    if (code && !hidden.has(code) && !countries.find(c => c.code === code)) {
      countries.push({ code, placeCount: 0, tripCount: 0, firstVisit: null, lastVisit: null });
    }
  }

  const mostVisited = countries.length > 0 ? countries.reduce((a, b) => a.placeCount > b.placeCount ? a : b) : null;

  const continents: Record<string, number> = {};
  countries.forEach(c => {
    const cont = CONTINENT_MAP[c.code] || 'Other';
    continents[cont] = (continents[cont] || 0) + 1;
  });

  const now = new Date().toISOString().split('T')[0];
  const pastTrips = trips.filter(t => t.end_date && t.end_date <= now).sort((a, b) => b.end_date!.localeCompare(a.end_date!));
  const lastTrip: { id: number; title: string; start_date?: string | null; end_date?: string | null; countryCode?: string } | null = pastTrips[0]
    ? { id: pastTrips[0].id, title: pastTrips[0].title, start_date: pastTrips[0].start_date, end_date: pastTrips[0].end_date }
    : null;
  if (lastTrip) {
    const lastTripPlaces = places.filter(p => p.trip_id === lastTrip.id);
    for (const p of lastTripPlaces) {
      const code = resolveCountryCodeSync(p);
      if (code) { lastTrip.countryCode = code; break; }
    }
  }

  const futureTrips = trips.filter(t => t.start_date && t.start_date > now).sort((a, b) => a.start_date!.localeCompare(b.start_date!));
  const nextTrip: { id: number; title: string; start_date?: string | null; daysUntil?: number } | null = futureTrips[0]
    ? { id: futureTrips[0].id, title: futureTrips[0].title, start_date: futureTrips[0].start_date }
    : null;
  if (nextTrip) {
    const diff = Math.ceil((new Date(nextTrip.start_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    nextTrip.daysUntil = Math.max(0, diff);
  }

  const tripYears = new Set(trips.filter(t => t.start_date).map(t => parseInt(t.start_date!.split('-')[0])));
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
    tripsThisYear: trips.filter(t => t.start_date && t.start_date.startsWith(String(currentYear))).length,
  };
}

// ── getCountryPlaces ────────────────────────────────────────────────────────

export function getCountryPlaces(userId: number, code: string) {
  const trips = getUserTrips(userId);
  const tripIds = trips.map(t => t.id);
  if (tripIds.length === 0) return { places: [], trips: [], manually_marked: false };

  const places = getPlacesForTrips(tripIds);

  const matchingPlaces: { id: number; name: string; address: string | null; lat: number | null; lng: number | null; trip_id: number }[] = [];
  const matchingTripIds = new Set<number>();

  for (const place of places) {
    const pCode = resolveCountryCodeSync(place);
    if (pCode === code) {
      matchingPlaces.push({ id: place.id, name: place.name, address: place.address ?? null, lat: place.lat ?? null, lng: place.lng ?? null, trip_id: place.trip_id });
      matchingTripIds.add(place.trip_id);
    }
  }

  const matchingTrips = trips.filter(t => matchingTripIds.has(t.id)).map(t => ({ id: t.id, title: t.title, start_date: t.start_date, end_date: t.end_date }));

  const isManuallyMarked = !!(db.prepare('SELECT 1 FROM visited_countries WHERE user_id = ? AND country_code = ?').get(userId, code));
  return { places: matchingPlaces, trips: matchingTrips, manually_marked: isManuallyMarked };
}

// ── Mark / unmark country ───────────────────────────────────────────────────

export function listVisitedCountries(userId: number): { country_code: string; created_at: string }[] {
  return db.prepare(
    'SELECT country_code, created_at FROM visited_countries WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId) as { country_code: string; created_at: string }[];
}

/** Countries the user explicitly removed, which getStats must not re-derive (#1490). */
export function getHiddenCountries(userId: number): Set<string> {
  const rows = db.prepare('SELECT country_code FROM hidden_countries WHERE user_id = ?').all(userId) as { country_code: string }[];
  return new Set(rows.map(r => r.country_code));
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

export function listManuallyVisitedRegions(userId: number): { region_code: string; region_name: string; country_code: string }[] {
  return db.prepare(
    'SELECT region_code, region_name, country_code FROM visited_regions WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId) as { region_code: string; region_name: string; country_code: string }[];
}

export function markRegionVisited(userId: number, regionCode: string, regionName: string, countryCode: string): void {
  db.prepare('INSERT OR IGNORE INTO visited_regions (user_id, region_code, region_name, country_code) VALUES (?, ?, ?, ?)').run(userId, regionCode, regionName, countryCode);
  // Auto-mark parent country if not already visited
  db.prepare('INSERT OR IGNORE INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(userId, countryCode);
}

export function unmarkRegionVisited(userId: number, regionCode: string): void {
  const region = db.prepare('SELECT country_code FROM visited_regions WHERE user_id = ? AND region_code = ?').get(userId, regionCode) as { country_code: string } | undefined;
  db.prepare('DELETE FROM visited_regions WHERE user_id = ? AND region_code = ?').run(userId, regionCode);
  if (region) {
    const remaining = db.prepare('SELECT COUNT(*) as count FROM visited_regions WHERE user_id = ? AND country_code = ?').get(userId, region.country_code) as { count: number };
    if (remaining.count === 0) {
      db.prepare('DELETE FROM visited_countries WHERE user_id = ? AND country_code = ?').run(userId, region.country_code);
    }
  }
}

// ── Sub-national region resolution ────────────────────────────────────────

interface RegionInfo { country_code: string; region_code: string; region_name: string }

// Tracks place IDs currently being geocoded in the background to prevent duplicate enqueuing.
const geocodingInFlight = new Set<number>();

const regionCache = new Map<string, RegionInfo | null>();

// A zoom-8 reverse geocode of a GB place only resolves to the constituent country
// (England/Scotland/Wales/Northern Ireland). Natural Earth's admin-1 polygons for GB
// are counties and boroughs, so those four codes match no polygon and never highlight.
const GB_CONSTITUENT_CODES = new Set(['GB-ENG', 'GB-SCT', 'GB-WLS', 'GB-NIR']);

// Returns the OSM address object, {} for an "ok but empty" response (so it is cached as
// a definitive miss), or null for a transient failure (so it is retried next time).
async function fetchNominatimAddress(lat: number, lng: number, zoom: number): Promise<Record<string, string> | null> {
  await throttleNominatim();
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=${zoom}&accept-language=en`,
      {
        headers: { 'User-Agent': 'TREK Travel Planner (https://github.com/mauriceboe/TREK)' },
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json() as { address?: Record<string, string> };
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
    ? (address['ISO3166-2-lvl8'] || address['ISO3166-2-lvl7'] || address['ISO3166-2-lvl6'] || address['ISO3166-2-lvl5'] || null)
    : (address['ISO3166-2-lvl6'] || address['ISO3166-2-lvl5'] || address['ISO3166-2-lvl4'] || null);
  // Normalize: FR-75C → FR-75 (strip trailing letter suffixes for GeoJSON compatibility)
  if (regionCode && /^[A-Z]{2}-\d+[A-Z]$/i.test(regionCode)) {
    regionCode = regionCode.replace(/[A-Z]$/i, '');
  }
  const regionName = preferFinest
    ? (address.city || address.county || address.state_district || address.borough || address.state || address.province || address.region || null)
    : (address.state || address.province || address.region || address.county || address.city || null);
  if (!countryCode || !regionName) return null;
  return {
    country_code: countryCode,
    region_code: regionCode || `${countryCode}-${regionName.substring(0, 3).toUpperCase()}`,
    region_name: regionName,
  };
}

async function reverseGeocodeRegion(lat: number, lng: number): Promise<RegionInfo | null> {
  const key = roundKey(lat, lng);
  if (regionCache.has(key)) return regionCache.get(key)!;
  const address = await fetchNominatimAddress(lat, lng, 8);
  if (!address) return null; // transient failure — leave uncached so a later call retries
  let info = buildRegionInfo(address, false);
  // GB constituent-country codes map to no admin-1 polygon, so re-resolve them at a finer
  // zoom where Nominatim exposes the county/borough code (GB-LND, GB-MAN, GB-CON, …) that
  // the polygons actually carry.
  if (info && info.country_code === 'GB' && GB_CONSTITUENT_CODES.has(info.region_code)) {
    const finerAddress = await fetchNominatimAddress(lat, lng, 10);
    const finer = finerAddress ? buildRegionInfo(finerAddress, true) : null;
    if (finer && !GB_CONSTITUENT_CODES.has(finer.region_code)) info = finer;
  }
  regionCache.set(key, info);
  return info;
}

export async function getVisitedRegions(userId: number): Promise<{ regions: Record<string, { code: string; name: string; placeCount: number }[]> }> {
  const trips = getUserTrips(userId);
  const tripIds = trips.map(t => t.id);
  const places = getPlacesForTrips(tripIds);

  // Check DB cache first
  const placeIds = places.filter(p => p.lat && p.lng).map(p => p.id);
  const cached = placeIds.length > 0
    ? db.prepare(`SELECT * FROM place_regions WHERE place_id IN (${placeIds.map(() => '?').join(',')})`).all(...placeIds) as { place_id: number; country_code: string; region_code: string; region_name: string }[]
    : [];
  const cachedMap = new Map(cached.map(c => [c.place_id, c]));

  // Kick off background geocoding for uncached places; return cached data immediately.
  const uncached = places.filter(p => p.lat && p.lng && !cachedMap.has(p.id) && !geocodingInFlight.has(p.id));
  if (uncached.length > 0) {
    const insertStmt = db.prepare('INSERT OR REPLACE INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, ?, ?, ?)');
    for (const p of uncached) geocodingInFlight.add(p.id);
    void (async () => {
      try {
        for (const place of uncached) {
          try {
            const info = await reverseGeocodeRegion(place.lat!, place.lng!);
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
      regionMap[entry.country_code].set(entry.region_code, { code: entry.region_code, name: entry.region_name, placeCount: 1 });
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
    if (!result[r.country_code].find(x => x.code === r.region_code)) {
      result[r.country_code].push({ code: r.region_code, name: r.region_name, placeCount: 0, manuallyMarked: true });
    }
  }

  return { regions: result };
}

// ── Bucket list CRUD ────────────────────────────────────────────────────────

export function listBucketList(userId: number) {
  return db.prepare('SELECT * FROM bucket_list WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

export function createBucketItem(userId: number, data: { name: string; lat?: number | null; lng?: number | null; country_code?: string | null; notes?: string | null; target_date?: string | null }) {
  const result = db.prepare('INSERT INTO bucket_list (user_id, name, lat, lng, country_code, notes, target_date) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    userId, data.name.trim(), data.lat ?? null, data.lng ?? null, data.country_code ?? null, data.notes ?? null, data.target_date ?? null
  );
  return db.prepare('SELECT * FROM bucket_list WHERE id = ?').get(result.lastInsertRowid);
}

export function updateBucketItem(userId: number, itemId: string | number, data: { name?: string; notes?: string; lat?: number | null; lng?: number | null; country_code?: string | null; target_date?: string | null }) {
  const item = db.prepare('SELECT * FROM bucket_list WHERE id = ? AND user_id = ?').get(itemId, userId);
  if (!item) return null;
  db.prepare(`UPDATE bucket_list SET
    name = COALESCE(?, name),
    notes = CASE WHEN ? THEN ? ELSE notes END,
    lat = CASE WHEN ? THEN ? ELSE lat END,
    lng = CASE WHEN ? THEN ? ELSE lng END,
    country_code = CASE WHEN ? THEN ? ELSE country_code END,
    target_date = CASE WHEN ? THEN ? ELSE target_date END
    WHERE id = ?`).run(
    data.name?.trim() || null,
    data.notes !== undefined ? 1 : 0, data.notes !== undefined ? (data.notes || null) : null,
    data.lat !== undefined ? 1 : 0, data.lat !== undefined ? (data.lat || null) : null,
    data.lng !== undefined ? 1 : 0, data.lng !== undefined ? (data.lng || null) : null,
    data.country_code !== undefined ? 1 : 0, data.country_code !== undefined ? (data.country_code || null) : null,
    data.target_date !== undefined ? 1 : 0, data.target_date !== undefined ? (data.target_date || null) : null,
    itemId
  );
  return db.prepare('SELECT * FROM bucket_list WHERE id = ?').get(itemId);
}

export function deleteBucketItem(userId: number, itemId: string | number): boolean {
  const item = db.prepare('SELECT * FROM bucket_list WHERE id = ? AND user_id = ?').get(itemId, userId);
  if (!item) return false;
  db.prepare('DELETE FROM bucket_list WHERE id = ?').run(itemId);
  return true;
}
