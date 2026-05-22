// ─────────────────────────────────────────────────────────────────────────────
// suggestionsService.ts
//
// "Must See Places" — structured per-stop suggestion engine:
//
//  1. Confirmed stops   = places the user already added to the trip (day_assignments)
//  2. Intermediate stops = towns the GPX cycling track crosses between confirmed stops
//                         (reverse-geocoded, only if > minDistKm from any confirmed place)
//  3. AI prompt         = "For EACH stop, name the most iconic thing to see there"
//  4. Geocoding         = validated against each stop's known coordinates (tight, ≤ 20 km)
//
// Supported AI providers (in priority order):
//   1. Groq            — GROQ_API_KEY      (free: console.groq.com)
//   2. Google Gemini   — GEMINI_API_KEY    (free: aistudio.google.com/apikey)
//   3. Anthropic       — ANTHROPIC_API_KEY (paid)
// ─────────────────────────────────────────────────────────────────────────────

import { db } from '../db/database';
import { getMapsKey, searchNominatim, fetchWikimediaPhoto } from './mapsService';

// ── Domain types ──────────────────────────────────────────────────────────────

interface TripContext {
  id: number;
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

/** A confirmed stop the user has already added to the trip. */
interface ConfirmedPlace {
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  day_number: number;
  order_index: number;
}

/** A town the cycling GPX track passes through, NOT close to any confirmed stop. */
interface IntermediateStop {
  name: string; // "Covarrubias, Spain"  (from Nominatim reverse)
  lat: number;
  lng: number;
}

interface GpxTrackInfo {
  day_id: number | null;
  start_lat: number | null; start_lng: number | null;
  end_lat: number | null;   end_lng: number | null;
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
  /** Which confirmed stop or intermediate town this suggestion is near. */
  near_place?: string | null;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** Haversine distance in km between two GPS points. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Nominatim reverse-geocode result.
 * `placeLat`/`placeLng` are the centroid of the matched place (from Nominatim `lat`/`lon`),
 * NOT the query coordinates. We use them to verify that the track point is actually
 * inside the returned locality — not just "the nearest city 15 km away".
 */
interface ReverseGeocodeResult {
  name: string;      // "Quintana del Pidio, Spain"
  placeLat: number;  // centroid of the matched place
  placeLng: number;
}

/** Nominatim reverse-geocode. Returns the locality name AND its centroid coordinates. */
async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}` +
      `&format=json&zoom=13&accept-language=en`;
    const res = await fetch(url, { headers: { 'User-Agent': 'trek-app/1.0' } });
    if (!res.ok) return null;
    const data = await res.json() as {
      lat: string; lon: string;   // ← centroid of the found place
      address?: {
        village?: string; town?: string; city?: string;
        municipality?: string; county?: string; country?: string;
      };
    };
    const a = data.address;
    if (!a || !data.lat || !data.lon) return null;
    const locality = a.village || a.town || a.city || a.municipality || a.county;
    if (!locality) return null;
    return {
      name: `${locality}, ${a.country ?? ''}`.trim().replace(/,$/, ''),
      placeLat: parseFloat(data.lat),
      placeLng: parseFloat(data.lon),
    };
  } catch { return null; }
}

/** Sample up to n evenly-spaced points from a GPX points_json array. */
function sampleTrackPoints(
  pointsJson: string,
  n = 10,
): Array<{ lat: number; lng: number }> {
  try {
    const pts = JSON.parse(pointsJson) as Array<{ lat: number; lng: number }>;
    if (pts.length === 0) return [];
    if (pts.length <= n) return pts.map(p => ({ lat: p.lat, lng: p.lng }));
    const step = (pts.length - 1) / (n - 1);
    const out: Array<{ lat: number; lng: number }> = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.round(i * step);
      out.push({ lat: pts[idx].lat, lng: pts[idx].lng });
    }
    return out;
  } catch { return []; }
}

// ── Intermediate-stop detection ───────────────────────────────────────────────

/**
 * Sample the GPX track at `maxPoints` positions and reverse-geocode each one.
 * Only includes towns that the track ACTUALLY PASSES THROUGH — verified by
 * checking that the track point is within `maxDistFromPlaceKm` of the matched
 * place's centroid (as returned by Nominatim `lat`/`lon`).
 *
 * This prevents the common bug where Nominatim returns "Lerma" or "Aranda de
 * Duero" for a track point that is 15 km away from those cities in open country.
 *
 * Budget: maxPoints × 0.8 s Nominatim delay ≈ 10 s for 12 points.
 */
async function findIntermediateStops(
  allTracks: GpxTrackInfo[],
  confirmed: ConfirmedPlace[],
  maxDistFromPlaceKm = 2,   // track point must be within 2 km of the place centroid
  minDistFromConfirmedKm = 8,
  maxPoints = 12,
): Promise<IntermediateStop[]> {
  const allPts = allTracks.flatMap(t => t.sampled_pts);
  if (allPts.length === 0) return [];

  const n = Math.min(maxPoints, allPts.length);
  const indices: number[] = [0];
  if (allPts.length > 1) {
    const step = Math.max(1, Math.floor((allPts.length - 1) / (n - 1)));
    for (let i = step; i < allPts.length - 1; i += step) indices.push(i);
    indices.push(allPts.length - 1);
  }
  const pts = [...new Set(indices)].slice(0, n).map(i => allPts[i]);

  const stops: IntermediateStop[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < pts.length; i++) {
    if (i > 0) await sleep(800); // Nominatim ≤ 1 req/s
    const result = await reverseGeocode(pts[i].lat, pts[i].lng);
    if (!result || seen.has(result.name)) continue;

    // KEY CHECK: is the track point actually inside this locality?
    // Nominatim at zoom=13 can still return a city whose centroid is far away.
    // haversine between query point and place centroid filters false matches.
    const distToPlace = haversineKm(pts[i].lat, pts[i].lng, result.placeLat, result.placeLng);
    if (distToPlace > maxDistFromPlaceKm) {
      console.log(`[suggestions] intermediate skip: "${result.name}" centroid is ${distToPlace.toFixed(1)} km from track point`);
      continue;
    }

    // Skip if too close to any confirmed trip stop
    const tooClose = confirmed.some(
      p => p.lat != null && p.lng != null &&
        haversineKm(pts[i].lat, pts[i].lng, p.lat, p.lng) < minDistFromConfirmedKm,
    );
    if (tooClose) continue;

    seen.add(result.name);
    stops.push({ name: result.name, lat: result.placeLat, lng: result.placeLng });
  }
  return stops;
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(
  tripCtx: TripContext,
  confirmed: ConfirmedPlace[],
  intermediate: IntermediateStop[],
  skipNames: string[],
  lang: string,
): { system: string; user: string } {

  const system =
    `You are a world-class travel expert. Respond ONLY with valid JSON — ` +
    `no markdown, no extra text. Language for names and descriptions: ${lang}.`;

  const skipSection = skipNames.length
    ? `\nDo NOT suggest any of these (already in the trip): ${skipNames.join(', ')}.`
    : '';

  let question: string;

  if (confirmed.length >= 1) {
    // List every confirmed stop with its coordinates
    const stopList = confirmed.map((p, i) => {
      const coord = (p.lat != null && p.lng != null)
        ? ` (coords ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`
        : '';
      return `  ${i + 1}. ${p.name}${coord}`;
    }).join('\n');

    // Mention intermediate towns separately
    const interSection = intermediate.length > 0
      ? `\n\nThe cycling GPX track also passes through these towns between the stops above:\n` +
        intermediate.map(s => `  • ${s.name}`).join('\n')
      : '';

    question =
      `I am doing the cycling trip "${tripCtx.title}". ` +
      `The route makes confirmed stops at:\n${stopList}${interSection}\n\n` +
      `For EACH confirmed stop AND each intermediate town, give me EXACTLY 2 iconic, ` +
      `unmissable things to see or do at that specific location — the actual named site ` +
      `(monastery, castle, gorge, palace, viewpoint, museum, bridge, etc.) ` +
      `that defines the place. Be specific: name the real site, not just the town. ` +
      `Give 2 per location even for small villages — if a place is on this historic route ` +
      `it has at least 2 things worth seeing. ` +
      `Do not suggest anything more than 5 km from the given coordinates.`;
  } else {
    // No confirmed places — fall back to a simple route question
    question =
      `What are the top 10 must-see places or experiences for the cycling trip ` +
      `"${tripCtx.title}"? Focus on iconic monuments, natural features, and cultural highlights.`;
  }

  const user = `${question}${skipSection}

Respond ONLY with a JSON array, no other text:
[
  {
    "name": "exact name of the specific site or experience",
    "description": "1-2 sentences explaining why it is unmissable",
    "category": "one of: Nature, Museum, Monument, Viewpoint, Food, Market, Beach, Architecture, Park, Religious, Entertainment, Other",
    "location": "City and Country, e.g. 'Covarrubias, Spain'",
    "near_place": "the name of the confirmed stop or intermediate town where this is located"
  }
]`;

  return { system, user };
}

// ── AI response parsing ───────────────────────────────────────────────────────

type AISuggestion = {
  name: string;
  description: string;
  category: string;
  location?: string;
  near_place?: string;
};

function parseAIJson(raw: string): AISuggestion[] {
  const clean = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  const parsed = JSON.parse(clean) as AISuggestion[];
  if (!Array.isArray(parsed)) throw new Error('AI returned non-array');
  return parsed
    .filter(p => p.name && p.description && p.category)
    .slice(0, 25);
}

// ── AI providers ──────────────────────────────────────────────────────────────

async function askGroq(
  tripCtx: TripContext,
  confirmed: ConfirmedPlace[],
  intermediate: IntermediateStop[],
  skipNames: string[],
  lang: string,
): Promise<AISuggestion[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const { system, user } = buildPrompt(tripCtx, confirmed, intermediate, skipNames, lang);
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      temperature: 0.7,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return parseAIJson(data.choices?.[0]?.message?.content ?? '');
}

async function askGemini(
  tripCtx: TripContext,
  confirmed: ConfirmedPlace[],
  intermediate: IntermediateStop[],
  skipNames: string[],
  lang: string,
): Promise<AISuggestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const { system, user } = buildPrompt(tripCtx, confirmed, intermediate, skipNames, lang);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return parseAIJson(data.candidates?.[0]?.content?.parts?.[0]?.text ?? '');
}

async function askClaude(
  tripCtx: TripContext,
  confirmed: ConfirmedPlace[],
  intermediate: IntermediateStop[],
  skipNames: string[],
  lang: string,
): Promise<AISuggestion[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const { system, user } = buildPrompt(tripCtx, confirmed, intermediate, skipNames, lang);
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
  return parseAIJson(data.content?.find(c => c.type === 'text')?.text ?? '');
}

async function askAI(
  tripCtx: TripContext,
  confirmed: ConfirmedPlace[],
  intermediate: IntermediateStop[],
  skipNames: string[],
  lang: string,
): Promise<AISuggestion[]> {
  if (process.env.GROQ_API_KEY)      return askGroq(tripCtx, confirmed, intermediate, skipNames, lang);
  if (process.env.GEMINI_API_KEY)    return askGemini(tripCtx, confirmed, intermediate, skipNames, lang);
  if (process.env.ANTHROPIC_API_KEY) return askClaude(tripCtx, confirmed, intermediate, skipNames, lang);
  throw new Error(
    'NO_AI_KEY: No AI API key configured. ' +
    'Set GROQ_API_KEY (free), GEMINI_API_KEY (free) or ANTHROPIC_API_KEY.',
  );
}

// ── Geocoding ─────────────────────────────────────────────────────────────────

interface Viewbox { minLat: number; maxLat: number; minLng: number; maxLng: number }

/**
 * Nominatim /search with an optional geographic bounding box.
 * When `viewbox` is supplied the search is bounded to that area (bounded=1),
 * which prevents returning a same-named place in the wrong country.
 * Uses a separate User-Agent from mapsService to avoid sharing rate-limit state.
 */
async function nominatimSearch(
  query: string,
  viewbox?: Viewbox,
): Promise<Array<{ lat: number; lng: number; address: string }>> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    addressdetails: '1',
    'accept-language': 'en',
  });
  if (viewbox) {
    // Nominatim viewbox format: left,top,right,bottom = minLng,maxLat,maxLng,minLat
    params.set('viewbox', `${viewbox.minLng},${viewbox.maxLat},${viewbox.maxLng},${viewbox.minLat}`);
    params.set('bounded', '1');
  }
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'trek-app/1.0' },
    });
    if (!res.ok) return [];
    const data = await res.json() as Array<{ lat: string; lon: string; display_name?: string }>;
    return data
      .map(item => ({ lat: parseFloat(item.lat), lng: parseFloat(item.lon), address: item.display_name ?? '' }))
      .filter(item => !isNaN(item.lat) && !isNaN(item.lng));
  } catch { return []; }
}

async function geocode(
  name: string,
  locationHint: string,
  userId: number,
  viewbox?: Viewbox,
): Promise<{ lat: number | null; lng: number | null; address: string | null }> {
  const fullQuery = locationHint ? `${name}, ${locationHint}` : name;

  // 1. Google Places (if user has a key)
  try {
    const mapsKey = getMapsKey(userId);
    if (mapsKey) {
      const r = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json` +
        `?query=${encodeURIComponent(fullQuery)}&key=${mapsKey}&fields=geometry,formatted_address`,
      );
      if (r.ok) {
        const g = await r.json() as {
          results: Array<{ geometry: { location: { lat: number; lng: number } }; formatted_address: string }>;
        };
        const first = g.results?.[0];
        if (first) return { lat: first.geometry.location.lat, lng: first.geometry.location.lng, address: first.formatted_address };
      }
    }
  } catch { /* fall through */ }

  // 2. Nominatim bounded to the trip area (most reliable — prevents wrong-country results)
  if (viewbox) {
    const r = await nominatimSearch(fullQuery, viewbox);
    if (r[0]) return { lat: r[0].lat, lng: r[0].lng, address: r[0].address };

    // 2b. Name only within viewbox (locationHint might confuse the query)
    await sleep(800);
    const r2 = await nominatimSearch(name, viewbox);
    if (r2[0]) return { lat: r2[0].lat, lng: r2[0].lng, address: r2[0].address };

    await sleep(800);
  }

  // 3. Nominatim unbounded fallback (catches places just outside the viewbox buffer)
  const r3 = await nominatimSearch(fullQuery);
  if (r3[0]) return { lat: r3[0].lat, lng: r3[0].lng, address: r3[0].address };

  if (locationHint) {
    await sleep(800);
    const r4 = await nominatimSearch(name);
    if (r4[0]) return { lat: r4[0].lat, lng: r4[0].lng, address: r4[0].address };
  }

  return { lat: null, lng: null, address: null };
}

/** Find the coordinates for a `near_place` name in our known-stops map. */
function resolveNearCoords(
  nearPlace: string | undefined,
  stopCoords: Map<string, { lat: number; lng: number }>,
): { lat: number; lng: number } | null {
  if (!nearPlace) return null;
  const key = nearPlace.toLowerCase();
  // Exact match
  if (stopCoords.has(key)) return stopCoords.get(key)!;
  // Partial match (AI may shorten or abbreviate the name)
  for (const [k, v] of stopCoords) {
    if (k.includes(key) || key.includes(k)) return v;
  }
  return null;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getMustSeeSuggestions(
  tripId: number,
  userId: number,
  lang = 'en',
): Promise<Suggestion[]> {

  const trip = db
    .prepare('SELECT id, title, description, start_date, end_date FROM trips WHERE id = ?')
    .get(tripId) as TripContext | undefined;
  if (!trip) throw new Error('Trip not found');

  // ── 1. Confirmed stops: all places assigned to days, in route order ────────
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

  // ── 2. GPX tracks for this trip ───────────────────────────────────────────
  const gpxRows = db.prepare(`
    SELECT day_id,
           start_lat, start_lng, end_lat, end_lng,
           points_json
    FROM gpx_tracks
    WHERE trip_id = ? AND is_active = 1
    ORDER BY day_id, sort_order
  `).all(tripId) as Array<{
    day_id: number | null;
    start_lat: number | null; start_lng: number | null;
    end_lat: number | null;   end_lng: number | null;
    points_json: string;
  }>;

  const allTracks: GpxTrackInfo[] = gpxRows.map(row => {
    const sampled_pts = sampleTrackPoints(row.points_json || '[]', 10);
    return {
      day_id:    row.day_id,
      start_lat: row.start_lat ?? sampled_pts[0]?.lat ?? null,
      start_lng: row.start_lng ?? sampled_pts[0]?.lng ?? null,
      end_lat:   row.end_lat   ?? sampled_pts[sampled_pts.length - 1]?.lat ?? null,
      end_lng:   row.end_lng   ?? sampled_pts[sampled_pts.length - 1]?.lng ?? null,
      sampled_pts,
    };
  });

  // ── 3. Intermediate stops: GPX towns NOT close to any confirmed stop ───────
  //
  // Budget: 10 Nominatim calls × 0.8 s = ~8 s
  const intermediate = await findIntermediateStops(allTracks, confirmed);

  console.log(
    `[suggestions] confirmed=${confirmed.length} intermediate=${intermediate.length}`,
    intermediate.map(s => s.name),
  );

  // ── 4. Skip list: places already in the trip ──────────────────────────────
  const skipNames = (
    db.prepare('SELECT name FROM places WHERE trip_id = ?').all(tripId) as Array<{ name: string }>
  ).map(p => p.name);

  // ── 5. Ask AI ──────────────────────────────────────────────────────────────
  const rawSuggestions = await askAI(trip, confirmed, intermediate, skipNames, lang);

  // ── 6. Build coordinate lookup for geographic validation ──────────────────
  const stopCoords = new Map<string, { lat: number; lng: number }>();
  for (const p of confirmed) {
    if (p.lat != null && p.lng != null)
      stopCoords.set(p.name.toLowerCase(), { lat: p.lat, lng: p.lng });
  }
  for (const s of intermediate) {
    stopCoords.set(s.name.toLowerCase(), { lat: s.lat, lng: s.lng });
  }

  // Bounding box from confirmed places + GPX (used for geocode viewbox + validation)
  const allLats = [
    ...confirmed.filter(p => p.lat != null).map(p => p.lat as number),
    ...allTracks.flatMap(t => t.sampled_pts.map(p => p.lat)),
  ];
  const allLngs = [
    ...confirmed.filter(p => p.lng != null).map(p => p.lng as number),
    ...allTracks.flatMap(t => t.sampled_pts.map(p => p.lng)),
  ];
  const tripBounds = allLats.length > 0
    ? {
        minLat: Math.min(...allLats), maxLat: Math.max(...allLats),
        minLng: Math.min(...allLngs), maxLng: Math.max(...allLngs),
      }
    : null;

  // Geocode viewbox: trip bounds + 0.5° buffer (~50 km).
  // Passed to Nominatim so it only returns places within the trip's geographic area,
  // preventing same-named places in the wrong country from being returned.
  const geocodeViewbox: Viewbox | undefined = tripBounds
    ? {
        minLat: tripBounds.minLat - 0.5, maxLat: tripBounds.maxLat + 0.5,
        minLng: tripBounds.minLng - 0.5, maxLng: tripBounds.maxLng + 0.5,
      }
    : undefined;

  // ── 7. Geocode + validate each suggestion ─────────────────────────────────
  const results: Suggestion[] = [];

  for (let i = 0; i < rawSuggestions.length; i++) {
    const s = rawSuggestions[i];
    if (i > 0) await sleep(800); // Nominatim rate limit

    try {
      const locationHint = s.location || s.near_place || trip.title;
      const geo = await geocode(s.name, locationHint, userId, geocodeViewbox);

      // ── Validate: tight check against the near_place coordinates ──────────
      const nearCoords = resolveNearCoords(s.near_place, stopCoords);

      if (nearCoords && geo.lat != null && geo.lng != null) {
        // Tight check: suggestion must be ≤ 20 km from its claimed stop
        const distKm = haversineKm(geo.lat, geo.lng, nearCoords.lat, nearCoords.lng);
        if (distKm > 20) {
          console.warn(
            `[suggestions] "${s.name}" geocoded ${distKm.toFixed(1)} km` +
            ` from "${s.near_place}" — skipped`,
          );
          continue;
        }
      } else if (tripBounds && geo.lat != null && geo.lng != null) {
        // Fallback: broad bounding box + 1.5° buffer
        const B = 1.5;
        if (
          geo.lat < tripBounds.minLat - B || geo.lat > tripBounds.maxLat + B ||
          geo.lng < tripBounds.minLng - B || geo.lng > tripBounds.maxLng + B
        ) {
          console.warn(`[suggestions] "${s.name}" is outside trip bounds — skipped`);
          continue;
        }
      }

      // ── Fetch Wikimedia photo ─────────────────────────────────────────────
      let photo_url: string | null = null;
      if (geo.lat != null && geo.lng != null) {
        try {
          const wiki = await fetchWikimediaPhoto(geo.lat, geo.lng, s.name);
          photo_url = wiki?.photoUrl ?? null;
        } catch { /* no photo — no problem */ }
      }

      results.push({
        name:        s.name,
        description: s.description,
        category:    s.category,
        lat:         geo.lat,
        lng:         geo.lng,
        address:     geo.address,
        photo_url,
        near_place:  s.near_place ?? null,
      });
    } catch (err) {
      console.warn(`[suggestions] geocode failed for "${s.name}":`, err);
    }
  }

  return results;
}
