import { test, clearNotices } from './shot'
import type { Page } from '@playwright/test'

/**
 * Settings and Admin tabs.
 *
 * Both pages use the shared PageSidebar with client-side tab state (no URL
 * segment per tab), so each capture clicks its way in. Labels come from
 * shared/src/i18n/en — note "General" is the tab the wiki still calls
 * "Display", which is one of the corrections this screenshot run supports.
 */

async function openSidebarTab(page: Page, label: string) {
  await page.getByRole('button', { name: label, exact: true }).first().click()
  await page.waitForTimeout(600)
}

test.describe('user settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
    await clearNotices(page)
  })

  // Filename kept as UsrSettings.png — the wiki already references it.
  test('general tab', async ({ page, shot }) => {
    await openSidebarTab(page, 'General')
    await shot.page_('UsrSettings')
  })

  test('appearance tab', async ({ page, shot }) => {
    await openSidebarTab(page, 'Appearance')
    await shot.page_('UsrSettingsAppearance')
  })

  test('map tab', async ({ page, shot }) => {
    await openSidebarTab(page, 'Map')
    await shot.page_('UsrSettingsMap')
  })

  test('notifications tab', async ({ page, shot }) => {
    await openSidebarTab(page, 'Notifications')
    await shot.page_('NotifSettings')
  })

  test('offline tab', async ({ page, shot }) => {
    await openSidebarTab(page, 'Offline')
    await shot.page_('SettingsOffline')
  })

  test('account tab', async ({ page, shot }) => {
    await openSidebarTab(page, 'Account')
    await shot.page_('SettingsAccount')
  })
})

test.describe('admin panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    await clearNotices(page)
  })

  test('users', async ({ page, shot }) => {
    await openSidebarTab(page, 'Users')
    await shot.page_('UsersAndInvites')
  })

  test('user defaults', async ({ page, shot }) => {
    await openSidebarTab(page, 'User Defaults')
    await shot.page_('AdminUserDefaults')
  })

  test('personalization', async ({ page, shot }) => {
    await openSidebarTab(page, 'Personalization')
    await shot.page_('CategoryManager')
  })

  test('addons', async ({ page, shot }) => {
    await openSidebarTab(page, 'Addons')
    await shot.page_('Addons-Overview')
  })

  test('plugins', async ({ page, shot }) => {
    await openSidebarTab(page, 'Plugins')
    await shot.page_('AdminPlugins')
  })

  test('github releases', async ({ page, shot }) => {
    await openSidebarTab(page, 'GitHub')
    await shot.page_('GithubReleases')
  })

  test('backup', async ({ page, shot }) => {
    await openSidebarTab(page, 'Backup')
    await shot.page_('Backup')
  })

  test('audit log', async ({ page, shot }) => {
    await openSidebarTab(page, 'Audit')
    await shot.page_('Audit')
  })

  test('admin panel overview', async ({ page, shot }) => {
    await shot.page_('AdminPanel')
  })
})
