import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { day, monthsAhead, PICTURE_DAY_ISO } from '../dates';
import { setTripCover } from '../screenshots/photos';
import { clearNotices } from '../screenshots/shot';
import { seededTrip } from './fixtures';
import { dismissReleaseNotice, settle } from './guide';
import { closeDayDetails, selectDay } from './trip-shared';

/**
 * The demo data every Tours help picture runs on.
 *
 * Two trips of their own and two tours on the seeded "Autumn in Japan":
 *
 *  - "Summer in the Dolomites", ten days next July: a three-stage hut trek
 *    with its huts on the days, a day hike over a via ferrata, a road bike
 *    loop over the four passes, an MTB loop kept in the collection
 *    "Dolomites ideas" and on no day, a run, a boat tour on Lago di Braies, a
 *    horse ride on the Seiser Alm, a city walk through Bolzano and one
 *    imported GPX track, recorded last summer.
 *  - "Ski week in Val Gardena", a week next February: the Sella Ronda on
 *    skis where the piste router can plan it, and a winter walk up the
 *    Vallunga.
 *  - In Japan, a city walk through Higashiyama on day 9 and the Fushimi Inari
 *    mountain hike on day 5, both with a start time.
 *
 * Every line follows real ways. The legs on land come from the public
 * Valhalla the app itself asks (`src/components/Map/valhallaRoute.ts`), with
 * the costing the planner sends for each type (`planner/tourRouting.ts`), and
 * the heights from its /height stage, as the planner's save does. The huts and
 * hotels are placed where OpenStreetMap has them (Nominatim), the lake's
 * shore and the via ferrata come from OpenStreetMap too. Each answer is kept
 * under `e2e/.tmp/tour-routes/`, so a second run asks the network nothing.
 *
 * Everything is found by its name, so a re-run changes nothing. A tour that
 * already exists is never rebuilt: a guide that edits one has to put it back
 * itself (or delete it, and the next call makes it again).
 */

// ── Names the screen scripts look for ─────────────────────────────────────────

export const TOUR_TRIP = 'Summer in the Dolomites';
export const SKI_TRIP = 'Ski week in Val Gardena';
export const JAPAN_TRIP = 'Autumn in Japan';

/** Every tour by its role, as its row, card and day plan show it. */
export const TOUR_NAMES = {
  /** Hike, three stages, days 4 to 6, linked to the packing category "Hut trek". */
  hutToHut: 'Puez-Odle hut trek',
  /** Hike with a via ferrata leg (when OpenStreetMap answers), day 7, 07:30. */
  ferrata: 'Pisciadù via ferrata',
  /** Bike, road profile, day 3, 08:00. */
  roadBike: 'Sella Ronda by road bike',
  /** Bike, MTB profile, on no day, kept in "Dolomites ideas". */
  mtb: 'Monte Pana and Saltria MTB loop',
  /** Run, running profile, day 8, 07:00. */
  run: 'Val Gardena railway trail run',
  /** Paddle tour on a lake, day 9, 10:00. */
  paddle: 'Rowing round Lago di Braies',
  /** Horse ride, day 2, 10:00. */
  horse: 'Seiser Alm horse ride',
  /** City walk with seven stations, day 1, 15:00. */
  cityWalk: 'Bolzano old town walk',
  /** Imported GPX hike with recorded times, on no day. */
  recorded: 'Seceda ridge walk',
  /** Japan: city walk, day 9, 09:00. */
  kyotoWalk: 'Higashiyama walk',
  /** Japan: hike, day 5, 07:30. */
  inariHike: 'Fushimi Inari mountain hike',
  /** Ski trip: alpine ski tour on the piste router, day 2, 09:00 (only when the piste data answers). */
  skiRonda: 'Sella Ronda on skis',
  /** Ski trip: winter hike, day 4, 10:00. */
  winterWalk: 'Vallunga winter walk',
  /** Japan, only after `ensureTourRecording`: the recorded track of the Fushimi Inari hike. */
  inariRecording: 'Fushimi Inari, recorded',
} as const;
export type TourRole = keyof typeof TOUR_NAMES;

/** The collection that keeps the MTB loop. */
export const TOUR_COLLECTION = 'Dolomites ideas';
/** The packing category the hut trek is linked to, and its items. */
export const TOUR_PACKING = {
  category: 'Hut trek',
  items: ['Sleeping bag liner', 'Headlamp', 'Rain shell', 'Cash for the huts', 'Earplugs'],
};

/** The huts and hotels on the Dolomites days, by role. */
export const TOUR_PLACES = {
  bolzanoHotel: 'Hotel Greif',
  selvaHotel: 'Hotel Alpenroyal',
  puez: 'Rifugio Puez',
  genova: 'Rifugio Genova',
  firenze: 'Rifugio Firenze',
  pisciadu: 'Rifugio Pisciadù',
  braies: 'Hotel Lago di Braies',
} as const;

/** The GPX files a guide can import through the UI; `seceda` is imported by the fixtures already. */
export const TOUR_GPX = {
  seceda: { name: TOUR_NAMES.recorded, file: 'seceda-ridge-walk.gpx' },
  rasciesa: { name: 'Rasciesa balcony walk', file: 'rasciesa-balcony-walk.gpx' },
} as const;

// ── The calendar ──────────────────────────────────────────────────────────────

/** Whole months from the picture day's month to the next `month` (1 to 12), never 0. */
function monthsUntil(month: number): number {
  const current = Number(PICTURE_DAY_ISO.slice(5, 7));
  return (month - current + 12) % 12 || 12;
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function offsetOf(iso: string): number {
  return Math.round((Date.parse(`${iso}T12:00:00Z`) - Date.parse(`${PICTURE_DAY_ISO}T12:00:00Z`)) / 86_400_000);
}

const SUMMER_START = monthsAhead(monthsUntil(7), 11);
const SKI_START = monthsAhead(monthsUntil(2), 6);

/** The trips' dates, as `YYYY-MM-DD`. */
export const TOUR_TRIP_DATES = { start: SUMMER_START, end: addDays(SUMMER_START, 9) };
export const SKI_TRIP_DATES = { start: SKI_START, end: addDays(SKI_START, 6) };

/**
 * The offset from the picture day of day `n` (from 1) of the Dolomites trip,
 * for the date helpers of `e2e/dates.ts`: `short(tourDayOffset(4))`.
 */
export function tourDayOffset(n: number): number {
  return offsetOf(SUMMER_START) + n - 1;
}
/** The same for the ski trip. */
export function skiDayOffset(n: number): number {
  return offsetOf(SKI_START) + n - 1;
}

// ── What the call leaves behind ───────────────────────────────────────────────

export interface ToursFixtures {
  tripId: number;
  skiTripId: number;
  japanTripId: number;
  /** Day ids of the Dolomites trip, day 1 first. */
  dayIds: number[];
  skiDayIds: number[];
  /** Place id of every tour that exists, by role. A role whose data could not be had is missing (see the warnings). */
  tours: Partial<Record<TourRole, number>>;
  /** Place ids of the huts and hotels, by role. */
  places: Partial<Record<keyof typeof TOUR_PLACES, number>>;
  collectionId: number | null;
}

// ── The network: Valhalla, Nominatim, Overpass, all kept on disk ──────────────

const CACHE_DIR = path.join(process.cwd(), 'e2e', '.tmp', 'tour-routes');
const VALHALLA = process.env.E2E_VALHALLA_URL?.replace(/\/+$/, '') || 'https://valhalla1.openstreetmap.de';
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'TREK help-media fixtures (github.com/liketrek/TREK)';

/** The public hosts allow about a request a second each. */
const lastCall = new Map<string, number>();
async function turn(host: string): Promise<void> {
  const wait = (lastCall.get(host) ?? 0) + 1150 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall.set(host, Date.now());
}

async function fetchJson(url: string, init: RequestInit, timeoutMs: number): Promise<unknown> {
  const host = new URL(url).host;
  let lastError = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    await turn(host);
    try {
      const res = await fetch(url, {
        ...init,
        headers: { 'User-Agent': USER_AGENT, 'X-Client-Id': 'trek', ...(init.headers ?? {}) },
        signal: AbortSignal.timeout(timeoutMs),
      });
      const text = await res.text();
      if (text.length > 20_000_000) throw new Error('answer too large');
      if (res.ok) return JSON.parse(text);
      lastError = `${res.status} ${text.slice(0, 300)}`;
      // A refusal about the request itself does not get better by asking again.
      if (res.status === 400 || res.status === 404) break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
  }
  throw new Error(`${url}: ${lastError}`);
}

/** An answer kept under `e2e/.tmp/tour-routes/<label>-<hash>.json`, asked for only when it is not there. */
async function cached<T>(label: string, question: unknown, ask: () => Promise<T>): Promise<T> {
  mkdirSync(CACHE_DIR, { recursive: true });
  const hash = createHash('sha1').update(JSON.stringify(question)).digest('hex').slice(0, 10);
  const file = path.join(CACHE_DIR, `${label}-${hash}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as T;
  const answer = await ask();
  writeFileSync(file, JSON.stringify(answer));
  return answer;
}

type LatLng = [number, number];
type LatLngEle = [number, number, number];

const RAD = Math.PI / 180;
function metres(a: readonly number[], b: readonly number[]): number {
  const dLat = (b[0] - a[0]) * RAD;
  const dLng = (b[1] - a[1]) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

function decodePolyline6(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    for (const axis of [0, 1]) {
      let result = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += delta;
      else lng += delta;
    }
    points.push([lat / 1e6, lng / 1e6]);
  }
  return points;
}

interface RoutedLegs {
  /** One line per leg, from where its first point met the way to where its second did. */
  lines: LatLng[][];
  seconds: number[];
  metres: number[];
}

/**
 * One chain of points routed leg by leg, at most ten locations a request
 * (the public instance's limit), the pieces sharing their joining point.
 */
async function valhallaLegs(
  label: string,
  points: LatLng[],
  costing: 'pedestrian' | 'bicycle',
  options: Record<string, number | string | boolean>,
  searchFilter?: Record<string, boolean>
): Promise<RoutedLegs> {
  const out: RoutedLegs = { lines: [], seconds: [], metres: [] };
  for (let from = 0; from < points.length - 1; from += 9) {
    const chunk = points.slice(from, from + 10);
    const body = {
      locations: chunk.map(([lat, lon]) => ({
        lat,
        lon,
        radius: 50,
        ...(searchFilter ? { search_filter: searchFilter } : {}),
      })),
      costing,
      costing_options: { [costing]: options },
      directions_options: { units: 'kilometers' },
    };
    const answer = await cached(`route-${label}-${from}`, { VALHALLA, body }, async () => {
      const data = (await fetchJson(
        `${VALHALLA}/route`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        30_000
      )) as { trip?: { legs?: { shape: string; summary: { length: number; time: number } }[] } };
      const legs = data.trip?.legs;
      if (!legs || legs.length !== chunk.length - 1)
        throw new Error(`Valhalla answered ${legs?.length ?? 0} legs for ${chunk.length - 1}`);
      return legs.map((leg) => ({
        line: decodePolyline6(leg.shape),
        seconds: leg.summary.time,
        metres: leg.summary.length * 1000,
      }));
    });
    for (const leg of answer) {
      out.lines.push(leg.line);
      out.seconds.push(leg.seconds);
      out.metres.push(leg.metres);
    }
  }
  return out;
}

/** Heights along a line from Valhalla's /height stage, gaps filled between the known ones. */
async function withHeights(label: string, line: LatLng[]): Promise<LatLngEle[]> {
  const heights: (number | null)[] = Array(line.length).fill(null);
  for (let offset = 0; offset < line.length; offset += 499) {
    const chunk = line.slice(offset, offset + 500);
    if (chunk.length < 2 && offset > 0) break;
    const body = { shape: chunk.map(([lat, lon]) => ({ lat, lon })), range: true };
    const answer = await cached(`height-${label}-${offset}`, { VALHALLA, body }, async () => {
      const data = (await fetchJson(
        `${VALHALLA}/height`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        30_000
      )) as { range_height?: unknown[] };
      if (!Array.isArray(data.range_height) || data.range_height.length !== chunk.length)
        throw new Error('Valhalla /height answered no heights');
      return data.range_height.map((e) =>
        Array.isArray(e) && typeof e[1] === 'number' && Number.isFinite(e[1]) ? e[1] : null
      );
    });
    answer.forEach((h, i) => {
      if (h !== null) heights[offset + i] = Math.round(h * 10) / 10;
    });
  }
  const known = heights.map((h, i) => (h === null ? -1 : i)).filter((i) => i >= 0);
  if (known.length === 0) throw new Error(`no heights for ${label}`);
  return line.map(([lat, lng], i) => {
    const h = heights[i];
    if (h !== null) return [lat, lng, h];
    const before = [...known].reverse().find((k) => k < i);
    const after = known.find((k) => k > i);
    if (before === undefined) return [lat, lng, heights[after!]!];
    if (after === undefined) return [lat, lng, heights[before]!];
    const share = (i - before) / (after - before);
    return [lat, lng, heights[before]! + (heights[after]! - heights[before]!) * share];
  });
}

/** Where OpenStreetMap has a named place near where it is expected; the expectation when it is not found within 4 km. */
async function locate(name: string, near: LatLng): Promise<LatLng> {
  const viewbox = [near[1] - 0.06, near[0] + 0.06, near[1] + 0.06, near[0] - 0.06].join(',');
  const url = `${NOMINATIM}/search?format=jsonv2&limit=3&bounded=1&viewbox=${viewbox}&q=${encodeURIComponent(name)}`;
  try {
    const found = await cached(`place-${name.replace(/[^A-Za-z0-9]+/g, '_')}`, url, async () => {
      const data = (await fetchJson(url, {}, 20_000)) as { lat: string; lon: string }[];
      return data.map((d) => [Number(d.lat), Number(d.lon)] as LatLng);
    });
    const best = found.find((p) => metres(p, near) < 4000);
    if (best) return best;
    console.warn(`[tour-fixtures] Nominatim has no "${name}" near ${near.join(',')}; using the expected point`);
  } catch (err) {
    console.warn(`[tour-fixtures] Nominatim lookup of "${name}" failed (${String(err)}); using the expected point`);
  }
  return near;
}

async function overpass<T>(label: string, query: string): Promise<T> {
  return cached(
    `overpass-${label}`,
    query,
    async () =>
      (await fetchJson(
        OVERPASS,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
        },
        60_000
      )) as T
  );
}

// ── Building a tour ───────────────────────────────────────────────────────────

type FixedLeg =
  | { kind: 'ferrata'; ref: string; name: string | null; geometry: LatLng[] }
  | { kind: 'free'; geometry: LatLng[] }
  | {
      kind: 'horse_route';
      ref: string;
      name: string | null;
      geometry: LatLng[];
      signposted?: 'with' | 'against' | null;
      access?: unknown[];
    };

interface Stop {
  at: LatLng;
  name?: string;
  stageEnd?: boolean;
  /** City walk only. */
  stay?: number;
  importance?: 'must' | 'optional';
  /** The trip's place this point stands for, by name. */
  link?: string;
  /** The leg from this stop to the next is taken as it stands. */
  fixed?: FixedLeg;
}

interface Routing {
  costing: 'pedestrian' | 'bicycle';
  options: Record<string, number | string | boolean>;
  searchFilter?: Record<string, boolean>;
}

interface BuiltRoute {
  route_geometry: LatLngEle[];
  stops: Stop[];
  routerSeconds: number;
  distanceKm: number;
  gain: number;
  loss: number;
}

/**
 * The tour's whole line: the routed runs between fixed legs asked of
 * Valhalla, the fixed legs as they stand, joined in order, with heights. A
 * stop that only routed legs touch moves to where it met the way, as the
 * planner's points do; a stop at a fixed leg's end stays on that end.
 */
async function buildRoute(label: string, stops: Stop[], routing: Routing | null): Promise<BuiltRoute> {
  const placed = stops.map((s) => ({ ...s, at: [...s.at] as LatLng }));
  const parts: LatLng[][] = [];
  let routerSeconds = 0;
  let runStart = 0;
  const flush = async (end: number) => {
    if (end <= runStart) return;
    if (!routing) throw new Error(`${label}: leg ${runStart} has no line and no router`);
    const run = placed.slice(runStart, end + 1);
    const routed = await valhallaLegs(
      `${label}-${runStart}`,
      run.map((s) => s.at),
      routing.costing,
      routing.options,
      routing.searchFilter
    );
    routed.lines.forEach((line, i) => {
      parts.push(line);
      routerSeconds += routed.seconds[i];
      const from = placed[runStart + i];
      const to = placed[runStart + i + 1];
      if (!placed[runStart + i - 1]?.fixed && i === 0) from.at = line[0];
      if (i > 0) from.at = line[0];
      if (!to.fixed) to.at = line[line.length - 1];
    });
  };
  for (let i = 0; i < placed.length - 1; i++) {
    const leg = placed[i].fixed;
    if (!leg) continue;
    await flush(i);
    parts.push(leg.geometry);
    placed[i].at = leg.geometry[0];
    placed[i + 1].at = leg.geometry[leg.geometry.length - 1];
    runStart = i + 1;
  }
  await flush(placed.length - 1);
  const line = parts.flatMap((part, i) => (i === 0 ? part : part.slice(1)));
  const route = await withHeights(label, line);
  let distance = 0;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < route.length; i++) {
    distance += metres(route[i - 1], route[i]);
    const d = route[i][2] - route[i - 1][2];
    if (d > 0) gain += d;
    else loss -= d;
  }
  return { route_geometry: route, stops: placed, routerSeconds, distanceKm: distance / 1000, gain, loss };
}

/** DIN 33466, the rule the planner times a hike by (`shared/src/tours/tour-time-estimate.ts`). */
function hikingMinutes(km: number, gain: number, loss: number): number {
  const flat = km / 4;
  const height = gain / 300 + loss / 500;
  return Math.round((Math.max(flat, height) + Math.min(flat, height) / 2) * 60);
}

type TourBody = Record<string, unknown> & { name: string; tour_type: string };

function waypointsOf(stops: Stop[], type: string, placeIds: Map<string, number>): Record<string, unknown>[] {
  const last = stops.length - 1;
  return stops.map((s, i) => ({
    lat: s.at[0],
    lng: s.at[1],
    role: i === 0 ? 'start' : i === last ? 'end' : 'via',
    sequence: i,
    ...(s.fixed && i < last ? { fixed_leg: s.fixed } : {}),
    ...(s.name ? { name: s.name } : {}),
    ...(s.stageEnd && i > 0 && i < last ? { stage_end: true } : {}),
    ...(type === 'walk' && s.stay !== undefined ? { stay_minutes: s.stay } : {}),
    ...(type === 'walk' && s.importance ? { importance: s.importance } : {}),
    ...(s.link && placeIds.has(s.link) ? { linked_place_id: placeIds.get(s.link) } : {}),
  }));
}

const NO_TYPE_FIELDS = {
  max_hiking_difficulty: null,
  hiking_preferences: null,
  bike_profile: null,
  run_profile: null,
  run_pace_seconds_per_km: null,
  boat_type: null,
  water_context: null,
  paddle_speed_kmh: null,
  portage_speed_kmh: null,
  paddle_lake_style: null,
  ski_discipline: null,
  ski_technique: null,
  ski_options: null,
  ski_route_build: null,
  ski_planned_legs: null,
};

// ── The Dolomites ─────────────────────────────────────────────────────────────

const PLACE_SPECS: Record<
  keyof typeof TOUR_PLACES,
  { near: LatLng; address: string; description: string; category: string; lookup: string }
> = {
  bolzanoHotel: {
    near: [46.4982, 11.3546],
    lookup: 'Hotel Greif Bolzano',
    category: 'Hotel',
    address: 'Piazza Walther 7, 39100 Bolzano',
    description: 'Old town hotel on Piazza Walther, two minutes from the station.',
  },
  selvaHotel: {
    near: [46.5545, 11.747],
    lookup: 'Alpenroyal Selva',
    category: 'Hotel',
    address: 'Via Meisules 43, 39048 Selva di Val Gardena',
    description: 'Base for the bike, run and ferrata days. Breakfast from 07:00.',
  },
  puez: {
    near: [46.5902, 11.8163],
    lookup: 'Rifugio Puez',
    category: 'Hotel',
    address: 'Puez-Odle Nature Park, 2475 m',
    description: 'First night of the hut trek. Half board, bring cash.',
  },
  genova: {
    near: [46.6374, 11.8067],
    lookup: 'Rifugio Genova',
    category: 'Hotel',
    address: 'Passo Poma, Funes, 2306 m',
    description: 'Second night of the hut trek, below the Sass de Putia.',
  },
  firenze: {
    near: [46.5872, 11.7441],
    lookup: 'Rifugio Firenze',
    category: 'Restaurant',
    address: 'Cisles, Santa Cristina, 2037 m',
    description: 'Lunch on the last stage before the gondola down.',
  },
  pisciadu: {
    near: [46.5368, 11.8247],
    lookup: 'Rifugio Pisciadù',
    category: 'Restaurant',
    address: 'Sella group, 2587 m',
    description: 'At the top of the via ferrata, beside the lake.',
  },
  braies: {
    near: [46.6969, 12.0852],
    lookup: 'Hotel Lago di Braies',
    category: 'Hotel',
    address: 'Lago di Braies 1, 39030 Braies',
    description: 'Boat house next door. Boats from 09:00, cash only.',
  },
};

/** Which place sits on which day of the Dolomites trip (index from 0). */
const PLACE_DAYS: [keyof typeof TOUR_PLACES, number][] = [
  ['bolzanoHotel', 0],
  ['selvaHotel', 1],
  ['selvaHotel', 2],
  ['puez', 3],
  ['genova', 4],
  ['firenze', 5],
  ['pisciadu', 6],
  ['selvaHotel', 7],
  ['braies', 8],
];

const HIKING = (max: number): Routing => ({ costing: 'pedestrian', options: { max_hiking_difficulty: max } });
const CITY_WALK: Routing = { costing: 'pedestrian', options: { use_ferry: 0 }, searchFilter: { exclude_ferry: true } };
const RUNNING: Routing = { costing: 'pedestrian', options: { use_tracks: 0, use_ferry: 0 } };
const ROAD_BIKE: Routing = {
  costing: 'bicycle',
  options: { bicycle_type: 'Road', use_roads: 0.5, avoid_bad_surfaces: 1 },
};
const MTB: Routing = { costing: 'bicycle', options: { bicycle_type: 'Mountain', use_roads: 0, avoid_bad_surfaces: 0 } };

async function hike(
  name: string,
  description: string,
  stops: Stop[],
  max: number,
  breaks: number,
  placeIds: Map<string, number>
): Promise<TourBody> {
  // The router refuses a path above the limit; a harder limit is tried before the tour is given up.
  let built: BuiltRoute | null = null;
  for (const limit of [...new Set([max, Math.min(6, max + 1), 6])]) {
    try {
      built = await buildRoute(`${slug(name)}-t${limit}`, stops, HIKING(limit));
      if (limit !== max) console.warn(`[tour-fixtures] "${name}" needed hiking difficulty T${limit}`);
      max = limit;
      break;
    } catch (err) {
      if (limit === 6) throw err;
    }
  }
  if (!built) throw new Error(`${name}: no route`);
  return {
    name,
    description,
    tour_type: 'hike',
    ...NO_TYPE_FIELDS,
    max_hiking_difficulty: max,
    route_geometry: built.route_geometry,
    waypoints: waypointsOf(built.stops, 'hike', placeIds),
    duration_seconds: hikingMinutes(built.distanceKm, built.gain, built.loss) * 60,
    break_additional_minutes: breaks,
  };
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** The via ferrata Brigata Tridentina up to the Pisciadù hut, as OpenStreetMap draws it: from the app's own endpoint, else Overpass. */
async function tridentina(api: APIRequestContext, tripId: number): Promise<FixedLeg | null> {
  const bbox = { s: 46.53, w: 11.8, n: 46.56, e: 11.85 };
  type Way = { id: string; name: string | null; routeName: string | null; geometry: LatLng[] };
  let ways: Way[] = [];
  try {
    const res = await api.get(`/api/trips/${tripId}/ferratas?bbox=${bbox.s},${bbox.w},${bbox.n},${bbox.e}`);
    if (res.ok()) ways = ((await res.json()) as { ferratas: Way[] }).ferratas;
  } catch {
    /* falls through to Overpass */
  }
  if (ways.length === 0) {
    try {
      const data = await overpass<{
        elements: { id: number; tags?: Record<string, string>; geometry?: { lat: number; lon: number }[] }[];
      }>(
        'ferratas-pisciadu',
        `[out:json][timeout:40];way["highway"="via_ferrata"](${bbox.s},${bbox.w},${bbox.n},${bbox.e});out geom;`
      );
      ways = data.elements
        .filter((e) => e.geometry && e.geometry.length > 1)
        .map((e) => ({
          id: `way/${e.id}`,
          name: e.tags?.name ?? null,
          routeName: null,
          geometry: e.geometry!.map((g) => [g.lat, g.lon] as LatLng),
        }));
    } catch (err) {
      console.warn(`[tour-fixtures] no via ferrata data (${String(err)})`);
      return null;
    }
  }
  const named = ways.filter((w) => /tridentina|pisciad/i.test(`${w.name ?? ''} ${w.routeName ?? ''}`));
  const pool = named.length ? named : ways;
  if (pool.length === 0) return null;
  const lengthOf = (g: LatLng[]) => g.slice(1).reduce((sum, p, i) => sum + metres(g[i], p), 0);
  // The ferrata is often mapped as several ways: start from the longest and join the ones that touch its ends.
  let chain = [...pool.sort((a, b) => lengthOf(b.geometry) - lengthOf(a.geometry))[0].geometry];
  const first = pool[0];
  const rest = pool.slice(1);
  for (let grown = true; grown;) {
    grown = false;
    for (let i = 0; i < rest.length; i++) {
      const g = rest[i].geometry;
      const head = chain[0];
      const tail = chain[chain.length - 1];
      if (metres(tail, g[0]) < 25) chain = [...chain, ...g.slice(1)];
      else if (metres(tail, g[g.length - 1]) < 25) chain = [...chain, ...[...g].reverse().slice(1)];
      else if (metres(head, g[g.length - 1]) < 25) chain = [...g, ...chain.slice(1)];
      else if (metres(head, g[0]) < 25) chain = [...[...g].reverse(), ...chain.slice(1)];
      else continue;
      rest.splice(i, 1);
      grown = true;
      break;
    }
  }
  // Climbed upwards: the lower end first.
  const ends = await withHeights('ferrata-ends', [chain[0], chain[chain.length - 1]]);
  if (ends[0][2] > ends[1][2]) chain.reverse();
  return {
    kind: 'ferrata',
    ref: first.id,
    name: first.name ?? 'Via ferrata Brigata Tridentina',
    geometry: chain.slice(0, 5000),
  };
}

/** Lago di Braies' shore from OpenStreetMap, pulled 25 m out onto the water, as one closed loop. */
async function braiesLoop(): Promise<LatLng[] | null> {
  let ring: LatLng[] = [];
  try {
    const data = await overpass<{
      elements: {
        type: string;
        geometry?: { lat: number; lon: number }[];
        members?: { role: string; geometry?: { lat: number; lon: number }[] }[];
      }[];
    }>(
      'lago-di-braies',
      '[out:json][timeout:40];(way["natural"="water"]["name"~"Braies|Prags"](46.68,12.07,46.71,12.10);relation["natural"="water"]["name"~"Braies|Prags"](46.68,12.07,46.71,12.10););out geom;'
    );
    for (const e of data.elements) {
      const candidates = e.geometry
        ? [e.geometry]
        : (e.members ?? []).filter((m) => m.role === 'outer' && m.geometry).map((m) => m.geometry!);
      for (const g of candidates) if (g.length > ring.length) ring = g.map((p) => [p.lat, p.lon] as LatLng);
    }
  } catch (err) {
    console.warn(`[tour-fixtures] Lago di Braies' shore could not be read (${String(err)})`);
    return null;
  }
  if (ring.length < 8) return null;
  if (metres(ring[0], ring[ring.length - 1]) < 1) ring = ring.slice(0, -1);
  const lat0 = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const kx = 111_320 * Math.cos(lat0 * RAD);
  const ky = 110_540;
  const xy = ring.map(([lat, lng]) => [lng * kx, lat * ky]);
  const inside = (x: number, y: number) => {
    let hit = false;
    for (let i = 0, j = xy.length - 1; i < xy.length; j = i++) {
      const [xi, yi] = xy[i];
      const [xj, yj] = xy[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };
  const loop: LatLng[] = [];
  for (let i = 0; i < xy.length; i++) {
    const [px, py] = xy[(i - 1 + xy.length) % xy.length];
    const [x, y] = xy[i];
    const [nx, ny] = xy[(i + 1) % xy.length];
    const tx = nx - px;
    const ty = ny - py;
    const len = Math.hypot(tx, ty) || 1;
    let moved: [number, number] | null = null;
    for (const d of [25, 15, 8]) {
      for (const sign of [1, -1]) {
        const cx = x + ((sign * -ty) / len) * d;
        const cy = y + ((sign * tx) / len) * d;
        if (inside(cx, cy)) {
          moved = [cx, cy];
          break;
        }
      }
      if (moved) break;
    }
    if (moved) loop.push([moved[1] / ky, moved[0] / kx]);
  }
  // Start and end at the boat house on the north shore.
  const boathouse: LatLng = [46.6966, 12.085];
  let start = 0;
  loop.forEach((p, i) => {
    if (metres(p, boathouse) < metres(loop[start], boathouse)) start = i;
  });
  const ordered = [...loop.slice(start), ...loop.slice(0, start)];
  // A shore mapped point by point every metre or two is thinned to one every 15 m or so.
  const thinned: LatLng[] = [ordered[0]];
  for (const p of ordered.slice(1)) if (metres(thinned[thinned.length - 1], p) >= 15) thinned.push(p);
  thinned.push(ordered[0]);
  return thinned;
}

/** The longest signposted horse route section on the Seiser Alm the app finds, if one is long enough to ride. */
async function seiserAlmHorseRoute(api: APIRequestContext, tripId: number): Promise<FixedLeg | null> {
  try {
    const res = await api.get(`/api/trips/${tripId}/tours/horse-routes?bbox=46.50,11.58,46.58,11.72`);
    if (!res.ok()) return null;
    const { routes } = (await res.json()) as {
      routes: {
        id: string;
        name: string | null;
        sections: { geometry: LatLng[]; length_m: number; signposted: 'with' | 'against' | null; access: unknown[] }[];
      }[];
    };
    let best: FixedLeg | null = null;
    let bestLength = 4000;
    for (const route of routes) {
      for (const section of route.sections) {
        if (section.length_m > bestLength && section.geometry.length <= 5000) {
          bestLength = section.length_m;
          best = {
            kind: 'horse_route',
            ref: route.id,
            name: route.name,
            geometry: section.geometry,
            signposted: section.signposted,
            access: section.access,
          };
        }
      }
    }
    return best;
  } catch {
    return null;
  }
}

/** Legs of a pedestrian route kept as drawn lines, for the tour types no router plans (a ride, a boat, a ski fallback). */
async function drawnAlong(label: string, points: LatLng[], names: (string | undefined)[] = []): Promise<Stop[]> {
  const routed = await valhallaLegs(label, points, 'pedestrian', { max_hiking_difficulty: 2 });
  const stops: Stop[] = routed.lines.map((line, i) => ({
    at: line[0],
    name: names[i],
    fixed: { kind: 'free', geometry: line },
  }));
  const last = routed.lines[routed.lines.length - 1];
  stops.push({ at: last[last.length - 1], name: names[routed.lines.length] });
  return stops;
}

type Builder = (ctx: {
  api: APIRequestContext;
  tripId: number;
  placeIds: Map<string, number>;
}) => Promise<TourBody | null>;

const DOLOMITES_TOURS: { role: TourRole; build: Builder }[] = [
  {
    role: 'hutToHut',
    build: async ({ placeIds }) => {
      const at = async (role: keyof typeof TOUR_PLACES) => locate(PLACE_SPECS[role].lookup, PLACE_SPECS[role].near);
      return hike(
        TOUR_NAMES.hutToHut,
        'Three days through the Puez-Odle nature park, hut to hut, out of the Vallunga and down by the Col Raiser gondola.',
        [
          { at: [46.5622, 11.7795], name: 'Vallunga car park' },
          { at: await at('puez'), name: TOUR_PLACES.puez, stageEnd: true, link: TOUR_PLACES.puez },
          { at: await at('genova'), name: TOUR_PLACES.genova, stageEnd: true, link: TOUR_PLACES.genova },
          { at: await at('firenze'), name: TOUR_PLACES.firenze, link: TOUR_PLACES.firenze },
          { at: [46.5843, 11.7327], name: 'Col Raiser gondola' },
        ],
        3,
        90,
        placeIds
      );
    },
  },
  {
    role: 'ferrata',
    build: async ({ api, tripId, placeIds }) => {
      const hut = await locate(PLACE_SPECS.pisciadu.lookup, PLACE_SPECS.pisciadu.near);
      const ferrata = await tridentina(api, tripId);
      if (!ferrata) console.warn('[tour-fixtures] the Pisciadù hike is saved without its via ferrata leg');
      const stops: Stop[] = ferrata
        ? [
            { at: [46.5551, 11.8327], name: 'Pisciadù car park' },
            { at: ferrata.geometry[0], name: 'Start of the via ferrata', fixed: ferrata },
            { at: ferrata.geometry[ferrata.geometry.length - 1], name: 'Top of the via ferrata' },
            { at: hut, name: TOUR_PLACES.pisciadu, link: TOUR_PLACES.pisciadu },
            { at: [46.5497, 11.8078], name: 'Passo Gardena' },
          ]
        : [
            { at: [46.5497, 11.8078], name: 'Passo Gardena' },
            { at: hut, name: TOUR_PLACES.pisciadu, link: TOUR_PLACES.pisciadu },
            { at: [46.5551, 11.8327], name: 'Pisciadù car park' },
          ];
      return hike(
        TOUR_NAMES.ferrata,
        'Via ferrata Brigata Tridentina up the Pisciadù waterfall, the suspension bridge, the hut, and down the Val Setus. Helmet, harness and set.',
        stops,
        4,
        60,
        placeIds
      );
    },
  },
  {
    role: 'roadBike',
    build: async () => {
      const built = await buildRoute(
        'sella-ronda-bike',
        [
          { at: [46.5562, 11.7608], name: 'Selva' },
          { at: [46.5497, 11.8078], name: 'Passo Gardena' },
          { at: [46.5497, 11.8735], name: 'Corvara' },
          { at: [46.5196, 11.8733], name: 'Passo Campolongo' },
          { at: [46.4972, 11.8748], name: 'Arabba' },
          { at: [46.488, 11.8132], name: 'Passo Pordoi' },
          { at: [46.5085, 11.757], name: 'Passo Sella' },
          { at: [46.5562, 11.7608], name: 'Selva' },
        ],
        ROAD_BIKE
      );
      return {
        name: TOUR_NAMES.roadBike,
        description: 'The four passes round the Sella group, counterclockwise. Start early, before the cars.',
        tour_type: 'bike',
        ...NO_TYPE_FIELDS,
        bike_profile: 'road',
        route_geometry: built.route_geometry,
        waypoints: waypointsOf(built.stops, 'bike', new Map()),
        duration_seconds: Math.round(built.routerSeconds),
        break_additional_minutes: 45,
      };
    },
  },
  {
    role: 'mtb',
    build: async () => {
      const built = await buildRoute(
        'monte-pana-mtb',
        [
          { at: [46.5612, 11.721], name: 'Santa Cristina' },
          { at: [46.549, 11.7285], name: 'Monte Pana' },
          { at: [46.5316, 11.674], name: 'Saltria' },
          { at: [46.5612, 11.721], name: 'Santa Cristina' },
        ],
        MTB
      );
      return {
        name: TOUR_NAMES.mtb,
        description: 'Over Monte Pana onto the Seiser Alm and back. For a rest day with spare legs.',
        tour_type: 'bike',
        ...NO_TYPE_FIELDS,
        bike_profile: 'mtb',
        route_geometry: built.route_geometry,
        waypoints: waypointsOf(built.stops, 'bike', new Map()),
        duration_seconds: Math.round(built.routerSeconds),
        break_additional_minutes: 30,
      };
    },
  },
  {
    role: 'run',
    build: async () => {
      const pace = 345;
      const built = await buildRoute(
        'val-gardena-run',
        [
          { at: [46.5612, 11.721], name: 'Santa Cristina' },
          { at: [46.5747, 11.6717], name: 'Ortisei' },
        ],
        RUNNING
      );
      return {
        name: TOUR_NAMES.run,
        description: 'Down the old Val Gardena railway line, then the bus back up.',
        tour_type: 'run',
        ...NO_TYPE_FIELDS,
        run_profile: 'running',
        run_pace_seconds_per_km: pace,
        route_geometry: built.route_geometry,
        waypoints: waypointsOf(built.stops, 'run', new Map()),
        duration_seconds: Math.round((built.distanceKm * pace) / 60) * 60,
        break_additional_minutes: 0,
      };
    },
  },
  {
    role: 'paddle',
    build: async () => {
      const loop = await braiesLoop();
      if (!loop) return null;
      const height = (await withHeights('braies-level', [loop[0], loop[Math.floor(loop.length / 2)]]))[0][2];
      // Four legs drawn by hand round the shore: the boat house, the far end, back along the other side.
      const cuts = [
        0,
        Math.floor(loop.length * 0.25),
        Math.floor(loop.length * 0.5),
        Math.floor(loop.length * 0.75),
        loop.length - 1,
      ];
      const names = ['Boat house', 'Under the Seekofel', 'South shore', 'Chapel', 'Boat house'];
      const stops: Stop[] = cuts.map((cut, i) => ({
        at: loop[cut],
        name: names[i],
        ...(i < cuts.length - 1
          ? { fixed: { kind: 'free' as const, geometry: loop.slice(cut, cuts[i + 1] + 1) } }
          : {}),
      }));
      const line = loop.map(([lat, lng]) => [lat, lng, height] as LatLngEle);
      const km = loop.slice(1).reduce((s, p, i) => s + metres(loop[i], p), 0) / 1000;
      return {
        name: TOUR_NAMES.paddle,
        description: 'A wooden rowing boat from the boat house, once round the lake along the shore.',
        tour_type: 'kayak',
        ...NO_TYPE_FIELDS,
        boat_type: 'other',
        water_context: 'lake',
        paddle_speed_kmh: 3,
        route_geometry: line,
        waypoints: waypointsOf(stops, 'kayak', new Map()),
        duration_seconds: Math.round((km / 3) * 3600),
        break_additional_minutes: 15,
      };
    },
  },
  {
    role: 'horse',
    build: async ({ api, tripId }) => {
      const section = await seiserAlmHorseRoute(api, tripId);
      const stops: Stop[] = section
        ? [
            { at: section.geometry[0], name: 'Stable', fixed: section },
            { at: section.geometry[section.geometry.length - 1] },
          ]
        : await drawnAlong(
            'seiser-alm-ride',
            [
              [46.5416, 11.6229],
              [46.5394, 11.6563],
              [46.5316, 11.674],
              [46.5416, 11.6229],
            ],
            ['Compatsch stable', 'Gostner Schwaige', 'Saltria', 'Compatsch stable']
          );
      if (!section)
        console.warn(
          '[tour-fixtures] no signposted horse route on the Seiser Alm; the ride is drawn by hand along its farm tracks'
        );
      const built = await buildRoute('seiser-alm-ride-line', stops, null);
      return {
        name: TOUR_NAMES.horse,
        description: 'Three hours on the Haflingers from the Compatsch stable, booked for the two of us and Jonas.',
        tour_type: 'horse',
        ...NO_TYPE_FIELDS,
        route_geometry: built.route_geometry,
        waypoints: waypointsOf(built.stops, 'horse', new Map()),
        duration_seconds: null,
        planned_duration_minutes: 180,
      };
    },
  },
  {
    role: 'cityWalk',
    build: async () => {
      const built = await buildRoute(
        'bolzano-walk',
        [
          { at: [46.4986, 11.3542], name: 'Piazza Walther', stay: 10 },
          { at: [46.4977, 11.3532], name: 'Bolzano Cathedral', stay: 20 },
          { at: [46.4995, 11.3556], name: 'Via dei Portici', stay: 30 },
          { at: [46.4999, 11.353], name: 'Piazza delle Erbe', stay: 20 },
          { at: [46.4983, 11.3508], name: 'Dominican Church', stay: 15, importance: 'optional' },
          { at: [46.5003, 11.3489], name: 'South Tyrol Museum of Archaeology', stay: 90, importance: 'must' },
          { at: [46.503, 11.3462], name: 'Talvera meadows', stay: 0 },
        ],
        CITY_WALK
      );
      return {
        name: TOUR_NAMES.cityWalk,
        description: 'The arcades, the fruit market and Ötzi, then out to the river for the evening.',
        website: 'https://www.iceman.it/en/',
        tour_type: 'walk',
        ...NO_TYPE_FIELDS,
        route_geometry: built.route_geometry,
        waypoints: waypointsOf(built.stops, 'walk', new Map()),
        duration_seconds: Math.round(built.routerSeconds),
        break_additional_minutes: null,
      };
    },
  },
];

/** Where each tour goes on the days (index from 0), with its start time; `stage` is the stage's number from 1. */
const DOLOMITES_DAYS: { role: TourRole; day: number; time?: string; stage?: number }[] = [
  { role: 'cityWalk', day: 0, time: '15:00' },
  { role: 'horse', day: 1, time: '10:00' },
  { role: 'roadBike', day: 2, time: '08:00' },
  { role: 'hutToHut', day: 3, time: '08:30', stage: 1 },
  { role: 'hutToHut', day: 4, time: '08:00', stage: 2 },
  { role: 'hutToHut', day: 5, time: '08:00', stage: 3 },
  { role: 'ferrata', day: 6, time: '07:30' },
  { role: 'run', day: 7, time: '07:00' },
  { role: 'paddle', day: 8, time: '10:00' },
];

// ── Japan ─────────────────────────────────────────────────────────────────────

const JAPAN_TOURS: { role: TourRole; day: number; time: string; build: Builder }[] = [
  {
    role: 'inariHike',
    day: 4,
    time: '07:30',
    build: async ({ placeIds }) =>
      hike(
        TOUR_NAMES.inariHike,
        'Up through the torii tunnels to the summit of Mount Inari and back down the quiet side.',
        [
          { at: [34.96714, 135.77267], name: 'Fushimi Inari Taisha', link: 'Fushimi Inari Taisha' },
          { at: [34.9652, 135.7791], name: 'Yotsutsuji crossing' },
          { at: [34.9638, 135.7856], name: 'Ichinomine summit' },
          { at: [34.96714, 135.77267], name: 'Fushimi Inari Taisha', link: 'Fushimi Inari Taisha' },
        ],
        2,
        30,
        placeIds
      ),
  },
  {
    role: 'kyotoWalk',
    day: 8,
    time: '09:00',
    build: async () => {
      const built = await buildRoute(
        'higashiyama-walk',
        [
          { at: [34.99485, 135.78504], name: 'Kiyomizu-dera', stay: 45, importance: 'must' },
          { at: [34.99636, 135.78123], name: 'Sannenzaka', stay: 15 },
          { at: [34.9979, 135.78074], name: 'Ninenzaka', stay: 15 },
          { at: [34.99853, 135.77938], name: 'Yasaka Pagoda', stay: 10 },
          { at: [35.00055, 135.78083], name: 'Kodai-ji', stay: 40, importance: 'optional' },
          { at: [35.00366, 135.7785], name: 'Yasaka Shrine', stay: 20 },
          { at: [35.0026, 135.7751], name: 'Gion, Hanamikoji', stay: 20 },
        ],
        CITY_WALK
      );
      return {
        name: TOUR_NAMES.kyotoWalk,
        description: 'Kiyomizu-dera first, before the buses, then down the old slopes into Gion.',
        tour_type: 'walk',
        ...NO_TYPE_FIELDS,
        route_geometry: built.route_geometry,
        waypoints: waypointsOf(built.stops, 'walk', new Map()),
        duration_seconds: Math.round(built.routerSeconds),
        break_additional_minutes: null,
      };
    },
  },
];

// ── Ski ───────────────────────────────────────────────────────────────────────

interface SkiLeg {
  status: 'ok' | 'failed';
  code?: string;
  geometry?: [number, number, number | null][];
  seconds?: { ski: number; lift: number; wait: number; walk: number };
}

/** The piste router's legs, asked again while it is still downloading the area; null when it cannot plan every leg. */
async function skiRoute(
  api: APIRequestContext,
  tripId: number,
  points: LatLng[],
  discipline: string
): Promise<{ legs: SkiLeg[]; build: string } | null> {
  const body = {
    legs: points
      .slice(1)
      .map((to, i) => ({ from: { lat: points[i][0], lng: points[i][1] }, to: { lat: to[0], lng: to[1] } })),
    discipline,
    options: {},
  };
  for (let attempt = 0; attempt < 18; attempt++) {
    const res = await api.post(`/api/trips/${tripId}/ski/route`, { data: body });
    if (!res.ok()) {
      console.warn(`[tour-fixtures] the piste router answered ${res.status()}: ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const answer = (await res.json()) as { legs: SkiLeg[]; build: string | null };
    if (answer.legs.every((l) => l.status === 'ok') && answer.build) return { legs: answer.legs, build: answer.build };
    const codes = [...new Set(answer.legs.filter((l) => l.status !== 'ok').map((l) => l.code))];
    if (!codes.every((c) => c === 'loading' || c === 'busy')) {
      console.warn(`[tour-fixtures] the piste router cannot plan the ${discipline} tour: ${codes.join(', ')}`);
      return null;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.warn('[tour-fixtures] the piste router was still downloading the ski area after 90 s');
  return null;
}

async function skiBody(
  api: APIRequestContext,
  tripId: number,
  name: string,
  description: string,
  discipline: string,
  points: LatLng[],
  names: string[],
  fallback: boolean
): Promise<TourBody | null> {
  const planned = await skiRoute(api, tripId, points, discipline);
  if (planned) {
    const line = planned.legs.flatMap((leg, i) => (i === 0 ? leg.geometry! : leg.geometry!.slice(1)));
    const known = line.every((p) => p[2] !== null);
    const route = known
      ? (line as LatLngEle[])
      : await withHeights(
          slug(name),
          line.map((p) => [p[0], p[1]] as LatLng)
        );
    const stops: Stop[] = points.map((_, i) => ({
      at:
        i < planned.legs.length
          ? [planned.legs[i].geometry![0][0], planned.legs[i].geometry![0][1]]
          : (() => {
              const g = planned.legs[planned.legs.length - 1].geometry!;
              return [g[g.length - 1][0], g[g.length - 1][1]] as LatLng;
            })(),
      name: names[i],
    }));
    const seconds = planned.legs.reduce(
      (s, l) => s + l.seconds!.ski + l.seconds!.lift + l.seconds!.wait + l.seconds!.walk,
      0
    );
    return {
      name,
      description,
      tour_type: 'ski',
      ...NO_TYPE_FIELDS,
      ski_discipline: discipline,
      ski_options: {},
      ski_route_build: planned.build,
      ski_planned_legs: planned.legs.map((_, i) => i),
      route_geometry: route,
      waypoints: waypointsOf(stops, 'ski', new Map()),
      duration_seconds: Math.round(seconds),
      break_additional_minutes: 60,
    };
  }
  if (!fallback) return null;
  console.warn(`[tour-fixtures] "${name}" is drawn by hand along the winter path instead of planned on the piste data`);
  const stops = await drawnAlong(slug(name), points, names);
  const built = await buildRoute(`${slug(name)}-line`, stops, null);
  return {
    name,
    description,
    tour_type: 'ski',
    ...NO_TYPE_FIELDS,
    ski_discipline: discipline,
    route_geometry: built.route_geometry,
    waypoints: waypointsOf(built.stops, 'ski', new Map()),
    duration_seconds: null,
    planned_duration_minutes: 150,
  };
}

const SKI_TOURS: {
  role: TourRole;
  day: number;
  time: string;
  build: (api: APIRequestContext, tripId: number) => Promise<TourBody | null>;
}[] = [
  {
    role: 'skiRonda',
    day: 1,
    time: '09:00',
    build: (api, tripId) =>
      skiBody(
        api,
        tripId,
        TOUR_NAMES.skiRonda,
        'The four passes on skis, clockwise from Selva. Last lift back at Passo Sella by 16:00.',
        'alpine',
        // Each point sits on the piste data the router snaps to (150 m for alpine): the lift bases at
        // Selva, Corvara, Arabba, Pordoi and Canazei rather than the village centres, which lie off the runs.
        [
          [46.5556, 11.768],
          [46.5512, 11.8077],
          [46.5482, 11.871],
          [46.4954, 11.8735],
          [46.4887, 11.8106],
          [46.4744, 11.7748],
          [46.5021, 11.7576],
          [46.5533, 11.7617],
        ],
        [
          'Selva, Dantercepies',
          'Passo Gardena',
          'Corvara',
          'Arabba',
          'Passo Pordoi',
          'Canazei',
          'Passo Sella',
          'Selva, Ciampinoi',
        ],
        false
      ),
  },
  {
    role: 'winterWalk',
    day: 3,
    time: '10:00',
    build: (api, tripId) =>
      skiBody(
        api,
        tripId,
        TOUR_NAMES.winterWalk,
        'Up the flat Vallunga on the cleared winter path to the chapel and back, a rest day for the legs.',
        'winter_hike',
        [
          [46.5622, 11.7795],
          [46.5735, 11.804],
          [46.5622, 11.7795],
        ],
        ['Vallunga car park', 'Vallunga chapel', 'Vallunga car park'],
        true
      ),
  },
];

// ── Recorded GPX ──────────────────────────────────────────────────────────────

/** A small seeded random, so the jitter of a recorded track is the same on every run. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A GPX file as a watch records it: a point every 12 m or so along the line,
 * a few metres of GPS scatter, the heights a barometer gives, and times at
 * Tobler's walking speed for each slope, with a long stop at `pauseAt`.
 */
function recordedGpx(name: string, line: LatLngEle[], startUtcMs: number, pauseAt = 0.5, pauseMinutes = 25): string {
  const rnd = random(name.length * 7919);
  const pts: LatLngEle[] = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const d = metres(a, b);
    const n = Math.max(1, Math.round(d / 12));
    for (let k = 1; k <= n; k++) {
      const s = k / n;
      pts.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s]);
    }
  }
  let t = startUtcMs;
  const pauseIndex = Math.floor(pts.length * pauseAt);
  const rows: string[] = [];
  pts.forEach((p, i) => {
    if (i > 0) {
      const d = metres(pts[i - 1], p);
      const slope = d > 0 ? (p[2] - pts[i - 1][2]) / d : 0;
      const kmh = 6 * Math.exp(-3.5 * Math.abs(slope + 0.05)) * 0.82;
      t += (d / 1000 / Math.max(kmh, 0.8)) * 3_600_000;
    }
    if (i === pauseIndex) t += pauseMinutes * 60_000;
    const lat = p[0] + (rnd() - 0.5) * 0.00006;
    const lng = p[1] + (rnd() - 0.5) * 0.00008;
    const ele = p[2] + (rnd() - 0.5) * 3;
    rows.push(
      `      <trkpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}"><ele>${ele.toFixed(1)}</ele><time>${new Date(Math.round(t / 1000) * 1000).toISOString().replace('.000', '')}</time></trkpt>`
    );
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Garmin Connect" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${name}</name><time>${new Date(startUtcMs).toISOString().replace('.000', '')}</time></metadata>
  <trk><name>${name}</name><type>hiking</type><trkseg>
${rows.join('\n')}
  </trkseg></trk>
</gpx>
`;
}

/** UTC milliseconds of a local clock time on a `YYYY-MM-DD` date in a zone `utcOffsetHours` ahead of UTC. */
function localTime(iso: string, hhmm: string, utcOffsetHours: number): number {
  const [h, m] = hhmm.split(':').map(Number);
  return Date.parse(`${iso}T00:00:00Z`) + ((h - utcOffsetHours) * 60 + m) * 60_000;
}

const GPX_ROUTES: Record<keyof typeof TOUR_GPX, { points: LatLng[]; day: () => string; start: string }> = {
  // Last summer, the same week a year before the trip.
  seceda: {
    points: [
      [46.5995, 11.7255],
      [46.5937, 11.738],
      [46.5872, 11.7441],
      [46.5843, 11.7327],
    ],
    day: () => addDays(SUMMER_START, -364),
    start: '09:12',
  },
  rasciesa: {
    points: [
      [46.5855, 11.681],
      [46.5932, 11.6985],
      [46.5855, 11.681],
    ],
    day: () => addDays(SUMMER_START, -357),
    start: '10:05',
  },
};

/**
 * The path of a recorded GPX file in `e2e/.tmp/`, made on first use from a
 * real walking route. `seceda` is imported by `ensureToursFixtures`; the
 * other one is there for a guide to import through the UI.
 */
export async function tourGpxFixture(id: keyof typeof TOUR_GPX): Promise<string> {
  const dir = path.join(process.cwd(), 'e2e', '.tmp');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, TOUR_GPX[id].file);
  if (existsSync(file)) return file;
  const spec = GPX_ROUTES[id];
  const built = await buildRoute(
    `gpx-${id}`,
    spec.points.map((at) => ({ at })),
    HIKING(2)
  );
  writeFileSync(file, recordedGpx(TOUR_GPX[id].name, built.route_geometry, localTime(spec.day(), spec.start, 2)));
  return file;
}

// ── The API ───────────────────────────────────────────────────────────────────

async function json<T>(
  res: { ok(): boolean; status(): number; text(): Promise<string>; json(): Promise<unknown> },
  what: string
): Promise<T> {
  if (!res.ok()) throw new Error(`${what}: ${res.status()} ${(await res.text()).slice(0, 500)}`);
  return (await res.json()) as T;
}

interface TourRow {
  place_id: number;
  name: string;
  stage_stops?: { key: string }[] | null;
}
interface AssignmentRow {
  id: number;
  place_id: number;
  tour_stage_key?: string | null;
  assignment_time?: string | null;
}

async function toursOf(api: APIRequestContext, tripId: number): Promise<TourRow[]> {
  return (await json<{ tours: TourRow[] }>(await api.get(`/api/trips/${tripId}/tours`), `tours of trip ${tripId}`))
    .tours;
}

async function placesOf(api: APIRequestContext, tripId: number): Promise<{ id: number; name: string }[]> {
  const body = await json<{ places?: { id: number; name: string }[] } | { id: number; name: string }[]>(
    await api.get(`/api/trips/${tripId}/places`),
    'places'
  );
  return Array.isArray(body) ? body : (body.places ?? []);
}

async function daysOf(api: APIRequestContext, tripId: number): Promise<number[]> {
  const body = await json<{ days: { id: number; date?: string | null; day_number?: number }[] }>(
    await api.get(`/api/trips/${tripId}/days`),
    'days'
  );
  return [...body.days]
    .sort(
      (a, b) => (a.date ?? '').localeCompare(b.date ?? '') || (a.day_number ?? 0) - (b.day_number ?? 0) || a.id - b.id
    )
    .map((d) => d.id);
}

async function ensureTrip(
  api: APIRequestContext,
  trip: { title: string; description: string; start_date: string; end_date: string; currency: string }
): Promise<number> {
  const { trips } = await json<{ trips: { id: number; title: string }[] }>(await api.get('/api/trips'), 'trips');
  const found = trips.find((t) => t.title === trip.title);
  const id =
    found?.id ??
    (await json<{ trip: { id: number } }>(await api.post('/api/trips', { data: trip }), `create "${trip.title}"`)).trip
      .id;
  if (!found) {
    for (const email of ['mira@example.com', 'jonas@example.com']) {
      await api.post(`/api/trips/${id}/members`, { data: { identifier: email } }).catch(() => {});
    }
    await setTripCover(api, id, trip.title === SKI_TRIP ? 'ski' : 'dolomites');
  }
  return id;
}

async function ensureTour(
  api: APIRequestContext,
  tripId: number,
  name: string,
  build: () => Promise<TourBody | null>
): Promise<number | null> {
  const existing = (await toursOf(api, tripId)).find((t) => t.name === name);
  if (existing) return existing.place_id;
  let body: TourBody | null;
  try {
    body = await build();
  } catch (err) {
    console.warn(
      `[tour-fixtures] "${name}" could not be built and is left out: ${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
  if (!body) {
    console.warn(`[tour-fixtures] "${name}" is left out: its data could not be had`);
    return null;
  }
  const created = await json<{ tour: { place_id: number } }>(
    await api.post(`/api/trips/${tripId}/tours`, { data: body }),
    `create tour "${name}"`
  );
  return created.tour.place_id;
}

/** Put a tour (or one stage of it) on a day, once, and give it its start time. */
async function onDay(
  api: APIRequestContext,
  tripId: number,
  dayId: number,
  placeId: number,
  opts: { time?: string; stage?: number } = {}
): Promise<void> {
  let stageKey: string | undefined;
  if (opts.stage) {
    const tour = (await toursOf(api, tripId)).find((t) => t.place_id === placeId);
    stageKey = tour?.stage_stops?.[opts.stage - 1]?.key;
    if (!stageKey) throw new Error(`tour ${placeId} has no stage ${opts.stage}`);
  }
  const list = async () =>
    (
      await json<{ assignments: AssignmentRow[] }>(
        await api.get(`/api/trips/${tripId}/days/${dayId}/assignments`),
        'assignments'
      )
    ).assignments;
  const matches = (a: AssignmentRow) =>
    a.place_id === placeId && (stageKey ? a.tour_stage_key === stageKey : !a.tour_stage_key);
  let row = (await list()).find(matches);
  if (!row) {
    await json(
      await api.post(`/api/trips/${tripId}/days/${dayId}/assignments`, {
        data: { place_id: placeId, ...(stageKey ? { tour_stage_key: stageKey } : {}) },
      }),
      `put ${placeId} on day ${dayId}`
    );
    row = (await list()).find(matches);
  }
  if (row && opts.time && !row.assignment_time) {
    await json(
      await api.put(`/api/trips/${tripId}/assignments/${row.id}/time`, { data: { place_time: opts.time } }),
      `time of ${placeId}`
    );
  }
}

async function enableTours(api: APIRequestContext): Promise<void> {
  for (const addon of ['tours', 'collections', 'packing']) {
    await json(await api.put(`/api/admin/addons/${addon}`, { data: { enabled: true } }), `enable ${addon}`);
  }
  // Instance switches under Tours; all default to on except wanderer, which needs a server of its own.
  for (const flag of ['tours-hiking-map', 'tours-cycle-map', 'tours-ski-routing']) {
    const res = await api.put(`/api/admin/${flag}`, { data: { enabled: true } });
    if (!res.ok()) console.warn(`[tour-fixtures] could not switch ${flag} on: ${res.status()}`);
  }
}

/**
 * The whole Tours demo data, made where it is missing. Safe to call from every
 * screen script's `beforeAll`: once everything exists it only reads.
 */
export async function ensureToursFixtures(api: APIRequestContext): Promise<ToursFixtures> {
  await enableTours(api);
  const tours: Partial<Record<TourRole, number>> = {};

  // The Dolomites.
  const tripId = await ensureTrip(api, {
    title: TOUR_TRIP,
    description: 'Ten days of huts, passes and lakes: Bolzano, Val Gardena and the Puez-Odle trek.',
    start_date: TOUR_TRIP_DATES.start,
    end_date: TOUR_TRIP_DATES.end,
    currency: 'EUR',
  });
  const dayIds = await daysOf(api, tripId);
  const categories = (
    await json<{ categories: { id: number; name: string }[] }>(await api.get('/api/categories'), 'categories')
  ).categories;
  const places: ToursFixtures['places'] = {};
  for (const role of Object.keys(TOUR_PLACES) as (keyof typeof TOUR_PLACES)[]) {
    const name = TOUR_PLACES[role];
    const spec = PLACE_SPECS[role];
    let found = (await placesOf(api, tripId)).find((p) => p.name === name);
    if (!found) {
      const [lat, lng] = await locate(spec.lookup, spec.near);
      found = (
        await json<{ place: { id: number; name: string } }>(
          await api.post(`/api/trips/${tripId}/places`, {
            data: {
              name,
              lat,
              lng,
              address: spec.address,
              description: spec.description,
              category_id: categories.find((c) => c.name === spec.category)?.id ?? null,
            },
          }),
          `create "${name}"`
        )
      ).place;
    }
    places[role] = found.id;
  }
  for (const [role, index] of PLACE_DAYS) {
    if (dayIds[index] && places[role]) await onDay(api, tripId, dayIds[index], places[role]!);
  }
  const placeIds = new Map((await placesOf(api, tripId)).map((p) => [p.name, p.id]));
  for (const tour of DOLOMITES_TOURS) {
    const id = await ensureTour(api, tripId, TOUR_NAMES[tour.role], () => tour.build({ api, tripId, placeIds }));
    if (id) tours[tour.role] = id;
  }
  // The recorded walk from last summer, imported as a GPX file.
  if (!(await toursOf(api, tripId)).some((t) => t.name === TOUR_NAMES.recorded)) {
    try {
      const file = await tourGpxFixture('seceda');
      await json(
        await api.post(`/api/trips/${tripId}/tours/import/gpx`, {
          multipart: {
            file: { name: TOUR_GPX.seceda.file, mimeType: 'application/gpx+xml', buffer: readFileSync(file) },
            tour_type: 'hike',
          },
        }),
        'import the Seceda GPX'
      );
    } catch (err) {
      console.warn(`[tour-fixtures] the recorded Seceda walk is left out: ${String(err)}`);
    }
  }
  const recorded = (await toursOf(api, tripId)).find((t) => t.name === TOUR_NAMES.recorded);
  if (recorded) tours.recorded = recorded.place_id;
  for (const slot of DOLOMITES_DAYS) {
    const id = tours[slot.role];
    if (id && dayIds[slot.day]) await onDay(api, tripId, dayIds[slot.day], id, { time: slot.time, stage: slot.stage });
  }

  // The hut trek points at its packing category.
  if (tours.hutToHut) {
    const packing = await json<{ items?: { name: string; category: string }[] } | { name: string; category: string }[]>(
      await api.get(`/api/trips/${tripId}/packing`),
      'packing'
    );
    const items = Array.isArray(packing) ? packing : (packing.items ?? []);
    for (const name of TOUR_PACKING.items) {
      if (items.some((i) => i.name === name && i.category === TOUR_PACKING.category)) continue;
      await json(
        await api.post(`/api/trips/${tripId}/packing`, {
          data: { name, category: TOUR_PACKING.category, visibility: 'common' },
        }),
        `packing item ${name}`
      );
    }
    await json(
      await api.put(`/api/trips/${tripId}/tours/${tours.hutToHut}/packing-link`, {
        data: { category: TOUR_PACKING.category },
      }),
      'packing link'
    );
  }

  // The MTB loop, kept in a collection and on no day.
  let collectionId: number | null = null;
  try {
    const { collections } = await json<{ collections: { id: number; name: string }[] }>(
      await api.get('/api/addons/collections'),
      'collections'
    );
    collectionId = collections.find((c) => c.name === TOUR_COLLECTION)?.id ?? null;
    if (collectionId === null) {
      const created = await json<{ id: number } | { collection: { id: number } }>(
        await api.post('/api/addons/collections', {
          data: {
            name: TOUR_COLLECTION,
            description: 'Tours we want to do one day, when the weather plays along.',
            color: '#10b981',
            icon: 'Mountain',
          },
        }),
        'create the collection'
      );
      collectionId = 'id' in created ? created.id : created.collection.id;
    }
    if (tours.mtb) {
      const kept = await json<{ tours: { name: string }[] }>(
        await api.get(`/api/addons/collections/${collectionId}/tours`),
        'collection tours'
      );
      if (!kept.tours.some((t) => t.name === TOUR_NAMES.mtb)) {
        await json(
          await api.post(`/api/addons/collections/${collectionId}/tours`, {
            data: { source_trip_id: tripId, source_place_id: tours.mtb },
          }),
          'keep the MTB loop'
        );
      }
    }
  } catch (err) {
    console.warn(`[tour-fixtures] the collection "${TOUR_COLLECTION}" is incomplete: ${String(err)}`);
  }

  // Japan.
  const japan = seededTrip();
  const japanPlaceIds = new Map((await placesOf(api, japan.tripId)).map((p) => [p.name, p.id]));
  for (const tour of JAPAN_TOURS) {
    const id = await ensureTour(api, japan.tripId, TOUR_NAMES[tour.role], () =>
      tour.build({ api, tripId: japan.tripId, placeIds: japanPlaceIds })
    );
    if (!id) continue;
    tours[tour.role] = id;
    if (japan.dayIds[tour.day]) await onDay(api, japan.tripId, japan.dayIds[tour.day], id, { time: tour.time });
  }

  // The ski week.
  const skiTripId = await ensureTrip(api, {
    title: SKI_TRIP,
    description: 'A week on the Sella Ronda pistes, with a quiet day in the Vallunga.',
    start_date: SKI_TRIP_DATES.start,
    end_date: SKI_TRIP_DATES.end,
    currency: 'EUR',
  });
  const skiDayIds = await daysOf(api, skiTripId);
  for (const tour of SKI_TOURS) {
    const id = await ensureTour(api, skiTripId, TOUR_NAMES[tour.role], () => tour.build(api, skiTripId));
    if (!id) continue;
    tours[tour.role] = id;
    if (skiDayIds[tour.day]) await onDay(api, skiTripId, skiDayIds[tour.day], id, { time: tour.time });
  }

  for (const role of Object.keys(TOUR_NAMES) as TourRole[]) {
    if (!tours[role] && role !== 'inariRecording')
      console.warn(`[tour-fixtures] missing after the seed: ${TOUR_NAMES[role]}`);
  }
  return { tripId, skiTripId, japanTripId: japan.tripId, dayIds, skiDayIds, tours, places, collectionId };
}

/**
 * Opt-in for the recorded-activity guides: a GPX recording of the Fushimi
 * Inari hike, made on day 5 of the running Japan trip, imported and assigned
 * to the planned hike on that day. Left out of `ensureToursFixtures` because
 * the recording is one more tour in the Japan trip's place list, which every
 * other trip screen photographs. Returns the recording's place id.
 */
export async function ensureTourRecording(api: APIRequestContext): Promise<number | null> {
  const japan = seededTrip();
  const hikeId = (await toursOf(api, japan.tripId)).find((t) => t.name === TOUR_NAMES.inariHike)?.place_id;
  if (!hikeId) {
    console.warn('[tour-fixtures] no Fushimi Inari hike to record; run ensureToursFixtures first');
    return null;
  }
  let recording = (await toursOf(api, japan.tripId)).find((t) => t.name === TOUR_NAMES.inariRecording);
  if (!recording) {
    const body = await json<
      { places?: { id: number; route_geometry?: string | null }[] } | { id: number; route_geometry?: string | null }[]
    >(await api.get(`/api/trips/${japan.tripId}/places`), 'places');
    const hikePlace = (Array.isArray(body) ? body : (body.places ?? [])).find((p) => p.id === hikeId);
    const raw = hikePlace?.route_geometry;
    const line = (typeof raw === 'string' ? JSON.parse(raw) : (raw ?? [])) as LatLngEle[];
    if (line.length < 2) return null;
    const file = path.join(process.cwd(), 'e2e', '.tmp', 'fushimi-inari-recorded.gpx');
    writeFileSync(file, recordedGpx(TOUR_NAMES.inariRecording, line, localTime(day(-5), '07:42', 9), 0.55, 20));
    await json(
      await api.post(`/api/trips/${japan.tripId}/tours/import/gpx`, {
        multipart: {
          file: { name: 'fushimi-inari-recorded.gpx', mimeType: 'application/gpx+xml', buffer: readFileSync(file) },
          tour_type: 'hike',
        },
      }),
      'import the Fushimi Inari recording'
    );
    recording = (await toursOf(api, japan.tripId)).find((t) => t.name === TOUR_NAMES.inariRecording);
    if (!recording) return null;
  }
  const { assignments } = await json<{ assignments: AssignmentRow[] }>(
    await api.get(`/api/trips/${japan.tripId}/days/${japan.dayIds[4]}/assignments`),
    'day 5'
  );
  const assignment = assignments.find((a) => a.place_id === hikeId);
  const detail = await json<{ activities?: { track: { place_id: number } }[] }>(
    await api.get(`/api/trips/${japan.tripId}/tours/${hikeId}`),
    'the hike'
  );
  if (!(detail.activities ?? []).some((a) => a.track.place_id === recording!.place_id)) {
    await json(
      await api.put(`/api/trips/${japan.tripId}/tours/${hikeId}/activities`, {
        data: { track_place_id: recording.place_id, assignment_id: assignment?.id ?? null },
      }),
      'assign the recording'
    );
  }
  return recording.place_id;
}

// ── Opening the trips ─────────────────────────────────────────────────────────

const rawKey = (page: Page) =>
  page.getByText(/^(common|dayplan|planner|places|reservations|trip|day|tours|packing)\.[A-Za-z0-9.]+$/);

/**
 * Open the Dolomites trip (or the ski week with `trip: 'ski'`) the way
 * `openTrip` in `trip-shared.ts` opens the Japan one: by its id, notices
 * cleared, waiting for the page and its texts. Without a tab, day `day` (1 by
 * default) is selected and its details panel closed; `day: null` leaves the
 * plan as it opens. `tab: 'tour-planner'` is the Tours tab.
 */
export async function openTourTrip(
  page: Page,
  opts: { trip?: 'summer' | 'ski'; tab?: string; day?: number | null } = {}
): Promise<number> {
  const { trip = 'summer', tab, day: dayNumber = 1 } = opts;
  const title = trip === 'ski' ? SKI_TRIP : TOUR_TRIP;
  const res = await page.request.get('/api/trips');
  const { trips = [] } = (await res.json()) as { trips?: { id: number; title: string }[] };
  const found = trips.find((t) => t.title === title);
  if (!found) throw new Error(`no trip "${title}": call ensureToursFixtures in beforeAll`);
  // Named even for the plan: without it the trip reopens on the tab this browser tab showed last.
  await page.goto(`/trips/${found.id}?tab=${tab ?? 'plan'}`);
  await clearNotices(page);
  await dismissReleaseNotice(page);
  await expect(page.getByRole('button', { name: 'Trip settings', exact: true })).toBeVisible({ timeout: 30_000 });
  await settle(page);
  for (let attempt = 0; attempt < 4 && (await rawKey(page).count()) > 0; attempt++) {
    await page.waitForTimeout(4000);
    await page.reload();
    await clearNotices(page);
    await dismissReleaseNotice(page);
    await expect(page.getByRole('button', { name: 'Trip settings', exact: true })).toBeVisible({ timeout: 30_000 });
    await settle(page);
  }
  await expect(rawKey(page), 'the page shows i18n keys instead of text').toHaveCount(0);
  if (!tab && dayNumber) {
    await selectDay(page, dayNumber);
    await closeDayDetails(page);
  }
  await page.waitForTimeout(1200);
  return found.id;
}
