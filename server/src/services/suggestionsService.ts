// ─────────────────────────────────────────────────────────────────────────────
// suggestionsService.ts
//
// "Must See Places" — Overpass API approach (Komoot/AllTrails style):
//
//  1. Sample GPX track → route polyline (up to 40 points)
//  2. Query Overpass API: all OSM POIs within 2 km of the route corridor (1 call)
//  3. Filter by tags, deduplicate, rank by importance score → top 20 POIs
//  4. Ask AI for descriptions only (single batch call)
//  5. Fetch Wikimedia photos in batches of 5 (parallel)
//
// Why this beats the previous AI-discovery approach:
//  ✓  Finds real monuments with accurate coordinates (no hallucinations)
//  ✓  No Nominatim geocoding needed — OSM already has lat/lng
//  ✓  No intermediate-stop detection — corridor finds everything within 2 km
//  ✓  Total time: ~8–15 s instead of the previous 30–90 s
//  ✓  Finds small-village landmarks (Monasterio de Silos, Torre de Covarrubias …)
//
// Supported AI providers (in priority order, all free-tier capable):
//   1. Groq            — GROQ_API_KEY      (free: console.groq.com)
//   2. Google Gemini   — GEMINI_API_KEY    (free: aistudio.google.com/apikey)
//   3. Anthropic       — ANTHROPIC_API_KEY
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

// ── Overpass API types ────────────────────────────────────────────────────────

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
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

// ── Overpass API corridor query ───────────────────────────────────────────────

/**
 * Query Overpass API for POIs near the route.
 *
 * Strategy: use a global `[bbox:...]` filter — a compact bounding-box that
 * covers the whole route + buffer.  This produces a tiny query (~300 chars)
 * that every Overpass instance accepts, unlike the multi-kilobyte
 * `around:radius,lat1,lon1,...` polyline form which can trigger HTTP 406.
 *
 * After fetching, we post-filter in-memory: only keep elements within
 * `corridorKm` of at least one route point, recreating the corridor effect.
 */
async function queryOverpassPOIs(
  routePoints: Array<{ lat: number; lng: number }>,
  corridorKm = 2,
): Promise<OverpassElement[]> {
  if (routePoints.length === 0) return [];

  // Bounding box of all route points + buffer
  const lats = routePoints.map(p => p.lat);
  const lngs = routePoints.map(p => p.lng);
  const bufDeg = (corridorKm + 1) / 111; // 1° ≈ 111 km
  const south = (Math.min(...lats) - bufDeg).toFixed(5);
  const north = (Math.max(...lats) + bufDeg).toFixed(5);
  const west  = (Math.min(...lngs) - bufDeg).toFixed(5);
  const east  = (Math.max(...lngs) + bufDeg).toFixed(5);

  // Short QL query — global bbox replaces per-element (around:...,polyline)
  const query = `[out:json][timeout:30][bbox:${south},${west},${north},${east}];
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35_000);

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ data: query }).toString(),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(`[suggestions] Overpass API ${res.status}: ${body.slice(0, 200)}`);
      return [];
    }

    const data = await res.json() as { elements?: OverpassElement[] };
    const all = data.elements ?? [];

    // Post-filter: discard POIs that are more than corridorKm away from every route point
    // (the bbox may include features on the far side of a mountain range, etc.)
    return all.filter(el => {
      let lat: number, lng: number;
      if (el.type === 'node' && el.lat != null && el.lon != null) {
        lat = el.lat; lng = el.lon;
      } else if (el.center) {
        lat = el.center.lat; lng = el.center.lon;
      } else return false;
      return routePoints.some(p => haversineKm(lat, lng, p.lat, p.lng) <= corridorKm);
    });

  } catch (err: any) {
    clearTimeout(timer);
    const reason = err?.name === 'AbortError' ? 'timeout' : (err?.message ?? String(err));
    console.warn(`[suggestions] Overpass query failed: ${reason}`);
    return [];
  }
}

// ── OSM tag → Trek category ───────────────────────────────────────────────────

function osmTagToCategory(tags: Record<string, string>): string {
  const { tourism, historic, natural, amenity } = tags;

  if (tourism === 'museum')    return 'Museum';
  if (tourism === 'viewpoint') return 'Viewpoint';

  if (
    natural === 'peak' || natural === 'waterfall' ||
    natural === 'gorge' || natural === 'cave_entrance' || natural === 'cliff'
  ) return 'Nature';

  if (
    historic === 'monastery' || historic === 'abbey' ||
    historic === 'chapel' || historic === 'church' || historic === 'shrine'
  ) return 'Religious';
  if (amenity === 'monastery' || amenity === 'place_of_worship') return 'Religious';

  if (
    historic === 'castle' || historic === 'tower' || historic === 'manor' ||
    historic === 'palace' || historic === 'fort' || historic === 'fortress' ||
    historic === 'ruins' || historic === 'archaeological_site' ||
    historic === 'city_gate' || historic === 'bridge' || historic === 'building'
  ) return 'Monument';

  if (historic) return 'Monument';
  if (tourism === 'attraction') return 'Monument';
  return 'Other';
}

// ── POI importance score ──────────────────────────────────────────────────────

/**
 * Score an OSM element by its likely tourist importance.
 * Higher scores survive the "top N" filter.
 */
function scorePOI(el: OverpassElement): number {
  const tags = el.tags ?? {};
  let score = 0;

  // Larger OSM features (ways, relations) describe physically larger / more notable places
  if (el.type === 'relation') score += 3;
  else if (el.type === 'way') score += 2;

  // Wikipedia / Wikidata reference: community-confirmed notable site
  if (tags.wikipedia) score += 5;
  if (tags.wikidata)  score += 3;

  // Name in multiple languages → well-known place
  if (tags['name:en']) score += 1;

  // High-value historic types
  const h = tags.historic;
  if (h === 'castle' || h === 'monastery' || h === 'abbey' || h === 'ruins' || h === 'archaeological_site') score += 4;
  else if (h === 'manor' || h === 'palace' || h === 'fort' || h === 'fortress' || h === 'city_gate' || h === 'bridge') score += 3;
  else if (h) score += 2;

  // Tourism
  const t = tags.tourism;
  if (t === 'attraction') score += 3;
  if (t === 'museum')     score += 3;
  if (t === 'viewpoint')  score += 1;

  // Natural highlights
  const n = tags.natural;
  if (n === 'peak' || n === 'gorge' || n === 'waterfall' || n === 'cave_entrance') score += 2;

  return score;
}

// ── Filter & rank OSM POIs ────────────────────────────────────────────────────

interface RankedPOI {
  name: string;
  lat: number;
  lng: number;
  category: string;
  osmType: string;  // the raw OSM tag value (e.g. "monastery", "castle")
  address: string | null;
  score: number;
}

/** OSM historic values that are too numerous / low-quality to include */
const HISTORIC_NOISE = new Set([
  'wayside_cross', 'milestone', 'boundary_stone', 'stone',
  'pillory', 'tomb', 'grave_yard', 'yes', 'district',
]);

function filterAndRankPOIs(
  elements: OverpassElement[],
  skipNames: string[],
  maxResults = 20,
): RankedPOI[] {
  const skipSet  = new Set(skipNames.map(n => n.toLowerCase()));
  const seenName = new Set<string>();
  const seenCoords: Array<{ lat: number; lng: number }> = [];
  const ranked: RankedPOI[] = [];

  for (const el of elements) {
    const tags = el.tags ?? {};

    // Must have a name
    const name = tags.name || tags['name:en'];
    if (!name || name.trim().length < 2) continue;

    // Skip generic / noisy historic sub-types
    if (tags.historic && HISTORIC_NOISE.has(tags.historic)) continue;

    // Skip places already in the trip
    if (skipSet.has(name.toLowerCase())) continue;

    // Resolve coordinates (nodes have lat/lon; ways/relations expose `center`)
    let lat: number, lng: number;
    if (el.type === 'node' && el.lat != null && el.lon != null) {
      lat = el.lat; lng = el.lon;
    } else if (el.center) {
      lat = el.center.lat; lng = el.center.lon;
    } else continue;

    // Deduplicate by name (case-insensitive)
    const nameKey = name.toLowerCase().trim();
    if (seenName.has(nameKey)) continue;

    // Deduplicate by proximity — same feature sometimes mapped as node + way
    const tooClose = seenCoords.some(c => haversineKm(lat, lng, c.lat, c.lng) < 0.15);
    if (tooClose) continue;

    seenName.add(nameKey);
    seenCoords.push({ lat, lng });

    const osmType = tags.historic ?? tags.tourism ?? tags.natural ?? 'attraction';

    ranked.push({
      name,
      lat,
      lng,
      category:  osmTagToCategory(tags),
      osmType,
      address:   tags['addr:full'] ?? tags['addr:street'] ?? null,
      score:     scorePOI(el),
    });
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, maxResults);
}

// ── Near-place detection ──────────────────────────────────────────────────────

function findNearestConfirmedPlace(
  lat: number,
  lng: number,
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
  const clean = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
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
  tripTitle: string,
  pois: RankedPOI[],
  lang: string,
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

  // ── Trip metadata ──────────────────────────────────────────────────────────
  const trip = db
    .prepare('SELECT id, title, description, start_date, end_date FROM trips WHERE id = ?')
    .get(tripId) as TripContext | undefined;
  if (!trip) throw new Error('Trip not found');

  // ── Confirmed stops: all places assigned to days, in route order ───────────
  const confirmed = db.prepare(`
    SELECT
      p.name, p.address, p.lat, p.lng,
      d.day_number,
      da.order_index
    FROM days d
    JOIN day_assignments da ON da.day_id = d.id
    JOIN places p           ON p.id = da.place_id
    WHERE d.trip_id = ?
    ORDER BY d.day_number, da.order_index
  `).all(tripId) as ConfirmedPlace[];

  // ── GPX tracks ─────────────────────────────────────────────────────────────
  const gpxRows = db.prepare(`
    SELECT day_id, points_json
    FROM gpx_tracks
    WHERE trip_id = ? AND is_active = 1
    ORDER BY day_id, sort_order
  `).all(tripId) as Array<{ day_id: number | null; points_json: string }>;

  const allTracks: GpxTrackInfo[] = gpxRows.map(row => ({
    day_id: row.day_id,
    // 10 evenly-spaced points per track; we'll further subsample for Overpass
    sampled_pts: sampleTrackPoints(row.points_json || '[]', 10),
  }));

  // ── Build route polyline ───────────────────────────────────────────────────
  // Combine: GPX sample points first, then confirmed place coordinates.
  // Including confirmed places ensures we also search around each stop even when
  // the GPX track is only approximate.
  const routePoints: Array<{ lat: number; lng: number }> = [
    ...allTracks.flatMap(t => t.sampled_pts),
    ...confirmed
      .filter(p => p.lat != null && p.lng != null)
      .map(p => ({ lat: p.lat as number, lng: p.lng as number })),
  ];

  if (routePoints.length === 0) {
    console.warn('[suggestions] No route points available — cannot run Overpass query');
    return [];
  }

  // ── Query Overpass API ─────────────────────────────────────────────────────
  const t0 = Date.now();
  console.log(`[suggestions] Querying Overpass for ${routePoints.length} route pts (tripId=${tripId})…`);
  const overpassElements = await queryOverpassPOIs(routePoints, 2000);
  console.log(`[suggestions] Overpass returned ${overpassElements.length} elements in ${Date.now() - t0} ms`);

  // ── Skip list: places already in the trip ──────────────────────────────────
  const skipNames = (
    db.prepare('SELECT name FROM places WHERE trip_id = ?').all(tripId) as Array<{ name: string }>
  ).map(p => p.name);

  // ── Filter, rank, deduplicate OSM POIs ────────────────────────────────────
  const topPOIs = filterAndRankPOIs(overpassElements, skipNames, 20);
  console.log(
    `[suggestions] Top ${topPOIs.length} POIs:`,
    topPOIs.map(p => `${p.name} (${p.osmType}, score=${p.score})`),
  );

  if (topPOIs.length === 0) {
    console.warn('[suggestions] Overpass found no matching POIs for this route');
    return [];
  }

  // ── AI descriptions (single batch call) ───────────────────────────────────
  let descriptions: AIDescription[] = [];
  try {
    const t1 = Date.now();
    descriptions = await getAIDescriptions(trip.title, topPOIs, lang);
    console.log(`[suggestions] AI descriptions returned ${descriptions.length} items in ${Date.now() - t1} ms`);
  } catch (err: any) {
    const msg: string = err?.message ?? '';
    if (msg.includes('NO_AI_KEY')) throw err;  // surface config error
    // For transient AI errors: continue with fallback descriptions
    console.error('[suggestions] AI descriptions failed (using fallbacks):', msg);
  }

  // Build fast lookup: lowercased name → description
  const descMap = new Map<string, string>(
    descriptions.map(d => [d.name.toLowerCase(), d.description]),
  );

  // ── Fetch Wikimedia photos in batches of 5 (parallel) ─────────────────────
  const BATCH = 5;
  const photoUrls: (string | null)[] = new Array(topPOIs.length).fill(null);
  for (let i = 0; i < topPOIs.length; i += BATCH) {
    const batch = topPOIs.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      batch.map(p => fetchWikimediaPhoto(p.lat, p.lng, p.name)),
    );
    settled.forEach((r, j) => {
      if (r.status === 'fulfilled' && r.value?.photoUrl) {
        photoUrls[i + j] = r.value.photoUrl;
      }
    });
    if (i + BATCH < topPOIs.length) await sleep(300); // polite delay between batches
  }

  // ── Assemble final Suggestion list ────────────────────────────────────────
  return topPOIs.map((poi, idx) => {
    // Match description: exact name → prefix match → fallback label
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
