import { test, expect, type Page } from '@playwright/test'
import { clearNotices } from '../screenshots/shot'
import { captureGuide, captureHero, dismissReleaseNotice, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { monthName, monthsAhead, pickerLabelOn } from '../dates'
import { ensureExtraTrips, coverFixture, card, EXTRA_TRIPS } from './fixtures'
import { ensureDashboardFixtures, tripIdByTitle, LISBON_FLIGHT } from './fixtures-dashboard'
import { dashboardGuides, dashboardContext } from '../../src/help/contexts/dashboard'
import type { HelpGuide } from '../../src/help/types'
import { coverPhoto } from '../screenshots/photos'

/**
 * Actions for the dashboard guides. Each script is keyed by the guide id from
 * `src/help/contexts/dashboard.ts` and has exactly one action per registered
 * step; the runner refuses a mismatch, so a step added to the registry without
 * an action here fails this run instead of shipping a raw key.
 */

const LISBON = EXTRA_TRIPS[0].title
const NORWAY = EXTRA_TRIPS[1].title

const guide = (id: string): HelpGuide => {
  const g = dashboardGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

async function openDashboard(page: Page): Promise<void> {
  await page.goto('/dashboard')
  await clearNotices(page)
  await dismissReleaseNotice(page)
  await expect(page.locator('.hero-trip')).toBeVisible()
  await expect(card(page, LISBON)).toBeVisible()
}


/** The trip form, scoped so the cover-search inputs above the title cannot be matched by accident. */
const modal = (page: Page) => page.locator('.trek-modal-backdrop')
/** The topmost dialog of any kind (confirm, copy, calendar): they all share the backdrop class. */
const dialog = (page: Page) => page.locator('.trek-backdrop-enter').last()
const titleField = (page: Page) => modal(page).getByPlaceholder('e.g. Summer in Japan')
/**
 * A date picker's trigger by the label above it. The trigger names itself after
 * its value once one is set (and the end date is filled in the moment the start
 * is picked), so "End Date" as a button name only works while it is empty.
 */
const datePicker = (page: Page, label: string) =>
  modal(page).getByText(label, { exact: true }).locator('xpath=..').getByRole('button').first()

/** Pick a date in the calendar popup: open it, go to the month, click the day. */
async function pickDate(page: Page, trigger: ReturnType<Page['getByRole']>, monthsAhead: number, dayLabel: string): Promise<void> {
  await trigger.click()
  for (let i = 0; i < monthsAhead; i++) {
    await page.getByRole('button', { name: 'Next month' }).click()
    await beat(page, 350)
  }
  await page.getByRole('button', { name: dayLabel, exact: true }).click()
}

/** One of the four actions in the top-right corner of a card's photo. */
const cardAction = (page: Page, title: string, name: string) => card(page, title).locator(`.trip-action-btn[aria-label="${name}"]`)

/** The trip the create guide makes, eight months out, named after the month it lands in. */
const NEW_TRIP = `Amalfi Coast in ${monthName(8)}`

/** The trip search above the cards (#2190), by its accessible name. */
const tripSearch = (page: Page) => page.getByRole('searchbox', { name: 'Search all trips by title, date or place' })
const JAPAN = 'Autumn in Japan'

/** The trip the date-less guide makes and its cleanup drops again. */
const IDEA_TRIP = 'Patagonia, someday'

/** A field block of the trip form by the label above it (the label is not tied to its input). */
const formBlock = (page: Page, label: string) => modal(page).getByText(label, { exact: true }).locator('xpath=..')

/** A widget in the right column by its heading. */
const widget = (page: Page, title: string) => page.locator('.tool').filter({ has: page.locator('.tool-title', { hasText: title }) })

/** Drop every trip with this exact title over the API, so the grid is back to the seed. */
async function dropTrips(page: Page, title: string): Promise<void> {
  const res = await page.request.get('/api/trips')
  const body = (await res.json()) as { trips?: { id: number; title: string }[] } | { id: number; title: string }[]
  const trips = Array.isArray(body) ? body : (body.trips ?? [])
  for (const t of trips.filter(x => x.title === title)) {
    const dropped = await page.request.delete(`/api/trips/${t.id}`)
    if (!dropped.ok()) throw new Error(`could not drop "${t.title}": ${dropped.status()}`)
  }
}

/** The Norway trip's reminder before the reminder guide changed it, put back by its cleanup. */
let norwayReminder = 0

/** The Lisbon flight in the Upcoming reservations widget (fixtures-dashboard.ts). */
const upcomingRow = (page: Page) => widget(page, 'Upcoming reservations').locator('.upc-item').filter({ hasText: LISBON_FLIGHT })

/** A clock in the Timezones widget by its city. */
const clockRow = (page: Page, city: string) => widget(page, 'Timezones').locator('.tz-row').filter({ hasText: city })

const SCRIPTS: Record<string, GuideScript> = {
  'search-trips': {
    guide: guide('search-trips'),
    start: openDashboard,
    steps: [
      {
        target: p => tripSearch(p).locator('xpath=..'),
        act: async p => {
          await typeInto(p, tripSearch(p), 'Nishiki')
          await expect(card(p, JAPAN)).toBeVisible({ timeout: 15_000 })
          await expect(card(p, JAPAN).getByText('Nishiki Market')).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => card(p, JAPAN),
        act: async p => {
          await p.getByRole('button', { name: 'Clear search' }).click()
          await expect(card(p, LISBON)).toBeVisible()
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      if (await tripSearch(p).count()) await tripSearch(p).fill('')
    },
  },
  'create-trip': {
    guide: guide('create-trip'),
    start: openDashboard,
    steps: [
      {
        target: p => p.locator('.add-trip-card'),
        act: async p => { await p.locator('.add-trip-card').click(); await expect(modal(p)).toBeVisible() },
      },
      {
        target: p => titleField(p),
        act: async p => { await typeInto(p, titleField(p), NEW_TRIP) },
      },
      {
        target: p => datePicker(p, 'Start Date'),
        act: async p => {
          await pickDate(p, datePicker(p, 'Start Date'), 8, pickerLabelOn(monthsAhead(8, 8)))
          await beat(p, 500)
          // The end date follows the start date, so its calendar already opens on May.
          await pickDate(p, datePicker(p, 'End Date'), 0, pickerLabelOn(monthsAhead(8, 15)))
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: /Add cover image/ }),
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Create New Trip' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Create New Trip' }).click()
          await expect(card(p, NEW_TRIP)).toBeVisible({ timeout: 15_000 })
        },
      },
    ],
    cleanup: async p => {
      // The delete guide removes this trip on camera; until then it stays.
      void p
    },
  },

  'dateless-trip': {
    guide: guide('dateless-trip'),
    start: async p => {
      await dropTrips(p, IDEA_TRIP)
      await openDashboard(p)
    },
    steps: [
      {
        target: p => p.locator('.add-trip-card'),
        act: async p => {
          await p.locator('.add-trip-card').click()
          await expect(modal(p)).toBeVisible()
          await typeInto(p, titleField(p), IDEA_TRIP)
        },
      },
      {
        // Only there while both dates are empty, which they are on a new trip.
        target: p => formBlock(p, 'Number of Days'),
        act: async p => {
          await formBlock(p, 'Number of Days').locator('input').fill('10')
          await beat(p, 300)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Create New Trip' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Create New Trip' }).click()
          await expect(card(p, IDEA_TRIP)).toBeVisible({ timeout: 15_000 })
          await expect(card(p, IDEA_TRIP).getByText('Open dates')).toBeVisible()
          await card(p, IDEA_TRIP).scrollIntoViewIfNeeded()
          await settle(p)
        },
      },
    ],
    cleanup: async p => { await dropTrips(p, IDEA_TRIP) },
  },

  'edit-trip': {
    guide: guide('edit-trip'),
    start: openDashboard,
    steps: [
      {
        target: p => cardAction(p, NORWAY, 'Edit'),
        act: async p => { await cardAction(p, NORWAY, 'Edit').click(); await expect(modal(p)).toBeVisible() },
      },
      {
        target: p => titleField(p),
        act: async p => {
          await titleField(p).fill('')
          await typeInto(p, titleField(p), 'Norway Road Trip')
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Update' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Update' }).click()
          await expect(modal(p)).toBeHidden({ timeout: 15_000 })
        },
      },
    ],
  },

  'cover-image': {
    guide: guide('cover-image'),
    // The showcase gives Lisbon its photo; the guide starts from a trip without
    // one and puts the same photo back, so the next guide sees the seed again.
    start: async p => {
      const id = await tripIdByTitle(p.request, LISBON)
      await p.request.put(`/api/trips/${id}`, { data: { cover_image: null } })
      await openDashboard(p)
    },
    steps: [
      {
        target: p => cardAction(p, LISBON, 'Edit'),
        act: async p => { await cardAction(p, LISBON, 'Edit').click(); await expect(modal(p)).toBeVisible() },
      },
      {
        target: p => modal(p).getByRole('button', { name: /Add cover image/ }),
        act: async p => {
          await modal(p).locator('input[type="file"]').setInputFiles((await coverPhoto('lisbon')) ?? (await coverFixture()))
          await expect(modal(p).getByRole('button', { name: 'Change' })).toBeVisible({ timeout: 15_000 })
        },
      },
      {
        prepare: async p => { await settle(p) },
        target: p => modal(p).getByRole('button', { name: 'Update' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Update' }).click()
          await expect(modal(p)).toBeHidden({ timeout: 15_000 })
          await expect(card(p, LISBON).locator('.trip-cover img')).toBeVisible({ timeout: 15_000 })
        },
      },
    ],
  },

  'trip-reminder': {
    guide: guide('trip-reminder'),
    start: async p => {
      const id = await tripIdByTitle(p.request, NORWAY)
      const res = await p.request.get(`/api/trips/${id}`)
      const body = (await res.json()) as { trip?: { reminder_days?: number }; reminder_days?: number }
      norwayReminder = body.trip?.reminder_days ?? body.reminder_days ?? 0
      await openDashboard(p)
    },
    steps: [
      {
        target: p => cardAction(p, NORWAY, 'Edit'),
        act: async p => { await cardAction(p, NORWAY, 'Edit').click(); await expect(modal(p)).toBeVisible() },
      },
      {
        // The presets only show while trip reminders are on (ensureDashboardFixtures).
        prepare: async p => {
          await expect(formBlock(p, 'Reminder').getByRole('button', { name: 'Custom' })).toBeVisible()
        },
        target: p => formBlock(p, 'Reminder'),
        act: async p => {
          await formBlock(p, 'Reminder').getByRole('button', { name: 'Custom' }).click()
          await formBlock(p, 'Reminder').locator('input').fill('14')
          await expect(formBlock(p, 'Reminder').getByText('days before departure')).toBeVisible()
          await beat(p, 300)
        },
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Update' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Update' }).click()
          await expect(modal(p)).toBeHidden({ timeout: 15_000 })
        },
      },
    ],
    cleanup: async p => {
      const id = await tripIdByTitle(p.request, NORWAY)
      const res = await p.request.put(`/api/trips/${id}`, { data: { reminder_days: norwayReminder } })
      if (!res.ok()) throw new Error(`could not put the Norway reminder back: ${res.status()}`)
    },
  },

  'duplicate-trip': {
    guide: guide('duplicate-trip'),
    start: openDashboard,
    steps: [
      {
        target: p => cardAction(p, LISBON, 'Duplicate'),
        act: async p => { await cardAction(p, LISBON, 'Duplicate').click() },
      },
      {
        target: p => dialog(p).getByRole('button', { name: 'Copy trip' }),
        act: async p => {
          await dialog(p).getByRole('button', { name: 'Copy trip' }).click()
          await expect(p.locator('.trip-card').filter({ hasText: LISBON })).toHaveCount(2, { timeout: 15_000 })
        },
      },
    ],
    cleanup: async p => {
      // Drop the copy over the API so the grid is back to the seed for the next
      // guide. By title, not by position: the list came back in an order that
      // left the copy standing, and a trip nobody expected then broke a guide
      // three files later, in a screen that has nothing to do with this one.
      const res = await p.request.get('/api/trips')
      const body = (await res.json()) as { trips?: { id: number; title: string }[] } | { id: number; title: string }[]
      const trips = Array.isArray(body) ? body : (body.trips ?? [])
      for (const t of trips.filter(x => x.title !== LISBON && x.title.startsWith(LISBON))) {
        const dropped = await p.request.delete(`/api/trips/${t.id}`)
        if (!dropped.ok()) throw new Error(`could not drop the copy "${t.title}": ${dropped.status()}`)
      }
    },
  },

  'archive-trip': {
    guide: guide('archive-trip'),
    start: openDashboard,
    steps: [
      {
        target: p => cardAction(p, NORWAY, 'Archive'),
        act: async p => {
          await cardAction(p, NORWAY, 'Archive').click()
          await expect(card(p, NORWAY)).toBeHidden({ timeout: 15_000 })
        },
      },
      {
        target: p => p.locator('.seg').getByRole('button', { name: 'Archived' }),
        act: async p => {
          await p.locator('.seg').getByRole('button', { name: 'Archived' }).click()
          await expect(card(p, NORWAY)).toBeVisible({ timeout: 15_000 })
        },
      },
      {
        target: p => cardAction(p, NORWAY, 'Restore'),
        act: async p => {
          await cardAction(p, NORWAY, 'Restore').click()
          await expect(card(p, NORWAY)).toBeHidden({ timeout: 15_000 })
          await beat(p, 400)
          await p.locator('.seg').getByRole('button', { name: 'Planned' }).click()
          await expect(card(p, NORWAY)).toBeVisible({ timeout: 15_000 })
        },
      },
    ],
  },

  'delete-trip': {
    guide: guide('delete-trip'),
    start: async p => {
      await openDashboard(p)
      await expect(card(p, NEW_TRIP)).toBeVisible()
    },
    steps: [
      {
        target: p => cardAction(p, NEW_TRIP, 'Delete'),
        act: async p => { await cardAction(p, NEW_TRIP, 'Delete').click() },
      },
      {
        target: p => dialog(p).getByRole('button', { name: 'Delete', exact: true }),
        act: async p => {
          await dialog(p).getByRole('button', { name: 'Delete', exact: true }).click()
          await expect(card(p, NEW_TRIP)).toBeHidden({ timeout: 15_000 })
        },
      },
    ],
  },

  'filter-and-view': {
    guide: guide('filter-and-view'),
    start: openDashboard,
    steps: [
      {
        target: p => p.locator('.seg'),
        act: async p => {
          await p.locator('.seg').getByRole('button', { name: 'Completed' }).click()
          await beat(p, 900)
          await p.locator('.seg').getByRole('button', { name: 'Planned' }).click()
          await expect(card(p, LISBON)).toBeVisible()
        },
      },
      {
        target: p => p.getByRole('button', { name: 'Toggle view' }),
        act: async p => {
          await p.getByRole('button', { name: 'Toggle view' }).click()
          await expect(p.locator('.trips.list-view')).toBeVisible()
        },
      },
    ],
    cleanup: async p => { await p.getByRole('button', { name: 'Toggle view' }).click() },
  },

  'calendar-feed': {
    guide: guide('calendar-feed'),
    start: openDashboard,
    steps: [
      {
        target: p => p.getByRole('button', { name: 'Subscribe to all trips' }),
        act: async p => {
          await p.getByRole('button', { name: 'Subscribe to all trips' }).click()
          const enable = p.getByRole('button', { name: 'Enable calendar subscription' })
          const turnOff = p.getByRole('button', { name: 'Turn off' })
          await expect(enable.or(turnOff)).toBeVisible({ timeout: 15_000 })
          // A run that died after enabling left a feed behind; start from none.
          if (await turnOff.isVisible()) {
            await turnOff.click()
            await expect(enable).toBeVisible({ timeout: 15_000 })
          }
        },
      },
      {
        target: p => p.getByRole('button', { name: 'Enable calendar subscription' }),
        act: async p => {
          await p.getByRole('button', { name: 'Enable calendar subscription' }).click()
          await expect(p.getByText('Add to Google Calendar')).toBeVisible({ timeout: 15_000 })
        },
      },
      {
        // Open the manual links too, so the picture shows every way the step names.
        prepare: async p => {
          await p.getByText('Or copy a link manually', { exact: true }).click()
          await beat(p, 400)
        },
        target: p => p.getByRole('dialog').last(),
      },
    ],
    cleanup: async p => {
      const turnOff = p.getByRole('button', { name: 'Turn off' })
      if (await turnOff.isVisible()) {
        await turnOff.click()
        await expect(p.getByRole('button', { name: 'Enable calendar subscription' })).toBeVisible({ timeout: 15_000 })
      }
      await p.keyboard.press('Escape')
    },
  },

  'upcoming-reservations': {
    guide: guide('upcoming-reservations'),
    start: async p => {
      await openDashboard(p)
      await expect(upcomingRow(p)).toBeVisible({ timeout: 15_000 })
    },
    steps: [
      {
        target: p => widget(p, 'Upcoming reservations'),
      },
      {
        target: p => upcomingRow(p),
        act: async p => {
          await upcomingRow(p).click()
          await expect(p).toHaveURL(/\/trips\/\d+/, { timeout: 15_000 })
        },
      },
    ],
  },

  widgets: {
    guide: guide('widgets'),
    start: openDashboard,
    steps: [
      {
        prepare: async p => {
          await p.locator('nav button').filter({ has: p.locator('svg.lucide-chevron-down') }).first().click()
          await beat(p, 500)
        },
        target: p => p.getByRole('link', { name: 'Settings' }),
        act: async p => {
          await p.getByRole('link', { name: 'Settings' }).click()
          await expect(p).toHaveURL(/\/settings/)
          await settle(p)
        },
      },
      {
        target: p => p.getByRole('button', { name: 'Appearance', exact: true }).first(),
        act: async p => {
          await p.getByRole('button', { name: 'Appearance', exact: true }).first().click()
          await expect(p.getByText('Dashboard widgets', { exact: true }).first()).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await p.getByText('Dashboard widgets', { exact: true }).first().scrollIntoViewIfNeeded()
          await beat(p, 400)
        },
        // The Section card itself: the nearest rounded container around its heading.
        target: p => p.getByText('Dashboard widgets', { exact: true }).first().locator('xpath=ancestor::section[1]'),
      },
      {
        target: p => p.getByRole('link', { name: 'My Trips' }),
        act: async p => {
          await p.getByRole('link', { name: 'My Trips' }).click()
          await expect(p.locator('.hero-trip')).toBeVisible()
          await settle(p)
        },
      },
    ],
  },

  'currency-widget': {
    guide: guide('currency-widget'),
    start: openDashboard,
    steps: [
      {
        target: p => p.locator('.tool').filter({ hasText: 'Currency' }).locator('.fx-input'),
        act: async p => {
          const amount = p.locator('.tool').filter({ hasText: 'Currency' }).locator('input.amt').first()
          await amount.fill('')
          await typeInto(p, amount, '250')
        },
      },
      {
        target: p => p.getByRole('button', { name: 'Swap currencies' }),
        act: async p => { await p.getByRole('button', { name: 'Swap currencies' }).click() },
      },
    ],
  },

  'timezones-widget': {
    guide: guide('timezones-widget'),
    start: openDashboard,
    steps: [
      {
        // The picker opens under the + and lists the zones by their IANA names.
        prepare: async p => {
          await p.getByRole('button', { name: 'Add timezone' }).click()
          await widget(p, 'Timezones').getByRole('button', { name: 'Search timezone…' }).click()
          await typeInto(p, p.getByLabel('Search', { exact: true }), 'Lisbon')
          await expect(p.getByRole('button', { name: 'Europe/Lisbon', exact: true })).toBeVisible()
        },
        target: p => widget(p, 'Timezones'),
        act: async p => {
          await p.getByRole('button', { name: 'Europe/Lisbon', exact: true }).click()
          await expect(clockRow(p, 'Lisbon')).toBeVisible()
        },
      },
      {
        prepare: async p => {
          await clockRow(p, 'Lisbon').hover()
          await beat(p, 300)
        },
        target: p => clockRow(p, 'Lisbon').locator('.tz-del'),
        act: async p => {
          await clockRow(p, 'Lisbon').locator('.tz-del').click()
          await expect(clockRow(p, 'Lisbon')).toHaveCount(0)
        },
      },
    ],
    cleanup: async p => {
      // Take the clock out again should the guide have stopped half way.
      const row = clockRow(p, 'Lisbon')
      if (await row.count()) { await row.hover(); await row.locator('.tz-del').click() }
    },
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureExtraTrips(request)
  await ensureDashboardFixtures(request)
})

test('every registered dashboard guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual(dashboardContext.guides.slice().sort())
})

test('hero: the dashboard', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, dashboardContext.id, openDashboard)
})

for (const id of dashboardContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
