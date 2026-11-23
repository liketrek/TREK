import { test, expect, type Page, type Locator } from '@playwright/test'
import { clearNotices } from '../screenshots/shot'
import { captureGuide, captureHero, dismissReleaseNotice, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { ensureAdminFixtures, pluginPackage } from './fixtures'
import { clearOidc, configureOidc, deleteUser, putAppSettings, resetDefaults } from './fixtures-admin'
import { toggleAddon } from './external'
import { mockInstanceConnection, AI_KEY } from './fixtures-assistant'
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
  'admin-defaults': 'Defaults',
  'admin-config': 'Personalization',
  // One help screen for the two tabs the old Settings tab became; the hero shows Security.
  'admin-settings': 'Security',
  'admin-addons': 'Addons',
  'admin-plugins': 'Plugins',
  'admin-storage': 'Storage',
  'admin-notifications': 'Notifications',
  'admin-mcp-tokens': 'MCP',
  'admin-github': 'GitHub',
  'admin-backup': 'Backup',
  'admin-audit': 'Audit',
}

const guide = (id: string): HelpGuide => {
  const g = adminGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

const sidebar = (page: Page) => page.locator('nav').filter({ has: page.getByRole('button', { name: 'Personalization' }) }).first()
/** The nearest card around an element: the admin cards are rounded-xl or rounded-2xl boxes, or a <section>. */
const cardOf = (el: Locator) => el.locator('xpath=ancestor::*[contains(@class,"rounded-xl") or contains(@class,"rounded-2xl") or self::section][1]')
/** An admin card by the text of its h2. */
const section = (page: Page, title: string | RegExp) => cardOf(page.locator('h2').filter({ hasText: title }).first())
/** A block inside a card (a provider, a nested section), a <section> headed by an h3. */
const block = (page: Page, title: string) => page.locator('h3').filter({ hasText: new RegExp(`^${title.replace(/[()]/g, '\\$&')}$`) }).first().locator('xpath=ancestor::section[1]')
/** One settings row (label, hint, control) by its label. */
const row = (scope: Locator, label: string) =>
  scope.locator('label').filter({ hasText: new RegExp(`^${label}$`) }).first()
    .locator('xpath=ancestor::div[contains(@class,"px-4") and contains(@class,"py-3")][1]')
const modal = (page: Page) => page.locator('.trek-modal-backdrop').last()
const dialogPanel = (page: Page) => modal(page).locator('> [role="presentation"], > div').first()
/** A row of the user table by its username. */
const userRow = (page: Page, username: string) => page.locator('table tbody tr').filter({ hasText: username }).first()
/** A labelled field of the Map card on Defaults: its label and everything under it. */
const mapField = (page: Page, label: string) => section(page, /^Map$/).locator('label').filter({ hasText: label }).first().locator('xpath=..')
/** The Map engine row's label, which also holds its reset link once the engine is set. */
const engineLabel = (page: Page) => section(page, /^Map$/).locator('label').filter({ hasText: 'Map engine' }).first()
/** The TREK API block at the top of Place search and routing, found by its pill. */
const trekApiCard = (page: Page) => page.getByText('Recommended default', { exact: true }).first().locator('xpath=ancestor::section[1]')
/** An addon row by the addon's name. */
const tile = (page: Page, name: string) => page.locator('h4').filter({ hasText: new RegExp(`^${name}$`) }).first().locator('xpath=ancestor::article[1]')
const authCard = (page: Page) => section(page, 'Authentication Methods')

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

/**
 * The release list comes from GitHub through the server, which gives up after
 * eight seconds; a slow answer leaves "Failed to load releases" in the picture,
 * so the tab is opened again until the list is there.
 */
async function openGithub(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt++) {
    await openAdmin(page, 'GitHub')
    const details = section(page, 'Release History').getByRole('button', { name: 'Show details' }).first()
    const failed = page.getByText('Failed to load releases', { exact: true })
    await expect(details.or(failed).first()).toBeVisible({ timeout: 30_000 })
    if (await details.isVisible()) return settle(page)
  }
  throw new Error('GitHub did not answer with the release list')
}

const opener = (contextId: string) => (page: Page) => contextId === 'admin-github' ? openGithub(page) : openAdmin(page, TAB_OF[contextId])
const services = (page: Page) => openAdmin(page, 'Services')
const only = (target: (p: Page) => Locator) => ({ target })
/** The AI tile's settings dialog, named by its title. */
const aiDialog = (page: Page) => page.getByRole('dialog').filter({ hasText: 'Set up AI' }).last()
/** The admin's AI settings as the run found them, put back after the AI guide. */
let aiSettingsBefore: unknown = null

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
        target: p => dialogPanel(p),
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
    // Back to the seed's two accounts, so the Users hero and the next run look the same.
    cleanup: p => deleteUser(p.request, 'lena'),
  },
  'edit-user': {
    guide: guide('edit-user'),
    start: opener('admin-users'),
    steps: [
      {
        target: p => userRow(p, 'mara').getByRole('button', { name: 'Edit User' }),
        act: async p => {
          await userRow(p, 'mara').getByRole('button', { name: 'Edit User' }).click()
          await expect(modal(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => dialogPanel(p),
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
        target: p => dialogPanel(p),
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
      only(p => userRow(p, 'jonas').getByRole('button', { name: 'Delete user' })),
    ],
  },
  permissions: {
    guide: guide('permissions'),
    start: opener('admin-users'),
    steps: [
      {
        prepare: async p => {
          const permRow = row(section(p, 'Permission Settings'), 'Delete trips')
          // The select's trigger is the row's only button; its options are buttons too.
          await permRow.locator('button').first().click()
          await p.getByRole('button', { name: 'Admin only', exact: true }).last().click()
          await expect(permRow.getByText('customized')).toBeVisible({ timeout: 10_000 })
          await settle(p)
        },
        target: p => row(section(p, 'Permission Settings'), 'Delete trips'),
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

  // ── Defaults ─────────────────────────────────────────────────────────────
  'default-user-settings': {
    guide: guide('default-user-settings'),
    start: opener('admin-defaults'),
    steps: [
      only(p => section(p, 'Default User Settings')),
      {
        // The reset link only exists next to a field an admin has set.
        prepare: async p => {
          await section(p, 'Default User Settings').getByRole('button', { name: 'Dark', exact: true }).click()
          // The link sits inside the field's label, so its accessible name is the label's, not "reset".
          await expect(section(p, 'Default User Settings').locator('button').filter({ hasText: /^reset$/ })).toBeVisible({ timeout: 10_000 })
          await settle(p)
        },
        // The whole row: its name with the reset link, and the choice on the right.
        target: p => section(p, 'Default User Settings').locator('label').filter({ hasText: 'Color Mode' }).first()
          .locator('xpath=ancestor::div[contains(@class,"px-4") and contains(@class,"py-3")][1]'),
        act: async p => {
          await section(p, 'Default User Settings').locator('button').filter({ hasText: /^reset$/ }).first().click()
          await expect(section(p, 'Default User Settings').locator('button').filter({ hasText: /^reset$/ })).toHaveCount(0, { timeout: 10_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => resetDefaults(p.request, ['dark_mode']),
  },
  'default-map': {
    guide: guide('default-map'),
    start: opener('admin-defaults'),
    steps: [
      // The field and the CARTO key under it; the 16:10 frame takes in both.
      only(p => mapField(p, 'Map Template')),
      {
        // Mapbox draws every row the step names (style, token, 3D, quality).
        prepare: async p => {
          await section(p, /^Map$/).getByRole('button', { name: 'Mapbox (3D)', exact: true }).click()
          await expect(section(p, /^Map$/).getByText('High-quality mode', { exact: true })).toBeVisible({ timeout: 10_000 })
          await settle(p)
        },
        target: p => section(p, /^Map$/).getByRole('button', { name: 'Mapbox (3D)', exact: true }).locator('xpath=ancestor::div[contains(@class,"divide-y")][1]'),
      },
      {
        // The engine was set in step 2, so its label now carries the reset link.
        prepare: async p => {
          await expect(engineLabel(p).locator('button').filter({ hasText: /^reset$/ })).toBeVisible({ timeout: 10_000 })
        },
        target: p => engineLabel(p),
        act: async p => {
          await engineLabel(p).locator('button').filter({ hasText: /^reset$/ }).click()
          await expect(engineLabel(p).locator('button').filter({ hasText: /^reset$/ })).toHaveCount(0, { timeout: 10_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => resetDefaults(p.request, ['map_provider', 'mapbox_style', 'maplibre_style']),
  },
  'own-routing-engine': {
    guide: guide('own-routing-engine'),
    start: opener('admin-defaults'),
    // Typed, never committed: the field saves on blur only when the value changed,
    // and emptying it first leaves the saved value (none) as it was.
    steps: [
      only(p => section(p, /^Routing$/)),
      {
        prepare: async p => {
          await typeInto(p, p.getByLabel('Own routing engine', { exact: true }), 'https://osrm.example.org')
          await beat(p, 300)
        },
        target: p => p.getByLabel('Own routing engine', { exact: true }).locator('xpath=..'),
        act: async p => {
          await p.getByLabel('Own routing engine', { exact: true }).fill('')
          await p.getByLabel('Own routing engine', { exact: true }).blur()
        },
      },
      {
        prepare: async p => {
          await typeInto(p, p.getByLabel('Own Valhalla instance', { exact: true }), 'https://valhalla.example.org')
          await beat(p, 300)
        },
        target: p => p.getByLabel('Own Valhalla instance', { exact: true }).locator('xpath=..'),
        act: async p => {
          await p.getByLabel('Own Valhalla instance', { exact: true }).fill('')
          await p.getByLabel('Own Valhalla instance', { exact: true }).blur()
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
        // The composer with the name typed and the tick beside it.
        prepare: async p => {
          await section(p, 'Packing Templates').getByRole('button', { name: 'New Template' }).click()
          const input = p.getByPlaceholder('Template name (e.g. Beach Holiday)')
          await expect(input).toBeVisible()
          await typeInto(p, input, 'City Break')
          await beat(p, 300)
        },
        target: p => p.getByPlaceholder('Template name (e.g. Beach Holiday)').locator('xpath=..'),
        act: async p => {
          // Leave the seed as it is: Cancel beside the field discards the draft.
          const input = p.getByPlaceholder('Template name (e.g. Beach Holiday)')
          await input.locator('xpath=..').getByRole('button', { name: 'Cancel' }).click()
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
        // The new category opens in a dialog, its name in the dialog's head.
        target: p => dialogPanel(p),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Cancel' }).click()
          await expect(p.getByPlaceholder('Category name')).toHaveCount(0)
        },
      },
      // Edit and Delete are always on the row; the pointer rests on Edit.
      {
        target: p => section(p, /^Categories$/).getByText('Restaurant', { exact: true }).first().locator('xpath=ancestor::div[contains(@class,"group")][1]'),
        hover: async p => {
          await section(p, /^Categories$/).getByText('Restaurant', { exact: true }).first()
            .locator('xpath=ancestor::div[contains(@class,"group")][1]').getByRole('button', { name: 'Edit' }).hover()
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
        target: p => dialogPanel(p),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Cancel' }).click()
          await expect(modal(p)).toHaveCount(0)
        },
      },
    ],
  },

  // ── Security ─────────────────────────────────────────────────────────────
  'auth-methods': {
    guide: guide('auth-methods'),
    // The SSO rows exist only once OIDC is configured, so the guide sets an
    // issuer and a client id up front and takes them away again afterwards.
    start: async p => {
      await configureOidc(p.request)
      await openAdmin(p, 'Security')
      await expect(row(authCard(p), 'SSO Login')).toBeVisible({ timeout: 10_000 })
    },
    steps: [
      only(p => row(authCard(p), 'Password Login')),
      only(p => row(authCard(p), 'SSO Auto-Provisioning')),
      only(p => row(authCard(p), 'Require 2FA')),
    ],
    cleanup: p => clearOidc(p.request),
  },
  'admin-passkeys': {
    guide: guide('admin-passkeys'),
    start: opener('admin-settings'),
    steps: [
      // Not flipped: the switch saves at once, and the seed keeps passkeys off.
      only(p => row(authCard(p), 'Enable passkey login')),
      only(p => section(p, 'Passkey login')),
    ],
  },
  oidc: {
    guide: guide('oidc'),
    start: opener('admin-settings'),
    steps: [
      {
        prepare: async p => {
          const card = section(p, 'Single Sign-On (OIDC)')
          await typeInto(p, card.locator('#oidc-display-name'), 'Authentik')
          await typeInto(p, card.locator('#oidc-issuer'), 'https://auth.example.org/application/o/trek/')
          await typeInto(p, card.locator('#oidc-client-id'), 'trek')
          await typeInto(p, card.locator('#oidc-client-secret'), 'a-long-client-secret')
          await beat(p, 300)
        },
        target: p => section(p, 'Single Sign-On (OIDC)'),
        hover: async p => { await section(p, 'Single Sign-On (OIDC)').getByRole('button', { name: 'Save', exact: true }).hover() },
        act: async p => {
          await section(p, 'Single Sign-On (OIDC)').getByRole('button', { name: 'Save', exact: true }).click()
          await expect.poll(async () => {
            const res = await p.request.get('/api/admin/oidc')
            return ((await res.json()) as { client_id?: string }).client_id
          }, { timeout: 10_000 }).toBe('trek')
        },
      },
      {
        // The card and the sign-in rows read the configuration when the page loads.
        prepare: async p => {
          await openAdmin(p, 'Security')
          await expect(row(authCard(p), 'SSO Login')).toBeVisible({ timeout: 10_000 })
        },
        target: p => row(authCard(p), 'SSO Login'),
      },
      only(p => row(authCard(p), 'Go straight to SSO')),
    ],
    cleanup: p => clearOidc(p.request),
  },
  'rotate-jwt-secret': {
    guide: guide('rotate-jwt-secret'),
    start: opener('admin-settings'),
    steps: [
      {
        target: p => section(p, 'Danger Zone').getByRole('button', { name: 'Rotate', exact: true }),
        act: async p => {
          await section(p, 'Danger Zone').getByRole('button', { name: 'Rotate', exact: true }).click()
          await expect(modal(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        target: p => dialogPanel(p),
        // Never confirmed: rotating would sign the run itself out.
        hover: async p => { await modal(p).getByRole('button', { name: 'Rotate & Log out' }).hover() },
        act: async p => {
          await modal(p).getByRole('button', { name: 'Cancel' }).click()
          await expect(modal(p)).toHaveCount(0)
        },
      },
    ],
  },

  // ── Services ─────────────────────────────────────────────────────────────
  'instance-keys': {
    guide: guide('instance-keys'),
    start: services,
    steps: [
      only(p => trekApiCard(p)),
      // The whole Google block: key, Test and what the key may be used for under it.
      only(p => block(p, 'Google Maps API Key')),
      only(p => block(p, 'Unsplash API Key')),
    ],
  },
  'places-transit': {
    guide: guide('places-transit'),
    start: services,
    steps: [
      only(p => block(p, 'Transit Provider')),
      only(p => block(p, 'Place search provider')),
    ],
  },
  'file-types': {
    guide: guide('file-types'),
    start: services,
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
      // The row with its options: Documents is on in the seed, so the five stores are drawn.
      only(p => tile(p, 'Documents')),
      {
        // The whole row, so its name is in the frame; the switch's aria-label is the row's title.
        target: p => tile(p, 'Documents').getByRole('button', { name: 'Nextcloud', exact: true }).locator('xpath=ancestor::li[1]'),
        hover: async p => { await tile(p, 'Documents').getByRole('button', { name: 'Nextcloud', exact: true }).hover() },
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
  'mail-import-setup': {
    guide: guide('mail-import-setup'),
    start: opener('admin-addons'),
    steps: [
      {
        target: p => tile(p, 'Booking mail import'),
        act: async p => {
          const toggle = tile(p, 'Booking mail import').getByRole('button', { name: 'Import booking mails' })
          await toggle.click()
          await expect(toggle).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 })
          await expect(p.getByRole('button', { name: 'Set up mail import' })).toBeVisible({ timeout: 10_000 })
          await settle(p)
        },
      },
      {
        target: p => p.getByRole('button', { name: 'Set up mail import' }),
        act: async p => {
          await p.getByRole('button', { name: 'Set up mail import' }).click()
          await expect(modal(p)).toBeVisible()
          await settle(p)
        },
      },
      {
        // IMAP draws every field the step names; nothing is saved, so no mailbox is asked.
        prepare: async p => {
          await modal(p).getByRole('button', { name: 'Upload only' }).click()
          await p.getByRole('button', { name: 'IMAP mailbox', exact: true }).last().click()
          await expect(modal(p).locator('#mail-imap-host')).toBeVisible()
          await typeInto(p, modal(p).locator('#mail-template'), 'trek+{token}@example.org')
          await typeInto(p, modal(p).locator('#mail-imap-host'), 'imap.example.org')
          await typeInto(p, modal(p).locator('#mail-imap-user'), 'trek@example.org')
          await typeInto(p, modal(p).locator('#mail-imap-pass'), 'mailbox-password')
          await beat(p, 300)
        },
        target: p => dialogPanel(p),
      },
      {
        target: p => modal(p).getByRole('button', { name: 'Test connection' }).locator('xpath=..'),
        hover: async p => { await modal(p).getByRole('button', { name: 'Save', exact: true }).hover() },
        act: async p => {
          await modal(p).getByRole('button', { name: 'Close', exact: true }).last().click()
          // The setup asks before it drops what was typed.
          await p.getByRole('button', { name: 'Discard', exact: true }).click()
          await expect(modal(p)).toHaveCount(0)
        },
      },
    ],
    cleanup: p => putAppSettings(p.request, { mail_ingest_enabled: false }),
  },
  'ai-setup': {
    guide: guide('ai-setup'),
    // The key is never tested against a provider: fixtures-assistant.ts answers for the connection.
    start: async p => {
      const res = await p.request.get('/api/admin/ai/settings')
      aiSettingsBefore = res.ok() ? await res.json() : null
      await toggleAddon(p.request, 'ai_assistant', false)
      await mockInstanceConnection(p)
      await openAdmin(p, TAB_OF['admin-addons'])
    },
    steps: [
      {
        target: p => tile(p, 'AI'),
        act: async p => {
          const toggle = tile(p, 'AI').getByRole('button', { name: 'AI Assistant', exact: true })
          await toggle.click()
          await expect(toggle).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 })
          await expect(tile(p, 'AI').getByRole('button', { name: 'Set up AI' })).toBeVisible({ timeout: 10_000 })
          await settle(p)
        },
      },
      {
        target: p => tile(p, 'AI').getByRole('button', { name: 'Set up AI' }),
        act: async p => {
          await tile(p, 'AI').getByRole('button', { name: 'Set up AI' }).click()
          await expect(aiDialog(p).getByRole('radiogroup', { name: 'Who pays' })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => aiDialog(p).getByRole('radiogroup', { name: 'Who pays' }).locator('xpath=..'),
        hover: async p => { await aiDialog(p).getByRole('radio', { name: 'I pay, own allowed' }).hover() },
        act: async p => {
          await aiDialog(p).getByRole('radio', { name: 'I pay, own allowed' }).click()
          await expect(aiDialog(p).getByRole('radio', { name: 'I pay, own allowed' })).toHaveAttribute('aria-checked', 'true')
          await settle(p)
        },
      },
      {
        prepare: async p => {
          await aiDialog(p).getByRole('button', { name: /^Paste an API key/ }).click()
          await typeInto(p, aiDialog(p).getByPlaceholder('Paste your key here'), AI_KEY)
          await expect(aiDialog(p).getByText('Detected: Anthropic')).toBeVisible()
          await settle(p)
        },
        target: p => aiDialog(p).getByText('Connection for everyone', { exact: true }).locator('xpath=..'),
        hover: async p => { await aiDialog(p).getByRole('button', { name: 'Connect', exact: true }).hover() },
        act: async p => {
          await aiDialog(p).getByRole('button', { name: 'Connect', exact: true }).click()
          await expect(aiDialog(p).getByRole('button', { name: 'Remove connection' })).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => aiDialog(p).getByRole('button', { name: 'Remove connection' }).locator('xpath=ancestor::div[contains(@class,"p-3")][1]'),
        act: async p => {
          await aiDialog(p).getByRole('button', { name: 'AI Assistant', exact: true }).click()
          await expect(aiDialog(p).getByText('Keep chats', { exact: true })).toBeVisible({ timeout: 10_000 })
          await settle(p)
        },
      },
      only(p => aiDialog(p).getByText('Keep chats', { exact: true }).locator('xpath=ancestor::div[contains(@class,"gap-4")][1]')),
    ],
    cleanup: async p => {
      if (aiSettingsBefore) await p.request.put('/api/admin/ai/settings', { data: aiSettingsBefore })
      await toggleAddon(p.request, 'ai_assistant', false)
    },
  },
  'paddle-water-data': {
    guide: guide('paddle-water-data'),
    start: opener('admin-addons'),
    steps: [
      {
        target: p => p.getByRole('button', { name: /^Paddle water data/ }),
        act: async p => {
          await p.getByRole('button', { name: /^Paddle water data/ }).click()
          await expect(modal(p)).toBeVisible()
          await expect(modal(p).getByTestId('paddle-auto-load')).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      only(p => modal(p).getByTestId('paddle-auto-load')),
      {
        // A search shows the hits with their Add; Geofabrik's list comes through the server.
        prepare: async p => {
          const field = modal(p).getByPlaceholder('Search Geofabrik, for example Oberpfalz')
          await typeInto(p, field, 'Oberpfalz')
          const hit = modal(p).getByRole('button', { name: 'Add', exact: true }).first()
          const failed = modal(p).getByRole('alert')
          await expect(hit.or(failed).first()).toBeVisible({ timeout: 30_000 })
          // Without Geofabrik the field stays empty rather than showing an error.
          if (!(await hit.isVisible())) await field.fill('')
          await settle(p)
        },
        target: p => modal(p).getByPlaceholder('Search Geofabrik, for example Oberpfalz').locator('xpath=ancestor::div[contains(@class,"gap-2")][1]'),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Close', exact: true }).last().click()
          await expect(modal(p)).toHaveCount(0)
        },
      },
    ],
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
        target: p => p.getByTestId('plugin-row-menu-btn-trip-doctor').locator('xpath=ancestor::div[contains(@class,"group") and contains(@class,"px-3.5")][1]'),
        act: async p => {
          const pluginRow = p.getByTestId('plugin-row-menu-btn-trip-doctor').locator('xpath=ancestor::div[contains(@class,"group") and contains(@class,"px-3.5")][1]')
          await pluginRow.getByRole('button', { name: 'Enable plugin' }).click()
          await expect(pluginRow.getByText('Active', { exact: true })).toBeVisible({ timeout: 30_000 })
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
          await expect(modal(p).getByText('Add backend', { exact: true })).toBeVisible()
          await typeInto(p, modal(p).locator('input').first(), 'archive')
          await settle(p)
        },
        // The new backend opens in a dialog.
        target: p => dialogPanel(p),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Cancel' }).click()
          await expect(modal(p).getByText('Add backend', { exact: true })).toHaveCount(0)
        },
      },
      only(p => section(p, /^Categories$/)),
      // Nothing changed, so the button is still greyed; the bar is what the step names.
      only(p => p.getByRole('button', { name: 'Save changes' }).locator('xpath=..')),
      only(p => section(p, /^Health$/)),
    ],
  },

  // ── Notifications ────────────────────────────────────────────────────────
  'channels-instance': {
    guide: guide('channels-instance'),
    start: opener('admin-notifications'),
    steps: [
      only(p => block(p, 'Email (SMTP)')),
      only(p => section(p, /^Channels$/).locator('div.divide-y').first()),
      only(p => row(section(p, /^Channels$/), 'Trip Reminders')),
    ],
  },
  'admin-channels': {
    guide: guide('admin-channels'),
    start: opener('admin-notifications'),
    steps: [
      only(p => section(p, 'Admin alerts')),
      only(p => block(p, 'Admin Ntfy').getByRole('button', { name: 'Send test ntfy' })),
      // The admin matrix at the foot of the same card.
      only(p => section(p, 'Admin alerts').locator('div.overflow-x-auto').first()),
    ],
  },
  'notification-defaults': {
    guide: guide('notification-defaults'),
    start: opener('admin-notifications'),
    steps: [
      only(p => p.locator('#notif-defaults')),
      // Hovered, not clicked: the tooltip names the next state and the seed keeps its defaults.
      only(p => p.locator('#notif-defaults button[data-state]').first()),
    ],
  },

  // ── MCP ──────────────────────────────────────────────────────────────────
  'mcp-tokens-admin': {
    guide: guide('mcp-tokens-admin'),
    start: opener('admin-mcp-tokens'),
    steps: [
      only(p => p.locator('h2, h3').filter({ hasText: 'OAuth Sessions' }).first().locator('xpath=ancestor::section[1]')),
      only(p => p.locator('h2, h3').filter({ hasText: 'API Tokens' }).first().locator('xpath=ancestor::section[1]')),
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
          await expect(section(p, 'Auto-Backup').getByText('Interval', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
          await settle(p)
        },
      },
      only(p => row(section(p, 'Auto-Backup'), 'Delete old backups after')),
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
