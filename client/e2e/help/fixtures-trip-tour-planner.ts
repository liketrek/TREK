import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { clearNotices } from '../screenshots/shot';
import { dismissReleaseNotice, nudgeClock, settle } from './guide';
import { TOUR_NAMES, TOUR_PLACES, TOUR_TRIP } from './tour-fixtures';
import { tripReady } from './trip-shared';

/**
 * What the Tours-tab planner pictures need beyond `ensureToursFixtures`: a
 * plain day hike to edit, the spots on real paths a new tour is drawn
 * through, the way into the Tours tab, and the projection from a spot on the
 * earth to a pixel of the map. Not a `.guide.ts`, so importing it registers
 * no tests.
 *
 * Everything is cut from the line of the Puez-Odle hut trek, which the tour
 * fixtures routed along real paths: the spare hike is its last stretch, from
 * the Rifugio Firenze down to the Col Raiser gondola, and the points a guide
 * clicks onto the map lie on the same line, so the router always finds a way
 * between them and no picture shows a point it cannot reach.
 */

type Api = APIRequestContext;
type LatLng = [number, number];
type LatLngEle = [number, number, number];

/** The tours this screen makes and takes away again. */
export const PLANNER_TOURS = {
  /** A plain four-stop day hike, on no day; the editing guides open it and never keep their changes. */
  spare: 'Rifugio Firenze to Col Raiser',
  /** A copy of the spare that the delete guide deletes. */
  old: 'Rifugio Firenze to Col Raiser (old plan)',
  /** The tour the save guide draws and saves. */
  drawn: 'Cisles meadow walk',
} as const;

export const SPARE_DESCRIPTION = 'From the hut across the Cisles meadows and down to the Col Raiser gondola.';
/** What the description reads after the "someone else saved it" write of the conflict guide. */
export const REMOTE_DESCRIPTION = 'Mira: we take the gondola down, the last stretch is closed this week.';
/** The query the drawing guide types into the map search; the hut is where its points lie. */
export const SEARCH_QUERY = 'Rifugio Firenze';

async function body<T>(
  res: { ok(): boolean; status(): number; text(): Promise<string>; json(): Promise<unknown> },
  what: string
): Promise<T> {
  if (!res.ok()) throw new Error(`${what}: ${res.status()} ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

export async function tripIdOf(api: Api): Promise<number> {
  const { trips } = await body<{ trips: { id: number; title: string }[] }>(await api.get('/api/trips'), 'trips');
  const trip = trips.find((t) => t.title === TOUR_TRIP);
  if (!trip) throw new Error(`no trip "${TOUR_TRIP}": ensureToursFixtures has not run`);
  return trip.id;
}

interface PlaceRow {
  id: number;
  name: string;
  lat?: number | null;
  lng?: number | null;
  route_geometry?: unknown;
}

async function placesOf(api: Api, tripId: number): Promise<PlaceRow[]> {
  const res = await body<{ places?: PlaceRow[] } | PlaceRow[]>(await api.get(`/api/trips/${tripId}/places`), 'places');
  return Array.isArray(res) ? res : (res.places ?? []);
}

export async function tourIdOf(api: Api, tripId: number, name: string): Promise<number | null> {
  const { tours } = await body<{ tours: { place_id: number; name: string }[] }>(
    await api.get(`/api/trips/${tripId}/tours`),
    'tours'
  );
  return tours.find((t) => t.name === name)?.place_id ?? null;
}

export async function removeTour(api: Api, tripId: number, name: string): Promise<void> {
  for (;;) {
    const id = await tourIdOf(api, tripId, name);
    if (!id) return;
    const res = await api.delete(`/api/trips/${tripId}/places/${id}`);
    if (!res.ok()) throw new Error(`delete "${name}": ${res.status()}`);
  }
}

// ── The line everything is cut from ───────────────────────────────────────────

function metres(a: readonly number[], b: readonly number[]): number {
  const rad = Math.PI / 180;
  const x = (b[1] - a[1]) * rad * Math.cos(((a[0] + b[0]) / 2) * rad);
  const y = (b[0] - a[0]) * rad;
  return Math.hypot(x, y) * 6_371_000;
}

/** The hut trek's line, the index where it passes the Rifugio Firenze, and the distance along it at every point. */
export interface HutLine {
  line: LatLngEle[];
  hut: number;
  along: number[];
}

export async function hutLine(api: Api, tripId: number): Promise<HutLine> {
  const places = await placesOf(api, tripId);
  const trek = places.find((p) => p.name === TOUR_NAMES.hutToHut);
  const hutPlace = places.find((p) => p.name === TOUR_PLACES.firenze);
  const raw = trek?.route_geometry;
  const line = (typeof raw === 'string' ? JSON.parse(raw) : (raw ?? [])) as LatLngEle[];
  if (!trek || line.length < 10)
    throw new Error(`"${TOUR_NAMES.hutToHut}" has no route line: did ensureToursFixtures make it?`);
  if (hutPlace?.lat == null || hutPlace.lng == null) throw new Error(`no place "${TOUR_PLACES.firenze}" with a spot`);
  const spot = [hutPlace.lat, hutPlace.lng];
  let hut = 0;
  line.forEach((point, i) => {
    if (metres(point, spot) < metres(line[hut], spot)) hut = i;
  });
  const along = [0];
  for (let i = 1; i < line.length; i++) along.push(along[i - 1] + metres(line[i - 1], line[i]));
  return { line, hut, along };
}

/** The index of the point `offset` metres along the line from the hut (negative: before it), kept on the line. */
function indexAt(geo: HutLine, offset: number): number {
  const wanted = geo.along[geo.hut] + offset;
  let best = 0;
  geo.along.forEach((d, i) => {
    if (Math.abs(d - wanted) < Math.abs(geo.along[best] - wanted)) best = i;
  });
  return best;
}

/** The spot `offset` metres along the hut trek from the Rifugio Firenze, on its path. */
export function spotAt(geo: HutLine, offset: number): LatLng {
  const p = geo.line[indexAt(geo, offset)];
  return [p[0], p[1]];
}

/** Where the drawing guide clicks: down the path to the hut and on past it. */
export const DRAWN_OFFSETS = [-420, -120, 240, 560];
/** Where the shaping guide pulls its point: back up the approach to the hut. */
export const SHAPING_OFFSET = -320;

/** The spare hike: the hut trek's last stretch, cut at four stops, with its own heights. */
export function spareBody(geo: HutLine, description = SPARE_DESCRIPTION): Record<string, unknown> {
  const route = geo.line.slice(geo.hut);
  const length = geo.along[geo.along.length - 1] - geo.along[geo.hut];
  const cuts = [0, Math.round(route.length / 3), Math.round((2 * route.length) / 3), route.length - 1];
  const waypoints = cuts.map((index, i) => ({
    lat: route[index][0],
    lng: route[index][1],
    role: i === 0 ? 'start' : i === cuts.length - 1 ? 'end' : 'via',
    sequence: i,
  }));
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < route.length; i++) {
    const step = route[i][2] - route[i - 1][2];
    if (step > 0) gain += step;
    else loss -= step;
  }
  // DIN 33466, as the planner's own estimate reckons a hike.
  const flat = length / 1000 / 4;
  const vertical = gain / 300 + loss / 500;
  const hours = Math.max(flat, vertical) + Math.min(flat, vertical) / 2;
  return {
    name: PLANNER_TOURS.spare,
    tour_type: 'hike',
    max_hiking_difficulty: 2,
    route_geometry: route,
    waypoints,
    duration_seconds: Math.round(hours * 3600),
    break_additional_minutes: 30,
    description,
  };
}

/**
 * The spare hike, made where it is missing. With `reset` an existing one is
 * written back to how it was made, after a guide saved a change into it.
 */
export async function ensureSpare(api: Api, opts: { reset?: boolean } = {}): Promise<number> {
  const tripId = await tripIdOf(api);
  const geo = await hutLine(api, tripId);
  const existing = await tourIdOf(api, tripId, PLANNER_TOURS.spare);
  if (existing) {
    if (opts.reset)
      await body(
        await api.put(`/api/trips/${tripId}/tours/${existing}`, { data: spareBody(geo) }),
        'reset the spare hike'
      );
    return existing;
  }
  const created = await body<{ tour: { place_id: number } }>(
    await api.post(`/api/trips/${tripId}/tours`, { data: spareBody(geo) }),
    'create the spare hike'
  );
  return created.tour.place_id;
}

/** Someone else saves the spare: the same tour with another description, a revision further on. */
export async function saveSpareElsewhere(api: Api): Promise<void> {
  const tripId = await tripIdOf(api);
  const id = await tourIdOf(api, tripId, PLANNER_TOURS.spare);
  if (!id) throw new Error('no spare hike to save elsewhere');
  const geo = await hutLine(api, tripId);
  await body(
    await api.put(`/api/trips/${tripId}/tours/${id}`, { data: spareBody(geo, REMOTE_DESCRIPTION) }),
    'save the spare elsewhere'
  );
}

/** The copy the delete guide deletes, made where it is missing. */
export async function ensureOldPlan(api: Api): Promise<void> {
  const tripId = await tripIdOf(api);
  if (await tourIdOf(api, tripId, PLANNER_TOURS.old)) return;
  const spare = await ensureSpare(api);
  await body(
    await api.post(`/api/trips/${tripId}/tours/${spare}/copy`, { data: { name: PLANNER_TOURS.old } }),
    'copy the old plan'
  );
}

/** Take a tour off one day, as the fixtures had it before a guide put it there. */
export async function offDay(api: Api, tripId: number, dayIndex: number, placeId: number): Promise<void> {
  const { days } = await body<{ days: { id: number; date?: string | null; day_number?: number }[] }>(
    await api.get(`/api/trips/${tripId}/days`),
    'days'
  );
  const sorted = [...days].sort(
    (a, b) => (a.date ?? '').localeCompare(b.date ?? '') || (a.day_number ?? 0) - (b.day_number ?? 0) || a.id - b.id
  );
  const dayId = sorted[dayIndex]?.id;
  if (!dayId) return;
  const { assignments } = await body<{ assignments: { id: number; place_id: number }[] }>(
    await api.get(`/api/trips/${tripId}/days/${dayId}/assignments`),
    'assignments'
  );
  for (const a of assignments.filter((row) => row.place_id === placeId)) {
    await api.delete(`/api/trips/${tripId}/days/${dayId}/assignments/${a.id}`);
  }
}

/**
 * Forget the planner's unsaved draft: on the account, where the planner keeps
 * it now, and the copy older builds left in the browser, and the folds of the
 * rail cards, so the next guide starts from the defaults.
 */
export async function forgetPlannerState(page: Page): Promise<void> {
  const tripId = await tripIdOf(page.request);
  await page.request.delete(`/api/trips/${tripId}/tour-draft`).catch(() => undefined);
  await page
    .evaluate((id) => {
      try {
        for (const key of Object.keys(window.localStorage)) {
          if (
            key === `tour-draft-${id}` ||
            key.startsWith('trek.tours.fold.') ||
            key === 'trek.tours.planner.detailsOpen'
          ) {
            window.localStorage.removeItem(key);
          }
        }
      } catch {
        // No storage, nothing kept.
      }
    }, tripId)
    .catch(() => undefined);
}

// ── Where things are ──────────────────────────────────────────────────────────

/** The right rail, "Tours of this trip", and a tour's row in its list (the option is named after the tour). */
export const toursRail = (page: Page) => page.getByRole('complementary', { name: 'Tours of this trip' });
export const tourRow = (page: Page, name: string) => toursRail(page).getByRole('option', { name, exact: true });
/** The editor rail; its section is named after the planner while a tour is drawn or edited. */
export const editorRail = (page: Page) => page.getByRole('region', { name: 'Plan a tour', exact: true });
export const waypointsCard = (page: Page) => page.getByRole('region', { name: 'Waypoints', exact: true });
export const waypointRows = (page: Page) => page.getByTestId('tour-planner-waypoint-row');
export const summaryCard = (page: Page) => page.getByTestId('tour-planner-overview');
export const layerPill = (page: Page) => page.getByRole('group', { name: 'Map Style' });
export const mapSearch = (page: Page) => page.getByRole('combobox', { name: 'Search place or address' });
/** A numbered pin of the open tour on the map, by its number; a shaping point carries none. */
export const pin = (page: Page, n: number) =>
  page.locator('.tour-planner-waypoint-marker').filter({ hasText: new RegExp(`^${n}$`) });
export const shapingPin = (page: Page) => page.locator('.tour-planner-waypoint-marker').filter({ hasNotText: /\d/ });
/** The one context menu that is open; its entries are plain buttons. */
export const openMenu = (page: Page) => page.getByRole('menu');
export const menuItem = (page: Page, name: string) => openMenu(page).getByRole('button', { name, exact: true });

/** The row's own controls show on hover or once it is selected: select it, then open its menu. */
export async function openRowMenu(page: Page, row: Locator): Promise<void> {
  await row.hover();
  await row.getByRole('button', { name: 'More actions', exact: true }).click();
  await expect(openMenu(page)).toBeVisible();
  await settle(page);
}

// ── Getting there ─────────────────────────────────────────────────────────────

const rawKey = (page: Page) => page.getByText(/^(common|planner|places|trip|tours|map|undo)\.[A-Za-z0-9.]+$/);

/**
 * The Dolomites trip on its Tours tab, as the reader finds it: nothing open in
 * the editor, the trip's tours listed on the right. Waits for the Trip
 * settings pill, as `tripReady` does (Share moved into it in v5).
 */
export async function openPlanner(page: Page): Promise<number> {
  const tripId = await tripIdOf(page.request);
  await forgetPlannerState(page);
  await page.goto(`/trips/${tripId}?tab=tour-planner`);
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
  await expect(page.getByRole('button', { name: 'Plan new tour', exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(tourRow(page, TOUR_NAMES.hutToHut)).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1200);
  return tripId;
}

/**
 * Let the map's camera land. Leaflet times a pan from `+new Date()`, which the
 * pictures pin to one instant, so a pan starts and never gets anywhere; moving
 * the pinned clock on ends it on the next frame. The clock only moves on, so
 * the same instant never comes twice.
 */
export async function landMap(page: Page): Promise<void> {
  await page.waitForTimeout(400);
  await nudgeClock(page);
  await page.waitForTimeout(1200);
  await settle(page);
}

/** The route is planned and its heights are in: the summary is up and the status dot has nothing to say. */
export async function waitRouted(page: Page): Promise<void> {
  await expect(summaryCard(page)).toBeVisible({ timeout: 120_000 });
  await expect(page.getByTestId('tour-planner-status')).toHaveCount(0, { timeout: 120_000 });
  await landMap(page);
}

/** The Topo map, whose raster tiles show the paths and let a spot be found on the screen. */
export async function useTopo(page: Page): Promise<void> {
  const topo = layerPill(page).getByRole('button', { name: 'Topo', exact: true });
  await expect(topo).toBeVisible({ timeout: 15_000 });
  if ((await topo.getAttribute('aria-pressed')) !== 'true') await topo.click();
  await expect(page.locator('img.leaflet-tile[src*="opentopomap"]').first()).toBeAttached({ timeout: 20_000 });
  await settle(page);
}

/** Open a saved tour of the list in the editor and wait for its route, on the Topo map. */
export async function openSaved(page: Page, name: string): Promise<void> {
  const row = tourRow(page, name);
  await expect(row, `no tour "${name}" in the Tours tab`).toBeVisible({ timeout: 30_000 });
  await row.click();
  await expect(page.getByRole('heading', { name: 'Edit tour', exact: true })).toBeVisible({ timeout: 30_000 });
  await waitRouted(page);
  await useTopo(page);
}

/** Close the editor, throwing the unsaved changes away, so the next guide finds the rail as the reader does. */
export async function closeEditor(page: Page): Promise<void> {
  const back = page.getByRole('button', { name: 'Back to Tours', exact: true });
  if (await back.isVisible().catch(() => false)) {
    await back.click();
    const discard = page.getByRole('button', { name: 'Discard changes', exact: true });
    if (await discard.isVisible({ timeout: 2_000 }).catch(() => false)) await discard.click();
  }
  await forgetPlannerState(page);
}

// ── From the earth to the screen ──────────────────────────────────────────────

/**
 * The pixel of a spot on the map. Read off a raster tile: its address names
 * its zoom and its column and row, its box says where it sits, and Web
 * Mercator does the rest. Exact at any zoom and through any pan, and it
 * needs nothing of Leaflet's that the page does not show anyway.
 */
export async function screenOf(page: Page, spot: LatLng): Promise<{ x: number; y: number }> {
  const at = await page.evaluate(([lat, lng]) => {
    for (const img of Array.from(
      document.querySelectorAll('.leaflet-tile-pane img.leaflet-tile')
    ) as HTMLImageElement[]) {
      const m = /\/(\d+)\/(\d+)\/(\d+)(?:@\dx)?\.(?:png|jpe?g|webp)/.exec(img.src);
      const box = img.getBoundingClientRect();
      if (!m || box.width === 0) continue;
      const [z, tx, ty] = [Number(m[1]), Number(m[2]), Number(m[3])];
      const n = 2 ** z;
      const s = Math.sin((lat * Math.PI) / 180);
      const wx = ((lng + 180) / 360) * n;
      const wy = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
      return { x: box.left + (wx - tx) * box.width, y: box.top + (wy - ty) * box.height };
    }
    return null;
  }, spot);
  if (!at) throw new Error('no raster tile on the map to place a spot by: is the Topo map on?');
  // Between the two rails and under the search box, or a click would land on a panel.
  const rails = await page.evaluate(() => {
    const left = document.querySelector('[aria-label="Plan a tour"]')?.getBoundingClientRect();
    const right = document.querySelector('aside[aria-label="Tours of this trip"]')?.getBoundingClientRect();
    return { left: left?.right ?? 0, right: right?.left ?? window.innerWidth };
  });
  if (at.x < rails.left + 24 || at.x > rails.right - 24 || at.y < 120 || at.y > 1000) {
    throw new Error(`spot ${spot.join(', ')} lands at ${Math.round(at.x)}, ${Math.round(at.y)}, outside the open map`);
  }
  return at;
}

/**
 * A pointer movement in even steps with a frame each, for a loop: from where
 * the mouse is to `to`, eased like a hand.
 */
export async function glide(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  frame: () => Promise<void>,
  steps = 10
): Promise<void> {
  for (let i = 1; i <= steps; i++) {
    const k = i / steps;
    const ease = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    await page.mouse.move(from.x + (to.x - from.x) * ease, from.y + (to.y - from.y) * ease, { steps: 2 });
    await frame();
  }
}

/** The centre of an element on the screen. */
export async function centreOf(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('the element has no box');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * A spot on the drawn route, `share` of the way along its widest hit band:
 * the invisible band Leaflet lays along the line to take the click that adds
 * a shaping point.
 */
export async function spotOnRoute(page: Page, share = 0.3): Promise<{ x: number; y: number }> {
  const at = await page.evaluate((k) => {
    const bands = Array.from(document.querySelectorAll('.leaflet-overlay-pane path.cursor-copy')) as SVGPathElement[];
    const band = bands.sort((a, b) => b.getTotalLength() - a.getTotalLength())[0];
    const ctm = band?.getScreenCTM();
    if (!band || !ctm) return null;
    const p = band.getPointAtLength(band.getTotalLength() * k);
    const s = new DOMPoint(p.x, p.y).matrixTransform(ctm);
    return { x: s.x, y: s.y };
  }, share);
  if (!at) throw new Error('no drawn route to click on');
  return at;
}

/** The drawn route's click band, for the ring: the widest one. */
export const routeBand = (page: Page) => page.locator('.leaflet-overlay-pane path.cursor-copy').first();
