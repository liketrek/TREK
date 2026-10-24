import { expect, test, type Page } from '@playwright/test';
import { tripTourPlannerContext, tripTourPlannerGuides } from '../../src/help/contexts/tripTourPlanner';
import type { HelpGuide } from '../../src/help/types';
import { clearNotices } from '../screenshots/shot';
import {
  centreOf,
  closeEditor,
  DRAWN_OFFSETS,
  editorRail,
  ensureOldPlan,
  ensureSpare,
  forgetPlannerState,
  glide,
  hutLine,
  landMap,
  layerPill,
  mapSearch,
  menuItem,
  offDay,
  openMenu,
  openPlanner,
  openRowMenu,
  openSaved,
  pin,
  PLANNER_TOURS,
  removeTour,
  routeBand,
  saveSpareElsewhere,
  screenOf,
  SEARCH_QUERY,
  SHAPING_OFFSET,
  shapingPin,
  spotAt,
  spotOnRoute,
  summaryCard,
  tourIdOf,
  tourRow,
  toursRail,
  tripIdOf,
  useTopo,
  waitRouted,
  waypointRows,
  waypointsCard,
  type HutLine,
} from './fixtures-trip-tour-planner';
import { captureGuide, captureHero, dismissReleaseNotice, settle, typeInto, VIEWPORT, type GuideScript } from './guide';
import { ensureToursFixtures, TOUR_NAMES, TOUR_PLACES } from './tour-fixtures';
import { confirmDialog, tripReady } from './trip-shared';

/**
 * Actions for the Tours tab, the tour planner, keyed by the ids in
 * `src/help/contexts/tripTourPlanner.ts`. They run on "Summer in the
 * Dolomites" (`ensureToursFixtures`) plus one plain day hike of this screen's
 * own, "Rifugio Firenze to Col Raiser" (`ensureSpare`), cut from the hut
 * trek's line. The editing guides open that hike, change it and throw the
 * change away again; the two that save put it back as it was made. A new tour
 * is drawn through spots on the hut trek's line, so every leg has a path.
 *
 * Every route here is planned by the router the app asks (Valhalla), and the
 * map search goes through the server's place search, so the run needs the
 * network. The Topo map is switched on before anything is clicked onto the
 * map: its raster tiles are what `screenOf` finds a spot on the screen by.
 */

const guide = (id: string): HelpGuide => {
  const g = tripTourPlannerGuides.find((x) => x.id === id);
  if (!g) throw new Error(`no registered guide "${id}"`);
  return g;
};

let geo: HutLine | null = null;
async function line(page: Page): Promise<HutLine> {
  geo ??= await hutLine(page.request, await tripIdOf(page.request));
  return geo;
}

// ── Where things are ──────────────────────────────────────────────────────────

const planNew = (page: Page) => page.getByRole('button', { name: 'Plan new tour', exact: true });
const addPoint = (page: Page) => page.getByTestId('tour-planner-add-point');
const saveButton = (page: Page) => editorRail(page).getByRole('button', { name: 'Save', exact: true });
const backToTours = (page: Page) => page.getByRole('button', { name: 'Back to Tours', exact: true });
const pointSet = (page: Page) => page.getByRole('status').filter({ hasText: 'Point set' });
const nameField = (page: Page) => page.locator('#tour-planner-name');
const description = (page: Page) => page.locator('#tour-planner-description');
const website = (page: Page) => page.locator('#tour-planner-website');
const breaks = (page: Page) => page.locator('#tour-planner-breaks');
const planned = (page: Page) => page.locator('#tour-planner-planned-duration');
const rowButton = (page: Page, index: number) =>
  waypointRows(page)
    .nth(index)
    .getByRole('button')
    .filter({ has: page.getByTestId('tour-planner-waypoint-name') });
const shapingRow = (page: Page) => waypointRows(page).filter({ hasText: 'Shaping point' }).first();
const tourTypeField = (page: Page) => page.getByTestId('tour-type-select');
const typeList = (page: Page) => page.getByRole('group', { name: 'Tour type', exact: true });
const profileGroup = (page: Page) =>
  page.getByTestId('tour-planner-bike-fields').getByRole('group', { name: 'Profile' });
const placePicker = (page: Page) => page.getByTestId('trip-place-picker');
const filterButton = (page: Page) => toursRail(page).getByRole('button', { name: 'Show', exact: true });
const filterMenu = (page: Page) => toursRail(page).getByRole('group', { name: 'Show', exact: true });
const totalsCard = (page: Page) => toursRail(page).getByRole('region', { name: 'Trip totals', exact: true });
const remoteNotice = (page: Page) => page.getByTestId('tour-remote-change');
// The dialog takes its name from the eyebrow above the title ("Not saved"), so it is found by its heading.
const conflictDialog = (page: Page) =>
  page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Changed in the meantime', exact: true }) });
/** A place of the trip in the picker, by its own name: a tour named after the place would match a substring too. */
const placeCandidate = (page: Page, name: string) =>
  placePicker(page)
    .getByTestId('trip-place-candidate')
    .filter({ has: page.getByText(name, { exact: true }) });

// ── Getting there ─────────────────────────────────────────────────────────────

/** The trip on its Plan tab, for the one guide that starts by switching to Tours. */
async function openPlanTab(page: Page): Promise<void> {
  const tripId = await tripIdOf(page.request);
  await forgetPlannerState(page);
  await page.goto(`/trips/${tripId}`);
  await clearNotices(page);
  await dismissReleaseNotice(page);
  await tripReady(page);
  await settle(page);
}

/** The details are open by default and remembered; a guide that types into them makes sure. */
async function openDetails(page: Page): Promise<void> {
  const show = page.getByRole('button', { name: 'Show details', exact: true });
  if (await show.isVisible().catch(() => false)) await show.click();
  await expect(description(page)).toBeVisible();
}

/** Plan new tour, on the Topo map. */
async function startDraft(page: Page): Promise<void> {
  await planNew(page).click();
  await expect(page.getByRole('heading', { name: 'New tour', exact: true })).toBeVisible();
  await useTopo(page);
}

/** Pick the map search's answer that lies in the Dolomites; the first one when none says so. */
async function searchTheHut(page: Page): Promise<void> {
  await typeInto(page, mapSearch(page), SEARCH_QUERY);
  const options = page.getByRole('listbox', { name: 'Search place or address' }).getByRole('option');
  await expect(options.first(), 'the map search found nothing for the hut').toBeVisible({ timeout: 30_000 });
  const local = options.filter({
    hasText: /Santa Cristina|Gardena|Gröden|Bolzano|Bozen|Südtirol|Alto Adige|Trentino/i,
  });
  await ((await local.count()) ? local.first() : options.first()).click();
  await landMap(page);
}

/** Click spot `i` of the drawing onto the map and wait for its row. */
async function clickSpot(page: Page, i: number): Promise<void> {
  const at = await screenOf(page, spotAt(await line(page), DRAWN_OFFSETS[i]));
  await page.mouse.click(at.x, at.y);
  await expect(waypointRows(page)).toHaveCount(i + 1, { timeout: 15_000 });
}

/** A new tour of four points, drawn and routed, the way the drawing guide draws it. */
async function drawDraft(page: Page): Promise<void> {
  await startDraft(page);
  await searchTheHut(page);
  for (let i = 0; i < DRAWN_OFFSETS.length; i++) {
    await clickSpot(page, i);
    if (i > 0) await waitRouted(page);
  }
}

/** The Tours tab with the spare hike open in the editor. */
async function openSpare(page: Page): Promise<void> {
  await openPlanner(page);
  await openSaved(page, PLANNER_TOURS.spare);
}

/** Where along the hut trek the spare's stop `k` (from 0) lies, in metres from the hut. */
function stopOffset(g: HutLine, k: number): number {
  const length = g.line.length - g.hut;
  const cut = [0, Math.round(length / 3), Math.round((2 * length) / 3), length - 1][k];
  return g.along[g.hut + cut] - g.along[g.hut];
}

/** Drag the mouse from one point to another in small steps, for a pin Leaflet does not drag itself. */
async function dragBetween(page: Page, from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 6, from.y + 6, { steps: 3 });
  await page.mouse.move(to.x, to.y, { steps: 16 });
  await page.mouse.up();
}

async function backToNeutral(page: Page): Promise<void> {
  await closeEditor(page);
  await settle(page);
}

// ── The guides ────────────────────────────────────────────────────────────────

const SCRIPTS: Record<string, GuideScript> = {
  'tour-open-workspace': {
    guide: guide('tour-open-workspace'),
    start: openPlanTab,
    steps: [
      {
        // The trip's own tab bar; the Places | Tours switch of the plan is a tablist of tabs, not buttons.
        target: (p) => p.getByRole('button', { name: 'Tours', exact: true }).first(),
        act: async (p) => {
          await p.getByRole('button', { name: 'Tours', exact: true }).first().click();
          await expect(planNew(p)).toBeVisible({ timeout: 30_000 });
          await expect(tourRow(p, TOUR_NAMES.hutToHut)).toBeVisible({ timeout: 30_000 });
          await landMap(p);
        },
      },
      { target: planNew },
      { target: toursRail },
      {
        prepare: async (p) => {
          await p.getByTestId('tour-rail-add').click();
          await expect(p.getByRole('group', { name: 'Add tour', exact: true })).toBeVisible();
          await settle(p);
        },
        target: (p) => p.getByRole('group', { name: 'Add tour', exact: true }),
        act: async (p) => {
          await p.keyboard.press('Escape');
          if (
            await p
              .getByRole('group', { name: 'Add tour', exact: true })
              .isVisible()
              .catch(() => false)
          ) {
            await p.getByTestId('tour-rail-add').click();
          }
          await expect(p.getByRole('group', { name: 'Add tour', exact: true })).toHaveCount(0);
        },
      },
      { target: mapSearch },
      { target: layerPill },
      {
        target: (p) => tourRow(p, TOUR_NAMES.recorded),
        act: async (p) => {
          await tourRow(p, TOUR_NAMES.recorded).click();
          await expect(p.getByRole('heading', { name: 'GPX tour', exact: true })).toBeVisible({ timeout: 30_000 });
          await landMap(p);
        },
      },
    ],
    cleanup: backToNeutral,
  },

  'tour-draw-route': {
    guide: guide('tour-draw-route'),
    start: openPlanner,
    steps: [
      { target: planNew, act: startDraft },
      { target: mapSearch, act: searchTheHut },
      {
        target: addPoint,
        act: async (p) => {
          await expect(addPoint(p)).toHaveAttribute('aria-pressed', 'true');
          await clickSpot(p, 0);
        },
      },
      // Up for four seconds after a click, and held while the pointer rests on it.
      { target: pointSet },
      {
        target: (p) => pin(p, 1),
        clip: async (p, frame) => {
          for (let i = 1; i < DRAWN_OFFSETS.length; i++) {
            const from = await centreOf(pin(p, i));
            const to = await screenOf(p, spotAt(await line(p), DRAWN_OFFSETS[i]));
            await glide(p, { x: from.x + 20, y: from.y + 20 }, to, frame);
            await p.mouse.click(to.x, to.y);
            await expect(waypointRows(p)).toHaveCount(i + 1, { timeout: 15_000 });
            // The route arrives while the frames run: a beat each.
            for (let k = 0; k < 6; k++) {
              await p.waitForTimeout(300);
              await frame();
            }
            await waitRouted(p);
            await frame();
          }
          for (let k = 0; k < 3; k++) await frame();
        },
      },
      { prepare: waitRouted, target: waypointsCard },
    ],
    cleanup: backToNeutral,
  },

  'tour-type-profile': {
    guide: guide('tour-type-profile'),
    start: async (p) => {
      await openPlanner(p);
      await openSaved(p, TOUR_NAMES.roadBike);
    },
    steps: [
      {
        target: tourTypeField,
        act: async (p) => {
          await tourTypeField(p).click();
          await expect(typeList(p)).toBeVisible();
        },
      },
      {
        target: typeList,
        act: async (p) => {
          // The tour stays a bike tour: picking its own type closes the list and changes nothing.
          await typeList(p).getByTestId('tour-type-option-bike').click();
          await expect(typeList(p)).toHaveCount(0);
          await settle(p);
        },
      },
      {
        target: profileGroup,
        act: async (p) => {
          await profileGroup(p).getByRole('button', { name: 'Touring', exact: true }).click();
          await waitRouted(p);
        },
      },
      { target: summaryCard },
    ],
    cleanup: backToNeutral,
  },

  'tour-edit-points': {
    guide: guide('tour-edit-points'),
    start: openSpare,
    steps: [
      {
        target: (p) => pin(p, 2),
        act: async (p) => {
          const g = await line(p);
          const from = await centreOf(pin(p, 2));
          const to = await screenOf(p, spotAt(g, stopOffset(g, 1) + 150));
          await dragBetween(p, from, to);
          await waitRouted(p);
        },
      },
      {
        target: (p) => rowButton(p, 2),
        act: async (p) => {
          await rowButton(p, 2).click();
          await settle(p);
        },
      },
      {
        prepare: async (p) => {
          await waypointRows(p).nth(2).hover();
        },
        target: (p) => waypointRows(p).nth(2).getByTestId('tour-planner-waypoint-drag-handle'),
        dropTo: (p) => waypointRows(p).nth(1),
        act: async (p) => {
          await waypointRows(p)
            .nth(2)
            .getByTestId('tour-planner-waypoint-drag-handle')
            .dragTo(waypointRows(p).nth(1), { targetPosition: { x: 60, y: 4 } });
          await waitRouted(p);
        },
      },
      {
        prepare: (p) => openRowMenu(p, waypointRows(p).nth(1)),
        target: openMenu,
        act: async (p) => {
          await menuItem(p, 'Move waypoint down').click();
          await waitRouted(p);
        },
      },
      {
        prepare: async (p) => {
          await waypointRows(p).nth(2).hover();
        },
        target: (p) => waypointRows(p).nth(2).getByRole('button', { name: 'Remove waypoint', exact: true }),
        act: async (p) => {
          await waypointRows(p).nth(2).getByRole('button', { name: 'Remove waypoint', exact: true }).click();
          await expect(waypointRows(p)).toHaveCount(3);
          await waitRouted(p);
        },
      },
      {
        target: (p) => p.getByRole('button', { name: 'Undo waypoint edit', exact: true }),
        act: async (p) => {
          await p.getByRole('button', { name: 'Undo waypoint edit', exact: true }).click();
          await expect(waypointRows(p)).toHaveCount(4);
          await waitRouted(p);
        },
      },
    ],
    cleanup: backToNeutral,
  },

  'tour-shaping-points': {
    guide: guide('tour-shaping-points'),
    start: async (p) => {
      await openSpare(p);
      // On the Leaflet map a click on the route reaches the map as well, so with Add point on it
      // also appends a new end on the same spot, whose pin then covers the shaping point. With
      // the tool off the click only shapes the route, as the guide says. The tool is remembered
      // in this page's session storage only, so the next guide finds it on again.
      if ((await addPoint(p).getAttribute('aria-pressed')) === 'true') await addPoint(p).click();
      await expect(addPoint(p)).toHaveAttribute('aria-pressed', 'false');
      await settle(p);
    },
    steps: [
      {
        target: routeBand,
        hover: async (p) => {
          const at = await spotOnRoute(p, 0.1);
          await p.mouse.move(at.x, at.y);
        },
        act: async (p) => {
          const at = await spotOnRoute(p, 0.1);
          await p.mouse.click(at.x, at.y);
          await expect(shapingPin(p)).toHaveCount(1, { timeout: 15_000 });
          await expect(waypointRows(p)).toHaveCount(5);
          await waitRouted(p);
        },
      },
      {
        target: shapingPin,
        // A pin's tooltip or a neighbour can sit over the dot's edge; its centre is where the hand goes.
        hover: async (p) => {
          const at = await centreOf(shapingPin(p));
          await p.mouse.move(at.x, at.y);
        },
        clip: async (p, frame) => {
          const from = await centreOf(shapingPin(p));
          const to = await screenOf(p, spotAt(await line(p), SHAPING_OFFSET));
          await glide(p, { x: from.x - 30, y: from.y + 20 }, from, frame, 4);
          await p.mouse.down();
          await p.mouse.move(from.x + 6, from.y + 6, { steps: 3 });
          await frame();
          await glide(p, { x: from.x + 6, y: from.y + 6 }, to, frame, 16);
          await p.mouse.up();
          for (let k = 0; k < 6; k++) {
            await p.waitForTimeout(300);
            await frame();
          }
          await waitRouted(p);
          for (let k = 0; k < 3; k++) await frame();
        },
      },
      { target: shapingRow },
      {
        prepare: (p) => openRowMenu(p, shapingRow(p)),
        target: openMenu,
        act: async (p) => {
          await menuItem(p, 'Make it a stop').click();
          await expect(waypointRows(p).filter({ hasText: 'Shaping point' })).toHaveCount(0);
          await waitRouted(p);
        },
      },
    ],
    cleanup: backToNeutral,
  },

  'tour-loop-reverse': {
    guide: guide('tour-loop-reverse'),
    start: openSpare,
    steps: [
      {
        target: (p) => p.getByTestId('tour-planner-return-to-start'),
        act: async (p) => {
          await p.getByTestId('tour-planner-return-to-start').click();
          await expect(waypointRows(p)).toHaveCount(5);
          await waitRouted(p);
        },
      },
      { target: (p) => waypointRows(p).last() },
      {
        target: (p) => p.getByTestId('tour-planner-reverse'),
        act: async (p) => {
          await p.getByTestId('tour-planner-reverse').click();
          await waitRouted(p);
        },
      },
    ],
    cleanup: backToNeutral,
  },

  'tour-leg-by-hand': {
    guide: guide('tour-leg-by-hand'),
    start: openSpare,
    steps: [
      {
        prepare: (p) => openRowMenu(p, waypointRows(p).nth(1)),
        target: openMenu,
        act: async (p) => {
          await menuItem(p, 'Draw the next leg by hand').click();
          await expect(p.getByTestId('tour-planner-free-leg')).toBeVisible();
          await waitRouted(p);
        },
      },
      { target: (p) => p.getByTestId('tour-planner-free-leg') },
      {
        prepare: (p) => openRowMenu(p, waypointRows(p).nth(1)),
        target: openMenu,
        act: async (p) => {
          await menuItem(p, 'Route the next leg again').click();
          await expect(p.getByTestId('tour-planner-free-leg')).toHaveCount(0);
          await waitRouted(p);
        },
      },
      {
        prepare: (p) => openRowMenu(p, waypointRows(p).nth(1)),
        target: (p) => menuItem(p, 'Plan the next leg again'),
        act: async (p) => {
          await menuItem(p, 'Plan the next leg again').click();
          await waitRouted(p);
        },
      },
    ],
    cleanup: backToNeutral,
  },

  'tour-trip-places': {
    guide: guide('tour-trip-places'),
    start: openSpare,
    steps: [
      {
        target: (p) => p.getByTestId('tour-planner-add-place'),
        act: async (p) => {
          await p.getByTestId('tour-planner-add-place').click();
          await expect(placePicker(p)).toBeVisible();
          await settle(p);
        },
      },
      { target: placePicker },
      {
        target: (p) => placeCandidate(p, TOUR_PLACES.firenze),
        act: async (p) => {
          await placeCandidate(p, TOUR_PLACES.firenze).click();
          await expect(waypointRows(p)).toHaveCount(5);
          await p.keyboard.press('Escape');
          await waitRouted(p);
        },
      },
      { target: (p) => waypointRows(p).last().getByTestId('tour-planner-waypoint-linked') },
    ],
    cleanup: backToNeutral,
  },

  'tour-details-times': {
    guide: guide('tour-details-times'),
    start: async (p) => {
      await openSpare(p);
      await openDetails(p);
    },
    steps: [
      { target: nameField },
      {
        target: description,
        act: async (p) => {
          await typeInto(
            p,
            description(p),
            'From the hut across the Cisles meadows and down to the gondola. Last ride down at 17:30.'
          );
          await typeInto(p, website(p), 'https://www.valgardena.it/en/');
          await settle(p);
        },
      },
      {
        target: breaks,
        act: async (p) => {
          await typeInto(p, breaks(p), '0:45');
          await breaks(p).press('Tab');
          await settle(p);
        },
      },
      {
        target: planned,
        act: async (p) => {
          await typeInto(p, planned(p), '3:30');
          await planned(p).press('Enter');
          await expect(p.getByTestId('tour-planner-planned-manual')).toBeVisible();
          await settle(p);
        },
      },
    ],
    cleanup: backToNeutral,
  },

  'tour-save': {
    guide: guide('tour-save'),
    start: async (p) => {
      await openPlanner(p);
      await drawDraft(p);
    },
    steps: [
      {
        target: nameField,
        act: async (p) => {
          await typeInto(p, nameField(p), PLANNER_TOURS.drawn);
          await settle(p);
        },
      },
      { target: (p) => p.getByRole('heading', { name: 'New tour', exact: true }), act: waitRouted },
      {
        target: saveButton,
        act: async (p) => {
          await expect(saveButton(p)).toBeEnabled({ timeout: 30_000 });
          await saveButton(p).click();
          await expect(p.getByRole('heading', { name: 'Edit tour', exact: true })).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
      { target: (p) => tourRow(p, PLANNER_TOURS.drawn) },
    ],
    cleanup: async (p) => {
      await backToNeutral(p);
      await removeTour(p.request, await tripIdOf(p.request), PLANNER_TOURS.drawn);
    },
  },

  'tour-edit-saved': {
    guide: guide('tour-edit-saved'),
    start: async (p) => {
      await ensureSpare(p.request, { reset: true });
      await openPlanner(p);
    },
    steps: [
      {
        target: (p) => tourRow(p, PLANNER_TOURS.spare),
        act: async (p) => {
          await openSaved(p, PLANNER_TOURS.spare);
          await openDetails(p);
        },
      },
      {
        target: description,
        act: async (p) => {
          await typeInto(
            p,
            description(p),
            'From the hut across the Cisles meadows to the Col Raiser gondola, about an hour and a half.'
          );
          await settle(p);
        },
      },
      {
        target: saveButton,
        act: async (p) => {
          await expect(saveButton(p)).toBeEnabled({ timeout: 30_000 });
          await saveButton(p).click();
          await expect(p.getByText('Tour saved').first()).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
      {
        target: backToTours,
        act: async (p) => {
          await backToTours(p).click();
          await expect(planNew(p)).toBeVisible();
          await settle(p);
        },
      },
    ],
    cleanup: async (p) => {
      await backToNeutral(p);
      await ensureSpare(p.request, { reset: true });
    },
  },

  'tour-summary-profile': {
    guide: guide('tour-summary-profile'),
    start: openSpare,
    steps: [
      { target: summaryCard },
      { target: (p) => summaryCard(p).getByRole('button', { name: 'How the walking time is estimated', exact: true }) },
      { target: (p) => p.locator('#tour-planner-editable-elevation-profile') },
      {
        target: (p) => p.getByRole('button', { name: 'Collapse elevation profile', exact: true }),
        act: async (p) => {
          await p.getByRole('button', { name: 'Collapse elevation profile', exact: true }).click();
          await expect(p.getByRole('button', { name: 'Expand elevation profile', exact: true })).toBeVisible();
        },
      },
    ],
    cleanup: async (p) => {
      const expand = p.getByRole('button', { name: 'Expand elevation profile', exact: true });
      if (await expand.isVisible().catch(() => false)) await expand.click();
      await backToNeutral(p);
    },
  },

  'tour-list-manage': {
    guide: guide('tour-list-manage'),
    start: openPlanner,
    steps: [
      {
        target: totalsCard,
        act: async (p) => {
          await totalsCard(p).getByTestId('tour-scope-toggle').click();
          await expect(totalsCard(p).getByTestId('tour-scope-hike')).toBeVisible();
          await settle(p);
        },
      },
      {
        prepare: async (p) => {
          await tourRow(p, TOUR_NAMES.mtb).hover();
        },
        target: (p) => toursRail(p).getByRole('button', { name: `Add to day: ${TOUR_NAMES.mtb}`, exact: true }),
        act: async (p) => {
          await toursRail(p)
            .getByRole('button', { name: `Add to day: ${TOUR_NAMES.mtb}`, exact: true })
            .click();
          await expect(openMenu(p)).toBeVisible();
          await settle(p);
        },
      },
      {
        target: openMenu,
        act: async (p) => {
          await openMenu(p)
            .getByRole('button', { name: /^Day 10\b/ })
            .click();
          await expect(tourRow(p, TOUR_NAMES.mtb).getByTestId('tour-days-badge')).toBeVisible({ timeout: 15_000 });
          await settle(p);
        },
      },
      {
        target: filterButton,
        act: async (p) => {
          await filterButton(p).click();
          await expect(filterMenu(p)).toBeVisible();
        },
      },
      {
        target: filterMenu,
        act: async (p) => {
          await filterMenu(p)
            .getByRole('button', { name: /^Unplanned/ })
            .click();
          await p.keyboard.press('Escape');
          await expect(filterMenu(p)).toHaveCount(0);
          await settle(p);
        },
      },
    ],
    cleanup: async (p) => {
      const tripId = await tripIdOf(p.request);
      const mtb = await tourIdOf(p.request, tripId, TOUR_NAMES.mtb);
      if (mtb) await offDay(p.request, tripId, 9, mtb);
      await forgetPlannerState(p);
    },
  },

  'tour-delete': {
    guide: guide('tour-delete'),
    start: async (p) => {
      await ensureOldPlan(p.request);
      await openPlanner(p);
    },
    steps: [
      {
        prepare: async (p) => {
          await tourRow(p, PLANNER_TOURS.old).hover();
        },
        target: (p) => toursRail(p).getByRole('button', { name: `Delete ${PLANNER_TOURS.old}`, exact: true }),
        act: async (p) => {
          await toursRail(p)
            .getByRole('button', { name: `Delete ${PLANNER_TOURS.old}`, exact: true })
            .click();
          await expect(confirmDialog(p)).toBeVisible();
          await settle(p);
        },
      },
      {
        target: confirmDialog,
        act: async (p) => {
          await confirmDialog(p).getByRole('button', { name: 'Delete permanently', exact: true }).click();
          await expect(tourRow(p, PLANNER_TOURS.old)).toHaveCount(0, { timeout: 15_000 });
          await settle(p);
        },
      },
    ],
    cleanup: async (p) => {
      await removeTour(p.request, await tripIdOf(p.request), PLANNER_TOURS.old);
      await forgetPlannerState(p);
    },
  },

  'tour-saved-elsewhere': {
    guide: guide('tour-saved-elsewhere'),
    start: async (p) => {
      await ensureSpare(p.request, { reset: true });
      await openSpare(p);
      await openDetails(p);
      await typeInto(p, description(p), 'From the hut across the Cisles meadows, with lunch at the hut first.');
      // Someone else saves the same tour meanwhile; the websocket brings the newer revision in.
      await saveSpareElsewhere(p.request);
      await expect(remoteNotice(p)).toBeVisible({ timeout: 30_000 });
      await settle(p);
    },
    steps: [
      { target: remoteNotice },
      { target: (p) => remoteNotice(p).getByRole('button', { name: 'Load newer', exact: true }) },
      {
        target: saveButton,
        act: async (p) => {
          await saveButton(p).click();
          await expect(conflictDialog(p)).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
      {
        target: conflictDialog,
        act: async (p) => {
          await p.getByTestId('tour-conflict-reload').click();
          await expect(conflictDialog(p)).toHaveCount(0);
          await waitRouted(p);
        },
      },
    ],
    cleanup: async (p) => {
      await backToNeutral(p);
      await ensureSpare(p.request, { reset: true });
    },
  },
};

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  await ensureToursFixtures(request);
  await ensureSpare(request, { reset: true });
  const tripId = await tripIdOf(request);
  await request.delete(`/api/trips/${tripId}/tour-draft`).catch(() => undefined);
});

test.afterAll(async ({ request }) => {
  // The spare and what the guides made from it stay out of every other screen's pictures.
  const tripId = await tripIdOf(request);
  for (const name of Object.values(PLANNER_TOURS)) await removeTour(request, tripId, name);
  await request.delete(`/api/trips/${tripId}/tour-draft`).catch(() => undefined);
});

test('every registered tour planner guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripTourPlannerContext.guides].sort());
});

test('hero: trip-tour-planner', async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await captureHero(page, tripTourPlannerContext.id, openPlanner);
});

for (const id of tripTourPlannerContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await captureGuide(page, SCRIPTS[id]);
  });
}
