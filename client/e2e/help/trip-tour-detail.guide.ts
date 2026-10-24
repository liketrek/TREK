import { expect, test, type Locator, type Page } from '@playwright/test';
import { tripTourDetailContext, tripTourDetailGuides } from '../../src/help/contexts/tripTourDetail';
import type { HelpGuide } from '../../src/help/types';
import {
  deleteToursNamed,
  deleteTripFilesNamed,
  ensureTourDetailFixtures,
  FERRATA_PACKING,
  HUT_BOOKING_FILE,
  hutBookingFixture,
  removeInariRecording,
  tourIdOf,
  unkeepTour,
  unlinkInariRecording,
  unlinkPacking,
} from './fixtures-trip-tour-detail';
import { captureGuide, captureHero, settle, typeInto, VIEWPORT, type GuideScript } from './guide';
import {
  ensureTourRecording,
  ensureToursFixtures,
  openTourTrip,
  TOUR_COLLECTION,
  TOUR_NAMES,
  type ToursFixtures,
} from './tour-fixtures';
import { openTrip } from './trip-shared';

/**
 * Actions for the card a tour opens over the map on the Plan tab, keyed by the
 * ids in `src/help/contexts/tripTourDetail.ts`. They run on "Summer in the
 * Dolomites" from `tour-fixtures.ts`, and the two about actual tracks on the
 * Fushimi Inari hike of the seeded "Autumn in Japan" with its recording
 * (`ensureTourRecording`). What a guide changes it changes back in `cleanup`.
 */

const guide = (id: string): HelpGuide => {
  const g = tripTourDetailGuides.find((x) => x.id === id);
  if (!g) throw new Error(`no registered guide "${id}"`);
  return g;
};

let fx: ToursFixtures | null = null;
const fixtures = (): ToursFixtures => {
  if (!fx) throw new Error('ensureToursFixtures did not run');
  return fx;
};

/** The new name the rename guide types. */
const RENAMED = 'Sella Ronda, four passes';
/** The colour it picks: TRACK_COLORS[1], the orange. */
const PICKED_COLOR = '#ea580c';
const COPY_NAME = `${TOUR_NAMES.roadBike} (copy)`;

/**
 * The tour card: the box whose head carries the Track color dot. Only the
 * tour card has that button in a header, the place card names its own
 * "Track color".
 */
const card = (page: Page) => page.locator('header:has(button[aria-label="Track color"])').locator('xpath=..');
const head = (page: Page) => card(page).locator('> header');
const footer = (page: Page) => card(page).locator('> footer');
/** A block of the card by its heading: every block is a <section> that opens with it. */
const section = (page: Page, heading: string) =>
  card(page).getByText(heading, { exact: true }).first().locator('xpath=ancestor::section[1]');
/** The Places | Tours switch at the top of the right column. */
const toursTab = (page: Page) => page.getByRole('tablist', { name: 'Add view' }).getByRole('tab', { name: 'Tours' });
/** A tour's row in the Tours list. */
const row = (page: Page, name: string) => page.getByRole('option', { name, exact: true }).first();
/** The block of distance, times, heights and the profile: the first fact list with the altitudes, and its frame. */
const measures = (page: Page) =>
  card(page).locator('dl').filter({ hasText: 'Minimum altitude' }).first().locator('xpath=..');
/** "Files" while the tour has none, "<n> file(s)" once it has. */
const filesToggle = (page: Page) => card(page).getByRole('button', { name: /^(Files|\d+ files?)$/ });
const compare = (page: Page) => card(page).getByRole('region', { name: 'Plan and actual' });

const only = (target: (p: Page) => Locator) => ({ target });

/** Switch the right column to Tours and open a tour's card from its row. */
async function openTour(page: Page, name: string): Promise<void> {
  if ((await toursTab(page).getAttribute('aria-selected')) !== 'true') await toursTab(page).click();
  await expect(row(page, name)).toBeVisible({ timeout: 30_000 });
  await row(page, name).click();
  await expect(head(page).getByRole('heading', { name, exact: true })).toBeVisible({ timeout: 30_000 });
  await settle(page);
}

async function putPlace(page: Page, tripId: number, placeId: number, data: Record<string, unknown>): Promise<void> {
  const res = await page.request.put(`/api/trips/${tripId}/places/${placeId}`, { data });
  if (!res.ok()) throw new Error(`restore place ${placeId}: ${res.status()} ${(await res.text()).slice(0, 300)}`);
}

const SCRIPTS: Record<string, GuideScript> = {
  'tour-detail-read': {
    guide: guide('tour-detail-read'),
    // Day 4 open, the first stage of the hut trek, so the card knows the stop it was opened on.
    start: async (p) => {
      await openTourTrip(p, { day: 4 });
    },
    steps: [
      {
        prepare: async (p) => {
          await toursTab(p).click();
          await expect(row(p, TOUR_NAMES.hutToHut)).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
        target: (p) => row(p, TOUR_NAMES.hutToHut),
        act: async (p) => {
          await row(p, TOUR_NAMES.hutToHut).click();
          await expect(head(p).getByRole('heading', { name: TOUR_NAMES.hutToHut, exact: true })).toBeVisible({
            timeout: 30_000,
          });
          await settle(p);
        },
      },
      only(head),
      // The pill with the clock; hovering it shows the parts of the time.
      only((p) =>
        head(p)
          .locator('span[aria-label]')
          .filter({ has: p.locator('svg.lucide-clock') })
          .first()
      ),
      only((p) => section(p, 'Trip days')),
      only(measures),
      only((p) => section(p, 'Origin')),
      // No click: the open card is what the guide leaves behind.
      only((p) => head(p).getByRole('button', { name: 'Close', exact: true })),
    ],
  },

  'tour-rename-colour': {
    guide: guide('tour-rename-colour'),
    start: async (p) => {
      await openTourTrip(p, { day: null });
      await openTour(p, TOUR_NAMES.roadBike);
    },
    steps: [
      {
        target: (p) => head(p).getByRole('button', { name: 'Edit', exact: true }),
        act: async (p) => {
          await head(p).getByRole('button', { name: 'Edit', exact: true }).click();
          await expect(head(p).getByRole('textbox', { name: 'Name' })).toBeVisible();
          await typeInto(p, head(p).getByRole('textbox', { name: 'Name' }), RENAMED);
          await settle(p);
        },
      },
      {
        target: (p) => head(p).getByRole('textbox', { name: 'Name' }).locator('xpath=..'),
        act: async (p) => {
          await head(p).getByRole('button', { name: 'Save', exact: true }).click();
          await expect(head(p).getByRole('heading', { name: RENAMED, exact: true })).toBeVisible({ timeout: 20_000 });
          await settle(p);
        },
      },
      {
        target: (p) => head(p).getByRole('button', { name: 'Track color' }),
        act: async (p) => {
          await head(p).getByRole('button', { name: 'Track color' }).click();
          await expect(card(p).getByRole('button', { name: PICKED_COLOR, exact: true })).toBeVisible();
          await settle(p);
        },
      },
      {
        target: (p) => card(p).getByRole('button', { name: 'Automatic color' }).locator('xpath=ancestor::section[1]'),
        act: async (p) => {
          await card(p).getByRole('button', { name: PICKED_COLOR, exact: true }).click();
          await expect(card(p).getByRole('button', { name: PICKED_COLOR, exact: true })).toHaveAttribute(
            'aria-pressed',
            'true',
            { timeout: 20_000 }
          );
          await settle(p);
        },
      },
    ],
    cleanup: async (p) => {
      const { tripId, tours } = fixtures();
      const id = tours.roadBike ?? (await tourIdOf(p.request, tripId, RENAMED));
      await putPlace(p, tripId, id, { name: TOUR_NAMES.roadBike, route_color: null });
    },
  },

  'tour-take-along': {
    guide: guide('tour-take-along'),
    // The city walk: the one tour with a web page of its own.
    start: async (p) => {
      await openTourTrip(p, { day: null });
      await openTour(p, TOUR_NAMES.cityWalk);
    },
    steps: [
      {
        target: (p) => footer(p).getByRole('button', { name: 'Navigation' }),
        act: async (p) => {
          await footer(p).getByRole('button', { name: 'Navigation' }).click();
          await expect(p.getByRole('menu')).toBeVisible();
          await settle(p);
        },
      },
      {
        // Clicking it opens an external tab, so the step only shows it.
        prepare: async (p) => {
          await p.keyboard.press('Escape');
          await expect(p.getByRole('menu')).toHaveCount(0);
          // Escape may have closed the card as well; bring it back.
          if ((await card(p).count()) === 0) await openTour(p, TOUR_NAMES.cityWalk);
        },
        target: (p) => footer(p).getByRole('button', { name: /^Website: / }),
      },
      {
        target: (p) => footer(p).getByTestId('tour-gpx-export'),
        act: async (p) => {
          const download = p.waitForEvent('download', { timeout: 30_000 });
          await footer(p).getByTestId('tour-gpx-export').click();
          await download;
          await settle(p);
        },
      },
    ],
  },

  'tour-copy-keep': {
    guide: guide('tour-copy-keep'),
    start: async (p) => {
      const { tripId, collectionId } = fixtures();
      await deleteToursNamed(p.request, tripId, COPY_NAME);
      if (collectionId !== null) await unkeepTour(p.request, collectionId, TOUR_NAMES.roadBike);
      await openTourTrip(p, { day: null });
      await openTour(p, TOUR_NAMES.roadBike);
    },
    steps: [
      {
        // The visible label is Copy; the button is named by what it does.
        target: (p) => footer(p).getByRole('button', { name: 'Save as new tour' }),
        act: async (p) => {
          await footer(p).getByRole('button', { name: 'Save as new tour' }).click();
          await expect(head(p).getByRole('heading', { name: COPY_NAME, exact: true })).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
      only(head),
      {
        // Back to the original: that is the one kept for later trips.
        prepare: async (p) => {
          await openTour(p, TOUR_NAMES.roadBike);
        },
        target: (p) => footer(p).getByTestId('tour-keep-in-collection'),
        act: async (p) => {
          await footer(p).getByTestId('tour-keep-in-collection').click();
          await expect(p.getByTestId('keep-tour-confirm')).toBeVisible();
          await expect(p.getByTestId(`keep-tour-list-${fixtures().collectionId}`)).toBeVisible({ timeout: 20_000 });
          await settle(p);
        },
      },
      {
        target: (p) => p.getByTestId(`keep-tour-list-${fixtures().collectionId}`),
        act: async (p) => {
          await p.getByTestId(`keep-tour-list-${fixtures().collectionId}`).click();
          await p.getByTestId('keep-tour-confirm').click();
          await expect(p.getByTestId('keep-tour-confirm')).toHaveCount(0, { timeout: 30_000 });
          await settle(p);
        },
      },
    ],
    cleanup: async (p) => {
      const { tripId, collectionId } = fixtures();
      await deleteToursNamed(p.request, tripId, COPY_NAME);
      if (collectionId !== null) await unkeepTour(p.request, collectionId, TOUR_NAMES.roadBike);
    },
  },

  'tour-packing-link': {
    guide: guide('tour-packing-link'),
    start: async (p) => {
      const { tripId } = fixtures();
      await ensureTourDetailFixtures(p.request, tripId);
      await openTourTrip(p, { day: null });
      await openTour(p, TOUR_NAMES.ferrata);
    },
    steps: [
      {
        target: (p) => card(p).getByRole('button', { name: 'Link a packing list' }),
        act: async (p) => {
          await card(p).getByRole('button', { name: 'Link a packing list' }).click();
          await expect(p.getByTestId(`tour-packing-choice-${FERRATA_PACKING.category}`)).toBeVisible({
            timeout: 20_000,
          });
          await settle(p);
        },
      },
      {
        target: (p) => p.getByTestId(`tour-packing-choice-${FERRATA_PACKING.category}`),
        act: async (p) => {
          await p.getByTestId(`tour-packing-choice-${FERRATA_PACKING.category}`).click();
          await settle(p);
        },
      },
      {
        target: (p) => p.getByTestId('tour-packing-confirm'),
        act: async (p) => {
          await p.getByTestId('tour-packing-confirm').click();
          await expect(card(p).getByTestId('tour-packing-card')).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
      only((p) => card(p).getByTestId('tour-packing-card')),
      {
        target: (p) => card(p).getByRole('button', { name: 'Open packing list' }),
        act: async (p) => {
          await card(p).getByRole('button', { name: 'Open packing list' }).click();
          await expect(p.getByText(FERRATA_PACKING.items[0], { exact: true }).first()).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
    ],
    cleanup: async (p) => {
      const { tripId, tours } = fixtures();
      await unlinkPacking(p.request, tripId, tours.ferrata ?? (await tourIdOf(p.request, tripId, TOUR_NAMES.ferrata)));
    },
  },

  'tour-files': {
    guide: guide('tour-files'),
    start: async (p) => {
      await deleteTripFilesNamed(p.request, fixtures().tripId, HUT_BOOKING_FILE);
      await openTourTrip(p, { day: null });
      await openTour(p, TOUR_NAMES.hutToHut);
    },
    steps: [
      {
        target: (p) => section(p, 'Files').getByText('Upload', { exact: true }),
        act: async (p) => {
          await card(p).locator('input[type="file"][multiple]').setInputFiles(hutBookingFixture());
          await expect(card(p).getByRole('button', { name: '1 file', exact: true })).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
      // The list unfolds itself once the upload lands.
      only((p) => section(p, 'Files')),
      // No click: opening the file hands the browser a download.
      only((p) => card(p).getByRole('button', { name: new RegExp(`^${HUT_BOOKING_FILE.replace('.', '\\.')}`) })),
    ],
    cleanup: (p) => deleteTripFilesNamed(p.request, fixtures().tripId, HUT_BOOKING_FILE),
  },

  'tour-activity-link': {
    guide: guide('tour-activity-link'),
    start: async (p) => {
      await ensureTourRecording(p.request);
      await unlinkInariRecording(p.request);
      await openTrip(p, { day: 5 });
      await openTour(p, TOUR_NAMES.inariHike);
    },
    steps: [
      {
        target: (p) => section(p, 'Actual track').getByRole('button', { name: 'Add actual track' }),
        act: async (p) => {
          await card(p).getByRole('button', { name: 'Add actual track' }).click();
          await expect(p.getByTestId('tour-activity-confirm')).toBeVisible({ timeout: 20_000 });
          await expect(p.getByTestId('tour-activity-candidate').first()).toBeVisible({ timeout: 20_000 });
          await settle(p);
        },
      },
      only((p) => p.getByText('Done on', { exact: true }).first().locator('xpath=ancestor::section[1]')),
      {
        target: (p) => p.getByRole('radio', { name: new RegExp(TOUR_NAMES.inariRecording) }),
        act: async (p) => {
          await p.getByRole('radio', { name: new RegExp(TOUR_NAMES.inariRecording) }).click();
          await expect(p.getByRole('radio', { name: new RegExp(TOUR_NAMES.inariRecording) })).toHaveAttribute(
            'aria-checked',
            'true'
          );
          await settle(p);
        },
      },
      {
        target: (p) => p.getByTestId('tour-activity-confirm'),
        act: async (p) => {
          await p.getByTestId('tour-activity-confirm').click();
          await expect(card(p).getByTestId('tour-activity')).toBeVisible({ timeout: 30_000 });
          await settle(p);
        },
      },
      only((p) => card(p).getByTestId('tour-activity')),
    ],
    // The guide ends where ensureTourRecording leaves the hike: the recording linked on day 5.
    cleanup: async (p) => {
      await ensureTourRecording(p.request);
    },
  },

  'tour-activity-compare': {
    guide: guide('tour-activity-compare'),
    start: async (p) => {
      await ensureTourRecording(p.request);
      await openTrip(p, { day: 5 });
      await openTour(p, TOUR_NAMES.inariHike);
    },
    steps: [
      only((p) => card(p).getByTestId('tour-activity-compare')),
      // The fact list under the table: Farthest from the plan and Off the plan.
      only((p) => compare(p).locator('dl').last()),
      {
        target: (p) => compare(p).getByRole('button', { name: 'Compare on map' }),
        act: async (p) => {
          await compare(p).getByRole('button', { name: 'Compare on map' }).click();
          await expect(compare(p).getByRole('button', { name: 'End comparison' })).toBeVisible();
          await settle(p);
        },
      },
      only((p) => card(p).getByTestId('tour-activity').locator('footer')),
    ],
  },

  'tour-origin-check': {
    guide: guide('tour-origin-check'),
    // The imported Seceda walk first, then the hut trek, which was drawn in TREK.
    start: async (p) => {
      await openTourTrip(p, { day: null });
      await openTour(p, TOUR_NAMES.recorded);
    },
    steps: [
      only((p) => section(p, 'Origin').getByText('Source', { exact: true }).locator('xpath=..')),
      only((p) => section(p, 'Origin')),
      {
        prepare: async (p) => {
          await openTour(p, TOUR_NAMES.hutToHut);
        },
        target: (p) => section(p, 'Origin'),
      },
    ],
  },
};

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  fx = await ensureToursFixtures(request);
  if (fx.collectionId === null)
    throw new Error(`no collection "${TOUR_COLLECTION}": ensureToursFixtures could not make it`);
  await ensureTourDetailFixtures(request, fx.tripId);
});

// The recording is one more tour in a trip the other screens photograph.
test.afterAll(async ({ request }) => {
  await removeInariRecording(request);
});

test('every registered tour card guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripTourDetailContext.guides].sort());
});

test('hero: trip-tour-detail', async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await captureHero(page, tripTourDetailContext.id, async (p) => {
    await openTourTrip(p, { day: 4 });
    await openTour(p, TOUR_NAMES.hutToHut);
  });
});

for (const id of tripTourDetailContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await captureGuide(page, SCRIPTS[id]);
  });
}
