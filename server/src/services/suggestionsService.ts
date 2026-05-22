// ─────────────────────────────────────────────────────────────────────────────
// suggestionsService.ts
//
// "Must See Places" — multi-source POI discovery (Komoot/AllTrails style):
//
//  Source A — Overpass API (multiple public mirrors):
//    Compact [bbox:...] query → post-filter by distance to route.
//    Finds OSM monuments, historic, viewpoints, nature features.
//
//  Source B — Wikipedia GeoSearch (automatic fallback when Overpass fails):
//    Wikipedia's /w/api.php?list=geosearch finds all Wikipedia articles
//    geotagged within the trip bounding box.  Works from any network,
//    returns the *most notable* places (Monasterio de Silos, Covarrubias …).
//
//  Then for the top 20 POIs from either source:
//    - AI single batch call for descriptions
//    - Wikimedia photos in parallel batches
// ─────────────────────────────────────────────────────────────────────────────

import { db } from '../db/database';
import { fetchWikimediaPhoto } from './mapsService';

// ── Domain types ──────────────────────────────────────────────────────────────

interface TripContext {
  id: number;
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

interface ConfirmedPlace {
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  day_number: number;
  order_index: number;
}

interface GpxTrackInfo {
  day_id: number | null;
  sampled_pts: Array<{ lat: number; lng: number }>;
}

export interface Suggestion {
  name: string;
  description: string;
  category: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  photo_url?: string | null;
  near_place?: string | null;
}

// Overpass element (node/way/relation with optional center coords)
interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// Unified internal POI record used after Overpass OR Wikipedia discovery
interface RankedPOI {
  name: string;
  lat: number;
  lng: number;
  category: string;
  osmType: string;
  address: string | null;
  score: number;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

/** Returns true when (lat, lng) is within `maxKm` of at least one route point. */
function isNearRoute(
  lat: number, lng: number,
  routePoints: Array<{ lat: number; lng: number }>,
  maxKm: number,
): boolean {
  return routePoints.some(p => haversineKm(lat, lng, p.lat, p.lng) <= maxKm);
}

function sampleTrackPoints(
  pointsJson: string,
  n = 10,
): Array<{ lat: number; lng: number }> {
  try {
    const pts = JSON.parse(pointsJson) as Array<{ lat: number; lng: number }>;
    if (pts.length === 0) return [];
    if (pts.length <= n) return pts.map(p => ({ lat: p.lat, lng: p.lng }));
    const step = (pts.length - 1) / (n - 1);
    return Array.from({ length: n }, (_, i) => {
      const idx = Math.min(Math.round(i * step), pts.length - 1);
      return { lat: pts[idx].lat, lng: pts[idx].lng };
    });
  } catch { return []; }
}

/** Compute bounding box of route points + a buffer in degrees. */
function routeBBox(
  routePoints: Array<{ lat: number; lng: number }>,
  bufKm = 3,
): { south: number; north: number; west: number; east: number } {
  const lats = routePoints.map(p => p.lat);
  const lngs = routePoints.map(p => p.lng);
  const buf = bufKm / 111;
  return {
    south: Math.min(...lats) - buf,
    north: Math.max(...lats) + buf,
    west:  Math.min(...lngs) - buf,
    east:  Math.max(...lngs) + buf,
  };
}

// ── Source A: Overpass API ────────────────────────────────────────────────────

/** Public Overpass mirrors tried in order.  Some block data-center IPs. */
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
];

/**
 * Build a short Overpass QL query using a global [bbox:...] filter.
 * This is ~300 chars total — safe for all mirrors and HTTP gateways.
 */
function buildOverpassQuery(bbox: ReturnType<typeof routeBBox>): string {
  const { south, north, west, east } = bbox;
  return `[out:json][timeout:28][bbox:${south.toFixed(5)},${west.toFixed(5)},${north.toFixed(5)},${east.toFixed(5)}];
(
  node["tourism"~"^(attraction|museum|viewpoint)$"];
  node["historic"]["name"];
  node["natural"~"^(peak|waterfall|gorge|cave_entrance|cliff)$"]["name"];
  way["tourism"~"^(attraction|museum|viewpoint)$"]["name"];
  way["historic"]["name"];
  relation["historic"]["name"];
  relation["tourism"~"^(attraction|museum|viewpoint)$"]["name"];
);
out center tags qt;`;
}

/**
 * Try all Overpass mirrors IN PARALLEL with a short per-request timeout.
 * Returns the first successful result; if all fail, returns [].
 * Running in parallel means total wait = slowest-that-succeeds, not sum-of-all.
 */
async function fetchFromOverpass(query: string): Promise<OverpassElement[]> {
  const body = new URLSearchParams({ data: query }).toString();

  const tryEndpoint = async (endpoint: string): Promise<OverpassElement[]> => {
    const host = endpoint.replace(/^https?:\/\//, '').split('/')[0];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000); // 8 s per mirror
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'TrekApp/1.0 (travel planning; https://trekwanderer.info)',
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { elements?: OverpassElement[] };
      const n = data.elements?.length ?? 0;
      console.log(`[suggestions] Overpass ${host} → ${n} elements ✓`);
      if (n === 0) throw new Error('empty'); // treat empty as failure so others are tried
      return data.elements!;
    } catch (err: any) {
      clearTimeout(timer);
      const reason = err?.name === 'AbortError' ? 'timeout' : (err?.message ?? 'failed');
      console.warn(`[suggestions] Overpass ${host} → ${reason}`);
      throw err; // re-throw so Promise.any can skip it
    }
  };

  try {
    // Promise.any resolves with the FIRST mirror that returns results
    return await Promise.any(OVERPASS_ENDPOINTS.map(tryEndpoint));
  } catch {
    // AggregateError: every mirror failed
    return [];
  }
}

// ── Source B: Wikipedia GeoSearch (fallback) ──────────────────────────────────

/**
 * Wikipedia GeoSearch using multiple gscoord+gsradius queries (NOT gsbbox).
 *
 * Reason: the gsbbox parameter has a known bug in the GeoData extension when
 * both longitudes are negative (e.g. Spain), consistently returning 0 results.
 *
 * Fix: sample up to 10 evenly-spaced points along the route and issue one
 * gscoord query per point with gsradius=10000 (the API maximum = 10 km).
 * All queries run in parallel via Promise.allSettled → fast (~1-2 s).
 *
 * API docs: https://www.mediawiki.org/wiki/API:Geosearch
 */
async function fetchFromWikipedia(
  routePoints: Array<{ lat: number; lng: number }>,
  lang = 'es',
): Promise<Array<{ title: string; lat: number; lng: number }>> {

  // Sample up to 10 evenly-spaced points (API max radius = 10 km, so ~10 circles cover ~200 km)
  const N = Math.min(10, routePoints.length);
  const step = routePoints.length > 1 ? (routePoints.length - 1) / (N - 1) : 0;
  const pts = Array.from({ length: N }, (_, i) => {
    const idx = Math.min(Math.round(i * step), routePoints.length - 1);
    return routePoints[idx];
  });

  const queryOne = async (l: string, pt: { lat: number; lng: number }) => {
    const params = new URLSearchParams({
      action:   'query',
      list:     'geosearch',
      gscoord:  `${pt.lat}|${pt.lng}`,
      gsradius: '10000',  // 10 km — API maximum
      gslimit:  '20',
      format:   'json',
      origin:   '*',
    });
    const res = await fetch(`https://${l}.wikipedia.org/w/api.php?${params}`, {
      headers: { 'User-Agent': 'TrekApp/1.0 (https://trekwanderer.info)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as {
      query?: { geosearch?: Array<{ title: string; lat: number; lon: number }> };
    };
    return data.query?.geosearch ?? [];
  };

  for (const l of [lang, lang === 'es' ? 'en' : 'es']) {
    try {
      const settled = await Promise.allSettled(pts.map(pt => queryOne(l, pt)));
      const seen = new Set<string>();
      const merged: Array<{ title: string; lat: number; lng: number }> = [];
      for (const r of settled) {
        if (r.status !== 'fulfilled') continue;
        for (const item of r.value) {
          if (!seen.has(item.title)) {
            seen.add(item.title);
            merged.push({ title: item.title, lat: item.lat, lng: item.lon });
          }
        }
      }
      console.log(`[suggestions] Wikipedia ${l} (${N} gscoord queries) → ${merged.length} articles`);
      if (merged.length > 0) return merged;
    } catch (err: any) {
      console.warn(`[suggestions] Wikipedia ${l} → ${err?.message}`);
    }
  }
  return [];
}

// ── OSM tag → Trek category ───────────────────────────────────────────────────

function osmTagToCategory(tags: Record<string, string>): string {
  const { tourism, historic, natural, amenity } = tags;
  if (tourism === 'museum')    return 'Museum';
  if (tourism === 'viewpoint') return 'Viewpoint';
  if (natural === 'peak' || natural === 'waterfall' || natural === 'gorge' ||
      natural === 'cave_entrance' || natural === 'cliff') return 'Nature';
  if (historic === 'monastery' || historic === 'abbey' || historic === 'chapel' ||
      historic === 'church'    || historic === 'shrine') return 'Religious';
  if (amenity === 'monastery'  || amenity === 'place_of_worship') return 'Religious';
  if (historic === 'castle' || historic === 'tower'   || historic === 'manor'  ||
      historic === 'palace' || historic === 'fort'    || historic === 'fortress' ||
      historic === 'ruins'  || historic === 'archaeological_site' ||
      historic === 'city_gate' || historic === 'bridge') return 'Monument';
  if (historic) return 'Monument';
  if (tourism === 'attraction') return 'Monument';
  return 'Other';
}

// ── Overpass element importance score ─────────────────────────────────────────

function scorePOI(el: OverpassElement): number {
  const tags = el.tags ?? {};
  let s = 0;
  if (el.type === 'relation') s += 3;
  else if (el.type === 'way') s += 2;
  if (tags.wikipedia) s += 5;
  if (tags.wikidata)  s += 3;
  if (tags['name:en']) s += 1;
  const h = tags.historic;
  if (h === 'castle' || h === 'monastery' || h === 'abbey' ||
      h === 'ruins'  || h === 'archaeological_site') s += 4;
  else if (h === 'manor' || h === 'palace' || h === 'fort' ||
           h === 'fortress' || h === 'city_gate' || h === 'bridge') s += 3;
  else if (h) s += 2;
  const t = tags.tourism;
  if (t === 'attraction' || t === 'museum') s += 3;
  if (t === 'viewpoint') s += 1;
  const n = tags.natural;
  if (n === 'peak' || n === 'gorge' || n === 'waterfall' || n === 'cave_entrance') s += 2;
  return s;
}

// ── Filter & rank Overpass elements into RankedPOI[] ─────────────────────────

const HISTORIC_NOISE = new Set([
  'wayside_cross', 'milestone', 'boundary_stone', 'stone',
  'pillory', 'tomb', 'grave_yard', 'yes', 'district',
]);

function filterAndRankPOIs(
  elements: OverpassElement[],
  skipNames: string[],
  routePoints: Array<{ lat: number; lng: number }>,
  corridorKm: number,
  maxResults = 20,
): RankedPOI[] {
  const skipSet   = new Set(skipNames.map(n => n.toLowerCase()));
  const seenName  = new Set<string>();
  const seenCoord: Array<{ lat: number; lng: number }> = [];
  const ranked: RankedPOI[] = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags.name || tags['name:en'];
    if (!name || name.trim().length < 2) continue;
    if (tags.historic && HISTORIC_NOISE.has(tags.historic)) continue;
    if (skipSet.has(name.toLowerCase())) continue;

    let lat: number, lng: number;
    if (el.type === 'node' && el.lat != null && el.lon != null) {
      lat = el.lat; lng = el.lon;
    } else if (el.center) {
      lat = el.center.lat; lng = el.center.lon;
    } else continue;

    // Must be within the route corridor
    if (!isNearRoute(lat, lng, routePoints, corridorKm)) continue;

    const nameKey = name.toLowerCase().trim();
    if (seenName.has(nameKey)) continue;
    if (seenCoord.some(c => haversineKm(lat, lng, c.lat, c.lng) < 0.15)) continue;
    seenName.add(nameKey);
    seenCoord.push({ lat, lng });

    const osmType = tags.historic ?? tags.tourism ?? tags.natural ?? 'attraction';
    ranked.push({ name, lat, lng, category: osmTagToCategory(tags), osmType, address: null, score: scorePOI(el) });
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, maxResults);
}

/** Convert Wikipedia GeoSearch hits to RankedPOI[], filtering by corridor. */
function wikiToPOIs(
  items: Array<{ title: string; lat: number; lng: number }>,
  skipNames: string[],
  routePoints: Array<{ lat: number; lng: number }>,
  corridorKm: number,
  maxResults = 20,
): RankedPOI[] {
  const skipSet   = new Set(skipNames.map(n => n.toLowerCase()));
  const seenCoord: Array<{ lat: number; lng: number }> = [];
  const result: RankedPOI[] = [];

  for (const item of items) {
    if (skipSet.has(item.title.toLowerCase())) continue;
    if (!isNearRoute(item.lat, item.lng, routePoints, corridorKm)) continue;
    if (seenCoord.some(c => haversineKm(item.lat, item.lng, c.lat, c.lng) < 0.15)) continue;
    seenCoord.push({ lat: item.lat, lng: item.lng });

    result.push({
      name:     item.title,
      lat:      item.lat,
      lng:      item.lng,
      category: 'Monument',   // Wikipedia place articles are typically landmarks
      osmType:  'landmark',
      address:  null,
      score:    5,            // All Wikipedia articles are "notable"
    });
    if (result.length >= maxResults) break;
  }
  return result;
}

// ── Source C: Nominatim category search (last resort) ────────────────────────

/**
 * Nominatim /search with bounded viewbox, queried for each of several
 * category terms.  Nominatim uses the same OSM database as Overpass but is
 * a different service — confirmed reachable from the Docker container.
 *
 * Rate limit: 1 req/sec → sequential with 800 ms sleep.
 * With 8 terms: ~7 s.  Returns real places with real coordinates.
 */
const NOMINATIM_TERMS: Record<string, string[]> = {
  es: ['monasterio', 'castillo', 'ermita', 'mirador', 'museo', 'ruinas', 'palacio', 'torre'],
  en: ['monastery',  'castle',   'chapel', 'viewpoint', 'museum', 'ruins', 'palace', 'tower'],
};

async function searchNominatimCategories(
  bbox: ReturnType<typeof routeBBox>,
  routePoints: Array<{ lat: number; lng: number }>,
  corridorKm: number,
  skipNames: string[],
  lang: string,
  maxResults = 20,
): Promise<RankedPOI[]> {
  // Nominatim viewbox: left,top,right,bottom = minLng, maxLat, maxLng, minLat
  const viewbox = [
    bbox.west.toFixed(4),
    bbox.north.toFixed(4),
    bbox.east.toFixed(4),
    bbox.south.toFixed(4),
  ].join(',');

  const terms = NOMINATIM_TERMS[lang === 'es' ? 'es' : 'en'];
  const skipSet   = new Set(skipNames.map(n => n.toLowerCase()));
  const seenName  = new Set<string>();
  const seenCoord: Array<{ lat: number; lng: number }> = [];
  const results: RankedPOI[] = [];

  for (let i = 0; i < terms.length && results.length < maxResults; i++) {
    if (i > 0) await sleep(800); // Nominatim ≤ 1 req/s policy

    try {
      const params = new URLSearchParams({
        q:                terms[i],
        format:           'json',
        limit:            '15',
        viewbox,
        bounded:          '1',
        namedetails:      '1',
        addressdetails:   '0',
        'accept-language': lang === 'es' ? 'es,en' : 'en,es',
      });
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { 'User-Agent': 'trek-app/1.0 (https://trekwanderer.info)' } },
      );
      if (!res.ok) { console.warn(`[suggestions] Nominatim "${terms[i]}" → HTTP ${res.status}`); continue; }

      const items = await res.json() as Array<{
        lat: string; lon: string;
        display_name?: string;
        namedetails?: { name?: string };
        class?: string; type?: string;
        importance?: number;
      }>;

      for (const item of items) {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        if (isNaN(lat) || isNaN(lng)) continue;
        if (!isNearRoute(lat, lng, routePoints, corridorKm)) continue;

        const name = item.namedetails?.name ?? item.display_name?.split(',')[0]?.trim() ?? '';
        if (name.length < 3) continue;

        const nameKey = name.toLowerCase();
        if (skipSet.has(nameKey) || seenName.has(nameKey)) continue;
        if (seenCoord.some(c => haversineKm(lat, lng, c.lat, c.lng) < 0.2)) continue;

        seenName.add(nameKey);
        seenCoord.push({ lat, lng });

        const tags: Record<string, string> = { [item.class ?? 'tourism']: item.type ?? 'attraction' };
        results.push({
          name,
          lat,
          lng,
          category: osmTagToCategory(tags),
          osmType:  item.type ?? item.class ?? 'attraction',
          address:  item.display_name ?? null,
          score:    Math.round((item.importance ?? 0.5) * 10),
        });
      }
    } catch (err: any) {
      console.warn(`[suggestions] Nominatim "${terms[i]}" → ${err?.message}`);
    }
  }

  console.log(`[suggestions] Nominatim → ${results.length} POIs`);
  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

// ── POI discovery: Overpass → Wikipedia → Nominatim ──────────────────────────

async function discoverRoutePOIs(
  routePoints: Array<{ lat: number; lng: number }>,
  corridorKm: number,
  skipNames: string[],
  lang: string,
): Promise<RankedPOI[]> {
  const bbox = routeBBox(routePoints, corridorKm + 1);

  // ── A: Overpass (4 mirrors in parallel, 8 s each) ─────────────────────────
  const overpassElements = await fetchFromOverpass(buildOverpassQuery(bbox));
  if (overpassElements.length > 0) {
    const pois = filterAndRankPOIs(overpassElements, skipNames, routePoints, corridorKm);
    if (pois.length > 0) { console.log(`[suggestions] Source: Overpass (${pois.length} POIs)`); return pois; }
  }

  // ── B: Wikipedia multi-point gscoord (10 queries in parallel) ────────────
  console.log('[suggestions] Overpass failed → Wikipedia GeoSearch…');
  const wikiItems = await fetchFromWikipedia(routePoints, lang);
  if (wikiItems.length > 0) {
    const pois = wikiToPOIs(wikiItems, skipNames, routePoints, corridorKm);
    if (pois.length > 0) { console.log(`[suggestions] Source: Wikipedia (${pois.length} POIs)`); return pois; }
  }

  // ── C: Nominatim category search (sequential, 1 req/s) ───────────────────
  console.log('[suggestions] Wikipedia failed → Nominatim category search…');
  const nominatimPOIs = await searchNominatimCategories(bbox, routePoints, corridorKm, skipNames, lang);
  if (nominatimPOIs.length > 0) { console.log(`[suggestions] Source: Nominatim (${nominatimPOIs.length} POIs)`); return nominatimPOIs; }

  console.warn('[suggestions] No POIs found from any source');
  return [];
}

// ── Near-place detection ──────────────────────────────────────────────────────

function findNearestConfirmedPlace(
  lat: number, lng: number,
  confirmed: ConfirmedPlace[],
  maxKm = 30,
): string | null {
  let best: string | null = null;
  let bestDist = maxKm;
  for (const p of confirmed) {
    if (p.lat == null || p.lng == null) continue;
    const d = haversineKm(lat, lng, p.lat, p.lng);
    if (d < bestDist) { bestDist = d; best = p.name; }
  }
  return best;
}

// ── AI description generation ─────────────────────────────────────────────────

function buildDescriptionsPrompt(
  tripTitle: string,
  pois: RankedPOI[],
  lang: string,
): { system: string; user: string } {
  const system =
    `You are a world-class travel expert. ` +
    `Respond ONLY with a valid JSON array — no markdown, no extra text. ` +
    `Language for descriptions: ${lang}.`;

  const list = pois.map((p, i) =>
    `${i + 1}. "${p.name}" [${p.osmType}]`,
  ).join('\n');

  const user =
    `I am cycling the route "${tripTitle}". ` +
    `For each of these places found along the route, write a compelling 1-2 sentence description ` +
    `explaining why it is worth visiting. Be specific: mention the architecture, history, legend, ` +
    `natural feature or cultural significance that makes it unmissable.\n\n` +
    `${list}\n\n` +
    `Respond ONLY with a JSON array — one object per place, in the same order:\n` +
    `[\n  {"name": "exact place name", "description": "1-2 sentence description"}\n]`;

  return { system, user };
}

type AIDescription = { name: string; description: string };

function parseDescriptionJson(raw: string): AIDescription[] {
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const parsed = JSON.parse(clean) as AIDescription[];
  if (!Array.isArray(parsed)) throw new Error('AI returned non-array');
  return parsed.filter(p => p.name && p.description);
}

async function askGroqDescriptions(
  tripTitle: string, pois: RankedPOI[], lang: string,
): Promise<AIDescription[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');
  const { system, user } = buildDescriptionsPrompt(tripTitle, pois, lang);
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      temperature: 0.6,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return parseDescriptionJson(data.choices?.[0]?.message?.content ?? '');
}

async function askGeminiDescriptions(
  tripTitle: string, pois: RankedPOI[], lang: string,
): Promise<AIDescription[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  const { system, user } = buildDescriptionsPrompt(tripTitle, pois, lang);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.6 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return parseDescriptionJson(data.candidates?.[0]?.content?.parts?.[0]?.text ?? '');
}

async function askClaudeDescriptions(
  tripTitle: string, pois: RankedPOI[], lang: string,
): Promise<AIDescription[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  const { system, user } = buildDescriptionsPrompt(tripTitle, pois, lang);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  return parseDescriptionJson(data.content?.find(c => c.type === 'text')?.text ?? '');
}

async function getAIDescriptions(
  tripTitle: string, pois: RankedPOI[], lang: string,
): Promise<AIDescription[]> {
  if (process.env.GROQ_API_KEY)      return askGroqDescriptions(tripTitle, pois, lang);
  if (process.env.GEMINI_API_KEY)    return askGeminiDescriptions(tripTitle, pois, lang);
  if (process.env.ANTHROPIC_API_KEY) return askClaudeDescriptions(tripTitle, pois, lang);
  throw new Error(
    'NO_AI_KEY: No AI API key configured. ' +
    'Set GROQ_API_KEY (free), GEMINI_API_KEY (free) or ANTHROPIC_API_KEY.',
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getMustSeeSuggestions(
  tripId: number,
  _userId: number,
  lang = 'en',
): Promise<Suggestion[]> {

  // Trip metadata
  const trip = db
    .prepare('SELECT id, title, description, start_date, end_date FROM trips WHERE id = ?')
    .get(tripId) as TripContext | undefined;
  if (!trip) throw new Error('Trip not found');

  // Confirmed stops (places already in the trip)
  const confirmed = db.prepare(`
    SELECT p.name, p.address, p.lat, p.lng, d.day_number, da.order_index
    FROM days d
    JOIN day_assignments da ON da.day_id = d.id
    JOIN places p           ON p.id = da.place_id
    WHERE d.trip_id = ?
    ORDER BY d.day_number, da.order_index
  `).all(tripId) as ConfirmedPlace[];

  // GPX tracks — sample 10 pts each
  const gpxRows = db.prepare(`
    SELECT day_id, points_json
    FROM gpx_tracks
    WHERE trip_id = ? AND is_active = 1
    ORDER BY day_id, sort_order
  `).all(tripId) as Array<{ day_id: number | null; points_json: string }>;

  const allTracks: GpxTrackInfo[] = gpxRows.map(row => ({
    day_id: row.day_id,
    sampled_pts: sampleTrackPoints(row.points_json || '[]', 10),
  }));

  // Build route polyline: GPX points + confirmed place coords
  const routePoints: Array<{ lat: number; lng: number }> = [
    ...allTracks.flatMap(t => t.sampled_pts),
    ...confirmed
      .filter(p => p.lat != null && p.lng != null)
      .map(p => ({ lat: p.lat as number, lng: p.lng as number })),
  ];

  if (routePoints.length === 0) {
    console.warn('[suggestions] No route points — cannot discover POIs');
    return [];
  }

  // Skip names = places already in the trip
  const skipNames = (
    db.prepare('SELECT name FROM places WHERE trip_id = ?').all(tripId) as Array<{ name: string }>
  ).map(p => p.name);

  // Discover POIs: Overpass first, Wikipedia GeoSearch as fallback
  const t0 = Date.now();
  console.log(`[suggestions] Discovering POIs for tripId=${tripId} (${routePoints.length} route pts)…`);
  const topPOIs = await discoverRoutePOIs(routePoints, 2, skipNames, lang);
  console.log(`[suggestions] ${topPOIs.length} POIs found in ${Date.now() - t0} ms:`,
    topPOIs.map(p => p.name));

  if (topPOIs.length === 0) return [];

  // AI descriptions (single batch call)
  let descriptions: AIDescription[] = [];
  try {
    descriptions = await getAIDescriptions(trip.title, topPOIs, lang);
  } catch (err: any) {
    const msg: string = err?.message ?? '';
    if (msg.includes('NO_AI_KEY')) throw err;
    console.error('[suggestions] AI descriptions failed (using fallbacks):', msg);
  }

  const descMap = new Map<string, string>(
    descriptions.map(d => [d.name.toLowerCase(), d.description]),
  );

  // Fetch Wikimedia photos in batches of 5 (parallel)
  const BATCH = 5;
  const photoUrls: (string | null)[] = new Array(topPOIs.length).fill(null);
  for (let i = 0; i < topPOIs.length; i += BATCH) {
    const settled = await Promise.allSettled(
      topPOIs.slice(i, i + BATCH).map(p => fetchWikimediaPhoto(p.lat, p.lng, p.name)),
    );
    settled.forEach((r, j) => {
      if (r.status === 'fulfilled' && r.value?.photoUrl) photoUrls[i + j] = r.value.photoUrl;
    });
    if (i + BATCH < topPOIs.length) await sleep(300);
  }

  // Assemble Suggestion[]
  return topPOIs.map((poi, idx) => {
    const descKey = poi.name.toLowerCase();
    const description =
      descMap.get(descKey) ??
      [...descMap.entries()].find(([k]) =>
        k.includes(descKey.substring(0, 12)) || descKey.includes(k.substring(0, 12)),
      )?.[1] ??
      `${poi.osmType.charAt(0).toUpperCase() + poi.osmType.slice(1).replace(/_/g, ' ')} — notable landmark along the route.`;

    return {
      name:       poi.name,
      description,
      category:   poi.category,
      lat:        poi.lat,
      lng:        poi.lng,
      address:    poi.address,
      photo_url:  photoUrls[idx],
      near_place: findNearestConfirmedPlace(poi.lat, poi.lng, confirmed),
    };
  });
}
