import { expect, test, type Locator, type Page } from '@playwright/test';
import { tripTourSkiContext, tripTourSkiGuides } from '../../src/help/contexts/tripTourSki';
import type { HelpGuide } from '../../src/help/types';
import { useTopo } from './fixtures-trip-tour-planner';
import {
  deleteSkiTours,
  forgetSkiDraft,
  PLANNED_SKI_TOUR,
  SKI_POINTS,
  SKI_TRACK,
  skiTrackFixture,
} from './fixtures-trip-tour-ski';
import { captureGuide, captureHero, settle, VIEWPORT, type GuideScript } from './guide';
import { ensureToursFixtures, openTourTrip, TOUR_NAMES } from './tour-fixtures';
import { confirmDialog } from './trip-shared';

/**
 * Actions for Ski & winter tours on the Tours tab, keyed by the ids in
 * `src/help/contexts/tripTourSki.ts`. They run on the ski week of the Tours
 * demo data ("Ski week in Val Gardena", `ensureToursFixtures`): the planner
 * guides start a new tour around Selva and plan it on the piste router, the
 * map guide opens the saved tours, the import guide brings in a recorded
 * cross-country track (`fixtures-trip-tour-ski.ts`). An unsaved draft is kept
 * on the account and opened again on the next page load, so every guide starts
 * by forgetting it and every test forgets it again when it ends, passed or not;
 * what a guide saves is taken away in its `cleanup`.
 *
 * Every leg here is the piste router's (POST /api/trips/:id/ski/route over the
 * TREK Places winter data): without it the legs fail and the guides that read
 * planned legs fail with them, loudly, at the step that waits for the legs.
 */

const guide = (id: string): HelpGuide => {
  const g = tripTourSkiGuides.find((x) => x.id === id);
  if (!g) throw new Error(`no registered guide "${id}"`);
  return g;
};

// ── Where things are ──────────────────────────────────────────────────────────

/** The left rail, neutral or with a tour open: both are the section "Plan a tour". */
const leftRail = (page: Page) => page.locator('section[aria-label="Plan a tour"]').first();
/** The right rail, "Tours of this trip". */
const rightRail = (page: Page) => page.locator('aside[aria-label="Tours of this trip"]').first();
const typeSelect = (page: Page) => leftRail(page).getByTestId('tour-type-select');
const skiFields = (page: Page) => leftRail(page).getByTestId('tour-planner-ski-fields');
const disciplines = (scope: Locator) => scope.getByRole('group', { name: 'Discipline' });
const skiOptions = (page: Page) => leftRail(page).getByTestId('tour-planner-ski-options');
const addPoint = (page: Page) => leftRail(page).getByTestId('tour-planner-add-point');
const legSteps = (page: Page) => leftRail(page).getByTestId('tour-planner-ski-leg-steps');
const legFailures = (page: Page) => leftRail(page).getByTestId('tour-planner-ski-leg-failure');
/** A failure row the router reports, not the calm "summer paths" note. */
const legProblem = (page: Page) => legFailures(page).filter({ has: page.getByRole('alert') });
const liftClasses = (page: Page) => skiOptions(page).getByRole('group', { name: 'Leave out' });
const pisteRoute = (page: Page) => leftRail(page).locator('section[aria-label="Piste route"]');
const overview = (page: Page) => rightRail(page).getByTestId('tour-planner-overview');
const tourRow = (page: Page, name: string | RegExp) => rightRail(page).getByRole('option', { name }).first();
const importDialog = (page: Page) => page.getByRole('dialog').filter({ hasText: 'Import preview' });
const classifyDialog = (page: Page) => page.getByRole('dialog').filter({ hasText: 'Classify ski track' });
const LIFT_LABELS = ['Surface lifts', 'Open chairlifts', 'Gondolas', 'Cable cars', 'Funiculars and trains'];

// ── Getting there ─────────────────────────────────────────────────────────────

/**
 * The ski week on its Tours tab, with the map over Val Gardena. The planner
 * map frames, with nothing open, the area the plan map showed last, and that
 * lives in memory only: so the plan opens on day 2 (the Sella Ronda) first and
 * the Tours tab is clicked rather than loaded. A draft left on the account
 * would open in the editor instead of the neutral rail, so it is forgotten
 * before the page loads.
 *
 * With `topo`, the map is switched to Topo. The default Map is a vector style
 * drawn on a canvas and has no tile images, and the pistes overlay's tiles come
 * slowly or not at all, so the guides that click points on the map need the
 * Topo raster to find them by (see `toScreen`).
 */
async function openSkiPlanner(page: Page, opts: { topo?: boolean } = {}): Promise<void> {
  await forgetSkiDraft(page);
  await openTourTrip(page, { trip: 'ski', day: 2 });
  await page.getByRole('button', { name: 'Tours', exact: true }).first().click();
  await expect(leftRail(page)).toBeVisible({ timeout: 30_000 });
  await expect(rightRail(page)).toBeVisible();
  await expect(
    leftRail(page).getByRole('button', { name: 'Plan new tour' }),
    'the editor opened on a leftover draft'
  ).toBeVisible({
    timeout: 30_000,
  });
  if (opts.topo) await useTopo(page);
  await settle(page);
}

/** A new tour of type Ski & winter, its discipline picked. */
async function newSkiDraft(page: Page, discipline = 'Alpine'): Promise<void> {
  await leftRail(page).getByRole('button', { name: 'Plan new tour' }).click();
  await pickSkiType(page);
  await disciplines(skiFields(page)).getByRole('button', { name: discipline, exact: true }).click();
  await expect(skiOptions(page)).toBeVisible();
}

async function pickSkiType(page: Page): Promise<void> {
  await typeSelect(page).click();
  await page.getByTestId('tour-type-option-ski').click();
  await expect(skiFields(page)).toBeVisible();
}

/** Set points on: it is on by default in 2D, and a press turns it off, so only press when it is off. */
async function setPointsOn(page: Page): Promise<void> {
  if ((await addPoint(page).getAttribute('aria-pressed')) !== 'true') await addPoint(page).click();
  await expect(addPoint(page)).toHaveAttribute('aria-pressed', 'true');
}

/** Click the points on the map, then wait until every leg is planned (or, with `expectFailure`, one failed). */
async function placePoints(page: Page, points: [number, number][], expectFailure = false): Promise<void> {
  await setPointsOn(page);
  const at = await frameOn(page, points);
  for (const p of at) {
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(700);
  }
  if (expectFailure) {
    await expect(legProblem(page).first()).toBeVisible({ timeout: 180_000 });
  } else {
    await expect(legSteps(page)).toHaveCount(points.length - 1, { timeout: 180_000 });
    await expect(legProblem(page)).toHaveCount(0);
  }
  await settle(page);
}

/** The whole plan guide up to its last step, for the hero and the summary guide. */
async function plannedSkiDraft(page: Page): Promise<void> {
  await openSkiPlanner(page, { topo: true });
  await newSkiDraft(page);
  await placePoints(page, SKI_POINTS);
  await leftRail(page).locator('#tour-planner-name').fill(PLANNED_SKI_TOUR);
  await settle(page);
}

/** Open a saved ski tour of the trip from the list: the Sella Ronda, or the winter walk where the router left it out. */
async function openSavedSkiTour(page: Page): Promise<void> {
  const ronda = tourRow(page, new RegExp(`^${TOUR_NAMES.skiRonda}`));
  const row = (await ronda.count()) ? ronda : tourRow(page, new RegExp(`^${TOUR_NAMES.winterWalk}`));
  await row.click();
  await expect(skiFields(page)).toBeVisible({ timeout: 30_000 });
  await settle(page);
}

/** Back to the list, throwing a draft away. */
async function leaveEditor(page: Page): Promise<void> {
  const discard = leftRail(page).getByRole('button', { name: 'Discard', exact: true });
  if (!(await discard.isVisible().catch(() => false)) || !(await discard.isEnabled())) return;
  await discard.click();
  const confirm = confirmDialog(page).getByRole('button', { name: 'Discard changes' });
  if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) await confirm.click();
}

// ── The map, by its tiles ─────────────────────────────────────────────────────

type ScreenPoint = { x: number; y: number };

/**
 * Where a coordinate is on the screen. The Leaflet map exposes no handle, but
 * its tiles say where they are: a loaded tile's src names its z/x/y, and its box
 * is where that tile sits, so the web-mercator pixel of any point follows from
 * one of them. Off-screen points come out off-screen, which is what `frameOn`
 * checks.
 */
async function toScreen(page: Page, points: [number, number][]): Promise<ScreenPoint[]> {
  // Tiles still on their way after a pan or a zoom: wait for one before measuring.
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            Array.from(
              document.querySelectorAll<HTMLImageElement>('.leaflet-tile-pane img.leaflet-tile-loaded')
            ).filter(
              (img) =>
                /\/\d+\/\d+\/\d+(?:@2x)?\.(?:png|jpe?g|webp)/.test(img.src) && img.getBoundingClientRect().width > 0
            ).length
        ),
      { message: 'no loaded map tile to measure the map by: is the Topo map on?', timeout: 30_000 }
    )
    .toBeGreaterThan(0);
  return page.evaluate((pts) => {
    const tiles = Array.from(document.querySelectorAll<HTMLImageElement>('.leaflet-tile-pane img.leaflet-tile-loaded'))
      .map((img) => {
        const m = /\/(\d+)\/(\d+)\/(\d+)(?:@2x)?\.(?:png|jpe?g|webp)/.exec(img.src);
        return m ? { z: Number(m[1]), x: Number(m[2]), y: Number(m[3]), box: img.getBoundingClientRect() } : null;
      })
      .filter((t): t is { z: number; x: number; y: number; box: DOMRect } => !!t && t.box.width > 0);
    if (!tiles.length) throw new Error('no loaded map tile to measure the map by');
    const counts = new Map<number, number>();
    for (const t of tiles) counts.set(t.z, (counts.get(t.z) ?? 0) + 1);
    const z = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const tile = tiles.find((t) => t.z === z)!;
    const scale = tile.box.width / 256;
    const world = (lat: number, lng: number) => {
      const n = 256 * 2 ** z;
      const s = Math.sin((lat * Math.PI) / 180);
      return { x: ((lng + 180) / 360) * n, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n };
    };
    return pts.map(([lat, lng]) => {
      const w = world(lat, lng);
      return { x: tile.box.left + (w.x - tile.x * 256) * scale, y: tile.box.top + (w.y - tile.y * 256) * scale };
    });
  }, points);
}

/** The part of the map between the two rails and above the layer row, with a margin. */
async function openMapArea(page: Page): Promise<{ left: number; right: number; top: number; bottom: number }> {
  const map = await page.locator('#trek-map, .leaflet-container').first().boundingBox();
  const left = await leftRail(page).boundingBox();
  const right = await rightRail(page).boundingBox();
  if (!map) throw new Error('the tour map has no box');
  return {
    left: Math.max(map.x, (left?.x ?? 0) + (left?.width ?? 0)) + 70,
    right: Math.min(map.x + map.width, right?.x ?? VIEWPORT.width) - 70,
    top: map.y + 90,
    bottom: map.y + map.height - 130,
  };
}

/**
 * Zoom the map until every point is in its open part and they are far enough
 * apart to click: out around the middle while one is outside, in around the
 * points while they huddle. The wheel is the one zoom this map has.
 */
async function frameOn(page: Page, points: [number, number][]): Promise<ScreenPoint[]> {
  let zoomedIn = false;
  let backedOut = false;
  for (let round = 0; round < 16; round++) {
    const area = await openMapArea(page);
    const at = await toScreen(page, points);
    const inside = at.every((p) => p.x > area.left && p.x < area.right && p.y > area.top && p.y < area.bottom);
    const xs = at.map((p) => p.x);
    const ys = at.map((p) => p.y);
    const spread = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    if (inside && (spread > 380 || backedOut)) return at;
    if (!inside) {
      await page.mouse.move((area.left + area.right) / 2, (area.top + area.bottom) / 2);
      await page.mouse.wheel(0, 240);
      if (zoomedIn) {
        await page.waitForTimeout(900);
        await settle(page);
        zoomedIn = false;
        backedOut = true;
        const back = await toScreen(page, points);
        if (back.every((p) => p.x > area.left && p.x < area.right && p.y > area.top && p.y < area.bottom)) return back;
        continue;
      }
    } else {
      const cx = xs.reduce((s, x) => s + x, 0) / xs.length;
      const cy = ys.reduce((s, y) => s + y, 0) / ys.length;
      await page.mouse.move(cx, cy);
      await page.mouse.wheel(0, -240);
      zoomedIn = true;
    }
    await page.waitForTimeout(900);
    await settle(page);
  }
  const area = await openMapArea(page);
  const at = await toScreen(page, points);
  if (!at.every((p) => p.x > area.left && p.x < area.right && p.y > area.top && p.y < area.bottom)) {
    throw new Error('the ski points could not be brought into the open part of the map');
  }
  return at;
}

// ── The guides ────────────────────────────────────────────────────────────────

const SCRIPTS: Record<string, GuideScript> = {
  'tour-ski-plan': {
    guide: guide('tour-ski-plan'),
    start: (p) => openSkiPlanner(p, { topo: true }),
    steps: [
      {
        target: (p) => leftRail(p).getByRole('button', { name: 'Plan new tour' }),
        act: async (p) => {
          await leftRail(p).getByRole('button', { name: 'Plan new tour' }).click();
          await expect(typeSelect(p)).toBeVisible();
        },
      },
      {
        prepare: async (p) => {
          await typeSelect(p).click();
          await expect(p.getByTestId('tour-type-option-ski')).toBeVisible();
        },
        target: (p) => p.getByTestId('tour-type-option-ski'),
        act: async (p) => {
          await p.getByTestId('tour-type-option-ski').click();
          await expect(skiFields(p)).toBeVisible();
        },
      },
      {
        target: (p) => disciplines(skiFields(p)),
        act: async (p) => {
          await disciplines(skiFields(p)).getByRole('button', { name: 'Alpine', exact: true }).click();
          await expect(skiOptions(p)).toBeVisible();
        },
      },
      {
        target: addPoint,
        act: async (p) => placePoints(p, SKI_POINTS),
      },
      { target: (p) => legSteps(p).first() },
      {
        prepare: async (p) => {
          await leftRail(p).locator('#tour-planner-name').fill(PLANNED_SKI_TOUR);
        },
        target: (p) => leftRail(p).getByRole('button', { name: 'Save', exact: true }),
        act: async (p) => {
          await leftRail(p).getByRole('button', { name: 'Save', exact: true }).click();
          await expect(p.getByText('Tour saved').first()).toBeVisible({ timeout: 30_000 });
          await expect(tourRow(p, new RegExp(`^${PLANNED_SKI_TOUR}`))).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
    ],
    cleanup: async (p) => {
      await deleteSkiTours(p, PLANNED_SKI_TOUR);
    },
  },

  'tour-ski-options': {
    guide: guide('tour-ski-options'),
    start: async (p) => {
      await openSkiPlanner(p);
      await newSkiDraft(p);
    },
    steps: [
      { target: skiOptions },
      {
        target: (p) => p.locator('#tour-planner-ski-difficulty'),
        act: async (p) => {
          await p.locator('#tour-planner-ski-difficulty').click();
          await p
            .getByRole('group', { name: 'Hardest runs' })
            .getByRole('button', { name: 'Advanced', exact: true })
            .click();
          await expect(p.locator('#tour-planner-ski-difficulty')).toContainText('Advanced');
        },
      },
      {
        target: (p) => skiOptions(p).getByRole('group', { name: 'Prefer' }),
        act: async (p) => {
          await skiOptions(p)
            .getByRole('group', { name: 'Prefer' })
            .getByRole('button', { name: 'Most skiing' })
            .click();
          await skiOptions(p).getByRole('group', { name: 'Pace' }).getByRole('button', { name: 'Relaxed' }).click();
        },
      },
      {
        // The first switch row: Ride lifts, the one every discipline has.
        target: (p) => skiOptions(p).getByRole('button', { name: 'Ride lifts', exact: true }).locator('xpath=..'),
        hover: async (p) => skiOptions(p).getByRole('button', { name: 'Ride lifts', exact: true }).hover(),
      },
      {
        target: liftClasses,
        act: async (p) => {
          await liftClasses(p).getByRole('button', { name: 'Surface lifts' }).click();
          await expect(liftClasses(p).getByRole('button', { name: 'Surface lifts' })).toHaveAttribute(
            'aria-pressed',
            'true'
          );
        },
      },
    ],
    cleanup: leaveEditor,
  },

  'tour-ski-fix-leg': {
    guide: guide('tour-ski-fix-leg'),
    // Every kind of lift left out, so the leg up from Selva has no way to go.
    start: async (p) => {
      await openSkiPlanner(p, { topo: true });
      await newSkiDraft(p);
      for (const name of LIFT_LABELS) await liftClasses(p).getByRole('button', { name }).click();
      await placePoints(p, SKI_POINTS.slice(0, 2), true);
    },
    steps: [
      { target: (p) => legProblem(p).first() },
      {
        target: (p) => legProblem(p).first().getByRole('button').filter({ hasNotText: 'Draw straight' }).first(),
        act: async (p) => {
          await legProblem(p).first().getByRole('button').filter({ hasNotText: 'Draw straight' }).first().click();
          // The leg is asked for again: planned, or failed for the next reason.
          await p.waitForTimeout(2000);
          await expect
            .poll(async () => (await legSteps(p).count()) + (await legProblem(p).count()), { timeout: 180_000 })
            .toBeGreaterThan(0);
          await settle(p);
        },
      },
      {
        // The fix planned the leg: leave the lifts out again for a failure to draw straight.
        prepare: async (p) => {
          if ((await legProblem(p).count()) > 0) return;
          for (const name of LIFT_LABELS) {
            const badge = liftClasses(p).getByRole('button', { name });
            if ((await badge.getAttribute('aria-pressed')) !== 'true') await badge.click();
          }
          await expect(legProblem(p).first()).toBeVisible({ timeout: 180_000 });
          await settle(p);
        },
        target: (p) => legProblem(p).first().getByRole('button', { name: 'Draw straight' }),
        act: async (p) => {
          await legProblem(p).first().getByRole('button', { name: 'Draw straight' }).click();
          await expect(legProblem(p)).toHaveCount(0, { timeout: 30_000 });
        },
      },
    ],
    cleanup: leaveEditor,
  },

  'tour-ski-summary': {
    guide: guide('tour-ski-summary'),
    start: plannedSkiDraft,
    steps: [
      { target: pisteRoute },
      { target: (p) => pisteRoute(p).getByTestId('ski-route-summary') },
      {
        target: (p) => overview(p).getByText('Ski time', { exact: true }).locator('xpath=..'),
      },
    ],
    cleanup: leaveEditor,
  },

  'tour-ski-pistes-layer': {
    guide: guide('tour-ski-pistes-layer'),
    start: async (p) => {
      await openSkiPlanner(p);
      await openSavedSkiTour(p);
      await expect(p.getByTestId('map-overlay-pistes')).toHaveAttribute('aria-pressed', 'true');
    },
    steps: [
      { target: (p) => p.getByTestId('map-overlay-pistes') },
      {
        target: (p) => p.getByTestId('piste-key-button'),
        act: async (p) => {
          await p.getByTestId('piste-key-button').click();
          await expect(p.getByRole('group', { name: 'Piste key' })).toBeVisible();
        },
      },
      {
        target: (p) => p.getByRole('group', { name: 'Piste key' }),
        hover: async (p) => p.getByRole('link', { name: 'Full key at OpenSnowMap' }).hover(),
      },
    ],
    cleanup: async (p) => {
      await p.keyboard.press('Escape');
    },
  },

  'tour-ski-import': {
    guide: guide('tour-ski-import'),
    start: async (p) => {
      await deleteSkiTours(p, SKI_TRACK.name);
      await openSkiPlanner(p);
    },
    steps: [
      {
        prepare: async (p) => {
          await rightRail(p).getByTestId('tour-rail-add').click();
          await expect(p.getByRole('group', { name: 'Add tour' })).toBeVisible();
        },
        target: (p) => p.getByRole('group', { name: 'Add tour' }).getByRole('button', { name: 'Import GPX or KML' }),
        act: async (p) => {
          const file = await skiTrackFixture(p.request);
          const chooser = p.waitForEvent('filechooser');
          await p.getByRole('group', { name: 'Add tour' }).getByRole('button', { name: 'Import GPX or KML' }).click();
          await (await chooser).setFiles(file);
          await expect(importDialog(p)).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
      {
        target: (p) => importDialog(p).getByTestId('tour-type-select'),
        act: async (p) => {
          await importDialog(p).getByTestId('tour-type-select').click();
          await p.getByTestId('tour-type-option-ski').click();
          await expect(importDialog(p).getByTestId('tour-ski-fields')).toBeVisible();
        },
      },
      {
        target: (p) => importDialog(p).getByTestId('tour-ski-fields'),
        act: async (p) => {
          const fields = importDialog(p).getByTestId('tour-ski-fields');
          await disciplines(fields).getByRole('button', { name: 'Cross-country', exact: true }).click();
          await fields.getByRole('group', { name: 'Technique' }).getByRole('button', { name: 'Classic' }).click();
          await expect(importDialog(p).getByTestId('gpx-preview-import')).toBeEnabled();
        },
      },
      {
        target: (p) => importDialog(p).getByTestId('gpx-preview-import'),
        act: async (p) => {
          await importDialog(p).getByTestId('gpx-preview-import').click();
          await expect(importDialog(p)).toHaveCount(0, { timeout: 30_000 });
          await expect(tourRow(p, /Vallunga cross-country/)).toBeVisible({ timeout: 30_000 });
        },
      },
      {
        prepare: async (p) => {
          await tourRow(p, /Vallunga cross-country/).click();
          await expect(p.getByTestId('ski-track-card')).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
        target: (p) => p.getByTestId('ski-track-card').getByRole('button', { name: 'Change' }),
        act: async (p) => {
          await p.getByTestId('ski-track-card').getByRole('button', { name: 'Change' }).click();
          await expect(classifyDialog(p)).toBeVisible();
        },
      },
      {
        prepare: async (p) => {
          await classifyDialog(p)
            .getByRole('group', { name: 'Technique' })
            .getByRole('button', { name: 'Skating' })
            .click();
          await expect(p.getByTestId('ski-classify-save')).toBeEnabled();
        },
        target: (p) => p.getByTestId('ski-classify-save'),
        act: async (p) => {
          await p.getByTestId('ski-classify-save').click();
          await expect(p.getByText('Classification saved').first()).toBeVisible({ timeout: 30_000 });
          await expect(p.getByTestId('ski-track-technique')).toContainText('Skating');
          await settle(p);
        },
      },
    ],
    cleanup: async (p) => {
      await deleteSkiTours(p, SKI_TRACK.name);
    },
  },
};

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  await ensureToursFixtures(request);
});

// A guide that fails, and the hero, which has no cleanup, leave their draft on
// the account. The page goes first, so no edit still settling can write the
// draft again after it is forgotten.
test.afterEach(async ({ page }) => {
  await page.goto('about:blank').catch(() => undefined);
  await forgetSkiDraft(page);
});

test('every registered ski and winter guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripTourSkiContext.guides].sort());
});

test('hero: trip-tour-ski', async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await captureHero(page, tripTourSkiContext.id, plannedSkiDraft);
});

for (const id of tripTourSkiContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await captureGuide(page, SCRIPTS[id]);
  });
}
