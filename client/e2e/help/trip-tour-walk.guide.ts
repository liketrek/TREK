import { expect, test, type Locator, type Page } from '@playwright/test';
import { tripTourWalkContext, tripTourWalkGuides } from '../../src/help/contexts/tripTourWalk';
import type { HelpGuide } from '../../src/help/types';
import { ensureWalkHours, GOOGLE_WALK, resetKyotoVisits, WALK_HOURS } from './fixtures-trip-tour-walk';
import { captureGuide, captureHero, settle, VIEWPORT, type GuideScript } from './guide';
import { ensureToursFixtures, openTourTrip, TOUR_NAMES } from './tour-fixtures';
import { openTrip } from './trip-shared';

/**
 * Actions for the city walk, keyed by the ids in
 * `src/help/contexts/tripTourWalk.ts`. They run on "Summer in the Dolomites"
 * from `ensureToursFixtures`, whose Bolzano old town walk is on day 1 at
 * 15:00 with seven stops (the museum a must, the Dominican Church optional),
 * and on the Higashiyama walk on day 9 of the seeded "Autumn in Japan", the
 * day before the picture day, where its stops are checked off. Nothing a
 * guide does here is saved: every edit stays a draft in the planner and is
 * discarded in `cleanup`, and the marks of the check-off guide are taken
 * back through the API.
 */

const guide = (id: string): HelpGuide => {
  const g = tripTourWalkGuides.find((x) => x.id === id);
  if (!g) throw new Error(`no registered guide "${id}"`);
  return g;
};

const WALK = TOUR_NAMES.cityWalk;
const KYOTO_WALK = TOUR_NAMES.kyotoWalk;
const MUSEUM = WALK_HOURS.stop;

// ── Where things are ──────────────────────────────────────────────────────────

/** A tour's row in Tours of this trip: an option named by the tour. */
const tourRow = (page: Page, name: string) => page.getByRole('option', { name, exact: true });
/** A row of the editor's Waypoints card. */
const waypointRow = (page: Page, name: string) =>
  page.getByTestId('tour-planner-waypoint-row').filter({ hasText: name }).first();
/** The menu a row's More actions opens; only one is open at a time. */
const openMenu = (page: Page) => page.getByRole('menu').last();
/** The station dialog: the shared dialog shell around `station-dialog`. */
const stationDialog = (page: Page) => page.getByRole('dialog').filter({ has: page.getByTestId('station-dialog') });
/** The Google Maps import dialog, by its title. */
const importDialog = (page: Page) => page.getByRole('dialog').filter({ hasText: 'Walk from a Google Maps link' });
/**
 * A stop row of the day plan. Every row of a day card is a div with
 * `role="button"`; a stop, a tour included, is the one whose name opens with
 * the label of the lock on its picture (as in `trip-days.guide.ts`).
 */
const planRow = (page: Page, name: string) =>
  page
    .getByRole('button', { name: /^(Keep position during route optimization|Click to unlock) / })
    .filter({ hasText: name })
    .first();
/** The walk's stops in its detail card, as the section that holds them, its head with the counts included. */
const stationsSection = (page: Page) => page.getByTestId('walk-stations').locator('xpath=ancestor::section[1]');
const stationRow = (page: Page, name: string) => page.getByTestId('walk-station').filter({ hasText: name }).first();

// ── Getting there ─────────────────────────────────────────────────────────────

/**
 * A draft is kept on the account per trip, and one left over from an earlier
 * guide would open in the editor instead of Plan new tour. Older builds kept
 * it in the browser as `tour-draft-<tripId>`. Every page these guides open
 * starts without either.
 */
async function forgetDrafts(page: Page): Promise<void> {
  const res = await page.request.get('/api/trips');
  const { trips = [] } = (await res.json()) as { trips?: { id: number }[] };
  for (const trip of trips) await page.request.delete(`/api/trips/${trip.id}/tour-draft`).catch(() => undefined);
  await page.addInitScript(() => {
    try {
      for (const key of Object.keys(localStorage)) if (key.startsWith('tour-draft-')) localStorage.removeItem(key);
    } catch {
      // Storage blocked: there is no draft to restore either.
    }
  });
}

/** The Tours tab of the Dolomites trip, nothing open in the editor, the trip's tours listed. */
async function openToursTab(page: Page): Promise<void> {
  await forgetDrafts(page);
  await openTourTrip(page, { tab: 'tour-planner' });
  await expect(page.getByRole('button', { name: 'Plan new tour' })).toBeVisible({ timeout: 30_000 });
  await expect(tourRow(page, WALK)).toBeVisible({ timeout: 30_000 });
  await settle(page);
}

/**
 * The Plan tab with day 1 selected. The planner reopens a trip on the tab it
 * was last on in this browser tab (`trip-tab-<id>` in sessionStorage), so
 * after the Tours tab a plain visit lands on Tours again and day 1 has no
 * header to click; the remembered tab is forgotten first.
 */
async function openPlanTab(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      for (const key of Object.keys(sessionStorage)) if (key.startsWith('trip-tab-')) sessionStorage.removeItem(key);
    } catch {
      // Storage blocked: nothing is remembered either, and the trip opens on Plan.
    }
  });
  await openTourTrip(page, { day: 1 });
}

/**
 * The Bolzano walk open in the editor, with its route current: the arrivals
 * under the stops only appear once the route belongs to the stops as they are.
 */
async function openWalk(page: Page): Promise<void> {
  await openToursTab(page);
  await tourRow(page, WALK).click();
  await expect(page.getByTestId('tour-planner-waypoint-row')).toHaveCount(7, { timeout: 30_000 });
  await expect(page.getByTestId('tour-planner-overview')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('walk-station-schedule').first()).toBeVisible({ timeout: 60_000 });
  await settle(page);
}

/** Select a stop of the open walk, so its row actions stay out while the pointer moves. */
async function selectStop(page: Page, name: string): Promise<void> {
  await waypointRow(page, name).getByTestId('tour-planner-waypoint-name').click();
  await expect(waypointRow(page, name).getByRole('button', { name: 'More actions' })).toBeVisible();
  await settle(page);
}

/**
 * Leave the editor without saving: Discard at the foot of the left column,
 * and Discard changes where it asks. A dialog still open over it goes first.
 */
async function discardDraft(page: Page): Promise<void> {
  for (let i = 0; i < 3 && (await page.getByRole('dialog').count()) > 0; i++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  const discard = page.getByRole('button', { name: 'Discard', exact: true });
  if ((await discard.count()) > 0 && (await discard.first().isEnabled())) {
    await discard.first().click();
    const confirm = page.getByRole('button', { name: 'Discard changes', exact: true });
    if (await confirm.isVisible({ timeout: 2_000 }).catch(() => false)) await confirm.click();
  }
  await expect(page.getByRole('button', { name: 'Plan new tour' })).toBeVisible({ timeout: 15_000 });
  await forgetDrafts(page);
}

/** The first place the search found that is not a stop yet, a highlight where there is one. */
async function firstNewPoi(page: Page): Promise<Locator> {
  const rows = page.getByTestId('tour-poi-list').locator('li').filter({ hasNotText: 'In the tour' });
  const starred = rows.filter({ has: page.getByTestId('tour-poi-highlight') });
  return ((await starred.count()) > 0 ? starred : rows).first().getByRole('button');
}

const only = (target: (p: Page) => Locator) => ({ target });

const SCRIPTS: Record<string, GuideScript> = {
  'tour-walk-plan': {
    guide: guide('tour-walk-plan'),
    start: openToursTab,
    steps: [
      {
        prepare: async (p) => {
          await p.getByRole('button', { name: 'Plan new tour' }).first().click();
          await expect(p.getByTestId('tour-type-select')).toBeVisible({ timeout: 15_000 });
          await p.getByTestId('tour-type-select').click();
          await expect(p.getByTestId('tour-type-option-walk')).toBeVisible();
          await settle(p);
        },
        target: (p) => p.getByRole('group', { name: 'Tour type' }),
        hover: async (p) => {
          await p.getByTestId('tour-type-option-walk').hover();
        },
        act: async (p) => {
          await p.getByTestId('tour-type-option-walk').click();
          await expect(p.getByTestId('tour-type-select')).toContainText('City / sightseeing walk');
          await settle(p);
        },
      },
      {
        // The two ways to add a stop, side by side under the empty Waypoints card.
        target: (p) => p.getByTestId('tour-planner-add-place').locator('xpath=..'),
        act: async (p) => {
          // Drawing seven stops by clicking the map is no picture of its own; the
          // rest of the guide works on the walk the fixtures planned that way.
          await discardDraft(p);
          await tourRow(p, WALK).click();
          await expect(p.getByTestId('tour-planner-waypoint-row')).toHaveCount(7, { timeout: 30_000 });
          await expect(p.getByTestId('tour-planner-overview')).toBeVisible({ timeout: 60_000 });
          await settle(p);
        },
      },
      {
        prepare: (p) => selectStop(p, MUSEUM),
        target: (p) => waypointRow(p, MUSEUM).getByRole('button', { name: 'More actions' }),
        act: async (p) => {
          await waypointRow(p, MUSEUM).getByRole('button', { name: 'More actions' }).click();
          await openMenu(p).getByRole('button', { name: 'Edit stop' }).click();
          await expect(stationDialog(p)).toBeVisible();
          await settle(p);
        },
      },
      only((p) => stationDialog(p).getByLabel('Stay in minutes')),
      {
        target: (p) => stationDialog(p).getByRole('group', { name: 'Importance' }),
        act: async (p) => {
          await stationDialog(p).getByTestId('station-save').click();
          await expect(stationDialog(p)).toHaveCount(0);
          await settle(p);
        },
      },
      only((p) => p.getByTestId('tour-planner-overview')),
    ],
    cleanup: discardDraft,
  },
  'tour-walk-sights': {
    guide: guide('tour-walk-sights'),
    start: openWalk,
    steps: [
      {
        target: (p) => p.getByTestId('tour-poi-themes'),
        act: async (p) => {
          await p.getByTestId('tour-poi-theme-culture').click();
          await expect(p.getByTestId('tour-poi-theme-culture')).toHaveAttribute('aria-pressed', 'true');
          await settle(p);
        },
      },
      only((p) => p.getByTestId('tour-poi-categories')),
      {
        target: (p) => p.getByTestId('tour-poi-search'),
        act: async (p) => {
          await p.getByTestId('tour-poi-search').click();
          // TREK's places index first, OpenStreetMap behind it, through the server.
          await expect(p.getByTestId('tour-poi-list')).toBeVisible({ timeout: 90_000 });
          await settle(p);
        },
      },
      {
        prepare: async (p) => {
          await (await firstNewPoi(p)).click();
          await expect(p.getByTestId('tour-poi-overlay')).toBeVisible({ timeout: 15_000 });
          await settle(p);
        },
        target: (p) => p.getByTestId('tour-poi-insert'),
      },
      {
        target: (p) => p.getByTestId('tour-poi-add'),
        act: async (p) => {
          await p.getByTestId('tour-poi-add').click();
          await expect(p.getByTestId('tour-poi-outcome')).toBeVisible({ timeout: 15_000 });
          // The route is planned again with the new stop; the notice then says by how much.
          await expect(p.getByTestId('tour-poi-outcome')).not.toContainText('being planned again', { timeout: 60_000 });
          await settle(p);
        },
      },
    ],
    cleanup: discardDraft,
  },
  'tour-walk-day-times': {
    guide: guide('tour-walk-day-times'),
    // Open, the walk's row in Tours of this trip is selected, so its + stays in sight.
    start: openWalk,
    steps: [
      only((p) => tourRow(p, WALK).getByRole('button', { name: `Add to day: ${WALK}` })),
      {
        prepare: async (p) => {
          await openPlanTab(p);
          await expect(planRow(p, WALK)).toBeVisible({ timeout: 20_000 });
          await settle(p);
        },
        target: (p) => planRow(p, WALK),
        act: openWalk,
      },
      only((p) => p.getByTestId('walk-day-line')),
      only((p) => waypointRow(p, MUSEUM).getByTestId('walk-station-schedule')),
    ],
    cleanup: discardDraft,
  },
  'tour-walk-google-import': {
    guide: guide('tour-walk-google-import'),
    start: openToursTab,
    steps: [
      {
        prepare: async (p) => {
          await p.getByTestId('tour-rail-add').click();
          await expect(p.getByRole('button', { name: 'Import walk from Google Maps' })).toBeVisible();
          await settle(p);
        },
        target: (p) => p.getByRole('button', { name: 'Import walk from Google Maps' }),
        act: async (p) => {
          await p.getByRole('button', { name: 'Import walk from Google Maps' }).click();
          await expect(importDialog(p)).toBeVisible();
          await p.getByTestId('walk-import-url').fill(GOOGLE_WALK.link);
          await settle(p);
        },
      },
      {
        // The field with the link in it and Read the link under it.
        target: (p) => importDialog(p),
        act: async (p) => {
          await p.getByTestId('walk-import-read').click();
          await expect(p.getByTestId('walk-import-preview')).toBeVisible({ timeout: 20_000 });
          await expect(p.getByTestId('walk-import-station')).toHaveCount(GOOGLE_WALK.count);
          await settle(p);
        },
      },
      only((p) => p.getByTestId('walk-import-preview').locator('section').first()),
      {
        target: (p) => p.getByTestId('walk-import-load'),
        act: async (p) => {
          await p.getByTestId('walk-import-load').click();
          await expect(importDialog(p)).toHaveCount(0);
          await expect(p.getByTestId('tour-planner-waypoint-row')).toHaveCount(GOOGLE_WALK.count, { timeout: 20_000 });
          // The way on foot between the stops is TREK's own: wait for the router's line.
          await expect(p.getByTestId('tour-planner-overview')).toBeVisible({ timeout: 60_000 });
          await settle(p);
        },
      },
    ],
    cleanup: discardDraft,
  },
  'tour-walk-check-off': {
    guide: guide('tour-walk-check-off'),
    start: async (p) => {
      await resetKyotoVisits(p.request);
      await openTrip(p, { day: 9 });
      await expect(planRow(p, KYOTO_WALK)).toBeVisible({ timeout: 20_000 });
    },
    steps: [
      {
        target: (p) => planRow(p, KYOTO_WALK),
        act: async (p) => {
          // On the name: the row's centre can land on one of its badges.
          await planRow(p, KYOTO_WALK).getByText(KYOTO_WALK, { exact: true }).first().click();
          await expect(p.getByTestId('walk-stations')).toBeVisible({ timeout: 20_000 });
          await expect(p.getByTestId('walk-station')).toHaveCount(7, { timeout: 20_000 });
          await settle(p);
        },
      },
      only(stationsSection),
      {
        target: (p) => stationRow(p, 'Kiyomizu-dera').getByRole('button', { name: 'Mark visited' }),
        act: async (p) => {
          await stationRow(p, 'Kiyomizu-dera').getByRole('button', { name: 'Mark visited' }).click();
          await expect(stationRow(p, 'Kiyomizu-dera').getByRole('button', { name: 'Take back' })).toBeVisible({
            timeout: 15_000,
          });
          await stationRow(p, 'Sannenzaka').getByRole('button', { name: 'Mark visited' }).click();
          await expect(stationRow(p, 'Sannenzaka').getByRole('button', { name: 'Take back' })).toBeVisible({
            timeout: 15_000,
          });
          await stationRow(p, 'Kodai-ji').getByRole('button', { name: 'Skip' }).click();
          await expect(stationRow(p, 'Kodai-ji').getByRole('button', { name: 'Take back' })).toBeVisible({
            timeout: 15_000,
          });
          await settle(p);
        },
      },
      only((p) => stationsSection(p).locator('> div').first()),
    ],
    cleanup: async (p) => {
      await resetKyotoVisits(p.request);
    },
  },
};

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  await ensureToursFixtures(request);
  await ensureWalkHours(request);
});

test('every registered city walk guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripTourWalkContext.guides].sort());
});

test('hero: trip-tour-walk', async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await captureHero(page, tripTourWalkContext.id, openWalk);
});

for (const id of tripTourWalkContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await captureGuide(page, SCRIPTS[id]);
  });
}
