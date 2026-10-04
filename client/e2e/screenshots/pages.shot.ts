import { test, clearNotices, seed } from './shot'

/**
 * Top-level navigable surfaces. One capture per route; anything that needs a
 * dialog opened or a tab clicked lives in its own spec so a failure there
 * cannot take these down with it.
 *
 * Names are the target filenames in wiki/assets/ — see docs/screenshot-map.md
 * for which wiki page consumes which file.
 */


test.beforeEach(async ({ page }) => {
  await page.goto('/dashboard')
  await clearNotices(page)
})

test('dashboard', async ({ page, shot }) => {
  await page.goto('/dashboard')
  await clearNotices(page)
  await shot.page_('DashboardWidgets')
})

test('trip planner', async ({ page, shot }) => {
  await page.goto(`/trips/${seed.tripId}`)
  await clearNotices(page)
  // The seeded trip is running, so the plan opens on today, which is empty; the
  // picture shows the first days, where the plan has places, a note and a flight.
  // On the day's number: the middle of the header is the booked night's pill.
  await page.locator('.dp-day-header').first().click({ position: { x: 22, y: 20 } })
  await page.waitForTimeout(1500)
  await page.locator('.dp-day-header').first().evaluate(el => el.closest('.overflow-y-auto')?.scrollTo({ top: 0 }))
  await page.waitForTimeout(600)
  await shot.page_('TripPlanner')
})

test('atlas', async ({ page, shot }) => {
  await page.goto('/atlas')
  await shot.page_('Atlas')
})

test('vacay', async ({ page, shot }) => {
  await page.goto('/vacay')
  await shot.page_('Vacay')
})

test('collections', async ({ page, shot }) => {
  await page.goto('/collections')
  await shot.page_('Collections')
})

test('journey', async ({ page, shot }) => {
  await page.goto('/journey')
  await shot.page_('Journey')
})

test('notifications inbox', async ({ page, shot }) => {
  await page.goto('/notifications')
  await shot.page_('NotificationsInbox')
})

test('in-app help', async ({ page, shot }) => {
  await page.goto('/help')
  await shot.page_('HelpInApp')
})

test('files', async ({ page, shot }) => {
  await page.goto(`/trips/${seed.tripId}`)
  await clearNotices(page)
  await page.getByRole('button', { name: /^Files/ }).first().click()
  await page.waitForTimeout(1200)
  await shot.page_('Files')
})
