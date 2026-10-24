import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { tripTourStagesContext, tripTourStagesGuides } from '../../src/help/contexts/tripTourStages';
import type { HelpGuide } from '../../src/help/types';
import { captureGuide, captureHero, settle, VIEWPORT, type GuideScript } from './guide';
import { ensureToursFixtures, openTourTrip, TOUR_NAMES, TOUR_PLACES, type ToursFixtures } from './tour-fixtures';
import { confirmDialog } from './trip-shared';

/**
 * Actions for multi-day tours on the Tours tab, keyed by the ids in
 * `src/help/contexts/tripTourStages.ts`. They run on "Summer in the
 * Dolomites" (`ensureToursFixtures`): the three-stage Puez-Odle hut trek on
 * days 4 to 6, and the Pisciadù via ferrata, a day tour whose route passes the
 * Rifugio Pisciadù, which is where its first day is made to end.
 *
 * Splitting the ferrata hike is never saved: the draft lives only in this
 * test's browser, and cleanup forgets it. Putting the hut trek on its days
 * takes it off them first, through the API, and cleanup puts the seed's
 * placements and start times back.
 */

const guide = (id: string): HelpGuide => {
  const g = tripTourStagesGuides.find((x) => x.id === id);
  if (!g) throw new Error(`no registered guide "${id}"`);
  return g;
};

let fx: ToursFixtures;

// ── Where things are ──────────────────────────────────────────────────────────

/** The right rail of the Tours tab, "Tours of this trip". */
const toursRail = (page: Page) => page.getByRole('complementary', { name: 'Tours of this trip' });
/** A tour's row in that rail; the option is named after the tour. */
const tourRow = (page: Page, name: string) => toursRail(page).getByRole('option', { name, exact: true });
/** The editor's Days field: Day tour or Multi-day tour. */
const stageMode = (page: Page) => page.getByTestId('tour-stage-mode');
const waypointsCard = (page: Page) => page.getByRole('region', { name: 'Waypoints', exact: true });
const waypointRow = (page: Page, name: string) =>
  page.getByTestId('tour-planner-waypoint-row').filter({ hasText: name }).first();
/** The one context menu that is open; its entries are plain buttons. */
const openMenu = (page: Page) => page.getByRole('menu');
const menuItem = (page: Page, name: string | RegExp) =>
  openMenu(page).getByRole('button', typeof name === 'string' ? { name, exact: true } : { name });
const stageItem = (page: Page, n: number) => page.locator(`[data-testid="tour-stage-item"][data-stage="${n}"]`);

// ── Getting there ─────────────────────────────────────────────────────────────

async function openToursTab(page: Page): Promise<number> {
  const tripId = await openTourTrip(page, { tab: 'tour-planner' });
  await expect(tourRow(page, TOUR_NAMES.hutToHut)).toBeVisible({ timeout: 30_000 });
  return tripId;
}

/** The route's measures arrive after the points: nothing is drawn or counted before. */
async function waitForTheRoute(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Edit tour', exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(waypointsCard(page)).toBeVisible();
  await expect(page.getByRole('region', { name: 'Tour summary', exact: true })).toBeVisible({ timeout: 120_000 });
  await expect(page.locator('[data-testid="tour-planner-status"] .animate-spin')).toHaveCount(0, { timeout: 120_000 });
  await settle(page);
}

/** Open a tour in the editor from its row; on the name, not on the plus or the fold at the row's end. */
async function openInEditor(page: Page, name: string): Promise<void> {
  await tourRow(page, name).click({ position: { x: 80, y: 14 } });
  await waitForTheRoute(page);
}

/** The draft kept on the account, and the copy older builds left in the browser. */
async function forgetDraft(page: Page, tripId: number): Promise<void> {
  await page.request.delete(`/api/trips/${tripId}/tour-draft`).catch(() => undefined);
  await page.evaluate((id) => {
    try {
      localStorage.removeItem(`tour-draft-${id}`);
    } catch {
      // Nothing kept, nothing to forget.
    }
  }, tripId);
}

type AssignmentRow = { id: number; place_id: number };

/** Takes the hut trek off every day it is on, so the guide can put it on again. */
async function clearHutTrekDays(api: APIRequestContext): Promise<void> {
  const placeId = fx.tours.hutToHut;
  if (!placeId) throw new Error(`no "${TOUR_NAMES.hutToHut}": the tour fixtures could not build it`);
  for (const dayId of fx.dayIds) {
    const res = await api.get(`/api/trips/${fx.tripId}/days/${dayId}/assignments`);
    const { assignments = [] } = (await res.json()) as { assignments?: AssignmentRow[] };
    for (const a of assignments.filter((x) => x.place_id === placeId)) {
      const del = await api.delete(`/api/trips/${fx.tripId}/days/${dayId}/assignments/${a.id}`);
      expect(del.ok(), `take the hut trek off day ${dayId}`).toBe(true);
    }
  }
}

// ── The guides ────────────────────────────────────────────────────────────────

let tripId = 0;

const SCRIPTS: Record<string, GuideScript> = {
  'tour-multi-day': {
    guide: guide('tour-multi-day'),
    start: async (p) => {
      tripId = await openToursTab(p);
      await expect(tourRow(p, TOUR_NAMES.ferrata)).toBeVisible();
    },
    steps: [
      {
        target: (p) => tourRow(p, TOUR_NAMES.ferrata),
        act: async (p) => {
          await openInEditor(p, TOUR_NAMES.ferrata);
          await expect(waypointRow(p, TOUR_PLACES.pisciadu)).toBeVisible();
        },
      },
      {
        target: (p) => stageMode(p).getByRole('button', { name: 'Multi-day tour', exact: true }),
        act: async (p) => {
          await stageMode(p).getByRole('button', { name: 'Multi-day tour', exact: true }).click();
          await expect(
            stageMode(p).getByText('In the menu of a stop, choose End stage here to split the route.')
          ).toBeVisible();
          await settle(p);
        },
      },
      {
        prepare: async (p) => {
          const row = waypointRow(p, TOUR_PLACES.pisciadu);
          await row.scrollIntoViewIfNeeded();
          await row.hover();
          await row.getByRole('button', { name: 'More actions', exact: true }).click();
          await expect(menuItem(p, 'End stage here')).toBeVisible();
        },
        target: (p) => menuItem(p, 'End stage here'),
        act: async (p) => {
          await menuItem(p, 'End stage here').click();
          await expect(p.getByTestId('tour-stage-divider')).toHaveCount(2);
          await settle(p);
        },
      },
      { target: waypointsCard },
      {
        target: (p) => p.getByTestId('tour-stage-row').first(),
        act: async (p) => {
          await p.getByTestId('tour-stage-row').first().click();
          await expect(waypointRow(p, TOUR_PLACES.pisciadu).locator('button[aria-current="true"]')).toBeVisible();
          await settle(p);
        },
      },
      {
        prepare: async (p) => {
          await stageMode(p).getByRole('button', { name: 'Day tour', exact: true }).click();
          await expect(confirmDialog(p).getByRole('button', { name: 'Remove stage ends', exact: true })).toBeVisible();
          await settle(p);
        },
        target: confirmDialog,
        act: async (p) => {
          await confirmDialog(p).getByRole('button', { name: 'Remove stage ends', exact: true }).click();
          await expect(p.getByTestId('tour-stage-divider')).toHaveCount(0);
          await settle(p);
        },
      },
    ],
    cleanup: (p) => forgetDraft(p, tripId),
  },
  'tour-stages-on-days': {
    guide: guide('tour-stages-on-days'),
    start: async (p) => {
      await clearHutTrekDays(p.request);
      tripId = await openToursTab(p);
      await expect(tourRow(p, TOUR_NAMES.hutToHut).getByTestId('tour-days-badge')).toHaveCount(0);
    },
    steps: [
      {
        prepare: async (p) => {
          await tourRow(p, TOUR_NAMES.hutToHut).hover();
        },
        target: (p) =>
          tourRow(p, TOUR_NAMES.hutToHut).getByRole('button', { name: `Add to day: ${TOUR_NAMES.hutToHut}` }),
        act: async (p) => {
          await tourRow(p, TOUR_NAMES.hutToHut)
            .getByRole('button', { name: `Add to day: ${TOUR_NAMES.hutToHut}` })
            .click();
          await expect(menuItem(p, /^Day 4(?!\d)/)).toBeVisible();
        },
      },
      {
        target: (p) => menuItem(p, /^Day 4(?!\d)/),
        act: async (p) => {
          await menuItem(p, /^Day 4(?!\d)/).click();
          await expect(menuItem(p, 'Stages from this day on')).toBeVisible();
          await settle(p);
        },
      },
      {
        target: (p) => menuItem(p, 'Stages from this day on'),
        act: async (p) => {
          await menuItem(p, 'Stages from this day on').click();
          await expect(p.getByText('Stages from day 4 on.')).toBeVisible({ timeout: 30_000 });
          await expect(tourRow(p, TOUR_NAMES.hutToHut).getByTestId('tour-days-badge')).toHaveText(/4, 5, 6/, {
            timeout: 30_000,
          });
          await settle(p);
        },
      },
      {
        target: (p) => tourRow(p, TOUR_NAMES.hutToHut).getByRole('button', { name: 'Show stages', exact: true }),
        act: async (p) => {
          await tourRow(p, TOUR_NAMES.hutToHut).getByRole('button', { name: 'Show stages', exact: true }).click();
          await expect(p.getByTestId('tour-stage-item')).toHaveCount(3, { timeout: 30_000 });
          await expect(stageItem(p, 3).getByTestId('tour-stage-day')).toHaveAttribute(
            'data-stage-day',
            String(fx.dayIds[5])
          );
          await settle(p);
        },
      },
      {
        target: (p) => stageItem(p, 3).getByTestId('tour-stage-day'),
        act: async (p) => {
          // The menu of days opens and closes again: the pictures move no stage.
          await stageItem(p, 3).getByTestId('tour-stage-day').click();
          await expect(openMenu(p)).toBeVisible();
          // A click beside the menu closes it, on the rail's heading, which does
          // nothing by itself. Escape does not reach the menu here: the stage list
          // stops every key press that bubbles out of it, and the portalled menu
          // bubbles through it in React's tree. The pill itself is no way out
          // either, as the menu is pushed up over it at the foot of the window.
          await toursRail(p).getByRole('heading', { name: 'Tours of this trip', exact: true }).click();
          await expect(openMenu(p)).toHaveCount(0);
          await settle(p);
        },
      },
      {
        target: (p) => stageItem(p, 2).getByTestId('tour-stage-open'),
        act: async (p) => {
          await stageItem(p, 2).getByTestId('tour-stage-open').click();
          await waitForTheRoute(p);
          await expect(waypointRow(p, TOUR_PLACES.genova).locator('button[aria-current="true"]')).toBeVisible({
            timeout: 30_000,
          });
          await settle(p);
        },
      },
    ],
    cleanup: async (p) => {
      // The seed's placements come back with their start times (08:30, 08:00, 08:00).
      await clearHutTrekDays(p.request);
      fx = await ensureToursFixtures(p.request);
      await forgetDraft(p, tripId);
    },
  },
};

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  test.setTimeout(600_000);
  fx = await ensureToursFixtures(request);
});

test('every registered stages guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripTourStagesContext.guides].sort());
});

/** The hut trek open in the editor: its three stages in the list of points and in the summary. */
async function heroStart(page: Page): Promise<void> {
  await openToursTab(page);
  await openInEditor(page, TOUR_NAMES.hutToHut);
  await expect(page.getByTestId('tour-stage-divider')).toHaveCount(3);
  await expect(page.getByTestId('tour-stage-row')).toHaveCount(3);
  await settle(page);
}

test('hero: trip-tour-stages', async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await captureHero(page, tripTourStagesContext.id, heroStart);
});

for (const id of tripTourStagesContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await captureGuide(page, SCRIPTS[id]);
  });
}
