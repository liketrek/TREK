import { test, expect } from '@playwright/test'
import { dismissSystemNotices } from './helpers'

// Open a trip into the planner: create a trip, open it from the dashboard, and
// confirm the trip planner (TripPlannerPage — the app's largest page) actually
// mounts, proving the day-plan/map shell renders rather than crashing on load.
test('open a trip and land in the planner with a map', async ({ page }) => {
  await page.goto('/dashboard')

  // The release notice greets a freshly seeded user and its backdrop eats the click below.
  await dismissSystemNotices(page)

  // Create a trip to open.
  await page.locator('.add-trip-card').click()
  const modal = page.locator('.trek-modal-backdrop')
  await expect(modal).toBeVisible()
  // Target Title by placeholder: the cover-image search inputs sit above it, so
  // input[type=text].first() is the photo search box, not the field we want.
  const title = `E2E Planner ${Date.now()}`
  await modal.getByPlaceholder('e.g. Summer in Japan').fill(title)
  await modal.getByRole('button', { name: 'Create New Trip' }).click()

  // Open it from the dashboard.
  await page.getByText(title).first().click()

  await expect(page).toHaveURL(/\/trips\/\d+/)
  // The planner shows a Leaflet map once mounted (past the splash screen).
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 20_000 })
})
