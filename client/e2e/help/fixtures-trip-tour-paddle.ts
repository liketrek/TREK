import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { day } from '../dates';
import { clearNotices } from '../screenshots/shot';
import { dismissReleaseNotice, nudgeClock, settle } from './guide';
import { TOUR_NAMES, TOUR_TRIP, TOUR_TRIP_DATES } from './tour-fixtures';

/**
 * What the paddle tour pictures need beyond `ensureToursFixtures`.
 *
 * The boat tour "Rowing round Lago di Braies" on day 9 of "Summer in the
 * Dolomites" is the one every paddle picture shows. Its four legs are drawn by
 * hand along the shore, because a fresh database holds no water data, and the
 * pictures keep it that way: TREK fetches a region's water data by itself
 * when a leg cannot be planned, and an admin planning sets that download
 * going at once. `holdPaddleDownloads` switches that off for the run and
 * `restorePaddleDownloads` puts the setting back.
 *
 * Three guides need a little more, and each makes it in its `start` and takes
 * it away in its `cleanup` (and `afterAll` again, for a run that failed):
 *
 *  - the wind forecast needs a day within the next two weeks, which the
 *    summer trip does not have, so `ensureWindTrip` makes a short trip from
 *    tomorrow with the boat tour taken over onto its first day;
 *  - the checklist lists what is saved, so `ensureCarryCopy` makes a copy of
 *    the boat tour for that guide to save a portage and a lock on;
 *  - the recorded track is a GPX file, written by `paddleGpxFixture` from the
 *    boat tour's own line, with the scatter and the times a watch records.
 */

export const PADDLE_TOUR = TOUR_NAMES.paddle;
/** The trip the wind guide makes and deletes again: two days from tomorrow. */
export const WIND_TRIP = 'Weekend at Lago di Braies';
/** The copy the checklist guide saves a portage and a lock on. */
export const CARRY_COPY = 'Lago di Braies with a carry';
/** The recorded track the import guide brings in, by its file and the name inside it. */
export const PADDLE_GPX = { name: 'Lago di Braies kayak round', file: 'lago-di-braies-kayak-round.gpx' } as const;

async function json<T>(res: Awaited<ReturnType<APIRequestContext['get']>>, what: string): Promise<T> {
  if (!res.ok()) throw new Error(`${what}: ${res.status()} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

interface TourRow {
  place_id: number;
  name: string;
  tour_type?: string;
}

export async function tripIdByTitle(api: APIRequestContext, title: string): Promise<number | null> {
  const { trips = [] } = await json<{ trips?: { id: number; title: string }[] }>(await api.get('/api/trips'), 'trips');
  return trips.find((t) => t.title === title)?.id ?? null;
}

export async function summerTripId(api: APIRequestContext): Promise<number> {
  const id = await tripIdByTitle(api, TOUR_TRIP);
  if (id === null) throw new Error(`no trip "${TOUR_TRIP}": call ensureToursFixtures in beforeAll`);
  return id;
}

export async function toursOf(api: APIRequestContext, tripId: number): Promise<TourRow[]> {
  return (await json<{ tours: TourRow[] }>(await api.get(`/api/trips/${tripId}/tours`), `tours of trip ${tripId}`))
    .tours;
}

/** The boat tour's place id in the summer trip. */
export async function paddleTourId(api: APIRequestContext): Promise<number> {
  const tripId = await summerTripId(api);
  const tour = (await toursOf(api, tripId)).find((t) => t.name === PADDLE_TOUR);
  if (!tour)
    throw new Error(
      `no tour "${PADDLE_TOUR}": the Overpass shore of Lago di Braies was not there when the fixtures ran`
    );
  return tour.place_id;
}

/** Deletes the tours of a trip the test picks; a tour is a place, and goes the way a place goes. */
export async function deleteToursWhere(
  api: APIRequestContext,
  tripId: number,
  pick: (tour: TourRow) => boolean
): Promise<void> {
  for (const tour of (await toursOf(api, tripId)).filter(pick)) {
    await api.delete(`/api/trips/${tripId}/places/${tour.place_id}`);
  }
}

// ── The editor's draft ────────────────────────────────────────────────────────

/**
 * The planner keeps an unsaved edit on the account per trip and restores it on
 * the next page load. A paddle guide that stops half way (its cleanup does not
 * run then) would leave its carry and lock in that draft, and the next guide
 * would open on it: the editor instead of the neutral rail, and a click on a
 * tour row asking Discard unsaved tour changes. A trip without a draft answers
 * 404, which is what is wanted.
 */
export async function forgetPaddleDraft(api: APIRequestContext): Promise<void> {
  const tripId = await summerTripId(api);
  const res = await api.delete(`/api/trips/${tripId}/tour-draft`);
  if (!res.ok() && res.status() !== 404)
    console.warn(`[trip-tour-paddle] could not drop the tour draft: ${res.status()}`);
}

/**
 * The same before a guide opens its page, and the copy older builds kept in the
 * browser as `tour-draft-<tripId>`, dropped before the app reads it.
 */
export async function forgetPaddleDraftBeforeLoad(page: Page): Promise<void> {
  await forgetPaddleDraft(page.request);
  await page.addInitScript(() => {
    try {
      for (const key of Object.keys(localStorage)) if (key.startsWith('tour-draft-')) localStorage.removeItem(key);
    } catch {
      // Storage blocked: there is no draft to restore either.
    }
  });
}

// ── The download switch ───────────────────────────────────────────────────────

type AutoLoad = { mode: 'auto' | 'ask' | 'off'; max_mb: number };
let heldFrom: AutoLoad | null = null;

/**
 * No water data downloads while the paddle pictures run. Without this, the
 * first leg the planner cannot plan makes the server fetch the smallest
 * Geofabrik extract around Lago di Braies (all of north-east Italy) and build
 * a water network from it, for minutes, because the picture user is an admin.
 */
export async function holdPaddleDownloads(api: APIRequestContext): Promise<void> {
  const current = await json<AutoLoad>(await api.get('/api/admin/paddle-regions/settings'), 'paddle region settings');
  if (heldFrom === null) heldFrom = current;
  if (current.mode !== 'off') {
    await json(
      await api.put('/api/admin/paddle-regions/settings', { data: { mode: 'off', max_mb: current.max_mb } }),
      'hold paddle downloads'
    );
  }
}

export async function restorePaddleDownloads(api: APIRequestContext): Promise<void> {
  if (heldFrom === null) return;
  await api.put('/api/admin/paddle-regions/settings', { data: heldFrom });
  heldFrom = null;
}

// ── The wind trip ─────────────────────────────────────────────────────────────

export async function deleteTripsNamed(api: APIRequestContext, title: string): Promise<void> {
  const { trips = [] } = await json<{ trips?: { id: number; title: string }[] }>(await api.get('/api/trips'), 'trips');
  for (const trip of trips.filter((t) => t.title === title)) await api.delete(`/api/trips/${trip.id}`);
}

/**
 * A two-day trip from tomorrow with the boat tour taken over onto its first
 * day at 10:00, so its Wind card has a forecast to show. Made fresh every time.
 */
export async function ensureWindTrip(
  api: APIRequestContext
): Promise<{ tripId: number; placeId: number; name: string }> {
  await deleteTripsNamed(api, WIND_TRIP);
  const sourceTrip = await summerTripId(api);
  const source = await paddleTourId(api);
  const { trip } = await json<{ trip: { id: number } }>(
    await api.post('/api/trips', {
      data: {
        title: WIND_TRIP,
        description: 'Two quiet days at the lake, out on the water if the wind allows.',
        start_date: day(1),
        end_date: day(2),
        currency: 'EUR',
      },
    }),
    `create "${WIND_TRIP}"`
  );
  const taken = await json<{ tour: { place_id: number } }>(
    await api.post(`/api/trips/${trip.id}/tours/take-over`, {
      data: { source_trip_id: sourceTrip, source_place_id: source },
    }),
    'take the boat tour over'
  );
  const { days } = await json<{ days: { id: number; date?: string | null }[] }>(
    await api.get(`/api/trips/${trip.id}/days`),
    'days'
  );
  const first = [...days].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || a.id - b.id)[0];
  if (!first) throw new Error(`"${WIND_TRIP}" has no days`);
  await json(
    await api.post(`/api/trips/${trip.id}/days/${first.id}/assignments`, { data: { place_id: taken.tour.place_id } }),
    'put the boat tour on day 1'
  );
  const { assignments = [] } = await json<{ assignments?: { id: number; place_id: number }[] }>(
    await api.get(`/api/trips/${trip.id}/days/${first.id}/assignments`),
    'assignments'
  );
  const row = assignments.find((a) => a.place_id === taken.tour.place_id);
  if (row) await api.put(`/api/trips/${trip.id}/assignments/${row.id}/time`, { data: { place_time: '10:00' } });
  const name = (await toursOf(api, trip.id)).find((t) => t.place_id === taken.tour.place_id)?.name ?? PADDLE_TOUR;
  return { tripId: trip.id, placeId: taken.tour.place_id, name };
}

// ── The copy for the checklist ────────────────────────────────────────────────

/** A fresh copy of the boat tour in the summer trip, on no day, for a guide to save changes on. */
export async function ensureCarryCopy(api: APIRequestContext): Promise<number> {
  const tripId = await summerTripId(api);
  await deleteToursWhere(api, tripId, (t) => t.name === CARRY_COPY);
  const source = await paddleTourId(api);
  const copy = await json<{ tour: { place_id: number } }>(
    await api.post(`/api/trips/${tripId}/tours/${source}/copy`, {
      data: { name: CARRY_COPY },
    }),
    'copy the boat tour'
  );
  return copy.tour.place_id;
}

// ── The recorded track ────────────────────────────────────────────────────────

type Point = [number, number];

function metres(a: Point, b: Point): number {
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLng = (b[1] - a[1]) * rad;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(s));
}

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The points of a GPX file, track points or route points, whichever order its attributes come in. */
function gpxPoints(gpx: string): Point[] {
  const points: Point[] = [];
  for (const match of gpx.matchAll(/<(?:trkpt|rtept)\b([^>]*)>/g)) {
    const lat = /\blat="([-\d.]+)"/.exec(match[1]);
    const lon = /\blon="([-\d.]+)"/.exec(match[1]);
    if (lat && lon) points.push([Number(lat[1]), Number(lon[1])]);
  }
  return points;
}

/**
 * A kayak round of Lago di Braies as a watch records it, made from the boat
 * tour's own line (its GPX export): a point every 10 m or so, a few metres of
 * GPS scatter, 5.5 km/h on the water with a twenty minute stop on the far
 * shore, on a morning last summer. Written to `e2e/.tmp/` and returned as a path.
 */
export async function paddleGpxFixture(api: APIRequestContext): Promise<string> {
  const tripId = await summerTripId(api);
  const placeId = await paddleTourId(api);
  const res = await api.get(`/api/trips/${tripId}/tours/${placeId}/export.gpx`);
  if (!res.ok()) throw new Error(`export the boat tour: ${res.status()}`);
  const line = gpxPoints(await res.text());
  if (line.length < 8) throw new Error('the boat tour exported no line to record a track from');
  const dense: Point[] = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const n = Math.max(1, Math.round(metres(a, b) / 10));
    for (let k = 1; k <= n; k++) dense.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  const rnd = seeded(4242);
  // 09:40 in the Dolomites in summer is 07:40 UTC.
  let t = Date.parse(`${addDays(TOUR_TRIP_DATES.start, -358)}T07:40:00Z`);
  const pause = Math.floor(dense.length * 0.55);
  const rows = dense.map((p, i) => {
    if (i > 0) t += (metres(dense[i - 1], p) / 1000 / (5.5 * (0.9 + rnd() * 0.2))) * 3_600_000;
    if (i === pause) t += 20 * 60_000;
    const lat = p[0] + (rnd() - 0.5) * 0.00005;
    const lng = p[1] + (rnd() - 0.5) * 0.00007;
    const ele = 1494 + (rnd() - 0.5) * 2;
    return `      <trkpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}"><ele>${ele.toFixed(1)}</ele><time>${new Date(Math.round(t / 1000) * 1000).toISOString().replace('.000', '')}</time></trkpt>`;
  });
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Garmin Connect" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${PADDLE_GPX.name}</name></metadata>
  <trk><name>${PADDLE_GPX.name}</name><type>kayaking</type><trkseg>
${rows.join('\n')}
  </trkseg></trk>
</gpx>
`;
  const dir = path.join(process.cwd(), 'e2e', '.tmp');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, PADDLE_GPX.file);
  writeFileSync(file, gpx);
  return file;
}

/** Whether a tour is the recorded track the import guide brings in, whichever name the server gave it. */
export const isPaddleImport = (tour: { name: string }): boolean => /kayak[\s-]round/i.test(tour.name);

// ── On the page ───────────────────────────────────────────────────────────────

/** The Tours tab of a trip by its id, the way `openTourTrip` opens the summer one. */
export async function openToursOf(page: Page, tripId: number): Promise<void> {
  await page.goto(`/trips/${tripId}?tab=tour-planner`);
  await clearNotices(page);
  await dismissReleaseNotice(page);
  await expect(page.getByRole('button', { name: 'Trip settings', exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('listbox', { name: 'Tours of this trip' })).toBeVisible({ timeout: 30_000 });
  await settle(page);
}

/**
 * Let a pan or a fit of the map land. Leaflet times its animations from
 * `+new Date()`, and the clock is pinned to the picture day, so they start and
 * never finish; moving the pinned clock on a few seconds ends them.
 */
export async function finishMapMove(page: Page): Promise<void> {
  await page.waitForTimeout(400);
  await nudgeClock(page);
  await page.waitForTimeout(1200);
  await settle(page);
}

/**
 * A spot on the drawn tour line that the pointer can really reach, about
 * `fraction` of the way along it: the longest line in Leaflet's overlay pane,
 * sampled near that point until the map itself, not something over it, takes
 * a click there. A box centre would be no use, the lake's middle is water
 * nobody paddled.
 */
export async function pointOnLine(page: Page, fraction: number): Promise<{ x: number; y: number }> {
  const found = await page.evaluate((wanted: number) => {
    const paths = Array.from(document.querySelectorAll<SVGPathElement>('.leaflet-overlay-pane svg path'));
    let line: SVGPathElement | null = null;
    let longest = 0;
    for (const path of paths) {
      const length = path.getTotalLength();
      if (length > longest) {
        longest = length;
        line = path;
      }
    }
    if (!line || longest < 40) return null;
    const ctm = line.getScreenCTM();
    if (!ctm) return null;
    for (let step = 0; step <= 20; step++) {
      for (const sign of [1, -1]) {
        const f = wanted + sign * step * 0.005;
        if (f <= 0.02 || f >= 0.98) continue;
        const at = line.getPointAtLength(longest * f);
        const x = Math.round(ctm.a * at.x + ctm.c * at.y + ctm.e);
        const y = Math.round(ctm.b * at.x + ctm.d * at.y + ctm.f);
        // The marking tool listens on the map's own click and lays the spot onto
        // the track itself, and the drawn line is not interactive while it is on,
        // so the pointer lands on whatever map layer lies under the line (the
        // vector base map's canvas, a tile). That point is reachable as long as
        // the map gets it, not a panel, a card, a control or a marker that keeps
        // the click for itself.
        const hit = document.elementFromPoint(x, y);
        if (
          hit &&
          hit.closest('.leaflet-container') &&
          !hit.closest('.leaflet-control-container, .leaflet-marker-pane, .leaflet-popup-pane, .leaflet-tooltip-pane')
        ) {
          return { x, y };
        }
      }
    }
    return null;
  }, fraction);
  if (!found) throw new Error(`no reachable point on the drawn line near ${Math.round(fraction * 100)} %`);
  return found;
}
