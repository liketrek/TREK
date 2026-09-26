import { test, expect, type Page, type Locator } from '@playwright/test'
import { createHmac } from 'node:crypto'
import { clearNotices } from '../screenshots/shot'
import { captureGuide, captureHero, dismissReleaseNotice, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { settingsContext, settingsTabContexts, settingsGuides } from '../../src/help/contexts/settings'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the settings screens, keyed by the ids in
 * `src/help/contexts/settings.ts`. One route, one tab per screen; most guides
 * only frame a section, and the few that change something (theme, an API key,
 * two-factor authentication) leave the account in a state the run can live
 * with, because settings is the last file of the run.
 */

const TAB_OF: Record<string, string> = {
  'settings-display': 'General',
  'settings-appearance': 'Appearance',
  'settings-map': 'Map',
  'settings-notifications': 'Notifications',
  'settings-integrations': 'Integrations',
  'settings-offline': 'Offline',
  'settings-account': 'Account',
}

const guide = (id: string): HelpGuide => {
  const g = settingsGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

const sidebar = (page: Page) => page.locator('nav').filter({ has: page.getByRole('button', { name: 'General' }) }).first()
/** A settings card by the heading of its section. */
const section = (page: Page, title: string) =>
  page.locator('h2').filter({ hasText: title }).first().locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]')
/** A field of a section by its label. */
const field = (page: Page, sectionTitle: string, label: string) =>
  section(page, sectionTitle).getByText(label, { exact: true }).first().locator('xpath=..')
const modal = (page: Page) => page.locator('.trek-modal-backdrop').last()
/** A sub-section headed by an h3 inside a card (the passkeys block under Account). */
const subsection = (page: Page, title: string) => page.locator('h3').filter({ hasText: title }).first().locator('xpath=../..')

async function openSettings(page: Page, tab: string): Promise<void> {
  await page.goto('/settings')
  await clearNotices(page)
  await dismissReleaseNotice(page)
  await expect(sidebar(page)).toBeVisible({ timeout: 20_000 })
  await sidebar(page).getByRole('button', { name: tab, exact: true }).click()
  await settle(page)
}

const opener = (contextId: string) => (page: Page) => openSettings(page, TAB_OF[contextId])

/** RFC 6238 code for the secret the setup shows, so the run can enable 2FA for real. */
function totp(secretBase32: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const clean = secretBase32.toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = ''
  for (const ch of clean) bits += alphabet.indexOf(ch).toString(2).padStart(5, '0')
  const bytes = Buffer.from((bits.match(/.{8}/g) ?? []).map(b => parseInt(b, 2)))
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)))
  const mac = createHmac('sha1', bytes).update(counter).digest()
  const offset = mac[mac.length - 1] & 0x0f
  const code = ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3]
  return String(code % 1_000_000).padStart(6, '0')
}

const only = (target: (p: Page) => Locator) => ({ target })

const SCRIPTS: Record<string, GuideScript> = {
  // ── General ──────────────────────────────────────────────────────────────
  'language-region': {
    guide: guide('language-region'),
    start: opener('settings-display'),
    steps: [
      only(p => field(p, 'Language & region', 'Language')),
      only(p => section(p, 'Language & region')),
    ],
  },
  'travel-map-prefs': {
    guide: guide('travel-map-prefs'),
    start: opener('settings-display'),
    steps: [
      only(p => field(p, 'Travel & map', 'Always show booking routes').locator('xpath=..')),
      only(p => field(p, 'Travel & map', 'Blur Booking Codes').locator('xpath=..')),
    ],
  },
  startup: {
    guide: guide('startup'),
    start: opener('settings-display'),
    steps: [
      {
        target: p => field(p, 'Startup', 'Start page').locator('xpath=..'),
        // The start tab only exists once the app opens on the active trip.
        act: async p => { await section(p, 'Startup').getByRole('button', { name: 'Active trip' }).click(); await settle(p) },
      },
      only(p => field(p, 'Startup', 'Start tab').locator('xpath=..')),
    ],
    cleanup: async p => { await section(p, 'Startup').getByRole('button', { name: 'Dashboard', exact: true }).click(); await settle(p) },
  },

  // ── Appearance ───────────────────────────────────────────────────────────
  'theme-scheme': {
    guide: guide('theme-scheme'),
    start: opener('settings-appearance'),
    steps: [
      {
        target: p => section(p, 'Theme').getByRole('button', { name: 'Dark', exact: true }).locator('xpath=..'),
        act: async p => { await section(p, 'Theme').getByRole('button', { name: 'Light', exact: true }).click(); await beat(p, 400) },
      },
      {
        target: p => section(p, 'Theme').getByText('Color scheme', { exact: true }).locator('xpath=..'),
        act: async p => { await section(p, 'Theme').getByRole('button', { name: 'Teal', exact: true }).click(); await settle(p) },
      },
      {
        prepare: async p => { await section(p, 'Theme').getByRole('button', { name: 'Custom', exact: true }).click(); await settle(p) },
        target: p => section(p, 'Theme').getByText('Custom accent', { exact: true }).locator('xpath=..'),
        act: async p => {
          await section(p, 'Theme').getByRole('button', { name: 'Teal', exact: true }).click()
          await settle(p)
        },
      },
    ],
    cleanup: async p => {
      await section(p, 'Theme').getByRole('button', { name: 'Default', exact: true }).click()
      await settle(p)
    },
  },
  readability: {
    guide: guide('readability'),
    start: opener('settings-appearance'),
    steps: [
      only(p => section(p, 'Readability').getByText('Transparency', { exact: true }).first().locator('xpath=../..')),
      only(p => section(p, 'Readability').getByText('Text size', { exact: true }).first().locator('xpath=../..')),
    ],
  },
  'dashboard-widgets': {
    guide: guide('dashboard-widgets'),
    start: opener('settings-appearance'),
    steps: [
      only(p => section(p, 'Dashboard widgets')),
      only(p => p.getByRole('button', { name: 'Reset to defaults' })),
    ],
  },

  // ── Map ──────────────────────────────────────────────────────────────────
  'map-provider': {
    guide: guide('map-provider'),
    start: opener('settings-map'),
    steps: [
      only(p => section(p, 'Map').getByText('Map Provider', { exact: true }).locator('xpath=..')),
      only(p => section(p, 'Map').getByText(/^Map (Style|Template)$/).first().locator('xpath=..')),
      only(p => section(p, 'Map').getByRole('button', { name: 'Save Map' }).locator('xpath=..')),
    ],
  },

  // ── Notifications ────────────────────────────────────────────────────────
  'notification-channels': {
    guide: guide('notification-channels'),
    start: opener('settings-notifications'),
    steps: [
      only(p => section(p, 'Notifications').getByText('Ntfy Topic', { exact: true }).locator('xpath=../..')),
      only(p => section(p, 'Notifications').getByText('Webhook URL', { exact: true }).locator('xpath=../..')),
      only(p => page_rows(p)),
    ],
  },

  // ── Integrations ─────────────────────────────────────────────────────────
  'photo-providers': {
    guide: guide('photo-providers'),
    start: opener('settings-integrations'),
    steps: [
      only(p => section(p, 'Immich')),
      only(p => section(p, 'Immich').getByRole('button', { name: 'Test connection' }).locator('xpath=..')),
    ],
  },
  'api-keys': {
    guide: guide('api-keys'),
    start: opener('settings-integrations'),
    steps: [
      {
        target: p => section(p, 'API Keys').getByRole('button', { name: 'Create key' }),
        act: async p => {
          await section(p, 'API Keys').getByRole('button', { name: 'Create key' }).click()
          await expect(modal(p)).toBeVisible()
          await typeInto(p, modal(p).getByPlaceholder('e.g. Dawarich'), 'Home Assistant')
          await modal(p).getByRole('button', { name: 'Create', exact: true }).click()
          await expect(modal(p).getByText('API key created')).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => modal(p).locator('> [role="presentation"]').first(),
        act: async p => {
          await modal(p).getByRole('button', { name: 'Done' }).click()
          await expect(modal(p)).toHaveCount(0)
          await settle(p)
        },
      },
    ],
  },
  'mcp-oauth': {
    guide: guide('mcp-oauth'),
    start: opener('settings-integrations'),
    steps: [
      only(p => section(p, 'MCP Configuration').getByText('MCP Endpoint', { exact: true }).locator('xpath=..')),
      {
        prepare: async p => { await section(p, 'MCP Configuration').getByRole('button', { name: 'OAuth 2.1 Clients' }).click(); await settle(p) },
        target: p => section(p, 'MCP Configuration').getByRole('button', { name: 'New Client' }).locator('xpath=../..'),
      },
      {
        prepare: async p => { await section(p, 'MCP Configuration').getByRole('button', { name: 'API Tokens' }).click(); await settle(p) },
        target: p => section(p, 'MCP Configuration').getByRole('button', { name: 'Create New Token' }).locator('xpath=../..'),
      },
    ],
  },

  // ── Offline ──────────────────────────────────────────────────────────────
  'offline-prepare': {
    guide: guide('offline-prepare'),
    start: opener('settings-offline'),
    steps: [
      only(p => section(p, 'What to store offline')),
      only(p => p.getByRole('button', { name: 'Download for offline use' })),
      only(p => section(p, 'Offline mode').getByRole('button', { name: 'Force offline mode' }).locator('xpath=..')),
    ],
  },
  'offline-conflicts': {
    guide: guide('offline-conflicts'),
    start: opener('settings-offline'),
    steps: [
      // The conflicts section only exists while a conflict is open; the cache card shows their count.
      only(p => section(p, 'Offline cache')),
      only(p => p.getByRole('button', { name: 'Re-sync now' })),
    ],
  },

  // ── Account ──────────────────────────────────────────────────────────────
  profile: {
    guide: guide('profile'),
    start: opener('settings-account'),
    steps: [
      only(p => section(p, 'Account').getByText('Username', { exact: true }).first().locator('xpath=../..')),
      only(p => section(p, 'Account').getByRole('button', { name: 'Save Profile' })),
    ],
  },
  password: {
    guide: guide('password'),
    start: opener('settings-account'),
    steps: [
      only(p => section(p, 'Account').getByPlaceholder('Current password').locator('xpath=../..')),
      only(p => section(p, 'Account').getByRole('button', { name: 'Update password' })),
    ],
  },
  mfa: {
    guide: guide('mfa'),
    start: opener('settings-account'),
    steps: [
      {
        target: p => subsection(p, 'Two-factor authentication (2FA)').getByRole('button', { name: 'Set up authenticator' }),
        act: async p => {
          await subsection(p, 'Two-factor authentication (2FA)').getByRole('button', { name: 'Set up authenticator' }).click()
          await expect(subsection(p, 'Two-factor authentication (2FA)').locator('code')).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => subsection(p, 'Two-factor authentication (2FA)').getByPlaceholder('6-digit code').locator('xpath=../..'),
        act: async p => {
          const mfa = subsection(p, 'Two-factor authentication (2FA)')
          const secret = (await mfa.locator('code').first().innerText()).trim()
          await typeInto(p, mfa.getByPlaceholder('6-digit code'), totp(secret))
          await mfa.getByRole('button', { name: 'Enable 2FA' }).click()
          await expect(mfa.getByText('Backup codes').first()).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => subsection(p, 'Two-factor authentication (2FA)').getByText('Backup codes').first().locator('xpath=..'),
      },
    ],
  },
  passkeys: {
    guide: guide('passkeys'),
    start: opener('settings-account'),
    steps: [
      // Passkeys need a secure context; the run is plain http, so this guide has no pictures.
      {},
      {},
    ],
  },
  'delete-account': {
    guide: guide('delete-account'),
    start: opener('settings-account'),
    steps: [
      only(p => p.getByRole('button', { name: 'Delete account' }).locator('xpath=..')),
    ],
  },
}

/** The per-event preference rows under the channels. */
function page_rows(p: Page): Locator {
  return section(p, 'Notifications').locator('table, [role="table"], .space-y-4 > div').last()
}

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

const ALL_CONTEXTS = [settingsContext, ...settingsTabContexts]

// The photo-provider sections exist only for providers the admin switched on, and the
// ntfy and webhook forms only for channels the admin turned on.
test.beforeAll(async ({ request }) => {
  const res = await request.put('/api/admin/addons/immich', { data: { enabled: true } })
  if (!res.ok()) throw new Error(`could not enable the Immich provider: ${res.status()} ${await res.text()}`)
  const channels = await request.put('/api/auth/app-settings', { data: { notification_channels: 'ntfy,webhook' } })
  if (!channels.ok()) throw new Error(`could not enable the notification channels: ${channels.status()} ${await channels.text()}`)
})

test('every registered settings guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual(ALL_CONTEXTS.flatMap(c => c.guides).sort())
})

test('hero: settings', async ({ page }) => {
  await page.setViewportSize(VIEWPORT)
  await captureHero(page, settingsContext.id, p => openSettings(p, 'General'))
})

for (const ctx of settingsTabContexts) {
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
