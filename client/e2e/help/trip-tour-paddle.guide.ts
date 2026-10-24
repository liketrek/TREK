import { expect, test, type Locator, type Page } from '@playwright/test';
import { tripTourPaddleContext, tripTourPaddleGuides } from '../../src/help/contexts/tripTourPaddle';
import type { HelpGuide } from '../../src/help/types';
import {
  CARRY_COPY,
  deleteToursWhere,
  deleteTripsNamed,
  ensureCarryCopy,
  ensureWindTrip,
  finishMapMove,
  forgetPaddleDraft,
  forgetPaddleDraftBeforeLoad,
  holdPaddleDownloads,
  isPaddleImport,
  openToursOf,
  PADDLE_TOUR,
  paddleGpxFixture,
  pointOnLine,
  restorePaddleDownloads,
  summerTripId,
  WIND_TRIP,
} from './fixtures-trip-tour-paddle';
import { captureGuide, captureHero, settle, VIEWPORT, type GuideScript } from './guide';
import { ensureToursFixtures, openTourTrip } from './tour-fixtures';

/**
 * Actions for paddle tours on the Tours tab, keyed by the ids in
 * `src/help/contexts/tripTourPaddle.ts`. They run on "Rowing round Lago di
 * Braies", the boat tour of "Summer in the Dolomites" (`ensureToursFixtures`):
 * four legs drawn by hand along the shore, Boat Other, Water Lake, 3 km/h.
 *
 * The editing guides never save: what they change is a draft, which the
 * planner keeps on the account and restores on the next page load, so
 * `cleanup` discards it and every guide drops it again before it opens its
 * page and after it ends, failed or not (`forgetPaddleDraft`). The checklist guide saves on a
 * copy (`ensureCarryCopy`), the wind guide works in a short trip from
 * tomorrow (`ensureWindTrip`), and the import guide brings in a recorded
 * track; each takes its own away again, and `afterAll` does so once more for
 * a run that failed half way. No water data downloads while this file runs
 * (`holdPaddleDownloads`), so a leg TREK cannot plan stays unplanned and says so.
 */

const guide = (id: string): HelpGuide => {
  const g = tripTourPaddleGuides.find((x) => x.id === id);
  if (!g) throw new Error(`no registered guide "${id}"`);
  return g;
};

let gpxFile = '';

// ── Where things are ──────────────────────────────────────────────────────────

/** The editor's left column, a section named after what it is for. */
const editorRail = (p: Page) => p.getByRole('region', { name: 'Plan a tour' });
const planNewTour = (p: Page) => p.getByRole('button', { name: 'Plan new tour', exact: true });
const typeSelect = (p: Page) => editorRail(p).getByTestId('tour-type-select');
const kayakOption = (p: Page) => p.getByTestId('tour-type-option-kayak');
const paddleFields = (p: Page) => editorRail(p).getByTestId('tour-planner-paddle-fields');
const lakeStyle = (p: Page) => editorRail(p).getByTestId('tour-planner-lake-style');
const speedInput = (p: Page) => editorRail(p).locator('#tour-planner-paddle-speed');
const tourList = (p: Page) => p.getByRole('listbox', { name: 'Tours of this trip' });
const tourRow = (p: Page, name: string | RegExp) =>
  tourList(p).getByRole('option', typeof name === 'string' ? { name, exact: true } : { name });
/** A waypoint row by the name the fixture gave the point. */
const pointRow = (p: Page, name: string) =>
  editorRail(p)
    .getByTestId('tour-planner-waypoint-row')
    .filter({ has: p.getByTestId('tour-planner-waypoint-name').getByText(name, { exact: true }) })
    .first();
const moreActions = (p: Page, name: string) =>
  pointRow(p, name).getByRole('button', { name: 'More actions', exact: true });
/** The point's name, inside the part of the row whose hover brings its controls out. */
const pointName = (p: Page, name: string) =>
  pointRow(p, name).getByTestId('tour-planner-waypoint-name').getByText(name, { exact: true });
const menu = (p: Page) => p.getByRole('menu');
const menuItem = (p: Page, label: string) => menu(p).getByRole('button', { name: label, exact: true });
const freeLeg = (p: Page) => editorRail(p).getByTestId('tour-planner-free-leg').first();
const legFailure = (p: Page) => editorRail(p).getByTestId('tour-planner-leg-failure').first();
const routeOnWater = (p: Page) => editorRail(p).getByTestId('tour-planner-route-on-water');
const portageCard = (scope: Page | Locator) => scope.getByTestId('tour-planner-portage-leg').first();
const lockCard = (scope: Page | Locator) => scope.getByTestId('tour-planner-lock').first();
const timeCard = (p: Page) => editorRail(p).getByRole('region', { name: 'Time estimate' });
const windCard = (p: Page) => editorRail(p).getByRole('region', { name: 'Wind' });
const checkCard = (p: Page) => editorRail(p).getByRole('region', { name: 'Checklist' });
const safetyRow = (p: Page) => editorRail(p).getByRole('button', { name: /^Paddling has risks/ });
const safetyDialog = (p: Page) => p.getByRole('dialog', { name: 'Safety on the water' });
const addMenu = (p: Page) => p.getByRole('group', { name: 'Add tour', exact: true });
const previewDialog = (p: Page) => p.getByRole('dialog').filter({ has: p.getByTestId('gpx-preview-import') });
const marksCard = (p: Page) => p.getByTestId('track-marks-card');

// ── Getting there ─────────────────────────────────────────────────────────────

/** Open a paddle tour of the list in the editor and wait for its points. */
async function openPaddle(p: Page, name: string = PADDLE_TOUR): Promise<void> {
  await expect(tourRow(p, name)).toBeVisible({ timeout: 30_000 });
  await tourRow(p, name).click();
  await expect(editorRail(p).getByRole('heading', { name: 'Edit tour', exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(pointRow(p, 'Under the Seekofel')).toBeVisible({ timeout: 20_000 });
  await finishMapMove(p);
}

async function openPaddleScreen(p: Page): Promise<void> {
  await openTourTrip(p, { tab: 'tour-planner' });
  await openPaddle(p);
}

/** The waypoint row's menu: its controls come out on hover, as a plan row's do. */
async function openMenu(p: Page, point: string): Promise<void> {
  // Centred first, so the click on More actions needs no scroll that slides the row from under the pointer.
  await pointRow(p, point).evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await pointName(p, point).hover();
  await moreActions(p, point).click();
  await expect(menu(p)).toBeVisible();
  await settle(p);
}

/** Carrying on land asks the public walking router for the path; it answers or gives up within a minute. */
async function waitForPortageWay(p: Page): Promise<void> {
  await expect(editorRail(p).getByText('Looking for a path', { exact: true })).toHaveCount(0, { timeout: 60_000 });
  await settle(p);
}

async function carryFrom(p: Page, point: string): Promise<void> {
  await openMenu(p, point);
  await menuItem(p, 'Carry the boat from here').click();
  await expect(portageCard(editorRail(p))).toBeVisible({ timeout: 15_000 });
  await settle(p);
  await waitForPortageWay(p);
}

/** A minutes field commits when it is left. */
async function typeMinutes(field: Locator, value: string): Promise<void> {
  await field.fill(value);
  await field.press('Enter');
}

async function openStop(card: Locator): Promise<void> {
  const head = card.getByRole('button').first();
  if ((await head.getAttribute('aria-expanded')) !== 'true') await head.click();
  await expect(head).toHaveAttribute('aria-expanded', 'true');
}

async function lockAt(p: Page, point: string, times?: { wait: string; passage: string }): Promise<void> {
  await openMenu(p, point);
  await menuItem(p, 'Lock at this point').click();
  await expect(lockCard(editorRail(p))).toBeVisible({ timeout: 15_000 });
  if (times) {
    await openStop(lockCard(editorRail(p)));
    await typeMinutes(p.getByTestId('tour-planner-lock-wait'), times.wait);
    await typeMinutes(p.getByTestId('tour-planner-lock-transit'), times.passage);
  }
  await settle(p);
}

/** Drop what a guide changed in the editor; nothing of it was saved. */
async function discardEdits(p: Page): Promise<void> {
  await p.keyboard.press('Escape').catch(() => undefined);
  const discard = editorRail(p).getByRole('button', { name: 'Discard', exact: true });
  if (!(await discard.isVisible().catch(() => false)) || !(await discard.isEnabled().catch(() => false))) return;
  await discard.click();
  const confirm = p.getByRole('button', { name: 'Discard changes', exact: true });
  if (await confirm.isVisible({ timeout: 3_000 }).catch(() => false)) await confirm.click();
  await expect(planNewTour(p)).toBeVisible({ timeout: 15_000 });
}

async function removeImports(p: Page): Promise<void> {
  await deleteToursWhere(p.request, await summerTripId(p.request), isPaddleImport);
}

const only = (target: (p: Page) => Locator) => ({ target });

/**
 * The step that rings a row's More actions button. Its controls are only in
 * the layout while the pointer is on the row, and the picture centres the
 * button by scrolling the rail, which slides the row out from under a pointer
 * put there before. So the row is centred first, and after the scroll the
 * pointer goes back onto its name and then onto the button the text names.
 */
const pointAtMoreActions = (point: string) => ({
  prepare: async (p: Page) => {
    await pointRow(p, point).evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
    await pointName(p, point).hover();
  },
  target: (p: Page) => moreActions(p, point),
  hover: async (p: Page) => {
    await pointName(p, point).hover();
    await moreActions(p, point).hover();
  },
  act: async (p: Page) => {
    await moreActions(p, point).click();
    await expect(menu(p)).toBeVisible();
    await settle(p);
  },
});

// ── The guides ────────────────────────────────────────────────────────────────

const SCRIPTS: Record<string, GuideScript> = {
  'tour-paddle-setup': {
    guide: guide('tour-paddle-setup'),
    start: async (p) => {
      await openTourTrip(p, { tab: 'tour-planner' });
    },
    steps: [
      {
        target: planNewTour,
        act: async (p) => {
          await planNewTour(p).click();
          await expect(typeSelect(p)).toBeVisible({ timeout: 15_000 });
          await settle(p);
        },
      },
      {
        prepare: async (p) => {
          await typeSelect(p).click();
          await expect(kayakOption(p)).toBeVisible();
          await settle(p);
        },
        target: (p) => p.getByRole('group', { name: 'Tour type', exact: true }),
        hover: async (p) => {
          await kayakOption(p).hover();
        },
        act: async (p) => {
          await kayakOption(p).click();
          await expect(paddleFields(p)).toBeVisible();
          await settle(p);
        },
      },
      {
        target: (p) => paddleFields(p).getByRole('group', { name: 'Boat', exact: true }),
        act: async (p) => {
          const kayak = paddleFields(p)
            .getByRole('group', { name: 'Boat', exact: true })
            .getByRole('button', { name: 'Kayak', exact: true });
          await kayak.click();
          await expect(kayak).toHaveAttribute('aria-pressed', 'true');
          await settle(p);
        },
      },
      {
        target: (p) => paddleFields(p).getByRole('group', { name: 'Water', exact: true }),
        act: async (p) => {
          await paddleFields(p)
            .getByRole('group', { name: 'Water', exact: true })
            .getByRole('button', { name: 'Lake', exact: true })
            .click();
          await expect(lakeStyle(p)).toBeVisible();
          await settle(p);
        },
      },
      {
        target: lakeStyle,
        act: async (p) => {
          await lakeStyle(p).getByRole('button', { name: 'Near the shore', exact: true }).click();
          await expect(lakeStyle(p)).toContainText('Stays near the bank');
          await settle(p);
        },
      },
      {
        // The label row, the field and the line under it: the block above the input's own div.
        target: (p) => speedInput(p).locator('xpath=ancestor::div[2]'),
        act: async (p) => {
          await speedInput(p).fill('5');
          await speedInput(p).press('Enter');
          await expect(paddleFields(p).getByText('Own speed', { exact: true })).toBeVisible();
          await settle(p);
        },
      },
      only((p) => editorRail(p).getByTestId('tour-planner-add-point')),
    ],
    cleanup: discardEdits,
  },

  'tour-paddle-water-route': {
    guide: guide('tour-paddle-water-route'),
    start: openPaddleScreen,
    steps: [
      only(freeLeg),
      pointAtMoreActions('Under the Seekofel'),
      {
        target: (p) => menuItem(p, 'Plan the next leg on the water'),
        act: async (p) => {
          await menuItem(p, 'Plan the next leg on the water').click();
          // The water router answers at once; the region lookup behind it may take a few seconds.
          await expect(legFailure(p)).toBeVisible({ timeout: 90_000 });
          await settle(p);
        },
      },
      {
        target: legFailure,
        act: async (p) => {
          await legFailure(p).getByRole('button', { name: 'Draw straight', exact: true }).click();
          await expect(editorRail(p).getByTestId('tour-planner-leg-failure')).toHaveCount(0, { timeout: 15_000 });
          await settle(p);
        },
      },
      {
        target: routeOnWater,
        act: async (p) => {
          await routeOnWater(p).click();
          await expect(legFailure(p)).toBeVisible({ timeout: 90_000 });
          await settle(p);
        },
      },
    ],
    cleanup: discardEdits,
  },

  'tour-paddle-portage': {
    guide: guide('tour-paddle-portage'),
    start: openPaddleScreen,
    steps: [
      pointAtMoreActions('South shore'),
      {
        target: (p) => menuItem(p, 'Carry the boat from here'),
        act: async (p) => {
          await menuItem(p, 'Carry the boat from here').click();
          await expect(portageCard(editorRail(p))).toBeVisible({ timeout: 15_000 });
          await settle(p);
        },
      },
      {
        target: (p) => portageCard(editorRail(p)),
        act: async (p) => {
          await openStop(portageCard(editorRail(p)));
          await expect(p.getByTestId('tour-planner-portage-way')).toBeVisible();
          await settle(p);
        },
      },
      {
        target: (p) => p.getByTestId('tour-planner-portage-way'),
        act: async (p) => {
          await waitForPortageWay(p);
          const follow = p
            .getByTestId('tour-planner-portage-way')
            .getByRole('button', { name: 'Follow the path', exact: true });
          if ((await follow.getAttribute('aria-pressed')) !== 'true') await follow.click();
          await waitForPortageWay(p);
        },
      },
      {
        target: (p) => p.getByTestId('tour-planner-portage-extra'),
        act: async (p) => {
          await typeMinutes(p.getByTestId('tour-planner-portage-extra'), '15');
          await expect(portageCard(editorRail(p))).toContainText('+15 min');
          await settle(p);
        },
      },
    ],
    cleanup: discardEdits,
  },

  'tour-paddle-lock': {
    guide: guide('tour-paddle-lock'),
    start: openPaddleScreen,
    steps: [
      pointAtMoreActions('Chapel'),
      {
        target: (p) => menuItem(p, 'Lock at this point'),
        act: async (p) => {
          await menuItem(p, 'Lock at this point').click();
          await expect(lockCard(editorRail(p))).toContainText('Time missing', { timeout: 15_000 });
          await settle(p);
        },
      },
      {
        target: (p) => lockCard(editorRail(p)),
        act: async (p) => {
          await openStop(lockCard(editorRail(p)));
          await expect(p.getByTestId('tour-planner-lock-wait')).toBeVisible();
          await settle(p);
        },
      },
      {
        target: (p) => lockCard(editorRail(p)),
        act: async (p) => {
          await typeMinutes(p.getByTestId('tour-planner-lock-wait'), '10');
          await typeMinutes(p.getByTestId('tour-planner-lock-transit'), '5');
          await expect(lockCard(editorRail(p))).toContainText('15 min');
          await settle(p);
        },
      },
    ],
    cleanup: discardEdits,
  },

  'tour-paddle-time': {
    guide: guide('tour-paddle-time'),
    start: async (p) => {
      await openPaddleScreen(p);
      // One carry and one lock without times: the card then has every row it can show, and a gap to name.
      // The lock goes on a point the carry does not touch: a lock at either end of the portage is carried
      // round, and its times then drop out of the estimate, so the card would name no gap.
      await carryFrom(p, 'South shore');
      await lockAt(p, 'Under the Seekofel');
      await expect(timeCard(p)).toBeVisible();
    },
    steps: [
      only(timeCard),
      only((p) => timeCard(p).getByTestId('paddle-route-strip')),
      only((p) => timeCard(p).getByTestId('paddle-time-water')),
      {
        target: (p) => timeCard(p).getByTestId('paddle-time-carry'),
        act: async (p) => {
          const chip = timeCard(p).getByTestId('paddle-time-carry-speed');
          await chip.fill('2.5');
          await chip.press('Enter');
          await expect(chip).toHaveValue('2.5');
          await settle(p);
        },
      },
      only((p) => timeCard(p).getByText(/lock has no times yet/)),
    ],
    cleanup: discardEdits,
  },

  'tour-paddle-wind': {
    guide: guide('tour-paddle-wind'),
    start: async (p) => {
      const wind = await ensureWindTrip(p.request);
      await openToursOf(p, wind.tripId);
      await openPaddle(p, wind.name);
      // The forecast is asked of the server, which asks Open-Meteo.
      await expect(windCard(p).getByTestId('paddle-wind-hours')).toBeVisible({ timeout: 60_000 });
      await settle(p);
    },
    steps: [
      only(windCard),
      only((p) => windCard(p).getByTestId('paddle-wind-mean').locator('xpath=ancestor::div[1]')),
      {
        target: (p) => windCard(p).getByTestId('paddle-wind-hours'),
        // A bar around midday, so its tooltip shows in the picture.
        hover: async (p) => {
          await windCard(p).getByTestId('paddle-wind-hours').locator(':scope > span').nth(5).hover();
        },
      },
      {
        target: (p) => windCard(p).getByRole('button', { name: 'What wind means for paddling' }),
        act: async (p) => {
          const fold = windCard(p).getByRole('button', { name: 'What wind means for paddling' });
          await fold.click();
          await expect(fold).toHaveAttribute('aria-expanded', 'true');
          await settle(p);
        },
      },
    ],
    cleanup: async (p) => {
      await deleteTripsNamed(p.request, WIND_TRIP);
    },
  },

  'tour-paddle-checklist': {
    guide: guide('tour-paddle-checklist'),
    start: async (p) => {
      await ensureCarryCopy(p.request);
      await openTourTrip(p, { tab: 'tour-planner' });
      await openPaddle(p, CARRY_COPY);
      await carryFrom(p, 'South shore');
      // Away from the portage, so the lock is passed through and not carried round.
      await lockAt(p, 'Under the Seekofel', { wait: '10', passage: '5' });
      await editorRail(p).getByRole('button', { name: 'Save', exact: true }).click();
      // The checklist is read for the saved route: the carry and the lock come back as rows of their own.
      await expect(checkCard(p).getByTestId('paddle-check-rows')).toBeVisible({ timeout: 90_000 });
      await settle(p);
    },
    steps: [
      only(checkCard),
      only((p) => checkCard(p).getByTestId('paddle-check-data')),
      only((p) => checkCard(p).getByTestId('paddle-check-rows')),
      {
        target: (p) => checkCard(p).getByTestId('paddle-check-rows').getByRole('button').first(),
        act: async (p) => {
          await checkCard(p).getByTestId('paddle-check-rows').getByRole('button').first().click();
          await finishMapMove(p);
        },
      },
      {
        target: safetyRow,
        act: async (p) => {
          await safetyRow(p).click();
          await expect(safetyDialog(p)).toBeVisible();
          await settle(p);
          await p.keyboard.press('Escape');
          await expect(safetyDialog(p)).toHaveCount(0);
        },
      },
    ],
    cleanup: async (p) => {
      await deleteToursWhere(p.request, await summerTripId(p.request), (t) => t.name === CARRY_COPY);
    },
  },

  'tour-paddle-track-marks': {
    guide: guide('tour-paddle-track-marks'),
    start: async (p) => {
      await removeImports(p);
      await openTourTrip(p, { tab: 'tour-planner' });
    },
    steps: [
      {
        prepare: async (p) => {
          await p.getByTestId('tour-rail-add').click();
          await expect(addMenu(p)).toBeVisible();
          await settle(p);
        },
        target: addMenu,
        hover: async (p) => {
          await addMenu(p).getByRole('button', { name: 'Import GPX or KML', exact: true }).hover();
        },
        act: async (p) => {
          const chooser = p.waitForEvent('filechooser');
          await addMenu(p).getByRole('button', { name: 'Import GPX or KML', exact: true }).click();
          await (await chooser).setFiles(gpxFile);
          await expect(previewDialog(p)).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
      {
        prepare: async (p) => {
          await previewDialog(p).getByTestId('tour-type-select').click();
          await kayakOption(p).click();
          await expect(previewDialog(p).getByTestId('gpx-preview-paddle')).toBeVisible();
          await settle(p);
        },
        target: (p) => previewDialog(p).getByTestId('gpx-preview-paddle'),
        act: async (p) => {
          const fields = previewDialog(p).getByTestId('gpx-preview-paddle');
          await fields
            .getByRole('group', { name: 'Boat', exact: true })
            .getByRole('button', { name: 'Kayak', exact: true })
            .click();
          await fields
            .getByRole('group', { name: 'Water', exact: true })
            .getByRole('button', { name: 'Lake', exact: true })
            .click();
          await expect(previewDialog(p).getByTestId('gpx-preview-import')).toBeEnabled();
          await settle(p);
        },
      },
      {
        target: (p) => previewDialog(p).getByTestId('gpx-preview-import'),
        act: async (p) => {
          await previewDialog(p).getByTestId('gpx-preview-import').click();
          await expect(previewDialog(p)).toHaveCount(0, { timeout: 60_000 });
          await expect(tourRow(p, /kayak round/i)).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
      {
        target: (p) => tourRow(p, /kayak round/i),
        act: async (p) => {
          await tourRow(p, /kayak round/i).click();
          await expect(marksCard(p)).toBeVisible({ timeout: 30_000 });
          await finishMapMove(p);
        },
      },
      {
        target: (p) => p.getByTestId('track-marks-pick-portage'),
        act: async (p) => {
          await p.getByTestId('track-marks-pick-portage').click();
          await expect(marksCard(p)).toContainText('Click the line where you get out.');
          const out = await pointOnLine(p, 0.3);
          await p.mouse.click(out.x, out.y);
          await expect(marksCard(p)).toContainText('Now click where you put back in.');
          const back = await pointOnLine(p, 0.36);
          await p.mouse.click(back.x, back.y);
          await expect(portageCard(marksCard(p))).toBeVisible({ timeout: 15_000 });
          await settle(p);
        },
      },
      {
        target: (p) => p.getByTestId('track-marks-pick-lock'),
        act: async (p) => {
          await p.getByTestId('track-marks-pick-lock').click();
          await expect(marksCard(p)).toContainText('Click the line where the lock is.');
          const at = await pointOnLine(p, 0.72);
          await p.mouse.click(at.x, at.y);
          await expect(lockCard(marksCard(p))).toBeVisible({ timeout: 15_000 });
          await settle(p);
        },
      },
      {
        prepare: async (p) => {
          await openStop(lockCard(marksCard(p)));
          await typeMinutes(marksCard(p).getByTestId('tour-planner-lock-wait'), '10');
          await typeMinutes(marksCard(p).getByTestId('tour-planner-lock-transit'), '10');
          await settle(p);
        },
        target: (p) => marksCard(p).getByRole('button', { name: 'Save', exact: true }),
        act: async (p) => {
          await marksCard(p).getByRole('button', { name: 'Save', exact: true }).click();
          // Saved, the card has nothing left to save and its buttons go.
          await expect(marksCard(p).getByRole('button', { name: 'Save', exact: true })).toHaveCount(0, {
            timeout: 30_000,
          });
          await settle(p);
        },
      },
    ],
    cleanup: removeImports,
  },
};

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  await ensureToursFixtures(request);
  await forgetPaddleDraft(request);
  await holdPaddleDownloads(request);
  gpxFile = await paddleGpxFixture(request);
});

test.afterAll(async ({ request }) => {
  // What a guide made for itself, again here so a failed run leaves none of it in the other screens' pictures.
  await deleteTripsNamed(request, WIND_TRIP).catch(() => undefined);
  const tripId = await summerTripId(request).catch(() => null);
  if (tripId !== null) {
    await deleteToursWhere(request, tripId, (t) => t.name === CARRY_COPY || isPaddleImport(t)).catch(() => undefined);
  }
  await forgetPaddleDraft(request).catch(() => undefined);
  await restorePaddleDownloads(request);
});

test('every registered paddle tour guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripTourPaddleContext.guides].sort());
});

test('hero: trip-tour-paddle', async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await forgetPaddleDraftBeforeLoad(page);
  await captureHero(page, tripTourPaddleContext.id, openPaddleScreen);
  await forgetPaddleDraft(page.request);
});

for (const id of tripTourPaddleContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    // Every guide starts without a draft and leaves none, also when it fails before its cleanup runs.
    await forgetPaddleDraftBeforeLoad(page);
    try {
      await captureGuide(page, SCRIPTS[id]);
    } finally {
      await forgetPaddleDraft(page.request).catch(() => undefined);
    }
  });
}
