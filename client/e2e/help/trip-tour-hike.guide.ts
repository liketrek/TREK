import { expect, test, type Page } from '@playwright/test';
import { tripTourHikeContext, tripTourHikeGuides } from '../../src/help/contexts/tripTourHike';
import type { HelpGuide } from '../../src/help/types';
import {
  addTripPlaces,
  deleteToursNamed,
  editorRail,
  forgetDraft,
  openDetails,
  openTour,
  openToursTab,
  pickTourType,
  routeSettled,
  SAVED_BY_GUIDES,
  startNewTour,
  toursRail,
} from './fixtures-trip-tour-hike';
import { captureGuide, captureHero, settle, VIEWPORT, type GuideScript } from './guide';
import { ensureToursFixtures, TOUR_NAMES, TOUR_PLACES } from './tour-fixtures';

/**
 * Actions for hikes and runs in the Tours tab, keyed by the ids in
 * `src/help/contexts/tripTourHike.ts`. They run on "Summer in the Dolomites"
 * from `tour-fixtures.ts` (the hut trek, the via ferrata hike and the railway
 * run) and, where a dense web of paths matters, on the Fushimi Inari hike of
 * the seeded Japan trip. The two plan guides save a tour through the UI and
 * delete it again by name in `cleanup`; every other guide changes the open
 * tour in the editor only and never saves, so a fresh page starts from the
 * saved tour again.
 */

const guide = (id: string): HelpGuide => {
  const g = tripTourHikeGuides.find((x) => x.id === id);
  if (!g) throw new Error(`no registered guide "${id}"`);
  return g;
};

// ── Where things are ──────────────────────────────────────────────────────────

const saveButton = (page: Page) => editorRail(page).getByRole('button', { name: 'Save', exact: true });
/** The Add point and Trip places pair under the waypoints, one quiet bar. */
const addRow = (page: Page) =>
  page.getByTestId('tour-planner-add-point').locator('xpath=ancestor::div[contains(@class,"bg-surface-tertiary")][1]');
const waysCard = (page: Page) => page.getByTestId('hike-ways-card');
const waysSwitch = (page: Page) => waysCard(page).getByRole('button', { name: 'Show along the route', exact: true });
const facetButton = (page: Page, name: 'SAC' | 'Surface' | 'Way type') =>
  page.getByRole('group', { name: 'What to show', exact: true }).getByRole('button', { name, exact: true });
/** The first class row of the known ways, the most of the route first. */
const firstKnownRow = (page: Page) => waysCard(page).locator('ul').first().getByRole('button').first();
const waypointRow = (page: Page, n: number) => page.getByTestId('tour-planner-waypoint-row').nth(n);
const openMenu = (page: Page) => page.getByRole('menu');
const ferrataIcons = (page: Page) => page.locator('.trek-ferrata-icon');
const ferrataCard = (page: Page) => page.getByTestId('ferrata-detail-card');

// ── Getting there ─────────────────────────────────────────────────────────────

/** Switch Trail details on and wait until the ways along the line have been read. */
async function showWays(page: Page): Promise<void> {
  if ((await waysSwitch(page).getAttribute('aria-pressed')) !== 'true') await waysSwitch(page).click();
  await expect(page.getByTestId('sac-known').or(page.getByTestId('surface-known'))).toBeVisible({ timeout: 120_000 });
  await settle(page);
}

/** Click Save and wait for the toast that says so. */
async function saveTour(page: Page): Promise<void> {
  await saveButton(page).click();
  await expect(page.getByText('Tour saved', { exact: true }).first()).toBeVisible({ timeout: 60_000 });
  await settle(page);
}

/**
 * The index of the via ferrata Brigata Tridentina's sign among the ones drawn,
 * picked by its card: the Sella group has several ferratas in one view. Only a
 * sign between the two columns counts, as a click on one under a column lands
 * on the column. Falls back to the first sign that is clear of both.
 */
let ferrataIndex = 0;
async function findTridentina(page: Page): Promise<void> {
  const left = await editorRail(page).boundingBox();
  const right = await toursRail(page).boundingBox();
  const minX = (left ? left.x + left.width : 0) + 24;
  const maxX = (right ? right.x : VIEWPORT.width) - 24;
  const count = await ferrataIcons(page).count();
  let fallback = -1;
  for (let i = 0; i < count; i++) {
    const box = await ferrataIcons(page).nth(i).boundingBox();
    if (!box || box.x < minX || box.x + box.width > maxX || box.y < 80 || box.y > VIEWPORT.height - 120) continue;
    if (fallback < 0) fallback = i;
    await ferrataIcons(page).nth(i).click();
    await expect(ferrataCard(page)).toBeVisible();
    const name = (await ferrataCard(page).locator('h3').textContent()) ?? '';
    await ferrataCard(page).getByRole('button', { name: 'Close', exact: true }).click();
    await expect(ferrataCard(page)).toHaveCount(0);
    await page.waitForTimeout(300);
    if (/tridentina/i.test(name)) {
      ferrataIndex = i;
      return;
    }
  }
  if (fallback < 0)
    throw new Error('no via ferrata sign between the columns: the map is not framed on the Sella group');
  ferrataIndex = fallback;
}

// ── The scripts ───────────────────────────────────────────────────────────────

let summerTripId = 0;
let japanTripId = 0;

async function openSummer(page: Page): Promise<void> {
  summerTripId = await openToursTab(page, 'summer');
}

async function openJapan(page: Page): Promise<void> {
  japanTripId = await openToursTab(page, 'japan');
}

/** The stop the compare-ways guide asks from, found by `legWithOtherWays`. */
let waysFrom = 1;

/**
 * The first stop, from the Yotsutsuji crossing on, whose next leg the router
 * offers another way for. What the public router knows changes with its data,
 * so a fixed leg can come back with "no other way" on one day and two on the next.
 */
async function legWithOtherWays(page: Page): Promise<number> {
  const card = page.getByTestId('leg-variants-card');
  const rows = await page.getByTestId('tour-planner-waypoint-row').count();
  const order = [1, ...Array.from({ length: Math.max(0, rows - 1) }, (_, i) => i).filter((i) => i !== 1)];
  for (const i of order) {
    await waypointRow(page, i).hover();
    await waypointRow(page, i).getByRole('button', { name: 'More actions', exact: true }).click();
    const compare = openMenu(page).getByRole('button', { name: 'Compare ways for the next leg', exact: true });
    if (!(await compare.isVisible().catch(() => false))) {
      await page.keyboard.press('Escape');
      continue;
    }
    await compare.click();
    const way = page.getByRole('radio', { name: 'Way A', exact: true });
    const none = card.getByText(/knows no other way|did not answer/);
    await expect(way.or(none)).toBeVisible({ timeout: 120_000 });
    const found = await way.isVisible();
    await card.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(card).toHaveCount(0);
    if (found) return i;
  }
  throw new Error('the router knows no other way for any leg of the Inari hike');
}

const SCRIPTS: Record<string, GuideScript> = {
  'tour-hike-plan': {
    guide: guide('tour-hike-plan'),
    start: openSummer,
    steps: [
      {
        target: (p) => editorRail(p).getByRole('button', { name: 'Plan new tour' }),
        act: startNewTour,
      },
      {
        prepare: async (p) => {
          await p.getByTestId('tour-type-select').click();
          await settle(p);
        },
        target: (p) => p.getByTestId('tour-type-option-hike'),
        act: (p) => pickTourType(p, 'hike'),
      },
      {
        target: (p) => p.locator('#tour-planner-name'),
        act: async (p) => {
          await p.locator('#tour-planner-name').fill(SAVED_BY_GUIDES.hike);
        },
      },
      {
        target: addRow,
        act: async (p) => {
          // Two trip places stand in for two clicks on the map: they land on real spots every run.
          await addTripPlaces(p, TOUR_PLACES.selvaHotel, TOUR_PLACES.firenze);
          await routeSettled(p);
        },
      },
      {
        prepare: openDetails,
        target: (p) => p.locator('#tour-planner-difficulty'),
        act: async (p) => {
          await p.locator('#tour-planner-difficulty').click();
          await p.getByRole('button', { name: /^T3\b/ }).last().click();
          await routeSettled(p);
        },
      },
      {
        target: saveButton,
        act: saveTour,
      },
    ],
    cleanup: async (p) => {
      await deleteToursNamed(p, summerTripId, SAVED_BY_GUIDES.hike);
      await forgetDraft(p, summerTripId);
    },
  },

  'tour-hike-trail-details': {
    guide: guide('tour-hike-trail-details'),
    start: async (p) => {
      await openSummer(p);
      await openTour(p, TOUR_NAMES.hutToHut);
    },
    steps: [
      {
        target: waysSwitch,
        act: showWays,
      },
      {
        target: (p) => p.getByRole('group', { name: 'What to show', exact: true }),
        act: async (p) => {
          await facetButton(p, 'SAC').click();
          await settle(p);
        },
      },
      {
        target: (p) => p.getByTestId('sac-known').locator('xpath=ancestor::div[contains(@class,"flex-wrap")][1]'),
      },
      {
        target: firstKnownRow,
        act: async (p) => {
          await firstKnownRow(p).click();
          await settle(p);
        },
      },
      {
        prepare: async (p) => {
          // Back to the whole route before the next facet, as the step before says.
          await firstKnownRow(p).click();
          await settle(p);
        },
        target: (p) => facetButton(p, 'Surface'),
        act: async (p) => {
          await facetButton(p, 'Surface').click();
          await expect(p.getByTestId('surface-known')).toBeVisible({ timeout: 120_000 });
          await settle(p);
        },
      },
    ],
    cleanup: (p) => forgetDraft(p, summerTripId),
  },

  'tour-hike-round': {
    guide: guide('tour-hike-round'),
    start: async (p) => {
      await openJapan(p);
      await openTour(p, TOUR_NAMES.inariHike);
    },
    steps: [
      {
        target: (p) => p.getByTestId('tour-planner-round-hike'),
        act: async (p) => {
          await p.getByTestId('tour-planner-round-hike').click();
          await expect(p.getByTestId('round-hike-card')).toBeVisible();
          await settle(p);
        },
      },
      {
        target: (p) => p.locator('#round-hike-distance').locator('xpath=ancestor::div[2]'),
        act: async (p) => {
          await p.locator('#round-hike-distance').fill('6');
          await expect(p.getByTestId('round-hike-window')).toBeVisible();
          await settle(p);
        },
      },
      {
        target: (p) => p.getByTestId('round-hike-find'),
        act: async (p) => {
          await p.getByTestId('round-hike-find').click();
          // Many questions to the router, one after the other; the bar goes when the last has come back.
          await expect(p.getByRole('radio', { name: 'Round A', exact: true })).toBeVisible({ timeout: 240_000 });
          await expect(p.getByTestId('round-hike-card').getByRole('progressbar')).toHaveCount(0, { timeout: 240_000 });
          await settle(p);
        },
      },
      {
        target: (p) => p.getByRole('radio', { name: 'Round A', exact: true }),
        act: async (p) => {
          await p.getByRole('radio', { name: 'Round A', exact: true }).click();
          await expect(p.getByTestId('round-hike-apply')).toBeEnabled();
          await settle(p);
        },
      },
      {
        target: (p) => p.getByTestId('round-hike-apply'),
        act: async (p) => {
          await p.getByTestId('round-hike-apply').click();
          await p.getByRole('button', { name: 'Replace', exact: true }).click();
          await expect(p.getByText('Round taken', { exact: true })).toBeVisible({ timeout: 30_000 });
          await routeSettled(p);
        },
      },
    ],
    cleanup: (p) => forgetDraft(p, japanTripId),
  },

  'tour-hike-compare-ways': {
    guide: guide('tour-hike-compare-ways'),
    start: async (p) => {
      await openJapan(p);
      await openTour(p, TOUR_NAMES.inariHike);
      waysFrom = await legWithOtherWays(p);
    },
    steps: [
      {
        // A stop whose next leg the router knows another way for; the Yotsutsuji crossing usually.
        prepare: async (p) => {
          await waypointRow(p, waysFrom).hover();
          await waypointRow(p, waysFrom).getByRole('button', { name: 'More actions', exact: true }).click();
          await expect(openMenu(p)).toBeVisible();
        },
        target: (p) => openMenu(p).getByRole('button', { name: 'Compare ways for the next leg', exact: true }),
        act: async (p) => {
          await openMenu(p).getByRole('button', { name: 'Compare ways for the next leg', exact: true }).click();
          await expect(p.getByTestId('leg-variants-card')).toBeVisible();
          await expect(p.getByRole('radio', { name: 'Way A', exact: true })).toBeVisible({ timeout: 120_000 });
          await expect(p.getByTestId('leg-variants-card').getByText('Looking for other ways')).toHaveCount(0, {
            timeout: 120_000,
          });
          await settle(p);
        },
      },
      {
        target: (p) => p.getByTestId('leg-variants-card'),
      },
      {
        target: (p) => p.getByRole('radio', { name: 'Way A', exact: true }),
        act: async (p) => {
          await p.getByRole('radio', { name: 'Way A', exact: true }).click();
          await expect(p.getByTestId('leg-variants-apply')).toBeEnabled();
          await settle(p);
        },
      },
      {
        target: (p) => p.getByTestId('leg-variants-apply'),
        act: async (p) => {
          await p.getByTestId('leg-variants-apply').click();
          await expect(p.getByText('Way taken', { exact: true })).toBeVisible({ timeout: 60_000 });
          await routeSettled(p);
        },
      },
    ],
    cleanup: (p) => forgetDraft(p, japanTripId),
  },

  'tour-ferrata-add': {
    guide: guide('tour-ferrata-add'),
    start: async (p) => {
      await openSummer(p);
      // Opening the ferrata hike frames the map on the Sella group, and a new tour without
      // points keeps that view. Not through Back to Tours: the neutral rail frames the whole
      // trip again, too far out for the via ferrata signs. Add tour on the right goes straight
      // from the open tour to a new one.
      await openTour(p, TOUR_NAMES.ferrata);
      await toursRail(p).getByRole('button', { name: 'Add tour', exact: true }).click();
      await p.getByRole('button', { name: 'Plan new tour', exact: true }).last().click();
      await expect(editorRail(p).getByRole('heading', { name: 'New tour', exact: true })).toBeVisible({
        timeout: 15_000,
      });
      await pickTourType(p, 'hike');
      await settle(p);
    },
    steps: [
      {
        target: (p) => p.getByRole('button', { name: 'Via ferratas', exact: true }),
        act: async (p) => {
          await p.getByRole('button', { name: 'Via ferratas', exact: true }).click();
          await expect(p.getByTestId('ferrata-count-badge')).toBeVisible({ timeout: 60_000 });
          await expect(p.getByTestId('ferrata-count-spinner')).toHaveCount(0, { timeout: 90_000 });
          await expect(ferrataIcons(p).first()).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
      {
        prepare: findTridentina,
        target: (p) => ferrataIcons(p).nth(ferrataIndex),
        act: async (p) => {
          await ferrataIcons(p).nth(ferrataIndex).click();
          await expect(ferrataCard(p)).toBeVisible();
          await settle(p);
        },
      },
      {
        target: (p) => p.getByTestId('ferrata-adopt'),
        act: async (p) => {
          await p.getByTestId('ferrata-adopt').click();
          await expect(p.getByTestId('tour-planner-waypoint-row')).toHaveCount(2, { timeout: 15_000 });
          await routeSettled(p);
        },
      },
      {
        target: (p) => p.getByTestId('tour-planner-ferrata-leg').first(),
      },
      {
        target: (p) => p.getByTestId('tour-ferrata-crossings'),
      },
    ],
    cleanup: (p) => forgetDraft(p, summerTripId),
  },

  'tour-run-plan': {
    guide: guide('tour-run-plan'),
    start: openSummer,
    steps: [
      {
        prepare: async (p) => {
          await startNewTour(p);
          await p.getByTestId('tour-type-select').click();
          await settle(p);
        },
        target: (p) => p.getByTestId('tour-type-option-run'),
        act: (p) => pickTourType(p, 'run'),
      },
      {
        target: (p) => p.getByTestId('tour-run-profile'),
        act: async (p) => {
          await p.getByTestId('tour-run-profile').getByRole('button', { name: 'Trail running', exact: true }).click();
          await settle(p);
        },
      },
      {
        target: (p) => p.locator('#tour-planner-run-pace'),
        act: async (p) => {
          await p.locator('#tour-planner-run-pace').fill('7:30');
          await p.locator('#tour-planner-run-pace').press('Enter');
        },
      },
      {
        prepare: async (p) => {
          await addTripPlaces(p, TOUR_PLACES.selvaHotel, TOUR_PLACES.firenze);
          await routeSettled(p);
          await expect(p.getByTestId('tour-run-time-sum')).toBeVisible({ timeout: 30_000 });
        },
        target: (p) => p.getByTestId('tour-run-time-sum'),
      },
      {
        prepare: async (p) => {
          await p.locator('#tour-planner-name').fill(SAVED_BY_GUIDES.run);
        },
        target: saveButton,
        act: saveTour,
      },
    ],
    cleanup: async (p) => {
      await deleteToursNamed(p, summerTripId, SAVED_BY_GUIDES.run);
      await forgetDraft(p, summerTripId);
    },
  },

  'tour-run-ways': {
    guide: guide('tour-run-ways'),
    start: async (p) => {
      await openSummer(p);
      await openTour(p, TOUR_NAMES.run);
    },
    steps: [
      {
        target: waysSwitch,
        act: showWays,
      },
      {
        // The card's head: the unpaved share and the hardest graded path, read once the ways are in.
        target: (p) => p.getByRole('region', { name: 'Trail details', exact: true }).locator('> div').first(),
      },
      {
        prepare: async (p) => {
          await facetButton(p, 'Surface').click();
          await expect(p.getByTestId('surface-known')).toBeVisible({ timeout: 120_000 });
          await settle(p);
        },
        target: firstKnownRow,
        act: async (p) => {
          await firstKnownRow(p).click();
          await settle(p);
        },
      },
    ],
    cleanup: (p) => forgetDraft(p, summerTripId),
  },
};

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }, testInfo) => {
  // A cold run fetches every route of the Tours demo trips once (minutes), later runs read the cache.
  testInfo.setTimeout(600_000);
  await ensureToursFixtures(request);
});

test('every registered hike and run guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripTourHikeContext.guides].sort());
});

test('hero: trip-tour-hike', async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await captureHero(page, tripTourHikeContext.id, async (p) => {
    await openSummer(p);
    await openTour(p, TOUR_NAMES.ferrata);
  });
});

for (const id of tripTourHikeContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize(VIEWPORT);
    await captureGuide(page, SCRIPTS[id]);
  });
}
