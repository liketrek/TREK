import { expect, test, type Page } from '@playwright/test';
import { tripTourHorseContext, tripTourHorseGuides } from '../../src/help/contexts/tripTourHorse';
import type { HelpGuide } from '../../src/help/types';
import {
  deleteToursNamed,
  finishMapPan,
  forgetTourDraft,
  horsePlan,
  NEW_RIDE,
  openSavedRide,
  openToursTab,
  RECORDED_RIDE,
  recordedRideFile,
  routeTitle,
  serveHorseRoutes,
  tourRow,
  type HorsePlan,
} from './fixtures-trip-tour-horse';
import { captureGuide, captureHero, settle, typeInto, VIEWPORT, type GuideScript } from './guide';
import { ensureToursFixtures } from './tour-fixtures';

/**
 * Actions for horse rides on the Tours tab, keyed by the ids in
 * `src/help/contexts/tripTourHorse.ts`. They run on "Summer in the Dolomites"
 * (`ensureToursFixtures`), with the Seiser Alm in view: the saved "Seiser Alm
 * horse ride" for the overview, a new ride built from the horse routes the
 * card is given (`horsePlan`, the same answer for every picture), and a ride
 * recorded on a GPS device imported from its file. The new ride and the
 * import are deleted again in `cleanup`; the gap guide saves nothing, but its
 * draft is kept on the account, so its cleanup drops it before the next guide
 * of the trip opens the Tours tab.
 */

const guide = (id: string): HelpGuide => {
  const g = tripTourHorseGuides.find((x) => x.id === id);
  if (!g) throw new Error(`no registered guide "${id}"`);
  return g;
};

let plan: HorsePlan;
let rideFile = '';

// ── Where things are ──────────────────────────────────────────────────────────

/** The editor's left column: a section named after what it is for. */
const editorRail = (page: Page) => page.getByRole('region', { name: 'Plan a tour' });
const planNewTour = (page: Page) => page.getByRole('button', { name: 'Plan new tour', exact: true });
const typeSelect = (page: Page) => page.getByTestId('tour-type-select');
const horseOption = (page: Page) => page.getByTestId('tour-type-option-horse');
const horseCard = (page: Page) => page.getByRole('region', { name: 'Horse routes' });
const findButton = (page: Page) =>
  page.getByTestId('horse-routes-card').getByRole('button', { name: 'Find in map view' });
const routeRow = (page: Page, id: string) => page.getByTestId(`horse-route-${id}`);
/**
 * A dialog's accessible name is its eyebrow ("Horse route", "Import preview"),
 * not its title, so the two dialogs are found by the title heading they hold.
 */
const dialogTitled = (page: Page, title: string) =>
  page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
const routeDialog = (page: Page, id: string) => dialogTitled(page, routeTitle(plan, id));
const sectionChip = (page: Page, n: number) => page.getByTestId(`horse-section-${n}`);
const takeSection = (page: Page) => page.getByTestId('horse-section-adopt');
const joinGapSwitch = (page: Page) => page.getByRole('button', { name: 'Join with a manual section', exact: true });
const horseLeg = (page: Page) => page.getByTestId('tour-planner-horse-leg').first();
const manualLeg = (page: Page) => page.getByTestId('tour-planner-free-leg').first();
const saveButton = (page: Page) => editorRail(page).getByRole('button', { name: 'Save', exact: true });
const previewDialog = (page: Page) => dialogTitled(page, RECORDED_RIDE.file);
const recordedCard = (page: Page) => page.getByRole('region', { name: 'Recorded ride' });

// ── Getting there ─────────────────────────────────────────────────────────────

/** Plan new tour, and the type set to Horse ride. */
async function startRide(page: Page): Promise<void> {
  await planNewTour(page).click();
  await expect(typeSelect(page)).toBeVisible({ timeout: 15_000 });
  await typeSelect(page).click();
  await horseOption(page).click();
  await expect(horseCard(page)).toBeVisible();
  await settle(page);
}

/**
 * Find in map view, and the list. A view the card finds too large says so
 * instead of searching; then the map is zoomed in once over its middle and the
 * button pressed again, which is what the notice asks of the reader too.
 */
async function findRoutes(page: Page): Promise<void> {
  const zoomNotice = page.getByText('Zoom in further to look for horse routes.');
  // The planner opens around zoom 11, near a degree wide; a search may span half of one.
  for (let attempt = 0; attempt < 5; attempt++) {
    await findButton(page).click();
    await expect(page.getByTestId('horse-routes-list').or(zoomNotice)).toBeVisible({ timeout: 45_000 });
    if (await page.getByTestId('horse-routes-list').isVisible()) break;
    const box = await page.getByTestId('tour-map-surface').boundingBox();
    if (!box) throw new Error('the planner map has no box');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -480);
    await finishMapPan(page);
  }
  await expect(page.getByTestId('horse-routes-list')).toBeVisible();
  await settle(page);
}

async function openRoute(page: Page, id: string): Promise<void> {
  await routeRow(page, id).click();
  await expect(routeDialog(page, id)).toBeVisible({ timeout: 15_000 });
  await settle(page);
}

async function pickSection(page: Page, n: number): Promise<void> {
  await sectionChip(page, n).click();
  await expect(sectionChip(page, n)).toHaveAttribute('aria-pressed', 'true');
  await settle(page);
}

/** Take the open dialog's section and wait for its badge in the Waypoints card. */
async function adopt(page: Page, id: string): Promise<void> {
  await takeSection(page).click();
  await expect(routeDialog(page, id)).toHaveCount(0);
  await expect(horseLeg(page)).toBeVisible({ timeout: 15_000 });
  await settle(page);
}

/** The gap guide's start: a ride holding its first section, and the route with the gap open. */
async function rideWithFirstSection(page: Page): Promise<void> {
  await serveHorseRoutes(page, plan);
  await openToursTab(page);
  await startRide(page);
  await findRoutes(page);
  await openRoute(page, plan.first.routeId);
  await pickSection(page, plan.first.section);
  await adopt(page, plan.first.routeId);
  await openRoute(page, plan.gap.routeId);
}

// ── The guides ────────────────────────────────────────────────────────────────

const SCRIPTS: Record<string, GuideScript> = {
  'tour-horse-plan': {
    guide: guide('tour-horse-plan'),
    start: async (p) => {
      await deleteToursNamed(p.request, NEW_RIDE);
      await serveHorseRoutes(p, plan);
      await openToursTab(p);
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
          await expect(horseOption(p)).toBeVisible();
          await settle(p);
        },
        target: horseOption,
        act: async (p) => {
          await horseOption(p).click();
          await expect(horseCard(p)).toBeVisible();
          await settle(p);
        },
      },
      { target: findButton, act: findRoutes },
      {
        target: (p) => routeRow(p, plan.first.routeId),
        act: (p) => openRoute(p, plan.first.routeId),
      },
      {
        prepare: (p) => pickSection(p, plan.first.section),
        target: (p) => routeDialog(p, plan.first.routeId),
        // The pointer on the section chosen, so its tooltip names what the tags say along it.
        hover: async (p) => {
          await sectionChip(p, plan.first.section).hover();
        },
      },
      {
        target: takeSection,
        act: (p) => adopt(p, plan.first.routeId),
      },
      {
        prepare: async (p) => {
          await typeInto(p, p.locator('#tour-planner-name'), NEW_RIDE);
          await p.locator('#tour-planner-name').press('Tab');
          // Heights are asked for the line before a ride can be saved.
          await expect(saveButton(p)).toBeEnabled({ timeout: 60_000 });
          await settle(p);
        },
        target: saveButton,
        act: async (p) => {
          await saveButton(p).click();
          await expect(p.getByText('Tour saved')).toBeVisible({ timeout: 60_000 });
          await expect(tourRow(p, NEW_RIDE)).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
    ],
    cleanup: (p) => deleteToursNamed(p.request, NEW_RIDE),
  },
  'tour-horse-gap': {
    guide: guide('tour-horse-gap'),
    start: rideWithFirstSection,
    steps: [
      {
        prepare: (p) => pickSection(p, plan.gap.section),
        target: (p) => p.getByTestId('horse-section-gap'),
      },
      {
        target: joinGapSwitch,
        act: async (p) => {
          await joinGapSwitch(p).click();
          await expect(joinGapSwitch(p)).toHaveAttribute('aria-pressed', 'true');
          await expect(takeSection(p)).toBeEnabled();
          await settle(p);
        },
      },
      {
        target: takeSection,
        act: async (p) => {
          await takeSection(p).click();
          await expect(routeDialog(p, plan.gap.routeId)).toHaveCount(0);
          await expect(manualLeg(p)).toBeVisible({ timeout: 15_000 });
          await settle(p);
        },
      },
      { target: manualLeg },
    ],
    cleanup: (p) => forgetTourDraft(p.request),
  },
  'tour-horse-recorded': {
    guide: guide('tour-horse-recorded'),
    start: async (p) => {
      await deleteToursNamed(p.request, RECORDED_RIDE.name);
      await openToursTab(p);
    },
    steps: [
      {
        target: (p) => p.getByTestId('tour-rail-add'),
        act: async (p) => {
          await p.getByTestId('tour-rail-add').click();
          const entry = p.getByRole('button', { name: 'Import GPX or KML', exact: true });
          await expect(entry).toBeVisible();
          // The file picker of the operating system cannot be photographed; its chooser is answered instead.
          const chooser = p.waitForEvent('filechooser');
          await entry.click();
          await (await chooser).setFiles(rideFile);
          await expect(previewDialog(p)).toBeVisible({ timeout: 30_000 });
          await expect(previewDialog(p).getByTestId('gpx-preview-track').first()).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
      {
        prepare: async (p) => {
          await previewDialog(p).getByTestId('tour-type-select').click();
          await horseOption(p).click();
          await expect(previewDialog(p).getByTestId('gpx-preview-horse')).toBeVisible();
          await settle(p);
        },
        target: (p) => previewDialog(p).getByTestId('gpx-preview-horse'),
      },
      {
        target: (p) => previewDialog(p).getByTestId('gpx-preview-import'),
        act: async (p) => {
          await previewDialog(p).getByTestId('gpx-preview-import').click();
          await expect(previewDialog(p)).toHaveCount(0, { timeout: 60_000 });
          await expect(recordedCard(p)).toBeVisible({ timeout: 60_000 });
          await finishMapPan(p);
        },
      },
      {
        target: recordedCard,
        // On the badge with the most to say, so the picture carries its tooltip.
        hover: async (p) => {
          await recordedCard(p).getByText('Access not checked', { exact: true }).hover();
        },
      },
    ],
    cleanup: (p) => deleteToursNamed(p.request, RECORDED_RIDE.name),
  },
};

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  test.setTimeout(600_000);
  await ensureToursFixtures(request);
  plan = await horsePlan(request);
  console.log(`[trip-tour-horse] horse routes: ${plan.source}`);
  rideFile = await recordedRideFile();
});

test.afterAll(async ({ request }) => {
  // Here as well as in the cleanups, so a failed run leaves no ride behind.
  await deleteToursNamed(request, NEW_RIDE, RECORDED_RIDE.name);
  await forgetTourDraft(request);
});

test('every registered horse ride guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripTourHorseContext.guides].sort());
});

test('hero: trip-tour-horse', async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await captureHero(page, tripTourHorseContext.id, async (p) => {
    await serveHorseRoutes(p, plan);
    await openSavedRide(p);
  });
});

for (const id of tripTourHorseContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await captureGuide(page, SCRIPTS[id]);
  });
}
