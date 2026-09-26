import { test, expect, type Page, type Locator } from '@playwright/test'
import { clearNotices } from '../screenshots/shot'
import { captureGuide, captureHero, dismissReleaseNotice, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { ensureAdminFixtures, pluginPackage } from './fixtures'
import { toggleAddon } from './external'
import { adminContext, adminTabContexts, adminGuides } from '../../src/help/contexts/admin'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the admin screens, keyed by the ids in `src/help/contexts/admin.ts`.
 * One route, one tab per screen. The guides that create something (a user, an
 * invite link, a backup, an installed plugin) either leave a harmless row behind
 * or take it away again in `cleanup`, so the tabs after them look like the seed.
 */

const TAB_OF: Record<string, string> = {
  'admin-users': 'Users',
  'admin-defaults': 'User Defaults',
  'admin-config': 'Personalization',
  'admin-settings': 'Settings',
  'admin-addons': 'Addons',
  'admin-plugins': 'Plugins',
  'admin-storage': 'Storage',
  'admin-notifications': 'Notifications',
  'admin-mcp-tokens': 'MCP Access',
  'admin-github': 'GitHub',
  'admin-backup': 'Backup',
  'admin-audit': 'Audit',
}

const guide = (id: string): HelpGuide => {
  const g = adminGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

const sidebar = (page: Page) => page.locator('nav').filter({ has: page.getByRole('button', { name: 'User Defaults' }) }).first()
/** The nearest card around an element: the admin cards are rounded-xl or rounded-2xl boxes, or a <section>. */
const cardOf = (el: Locator) => el.locator('xpath=ancestor::*[contains(@class,"rounded-xl") or contains(@class,"rounded-2xl") or self::section][1]')
/** An admin card by the text of its h2. */
const section = (page: Page, title: string | RegExp) => cardOf(page.locator('h2').filter({ hasText: title }).first())
/** A provider block under Settings (its title is a <p>, not a heading). */
const block = (page: Page, title: string) => cardOf(page.locator('p').filter({ hasText: title }).first())
const modal = (page: Page) => page.locator('.trek-modal-backdrop').last()
/** A row of the user table by its username. */
const userRow = (page: Page, username: string) => page.locator('table tbody tr').filter({ hasText: username }).first()
/** An addon tile by the addon's name. */
const tile = (page: Page, name: string) => page.locator('h4').filter({ hasText: new RegExp(`^${name}$`) }).first().locator('xpath=ancestor::article[1]')

async function openAdmin(page: Page, tab: string): Promise<void> {
  await page.goto('/admin')
  await clearNotices(page)
  await dismissReleaseNotice(page)
  await expect(sidebar(page)).toBeVisible({ timeout: 20_000 })
  // The run's server is in development mode, which adds a developer-only tab
  // nobody has in production; the pictures show the sidebar as shipped.
  await sidebar(page).getByRole('button', { name: 'Dev: Notifications' }).evaluateAll(els => {
    for (const el of els) (el as HTMLElement).style.display = 'none'
  })
  await sidebar(page).getByRole('button', { name: tab, exact: true }).click()
  await settle(page)
}

const opener = (contextId: string) => (page: Page) => openAdmin(page, TAB_OF[contextId])
const only = (target: (p: Page) => Locator) => ({ target })

const SCRIPTS: Record<string, GuideScript> = {
  // ── Users ────────────────────────────────────────────────────────────────
  'create-user': {
    guide: guide('create-user'),
    start: opener('admin-users'),
    steps: [
      {
        target: p => section(p, /^Users$/).getByRole('button', { name: 'Create User' }),
        act: async p => {
          await section(p, /^Users$/).getByRole('button', { name: 'Create User' }).click()
          await expect(modal(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await typeInto(p, modal(p).getByPlaceholder('Username'), 'lena')
          await typeInto(p, modal(p).getByPlaceholder('Email'), 'lena.k@example.com')
          await typeInto(p, modal(p).getByPlaceholder('Password'), 'Lena12345!')
          await beat(p, 300)
        },
        target: p => modal(p).locator('> [role="presentation"], > div').first(),
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Create User' }),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Create User' }).click()
          await expect(modal(p)).toHaveCount(0)
          await expect(userRow(p, 'lena')).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
    ],
  },
  'edit-user': {
    guide: guide('edit-user'),
    start: opener('admin-users'),
    steps: [
      {
        target: p => userRow(p, 'mara').getByTitle('Edit User'),
        act: async p => {
          await userRow(p, 'mara').getByTitle('Edit User').click()
          await expect(modal(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => modal(p).locator('> [role="presentation"], > div').first(),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Cancel' }).click()
          await expect(modal(p)).toHaveCount(0)
        },
      },
    ],
  },
  'invite-links': {
    guide: guide('invite-links'),
    start: opener('admin-users'),
    steps: [
      {
        target: p => section(p, 'Invite Links').getByRole('button', { name: 'Create Link' }),
        act: async p => {
          await section(p, 'Invite Links').getByRole('button', { name: 'Create Link' }).click()
          await expect(modal(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await modal(p).getByRole('button', { name: '3×', exact: true }).click()
          await modal(p).getByRole('button', { name: '14d', exact: true }).click()
          await beat(p, 300)
        },
        target: p => modal(p).locator('> [role="presentation"], > div').first(),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Create & Copy' }).click()
          await expect(modal(p)).toHaveCount(0)
          await settle(p)
        },
      },
      only(p => section(p, 'Invite Links')),
    ],
  },
  'delete-user': {
    guide: guide('delete-user'),
    start: opener('admin-users'),
    steps: [
      only(p => userRow(p, 'jonas').getByTitle('Delete user')),
    ],
  },
  permissions: {
    guide: guide('permissions'),
    start: opener('admin-users'),
    steps: [
      {
        prepare: async p => {
          const row = section(p, 'Permission Settings').getByText('Delete trips', { exact: true }).locator('xpath=../..')
          // The select's trigger is the row's only button; its options are buttons too.
          await row.locator('button').first().click()
          await p.getByRole('button', { name: 'Admin only', exact: true }).last().click()
          await expect(row.getByText('customized')).toBeVisible({ timeout: 10_000 })
          await settle(p)
        },
        target: p => section(p, 'Permission Settings').getByText('Delete trips', { exact: true }).locator('xpath=../..'),
      },
      {
        target: p => section(p, 'Permission Settings').getByRole('button', { name: 'Save', exact: true }),
        // Not saved: the seed keeps its defaults for the other screens.
        act: async p => {
          await section(p, 'Permission Settings').getByRole('button', { name: 'Reset to defaults' }).click()
          await settle(p)
        },
      },
    ],
  },

  // ── User Defaults ────────────────────────────────────────────────────────
  'default-map': {
    guide: guide('default-map'),
    start: opener('admin-defaults'),
    steps: [
      only(p => section(p, /^Map$/)),
      {
        // The reset link only exists next to a field an admin has set.
        prepare: async p => {
          await section(p, 'Default User Settings').getByRole('button', { name: 'Dark', exact: true }).click()
          // The link sits inside the field's label, so its accessible name is the label's, not "reset".
          await expect(section(p, 'Default User Settings').locator('button').filter({ hasText: /^reset$/ })).toBeVisible({ timeout: 10_000 })
          await settle(p)
        },
        target: p => section(p, 'Default User Settings').locator('label').filter({ hasText: 'Color Mode' }).locator('xpath=..'),
        act: async p => {
          await section(p, 'Default User Settings').locator('button').filter({ hasText: /^reset$/ }).first().click()
          await settle(p)
        },
      },
    ],
  },

  // ── Personalization ──────────────────────────────────────────────────────
  'packing-templates': {
    guide: guide('packing-templates'),
    start: opener('admin-config'),
    steps: [
      {
        target: p => section(p, 'Packing Templates').getByRole('button', { name: 'New Template' }),
        act: async p => {
          await section(p, 'Packing Templates').getByRole('button', { name: 'New Template' }).click()
          const input = p.getByPlaceholder('Template name (e.g. Beach Holiday)')
          await expect(input).toBeVisible()
          await typeInto(p, input, 'City Break')
          await beat(p, 300)
          // Leave the seed as it is: the second icon next to the field discards the draft.
          await input.locator('xpath=..').locator('button').nth(1).click()
          await expect(input).toHaveCount(0)
        },
      },
      {
        prepare: async p => {
          await p.getByRole('button', { name: 'Beach Holiday', exact: true }).click()
          await expect(p.getByRole('button', { name: 'Add category' })).toBeVisible()
          await settle(p)
        },
        target: p => p.getByRole('button', { name: 'Beach Holiday', exact: true }).locator('xpath=../..').locator('> div').nth(1),
      },
      only(p => p.getByRole('button', { name: 'Beach Holiday', exact: true }).locator('xpath=..')),
    ],
  },
  categories: {
    guide: guide('categories'),
    start: opener('admin-config'),
    steps: [
      {
        prepare: async p => {
          await section(p, /^Categories$/).getByRole('button', { name: 'New Category' }).click()
          await expect(p.getByPlaceholder('Category name')).toBeVisible()
          await typeInto(p, p.getByPlaceholder('Category name'), 'Viewpoints')
          await settle(p)
        },
        target: p => cardOf(p.getByPlaceholder('Category name')),
        act: async p => {
          await section(p, /^Categories$/).getByRole('button', { name: 'Cancel' }).click()
          await expect(p.getByPlaceholder('Category name')).toHaveCount(0)
        },
      },
      {
        target: p => section(p, /^Categories$/).getByText('Restaurant', { exact: true }).first().locator('xpath=ancestor::div[contains(@class,"group")][1]'),
        hover: async p => {
          await section(p, /^Categories$/).getByText('Restaurant', { exact: true }).first().hover()
        },
      },
    ],
  },
  'school-holiday-catalog': {
    guide: guide('school-holiday-catalog'),
    start: opener('admin-config'),
    steps: [
      {
        prepare: async p => {
          await section(p, 'School holidays').getByRole('button', { name: 'Add country' }).click()
          await expect(section(p, 'School holidays').getByPlaceholder('US')).toBeVisible()
          await settle(p)
        },
        target: p => section(p, 'School holidays'),
        act: async p => {
          await section(p, 'School holidays').getByRole('button', { name: 'Cancel' }).click()
          await expect(section(p, 'School holidays').getByPlaceholder('US')).toHaveCount(0)
        },
      },
      {
        prepare: async p => {
          await section(p, 'School holidays').getByRole('button', { name: 'Bavaria', exact: true }).click()
          await expect(modal(p)).toBeVisible()
          await expect(modal(p).getByRole('textbox', { name: 'Holiday name' }).first()).toHaveValue('Autumn break', { timeout: 10_000 })
          await settle(p)
        },
        target: p => modal(p).locator('> [role="presentation"], > div').first(),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Cancel' }).click()
          await expect(modal(p)).toHaveCount(0)
        },
      },
    ],
  },

  // ── Settings ─────────────────────────────────────────────────────────────
  'auth-methods': {
    guide: guide('auth-methods'),
    start: opener('admin-settings'),
    steps: [
      only(p => section(p, 'Authentication Methods').getByText('Password Login', { exact: true }).locator('xpath=../..')),
      // The SSO rows exist only once OIDC is configured; the run shows where that happens.
      only(p => section(p, 'Single Sign-On (OIDC)')),
      only(p => section(p, 'Require two-factor authentication (2FA)')),
    ],
  },
  oidc: {
    guide: guide('oidc'),
    start: opener('admin-settings'),
    steps: [
      only(p => section(p, 'Single Sign-On (OIDC)')),
      only(p => section(p, 'Authentication Methods')),
    ],
  },
  'instance-keys': {
    guide: guide('instance-keys'),
    start: opener('admin-settings'),
    steps: [
      only(p => block(p, 'Google Maps API Key')),
      {
        prepare: async p => {
          const details = p.locator('details').filter({ hasText: 'What the key may be used for' })
          if (!(await details.evaluate(el => (el as HTMLDetailsElement).open))) await details.locator('summary').click()
          await settle(p)
        },
        target: p => p.locator('details').filter({ hasText: 'What the key may be used for' }),
      },
      only(p => block(p, 'Unsplash API Key')),
    ],
  },
  'places-transit': {
    guide: guide('places-transit'),
    start: opener('admin-settings'),
    steps: [
      only(p => block(p, 'Place search provider')),
      only(p => block(p, 'Transit Provider')),
    ],
  },
  'file-types': {
    guide: guide('file-types'),
    start: opener('admin-settings'),
    steps: [
      only(p => section(p, 'Allowed File Types')),
    ],
  },

  // ── Addons ───────────────────────────────────────────────────────────────
  'toggle-addon': {
    guide: guide('toggle-addon'),
    start: opener('admin-addons'),
    steps: [
      {
        target: p => tile(p, 'Atlas'),
        act: async p => {
          const toggle = tile(p, 'Atlas').getByRole('button', { name: 'Atlas' })
          await toggle.click()
          await expect(toggle).toHaveAttribute('aria-pressed', 'false', { timeout: 10_000 })
          await beat(p, 600)
          await toggle.click()
          await expect(toggle).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 })
          await settle(p)
        },
      },
      only(p => tile(p, 'Lists')),
    ],
  },
  'document-providers': {
    guide: guide('document-providers'),
    start: opener('admin-addons'),
    steps: [
      // The tile with its shelf: Documents is on in the seed, so the five rows are drawn.
      only(p => tile(p, 'Documents')),
      {
        // The row's switch is a ToggleSwitch whose aria-label is the row's title.
        target: p => tile(p, 'Documents').getByRole('button', { name: 'Nextcloud', exact: true }),
        act: async p => {
          const toggle = tile(p, 'Documents').getByRole('button', { name: 'Nextcloud', exact: true })
          await toggle.click()
          await expect(toggle).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 })
          await settle(p)
        },
      },
    ],
    // Back to the seed, where every store is off; the files run switches this one on for itself.
    cleanup: p => toggleAddon(p.request, 'nextcloud', false),
  },

  // ── Plugins ──────────────────────────────────────────────────────────────
  'install-plugin': {
    guide: guide('install-plugin'),
    start: async p => {
      const upload = await p.request.post('/api/admin/plugins/upload', {
        multipart: { file: { name: 'trip-doctor.tar.gz', mimeType: 'application/gzip', buffer: pluginPackage() } },
      })
      if (!upload.ok()) throw new Error(`could not upload the plugin: ${upload.status()} ${await upload.text()}`)
      await openAdmin(p, 'Plugins')
    },
    steps: [
      {
        prepare: async p => {
          await p.getByRole('tab', { name: /Discover/ }).click()
          await settle(p)
          await p.waitForTimeout(1500)
        },
        target: p => section(p, /^Plugins$/),
        act: async p => {
          await p.getByRole('tab', { name: /Installed/ }).click()
          await settle(p)
        },
      },
      {
        target: p => p.getByTestId('plugin-row-menu-btn-trip-doctor').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]'),
        act: async p => {
          const row = p.getByTestId('plugin-row-menu-btn-trip-doctor').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]')
          await row.getByRole('button', { name: 'Enable plugin' }).click()
          await expect(row.getByText('Active', { exact: true })).toBeVisible({ timeout: 30_000 })
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await p.getByTestId('plugin-row-menu-btn-trip-doctor').click()
          await expect(p.getByTestId('plugin-row-menu-trip-doctor')).toBeVisible()
          await beat(p, 300)
        },
        target: p => p.getByTestId('plugin-row-menu-trip-doctor'),
        // Allowed hosts only shows for plugins that call out; Trip Doctor does not.
        hover: async p => { await p.getByTestId('plugin-row-menu-trip-doctor').getByText('View error log').hover() },
        act: async p => { await p.keyboard.press('Escape') },
      },
    ],
    cleanup: async p => {
      const res = await p.request.post('/api/admin/plugins/trip-doctor/uninstall', { data: { deleteData: true } })
      if (!res.ok()) throw new Error(`could not uninstall the plugin: ${res.status()} ${await res.text()}`)
    },
  },

  // ── Storage ──────────────────────────────────────────────────────────────
  'storage-backends': {
    guide: guide('storage-backends'),
    start: opener('admin-storage'),
    steps: [
      {
        prepare: async p => {
          await section(p, /^Backends$/).getByRole('button', { name: 'Add backend' }).click()
          await expect(p.locator('p').filter({ hasText: /^Add backend$/ })).toBeVisible()
          await typeInto(p, cardOf(p.locator('p').filter({ hasText: /^Add backend$/ })).locator('input').first(), 'archive')
          await settle(p)
        },
        target: p => cardOf(p.locator('p').filter({ hasText: /^Add backend$/ })),
        act: async p => {
          await cardOf(p.locator('p').filter({ hasText: /^Add backend$/ })).getByRole('button', { name: 'Cancel' }).click()
          await expect(p.locator('p').filter({ hasText: /^Add backend$/ })).toHaveCount(0)
        },
      },
      only(p => section(p, /^Categories$/)),
      only(p => section(p, /^Health$/)),
    ],
  },

  // ── Notifications ────────────────────────────────────────────────────────
  'channels-instance': {
    guide: guide('channels-instance'),
    start: opener('admin-notifications'),
    steps: [
      only(p => section(p, 'Email (SMTP)')),
      only(p => section(p, /^Ntfy$/)),
      only(p => section(p, 'Trip Reminders')),
    ],
  },
  'admin-channels': {
    guide: guide('admin-channels'),
    start: opener('admin-notifications'),
    steps: [
      only(p => section(p, 'Admin Ntfy')),
      only(p => section(p, 'Admin Ntfy').getByRole('button', { name: 'Send test ntfy' })),
    ],
  },

  // ── MCP Access ───────────────────────────────────────────────────────────
  'mcp-tokens-admin': {
    guide: guide('mcp-tokens-admin'),
    start: opener('admin-mcp-tokens'),
    steps: [
      only(p => p.locator('h3').filter({ hasText: 'API Tokens' }).locator('xpath=..')),
      only(p => p.locator('h3').filter({ hasText: 'OAuth Sessions' }).locator('xpath=..')),
    ],
  },

  // ── GitHub ───────────────────────────────────────────────────────────────
  'release-history': {
    guide: guide('release-history'),
    start: opener('admin-github'),
    steps: [
      {
        // The banner exists only while a newer release is out; otherwise the card's head.
        target: p => {
          const banner = p.getByText('Update available', { exact: true })
          return banner.or(section(p, 'Release History').locator('> div').first()).first()
        },
      },
      {
        prepare: async p => {
          await expect(section(p, 'Release History').getByRole('button', { name: 'Show details' }).first()).toBeVisible({ timeout: 20_000 })
        },
        target: p => section(p, 'Release History'),
      },
    ],
  },

  // ── Backup ───────────────────────────────────────────────────────────────
  'create-backup': {
    guide: guide('create-backup'),
    start: opener('admin-backup'),
    steps: [
      {
        target: p => section(p, 'Data Backup').getByRole('button', { name: 'Create Backup' }),
        act: async p => {
          await section(p, 'Data Backup').getByRole('button', { name: 'Create Backup' }).click()
          await expect(section(p, 'Data Backup').getByRole('button', { name: 'Download' }).first()).toBeVisible({ timeout: 120_000 })
          await settle(p)
        },
      },
      only(p => section(p, 'Data Backup').getByRole('button', { name: 'Download' }).first().locator('xpath=ancestor::div[contains(@class,"py-3")][1]')),
      only(p => section(p, 'Data Backup').getByRole('button', { name: 'Restore' }).first()),
    ],
    cleanup: async p => {
      const list = await p.request.get('/api/backup/list')
      const body = (await list.json()) as { backups?: { filename: string }[] } | { filename: string }[]
      const backups = Array.isArray(body) ? body : (body.backups ?? [])
      for (const b of backups) await p.request.delete(`/api/backup/${encodeURIComponent(b.filename)}`)
    },
  },
  'auto-backup': {
    guide: guide('auto-backup'),
    start: opener('admin-backup'),
    steps: [
      {
        target: p => section(p, 'Auto-Backup').getByRole('button', { name: /^Enable auto-backup/ }).locator('xpath=ancestor::label[1]'),
        act: async p => {
          await section(p, 'Auto-Backup').getByRole('button', { name: /^Enable auto-backup/ }).click()
          await expect(section(p, 'Auto-Backup').getByText('Interval', { exact: true })).toBeVisible({ timeout: 10_000 })
          await settle(p)
        },
      },
      only(p => section(p, 'Auto-Backup').getByText('Delete old backups after', { exact: true }).locator('xpath=..')),
    ],
    cleanup: async p => {
      await section(p, 'Auto-Backup').getByRole('button', { name: /^Enable auto-backup/ }).click()
      await expect(section(p, 'Auto-Backup').getByText('Interval', { exact: true })).toHaveCount(0)
      await settle(p)
    },
  },

  // ── Audit ────────────────────────────────────────────────────────────────
  'audit-log': {
    guide: guide('audit-log'),
    start: opener('admin-audit'),
    steps: [
      only(p => cardOf(p.locator('table').first())),
      only(p => p.getByRole('button', { name: 'Refresh' })),
    ],
  },
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

const ALL_CONTEXTS = [adminContext, ...adminTabContexts]

test.beforeAll(async ({ request }) => {
  await ensureAdminFixtures(request)
})

// The invite guide copies the new link; without the permission the write rejects
// and the page logs an unhandled promise, which is noise the pictures do not need.
test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
})

test('every registered admin guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual(ALL_CONTEXTS.flatMap(c => c.guides).sort())
})

test('hero: admin', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, adminContext.id, p => openAdmin(p, 'Users'))
})

for (const ctx of adminTabContexts) {
  test(`hero: ${ctx.id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureHero(page, ctx.id, opener(ctx.id))
  })
}

for (const id of ALL_CONTEXTS.flatMap(c => c.guides)) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
    await captureGuide(page, SCRIPTS[id])
  })
}
