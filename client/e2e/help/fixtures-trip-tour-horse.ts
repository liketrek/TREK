import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { clearNotices } from '../screenshots/shot';
import { dismissReleaseNotice, nudgeClock, settle } from './guide';
import { TOUR_GPX, TOUR_NAMES, TOUR_TRIP, tourGpxFixture } from './tour-fixtures';
import { closeDayDetails, selectDay, tripReady } from './trip-shared';

/**
 * What the horse ride guides share: the way into the Tours tab with the
 * Seiser Alm in view, the horse routes the Horse routes card finds there, and
 * the GPX file of a recorded ride. Not a `.guide.ts`, so importing it
 * registers no tests.
 *
 * The horse routes come from OpenStreetMap through the server (TREK Places,
 * else Overpass), and a fresh database has neither cached. What the area has
 * is asked once, in `beforeAll`: when it holds a section long enough to ride
 * and a second one a short way off its end (the gap guide needs both), that
 * answer is what the card is given for the whole run, so every picture shows
 * the same list. When it does not, the card is given two routes cut from the
 * ride the fixtures saved on the Seiser Alm, whose line follows real ways
 * (a horse route section where one was found, farm tracks otherwise).
 */

type LatLng = [number, number];

interface HorseSection {
  number: number;
  geometry: LatLng[];
  length_m: number;
  access: { value: string; length_m: number }[];
  signposted: 'with' | 'against' | null;
}
interface HorseRoute {
  id: string;
  name: string | null;
  ref: string | null;
  osmUrl: string;
  continues: boolean;
  sections: HorseSection[];
}
interface HorseAnswer {
  routes: HorseRoute[];
  truncated: boolean;
  source: 'openstreetmap';
  attribution: string;
}

/** Which route and section each guide takes, by the test ids the card and the dialog carry. */
export interface HorsePick {
  routeId: string;
  section: number;
}
export interface HorsePlan {
  answer: HorseAnswer;
  /** The section the ride starts with. */
  first: HorsePick;
  /** A section that starts away from the end of `first`, for the gap guide. */
  gap: HorsePick;
  /** Where the answer came from, for the run's log. */
  source: 'live' | 'demo';
}

/** The name the plan guide saves its new ride under; its cleanup deletes it. */
export const NEW_RIDE = 'Morning ride on the Seiser Alm';
/** The recorded ride the import guide brings in, and its file. */
export const RECORDED_RIDE = { name: 'Rasciesa ride', file: 'rasciesa-ride.gpx' };

// ── The trip ──────────────────────────────────────────────────────────────────

export async function tourTripId(api: APIRequestContext): Promise<number> {
  const res = await api.get('/api/trips');
  const { trips = [] } = (await res.json()) as { trips?: { id: number; title: string }[] };
  const found = trips.find((t) => t.title === TOUR_TRIP);
  if (!found) throw new Error(`no trip "${TOUR_TRIP}": call ensureToursFixtures in beforeAll`);
  return found.id;
}

interface TourListRow {
  place_id: number;
  name: string;
  tour_type?: string;
}

export async function toursOfTrip(api: APIRequestContext, tripId: number): Promise<TourListRow[]> {
  const res = await api.get(`/api/trips/${tripId}/tours`);
  if (!res.ok()) return [];
  return ((await res.json()) as { tours?: TourListRow[] }).tours ?? [];
}

/** Delete the tours a guide made, by name. A tour is a place, and goes the way a place goes. */
export async function deleteToursNamed(api: APIRequestContext, ...names: string[]): Promise<void> {
  const tripId = await tourTripId(api);
  for (const tour of (await toursOfTrip(api, tripId)).filter((t) => names.includes(t.name))) {
    await api.delete(`/api/trips/${tripId}/places/${tour.place_id}`);
  }
}

/** Drop the caller's unsaved editor draft of the trip; a trip without one answers 404, which is fine. */
export async function forgetTourDraft(api: APIRequestContext, tripId?: number): Promise<void> {
  const id = tripId ?? (await tourTripId(api));
  const res = await api.delete(`/api/trips/${id}/tour-draft`);
  if (!res.ok() && res.status() !== 404)
    console.warn(`[trip-tour-horse] could not drop the tour draft: ${res.status()}`);
}

const rawKey = (page: Page) =>
  page.getByText(/^(common|dayplan|planner|places|trip|day|tours|packing)\.[A-Za-z0-9.]+$/);

/** The trip tab bar's Tours tab: a plain button named after the tab. */
export const toursTabButton = (page: Page) => page.getByRole('button', { name: 'Tours', exact: true }).first();
export const tripTours = (page: Page) => page.getByRole('listbox', { name: 'Tours of this trip' });
export const tourRow = (page: Page, name: string) =>
  tripTours(page).getByRole('option').filter({ hasText: name }).first();

/**
 * Let a pan of the map land. Leaflet times it from `+new Date()` and the clock
 * is pinned to the picture day, so a pan starts and never gets anywhere; moving
 * the pinned clock on a few seconds ends it, as `finishMapPan` does on the
 * road trip screen.
 */
export async function finishMapPan(page: Page): Promise<void> {
  await page.waitForTimeout(400);
  await nudgeClock(page);
  await page.waitForTimeout(1200);
  await settle(page);
}

/**
 * Open the Dolomites trip on the Tours tab with the Seiser Alm in view.
 *
 * A new draft keeps the map where it is, and the planner opens on the area the
 * plan map showed last (`usePlannerFocusPoints`), so the plan is opened on day 2,
 * the day of the horse ride, and the Tours tab is reached by its button rather
 * than by the address: a page load would forget that area.
 *
 * The editor's unsaved draft is kept on the account per trip now, not in the
 * browser, so a draft another guide left on this trip comes back into the left
 * rail on load: Plan new tour is then gone, and a click on a saved tour asks
 * first whether to discard it. It is dropped before the page opens.
 */
export async function openToursTab(page: Page): Promise<number> {
  const tripId = await tourTripId(page.request);
  await forgetTourDraft(page.request, tripId);
  await page.goto(`/trips/${tripId}`);
  await clearNotices(page);
  await dismissReleaseNotice(page);
  await tripReady(page);
  await settle(page);
  for (let attempt = 0; attempt < 4 && (await rawKey(page).count()) > 0; attempt++) {
    await page.waitForTimeout(4000);
    await page.reload();
    await clearNotices(page);
    await dismissReleaseNotice(page);
    await tripReady(page);
    await settle(page);
  }
  await expect(rawKey(page), 'the page shows i18n keys instead of text').toHaveCount(0);
  await selectDay(page, 2);
  await closeDayDetails(page);
  await finishMapPan(page);
  await toursTabButton(page).click();
  await expect(tripTours(page)).toBeVisible({ timeout: 30_000 });
  await expect(
    tourRow(page, TOUR_NAMES.horse),
    `no "${TOUR_NAMES.horse}": did ensureToursFixtures make it?`
  ).toBeVisible({
    timeout: 30_000,
  });
  await finishMapPan(page);
  return tripId;
}

/** The saved ride open in the editor, its line framed. */
export async function openSavedRide(page: Page): Promise<void> {
  await openToursTab(page);
  const row = tourRow(page, TOUR_NAMES.horse);
  await row.click();
  await expect(row).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 });
  await expect(page.getByRole('region', { name: 'Horse routes' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('tour-planner-overview')).toBeVisible({ timeout: 60_000 });
  await finishMapPan(page);
}

// ── The horse routes ──────────────────────────────────────────────────────────

const R = 6_371_000;
function metres(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLng = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function lengthOf(line: LatLng[]): number {
  return line.slice(1).reduce((sum, p, i) => sum + metres(line[i], p), 0);
}

/** The stretch of `line` from `from` to `to`, as shares of its length. */
function cut(line: LatLng[], from: number, to: number): LatLng[] {
  const total = lengthOf(line);
  const out: LatLng[] = [];
  let run = 0;
  for (let i = 0; i < line.length; i++) {
    if (i > 0) run += metres(line[i - 1], line[i]);
    const share = run / total;
    if (share >= from && share <= to) out.push(line[i]);
  }
  return out;
}

function lineOf(raw: unknown): LatLng[] {
  const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((p): p is number[] => Array.isArray(p) && p.length >= 2)
    .map((p) => [Number(p[0]), Number(p[1])] as LatLng);
}

/** The saved ride's line, from its detail or, failing that, from the trip's places. */
async function savedRideLine(api: APIRequestContext, tripId: number): Promise<LatLng[]> {
  const ride = (await toursOfTrip(api, tripId)).find((t) => t.name === TOUR_NAMES.horse);
  if (!ride) throw new Error(`no "${TOUR_NAMES.horse}": call ensureToursFixtures first`);
  const detail = await api.get(`/api/trips/${tripId}/tours/${ride.place_id}`);
  if (detail.ok()) {
    const body = (await detail.json()) as { tour?: { route_geometry?: unknown }; route_geometry?: unknown };
    const line = lineOf(body.tour?.route_geometry ?? body.route_geometry);
    if (line.length >= 2) return line;
  }
  const res = await api.get(`/api/trips/${tripId}/places`);
  const body = (await res.json()) as
    { places?: { id: number; route_geometry?: unknown }[] } | { id: number; route_geometry?: unknown }[];
  const place = (Array.isArray(body) ? body : (body.places ?? [])).find((p) => p.id === ride.place_id);
  const line = lineOf(place?.route_geometry);
  if (line.length < 2) throw new Error(`"${TOUR_NAMES.horse}" has no line to cut horse routes from`);
  return line;
}

function bboxAround(line: LatLng[], pad: number): string {
  const lats = line.map((p) => p[0]);
  const lngs = line.map((p) => p[1]);
  return [Math.min(...lats) - pad, Math.min(...lngs) - pad, Math.max(...lats) + pad, Math.max(...lngs) + pad]
    .map((v) => v.toFixed(5))
    .join(',');
}

/** Where a section starts when the dialog offers it to a ride ending at `end` (`preferReversed`). */
function offeredStart(section: HorseSection, end: LatLng | null): LatLng {
  const first = section.geometry[0];
  const last = section.geometry[section.geometry.length - 1];
  if (!end) return section.signposted === 'against' ? last : first;
  return metres(end, last) < metres(end, first) ? last : first;
}
function offeredEnd(section: HorseSection, end: LatLng | null): LatLng {
  const start = offeredStart(section, end);
  const first = section.geometry[0];
  return start === first ? section.geometry[section.geometry.length - 1] : first;
}

/**
 * The two picks the guides need from an answer, or null where it cannot give
 * them: a first section of at least 600 m on an empty ride, and another
 * section whose nearer end lies between 100 m and 3 km from where that one
 * ends, so the dialog names a gap that is worth bridging by hand.
 */
function picksOf(answer: HorseAnswer): { first: HorsePick; gap: HorsePick } | null {
  const all = answer.routes.flatMap((route) => route.sections.map((section) => ({ route, section })));
  const first = all.filter((x) => x.section.length_m >= 600).sort((a, b) => b.section.length_m - a.section.length_m)[0];
  if (!first) return null;
  const end = offeredEnd(first.section, null);
  let best: { pick: HorsePick; gap: number } | null = null;
  for (const { route, section } of all) {
    if (route.id === first.route.id && section.number === first.section.number) continue;
    if (section.length_m < 300) continue;
    const gap = metres(end, offeredStart(section, end));
    if (gap > 100 && gap < 3000 && (!best || gap < best.gap))
      best = { pick: { routeId: route.id, section: section.number }, gap };
  }
  if (!best) return null;
  return { first: { routeId: first.route.id, section: first.section.number }, gap: best.pick };
}

/** Two routes along the saved ride's own line: two sections end to end, and one a short gap further on. */
function demoAnswer(line: LatLng[]): HorseAnswer {
  const [lat, lng] = line[Math.floor(line.length / 2)];
  const osmUrl = `https://www.openstreetmap.org/#map=14/${lat.toFixed(4)}/${lng.toFixed(4)}`;
  const section = (
    number: number,
    from: number,
    to: number,
    access: [string, number][],
    signposted: HorseSection['signposted']
  ): HorseSection => {
    const geometry = cut(line, from, to);
    const length = lengthOf(geometry);
    return {
      number,
      geometry,
      length_m: Math.round(length),
      access: access.map(([value, share]) => ({ value, length_m: Math.round(length * share) })),
      signposted,
    };
  };
  return {
    routes: [
      {
        id: 'relation/1',
        name: 'Seiser Alm bridle path',
        ref: null,
        osmUrl,
        continues: true,
        sections: [
          section(
            1,
            0,
            0.38,
            [
              ['designated', 0.8],
              ['unknown', 0.2],
            ],
            'with'
          ),
          section(2, 0.38, 0.62, [['yes', 1]], null),
        ],
      },
      {
        id: 'relation/2',
        name: 'Saltria horse trail',
        ref: null,
        osmUrl,
        continues: false,
        sections: [
          section(
            1,
            0.72,
            1,
            [
              ['permissive', 0.6],
              ['unknown', 0.4],
            ],
            null
          ),
        ],
      },
    ],
    truncated: false,
    source: 'openstreetmap',
    attribution: '© OpenStreetMap contributors',
  };
}

/** The horse routes every guide of the screen gets, worked out once per run. */
export async function horsePlan(api: APIRequestContext): Promise<HorsePlan> {
  const tripId = await tourTripId(api);
  const line = await savedRideLine(api, tripId);
  try {
    const res = await api.get(`/api/trips/${tripId}/tours/horse-routes?bbox=${bboxAround(line, 0.02)}`, {
      timeout: 60_000,
    });
    if (res.ok()) {
      const answer = (await res.json()) as HorseAnswer;
      const picks = answer.routes?.length ? picksOf(answer) : null;
      if (picks) return { answer, ...picks, source: 'live' };
    }
  } catch {
    // Neither TREK Places nor Overpass answered: the demo routes below.
  }
  const answer = demoAnswer(line);
  const picks = picksOf(answer);
  if (!picks) throw new Error(`"${TOUR_NAMES.horse}" is too short to cut two horse routes from`);
  console.warn(
    '[trip-tour-horse] no usable horse routes on the Seiser Alm; the card is given two cut from the saved ride'
  );
  return { answer, ...picks, source: 'demo' };
}

/** Hand the card this answer whatever view it asks for, so the list is the same in every picture. */
export async function serveHorseRoutes(page: Page, plan: HorsePlan): Promise<void> {
  // On the context, not the page: in dev the service worker makes this GET itself,
  // and only the context's routes see what a service worker asks for.
  await page.context().route(/\/api\/trips\/\d+\/tours\/horse-routes/, (route) => route.fulfill({ json: plan.answer }));
}

/** A route's title as the card and the dialog print it. */
export function routeTitle(plan: HorsePlan, routeId: string): string {
  const route = plan.answer.routes.find((r) => r.id === routeId);
  return route?.name ?? route?.ref ?? 'Unnamed horse route';
}

// ── The recorded ride ─────────────────────────────────────────────────────────

/**
 * A ride recorded on a GPS device, as a file to import: the recorded Rasciesa
 * track of the fixtures, named as a ride. Its points, heights and times stay
 * those of the recording.
 */
export async function recordedRideFile(): Promise<string> {
  const source = await tourGpxFixture('rasciesa');
  const file = path.join(path.dirname(source), RECORDED_RIDE.file);
  const gpx = readFileSync(source, 'utf8').split(TOUR_GPX.rasciesa.name).join(RECORDED_RIDE.name);
  writeFileSync(file, gpx);
  return file;
}
