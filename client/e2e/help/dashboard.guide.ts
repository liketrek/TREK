import { test, expect, type Page } from '@playwright/test'
import { clearNotices } from '../screenshots/shot'
import { captureGuide, captureHero, dismissReleaseNotice, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { monthName, monthsAhead, pickerLabelOn } from '../dates'
import { ensureExtraTrips, coverFixture, card, EXTRA_TRIPS } from './fixtures'
import { dashboardGuides, dashboardContext } from '../../src/help/contexts/dashboard'
import type { HelpGuide } from '../../src/help/types'

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

/** Hover-revealed action on a card. */
const cardAction = (page: Page, title: string, name: string) => card(page, title).locator(`.trip-action-btn[aria-label="${name}"]`)

/** The trip the create guide makes, eight months out, named after the month it lands in. */
const NEW_TRIP = `Amalfi Coast in ${monthName(8)}`

const SCRIPTS: Record<string, GuideScript> = {
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
    start: openDashboard,
    steps: [
      {
        target: p => cardAction(p, LISBON, 'Edit'),
        act: async p => { await cardAction(p, LISBON, 'Edit').click(); await expect(modal(p)).toBeVisible() },
      },
      {
        target: p => modal(p).getByRole('button', { name: /Add cover image/ }),
        act: async p => {
          await modal(p).locator('input[type="file"]').setInputFiles(await coverFixture())
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
        target: p => p.getByRole('button', { name: 'Subscribe to all trips calendar' }),
        act: async p => { await p.getByRole('button', { name: 'Subscribe to all trips calendar' }).click() },
      },
      {
        target: p => p.getByRole('button', { name: 'Enable calendar subscription' }),
        act: async p => {
          await p.getByRole('button', { name: 'Enable calendar subscription' }).click()
          await expect(p.getByText(/Add to Google Calendar/i)).toBeVisible({ timeout: 15_000 })
        },
      },
      {
        // This dialog has no shared backdrop class: its card is the box that holds the buttons.
        target: p => p.getByText(/Add to Google Calendar/i).locator('xpath=ancestor::div[contains(@style,"border-radius")][1]'),
      },
    ],
    cleanup: async p => { await p.keyboard.press('Escape') },
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
        target: p => p.getByText('Dashboard widgets', { exact: true }).first().locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'),
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
        target: p => p.getByRole('button', { name: 'Add timezone' }),
        act: async p => {
          await p.getByRole('button', { name: 'Add timezone' }).click()
          await beat(p, 600)
        },
      },
      {
        prepare: async p => {
          // Close the picker again so the row's remove button is what the picture shows.
          await p.getByRole('button', { name: 'Add timezone' }).click()
          await p.locator('.tz-row').first().hover()
        },
        target: p => p.locator('.tz-row').first().locator('.tz-del'),
      },
    ],
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await ensureExtraTrips(request)
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
