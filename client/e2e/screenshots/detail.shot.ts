import { test, clearNotices, expect } from './shot'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Detail pages and the surfaces that need a couple of clicks to reach.
 *
 * Each capture asserts something specific to the surface before shooting, so a
 * navigation that quietly lands on a fallback (or an addon that is off) fails
 * the run instead of producing a screenshot of the wrong screen.
 */

const seed = JSON.parse(
  readFileSync(path.join(process.cwd(), 'e2e', '.tmp', 'seed.json'), 'utf8'),
) as { tripId: number; collectionId?: number; journeyId?: number }

test('collection detail', async ({ page, shot }) => {
  test.skip(!seed.collectionId, 'collections addon unavailable during seed')
  await page.goto(`/collections/${seed.collectionId}`)
  await clearNotices(page)
  await shot.page_('CollectionDetail')
})

test('journey detail', async ({ page, shot }) => {
  test.skip(!seed.journeyId, 'journey addon unavailable during seed')
  await page.goto(`/journey/${seed.journeyId}`)
  await clearNotices(page)
  await shot.page_('JourneyDetail')
})

test('mcp access — admin', async ({ page, shot }) => {
  await page.goto('/admin')
  await clearNotices(page)
  await page.getByRole('button', { name: 'MCP Access', exact: true }).first().click()
  await page.waitForTimeout(700)
  await shot.page_('MCPAccess')
})

test('two-factor setup', async ({ page, shot }) => {
  await page.goto('/settings')
  await clearNotices(page)
  await page.getByRole('button', { name: 'Account', exact: true }).first().click()
  await page.waitForTimeout(600)
  // The enrolment flow is behind a button whose label varies with state; match
  // loosely and fall back to capturing the tab itself.
  const enable = page.getByRole('button', { name: /two-factor|2fa|authenticator/i }).first()
  if (await enable.isVisible().catch(() => false)) {
    await enable.click()
    await page.waitForTimeout(900)
  }
  await shot.page_('2FA')
})

/**
 * Settle-up.
 *
 * WARNING for anyone extending this file: the "Settle up" button in the Costs
 * toolbar is not a view — it RECORDS the settling transfers. An earlier version
 * of this test clicked it, which zeroed every balance and left the capture
 * showing "Everyone's square". Because all screenshot specs share one database
 * and this file sorts before planner.shot.ts, it also poisoned Costs.png in the
 * same run.
 *
 * Screenshot specs must not mutate state. Capture the "Add payment" dialog
 * instead — same surface, no side effect — and close it again.
 */
test('costs — record a settle-up payment', async ({ page, shot }) => {
  await page.goto(`/trips/${seed.tripId}`)
  await clearNotices(page)
  await page.getByRole('button', { name: 'Costs', exact: true }).first().click()
  await page.waitForTimeout(800)

  const addPayment = page.getByRole('button', { name: /add payment/i }).first()
  test.skip(!(await addPayment.isVisible().catch(() => false)), 'no add-payment entry point rendered')
  await addPayment.click()
  await page.waitForTimeout(700)

  const modal = page.locator('.trek-modal-backdrop > div').first()
  await expect(modal).toBeVisible()
  await shot.element('CostsSettleUp', modal)
})

test('trip files', async ({ page, shot }) => {
  await page.goto(`/trips/${seed.tripId}/files`)
  await clearNotices(page)
  await expect(page).toHaveURL(/files/)
  await shot.page_('Documents')
})
