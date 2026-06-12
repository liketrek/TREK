import { test, expect } from '@playwright/test'

// Open a trip into the planner: create a trip, open it from the dashboard, and
// confirm the trip planner (TripPlannerPage — the app's largest page) actually
// mounts, proving the day-plan/map shell renders rather than crashing on load.
test('open a trip and land in the planner with a map', async ({ page }) => {
  await page.goto('/dashboard')

  // Create a trip to open.
  await page.locator('.add-trip-card').click()
  const modal = page.locator('.modal-backdrop')
  await expect(modal).toBeVisible()
  const title = `E2E Planner ${Date.now()}`
  await modal.locator('input[type="text"]').first().fill(title)
  await modal.getByRole('button', { name: 'Create New Trip' }).click()

  // Open it from the dashboard.
  await page.getByText(title).first().click()

  await expect(page).toHaveURL(/\/trips\/\d+/)
  // The planner shows a Leaflet map once mounted (past the splash screen).
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 20_000 })
})
