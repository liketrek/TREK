import { test, expect } from '@playwright/test'

// Trip lifecycle (core): from the dashboard, open the new-trip modal, name the
// trip, submit, and confirm it shows up on the dashboard. Exercises the whole
// authenticated stack — dashboard → TripFormModal → POST /api/trips → store →
// re-render — against the real backend + isolated test DB.
test('create a trip and see it on the dashboard', async ({ page }) => {
  await page.goto('/dashboard')

  // The "+ New Trip" card is always rendered in the default (planned) filter.
  await page.locator('.add-trip-card').click()

  // Scope to the shared Modal (.modal-backdrop). Its form has no in-form submit
  // button (the primary action lives in the footer), so click it explicitly
  // rather than pressing Enter. The Create button is the slate primary button;
  // Cancel is the bordered one.
  const modal = page.locator('.modal-backdrop')
  await expect(modal).toBeVisible()

  const title = `E2E Trip ${Date.now()}`
  await modal.locator('input[type="text"]').first().fill(title)
  await modal.getByRole('button', { name: 'Create New Trip' }).click()

  await expect(page.getByText(title).first()).toBeVisible({ timeout: 15_000 })
})
