import { test, expect, type Page, type Locator } from '@playwright/test'
import { createHmac } from 'node:crypto'
import { clearNotices } from '../screenshots/shot'
import { captureGuide, captureHero, dismissReleaseNotice, beat, typeInto, settle, VIEWPORT, type GuideScript } from './guide'
import { ensureAirtrailFlights, ensureDawarichRecording, disconnectAirtrail, disconnectDawarich, toggleAddon } from './external'
import {
  mediaEnv, wandererUrl, wandererToken, allowWanderer, ensureWandererConnection, disconnectWanderer,
  ensureActivePlugin, removeSideloadedPlugin, parkOfflineChanges, clearParkedChanges,
} from './fixtures-settings'
import { settingsContext, settingsTabContexts, settingsGuides } from '../../src/help/contexts/settings'
import type { HelpGuide } from '../../src/help/types'

/**
 * Actions for the settings screens, keyed by the ids in
 * `src/help/contexts/settings.ts`. One route, one tab per screen; most guides
 * only frame a card or a row, and the few that change something (theme, an API
 * key, two-factor authentication) leave the account in a state the run can live
 * with, because settings is the last file of the run.
 *
 * The cards come from `components/Settings/settingsKit.tsx`: a <section> with an
 * <h2> in its head band, rows inside (`SettingRow`, a div with `px-3.5`), boxes
 * of rows (`SettingRows`, a div with `divide-y`). A stacked row puts its wide
 * control in a sibling below the label, so a row is found from its label by its
 * own div, never by the label's parent.
 *
 * Connect AirTrail, Dawarich and the two wanderer guides need those services
 * (media.env, see README and fixtures-settings.ts) and fail at their start
 * without them; every other guide runs on the seed.
 */

const TAB_OF: Record<string, string> = {
  'settings-display': 'General',
  'settings-appearance': 'Appearance',
  'settings-map': 'Map',
  'settings-notifications': 'Notifications',
  'settings-integrations': 'Integrations',
  'settings-plugins': 'Plugins',
  'settings-offline': 'Offline',
  'settings-account': 'Account',
  'settings-about': 'About',
}

const guide = (id: string): HelpGuide => {
  const g = settingsGuides.find(x => x.id === id)
  if (!g) throw new Error(`no registered guide "${id}"`)
  return g
}

const sidebar = (page: Page) => page.locator('nav').filter({ has: page.getByRole('button', { name: 'General' }) }).first()
/** A settings card by the heading of its section. */
const section = (page: Page, title: string | RegExp) =>
  page.locator('h2').filter({ hasText: title }).first().locator('xpath=ancestor::section[1]')
/** The label of a field or a row inside a card. */
const label = (page: Page, sectionTitle: string | RegExp, text: string) =>
  section(page, sectionTitle).getByText(text, { exact: true }).first()
/** A field of a section by its label: the label's own column, as before. */
const field = (page: Page, sectionTitle: string | RegExp, text: string) => label(page, sectionTitle, text).locator('xpath=..')
/** A whole row (label, control and whatever the row holds below them) by its label. */
const row = (page: Page, sectionTitle: string | RegExp, text: string) =>
  label(page, sectionTitle, text).locator('xpath=ancestor::div[contains(@class,"px-3.5")][1]')
/** The box of rows a row sits in. */
const rows = (page: Page, sectionTitle: string | RegExp, text: string) =>
  label(page, sectionTitle, text).locator('xpath=ancestor::div[contains(@class,"divide-y")][1]')
/** The line of buttons a card ends with, found by its Save. */
const buttonRow = (page: Page, sectionTitle: string | RegExp) =>
  section(page, sectionTitle).getByRole('button', { name: 'Save', exact: true }).locator('xpath=..')
/** The two fields side by side (address and key) of a connection card, by the address field's id. */
const fieldPair = (page: Page, inputId: string) => page.locator(`#${inputId}`).locator('xpath=../..')
const dialog = (page: Page) => page.getByRole('dialog').last()
/** A sub-section headed by an h2 or h3 inside a card. */
const subsection = (page: Page, title: string) => page.locator('h2, h3').filter({ hasText: title }).first().locator('xpath=ancestor::section[1]')
const badge = (page: Page, sectionTitle: string, text: string) => section(page, sectionTitle).getByText(text, { exact: true }).first()
/** The background check's switch, not the info dot beside its label, which carries the same name. */
const watchSwitch = (page: Page) =>
  section(page, /^wanderer$/).locator('button[aria-pressed][aria-label="Check my trails for changes"]')

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

/**
 * Save, wait for the card to say Connected, then Test connection and wait for
 * its answer: the order the connect guides tell the reader.
 */
async function saveAndTest(page: Page, card: string, connected: string, answer: (p: Page) => Locator): Promise<void> {
  await section(page, card).getByRole('button', { name: 'Save', exact: true }).click()
  await expect(badge(page, card, connected)).toBeVisible({ timeout: 30_000 })
  await section(page, card).getByRole('button', { name: 'Test connection' }).click()
  await expect(answer(page)).toBeVisible({ timeout: 30_000 })
  await settle(page)
}

const SCRIPTS: Record<string, GuideScript> = {
  // ── General ──────────────────────────────────────────────────────────────
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
  'language-region': {
    guide: guide('language-region'),
    start: opener('settings-display'),
    steps: [
      // The chips sit below the label in a stacked row, so the row, not the label's column.
      only(p => row(p, 'Language & region', 'Language')),
      only(p => row(p, 'Language & region', 'Place names')),
      only(p => section(p, 'Language & region')),
    ],
  },
  'travel-map-prefs': {
    guide: guide('travel-map-prefs'),
    start: opener('settings-display'),
    steps: [
      only(p => row(p, 'Travel & map', 'Open places in')),
      only(p => row(p, 'Travel & map', 'Always show booking routes')),
      only(p => row(p, 'Travel & map', 'Explore places on the map')),
    ],
  },

  // ── Appearance ───────────────────────────────────────────────────────────
  'theme-scheme': {
    guide: guide('theme-scheme'),
    start: opener('settings-appearance'),
    steps: [
      {
        target: p => section(p, 'Theme').getByRole('group', { name: 'Color Mode' }),
        act: async p => { await section(p, 'Theme').getByRole('button', { name: 'Light', exact: true }).click(); await beat(p, 400) },
      },
      {
        target: p => row(p, 'Theme', 'Color scheme'),
        // Custom brings up the accent row the next step is about.
        act: async p => { await section(p, 'Theme').getByRole('button', { name: 'Custom', exact: true }).click(); await settle(p) },
      },
      {
        target: p => row(p, 'Theme', 'Custom accent'),
        // One of the preset dots (named by its hex), so the result shows a picked accent.
        act: async p => { await section(p, 'Theme').locator('button[aria-label^="#"]').nth(2).click(); await settle(p) },
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
      only(p => rows(p, 'Readability', 'Transparency')),
      only(p => row(p, 'Readability', 'Text size')),
    ],
  },
  'dashboard-widgets': {
    guide: guide('dashboard-widgets'),
    start: opener('settings-appearance'),
    steps: [
      only(p => label(p, 'Dashboard widgets', 'Desktop').locator('xpath=ancestor::section[1]')),
      only(p => label(p, 'Dashboard widgets', 'Mobile').locator('xpath=ancestor::section[1]')),
      only(p => p.getByRole('button', { name: 'Reset to defaults' })),
    ],
  },

  // ── Map ──────────────────────────────────────────────────────────────────
  'map-provider': {
    guide: guide('map-provider'),
    start: opener('settings-map'),
    steps: [
      only(p => row(p, /^Map$/, 'Map Provider')),
      only(p => section(p, /^Map$/).getByText(/^Map (Style|Template)$/).first().locator('xpath=..')),
      {
        // The Mapbox rows only exist with Mapbox GL picked; nothing is saved, the reload in cleanup drops it.
        prepare: async p => { await section(p, /^Map$/).getByRole('button', { name: /Mapbox GL/ }).click(); await settle(p) },
        target: p => rows(p, /^Map$/, '3D Buildings & Terrain'),
      },
    ],
    cleanup: async p => { await p.reload(); await settle(p) },
  },

  // ── Notifications ────────────────────────────────────────────────────────
  'notification-channels': {
    guide: guide('notification-channels'),
    start: opener('settings-notifications'),
    steps: [
      only(p => section(p, 'Webhook URL')),
      only(p => section(p, 'Ntfy')),
      // The per-event matrix is the first card, headed Notifications.
      only(p => section(p, /^Notifications$/)),
    ],
  },
  'web-push-device': {
    guide: guide('web-push-device'),
    start: opener('settings-notifications'),
    steps: [
      only(p => section(p, 'Push notifications on this device')),
      only(p => section(p, /^Notifications$/)),
    ],
  },

  // ── Integrations ─────────────────────────────────────────────────────────
  'photo-providers': {
    guide: guide('photo-providers'),
    start: opener('settings-integrations'),
    steps: [
      only(p => section(p, 'Immich')),
      only(p => section(p, 'Immich').getByRole('button', { name: 'Test connection' }).locator('xpath=ancestor::div[contains(@class,"flex-wrap")][1]')),
    ],
  },
  'connect-airtrail': {
    guide: guide('connect-airtrail'),
    // The account holds the flights first, so Test connection has something to count.
    start: async p => {
      await ensureAirtrailFlights()
      await disconnectAirtrail(p.request)
      await toggleAddon(p.request, 'airtrail', true)
      await openSettings(p, 'Integrations')
      await expect(section(p, 'AirTrail')).toBeVisible({ timeout: 20_000 })
    },
    steps: [
      {
        target: p => fieldPair(p, 'airtrail-url'),
        act: async p => {
          await typeInto(p, p.locator('#airtrail-url'), mediaEnv('HELP_MEDIA_AIRTRAIL_URL'))
          await typeInto(p, p.locator('#airtrail-key'), mediaEnv('HELP_MEDIA_AIRTRAIL_API_KEY'))
          await settle(p)
        },
      },
      only(p => rows(p, 'AirTrail', 'Allow self-signed certificates')),
      {
        target: p => buttonRow(p, 'AirTrail'),
        act: p => saveAndTest(p, 'AirTrail', 'Connected', q => q.getByText(/^Connected\. \d+ flights? found$/).first()),
      },
    ],
    cleanup: p => disconnectAirtrail(p.request),
  },
  'connect-dawarich': {
    guide: guide('connect-dawarich'),
    // The recording first, so Test connection finds the stays of the last 30 days.
    start: async p => {
      await ensureDawarichRecording()
      await disconnectDawarich(p.request)
      await toggleAddon(p.request, 'dawarich', true)
      await openSettings(p, 'Integrations')
      await expect(section(p, 'Dawarich')).toBeVisible({ timeout: 20_000 })
    },
    steps: [
      {
        target: p => fieldPair(p, 'dawarich-url'),
        act: async p => {
          await typeInto(p, p.locator('#dawarich-url'), mediaEnv('HELP_MEDIA_DAWARICH_URL'))
          await typeInto(p, p.locator('#dawarich-key'), mediaEnv('HELP_MEDIA_DAWARICH_API_KEY'))
          await settle(p)
        },
      },
      // Both switches stay off: an automatic check would seed suggestions into every later picture.
      only(p => rows(p, 'Dawarich', 'Check for new stays automatically')),
      {
        target: p => buttonRow(p, 'Dawarich'),
        act: p => saveAndTest(p, 'Dawarich', 'Connected', q => section(q, 'Dawarich').getByText(/^Connected\. \d+ stays? found in the last 30 days\.$/).first()),
      },
    ],
    cleanup: p => disconnectDawarich(p.request),
  },
  'tour-connect-wanderer': {
    guide: guide('tour-connect-wanderer'),
    start: async p => {
      await allowWanderer(p.request)
      await openSettings(p, 'Integrations')
      await expect(section(p, /^wanderer$/)).toBeVisible({ timeout: 20_000 })
    },
    steps: [
      {
        target: p => fieldPair(p, 'wanderer-url'),
        act: async p => {
          await typeInto(p, p.locator('#wanderer-url'), wandererUrl())
          await typeInto(p, p.locator('#wanderer-token'), wandererToken())
          await settle(p)
        },
      },
      only(p => row(p, /^wanderer$/, 'Allow a self-signed certificate')),
      {
        target: p => buttonRow(p, /^wanderer$/),
        act: async p => {
          const card = section(p, /^wanderer$/)
          await card.getByRole('button', { name: 'Save', exact: true }).click()
          await expect(card.getByText('Connected', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
          await card.getByRole('button', { name: 'Test connection' }).click()
          await expect(card.getByRole('status').getByText(/^Connected\./)).toBeVisible({ timeout: 30_000 })
          await settle(p)
        },
      },
    ],
    cleanup: p => disconnectWanderer(p.request),
  },
  'tour-wanderer-watch': {
    guide: guide('tour-wanderer-watch'),
    start: async p => {
      await ensureWandererConnection(p.request)
      await openSettings(p, 'Integrations')
      await expect(section(p, /^wanderer$/)).toBeVisible({ timeout: 20_000 })
    },
    steps: [
      {
        // Found by its switch: the label also holds the info dot, whose hidden text would spoil a text match.
        target: p => watchSwitch(p).locator('xpath=ancestor::div[contains(@class,"divide-y")][1]'),
        act: async p => {
          await watchSwitch(p).click()
          await expect(p.getByTestId('wanderer-watch-status')).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      only(p => p.getByTestId('wanderer-watch-status')),
    ],
    cleanup: p => disconnectWanderer(p.request),
  },
  'api-keys': {
    guide: guide('api-keys'),
    start: opener('settings-integrations'),
    steps: [
      {
        prepare: async p => {
          await section(p, 'API Keys').getByRole('button', { name: 'Create key' }).click()
          await expect(dialog(p).getByText('Create API key')).toBeVisible()
          await typeInto(p, dialog(p).getByPlaceholder('e.g. Home dashboard'), 'Home Assistant')
          // A key for a dashboard only needs the trips and their days.
          for (const area of ['Bookings', 'Accommodation', 'Who is coming', 'Wishlist', 'Totals']) {
            await dialog(p).getByRole('checkbox', { name: area }).click()
          }
          await settle(p)
        },
        target: p => dialog(p),
        act: async p => {
          await dialog(p).getByRole('button', { name: 'Create', exact: true }).click()
          await expect(dialog(p).getByText('API key created')).toBeVisible({ timeout: 15_000 })
          await settle(p)
        },
      },
      {
        target: p => dialog(p),
        act: async p => {
          await dialog(p).getByRole('button', { name: 'Done' }).click()
          await expect(p.getByRole('dialog')).toHaveCount(0)
          await settle(p)
        },
      },
    ],
  },
  'mcp-oauth': {
    guide: guide('mcp-oauth'),
    start: opener('settings-integrations'),
    steps: [
      only(p => field(p, 'MCP Configuration', 'MCP Endpoint')),
      {
        prepare: async p => {
          await section(p, 'MCP Configuration').getByRole('button', { name: 'OAuth 2.1 Clients' }).click()
          await section(p, 'MCP Configuration').getByRole('button', { name: 'New Client' }).click()
          await expect(dialog(p).getByText('Register OAuth Client')).toBeVisible()
          await dialog(p).getByRole('button', { name: 'Claude Desktop', exact: true }).click()
          await settle(p)
        },
        target: p => dialog(p),
        // Registered for real, so the next step has a client row with its two buttons.
        act: async p => {
          await dialog(p).getByRole('button', { name: 'Register Client', exact: true }).click()
          await expect(dialog(p).getByText('Client Registered')).toBeVisible({ timeout: 15_000 })
          await dialog(p).getByRole('button', { name: 'Done', exact: true }).click()
          await expect(p.getByRole('dialog')).toHaveCount(0)
          await settle(p)
        },
      },
      only(p => section(p, 'MCP Configuration').getByRole('button', { name: 'Rotate Secret' }).first().locator('xpath=ancestor::div[contains(@class,"divide-y")][1]')),
    ],
  },

  // ── Plugins ──────────────────────────────────────────────────────────────
  'plugin-settings': {
    guide: guide('plugin-settings'),
    start: opener('settings-plugins'),
    steps: [
      only(p => section(p, 'Plugin settings')),
      only(p => section(p, 'Plugin activity')),
    ],
  },

  // ── Offline ──────────────────────────────────────────────────────────────
  'offline-prepare': {
    guide: guide('offline-prepare'),
    start: opener('settings-offline'),
    steps: [
      only(p => section(p, 'What to store offline')),
      only(p => p.getByRole('button', { name: 'Download for offline use' })),
      only(p => row(p, 'Offline mode', 'Force offline mode')),
    ],
  },
  'offline-conflicts': {
    guide: guide('offline-conflicts'),
    // The conflicts card only exists while a change waits; two are parked in this browser's queue first.
    start: async p => {
      await openSettings(p, 'General')
      await parkOfflineChanges(p)
      await sidebar(p).getByRole('button', { name: 'Offline', exact: true }).click()
      await expect(section(p, 'Sync conflicts')).toBeVisible({ timeout: 15_000 })
      await settle(p)
    },
    steps: [
      only(p => section(p, 'Sync conflicts').getByRole('button', { name: 'Keep mine' }).locator('xpath=ancestor::div[contains(@class,"divide-y")][1]')),
      only(p => row(p, 'Sync conflicts', 'When a conflict happens')),
      only(p => section(p, 'Offline cache').getByRole('button', { name: 'Try again' }).locator('xpath=../..')),
    ],
    cleanup: async p => { await clearParkedChanges(p); await p.reload(); await settle(p) },
  },

  // ── Account ──────────────────────────────────────────────────────────────
  profile: {
    guide: guide('profile'),
    start: opener('settings-account'),
    steps: [
      // The identity strip: the picture with its camera, the name and the role.
      only(p => section(p, 'Account').locator('div[class*="rounded-[14px]"]').first()),
      only(p => fieldPair(p, 'account-username')),
      only(p => section(p, 'Account').getByRole('button', { name: 'Save Profile' })),
    ],
  },
  password: {
    guide: guide('password'),
    start: opener('settings-account'),
    steps: [
      {
        prepare: async p => {
          // A few characters, so the checklist shows rules met and rules still open.
          await typeInto(p, p.locator('#account-new-password'), 'Kyoto2026')
          await settle(p)
        },
        target: p => section(p, 'Change Password'),
      },
      only(p => section(p, 'Change Password').getByRole('button', { name: 'Update password' })),
    ],
    cleanup: async p => { await p.reload(); await settle(p) },
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
        // The whole panel: the codes and the Copy codes, Download TXT and Print / PDF buttons under them.
        target: p => subsection(p, 'Two-factor authentication (2FA)').getByText('Backup codes', { exact: true }).first().locator('xpath=../..'),
      },
    ],
  },
  passkeys: {
    guide: guide('passkeys'),
    start: opener('settings-account'),
    steps: [
      // A passkey needs a device prompt the run cannot answer, so this guide has no pictures.
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

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' })

const ALL_CONTEXTS = [settingsContext, ...settingsTabContexts]

/** Whether this file sideloaded a plugin for the Plugins tab and has to take it away again. */
let sideloadedPlugin = false

// The photo-provider sections exist only for providers the admin switched on, the ntfy,
// webhook and push cards only for channels the admin turned on, and the Plugins tab only
// while a plugin is active.
test.beforeAll(async ({ request }) => {
  const res = await request.put('/api/admin/addons/immich', { data: { enabled: true } })
  if (!res.ok()) throw new Error(`could not enable the Immich provider: ${res.status()} ${await res.text()}`)
  const channels = await request.put('/api/auth/app-settings', { data: { notification_channels: 'ntfy,webhook,push' } })
  if (!channels.ok()) throw new Error(`could not enable the notification channels: ${channels.status()} ${await channels.text()}`)
  sideloadedPlugin = await ensureActivePlugin(request)
})

test.afterAll(async ({ request }) => {
  if (sideloadedPlugin) await removeSideloadedPlugin(request)
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
