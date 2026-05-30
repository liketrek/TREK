import { test, expect } from '@playwright/test'

// Infra smoke + first unauthenticated flow: the app boots, the backend is
// reachable through the Vite proxy, and the login screen renders its form.
test('login screen renders with a password field', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('input[type="password"]')).toBeVisible()
})
