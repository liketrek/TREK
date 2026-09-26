import { test, expect, type Page, type Locator } from '@playwright/test'
import { captureGuide, captureHero, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { seededTrip, ensureDayDetailFixtures, KYOTO_HOTEL, TOKYO_HOTEL, EVENING_WALK } from './fixtures'
import { openTrip } from './trip-shared'
import { tripDayDetailContext, tripDayDetailGuides } from '../../src/help/contexts/tripDayDetail'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the day details panel of a trip, keyed by the ids in
 * `src/help/contexts/tripDayDetail.ts`. They run on the seeded "Autumn in
 * Japan" with the day fixtures in place, so day 1 carries the flight and the
 * Tokyo hotel and day 5 the train and its evening walk; what a guide writes it
 * takes back in `cleanup`, so the next one starts from the same seed.
 */

const guide = (id: string): HelpGuide => {
  const g = tripDayDetailGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

/** The name the rename guide gives day 5, and takes away again. */
const DAY_NAME = 'Arrival in Kyoto'

/** The panel itself: the only `fixed z-50` in the client. */
const panel = (page: Page) => page.locator('div.fixed.z-50')
/** A day's header in the days column; its name is number, weather, title, date. */
const dayHeader = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^${n} .*Day ${n} `) })
/**
 * The hotel picker is a portal of its own with neither `trek-modal-backdrop`
 * nor `trek-backdrop-enter`, so `modal()` and `confirmDialog()` never see it;
 * the card is the second `role="presentation"` and holds the day range.
 */
const picker = (page: Page) => page.locator('div[role="presentation"]').filter({ hasText: 'Apply to days' }).last()
/** The accommodation block: the heading's parent holds the stays and the add button. */
const stays = (page: Page) => panel(page).getByText('Accommodation', { exact: true }).locator('xpath=..')
/** One booked stay: a card of the list inside that block. */
const stayCard = (page: Page, name: string) => stays(page).locator('> div > div').filter({ hasText: name }).first()
/** The caption that opens the weather block. */
const forecast = (page: Page) => panel(page).getByText(/^Forecast for /)
/** The chips row; the summary above it and the hourly strip below are its siblings. */
const chips = (page: Page) => panel(page).locator('svg.lucide-sunrise').locator('xpath=ancestor::div[2]')
/** The day's reservations block. */
const bookings = (page: Page) => panel(page).getByText('Reservations', { exact: true }).locator('xpath=..')
/** One booking row: the title sits in a wrapper, the row is its grandparent. */
const bookingRow = (page: Page, title: string) => panel(page).getByText(title).locator('xpath=ancestor::div[2]')

/**
 * Select a day by its title rather than by the middle of its header: a day with
 * a night booked over it carries a hotel button there, and that button opens the
 * place instead of selecting the day.
 */
const selectDay = async (page: Page, n: number): Promise<void> => {
  await dayHeader(page, n).getByText(`Day ${n}`, { exact: true }).click()
  await expect(panel(page)).toBeVisible()
  await settle(page)
}

/** Open the trip with day `n`'s panel open; `openTrip`'s own day closes it again. */
const openDay = async (page: Page, n: number): Promise<void> => {
  await openTrip(page, { day: null })
  await selectDay(page, n)
}

interface Stay {
  id: number
  place_id: number | null
  place_name?: string | null
  start_day_id: number
  end_day_id: number
}

async function stayOf(page: Page, name: string): Promise<Stay | undefined> {
  const { tripId } = seededTrip()
  const res = await page.request.get(`/api/trips/${tripId}/accommodations`)
  const { accommodations } = (await res.json()) as { accommodations: Stay[] }
  return accommodations.find(a => a.place_name === name)
}

/** Cancel a night again. The stop it put on the day and its Hotel booking go with it. */
async function removeStay(page: Page, name: string): Promise<void> {
  const { tripId } = seededTrip()
  const stay = await stayOf(page, name)
  if (stay) await page.request.delete(`/api/trips/${tripId}/accommodations/${stay.id}`)
}

/** The update route reads every field off the body, so the whole stay goes back. */
async function restoreTokyoStay(page: Page): Promise<void> {
  const { tripId } = seededTrip()
  const stay = await stayOf(page, TOKYO_HOTEL)
  if (!stay) return
  await page.request.put(`/api/trips/${tripId}/accommodations/${stay.id}`, {
    data: {
      place_id: stay.place_id,
      start_day_id: stay.start_day_id,
      end_day_id: stay.end_day_id,
      check_in: '15:00',
      check_in_end: null,
      check_out: '11:00',
      confirmation: 'GRC-7731',
    },
  })
}

/**
 * Give day 5 its number back: `selectDay` finds a day by "5 … Day 5 ", which a
 * renamed day no longer answers to, and every later guide uses it.
 */
async function resetDayTitle(page: Page, index: number): Promise<void> {
  const { tripId, dayIds } = seededTrip()
  await page.request.put(`/api/trips/${tripId}/days/${dayIds[index]}`, { data: { title: null } })
}

const only = (target: (p: Page) => Locator) => ({ target })

const SCRIPTS: Record<string, GuideScript> = {
  'day-panel': {
    guide: guide('day-panel'),
    start: p => openTrip(p, { day: null }),
    steps: [
      {
        target: p => dayHeader(p, 1),
        act: async p => {
          await selectDay(p, 1)
          await expect(stays(p)).toBeVisible()
        },
      },
      only(p => panel(p).getByText('Day 1', { exact: true }).locator('xpath=ancestor::div[2]')),
      {
        // The forecast is asked for when the panel opens, and it is a round trip
        // to Open-Meteo; without the wait the picture catches the spinner.
        prepare: async p => { await expect(forecast(p)).toBeVisible({ timeout: 20_000 }) },
        target: p => forecast(p).locator('xpath=..'),
      },
      only(bookings),
      only(stays),
      {
        target: p => panel(p).getByRole('button', { name: 'Collapse' }),
        act: async p => {
          // Every day card carries a chevron with the same label, so the panel's
          // own is reached through the panel.
          await panel(p).getByRole('button', { name: 'Collapse' }).click()
          await expect(panel(p).getByRole('button', { name: 'Expand' })).toBeVisible()
          await expect(stays(p)).toBeHidden()
          await settle(p)
        },
      },
    ],
  },
  'day-weather': {
    guide: guide('day-weather'),
    start: async p => {
      await openDay(p, 5)
      // Day 5 has one located stop, so the forecast is that stop's.
      await expect(panel(p).getByText('Forecast for Fushimi Inari Taisha')).toBeVisible({ timeout: 20_000 })
    },
    steps: [
      only(forecast),
      only(p => chips(p).locator('xpath=preceding-sibling::div[1]')),
      only(chips),
      only(p => chips(p).locator('xpath=following-sibling::div[1]')),
    ],
  },
  'rename-day': {
    guide: guide('rename-day'),
    start: p => openDay(p, 5),
    steps: [
      only(p => panel(p).getByText('Day 5', { exact: true }).locator('xpath=ancestor::div[2]')),
      {
        // Every booking row of the open day carries an Edit of its own in the
        // days column (DayPlanSidebar), so the header's pencil is reached
        // through the panel; inside it, it is the only one.
        target: p => panel(p).getByRole('button', { name: 'Edit', exact: true }),
        act: async p => {
          await panel(p).getByRole('button', { name: 'Edit', exact: true }).click()
          await expect(panel(p).getByPlaceholder('Day 5')).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => { await typeInto(p, panel(p).getByPlaceholder('Day 5'), DAY_NAME) },
        target: p => panel(p).getByPlaceholder('Day 5'),
        act: async p => {
          await p.keyboard.press('Enter')
          await expect(panel(p).getByText(DAY_NAME, { exact: true })).toBeVisible()
          await settle(p)
        },
      },
      only(p => p.getByRole('button', { name: new RegExp(`^5 .*${DAY_NAME} `) })),
    ],
    cleanup: p => resetDayTitle(p, 4),
  },
  'add-accommodation': {
    guide: guide('add-accommodation'),
    start: p => openTrip(p, { day: null }),
    steps: [
      // The fixture put the hotel in the trip as a place; the picker offers
      // nothing else, and the rows of the column are options.
      only(p => p.getByRole('option', { name: new RegExp(`^${KYOTO_HOTEL.name}`) })),
      {
        prepare: async p => { await selectDay(p, 5) },
        target: p => p.getByRole('button', { name: 'Add accommodation' }),
        act: async p => {
          await p.getByRole('button', { name: 'Add accommodation' }).click()
          await expect(picker(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        // The options of a day select are portalled to the body, outside the picker.
        prepare: async p => {
          await picker(p).getByRole('button', { name: /^Day 6/ }).click()
          await p.getByRole('button', { name: /^Day 7/ }).last().click()
          await expect(picker(p).getByRole('button', { name: /^Day 7/ })).toBeVisible()
          await settle(p)
        },
        target: p => picker(p).getByText('Apply to days').locator('xpath=..'),
      },
      {
        // The three time fields normalise what is typed; the labels carry no
        // `for`, so every field is found by its placeholder.
        prepare: async p => {
          await picker(p).getByPlaceholder('14:00').fill('15:00')
          await picker(p).getByPlaceholder('22:00').fill('20:00')
          await picker(p).getByPlaceholder('11:00').fill('11:00')
          await typeInto(p, picker(p).getByPlaceholder('ABC-12345'), 'KNR-8842')
          await settle(p)
        },
        target: p => picker(p).getByPlaceholder('ABC-12345').locator('xpath=ancestor::div[2]'),
      },
      {
        // "All" is both the whole-trip shortcut and the no-filter chip, so the
        // category is clicked by its own name.
        prepare: async p => {
          await picker(p).getByRole('button', { name: 'Hotel', exact: true }).click()
          await settle(p)
        },
        target: p => picker(p).getByRole('button', { name: new RegExp(`^${KYOTO_HOTEL.name}`) }),
        act: async p => {
          await picker(p).getByRole('button', { name: new RegExp(`^${KYOTO_HOTEL.name}`) }).click()
          await expect(picker(p).getByRole('button', { name: 'Save' })).toBeEnabled()
        },
      },
      {
        target: p => picker(p).getByRole('button', { name: 'Save' }),
        act: async p => {
          await picker(p).getByRole('button', { name: 'Save' }).click()
          await expect(picker(p)).toHaveCount(0)
          await expect(stayCard(p, KYOTO_HOTEL.name)).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => removeStay(p, KYOTO_HOTEL.name),
  },
  'edit-accommodation': {
    guide: guide('edit-accommodation'),
    start: async p => {
      // The day fixtures book the Tokyo hotel over the first nights, so day 1
      // is its check-in day.
      await openDay(p, 1)
      await expect(stayCard(p, TOKYO_HOTEL)).toBeVisible({ timeout: 15_000 })
    },
    steps: [
      only(p => stayCard(p, TOKYO_HOTEL)),
      {
        // Neither the pencil nor the × carries a label; the icon is the handle.
        target: p => stayCard(p, TOKYO_HOTEL).locator('button:has(svg.lucide-pencil)'),
        act: async p => {
          await stayCard(p, TOKYO_HOTEL).locator('button:has(svg.lucide-pencil)').click()
          await expect(picker(p).getByText('Edit accommodation')).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await picker(p).getByPlaceholder('11:00').fill('10:00')
          await picker(p).getByPlaceholder('ABC-12345').click()
          await settle(p)
        },
        target: p => picker(p).getByPlaceholder('ABC-12345').locator('xpath=ancestor::div[2]'),
      },
      {
        target: p => picker(p).getByRole('button', { name: 'Save' }),
        act: async p => {
          await picker(p).getByRole('button', { name: 'Save' }).click()
          await expect(picker(p)).toHaveCount(0)
          await expect(stayCard(p, TOKYO_HOTEL).getByText('10:00')).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        // Deliberately not performed: the × removes the stay without a question,
        // and with it the seed's hotel booking and the stop it put on the day.
        prepare: async p => { await stayCard(p, TOKYO_HOTEL).hover() },
        target: p => stayCard(p, TOKYO_HOTEL).locator('button:has(svg.lucide-x)'),
      },
    ],
    cleanup: restoreTokyoStay,
  },
  'day-bookings': {
    guide: guide('day-bookings'),
    start: p => openDay(p, 5),
    steps: [
      only(bookings),
      only(p => bookingRow(p, EVENING_WALK)),
      only(p => bookingRow(p, 'Nozomi 21')),
      // Only pointed at: clicking it would leave the plan for the Bookings tab.
      only(p => p.getByRole('button', { name: 'Bookings', exact: true })),
    ],
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureDayDetailFixtures(request)
})

test('every registered day-detail guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual([...tripDayDetailContext.guides].sort())
})

test('hero: trip-day-detail', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  // Day 1 is the one day that has all four blocks at once: the forecast for its
  // first stop, the flight, and the hotel it checks into.
  await captureHero(page, tripDayDetailContext.id, p => openDay(p, 1))
})

for (const id of tripDayDetailContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
