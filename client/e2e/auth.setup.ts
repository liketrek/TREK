import { test as setup, expect } from '@playwright/test'

// Relative to the config dir (client/), matching `storageState` in
// playwright.config.ts. Playwright runs from the client workspace root.
const stateFile = 'e2e/.tmp/state.json'

// Credentials match e2e/server-launch.mjs (ADMIN_EMAIL/ADMIN_PASSWORD). The
// seeded admin is created with must_change_password=1, so the first login goes
// through the forced change-password step before reaching the dashboard.
const EMAIL = 'e2e@trek.local'
const SEED_PW = 'E2eTest12345!'
const NEW_PW = 'E2eChanged12345!'

setup('authenticate the seeded admin (incl. forced password change)', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(SEED_PW)
  await page.locator('button[type="submit"]').click()

  // must_change_password=1 → the change-password step renders two password
  // fields (new + confirm). Selector-agnostic of the UI language.
  const pw = page.locator('input[type="password"]')
  await expect(pw).toHaveCount(2)
  await pw.nth(0).fill(NEW_PW)
  await pw.nth(1).fill(NEW_PW)
  await page.locator('button[type="submit"]').click()

  await page.waitForURL('**/dashboard', { timeout: 30_000 })

  // Dismiss the first-run "Welcome to TREK" system-notice modal(s). It renders
  // asynchronously (after the notices fetch), so wait for it before clicking.
  // Dismissal is recorded server-side against this user, so clearing it here
  // keeps it cleared for every authenticated flow in the run (shared test DB).
  const ok = page.getByRole('button', { name: 'OK', exact: true })
  await ok.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
  for (let i = 0; i < 8 && (await ok.isVisible().catch(() => false)); i++) {
    await ok.click()
    await page.waitForTimeout(400)
  }

  await page.context().storageState({ path: stateFile })
})
