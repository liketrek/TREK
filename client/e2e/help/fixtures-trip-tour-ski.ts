import type { APIRequestContext, Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { SKI_TRIP, SKI_TRIP_DATES, TOUR_NAMES } from './tour-fixtures';

/**
 * What the Ski & winter help pictures need beyond `ensureToursFixtures`: a
 * recorded ski track to import through the UI, and the names of what the
 * guides make, so their cleanup can take it away again.
 *
 * The track follows the line of the "Vallunga winter walk" tour, which
 * `ensureToursFixtures` draws along the real Vallunga path (by the piste
 * router where it answers, else along the OpenStreetMap way), so the recording
 * lies on the valley's cross-country trail and not on a line drawn here. It is
 * recorded a year before the ski week, at a classic skier's pace.
 */

/** The track the import guide brings in, by the name in its file. */
export const SKI_TRACK = { name: 'Vallunga cross-country loop', file: 'vallunga-cross-country-loop.gpx' };
/** The tour the planning guide saves, deleted again by its cleanup. */
export const PLANNED_SKI_TOUR = 'Selva to Corvara on skis';

/**
 * The points the planner guides click, the first part of the Sella Ronda:
 * Selva at the Dantercepies I valley station, the top of the Gardena run at
 * Passo Gardena, and Corvara at the Borest and Boè gondolas. Each lies within
 * a few metres of the piste data, because the router only takes a point
 * within 150 m of a run or lift: the old Corvara point sat 360 m off the
 * Sodlisia run and failed as not_on_piste, and the old Selva point snapped to
 * the run down into the village, so the first leg went round by Ciampinoi
 * instead of up the Dantercepies gondola. On the Places build of 2026-10-20
 * the first leg rides Dantercepies I and II and skis the Sellaronda run to
 * the pass, and the second skis Gardena, Frara and Sodlisia down to Colfosco
 * and takes the Borest gondola over to Corvara. With every lift left out, the
 * first leg fails as blocked_by_lift_avoid on Dantercepies I.
 */
export const SKI_POINTS: [number, number][] = [
  [46.5556, 11.768],
  [46.5512, 11.8077],
  [46.5482, 11.871],
];

type Point = [number, number, number];

/** The trip's id by its title. */
export async function skiTripId(api: APIRequestContext): Promise<number> {
  const res = await api.get('/api/trips');
  const { trips = [] } = (await res.json()) as { trips?: { id: number; title: string }[] };
  const trip = trips.find((t) => t.title === SKI_TRIP);
  if (!trip) throw new Error(`no trip "${SKI_TRIP}": call ensureToursFixtures first`);
  return trip.id;
}

/** The tours of the ski week, name and place id. */
async function skiTours(api: APIRequestContext, tripId: number): Promise<{ place_id: number; name: string }[]> {
  const res = await api.get(`/api/trips/${tripId}/tours`);
  if (!res.ok()) return [];
  return ((await res.json()) as { tours?: { place_id: number; name: string }[] }).tours ?? [];
}

/** The line of a saved tour, from the trip's places or the tour itself. */
async function lineOf(api: APIRequestContext, tripId: number, placeId: number): Promise<Point[]> {
  const parse = (raw: unknown): Point[] => {
    const value = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
    return Array.isArray(value)
      ? (value as number[][]).filter((p) => p.length >= 2).map((p) => [p[0], p[1], p[2] ?? NaN])
      : [];
  };
  const places = await api.get(`/api/trips/${tripId}/places`);
  if (places.ok()) {
    const body = (await places.json()) as
      { places?: { id: number; route_geometry?: unknown }[] } | { id: number; route_geometry?: unknown }[];
    const row = (Array.isArray(body) ? body : (body.places ?? [])).find((p) => p.id === placeId);
    const line = parse(row?.route_geometry);
    if (line.length > 1) return line;
  }
  const tour = await api.get(`/api/trips/${tripId}/tours/${placeId}`);
  if (tour.ok()) {
    const body = (await tour.json()) as { route_geometry?: unknown; tour?: { route_geometry?: unknown } };
    return parse(body.route_geometry ?? body.tour?.route_geometry);
  }
  return [];
}

const metres = (a: Point, b: Point): number => {
  const r = 6_371_000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
};

/** A small seeded random, so the recording is the same on every run. */
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
 * A GPS recording of `line`: a point every 15 m, a little scatter, heights
 * where the line has none (the Vallunga climbs from about 1610 m to 1760 m),
 * classic cross-country pace, slower uphill, and a stop at the turn.
 */
function recordedSkiGpx(line: Point[], startUtcMs: number): string {
  const rnd = random(4219);
  const known = line.every((p) => Number.isFinite(p[2]));
  const total = line.slice(1).reduce((s, p, i) => s + metres(line[i], p), 0) || 1;
  let run = 0;
  const withHeights: Point[] = line.map((p, i) => {
    if (i > 0) run += metres(line[i - 1], p);
    if (known) return p;
    // Out and back: up to the turn, then down the same way.
    const f = run / total;
    return [p[0], p[1], 1610 + 150 * (f <= 0.5 ? f * 2 : (1 - f) * 2)];
  });
  const pts: Point[] = [withHeights[0]];
  for (let i = 1; i < withHeights.length; i++) {
    const a = withHeights[i - 1];
    const b = withHeights[i];
    const n = Math.max(1, Math.round(metres(a, b) / 15));
    for (let k = 1; k <= n; k++) {
      const s = k / n;
      pts.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s]);
    }
  }
  let t = startUtcMs;
  const turn = Math.floor(pts.length / 2);
  const rows = pts.map((p, i) => {
    if (i > 0) {
      const d = metres(pts[i - 1], p);
      const slope = d > 0 ? (p[2] - pts[i - 1][2]) / d : 0;
      const kmh = slope > 0 ? Math.max(5, 11 - slope * 120) : Math.min(16, 11 - slope * 80);
      t += (d / 1000 / kmh) * 3_600_000;
    }
    if (i === turn) t += 12 * 60_000;
    const lat = p[0] + (rnd() - 0.5) * 0.00005;
    const lng = p[1] + (rnd() - 0.5) * 0.00007;
    const ele = p[2] + (rnd() - 0.5) * 3;
    const time = new Date(Math.round(t / 1000) * 1000).toISOString().replace('.000', '');
    return `      <trkpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}"><ele>${ele.toFixed(1)}</ele><time>${time}</time></trkpt>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Garmin Connect" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${SKI_TRACK.name}</name><time>${new Date(startUtcMs).toISOString().replace('.000', '')}</time></metadata>
  <trk><name>${SKI_TRACK.name}</name><type>cross_country_skiing</type><trkseg>
${rows.join('\n')}
  </trkseg></trk>
</gpx>
`;
}

/** Where the Vallunga winter walk runs when no line can be read: the car park, the chapel and back. */
const VALLUNGA: Point[] = [
  [46.5622, 11.7795, 1610],
  [46.5652, 11.7858, 1640],
  [46.5688, 11.7925, 1680],
  [46.5712, 11.7984, 1720],
  [46.5735, 11.804, 1760],
  [46.5712, 11.7984, 1720],
  [46.5688, 11.7925, 1680],
  [46.5652, 11.7858, 1640],
  [46.5622, 11.7795, 1610],
];

/**
 * The path of the recorded ski track in `e2e/.tmp/`, written on every call
 * from the winter walk's line, so it follows whatever line that tour has.
 */
export async function skiTrackFixture(api: APIRequestContext): Promise<string> {
  const tripId = await skiTripId(api);
  const walk = (await skiTours(api, tripId)).find((t) => t.name === TOUR_NAMES.winterWalk);
  let line = walk ? await lineOf(api, tripId, walk.place_id) : [];
  if (line.length < 2) {
    console.warn('[ski fixtures] no line for the Vallunga winter walk; the track follows the built-in points');
    line = VALLUNGA;
  }
  const dir = path.join(process.cwd(), 'e2e', '.tmp');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, SKI_TRACK.file);
  // A year before the ski week's fourth day, 10:20 in Val Gardena (UTC+1).
  const day = new Date(`${SKI_TRIP_DATES.start}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 3 - 364);
  const start = day.getTime() + (10 * 60 + 20 - 60) * 60_000;
  writeFileSync(file, recordedSkiGpx(line, start));
  return file;
}

/** Delete every tour of the ski week whose name is one of `names` (a guide's own, never the fixture's). */
export async function deleteSkiTours(page: Page, ...names: string[]): Promise<void> {
  const tripId = await skiTripId(page.request);
  const base = SKI_TRACK.file.replace(/\.gpx$/, '');
  for (const tour of await skiTours(page.request, tripId)) {
    if (!names.includes(tour.name) && !(names.includes(SKI_TRACK.name) && tour.name === base)) continue;
    const res = await page.request.delete(`/api/trips/${tripId}/places/${tour.place_id}`);
    if (!res.ok()) console.warn(`[ski fixtures] could not delete "${tour.name}": ${res.status()}`);
  }
}

/**
 * Forget the editor's unsaved draft of the ski week. The planner keeps it on
 * the account and opens it again on the next page load, so a draft one guide
 * leaves behind would greet the next one in place of Plan new tour. Older
 * builds kept it in this browser as `tour-draft-<tripId>`, which goes too.
 */
export async function forgetSkiDraft(page: Page): Promise<void> {
  const tripId = await skiTripId(page.request);
  const res = await page.request.delete(`/api/trips/${tripId}/tour-draft`).catch(() => null);
  if (res && !res.ok() && res.status() !== 404)
    console.warn(`[ski fixtures] could not forget the tour draft: ${res.status()}`);
  await page
    .evaluate((id) => {
      try {
        localStorage.removeItem(`tour-draft-${id}`);
      } catch {
        // Storage blocked: nothing was kept there either.
      }
    }, tripId)
    .catch(() => undefined);
}
