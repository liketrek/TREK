import { expect, type Page } from '@playwright/test';
import { clearNotices } from '../screenshots/shot';
import { dismissReleaseNotice, settle } from './guide';
import { JAPAN_TRIP, TOUR_TRIP } from './tour-fixtures';
import { tripReady } from './trip-shared';

/**
 * What the hike and run help pictures need besides `tour-fixtures.ts`: a way
 * into the Tours tab of the Dolomites or the Japan trip, a tour opened in the
 * editor, a route that has finished planning, and the tours a guide saved
 * taken away again. Nothing here creates data of its own; the two tours the
 * plan guides save through the UI are deleted by name in their cleanup.
 */

/** The two tours the plan guides save, by the names they type. */
export const SAVED_BY_GUIDES = {
  hike: 'Up to Rifugio Firenze',
  run: 'Trail run to Rifugio Firenze',
} as const;

async function tripIdOf(page: Page, title: string): Promise<number> {
  const res = await page.request.get('/api/trips');
  const { trips = [] } = (await res.json()) as { trips?: { id: number; title: string }[] };
  const found = trips.find((t) => t.title === title);
  if (!found) throw new Error(`no trip "${title}": call ensureToursFixtures in beforeAll`);
  return found.id;
}

/**
 * The Tours tab of a trip, with its list on the right loaded. `tripReady`
 * waits for the Trip settings pill, which every tab of the v5 header carries.
 * The account's draft of the trip goes first: the planner restores it on load,
 * so a draft the guide before left behind (its page can still write one in the
 * second after its cleanup) would open the editor on that tour instead of the
 * neutral rail, and a click on a tour row would then ask to discard it.
 */
export async function openToursTab(page: Page, trip: 'summer' | 'japan' = 'summer'): Promise<number> {
  const id = await tripIdOf(page, trip === 'japan' ? JAPAN_TRIP : TOUR_TRIP);
  await page.request.delete(`/api/trips/${id}/tour-draft`).catch(() => undefined);
  await page.goto(`/trips/${id}?tab=tour-planner`);
  await clearNotices(page);
  await dismissReleaseNotice(page);
  await tripReady(page);
  await expect(toursRail(page).getByRole('option').first()).toBeVisible({ timeout: 30_000 });
  await settle(page);
  await page.waitForTimeout(1200);
  return id;
}

/** The left column: the neutral rail and the editor both carry this name. */
export const editorRail = (page: Page) => page.getByRole('region', { name: 'Plan a tour', exact: true });
/** The right column, Tours of this trip. */
export const toursRail = (page: Page) => page.getByRole('complementary', { name: 'Tours of this trip', exact: true });
/** A tour's row in Tours of this trip. */
export const tourRow = (page: Page, name: string) =>
  toursRail(page)
    .getByRole('option', { name: new RegExp(`^${name}`) })
    .first();

/** Words the status dot beside the editor's title carries while it is still working. */
const BUSY = /^(Calculating[a-z ]* route|Loading elevation|Waiting to calculate|Saving)/;

/** The route of the open tour has been planned and its heights are in. */
export async function routeSettled(page: Page, timeout = 120_000): Promise<void> {
  await expect(page.getByTestId('tour-planner-overview')).toBeVisible({ timeout });
  await expect(page.getByTestId('tour-planner-status').getByLabel(BUSY)).toHaveCount(0, { timeout });
  await settle(page);
}

/** Open a saved tour from the right column in the editor and wait for its route. */
export async function openTour(page: Page, name: string): Promise<void> {
  await tourRow(page, name).click();
  await expect(editorRail(page).getByRole('heading', { name: 'Edit tour', exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator('#tour-planner-name')).toHaveValue(name, { timeout: 30_000 });
  await routeSettled(page);
  await page.waitForTimeout(800);
  await settle(page);
}

/** Plan new tour from the neutral rail, and the editor that opens. */
export async function startNewTour(page: Page): Promise<void> {
  await editorRail(page).getByRole('button', { name: 'Plan new tour' }).click();
  await expect(editorRail(page).getByRole('heading', { name: 'New tour', exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await settle(page);
}

/** Pick a tour type in the Tour type field. */
export async function pickTourType(page: Page, type: 'hike' | 'run'): Promise<void> {
  const option = page.getByTestId(`tour-type-option-${type}`);
  if (!(await option.isVisible().catch(() => false))) await page.getByTestId('tour-type-select').click();
  await option.click();
  await settle(page);
}

/** Add stops from the trip's own places, through Trip places under the waypoints. */
export async function addTripPlaces(page: Page, ...names: string[]): Promise<void> {
  const picker = page.getByTestId('trip-place-picker');
  if (!(await picker.isVisible().catch(() => false))) await page.getByTestId('tour-planner-add-place').click();
  await expect(picker).toBeVisible();
  const search = picker.getByPlaceholder("Search the trip's places");
  for (const name of names) {
    await search.fill(name);
    await picker.getByTestId('trip-place-candidate').filter({ hasText: name }).first().click();
    await page.waitForTimeout(400);
  }
  await search.fill('');
  await picker.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(picker).toHaveCount(0);
}

/** The Details section of the editor, unfolded. */
export async function openDetails(page: Page): Promise<void> {
  const show = editorRail(page).getByRole('button', { name: 'Show details', exact: true });
  if (await show.isVisible().catch(() => false)) await show.click();
  await expect(page.locator('#tour-planner-details')).toBeVisible();
}

/** Delete the tours a guide saved through the UI, so the next guide finds the list of the seed. */
export async function deleteToursNamed(page: Page, tripId: number, ...names: string[]): Promise<void> {
  const res = await page.request.get(`/api/trips/${tripId}/tours`);
  if (!res.ok()) return;
  const { tours = [] } = (await res.json()) as { tours?: { place_id: number; name: string }[] };
  for (const tour of tours.filter((t) => names.includes(t.name))) {
    await page.request.delete(`/api/trips/${tripId}/places/${tour.place_id}`);
  }
}

/**
 * Forget the editor's unsaved draft of the trip: on the account, where the
 * planner keeps it now and restores it on the next page, and the copy older
 * builds left in this browser, so a reload starts clean.
 */
export async function forgetDraft(page: Page, tripId: number): Promise<void> {
  await page.request.delete(`/api/trips/${tripId}/tour-draft`).catch(() => undefined);
  await page
    .evaluate((id) => {
      try {
        localStorage.removeItem(`tour-draft-${id}`);
      } catch {
        // Storage blocked: nothing was kept either.
      }
    }, tripId)
    .catch(() => undefined);
}
