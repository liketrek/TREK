import { expect, type Locator, type Page } from '@playwright/test';
import { settle } from './guide';
import { openTourTrip, TOUR_NAMES } from './tour-fixtures';

/**
 * What the Tours-tab map guides share: the locators of the layer pill, the
 * 3D dock and the card that searches along a tour, and the way into the
 * planner with one tour open. Nothing here writes to the server: every guide
 * on this screen only looks, or changes the open draft without saving it,
 * and a draft lives in the browser's storage, which every test starts empty.
 */

/** The tour by its role, for the guides: the hike over the via ferrata is the default, the hut trek has named stops. */
export const MAP_TOUR = TOUR_NAMES.ferrata;
export const ALONG_TOUR = TOUR_NAMES.hutToHut;
export const PADDLE_TOUR = TOUR_NAMES.paddle;
/** The ski week's tour with pistes around it: the Sella Ronda where the piste router planned it, else the winter walk. */
export const SKI_TOURS = [TOUR_NAMES.skiRonda, TOUR_NAMES.winterWalk];

/** The right rail of the Tours tab, and one tour's row in it. */
export const tripTours = (page: Page) => page.getByRole('listbox', { name: 'Tours of this trip' });
export const tourRow = (page: Page, name: string) =>
  tripTours(page).getByRole('option').filter({ hasText: name }).first();

/**
 * The layer pill at the bottom left of the map (`TourMapLayerSwitcher`): a
 * group named after the setting it mirrors, "Map Style". The flat map and the
 * 3D map each render exactly one.
 */
export const layerPill = (page: Page) => page.getByRole('group', { name: 'Map Style' });
/** A base map's segment; its name is its visible word on the flat map, its aria-label in the compact 3D pill. */
export const baseSegment = (page: Page, label: 'Map' | 'Topo' | 'Hiking' | 'Cycling' | 'Satellite') =>
  layerPill(page).getByRole('button', { name: label, exact: true });
export const terrainToggle = (page: Page) => layerPill(page).getByRole('button', { name: '3D', exact: true });
export const pistesToggle = (page: Page) => page.getByTestId('map-overlay-pistes');
export const seamarksToggle = (page: Page) => page.getByTestId('map-overlay-seamarks');
export const pisteKeyButton = (page: Page) => page.getByTestId('piste-key-button');
/** The key's popover, a portal group named like its button. */
export const pisteKeyPanel = (page: Page) => page.getByRole('group', { name: 'Piste key' });

/** The 3D map's own canvas (MapLibre), and the controls in its bottom row. */
export const terrainCanvas = (page: Page) => page.locator('.maplibregl-canvas');
export const playButton = (page: Page) => page.getByRole('button', { name: 'Play flyover', exact: true });
export const pauseButton = (page: Page) => page.getByRole('button', { name: 'Pause', exact: true });
export const restartButton = (page: Page) => page.getByRole('button', { name: 'Start over', exact: true });
export const overviewButton = (page: Page) => page.getByRole('button', { name: 'Overview', exact: true });
export const speedGroup = (page: Page) => page.getByRole('group', { name: 'Speed' });
export const reliefSlider = (page: Page) => page.getByRole('slider', { name: 'Relief' });
export const gradeSwitch = (page: Page) => page.getByRole('button', { name: 'Grade', exact: true });
export const gradeMix = (page: Page) => page.getByRole('button', { name: 'Grade mix', exact: true });
/** The unfolded bands above the grade mix pill (`id="tour-terrain-grades"`). */
export const gradeBands = (page: Page) => page.locator('#tour-terrain-grades');

/** "Along the tour": a RailCard, a section named by its title. */
export const alongCard = (page: Page) => page.getByRole('region', { name: 'Along the tour' });
export const alongCategories = (page: Page) => page.getByTestId('tour-poi-categories');
/** The open category list, a portal group named "What to look for". */
export const alongCategoryList = (page: Page) => page.getByRole('group', { name: 'What to look for' });
export const alongCorridor = (page: Page) =>
  alongCard(page).getByRole('group', { name: 'Within this distance of the route' });
export const alongSearch = (page: Page) => page.getByTestId('tour-poi-search');
export const alongList = (page: Page) => page.getByTestId('tour-poi-list');
/** A place found that is not a stop of the tour yet: its row carries a distance, not the "In the tour" pill. */
export const alongCandidates = (page: Page) =>
  alongList(page)
    .locator('li')
    .filter({ hasNot: page.getByText('In the tour', { exact: true }) });
export const poiCard = (page: Page) => page.getByTestId('tour-poi-card-map');
export const poiSlot = (page: Page) => page.getByTestId('tour-poi-slot');
export const poiAdd = (page: Page) => page.getByTestId('tour-poi-add');
export const poiOutcome = (page: Page) => page.getByTestId('tour-poi-outcome');
export const poiUndo = (page: Page) => page.getByTestId('tour-poi-undo');

/**
 * Open the Tours tab of the Dolomites (or the ski week) and open `name` in the
 * planner: its row is selected and the layer pill shows the maps of its type.
 * A multi-day tour opens whole, as a click on its row does.
 */
export async function openTourInPlanner(page: Page, name: string, trip: 'summer' | 'ski' = 'summer'): Promise<void> {
  await openTourTrip(page, { trip, tab: 'tour-planner' });
  const row = tourRow(page, name);
  await expect(row, `no tour "${name}" in the Tours tab: did ensureToursFixtures make it?`).toBeVisible({
    timeout: 30_000,
  });
  await row.click();
  await expect(row).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 });
  await expect(layerPill(page)).toBeVisible();
  // The saved route is drawn and framed once the planner has it; the summary card says so.
  await expect(page.getByTestId('tour-planner-overview')).toBeVisible({ timeout: 60_000 });
  await settle(page);
}

/** The first of the ski week's tours that is in the trip. */
export async function openSkiTour(page: Page): Promise<string> {
  await openTourTrip(page, { trip: 'ski', tab: 'tour-planner' });
  for (const name of SKI_TOURS) {
    if (await tourRow(page, name).count()) {
      await openTourInPlanner(page, name, 'ski');
      return name;
    }
  }
  throw new Error(`none of ${SKI_TOURS.join(', ')} is in the ski week: did ensureToursFixtures make them?`);
}

/** Switch the open tour to 3D and wait until the landscape is drawn and the dock is there. */
export async function enterTerrain(page: Page): Promise<void> {
  await terrainToggle(page).click();
  await expect(terrainCanvas(page)).toBeVisible({ timeout: 60_000 });
  await expect(overviewButton(page)).toBeVisible({ timeout: 60_000 });
  await settle(page);
}

/** Wait until the corridor has loaded and Play flyover replaces the ring. */
export async function waitForFlyover(page: Page): Promise<void> {
  await expect(playButton(page).or(pauseButton(page))).toBeVisible({ timeout: 120_000 });
}

/** Ask "Along the tour" with what it starts with (the first three kinds, 500 m) and wait for the list. */
export async function searchAlong(page: Page): Promise<void> {
  await alongCard(page).scrollIntoViewIfNeeded();
  await alongSearch(page).click();
  await expect(alongSearch(page)).toHaveText(/Search again/, { timeout: 90_000 });
  await expect(alongList(page), 'the search along the tour found nothing (Overpass or the places index)').toBeVisible();
}

/**
 * The first place found whose card can take it in as a stop: one that is not
 * in the tour already and whose suggested slot is not on a fixed stretch.
 * Tries them in their card, closes the card again and returns the row's index
 * among `alongCandidates`, for `candidateRow`.
 */
export async function pickAddablePlace(page: Page): Promise<number> {
  const rows = alongCandidates(page);
  const count = Math.min(await rows.count(), 8);
  for (let i = 0; i < count; i++) {
    await candidateRow(page, i).click();
    await expect(poiCard(page)).toBeVisible();
    const addable = await poiAdd(page).isEnabled();
    await closeOverlay(page);
    await expect(poiCard(page)).toBeHidden();
    if (addable) return i;
  }
  throw new Error('no place along the tour can be added as a stop');
}

/** The button of the `index`-th place found that is not in the tour yet. */
export const candidateRow = (page: Page, index: number): Locator =>
  alongCandidates(page).nth(index).getByRole('button').first();

/** Close whatever popover or card is open over the map. */
export async function closeOverlay(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}
