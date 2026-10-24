import { expect, test, type Page } from '@playwright/test';
import { tripTourMapContext, tripTourMapGuides } from '../../src/help/contexts/tripTourMap';
import type { HelpGuide } from '../../src/help/types';
import {
  ALONG_TOUR,
  alongCard,
  alongCategories,
  alongCategoryList,
  alongCorridor,
  alongList,
  alongSearch,
  baseSegment,
  candidateRow,
  closeOverlay,
  enterTerrain,
  gradeBands,
  gradeMix,
  gradeSwitch,
  MAP_TOUR,
  openSkiTour,
  openTourInPlanner,
  overviewButton,
  PADDLE_TOUR,
  pauseButton,
  pickAddablePlace,
  pisteKeyButton,
  pisteKeyPanel,
  pistesToggle,
  playButton,
  poiAdd,
  poiCard,
  poiOutcome,
  poiSlot,
  poiUndo,
  reliefSlider,
  restartButton,
  seamarksToggle,
  searchAlong,
  speedGroup,
  terrainToggle,
  tourRow,
  waitForFlyover,
} from './fixtures-trip-tour-map';
import { captureGuide, captureHero, settle, VIEWPORT, type GuideScript } from './guide';
import { ensureToursFixtures, openTourTrip } from './tour-fixtures';

/**
 * Actions for the map of the Tours tab, keyed by the ids in
 * `src/help/contexts/tripTourMap.ts`. They run on the Dolomites trip of the
 * Tours fixtures (the Pisciadù hike for the maps and 3D, the Puez-Odle hut
 * trek for the places along it, the boat tour on Lago di Braies for the
 * seamarks) and on the ski week for the pistes. No guide saves anything: the
 * base map, the overlays and 3D are the planner's own view, and the stop taken
 * in along the tour stays an unsaved change of the draft. Drafts live on the
 * account now, one per trip, so that guide discards its draft again before it
 * ends, or the next guide on the Dolomites would open the hut trek restored.
 *
 * Every picture here draws live tiles (OpenTopoMap, OpenHikingMap, Esri,
 * OpenSnowMap, OpenSeaMap, the Mapzen terrain), the places along the tour come
 * from Overpass and TREK's places index, and a new stop is routed by Valhalla.
 */

const guide = (id: string): HelpGuide => {
  const g = tripTourMapGuides.find((x) => x.id === id);
  if (!g) throw new Error(`no registered guide "${id}"`);
  return g;
};

/** The place the add-stop guide takes in, found in its `start`: an index among the places not in the tour yet. */
let addable = 0;

/** The speed the flyover guide picks; slow enough that Pause is still there when its picture is taken. */
const SPEED = '2×';

/**
 * The 3D map's own control row. The flat map's vector base map draws on a
 * MapLibre canvas of its own, so a canvas alone cannot tell 3D from flat.
 */
const terrainDock = (page: Page) => page.getByTestId('terrain-control-row');

/**
 * Search along the tour with Summits ticked beside the three kinds a hike
 * starts with, 1 km either side. Viewpoints, huts and water are asked of
 * Overpass alone, whose public mirrors are often down; summits come from
 * TREK's places index as well, so the list has places even then.
 */
async function searchAlongWithSummits(page: Page): Promise<void> {
  await alongCard(page).scrollIntoViewIfNeeded();
  await alongCategories(page).click();
  await expect(alongCategoryList(page)).toBeVisible();
  await alongCategoryList(page).getByRole('button', { name: 'Summits', exact: true }).click();
  await closeOverlay(page);
  await expect(alongCategoryList(page)).toBeHidden();
  // 250 m, 500 m, 1 km, 2 km: the third.
  await alongCorridor(page).getByRole('button').nth(2).click();
  await searchAlong(page);
}

const SCRIPTS: Record<string, GuideScript> = {
  'tour-map-layers': {
    guide: guide('tour-map-layers'),
    start: (p) => openTourTrip(p, { tab: 'tour-planner' }).then(() => undefined),
    steps: [
      {
        target: (p) => tourRow(p, MAP_TOUR),
        act: async (p) => {
          await tourRow(p, MAP_TOUR).click();
          await expect(tourRow(p, MAP_TOUR)).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 });
          await expect(p.getByTestId('tour-planner-overview')).toBeVisible({ timeout: 60_000 });
          await settle(p);
        },
      },
      {
        target: (p) => baseSegment(p, 'Topo'),
        act: async (p) => {
          await baseSegment(p, 'Topo').click();
          await expect(baseSegment(p, 'Topo')).toHaveAttribute('aria-pressed', 'true');
          await settle(p);
        },
      },
      {
        // Only there while the admin allows OpenHikingMap: the Tours fixtures switch tours-hiking-map on.
        target: (p) => baseSegment(p, 'Hiking'),
        act: async (p) => {
          await baseSegment(p, 'Hiking').click();
          await expect(baseSegment(p, 'Hiking')).toHaveAttribute('aria-pressed', 'true');
          await settle(p);
        },
      },
    ],
  },

  'tour-along-search': {
    guide: guide('tour-along-search'),
    start: (p) => openTourInPlanner(p, ALONG_TOUR),
    steps: [
      { target: (p) => alongCard(p) },
      {
        prepare: async (p) => {
          await alongCategories(p).click();
          await expect(alongCategoryList(p)).toBeVisible();
        },
        target: (p) => alongCategoryList(p),
        act: async (p) => {
          // A hike starts with Viewpoints, Huts and shelters and Drinking water; Summits joins them.
          await alongCategoryList(p).getByRole('button', { name: 'Summits', exact: true }).click();
          await closeOverlay(p);
          await expect(alongCategoryList(p)).toBeHidden();
        },
      },
      {
        target: (p) => alongCorridor(p),
        // 250 m, 500 m, 1 km, 2 km: the third.
        act: (p) => alongCorridor(p).getByRole('button').nth(2).click(),
      },
      {
        target: (p) => alongSearch(p),
        act: async (p) => {
          await alongSearch(p).click();
          await expect(alongSearch(p)).toHaveText(/Search again/, { timeout: 90_000 });
          await settle(p);
        },
      },
      {
        prepare: async (p) => {
          await expect(
            alongList(p),
            'the search along the tour found nothing (Overpass or the places index)'
          ).toBeVisible();
        },
        target: (p) => alongList(p),
      },
    ],
  },

  'tour-along-add-stop': {
    guide: guide('tour-along-add-stop'),
    start: async (p) => {
      await openTourInPlanner(p, ALONG_TOUR);
      await searchAlongWithSummits(p);
      addable = await pickAddablePlace(p);
    },
    steps: [
      {
        target: (p) => candidateRow(p, addable),
        act: async (p) => {
          await candidateRow(p, addable).click();
          await expect(poiCard(p)).toBeVisible();
          await settle(p);
        },
      },
      { target: (p) => poiSlot(p) },
      {
        target: (p) => poiAdd(p),
        act: async (p) => {
          await poiAdd(p).click();
          // "is a stop now. The tour changes by:" once Valhalla planned it, or the line that it could not be told.
          await expect(poiOutcome(p)).toHaveText(/changes by|could not be worked out/, { timeout: 90_000 });
          await settle(p);
        },
      },
      { target: (p) => poiOutcome(p) },
    ],
    // Nothing was saved, but the draft with the new stop sits on the account: leaving the planner and
    // discarding it deletes it there, so the next guide on this trip opens the saved tours.
    cleanup: async (p) => {
      if (await poiUndo(p).isVisible()) await poiUndo(p).click();
      const back = p.getByRole('button', { name: 'Back to Tours', exact: true });
      if (!(await back.isVisible())) return;
      const deleted = p
        .waitForResponse((r) => r.url().includes('/tour-draft') && r.request().method() === 'DELETE', {
          timeout: 15_000,
        })
        .catch(() => null);
      await back.click();
      const discard = p.getByRole('button', { name: 'Discard changes', exact: true });
      // The dialog only asks while the planner holds unsaved changes; without them Back leaves at once.
      await discard.waitFor({ state: 'visible', timeout: 5_000 }).then(
        () => discard.click(),
        () => undefined
      );
      await deleted;
    },
  },

  'tour-3d-terrain': {
    guide: guide('tour-3d-terrain'),
    start: (p) => openTourInPlanner(p, MAP_TOUR),
    steps: [
      { target: (p) => terrainToggle(p), act: (p) => enterTerrain(p) },
      {
        target: (p) => gradeSwitch(p),
        // Into the tour's colour and back to the grades, as the step tells.
        act: async (p) => {
          await gradeSwitch(p).click();
          await expect(gradeSwitch(p)).toHaveAttribute('aria-pressed', 'false');
          await settle(p);
          await gradeSwitch(p).click();
          await expect(gradeSwitch(p)).toHaveAttribute('aria-pressed', 'true');
          await settle(p);
        },
      },
      {
        target: (p) => gradeMix(p),
        act: async (p) => {
          await gradeMix(p).click();
          await expect(gradeBands(p)).toBeVisible();
        },
      },
      {
        target: (p) => reliefSlider(p),
        // From 1.0× to 2.0×, ten steps of 0.1: a range input is moved by its keys, not filled.
        act: async (p) => {
          await reliefSlider(p).focus();
          for (let i = 0; i < 10; i++) await p.keyboard.press('ArrowRight');
          await settle(p);
        },
      },
      {
        target: (p) => terrainToggle(p),
        act: async (p) => {
          await terrainToggle(p).click();
          await expect(terrainDock(p)).toHaveCount(0, { timeout: 15_000 });
          await settle(p);
        },
      },
    ],
  },

  'tour-3d-flyover': {
    guide: guide('tour-3d-flyover'),
    start: async (p) => {
      await openTourInPlanner(p, MAP_TOUR);
      await enterTerrain(p);
      await waitForFlyover(p);
      await settle(p);
    },
    steps: [
      {
        target: (p) => playButton(p),
        // The loop: the pointer on Play flyover, the click, then about five seconds of
        // the camera following the dot. Only the browser's Date is pinned, so the
        // flyover's animation frames run on their own clock.
        clip: async (p, frame) => {
          await playButton(p).hover();
          await frame();
          await frame();
          await playButton(p).click();
          await expect(pauseButton(p)).toBeVisible();
          for (let i = 0; i < 24; i++) {
            await p.waitForTimeout(200);
            await frame();
          }
        },
      },
      {
        target: (p) => speedGroup(p),
        act: (p) => speedGroup(p).getByRole('button', { name: SPEED, exact: true }).click(),
      },
      {
        // Back to the start and in flight again, so Pause is on the dock whatever the last step left.
        prepare: async (p) => {
          await restartButton(p).click();
          await expect(pauseButton(p)).toBeVisible();
        },
        target: (p) => pauseButton(p),
        act: async (p) => {
          await pauseButton(p).click();
          await expect(playButton(p)).toBeVisible();
        },
      },
      {
        target: (p) => overviewButton(p),
        act: async (p) => {
          await overviewButton(p).click();
          await settle(p);
        },
      },
    ],
  },

  'tour-map-overlays': {
    guide: guide('tour-map-overlays'),
    start: async (p) => {
      await openSkiTour(p);
    },
    steps: [
      {
        prepare: async (p) => {
          // On by default for a ski tour; "on" rather than "down", or the key next to it is missing.
          await expect(pistesToggle(p)).toHaveAttribute('data-status', 'on', { timeout: 30_000 });
        },
        target: (p) => pistesToggle(p),
      },
      {
        target: (p) => pisteKeyButton(p),
        act: async (p) => {
          await pisteKeyButton(p).click();
          await expect(pisteKeyPanel(p)).toBeVisible();
        },
      },
      {
        target: (p) => pisteKeyPanel(p),
        act: async (p) => {
          await closeOverlay(p);
          await expect(pisteKeyPanel(p)).toBeHidden();
        },
      },
      {
        prepare: (p: Page) => openTourInPlanner(p, PADDLE_TOUR),
        target: (p) => seamarksToggle(p),
        act: async (p) => {
          await seamarksToggle(p).click();
          await expect(seamarksToggle(p)).toHaveAttribute('aria-pressed', 'true');
          await settle(p);
        },
      },
    ],
  },
};

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  // The Dolomites and the ski week with their tours, the hiking map allowed.
  await ensureToursFixtures(request);
});

test('every registered tour map guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripTourMapContext.guides].sort());
});

test('hero: trip-tour-map', async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await captureHero(page, tripTourMapContext.id, (p) => openTourInPlanner(p, MAP_TOUR));
});

for (const id of tripTourMapContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await captureGuide(page, SCRIPTS[id]);
  });
}
