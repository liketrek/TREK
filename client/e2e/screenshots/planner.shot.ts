import { test, clearNotices, seed } from './shot'

/**
 * Trip-planner tabs and dialogs.
 *
 * Tabs are reached by their visible label rather than a test id, deliberately:
 * if a label is renamed (as Budget → Costs was in 3.3.0) this run fails loudly
 * instead of silently capturing the wrong panel — which is exactly how the
 * current wiki ended up with screenshots the text contradicts.
 */


test.beforeEach(async ({ page }) => {
  await page.goto(`/trips/${seed.tripId}`)
  await clearNotices(page)
})

async function openTab(page: import('@playwright/test').Page, label: string) {
  await page.getByRole('button', { name: new RegExp(`^${label}`) }).first().click()
  await page.waitForTimeout(700)
}

test('costs panel', async ({ page, shot }) => {
  await openTab(page, 'Costs')
  await shot.page_('Costs')
})

test('lists — packing', async ({ page, shot }) => {
  await openTab(page, 'Lists')
  await shot.page_('PackingList')
})

test('lists: to-do with a task open', async ({ page, shot }) => {
  await openTab(page, 'Lists')
  await page.getByRole('button', { name: /^To-Do/ }).first().click()
  await page.waitForTimeout(600)
  await page.getByText('Activate JR Pass', { exact: true }).first().click()
  await page.waitForTimeout(700)
  await shot.page_('Todos')
  await page.getByRole('button', { name: /^Packing List/ }).first().click()
})

test('transports', async ({ page, shot }) => {
  await openTab(page, 'Transports')
  await shot.page_('Transports')
})

test('bookings', async ({ page, shot }) => {
  await openTab(page, 'Book')
  await shot.page_('Bookings')
})

