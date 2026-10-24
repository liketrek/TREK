import { expect, test, type Locator, type Page } from '@playwright/test';
import { tripTourBikeContext, tripTourBikeGuides } from '../../src/help/contexts/tripTourBike';
import type { HelpGuide } from '../../src/help/types';
import { captureGuide, captureHero, settle, VIEWPORT, type GuideScript } from './guide';
import { ensureToursFixtures, openTourTrip, TOUR_NAMES, TOUR_PLACES, TOUR_TRIP } from './tour-fixtures';

/**
 * Actions for bike tours on the Tours tab, keyed by the ids in
 * `src/help/contexts/tripTourBike.ts`. They run on "Summer in the Dolomites"
 * (`ensureToursFixtures`): the road bike loop over the four passes and the
 * MTB loop over Monte Pana, both saved tours that are only opened here and
 * left as they were. The one guide that saves a tour of its own deletes it
 * again in `cleanup`.
 *
 * Every route in the editor is planned in the browser against the public
 * Valhalla, and the Surface and ways card asks the same server how the route
 * runs, so these pictures need the network; the MTB trail grades come from
 * the server's trail-grade endpoint (TREK Places, else Overpass).
 */

const guide = (id: string): HelpGuide => {
  const g = tripTourBikeGuides.find((x) => x.id === id);
  if (!g) throw new Error(`no registered guide "${id}"`);
  return g;
};

/** The tour the profile guide plans and saves, and deletes again afterwards. */
const NEW_TOUR = 'Selva to Bolzano by bike';

// ── Where things are ──────────────────────────────────────────────────────────

/** The left rail: the neutral head with Plan new tour, or the editor. Both are labelled "Plan a tour". */
const editorRail = (page: Page) => page.getByRole('region', { name: 'Plan a tour' });
/** The right rail, "Tours of this trip". */
const toursRail = (page: Page) => page.getByRole('complementary', { name: 'Tours of this trip' });
const tourRow = (page: Page, name: string) => toursRail(page).getByRole('option', { name });
const profileField = (page: Page) => editorRail(page).getByRole('group', { name: 'Profile' });
const waysCard = (page: Page) => page.getByRole('region', { name: 'Surface and ways' });
const summaryCard = (page: Page) => page.getByTestId('tour-planner-overview');
/** A section of the ways card by its eyebrow ("Surface", "Kind of way", "Trail grade (mtb:scale)"). */
const waysSection = (page: Page, label: string) =>
  waysCard(page).getByText(label, { exact: true }).locator('xpath=ancestor::div[1]');

/** The first row whose test id starts with one of the prefixes, in the order given. */
async function firstRow(page: Page, prefixes: string[]): Promise<Locator> {
  for (const prefix of prefixes) {
    const rows = waysCard(page).locator(`[data-testid^="route-ways-row-${prefix}"]`);
    if ((await rows.count()) > 0) return rows.first();
  }
  throw new Error(`no row in the Surface and ways card for ${prefixes.join(', ')}`);
}

/** An unpaved surface row: gravel or natural ground read best, compacted will do. */
const UNPAVED_ROWS = ['surface-gravel', 'surface-ground', 'surface-compacted', 'surface-rough'];
/** A kind of way that is not the road: the forest track is the one an MTB loop has. */
const WAY_ROWS = ['way-track', 'way-path', 'way-cyclePath', 'way-quiet', 'way-'];
/** A graded trail before an ungraded one. */
const GRADE_ROWS = ['trail-s', 'trail-'];

// ── Getting there ─────────────────────────────────────────────────────────────

async function openToursTab(page: Page): Promise<void> {
  await openTourTrip(page, { tab: 'tour-planner' });
  await expect(toursRail(page)).toBeVisible({ timeout: 30_000 });
  await expect(tourRow(page, TOUR_NAMES.roadBike)).toBeVisible({ timeout: 30_000 });
  await settle(page);
}

/**
 * Wait until the route in the editor is planned and its heights are in: the
 * status badges beside the rail's title are gone once nothing is happening.
 */
async function waitForRoute(page: Page): Promise<void> {
  await expect(summaryCard(page)).toBeVisible({ timeout: 120_000 });
  await expect(page.getByTestId('tour-planner-status')).toHaveCount(0, { timeout: 120_000 });
  await settle(page);
}

/** The Surface and ways card once it has read the ways (and, on an MTB tour, the grades). */
async function waitForWays(page: Page): Promise<void> {
  await expect(page.getByTestId('bike-ways-card')).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText('Reading the ways along the route…')).toHaveCount(0, { timeout: 120_000 });
  await expect(page.getByText('Reading the trail grades…')).toHaveCount(0, { timeout: 120_000 });
  await expect(waysSection(page, 'Surface')).toBeVisible({ timeout: 30_000 });
  await settle(page);
}

async function openBikeTour(page: Page, name: string): Promise<void> {
  await tourRow(page, name).click();
  await expect(editorRail(page).getByRole('heading', { name: 'Edit tour' })).toBeVisible({ timeout: 30_000 });
  await waitForRoute(page);
  await waitForWays(page);
}

async function openToursTabWith(page: Page, name: string): Promise<void> {
  await openToursTab(page);
  await openBikeTour(page, name);
}

/** Delete the tour the profile guide saved, wherever the run stopped. */
async function deleteNewTour(page: Page): Promise<void> {
  const trips =
    ((await (await page.request.get('/api/trips')).json()) as { trips?: { id: number; title: string }[] }).trips ?? [];
  const trip = trips.find((t) => t.title === TOUR_TRIP);
  if (!trip) return;
  const { tours = [] } = (await (await page.request.get(`/api/trips/${trip.id}/tours`)).json()) as {
    tours?: { place_id: number; name: string }[];
  };
  for (const tour of tours.filter((t) => t.name === NEW_TOUR)) {
    await page.request.delete(`/api/trips/${trip.id}/places/${tour.place_id}`);
  }
}

// ── The scripts ───────────────────────────────────────────────────────────────

const SCRIPTS: Record<string, GuideScript> = {
  'tour-bike-profile': {
    guide: guide('tour-bike-profile'),
    start: async (p) => {
      await deleteNewTour(p);
      await openToursTab(p);
    },
    steps: [
      {
        target: (p) => editorRail(p).getByRole('button', { name: 'Plan new tour', exact: true }),
        act: async (p) => {
          await editorRail(p).getByRole('button', { name: 'Plan new tour', exact: true }).click();
          await expect(editorRail(p).getByRole('heading', { name: 'New tour' })).toBeVisible({ timeout: 15_000 });
          await settle(p);
        },
      },
      {
        target: (p) => p.getByTestId('tour-type-select'),
        act: async (p) => {
          await p.getByTestId('tour-type-select').click();
          await p.getByTestId('tour-type-option-bike').click();
          await expect(profileField(p)).toBeVisible();
          await settle(p);
        },
      },
      {
        target: profileField,
        act: async (p) => {
          await profileField(p).getByRole('button', { name: 'Touring', exact: true }).click();
          await expect(p.getByText('Prefers cycle paths and quiet roads, paved where it can.')).toBeVisible();
          await settle(p);
        },
      },
      {
        target: (p) => p.getByTestId('tour-planner-add-place'),
        act: async (p) => {
          await p.getByTestId('tour-planner-add-place').click();
          for (const name of [TOUR_PLACES.selvaHotel, TOUR_PLACES.bolzanoHotel]) {
            await p.getByTestId('trip-place-candidate').filter({ hasText: name }).first().click();
            await settle(p);
          }
          await p.getByTestId('tour-planner-add-place').click();
          await waitForRoute(p);
        },
      },
      {
        target: summaryCard,
        hover: async (p) => {
          await summaryCard(p).getByRole('button', { name: 'How the riding time is worked out' }).hover();
        },
      },
      {
        prepare: async (p) => {
          await p.locator('#tour-planner-name').fill(NEW_TOUR);
          await settle(p);
        },
        target: (p) => editorRail(p).getByRole('button', { name: 'Save', exact: true }),
        act: async (p) => {
          await editorRail(p).getByRole('button', { name: 'Save', exact: true }).click();
          await expect(p.getByText('Tour saved')).toBeVisible({ timeout: 60_000 });
          await expect(tourRow(p, NEW_TOUR)).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
    ],
    cleanup: deleteNewTour,
  },
  'tour-bike-surfaces': {
    guide: guide('tour-bike-surfaces'),
    start: openToursTab,
    steps: [
      {
        target: (p) => tourRow(p, TOUR_NAMES.mtb),
        act: (p) => openBikeTour(p, TOUR_NAMES.mtb),
      },
      {
        target: (p) =>
          waysCard(p)
            .getByText(/unpaved$/)
            .first(),
      },
      {
        target: (p) => waysSection(p, 'Surface'),
        act: async (p) => {
          await (await firstRow(p, UNPAVED_ROWS)).click();
          await settle(p);
        },
      },
      {
        target: (p) => waysSection(p, 'Kind of way'),
        act: async (p) => {
          await (await firstRow(p, WAY_ROWS)).click();
          await settle(p);
        },
      },
    ],
  },
  'tour-bike-mtb-grades': {
    guide: guide('tour-bike-mtb-grades'),
    start: (p) => openToursTabWith(p, TOUR_NAMES.mtb),
    steps: [
      {
        target: profileField,
        hover: async (p) => {
          await profileField(p).getByRole('button', { name: 'MTB', exact: true }).hover();
        },
      },
      {
        target: (p) => waysSection(p, 'Trail grade (mtb:scale)'),
      },
      {
        target: (p) => waysSection(p, 'Trail grade (mtb:scale)').getByRole('list'),
        act: async (p) => {
          await (await firstRow(p, GRADE_ROWS)).click();
          await settle(p);
        },
      },
    ],
  },
};

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  await ensureToursFixtures(request);
});

test('every registered bike tour guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripTourBikeContext.guides].sort());
});

test('hero: trip-tour-bike', async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await captureHero(page, tripTourBikeContext.id, (p) => openToursTabWith(p, TOUR_NAMES.roadBike));
});

for (const id of tripTourBikeContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    test.setTimeout(8 * 60_000);
    await page.setViewportSize(VIEWPORT);
    await captureGuide(page, SCRIPTS[id]);
  });
}
