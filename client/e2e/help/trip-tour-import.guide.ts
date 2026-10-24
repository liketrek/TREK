import { expect, test, type Page } from '@playwright/test';
import { tripTourImportContext, tripTourImportGuides } from '../../src/help/contexts/tripTourImport';
import type { HelpGuide } from '../../src/help/types';
import {
  deleteToursNamed,
  disconnectWanderer,
  ensureWandererConnection,
  forgetTourDraft,
  IMPORTED_NAME,
  importFile,
  RECORDED_NAME,
  restoreRecordedTrack,
  tourNamed,
  tripIdByTitle,
  WANDERER_TRAIL,
} from './fixtures-trip-tour-import';
import { captureGuide, captureHero, settle, VIEWPORT, type GuideScript, type StepAction } from './guide';
import { ensureToursFixtures, openTourTrip, SKI_TRIP, TOUR_NAMES, TOUR_TRIP } from './tour-fixtures';
import { confirmDialog } from './trip-shared';

/**
 * Actions for getting tours into a trip, keyed by the ids in
 * `src/help/contexts/tripTourImport.ts`. They run on the Tours tab of
 * "Summer in the Dolomites" (`ensureToursFixtures`): a GPX file of the
 * Rasciesa balcony walk goes in through the Import preview, the recorded
 * Seceda ridge walk that the fixtures imported is read, planned over and put
 * back, a run of that trip is taken over into the ski week, and the Rasciesa
 * walk comes in once more from a wanderer instance. What a guide adds it
 * deletes again in `cleanup`, and the Seceda walk is always given its
 * recorded track back, because the fixtures never rebuild a tour.
 */

const guide = (id: string): HelpGuide => {
  const g = tripTourImportGuides.find((x) => x.id === id);
  if (!g) throw new Error(`no registered guide "${id}"`);
  return g;
};

// ── Where things are ──────────────────────────────────────────────────────────

/** The right column of the Tours tab. */
const toursRail = (page: Page) => page.getByRole('complementary', { name: 'Tours of this trip' });
const tourRow = (page: Page, name: string) => toursRail(page).getByRole('option', { name, exact: true });
const addTour = (page: Page) => page.getByTestId('tour-rail-add');
/** The menu the + opens; a portal on the body, labelled like its button. */
const addMenuItem = (page: Page, label: string) =>
  page.getByRole('group', { name: 'Add tour' }).getByRole('button', { name: label, exact: true });
/** The left column while an import is shown: a section named after the tour. */
const importRail = (page: Page, name: string) => page.getByRole('region', { name, exact: true });
const railCard = (page: Page, rail: string, card: string) =>
  importRail(page, rail).getByRole('region', { name: card, exact: true });
/** The left column while a tour is edited (and while nothing is open). */
const editorRail = (page: Page) => page.getByRole('region', { name: 'Plan a tour', exact: true });
const previewDialog = (page: Page) => page.getByRole('dialog').filter({ hasText: 'Import preview' });
const previewSection = (page: Page, has: 'tracks' | 'as') =>
  has === 'tracks'
    ? previewDialog(page)
        .locator('section')
        .filter({ has: page.getByTestId('gpx-preview-track') })
    : previewDialog(page)
        .locator('section')
        .filter({ has: page.getByTestId('tour-type-select') });
/**
 * The take-over dialog. Its header labels it by the eyebrow ("Take over a
 * tour"), not by the title, so it is found by the list section the title
 * names, which stays right whichever header line ends up as the label.
 */
const library = (page: Page) =>
  page.getByRole('dialog').filter({ has: page.getByRole('region', { name: 'From another trip', exact: true }) });
const wandererRail = (page: Page) => page.getByRole('region', { name: 'wanderer', exact: true });

// ── Getting there ─────────────────────────────────────────────────────────────

/** The Tours tab of the Dolomites trip (or the ski week), with its list of tours in. */
async function openTours(page: Page, trip: 'summer' | 'ski' = 'summer'): Promise<void> {
  await openTourTrip(page, { trip, tab: 'tour-planner' });
  await expect(toursRail(page)).toBeVisible({ timeout: 30_000 });
  await expect(toursRail(page).getByRole('option').first()).toBeVisible({ timeout: 30_000 });
  await settle(page);
}

/** The + and its menu, as the first two steps of every way in show them. */
function addMenuSteps(entry: string, act: (page: Page) => Promise<void>): StepAction[] {
  return [
    {
      target: addTour,
      act: async (p) => {
        await addTour(p).click();
        await expect(addMenuItem(p, entry)).toBeVisible();
        await settle(p);
      },
    },
    { target: (p) => addMenuItem(p, entry), act },
  ];
}

/** Picks the Rasciesa GPX in the file chooser the menu entry opens, and waits for the preview. */
async function chooseImportFile(page: Page): Promise<void> {
  const file = await importFile();
  const chooser = page.waitForEvent('filechooser');
  await addMenuItem(page, 'Import GPX or KML').click();
  await (await chooser).setFiles(file);
  await expect(previewDialog(page)).toBeVisible({ timeout: 30_000 });
  await expect(previewDialog(page).getByTestId('gpx-preview-track').first()).toBeVisible({ timeout: 30_000 });
  await settle(page);
}

/** Opens the recorded Seceda walk from the list: an import is shown as it came in. */
async function viewRecorded(page: Page): Promise<void> {
  await tourRow(page, RECORDED_NAME).click();
  await expect(railCard(page, RECORDED_NAME, 'Tour summary')).toBeVisible({ timeout: 20_000 });
  await settle(page);
}

/** Asks for the editable version and waits until the router has answered and the card compares. */
async function analyse(page: Page): Promise<void> {
  await railCard(page, RECORDED_NAME, 'Editable version')
    .getByRole('button', { name: 'Plan an editable version' })
    .click();
  await expect(page.getByRole('button', { name: 'Replace the import' })).toBeVisible({ timeout: 120_000 });
  await settle(page);
}

/** Takes the suggestion over the import in place; the editor opens and has to route before it can save. */
async function replaceImport(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Replace the import' }).click();
  await expect(editorRail(page).getByRole('button', { name: 'Save', exact: true })).toBeEnabled({ timeout: 120_000 });
  await settle(page);
}

async function saveEditor(page: Page): Promise<void> {
  await editorRail(page).getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Tour saved').first()).toBeVisible({ timeout: 60_000 });
  await settle(page);
}

/** Puts the Dolomites trip back as the fixtures left it: no Rasciesa tour, the Seceda walk as recorded, no draft. */
async function resetSummer(page: Page): Promise<void> {
  const tripId = await tripIdByTitle(page.request, TOUR_TRIP);
  await deleteToursNamed(page.request, tripId, IMPORTED_NAME, WANDERER_TRAIL);
  await restoreRecordedTrack(page.request, tripId, RECORDED_NAME);
  await forgetTourDraft(page.request, tripId);
}

// ── Scripts ───────────────────────────────────────────────────────────────────

const TAKEN_OVER_NAME = 'Morning run on the railway trail';

const SCRIPTS: Record<string, GuideScript> = {
  'tour-import-gpx': {
    guide: guide('tour-import-gpx'),
    start: async (p) => {
      await resetSummer(p);
      await openTours(p);
    },
    steps: [
      ...addMenuSteps('Import GPX or KML', chooseImportFile),
      { target: (p) => previewSection(p, 'tracks') },
      // Hike is preset, and the Rasciesa walk is one: the step shows the field and leaves it.
      { target: (p) => previewSection(p, 'as') },
      {
        target: (p) => p.getByTestId('gpx-preview-import'),
        act: async (p) => {
          await p.getByTestId('gpx-preview-import').click();
          await expect(previewDialog(p)).toHaveCount(0, { timeout: 60_000 });
          // One track: it opens on the map at once, as a GPX tour.
          await expect(railCard(p, IMPORTED_NAME, 'Tour summary')).toBeVisible({ timeout: 30_000 });
          await expect(tourRow(p, IMPORTED_NAME)).toBeVisible();
          await settle(p);
        },
      },
    ],
    cleanup: resetSummer,
  },

  'tour-view-import': {
    guide: guide('tour-view-import'),
    start: async (p) => {
      await resetSummer(p);
      await openTours(p);
    },
    steps: [
      { target: (p) => tourRow(p, RECORDED_NAME), act: viewRecorded },
      { target: (p) => railCard(p, RECORDED_NAME, 'Tour summary') },
      {
        target: (p) => importRail(p, RECORDED_NAME).getByRole('button', { name: 'Back to Tours' }),
        act: async (p) => {
          await importRail(p, RECORDED_NAME).getByRole('button', { name: 'Back to Tours' }).click();
          await expect(importRail(p, RECORDED_NAME)).toHaveCount(0);
          await settle(p);
        },
      },
    ],
  },

  'tour-plan-from-import': {
    guide: guide('tour-plan-from-import'),
    start: async (p) => {
      await resetSummer(p);
      await openTours(p);
      await viewRecorded(p);
    },
    steps: [
      {
        target: (p) =>
          railCard(p, RECORDED_NAME, 'Editable version').getByRole('button', { name: 'Plan an editable version' }),
        act: analyse,
      },
      { target: (p) => railCard(p, RECORDED_NAME, 'Editable version') },
      { target: (p) => p.getByRole('button', { name: 'Replace the import' }), act: replaceImport },
      { target: (p) => editorRail(p).getByRole('button', { name: 'Save', exact: true }), act: saveEditor },
    ],
    cleanup: resetSummer,
  },

  'tour-restore-recorded': {
    guide: guide('tour-restore-recorded'),
    // The walk is planned over first, the way the guide before this one does
    // it, then the editor is closed so step 1 opens it from the list.
    start: async (p) => {
      await resetSummer(p);
      await openTours(p);
      await viewRecorded(p);
      await analyse(p);
      await replaceImport(p);
      await saveEditor(p);
      await editorRail(p).getByRole('button', { name: 'Back to Tours' }).click();
      await expect(editorRail(p).getByRole('button', { name: 'Plan new tour' })).toBeVisible({ timeout: 20_000 });
      await settle(p);
    },
    steps: [
      {
        prepare: async (p) => {
          await tourRow(p, RECORDED_NAME).click();
          await expect(editorRail(p).getByRole('region', { name: 'Recorded track', exact: true })).toBeVisible({
            timeout: 30_000,
          });
          await settle(p);
        },
        target: (p) => editorRail(p).getByRole('region', { name: 'Recorded track', exact: true }),
      },
      {
        target: (p) => editorRail(p).getByRole('button', { name: 'Restore recorded track' }),
        act: async (p) => {
          await editorRail(p).getByRole('button', { name: 'Restore recorded track' }).click();
          await expect(confirmDialog(p)).toBeVisible();
          await settle(p);
        },
      },
      {
        target: (p) => confirmDialog(p).getByRole('button', { name: 'Restore recorded track' }),
        act: async (p) => {
          await confirmDialog(p).getByRole('button', { name: 'Restore recorded track' }).click();
          await expect(p.getByText('Recorded track restored').first()).toBeVisible({ timeout: 30_000 });
          // It comes back as a GPX tour, shown as it was recorded.
          await expect(railCard(p, RECORDED_NAME, 'Tour summary')).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
    ],
    cleanup: resetSummer,
  },

  'tour-take-over': {
    guide: guide('tour-take-over'),
    start: async (p) => {
      const skiId = await tripIdByTitle(p.request, SKI_TRIP);
      await deleteToursNamed(p.request, skiId, TAKEN_OVER_NAME, TOUR_NAMES.run);
      await forgetTourDraft(p.request, skiId);
      await openTours(p, 'ski');
    },
    steps: [
      ...addMenuSteps('Take over a tour from another trip', async (p) => {
        await addMenuItem(p, 'Take over a tour from another trip').click();
        await expect(library(p)).toBeVisible();
        await expect(library(p).getByTestId('tour-library-list')).toBeVisible({ timeout: 30_000 });
        await settle(p);
      }),
      {
        target: (p) => library(p).getByRole('region', { name: 'From another trip' }),
        act: async (p) => {
          await library(p).getByPlaceholder('Search by name').fill('railway');
          await expect(
            library(p).locator('[data-testid^="tour-library-row-"]').filter({ hasText: TOUR_NAMES.run })
          ).toBeVisible({ timeout: 20_000 });
          await settle(p);
        },
      },
      {
        target: (p) => library(p).locator('[data-testid^="tour-library-row-"]').filter({ hasText: TOUR_NAMES.run }),
        act: async (p) => {
          await library(p).locator('[data-testid^="tour-library-row-"]').filter({ hasText: TOUR_NAMES.run }).click();
          await expect(library(p).getByTestId('tour-library-preview')).toBeVisible({ timeout: 20_000 });
          await expect(library(p).getByTestId('tour-library-confirm')).toBeEnabled({ timeout: 20_000 });
          await p.waitForTimeout(800); // the preview's line
          await settle(p);
        },
      },
      {
        target: (p) => library(p).getByLabel('Name in this trip'),
        act: async (p) => {
          await library(p).getByLabel('Name in this trip').fill(TAKEN_OVER_NAME);
          await settle(p);
        },
      },
      {
        target: (p) => library(p).getByTestId('tour-library-confirm'),
        act: async (p) => {
          await library(p).getByTestId('tour-library-confirm').click();
          await expect(library(p)).toHaveCount(0, { timeout: 30_000 });
          await expect(tourRow(p, TAKEN_OVER_NAME)).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
    ],
    cleanup: async (p) => {
      const skiId = await tripIdByTitle(p.request, SKI_TRIP);
      await deleteToursNamed(p.request, skiId, TAKEN_OVER_NAME);
      await forgetTourDraft(p.request, skiId);
    },
  },

  'tour-import-wanderer': {
    guide: guide('tour-import-wanderer'),
    // Connected here and taken away in cleanup: with a connection the neutral
    // rail grows the wanderer button, which no other Tours picture shows.
    start: async (p) => {
      await resetSummer(p);
      await ensureWandererConnection(p.request);
      await openTours(p);
    },
    steps: [
      {
        target: (p) => p.getByTestId('tour-rail-open-wanderer'),
        act: async (p) => {
          await p.getByTestId('tour-rail-open-wanderer').click();
          await expect(wandererRail(p)).toBeVisible();
          await settle(p);
        },
      },
      {
        target: (p) => wandererRail(p).getByRole('textbox', { name: 'Search trails' }),
        act: async (p) => {
          await wandererRail(p).getByRole('textbox', { name: 'Search trails' }).fill('Rasciesa');
          await expect(wandererRail(p).getByRole('option').filter({ hasText: WANDERER_TRAIL })).toBeVisible({
            timeout: 30_000,
          });
          await settle(p);
        },
      },
      {
        target: (p) => wandererRail(p).getByRole('option').filter({ hasText: WANDERER_TRAIL }),
        act: async (p) => {
          await wandererRail(p).getByRole('option').filter({ hasText: WANDERER_TRAIL }).click();
          await expect(wandererRail(p).getByRole('button', { name: 'Import into trip' })).toBeEnabled({
            timeout: 30_000,
          });
          await settle(p);
        },
      },
      {
        target: (p) => wandererRail(p).getByRole('button', { name: 'Import into trip' }),
        act: async (p) => {
          await wandererRail(p).getByRole('button', { name: 'Import into trip' }).click();
          await expect(wandererRail(p)).toHaveCount(0, { timeout: 60_000 });
          await expect(railCard(p, WANDERER_TRAIL, 'Tour summary')).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
    ],
    cleanup: async (p) => {
      await resetSummer(p);
      await disconnectWanderer(p.request);
    },
  },
};

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  await ensureToursFixtures(request);
  const tripId = await tripIdByTitle(request, TOUR_TRIP);
  if (!(await tourNamed(request, tripId, RECORDED_NAME)))
    throw new Error(`"${RECORDED_NAME}" is missing: the fixtures could not import it`);
});

test.afterAll(async ({ request }) => {
  // Instance-wide: left on, every Tours tab would offer wanderer. Here as well
  // as in the guide's cleanup, so a failed run puts it back too.
  await disconnectWanderer(request);
});

test('every registered tour import guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripTourImportContext.guides].sort());
});

// The screen as a reader meets it: the Import preview of a recorded walk over the Tours tab.
test('hero: trip-tour-import', async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await captureHero(page, tripTourImportContext.id, async (p) => {
    await resetSummer(p);
    await openTours(p);
    await addTour(p).click();
    await chooseImportFile(p);
  });
});

for (const id of tripTourImportContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await captureGuide(page, SCRIPTS[id]);
  });
}
