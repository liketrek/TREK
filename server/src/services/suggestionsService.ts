// ─────────────────────────────────────────────────────────────────────────────
// suggestionsService.ts
//
// "Must See Places" — uses an AI model to suggest unmissable spots for a trip,
// then geocodes them via Nominatim (or Google Places if the user has a key)
// to get coordinates + a photo URL.
//
// Supported AI providers (in priority order):
//   1. Groq            — GROQ_API_KEY      (free: console.groq.com)
//   2. Google Gemini   — GEMINI_API_KEY    (free: aistudio.google.com/apikey)
//   3. Anthropic       — ANTHROPIC_API_KEY (paid)
// ─────────────────────────────────────────────────────────────────────────────

import { db } from '../db/database';
import { getMapsKey, searchNominatim, fetchWikimediaPhoto } from './mapsService';

interface TripContext {
  id: number;
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

interface ExistingPlace {
  name: string;
  address: string | null;
}

// GPX track summary for a single track
interface GpxTrackInfo {
  track_name: string;
  day_id: number | null;
  total_distance: number | null;
  start_lat: number | null; start_lng: number | null;
  end_lat:   number | null; end_lng:   number | null;
  waypoint_names: string[];
  sampled_pts: Array<{ lat: number; lng: number }>; // evenly spaced route points
}

// One entry per day that has at least one assigned place
interface DaySegment {
  day_number: number;
  date: string | null;
  day_title: string | null;
  first: { name: string; address: string | null; lat: number | null; lng: number | null };
  last:  { name: string; address: string | null; lat: number | null; lng: number | null };
  tracks: GpxTrackInfo[]; // GPX tracks assigned to this day
}

export interface Suggestion {
  name: string;
  description: string;
  category: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  photo_url?: string | null;
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// Reverse-geocode a single coordinate to the nearest town/village name.
// Uses Nominatim /reverse — much faster than forward search.
// Returns null on failure (caller skips gracefully).
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&accept-language=en`;
    const res = await fetch(url, { headers: { 'User-Agent': 'trek-app/1.0' } });
    if (!res.ok) return null;
    const data = await res.json() as {
      address?: { village?: string; town?: string; city?: string; municipality?: string; county?: string; country?: string };
    };
    const a = data.address;
    if (!a) return null;
    const locality = a.village || a.town || a.city || a.municipality || a.county;
    return locality ? `${locality}, ${a.country ?? ''}`.trim().replace(/,$/, '') : null;
  } catch { return null; }
}

// Resolve named stops for a set of tracks.
// If waypoints exist → use them directly.
// If not → reverse-geocode sampled track points (up to 10) to get town names.
// Returns the resolved stop names in route order, deduplicated.
async function resolveTrackStops(
  allTracks: GpxTrackInfo[],
): Promise<string[]> {
  const allWaypoints = allTracks.flatMap(t => t.waypoint_names);
  if (allWaypoints.length > 0) {
    // Deduplicate while preserving route order
    return [...new Set(allWaypoints)];
  }

  // No named waypoints — reverse-geocode sampled points
  const allPts = allTracks.flatMap(t => t.sampled_pts);
  if (allPts.length === 0) return [];

  // Pick up to 10 evenly-spaced points (more = better town coverage on long routes)
  const maxPts = Math.min(10, allPts.length);
  const indices: number[] = [0];
  if (allPts.length > 1) {
    const step = Math.max(1, Math.floor((allPts.length - 1) / (maxPts - 1)));
    for (let i = step; i < allPts.length - 1; i += step) indices.push(i);
    indices.push(allPts.length - 1);
  }
  const pts = [...new Set(indices)].slice(0, maxPts).map(i => allPts[i]);

  const stops: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) await sleep(800); // Nominatim 1 req/sec policy
    const name = await reverseGeocode(pts[i].lat, pts[i].lng);
    if (name && !seen.has(name)) {
      seen.add(name);
      stops.push(name);
    }
  }
  return stops;
}

// Extract the most meaningful city/country label from a full address string.
function extractCity(address: string | null, fallback: string): string {
  if (!address) return fallback;
  const parts = address.split(',').map(p => p.trim()).filter(p => p && !/^\d{4,}/.test(p));
  if (parts.length >= 2) return parts.slice(-2).join(', ');
  return parts[0] || fallback;
}

// Sample up to `n` evenly-spaced points from a GPX points_json string.
// Always includes the very first and very last point.
function sampleTrackPoints(pointsJson: string, n = 10): Array<{ lat: number; lng: number }> {
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

// Format a coordinate pair for the AI prompt
function fmtCoord(p: { lat: number; lng: number }): string {
  return `${p.lat.toFixed(3)}°${p.lat >= 0 ? 'N' : 'S'} ${Math.abs(p.lng).toFixed(3)}°${p.lng <= 0 ? 'W' : 'E'}`;
}

function buildPrompt(
  tripCtx: TripContext,
  daySegments: DaySegment[],
  tripTracks: GpxTrackInfo[],
  resolvedStops: string[],   // named stops: waypoints or reverse-geocoded towns
  skipNames: string[],
  lang: string,
): { system: string; user: string } {

  const system = `You are a world-class travel expert. Respond ONLY with valid JSON — no markdown, no explanation. Language for names and descriptions: ${lang}.`;

  // ── Collect GPS context ───────────────────────────────────────────────────
  const allTracks     = [...tripTracks, ...daySegments.flatMap(d => d.tracks)];
  const allSampledPts = allTracks.flatMap(t => t.sampled_pts);

  // ── Build the question ───────────────────────────────────────────────────
  const total = daySegments.length > 0
    ? Math.max(8, Math.min(daySegments.length * 2, 12))
    : 10;

  const skipSection = skipNames.length
    ? `\nDo NOT suggest any of these (already visited): ${skipNames.join(', ')}.`
    : '';

  let question: string;

  if (resolvedStops.length >= 2) {
    // ── Per-town landmark extraction ──────────────────────────────────────
    // Asking "what are the top N places on this route?" causes the AI to run a
    // global competition where small-town gems (Monasterio de Silos, Palacio de
    // Avellaneda) lose to larger cities. Instead, we ask for the most famous
    // landmark IN EACH specific town — the AI knows exactly what it is.
    const townList = resolvedStops.map((s, i) => `${i + 1}. ${s}`).join('\n');
    question = `I am doing the trip "${tripCtx.title}". My GPS route passes through these specific places, in order:\n${townList}\n\nFor EACH place listed above, give me the 1-2 most famous, iconic, and unmissable landmarks, monuments, or natural sites that define that specific place (the monastery, castle, gorge, palace, viewpoint, etc. that the place is best known for). Be specific — name the actual site, not just the town. Cover all the places listed. Do not suggest places from other regions.`;

  } else if (allSampledPts.length >= 2) {
    // ── GPS coords but no named stops ────────────────────────────────────
    const fromLabel = fmtCoord(allSampledPts[0]);
    const toLabel   = fmtCoord(allSampledPts[allSampledPts.length - 1]);
    question = `I am doing the trip "${tripCtx.title}", travelling from ${fromLabel} to ${toLabel}. What are the top ${total} must-see places, villages, monuments, or experiences along this specific route? Prioritise places physically on or very close to the route. Do not suggest places from other regions.`;

  } else {
    // ── Fallback: no GPS data, use day anchors or trip title ─────────────
    let routeFrom: string | null = null;
    let routeTo:   string | null = null;
    if (daySegments.length > 0) {
      routeFrom = extractCity(daySegments[0].first.address, daySegments[0].first.name);
      const last = daySegments[daySegments.length - 1];
      routeTo   = extractCity(last.last.address, last.last.name);
    }
    if (routeFrom && routeTo && routeFrom !== routeTo) {
      question = `I am doing the trip "${tripCtx.title}", travelling from ${routeFrom} to ${routeTo}. What are the top ${total} must-see places, villages, monuments, or experiences along this route? Only include places on or very close to this route.`;
    } else if (routeFrom) {
      question = `I am doing the trip "${tripCtx.title}" near ${routeFrom}. What are the top ${total} must-see places or experiences in this area?`;
    } else {
      question = `What are the top ${total} must-see places or experiences for the trip "${tripCtx.title}"?`;
    }
  }

  const user = `${question}${skipSection}

Respond ONLY with a JSON array, no other text:
[
  {
    "name": "exact place name in the local language or English",
    "description": "1-2 sentences on why this is unmissable",
    "category": "one of: Nature, Museum, Monument, Viewpoint, Food, Market, Beach, Architecture, Park, Religious, Entertainment, Other",
    "location": "City and Country, e.g. 'Porto, Portugal'"
  }
]`;

  return { system, user };
}

function parseAIJson(raw: string): Array<{ name: string; description: string; category: string; location?: string }> {
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const parsed = JSON.parse(clean) as Array<{ name: string; description: string; category: string; location?: string }>;
  if (!Array.isArray(parsed)) throw new Error('AI returned non-array response');
  return parsed.filter(p => p.name && p.description && p.category).slice(0, 20);
}

// ── Groq (OpenAI-compatible, free) ──────────────────────────────────────────

async function askGroq(tripCtx: TripContext, daySegments: DaySegment[], tripTracks: GpxTrackInfo[], resolvedStops: string[], skipNames: string[], lang: string): Promise<Array<{ name: string; description: string; category: string; location?: string }>> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const { system, user } = buildPrompt(tripCtx, daySegments, tripTracks, resolvedStops, skipNames, lang);

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Groq API error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  const raw = data.choices?.[0]?.message?.content ?? '';
  return parseAIJson(raw);
}

// ── Google Gemini ────────────────────────────────────────────────────────────

async function askGemini(tripCtx: TripContext, daySegments: DaySegment[], tripTracks: GpxTrackInfo[], resolvedStops: string[], skipNames: string[], lang: string): Promise<Array<{ name: string; description: string; category: string; location?: string }>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const { system, user } = buildPrompt(tripCtx, daySegments, tripTracks, resolvedStops, skipNames, lang);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Gemini API error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return parseAIJson(raw);
}

// ── Anthropic Claude ─────────────────────────────────────────────────────────

async function askClaude(tripCtx: TripContext, daySegments: DaySegment[], tripTracks: GpxTrackInfo[], resolvedStops: string[], skipNames: string[], lang: string): Promise<Array<{ name: string; description: string; category: string; location?: string }>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  const { system, user } = buildPrompt(tripCtx, daySegments, tripTracks, resolvedStops, skipNames, lang);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
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

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Claude API error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const raw = data.content?.find(c => c.type === 'text')?.text ?? '';
  return parseAIJson(raw);
}

// ── AI router: Groq → Gemini → Claude ───────────────────────────────────────

async function askAI(tripCtx: TripContext, daySegments: DaySegment[], tripTracks: GpxTrackInfo[], resolvedStops: string[], skipNames: string[], lang: string): Promise<Array<{ name: string; description: string; category: string; location?: string }>> {
  if (process.env.GROQ_API_KEY) return askGroq(tripCtx, daySegments, tripTracks, resolvedStops, skipNames, lang);
  if (process.env.GEMINI_API_KEY) return askGemini(tripCtx, daySegments, tripTracks, resolvedStops, skipNames, lang);
  if (process.env.ANTHROPIC_API_KEY) return askClaude(tripCtx, daySegments, tripTracks, resolvedStops, skipNames, lang);
  throw new Error('NO_AI_KEY: No AI API key configured. Set GROQ_API_KEY (free), GEMINI_API_KEY (free) or ANTHROPIC_API_KEY in your .env file.');
}

// Bounding box of all day-anchor coordinates, used to reject suggestions that
// fall outside the trip's geographic area.
interface TripBounds { minLat: number; maxLat: number; minLng: number; maxLng: number }

function getTripBounds(daySegments: DaySegment[], allTracks: GpxTrackInfo[]): TripBounds | null {
  const lats: number[] = [];
  const lngs: number[] = [];
  // Day-anchor places
  for (const d of daySegments) {
    if (d.first.lat != null && d.first.lng != null) { lats.push(d.first.lat); lngs.push(d.first.lng); }
    if (d.last.lat  != null && d.last.lng  != null) { lats.push(d.last.lat);  lngs.push(d.last.lng);  }
  }
  // GPX track start/end points (much more precise than day anchors for trekking)
  for (const t of allTracks) {
    if (t.start_lat != null && t.start_lng != null) { lats.push(t.start_lat); lngs.push(t.start_lng); }
    if (t.end_lat   != null && t.end_lng   != null) { lats.push(t.end_lat);   lngs.push(t.end_lng);   }
  }
  if (lats.length === 0) return null;
  return { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLng: Math.min(...lngs), maxLng: Math.max(...lngs) };
}

function isWithinTripBounds(lat: number, lng: number, bounds: TripBounds): boolean {
  // 1.5° ≈ 130–167 km buffer around the bounding box of all day anchors.
  const B = 1.5;
  return lat >= bounds.minLat - B && lat <= bounds.maxLat + B
      && lng >= bounds.minLng - B && lng <= bounds.maxLng + B;
}

// ── Geocode a single suggestion ───────────────────────────────────────────────
//
// locationHint — city + country supplied by the AI, e.g. "Sevilla, Spain".
// Using it as context prevents Nominatim from finding a place with the same
// name on the wrong continent.
//
// Strategy:
//   1. Google Places (if user has a key): "name, locationHint"
//   2. Nominatim: "name, locationHint"   ← precise, uses AI-supplied city
//   3. Nominatim: name only              ← last resort, may be ambiguous
//
// Nominatim policy: max 1 req/sec. Callers must add delay between invocations.

async function geocode(name: string, locationHint: string, userId: number): Promise<{ lat: number | null; lng: number | null; address: string | null }> {
  const query = locationHint ? `${name}, ${locationHint}` : name;

  // ── 1. Google Places ───────────────────────────────────────────────────────
  try {
    const mapsKey = getMapsKey(userId);
    if (mapsKey) {
      const googleRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${mapsKey}&fields=geometry,formatted_address`,
      );
      if (googleRes.ok) {
        const gdata = await googleRes.json() as {
          results: Array<{ geometry: { location: { lat: number; lng: number } }; formatted_address: string }>;
        };
        const first = gdata.results?.[0];
        if (first) {
          return {
            lat: first.geometry.location.lat,
            lng: first.geometry.location.lng,
            address: first.formatted_address ?? null,
          };
        }
      }
    }
  } catch { /* fall through to Nominatim */ }

  // ── 2. Nominatim: name + location hint (most reliable) ───────────────────
  try {
    const nResults = await searchNominatim(query);
    const first = nResults[0];
    if (first && first.lat != null && first.lng != null) {
      return { lat: first.lat, lng: first.lng, address: first.address ?? null };
    }
  } catch { /* fall through */ }

  // ── 3. Nominatim: name only (last resort — may be ambiguous) ─────────────
  if (locationHint) {
    try {
      await sleep(800); // respect 1 req/sec policy
      const nResults = await searchNominatim(name);
      const first = nResults[0];
      if (first && first.lat != null && first.lng != null) {
        return { lat: first.lat, lng: first.lng, address: first.address ?? null };
      }
    } catch { /* fall through */ }
  }

  return { lat: null, lng: null, address: null };
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getMustSeeSuggestions(tripId: number, userId: number, lang = 'en'): Promise<Suggestion[]> {
  const trip = db.prepare('SELECT id, title, description, start_date, end_date FROM trips WHERE id = ?').get(tripId) as TripContext | undefined;
  if (!trip) throw new Error('Trip not found');

  // ── Build day segments: first + last place per day, with coordinates ────
  // ── Query active GPX tracks for this trip ────────────────────────────────
  const gpxRows = db.prepare(`
    SELECT track_name, day_id, total_distance,
           start_lat, start_lng, end_lat, end_lng,
           waypoints_json, points_json
    FROM gpx_tracks
    WHERE trip_id = ? AND is_active = 1
    ORDER BY day_id, sort_order
  `).all(tripId) as Array<{
    track_name: string; day_id: number | null; total_distance: number | null;
    start_lat: number | null; start_lng: number | null;
    end_lat:   number | null; end_lng:   number | null;
    waypoints_json: string; points_json: string;
  }>;

  const parseTrack = (row: typeof gpxRows[0]): GpxTrackInfo => {
    let waypoint_names: string[] = [];
    try {
      const wpts = JSON.parse(row.waypoints_json || '[]') as Array<{ name?: string }>;
      waypoint_names = wpts.map(w => w.name ?? '').filter(Boolean);
    } catch { /* ignore */ }
    const sampled_pts = sampleTrackPoints(row.points_json || '[]', 10);
    // If start/end aren't in DB, derive them from sampled points
    const start_lat = row.start_lat ?? sampled_pts[0]?.lat ?? null;
    const start_lng = row.start_lng ?? sampled_pts[0]?.lng ?? null;
    const end_lat   = row.end_lat   ?? sampled_pts[sampled_pts.length - 1]?.lat ?? null;
    const end_lng   = row.end_lng   ?? sampled_pts[sampled_pts.length - 1]?.lng ?? null;
    return { ...row, start_lat, start_lng, end_lat, end_lng, waypoint_names, sampled_pts };
  };

  // Split tracks: day-assigned vs trip-level (day_id = null)
  const gpxByDayId = new Map<number, GpxTrackInfo[]>();
  const tripLevelTracks: GpxTrackInfo[] = [];
  for (const row of gpxRows) {
    const t = parseTrack(row);
    if (row.day_id != null) {
      if (!gpxByDayId.has(row.day_id)) gpxByDayId.set(row.day_id, []);
      gpxByDayId.get(row.day_id)!.push(t);
    } else {
      tripLevelTracks.push(t);
    }
  }

  // ── Build day segments: first + last place per day, with coordinates ────
  const dayRows = db.prepare(`
    SELECT
      d.day_number, d.id AS day_id,
      d.date,
      d.title          AS day_title,
      p.name,
      p.address,
      p.lat,
      p.lng,
      da.order_index
    FROM days d
    JOIN day_assignments da ON da.day_id = d.id
    JOIN places p           ON p.id = da.place_id
    WHERE d.trip_id = ?
    ORDER BY d.day_number, da.order_index
  `).all(tripId) as Array<{
    day_number: number; day_id: number; date: string | null; day_title: string | null;
    name: string; address: string | null; lat: number | null; lng: number | null;
    order_index: number;
  }>;

  // Group rows by day_number, preserving insertion order
  const byDay = new Map<number, typeof dayRows>();
  for (const row of dayRows) {
    if (!byDay.has(row.day_number)) byDay.set(row.day_number, []);
    byDay.get(row.day_number)!.push(row);
  }

  const daySegments: DaySegment[] = [];
  for (const [, rows] of byDay) {
    const f = rows[0];
    const l = rows[rows.length - 1];
    daySegments.push({
      day_number: f.day_number,
      date:       f.date,
      day_title:  f.day_title,
      first: { name: f.name, address: f.address, lat: f.lat, lng: f.lng },
      last:  { name: l.name, address: l.address, lat: l.lat, lng: l.lng },
      tracks: gpxByDayId.get(f.day_id) ?? [],
    });
  }

  // All GPX tracks (for bounding box)
  const allTracks = [...tripLevelTracks, ...Array.from(gpxByDayId.values()).flat()];

  // Bounding box: day anchors + GPX track endpoints
  const tripBounds = getTripBounds(daySegments, allTracks);

  // All place names already in the trip (for the "skip" list)
  const skipNames = (db.prepare('SELECT name FROM places WHERE trip_id = ?').all(tripId) as Array<{ name: string }>)
    .map(p => p.name);

  // Resolve named stops for the route:
  // - If track has <wpt> waypoints → use them (instant, no extra calls)
  // - If not → reverse-geocode sampled GPS points to get real town names
  //   so the AI knows "Covarrubias, Spain" instead of "41.840°N 3.420°W"
  const resolvedStops = await resolveTrackStops(allTracks);

  const rawSuggestions = await askAI(trip, daySegments, tripLevelTracks, resolvedStops, skipNames, lang);

  // Process sequentially: Nominatim enforces 1 req/sec — parallel bursts cause
  // silent failures. 800 ms gap stays within policy and keeps total latency low.
  const results: Suggestion[] = [];

  for (let i = 0; i < rawSuggestions.length; i++) {
    const s = rawSuggestions[i];

    // Delay before every Nominatim geocode call except the first
    if (i > 0) await sleep(800);

    try {
      // The AI knows where each place is — use its "location" field directly.
      const locationHint = s.location || trip.title;
      const geo = await geocode(s.name, locationHint, userId);

      // ── Geographic sanity check ─────────────────────────────────────────
      // Reject suggestions that geocode outside the trip's bounding box
      // + 1.5° buffer (~130–170 km). Catches AI hallucinations like
      // "Catedral de Salamanca" in a Porto → Figueira da Foz trip.
      if (tripBounds && geo.lat != null && geo.lng != null) {
        if (!isWithinTripBounds(geo.lat, geo.lng, tripBounds)) {
          console.warn(`[suggestions] "${s.name}" (${geo.lat.toFixed(2)},${geo.lng.toFixed(2)}) is outside trip bounds — skipped`);
          continue;
        }
      }

      let photo_url: string | null = null;
      if (geo.lat != null && geo.lng != null) {
        try {
          const wikiResult = await fetchWikimediaPhoto(geo.lat, geo.lng, s.name);
          photo_url = wikiResult?.photoUrl ?? null;
        } catch { /* no photo — no problem */ }
      }

      results.push({
        name: s.name,
        description: s.description,
        category: s.category,
        lat: geo.lat,
        lng: geo.lng,
        address: geo.address,
        photo_url,
      });
    } catch (err) {
      console.warn(`[suggestions] geocode failed for "${s.name}":`, err);
    }
  }

  return results;
}
