import { test, expect } from './shot'

/**
 * Unauthenticated surfaces. `storageState: undefined` drops the admin session
 * this project otherwise inherits, so these render as a logged-out visitor sees
 * them — which is the entire point of the login and registration pages.
 */
test.use({ storageState: undefined })

test('login page', async ({ page, shot }) => {
  await page.goto('/login')
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await shot.page_('Login')
})

test('registration page', async ({ page, shot }) => {
  await page.goto('/register')
  await page.waitForTimeout(500)
  await shot.page_('Registration')
})

test('forgot password', async ({ page, shot }) => {
  await page.goto('/forgot-password')
  await page.waitForTimeout(500)
  await shot.page_('PasswordReset')
})
