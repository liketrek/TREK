import { expect, test, type Locator, type Page } from '@playwright/test';
import { tripToursContext, tripToursGuides } from '../../src/help/contexts/tripTours';
import type { HelpGuide } from '../../src/help/types';
import {
  backOnDay,
  clearHiddenTours,
  ensureLunch,
  LUNCH,
  modeTab,
  offAllDays,
  openToursPlan,
  removeByName,
  resetTime,
  tourIdOf,
} from './fixtures-trip-tours';
import { beat, captureGuide, captureHero, dragLoop, settle, VIEWPORT, type GuideScript } from './guide';
import { ensureToursFixtures, TOUR_GPX, TOUR_NAMES, tourGpxFixture, type ToursFixtures } from './tour-fixtures';
import { closeMenu, modal, selectDay } from './trip-shared';

/**
 * Actions for the tours on the Plan tab, keyed by the ids in
 * `src/help/contexts/tripTours.ts`. They run on "Summer in the Dolomites"
 * (`ensureToursFixtures`): ten days, the tours on days 1 to 9, day 10 empty,
 * and two tours on no day (the MTB loop and the recorded Seceda walk), which
 * the add-to-day guide puts on day 10. What a guide writes it takes back in
 * `cleanup`: the fixtures never rebuild a tour that exists, so a tour left on
 * the wrong day would stay there for every later picture.
 */

const guide = (id: string): HelpGuide => {
  const g = tripToursGuides.find((x) => x.id === id);
  if (!g) throw new Error(`no registered guide "${id}"`);
  return g;
};

let fx: ToursFixtures;

// ── Where things are ──────────────────────────────────────────────────────────

/** The list of the right column; its rows are options named by the tour. */
const tourList = (page: Page) => page.getByRole('listbox', { name: 'Tours', exact: true });
const tourRow = (page: Page, name: string) => tourList(page).getByRole('option', { name, exact: true });
const importButton = (page: Page) => page.getByRole('button', { name: 'Import GPX or KML' });
/** The head band of the list: the import, the filter and the hidden-on-the-map line. */
const listHead = (page: Page) =>
  page
    .locator('div.border-b.border-edge-faint')
    .filter({ has: importButton(page) })
    .last();
const filterButton = (page: Page) => listHead(page).getByRole('button', { name: 'Show', exact: true });
const filterMenu = (page: Page) => listHead(page).getByRole('group', { name: 'Show', exact: true });
/** A day card's head band (`.dp-day-header`, a div with the button role). */
const dayHeader = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^${n} .*Day ${n} `) });
const dayCard = (page: Page, n: number) => dayHeader(page, n).locator('xpath=..');
/**
 * A row of the days column. Its accessible name opens with the label of the
 * lock on its picture, a tour's tile included, which tells it from the note and
 * booking rows beside it.
 */
const planRow = (page: Page, name: string) =>
  page
    .getByRole('button', { name: /^(Keep position during route optimization|Click to unlock) / })
    .filter({ hasText: name })
    .first();
/** The menu of a row of the days column or of a tour's +; a tooltip shares the popover class. */
const menu = (page: Page) => page.locator('.trek-popover-enter:not([role="tooltip"])').last();
/** The menu the round + of a tour row opens (a ContextMenu, role menu). */
const dayMenu = (page: Page) => page.getByRole('menu').last();
/** The tour's card over the map (DetailShell), known by its Trip days section. */
const tourCard = (page: Page) =>
  page
    .locator('div.rounded-\\[20px\\]')
    .filter({ has: page.getByText('Trip days', { exact: true }) })
    .first();
const previewDialog = (page: Page) => page.getByRole('dialog').filter({ has: page.getByTestId('gpx-preview-import') });

async function rowMenu(page: Page, name: string): Promise<void> {
  const row = planRow(page, name);
  await row.scrollIntoViewIfNeeded();
  await row.hover();
  await row.getByRole('button', { name: 'More options' }).click();
  await expect(menu(page).getByRole('button', { name: 'Edit', exact: true })).toBeVisible();
  await beat(page, 300);
}

async function hoverRow(page: Page, name: string): Promise<void> {
  await tourRow(page, name).scrollIntoViewIfNeeded();
  await tourRow(page, name).hover();
  await beat(page, 200);
}

const id = async (page: Page, name: string): Promise<number> => {
  const found = await tourIdOf(page.request, fx.tripId, name);
  if (!found) throw new Error(`the tour "${name}" is missing: see the [tour-fixtures] warnings`);
  return found;
};

const only = (target: (p: Page) => Locator) => ({ target });
const openTours = (p: Page) => openToursPlan(p, { tours: true }).then(() => undefined);

/**
 * The MTB loop and the Seceda walk on no day, as the fixtures made them. A
 * guide that failed before its cleanup leaves them on day 10, and then the
 * Unplanned filter holds the walk alone and the add-to-day picture shows a
 * day that is no longer empty.
 */
async function noDayTours(page: Page): Promise<void> {
  for (const name of [TOUR_NAMES.mtb, TOUR_NAMES.recorded]) {
    await offAllDays(page.request, fx.tripId, fx.dayIds, await id(page, name));
  }
}

const SCRIPTS: Record<string, GuideScript> = {
  'tour-show-list': {
    guide: guide('tour-show-list'),
    start: (p) => openToursPlan(p).then(() => undefined),
    steps: [
      {
        target: (p) => modeTab(p, 'Tours'),
        act: async (p) => {
          await modeTab(p, 'Tours').click();
          await expect(tourRow(p, TOUR_NAMES.hutToHut)).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
      only((p) => tourRow(p, TOUR_NAMES.hutToHut)),
      {
        target: (p) => tourRow(p, TOUR_NAMES.hutToHut),
        act: async (p) => {
          await tourRow(p, TOUR_NAMES.hutToHut).click();
          await expect(tourCard(p)).toBeVisible({ timeout: 15_000 });
          await settle(p);
        },
      },
      only(tourCard),
      only((p) => modeTab(p, 'Places')),
    ],
  },
  'tour-add-to-day': {
    guide: guide('tour-add-to-day'),
    start: async (p) => {
      await noDayTours(p);
      await openTours(p);
    },
    steps: [
      {
        prepare: (p) => hoverRow(p, TOUR_NAMES.mtb),
        target: (p) => tourRow(p, TOUR_NAMES.mtb).getByRole('button', { name: 'Add to day', exact: true }),
        act: async (p) => {
          await tourRow(p, TOUR_NAMES.mtb).getByRole('button', { name: 'Add to day', exact: true }).click();
          await expect(dayMenu(p)).toBeVisible();
          await settle(p);
        },
      },
      {
        target: dayMenu,
        act: async (p) => {
          await dayMenu(p)
            .getByRole('button', { name: /^Day 10,/ })
            .click();
          await expect(tourRow(p, TOUR_NAMES.mtb).getByTestId('tour-days-badge')).toBeVisible({ timeout: 15_000 });
          await settle(p);
        },
      },
      only((p) => tourRow(p, TOUR_NAMES.mtb)),
      {
        // Day 10 is the last card of the days column, below the fold when the
        // trip opens, and a drop can only land where the pointer can reach.
        prepare: async (p) => {
          await dayHeader(p, 10).scrollIntoViewIfNeeded();
          await settle(p);
        },
        target: (p) => tourRow(p, TOUR_NAMES.recorded),
        dropTo: (p) => dayHeader(p, 10),
        clip: async (p, frame) => {
          await dragLoop(p, tourRow(p, TOUR_NAMES.recorded), dayHeader(p, 10), frame);
          await expect(dayCard(p, 10).getByText(TOUR_NAMES.recorded).first()).toBeVisible({ timeout: 15_000 });
          await settle(p);
          await frame();
          await frame();
        },
      },
      {
        // The hut trek has three stages, so the day it is given asks how next.
        prepare: async (p) => {
          await hoverRow(p, TOUR_NAMES.hutToHut);
          await tourRow(p, TOUR_NAMES.hutToHut).getByRole('button', { name: 'Add to day', exact: true }).click();
          await expect(dayMenu(p)).toBeVisible();
          await dayMenu(p)
            .getByRole('button', { name: /^Day 8,/ })
            .click();
          await expect(dayMenu(p).getByRole('button', { name: /^Stages from this day on/ })).toBeVisible({
            timeout: 10_000,
          });
          await settle(p);
        },
        target: dayMenu,
        // Nothing chosen: the hut trek keeps its days 4 to 6.
        act: closeMenu,
      },
    ],
    cleanup: noDayTours,
  },
  'tour-day-times': {
    guide: guide('tour-day-times'),
    start: async (p) => {
      await ensureLunch(p.request, fx.tripId, fx.dayIds[1]);
      await openTours(p);
    },
    steps: [
      {
        prepare: (p) => rowMenu(p, TOUR_NAMES.horse),
        target: menu,
        act: async (p) => {
          await menu(p).getByRole('button', { name: 'Edit', exact: true }).click();
          await expect(modal(p).getByText('Start', { exact: true })).toBeVisible({ timeout: 10_000 });
          await settle(p);
        },
      },
      {
        prepare: async (p) => {
          // The time pickers are text fields that parse on blur.
          const times = modal(p).getByPlaceholder(/^(00:00|2:30 PM)$/);
          await times.first().fill('10:30');
          await times.first().blur();
          await expect(modal(p).getByTestId('tour-day-end-hint')).toBeVisible();
          await beat(p, 300);
        },
        // The two fields and the worked-out end under them share one block.
        target: (p) => modal(p).getByTestId('tour-day-end-hint').locator('xpath=..'),
      },
      {
        target: (p) => modal(p).getByRole('button', { name: 'Update', exact: true }),
        act: async (p) => {
          await modal(p).getByRole('button', { name: 'Update', exact: true }).click();
          await expect(modal(p)).toHaveCount(0);
          await expect(planRow(p, TOUR_NAMES.horse).getByText(/10:30/)).toBeVisible({ timeout: 15_000 });
          await settle(p);
        },
      },
      only((p) => planRow(p, TOUR_NAMES.horse).getByTestId('tour-day-overrun')),
    ],
    cleanup: async (p) => {
      await resetTime(p.request, fx.tripId, fx.dayIds[1], await id(p, TOUR_NAMES.horse), '10:00');
      await removeByName(p.request, fx.tripId, LUNCH.name);
    },
  },
  'tour-remove-from-day': {
    guide: guide('tour-remove-from-day'),
    start: openTours,
    steps: [
      {
        prepare: (p) => rowMenu(p, TOUR_NAMES.run),
        target: (p) => menu(p).getByRole('button', { name: 'Remove from day', exact: true }),
        act: async (p) => {
          await menu(p).getByRole('button', { name: 'Remove from day', exact: true }).click();
          await expect(planRow(p, TOUR_NAMES.run)).toHaveCount(0, { timeout: 15_000 });
          await settle(p);
        },
      },
      only((p) => tourRow(p, TOUR_NAMES.run)),
      {
        // The card's day buttons belong to the open day, so day 1 is opened first.
        prepare: async (p) => {
          await selectDay(p, 1);
          await tourRow(p, TOUR_NAMES.cityWalk).click();
          await expect(tourCard(p).getByRole('button', { name: 'Remove from Day' })).toBeVisible({ timeout: 15_000 });
          await settle(p);
        },
        target: (p) => tourCard(p).getByRole('button', { name: 'Remove from Day' }),
      },
    ],
    cleanup: async (p) => {
      await backOnDay(p.request, fx.tripId, fx.dayIds[7], await id(p, TOUR_NAMES.run), '07:00');
    },
  },
  'tour-filter-list': {
    guide: guide('tour-filter-list'),
    // Under Unplanned the Type group lists the types of the unplanned tours
    // only, so Bike tour is there only while the MTB loop is on no day.
    start: async (p) => {
      await noDayTours(p);
      await openTours(p);
    },
    steps: [
      {
        target: filterButton,
        act: async (p) => {
          await filterButton(p).click();
          await expect(filterMenu(p)).toBeVisible();
          await settle(p);
        },
      },
      {
        target: (p) => filterMenu(p).getByRole('group', { name: 'Status', exact: true }),
        act: async (p) => {
          await filterMenu(p)
            .getByRole('group', { name: 'Status', exact: true })
            .getByRole('button', { name: /^Unplanned/ })
            .click();
          await expect(filterButton(p)).toContainText('Unplanned');
          await settle(p);
        },
      },
      {
        target: filterMenu,
        act: async (p) => {
          await filterMenu(p)
            .getByRole('group', { name: 'Type', exact: true })
            .getByRole('button', { name: /^Bike tour/ })
            .click();
          await expect(tourRow(p, TOUR_NAMES.recorded)).toHaveCount(0);
          await p.keyboard.press('Escape');
          await expect(filterMenu(p)).toHaveCount(0);
          await settle(p);
        },
      },
      only(filterButton),
    ],
  },
  'tour-hide-on-map': {
    guide: guide('tour-hide-on-map'),
    start: async (p) => {
      await openTours(p);
      await clearHiddenTours(p);
    },
    steps: [
      {
        prepare: (p) => hoverRow(p, TOUR_NAMES.roadBike),
        target: (p) => tourRow(p, TOUR_NAMES.roadBike).getByRole('button', { name: 'Hide on the map' }),
        act: async (p) => {
          await tourRow(p, TOUR_NAMES.roadBike).getByRole('button', { name: 'Hide on the map' }).click();
          await expect(tourRow(p, TOUR_NAMES.roadBike).getByRole('button', { name: 'Show on the map' })).toBeVisible();
          // Off the row, so the picture shows the eye a hidden tour keeps.
          await p.mouse.move(VIEWPORT.width / 2, VIEWPORT.height / 2);
          await settle(p);
        },
      },
      {
        target: (p) => tourRow(p, TOUR_NAMES.roadBike),
        hover: async (p) => {
          await tourRow(p, TOUR_NAMES.roadBike).getByRole('button', { name: 'Show on the map' }).hover();
        },
      },
      {
        target: (p) => listHead(p).getByRole('status'),
        act: async (p) => {
          await listHead(p).getByRole('button', { name: 'Show all', exact: true }).click();
          await expect(listHead(p).getByRole('status')).toHaveCount(0);
          await settle(p);
        },
      },
    ],
    cleanup: clearHiddenTours,
  },
  'tour-import-plan-tab': {
    guide: guide('tour-import-plan-tab'),
    start: async (p) => {
      await removeByName(p.request, fx.tripId, TOUR_GPX.rasciesa.name);
      await openToursPlan(p);
    },
    steps: [
      {
        target: (p) => modeTab(p, 'Tours'),
        act: async (p) => {
          await modeTab(p, 'Tours').click();
          await expect(importButton(p)).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
      {
        target: importButton,
        act: async (p) => {
          const file = await tourGpxFixture('rasciesa');
          const chooser = p.waitForEvent('filechooser');
          await importButton(p).click();
          await (await chooser).setFiles(file);
          await expect(previewDialog(p)).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
      {
        target: (p) =>
          previewDialog(p)
            .locator('section')
            .filter({ has: p.getByText('Import as', { exact: true }) })
            .first(),
        act: async (p) => {
          await previewDialog(p).getByTestId('gpx-preview-import').click();
          await expect(previewDialog(p)).toHaveCount(0, { timeout: 30_000 });
          await expect(tourRow(p, TOUR_GPX.rasciesa.name)).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
    ],
    cleanup: (p) => removeByName(p.request, fx.tripId, TOUR_GPX.rasciesa.name),
  },
};

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  fx = await ensureToursFixtures(request);
});

test('every registered Plan-tab tours guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripToursContext.guides].sort());
});

test('hero: trip-tours', async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await captureHero(page, tripToursContext.id, openTours);
});

for (const gid of tripToursContext.guides) {
  test(`pictures: ${gid}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await captureGuide(page, SCRIPTS[gid]);
  });
}
