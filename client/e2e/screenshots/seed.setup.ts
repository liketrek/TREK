import { test as setup, expect } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { seedDemoData } from './seed'
import { E2E_BASE_URL, E2E_SEED_FILE } from '../../playwright.config'

/**
 * Populates the throwaway E2E database with the demo trip before any screenshot
 * runs. Its own Playwright project so it executes exactly once, after `setup`
 * (which produces the authenticated storageState) and before `screenshots`.
 *
 * The resulting ids are written to disk because Playwright projects do not
 * share memory — the capture specs read them back.
 */
setup('seed the demo trip', async ({ page, playwright }) => {
  // page.request carries the storageState cookie, so this is authenticated as
  // the admin. The factory hands the seeder throwaway contexts for the other
  // members — see the comment in seed.ts on why they must not share one.
  const result = await seedDemoData(page.request, token =>
    playwright.request.newContext({
      baseURL: E2E_BASE_URL,
      // MUST be explicit: newContext otherwise picks up the project's
      // storageState, i.e. the admin's trek_session cookie — and the server
      // reads the cookie BEFORE the Authorization header
      // (server/src/middleware/auth.ts:9), so every "member" write would be
      // recorded as the admin while still returning 200.
      storageState: undefined,
      extraHTTPHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  )

  expect(result.tripId, 'trip was created').toBeTruthy()
  expect(result.placeIds.length, 'places were created').toBeGreaterThan(0)

  mkdirSync(path.join(process.cwd(), 'e2e', '.tmp'), { recursive: true })
  writeFileSync(path.join(process.cwd(), E2E_SEED_FILE), JSON.stringify(result, null, 2))
})
