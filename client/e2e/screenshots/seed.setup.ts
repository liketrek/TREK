import { test as setup, expect } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { seedDemoData } from './seed'

/**
 * Populates the throwaway E2E database with the demo trip before any screenshot
 * runs. Its own Playwright project so it executes exactly once, after `setup`
 * (which produces the authenticated storageState) and before `screenshots`.
 *
 * The resulting ids are written to disk because Playwright projects do not
 * share memory — the capture specs read them back.
 */
setup('seed the demo trip', async ({ page }) => {
  // page.request carries the storageState cookie, so this is authenticated.
  const result = await seedDemoData(page.request)

  expect(result.tripId, 'trip was created').toBeTruthy()
  expect(result.placeIds.length, 'places were created').toBeGreaterThan(0)

  const dir = path.join(process.cwd(), 'e2e', '.tmp')
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'seed.json'), JSON.stringify(result, null, 2))
})
