import { getAppUrl } from './notifications';
import { buildUserAgent } from './mapsService';

/**
 * Public transit routing (#1065) backed by Transitous (api.transitous.org), the
 * community-run MOTIS instance over public GTFS feeds — free, no API key, fits
 * TREK's no-paid-providers rule. Self-hosters can point TRANSIT_API_URL at their
 * own MOTIS instance instead.
 *
 * This service is a thin, validating proxy: the browser never talks to
 * Transitous directly (their usage policy wants an identifying User-Agent with
 * contact info, which we send once from the server), and responses are mapped
 * to a compact shape so the client isn't coupled to the MOTIS schema.
 */

const TRANSIT_API_BASE = (process.env.TRANSIT_API_URL || 'https://api.transitous.org').replace(/\/+$/, '');
const UA = buildUserAgent(getAppUrl());

// Modes the client may request — a strict whitelist so the proxy can't be used
// to smuggle arbitrary query values upstream. TRANSIT covers everything; the
// others let the user filter (RAIL already includes subway/suburban etc.).
const ALLOWED_MODES = new Set([
  'TRANSIT', 'BUS', 'COACH', 'TRAM', 'SUBWAY', 'RAIL', 'FERRY', 'FUNICULAR', 'AERIAL_LIFT',
  // Fine-grained rail modes so "train without subway" is expressible (RAIL
  // itself includes SUBWAY per the MOTIS mode taxonomy).
  'HIGHSPEED_RAIL', 'LONG_DISTANCE', 'NIGHT_RAIL', 'REGIONAL_RAIL', 'SUBURBAN',
]);

// Short-lived response cache: planning is the expensive call per the Transitous
// usage policy, and a user toggling filters re-requests identical plans.
const CACHE_TTL = 60 * 1000;
const CACHE_MAX = 200;
const cache = new Map<string, { at: number; data: unknown }>();

function cacheGet(key: string): unknown | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL) { cache.delete(key); return null; }
  return hit.data;
}

function cacheSet(key: string, data: unknown): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), data });
}

const COORD_RE = /^-?\d{1,3}(\.\d+)?,-?\d{1,3}(\.\d+)?$/;

function isCoord(v: string): boolean {
  if (!COORD_RE.test(v)) return false;
  const [lat, lng] = v.split(',').map(Number);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

async function upstream(path: string, params: URLSearchParams): Promise<unknown> {
  const url = `${TRANSIT_API_BASE}${path}?${params}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) {
    const err = new Error(`Transit provider error (HTTP ${res.status})`) as Error & { status: number };
    err.status = res.status === 429 ? 429 : 502;
    throw err;
  }
  return res.json();
}

// ── Geocode ──────────────────────────────────────────────────────────────────

export interface TransitPlace {
  name: string;
  lat: number;
  lng: number;
  type: string;
  area: string | null;
}

/** Station/place search for the from/to pickers. `near` biases results. */
export async function geocode(query: string, language?: string, near?: string): Promise<{ results: TransitPlace[] }> {
  const text = (query || '').trim();
  if (text.length < 2) return { results: [] };
  if (text.length > 200) { const e = new Error('Query too long') as Error & { status: number }; e.status = 400; throw e; }

  const params = new URLSearchParams({ text });
  if (language) params.set('language', language.slice(0, 5));
  if (near && isCoord(near)) params.set('place', near);

  const key = `geo:${params.toString()}`;
  const cached = cacheGet(key);
  if (cached) return cached as { results: TransitPlace[] };

  const raw = (await upstream('/api/v1/geocode', params)) as Array<{
    name?: string; lat?: number; lon?: number; type?: string;
    areas?: Array<{ name?: string; matched?: boolean; default?: boolean }>;
  }>;

  const results: TransitPlace[] = (Array.isArray(raw) ? raw : []).slice(0, 8).flatMap((m) => {
    if (typeof m.lat !== 'number' || typeof m.lon !== 'number' || !m.name) return [];
    const area = m.areas?.find((a) => a.default)?.name || m.areas?.[0]?.name || null;
    return [{ name: m.name, lat: m.lat, lng: m.lon, type: m.type || 'PLACE', area }];
  });

  const data = { results };
  cacheSet(key, data);
  return data;
}

// ── Plan ─────────────────────────────────────────────────────────────────────

export interface TransitLegStop {
  name: string;
  lat: number;
  lng: number;
  time: string | null;
  scheduledTime: string | null;
  track: string | null;
}

export interface TransitLeg {
  mode: string;
  from: TransitLegStop;
  to: TransitLegStop;
  duration: number;
  distance: number | null;
  headsign: string | null;
  line: string | null;
  lineColor: string | null;
  lineTextColor: string | null;
  agency: string | null;
  intermediateStops: number;
}

export interface TransitItinerary {
  startTime: string;
  endTime: string;
  duration: number;
  transfers: number;
  walkSeconds: number;
  legs: TransitLeg[];
}

export interface PlanQuery {
  from: string;
  to: string;
  time?: string;
  arriveBy?: boolean;
  modes?: string;
  maxTransfers?: number;
}

// GTFS colors come as bare hex ("FF0000"), with hash, or empty — normalise to
// a #-prefixed value or null so the client can use them in CSS directly.
function safeColor(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const hex = v.trim().replace(/^#/, '');
  return /^[0-9a-fA-F]{6}$/.test(hex) || /^[0-9a-fA-F]{3}$/.test(hex) ? `#${hex}` : null;
}

interface MotisPlaceRaw {
  name?: string; lat?: number; lon?: number;
  departure?: string; arrival?: string;
  scheduledDeparture?: string; scheduledArrival?: string;
  track?: string; scheduledTrack?: string;
}

function mapStop(p: MotisPlaceRaw | undefined, kind: 'departure' | 'arrival'): TransitLegStop {
  return {
    name: p?.name || '',
    lat: typeof p?.lat === 'number' ? p.lat : 0,
    lng: typeof p?.lon === 'number' ? p.lon : 0,
    time: (kind === 'departure' ? p?.departure : p?.arrival) || null,
    scheduledTime: (kind === 'departure' ? p?.scheduledDeparture : p?.scheduledArrival) || null,
    track: p?.track || p?.scheduledTrack || null,
  };
}

/** Route search between two coordinates. Returns compact itineraries for the picker. */
export async function plan(q: PlanQuery): Promise<{ itineraries: TransitItinerary[] }> {
  const bad = (msg: string) => { const e = new Error(msg) as Error & { status: number }; e.status = 400; throw e; };
  if (!q.from || !isCoord(q.from)) bad('from must be "lat,lng"');
  if (!q.to || !isCoord(q.to)) bad('to must be "lat,lng"');

  const params = new URLSearchParams({ fromPlace: q.from, toPlace: q.to, numItineraries: '8' });

  if (q.time) {
    const parsed = new Date(q.time);
    if (isNaN(parsed.getTime())) bad('time must be an ISO date-time');
    params.set('time', parsed.toISOString());
  }
  if (q.arriveBy) params.set('arriveBy', 'true');

  if (q.modes) {
    const modes = q.modes.split(',').map((m) => m.trim().toUpperCase()).filter(Boolean);
    if (modes.some((m) => !ALLOWED_MODES.has(m))) bad('unsupported transit mode');
    if (modes.length > 0) params.set('transitModes', modes.join(','));
  }
  if (q.maxTransfers !== undefined && q.maxTransfers !== null) {
    const n = Number(q.maxTransfers);
    if (!Number.isInteger(n) || n < 0 || n > 10) bad('maxTransfers must be 0-10');
    params.set('maxTransfers', String(n));
  }
  // We only want scheduled transit journeys in the results — a pure-walk
  // "direct" connection is what the existing OSRM footpath routing is for.
  params.set('directModes', 'WALK');

  const key = `plan:${params.toString()}`;
  const cached = cacheGet(key);
  if (cached) return cached as { itineraries: TransitItinerary[] };

  const raw = (await upstream('/api/v6/plan', params)) as {
    itineraries?: Array<{
      duration?: number; startTime?: string; endTime?: string; transfers?: number;
      legs?: Array<{
        mode?: string; duration?: number; distance?: number; headsign?: string;
        routeShortName?: string; displayName?: string; routeColor?: string; routeTextColor?: string;
        agencyName?: string; from?: MotisPlaceRaw; to?: MotisPlaceRaw;
        intermediateStops?: unknown[];
      }>;
    }>;
  };

  const itineraries: TransitItinerary[] = (raw.itineraries || []).flatMap((it) => {
    if (!it.startTime || !it.endTime || !Array.isArray(it.legs)) return [];
    const legs: TransitLeg[] = it.legs.map((leg) => ({
      mode: (leg.mode || 'WALK').toUpperCase(),
      from: mapStop(leg.from, 'departure'),
      to: mapStop(leg.to, 'arrival'),
      duration: typeof leg.duration === 'number' ? leg.duration : 0,
      distance: typeof leg.distance === 'number' ? Math.round(leg.distance) : null,
      headsign: leg.headsign || null,
      line: leg.routeShortName || leg.displayName || null,
      lineColor: safeColor(leg.routeColor),
      lineTextColor: safeColor(leg.routeTextColor),
      agency: leg.agencyName || null,
      intermediateStops: Array.isArray(leg.intermediateStops) ? leg.intermediateStops.length : 0,
    }));
    const walkSeconds = legs.filter((l) => l.mode === 'WALK').reduce((a, l) => a + l.duration, 0);
    return [{
      startTime: it.startTime,
      endTime: it.endTime,
      // Wall-clock duration (start→end) so waits/transfers count — summing leg
      // run-times would understate the journey and mis-slot it in the timeline.
      duration: Math.max(0, Math.round((new Date(it.endTime).getTime() - new Date(it.startTime).getTime()) / 1000)),
      transfers: typeof it.transfers === 'number' ? it.transfers : Math.max(0, legs.filter((l) => l.mode !== 'WALK').length - 1),
      walkSeconds,
      legs,
    }];
  });

  const data = { itineraries };
  cacheSet(key, data);
  return data;
}
