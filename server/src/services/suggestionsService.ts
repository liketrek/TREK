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

// One entry per day that has at least one assigned place
interface DaySegment {
  day_number: number;
  date: string | null;
  day_title: string | null;
  first: { name: string; address: string | null; lat: number | null; lng: number | null };
  last:  { name: string; address: string | null; lat: number | null; lng: number | null };
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

// ── Shared prompt builder ────────────────────────────────────────────────────

function buildPrompt(
  tripCtx: TripContext,
  daySegments: DaySegment[],
  skipNames: string[],
  lang: string,
): { system: string; user: string } {
  const dateRange = [tripCtx.start_date, tripCtx.end_date].filter(Boolean).join(' → ');

  const system = `You are a world-class travel expert. When asked for must-see places for a trip, you respond ONLY with valid JSON — no markdown, no explanation. Language for names and descriptions: ${lang}.`;

  let contextSection: string;
  let instruction: string;

  if (daySegments.length > 0) {
    // ── Day-by-day route: suggest 2-3 places per day ──────────────────────
    const dayLines = daySegments.map(d => {
      const dateLabel = d.date ? ` (${d.date})` : '';
      const titleLabel = d.day_title ? ` — ${d.day_title}` : '';
      const fmt = (p: { name: string; address: string | null }) =>
        p.address ? `"${p.name}" (${p.address})` : `"${p.name}"`;
      const geo = d.first.name === d.last.name
        ? `near ${fmt(d.first)}`
        : `from ${fmt(d.first)} to ${fmt(d.last)}`;
      return `  Day ${d.day_number}${dateLabel}${titleLabel}: ${geo}`;
    });
    contextSection = `\nTrip itinerary by day:\n${dayLines.join('\n')}`;
    const total = daySegments.length <= 3 ? daySegments.length * 3 : daySegments.length * 2;
    instruction = `For EACH day listed above, suggest 2-3 must-see places that are in the SAME city or within a very short distance of that day's anchor locations. CRITICAL: do NOT suggest places from other cities, regions, or countries that are not part of this itinerary. Every suggestion must be physically reachable from that day's start/end point. Aim for ${total} suggestions total, evenly distributed across all days.`;
  } else {
    // ── No day assignments yet: fall back to generic top-8 ───────────────
    contextSection = '';
    instruction = `List the top 8 must-see places or experiences for this trip. If the trip visits multiple cities or regions, spread suggestions proportionally across ALL of them.`;
  }

  const skipSection = skipNames.length
    ? `\nDo NOT suggest any of these (already in itinerary): ${skipNames.join(', ')}`
    : '';

  const user = `Trip: "${tripCtx.title}"${tripCtx.description ? `\nDetails: ${tripCtx.description}` : ''}${dateRange ? `\nDates: ${dateRange}` : ''}${contextSection}${skipSection}

${instruction} Focus on iconic, unique, or highly recommended spots.

Respond ONLY with a JSON array, no other text:
[
  {
    "name": "exact place name in the local language or English",
    "description": "1-2 sentences on why this is unmissable",
    "category": "one of: Nature, Museum, Monument, Viewpoint, Food, Market, Beach, Architecture, Park, Religious, Entertainment, Other",
    "location": "City and Country where this place is, e.g. 'Sevilla, Spain' or 'Kyoto, Japan'"
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

async function askGroq(tripCtx: TripContext, daySegments: DaySegment[], skipNames: string[], lang: string): Promise<Array<{ name: string; description: string; category: string; location?: string }>> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const { system, user } = buildPrompt(tripCtx, daySegments, skipNames, lang);

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

async function askGemini(tripCtx: TripContext, daySegments: DaySegment[], skipNames: string[], lang: string): Promise<Array<{ name: string; description: string; category: string; location?: string }>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const { system, user } = buildPrompt(tripCtx, daySegments, skipNames, lang);
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

async function askClaude(tripCtx: TripContext, daySegments: DaySegment[], skipNames: string[], lang: string): Promise<Array<{ name: string; description: string; category: string; location?: string }>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  const { system, user } = buildPrompt(tripCtx, daySegments, skipNames, lang);

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

async function askAI(tripCtx: TripContext, daySegments: DaySegment[], skipNames: string[], lang: string): Promise<Array<{ name: string; description: string; category: string; location?: string }>> {
  if (process.env.GROQ_API_KEY) return askGroq(tripCtx, daySegments, skipNames, lang);
  if (process.env.GEMINI_API_KEY) return askGemini(tripCtx, daySegments, skipNames, lang);
  if (process.env.ANTHROPIC_API_KEY) return askClaude(tripCtx, daySegments, skipNames, lang);
  throw new Error('NO_AI_KEY: No AI API key configured. Set GROQ_API_KEY (free), GEMINI_API_KEY (free) or ANTHROPIC_API_KEY in your .env file.');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// Bounding box of all day-anchor coordinates, used to reject suggestions that
// fall outside the trip's geographic area.
interface TripBounds { minLat: number; maxLat: number; minLng: number; maxLng: number }

function getTripBounds(daySegments: DaySegment[]): TripBounds | null {
  const lats: number[] = [];
  const lngs: number[] = [];
  for (const d of daySegments) {
    if (d.first.lat != null && d.first.lng != null) { lats.push(d.first.lat); lngs.push(d.first.lng); }
    if (d.last.lat  != null && d.last.lng  != null) { lats.push(d.last.lat);  lngs.push(d.last.lng);  }
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
  const dayRows = db.prepare(`
    SELECT
      d.day_number,
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
    day_number: number; date: string | null; day_title: string | null;
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
    });
  }

  // Bounding box of the whole trip (for post-geocoding validation)
  const tripBounds = getTripBounds(daySegments);

  // All place names already in the trip (for the "skip" list)
  const skipNames = (db.prepare('SELECT name FROM places WHERE trip_id = ?').all(tripId) as Array<{ name: string }>)
    .map(p => p.name);

  const rawSuggestions = await askAI(trip, daySegments, skipNames, lang);

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
