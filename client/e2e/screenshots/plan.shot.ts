import type { Page } from '@playwright/test'
import { test, clearNotices, expect, seed } from './shot'
import { TOKYO_HOTEL } from '../help/fixtures'

/**
 * The Plan tab and the dialogs of the trip page, as the wiki pages for the day
 * plan, places, bookings, transports and costs show them. Every picture drives
 * the real UI by its roles and names, so a renamed control fails here instead
 * of quietly photographing the wrong thing.
 */

test.beforeEach(async ({ page }) => {
  await page.goto(`/trips/${seed.tripId}`)
  await clearNotices(page)
  await page.waitForTimeout(800)
})

const dialog = (page: Page) => page.getByRole('dialog').last()
const firstDayCard = (page: Page) => page.locator('.dp-day-header').first().locator('xpath=..')

async function openTab(page: Page, label: string) {
  // A tab can carry a longer name for screen readers than its label ("Book" for the bookings).
  await page.getByRole('button', { name: new RegExp(`^${label}`) }).first().click()
  await page.waitForTimeout(800)
}

// On the day's number at the left edge: the middle of the header is the booked
// night's pill once the day has a stay, and a click there opens the hotel instead.
async function selectDay(page: Page, index: number) {
  await page.locator('.dp-day-header').nth(index).click({ position: { x: 22, y: 20 } })
  await page.waitForTimeout(900)
}
const selectFirstDay = (page: Page) => selectDay(page, 0)

/** Out of the way, so no tooltip of the button just clicked stays in the picture. */
const parkPointer = (page: Page) => page.mouse.move(1, 1)

/** A row of the places column, by the place's name. */
const placeOption = (page: Page, name: string) => page.getByRole('option', { name: new RegExp(`^${name}`) }).first()

test('plan: a day card', async ({ page, shot }) => {
  await shot.element('PlanDayCard', firstDayCard(page))
})

test('plan: the day "+" menu', async ({ page, shot }) => {
  await selectFirstDay(page)
  await firstDayCard(page).locator('button[aria-label="Add to day"]').click()
  await expect(page.getByRole('button', { name: 'Add Note' })).toBeVisible()
  await shot.page_('PlanDayAddMenu')
})

test('plan: the route bar', async ({ page, shot }) => {
  await selectFirstDay(page)
  const bar = page.locator('[data-dp="route-tools"]').first()
  await expect(bar).toBeVisible()
  await shot.element('PlanRouteBar', bar)
})

test('plan: the places column', async ({ page, shot }) => {
  const column = page.getByPlaceholder('Search').first().locator('xpath=ancestor::div[contains(@class,"flex-col")][2]')
  await shot.element('PlacesColumn', column)
})

test('plan: the place inspector', async ({ page, shot }) => {
  await placeOption(page, 'Senso-ji Temple').click()
  await page.waitForTimeout(1200)
  await shot.page_('PlaceInspector')
})

test('plan: the save to list dialog', async ({ page, shot }) => {
  await placeOption(page, 'Senso-ji Temple').click()
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: /^Save to Collection/ }).first().click()
  await expect(dialog(page)).toBeVisible()
  await expect(dialog(page).getByText('Kyoto shortlist')).toBeVisible()
  await page.waitForTimeout(500)
  await shot.element('SaveToList', dialog(page))
})

test('plan: the edit place dialog', async ({ page, shot }) => {
  await placeOption(page, 'Senso-ji Temple').click()
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click()
  await expect(dialog(page)).toBeVisible()
  await page.waitForTimeout(2500)
  await shot.element('PlaceForm', dialog(page))
})

test('plan: the day details', async ({ page, shot }) => {
  await selectFirstDay(page)
  await shot.page_('DayDetails')
})

test('plan: the stay editor', async ({ page, shot }) => {
  // Day 9 has no stay yet, so its details offer Add accommodation.
  await selectDay(page, 8)
  await page.getByRole('button', { name: 'Add accommodation' }).first().click()
  await expect(dialog(page)).toBeVisible()
  // A hotel picked, so the head band carries its name.
  await dialog(page).getByText('Hotel Granvia Kyoto', { exact: true }).click()
  await page.waitForTimeout(500)
  await shot.element('StayEditor', dialog(page))
})

test('plan: the map hover card', async ({ page, shot }) => {
  // With no day open every stop is folded into a cluster; the open day's stops are
  // pins. Its details panel stays: closing it would close the day as well.
  await selectFirstDay(page)
  // A place pin, not a cluster bubble or an explore result (only those carry a
  // name). The columns float over the map's edges and pins stack, so the first
  // one in the DOM is often one the pointer cannot reach.
  const pins = page.locator('#trek-map .leaflet-marker-icon:not(:has(.marker-cluster-custom)):not([aria-label])')
  await expect(pins.first()).toBeAttached()
  const total = await pins.count()
  for (let i = 0; i < total; i++) {
    if (await pins.nth(i).hover({ trial: true, timeout: 1500 }).then(() => true, () => false)) {
      await pins.nth(i).hover()
      break
    }
  }
  const card = page.getByTestId('tooltip')
  await expect(card).toBeVisible()
  await page.waitForTimeout(600)
  // The card and the pin it belongs to with some map around them, not the whole planner.
  const box = (await card.boundingBox())!
  const width = 760
  const height = 440
  const x = Math.max(0, Math.min(1440 - width, box.x + box.width / 2 - width / 2))
  const y = Math.max(0, Math.min(900 - height, box.y + box.height / 2 - height / 2))
  await shot.region('MapHoverCard', { x, y, width, height })
})

test('plan: the export dialog', async ({ page, shot }) => {
  await page.getByRole('button', { name: 'Export' }).first().click()
  await expect(dialog(page)).toBeVisible()
  await shot.element('ExportDialog', dialog(page))
})

test('plan: the subscribe to calendar dialog', async ({ page, shot }) => {
  await page.getByRole('button', { name: 'Export' }).first().click()
  await dialog(page).getByRole('button', { name: /^Subscribe to calendar/ }).click()
  const subscribe = page.getByRole('dialog').filter({ hasText: 'Subscribe to calendar' }).last()
  await subscribe.getByRole('button', { name: 'Enable calendar subscription' }).click()
  // Enabled, the dialog shows the ways to subscribe and its Regenerate and Turn off.
  await expect(subscribe.getByRole('button', { name: 'Turn off' })).toBeVisible()
  await shot.element('IcsSubscribe', subscribe)
  await subscribe.getByRole('button', { name: 'Turn off' }).click()
})

test('plan: the PDF preview', async ({ page, shot }) => {
  await page.getByRole('button', { name: 'Export' }).first().click()
  await dialog(page).getByRole('button', { name: /^PDF/ }).click()
  const preview = page.locator('#pdf-preview-overlay > div')
  await expect(preview).toBeVisible({ timeout: 30_000 })
  await parkPointer(page)
  // The document is a srcdoc frame; its photos and the route map load after it.
  await page.waitForTimeout(4000)
  await shot.element('PDFPreview', preview)
  await page.locator('#pdf-close-btn').click()
})

// The Bookings tab holds a booking of every kind here (shots.setup.ts), so the
// views are shown on it; each test puts the view back to the cards.
async function bookingsView(page: Page, view: 'Cards' | 'List' | 'Timeline') {
  await openTab(page, 'Book')
  await page.getByRole('button', { name: view, exact: true }).first().click()
  await parkPointer(page)
  await page.waitForTimeout(800)
}

test('bookings: list view', async ({ page, shot }) => {
  await bookingsView(page, 'List')
  await shot.page_('BookingsList')
  await page.getByRole('button', { name: 'Cards', exact: true }).first().click()
})

test('bookings: timeline view', async ({ page, shot }) => {
  await bookingsView(page, 'Timeline')
  await shot.page_('BookingsTimeline')
  await page.getByRole('button', { name: 'Cards', exact: true }).first().click()
})

test('bookings: the detail popup and the editor', async ({ page, shot }) => {
  await bookingsView(page, 'Cards')
  await page.locator('article').filter({ hasText: TOKYO_HOTEL }).first().click()
  await expect(dialog(page)).toBeVisible()
  await page.waitForTimeout(600)
  await shot.element('BookingDetail', dialog(page))
  await dialog(page).getByRole('button', { name: 'Edit', exact: true }).click()
  await page.waitForTimeout(800)
  await shot.element('BookingEditor', dialog(page))
})

test('transports: timeline view', async ({ page, shot }) => {
  await openTab(page, 'Transports')
  await page.getByRole('button', { name: 'Timeline', exact: true }).first().click()
  await parkPointer(page)
  await page.waitForTimeout(800)
  await shot.page_('TransportsTimeline')
  await page.getByRole('button', { name: 'Cards', exact: true }).first().click()
})

test('transports: the detail popup', async ({ page, shot }) => {
  await openTab(page, 'Transports')
  await page.getByRole('button', { name: 'Cards', exact: true }).first().click()
  await page.locator('article').filter({ hasText: 'LH716' }).first().click()
  await expect(dialog(page)).toBeVisible()
  await page.waitForTimeout(600)
  await shot.element('TransportDetail', dialog(page))
})

test('transports: the add transport dialog', async ({ page, shot }) => {
  await openTab(page, 'Transports')
  await page.getByRole('button', { name: /^(Add transport|Transport)$/ }).first().click()
  await expect(dialog(page)).toBeVisible()
  await shot.element('TransportEditor', dialog(page))
})

test('costs: the add expense dialog', async ({ page, shot }) => {
  await openTab(page, 'Costs')
  await page.getByRole('button', { name: 'Add expense' }).first().click()
  await expect(dialog(page)).toBeVisible()
  await shot.element('ExpenseDialog', dialog(page))
})

test('costs: the table view', async ({ page, shot }) => {
  await openTab(page, 'Costs')
  await page.getByRole('button', { name: 'Table', exact: true }).click()
  await expect(page.getByRole('table')).toBeVisible()
  await parkPointer(page)
  await shot.page_('CostsTable')
  // Back to the list for every other picture of the tab.
  await page.getByRole('button', { name: 'List', exact: true }).click()
})
