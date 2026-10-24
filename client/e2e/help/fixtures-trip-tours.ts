import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { clearNotices } from '../screenshots/shot';
import { dismissReleaseNotice, settle } from './guide';
import { TOUR_TRIP } from './tour-fixtures';
import { closeDayDetails, selectDay, tripReady } from './trip-shared';

/**
 * What the Plan-tab tour pictures need beyond `ensureToursFixtures`: the way
 * into the Dolomites trip with the right column in Tours mode, a timed stop
 * after the horse ride for the overrun line, and the writes the guides take
 * back in their `cleanup`. Not a `.guide.ts`, so importing it registers no tests.
 */

type Api = APIRequestContext;

interface AssignmentRow {
  id: number;
  place_id: number;
  assignment_time?: string | null;
  place_time?: string | null;
}

/** The timed stop after the horse ride on day 2, made by the times guide and removed again. */
export const LUNCH = {
  name: 'Lunch at Gostner Schwaige',
  lat: 46.5546,
  lng: 11.6347,
  address: 'Compatsch, Seiser Alm',
  time: '12:30',
};

async function body<T>(
  res: { ok(): boolean; status(): number; text(): Promise<string>; json(): Promise<unknown> },
  what: string
): Promise<T> {
  if (!res.ok()) throw new Error(`${what}: ${res.status()} ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

export async function tripIdOf(api: Api, title = TOUR_TRIP): Promise<number> {
  const { trips } = await body<{ trips: { id: number; title: string }[] }>(await api.get('/api/trips'), 'trips');
  const trip = trips.find((t) => t.title === title);
  if (!trip) throw new Error(`no trip "${title}": ensureToursFixtures has not run`);
  return trip.id;
}

/** A tour's place id by its name, or null when it is not in the trip. */
export async function tourIdOf(api: Api, tripId: number, name: string): Promise<number | null> {
  const { tours } = await body<{ tours: { place_id: number; name: string }[] }>(
    await api.get(`/api/trips/${tripId}/tours`),
    'tours'
  );
  return tours.find((t) => t.name === name)?.place_id ?? null;
}

export async function assignmentsOf(api: Api, tripId: number, dayId: number): Promise<AssignmentRow[]> {
  return (
    await body<{ assignments: AssignmentRow[] }>(
      await api.get(`/api/trips/${tripId}/days/${dayId}/assignments`),
      'assignments'
    )
  ).assignments;
}

/** Take a place off every day it is on. */
export async function offAllDays(api: Api, tripId: number, dayIds: number[], placeId: number): Promise<void> {
  for (const dayId of dayIds) {
    for (const a of await assignmentsOf(api, tripId, dayId)) {
      if (a.place_id === placeId) await api.delete(`/api/trips/${tripId}/days/${dayId}/assignments/${a.id}`);
    }
  }
}

/** Put a tour back on a day with its start time, as the fixtures had it. */
export async function backOnDay(
  api: Api,
  tripId: number,
  dayId: number,
  placeId: number,
  time: string | null
): Promise<void> {
  let row = (await assignmentsOf(api, tripId, dayId)).find((a) => a.place_id === placeId);
  if (!row) {
    await body(
      await api.post(`/api/trips/${tripId}/days/${dayId}/assignments`, { data: { place_id: placeId } }),
      'put back on its day'
    );
    row = (await assignmentsOf(api, tripId, dayId)).find((a) => a.place_id === placeId);
  }
  if (row)
    await api.put(`/api/trips/${tripId}/assignments/${row.id}/time`, { data: { place_time: time, end_time: null } });
}

/** Give a tour's day entry its start again (and no end), as the fixtures had it. */
export async function resetTime(api: Api, tripId: number, dayId: number, placeId: number, time: string): Promise<void> {
  const row = (await assignmentsOf(api, tripId, dayId)).find((a) => a.place_id === placeId);
  if (row)
    await api.put(`/api/trips/${tripId}/assignments/${row.id}/time`, { data: { place_time: time, end_time: null } });
}

/** The lunch stop on `dayId`, at the end of the day and timed, made once. */
export async function ensureLunch(api: Api, tripId: number, dayId: number): Promise<void> {
  const places = await body<{ places?: { id: number; name: string }[] } | { id: number; name: string }[]>(
    await api.get(`/api/trips/${tripId}/places`),
    'places'
  );
  const list = Array.isArray(places) ? places : (places.places ?? []);
  let id = list.find((p) => p.name === LUNCH.name)?.id;
  if (!id) {
    const created = await body<{ place: { id: number } }>(
      await api.post(`/api/trips/${tripId}/places`, {
        data: { name: LUNCH.name, lat: LUNCH.lat, lng: LUNCH.lng, address: LUNCH.address },
      }),
      'create the lunch stop'
    );
    id = created.place.id;
  }
  await backOnDay(api, tripId, dayId, id, LUNCH.time);
}

export async function removeByName(api: Api, tripId: number, name: string): Promise<void> {
  const places = await body<{ places?: { id: number; name: string }[] } | { id: number; name: string }[]>(
    await api.get(`/api/trips/${tripId}/places`),
    'places'
  );
  const list = Array.isArray(places) ? places : (places.places ?? []);
  for (const place of list.filter((p) => p.name === name)) await api.delete(`/api/trips/${tripId}/places/${place.id}`);
}

/** Forget the tours hidden on the map; the switch is kept in this browser only. */
export async function clearHiddenTours(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith('trek:hidden-tours:')) window.localStorage.removeItem(key);
      }
    } catch {
      // No storage, nothing hidden.
    }
  });
}

const rawKey = (page: Page) =>
  page.getByText(/^(common|dayplan|planner|places|trip|day|tours|packing|inspector)\.[A-Za-z0-9.]+$/);

/** The Places | Tours switch at the top of the right column. */
export const modeSwitch = (page: Page) => page.getByRole('tablist', { name: 'Add view' });
export const modeTab = (page: Page, name: 'Places' | 'Tours') =>
  modeSwitch(page).getByRole('tab', { name, exact: true });

/**
 * Open the Dolomites trip on the Plan tab the way `openTrip` opens the Japan
 * one: notices cleared, waiting for the page and its texts, day 1 selected and
 * its details panel closed again. With `tours`, the right column is switched
 * to Tours and the list has loaded.
 */
export async function openToursPlan(page: Page, opts: { tours?: boolean } = {}): Promise<number> {
  const tripId = await tripIdOf(page.request);
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
  await selectDay(page, 1);
  await closeDayDetails(page);
  if (opts.tours) {
    await modeTab(page, 'Tours').click();
    await expect(modeTab(page, 'Tours')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('listbox', { name: 'Tours', exact: true }).getByRole('option').first()).toBeVisible({
      timeout: 30_000,
    });
    await settle(page);
  }
  // The map tiles land after the page says it is idle.
  await page.waitForTimeout(1200);
  return tripId;
}
