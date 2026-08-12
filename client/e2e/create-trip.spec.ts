import { test, expect } from '@playwright/test'
import { dismissSystemNotices } from './helpers'

// Trip lifecycle (core): from the dashboard, open the new-trip modal, name the
// trip, submit, and confirm it shows up on the dashboard. Exercises the whole
// authenticated stack — dashboard → TripFormModal → POST /api/trips → store →
// re-render — against the real backend + isolated test DB.
test('create a trip and see it on the dashboard', async ({ page }) => {
  await page.goto('/dashboard')

  // The release notice greets a freshly seeded user and its backdrop eats the click below.
  await dismissSystemNotices(page)

  // The "+ New Trip" card is always rendered in the default (planned) filter.
  await page.locator('.add-trip-card').click()

  // Scope to the shared Modal (.trek-modal-backdrop — namespaced so content blockers
  // don't hide a generic .modal-backdrop). Its form has no in-form submit button (the
  // primary action lives in the footer), so click it explicitly rather than pressing
  // Enter. The Create button is the slate primary button; Cancel is the bordered one.
  const modal = page.locator('.trek-modal-backdrop')
  await expect(modal).toBeVisible()

  // Target Title by placeholder: the cover-image search inputs sit above it, so
  // input[type=text].first() is the photo search box, not the field we want.
  const title = `E2E Trip ${Date.now()}`
  await modal.getByPlaceholder('e.g. Summer in Japan').fill(title)
  await modal.getByRole('button', { name: 'Create New Trip' }).click()

  await expect(page.getByText(title).first()).toBeVisible({ timeout: 15_000 })
})
