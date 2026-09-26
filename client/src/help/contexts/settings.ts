import type { HelpContext, HelpGuide } from '../types'

/**
 * Help for the user settings (`/settings`). The page is one route with tabs,
 * so every tab is a screen of its own under `settings`; the page anchors the
 * tab that is open. The step actions that produce the pictures live in
 * `e2e/help/settings.guide.ts`, keyed by the same ids.
 */

const SETTINGS = 'User-Settings'
const GENERAL = 'Display-Settings'
const APPEARANCE = 'Appearance-Settings'
const MAP = 'Map-Settings'
const NOTIFICATIONS = 'Notifications'
const OFFLINE = 'Offline-Mode-and-PWA'

const guide = (
  id: string, context: string, icon: HelpGuide['icon'], size: HelpGuide['size'], steps: number, tips: number,
  docs: HelpGuide['docs'], related: string[], result = true,
): HelpGuide => ({ id, context, icon, size, steps, tips, media: { steps: true, result }, docs, related })

export const settingsGuides: HelpGuide[] = [
  // General
  guide('language-region', 'settings-display', 'globe', 'quick', 2, 2, { slug: GENERAL, anchor: 'language' }, ['travel-map-prefs', 'startup'], false),
  guide('travel-map-prefs', 'settings-display', 'mapPin', 'quick', 2, 1, { slug: GENERAL, anchor: 'always-show-booking-routes' }, ['language-region', 'map-provider'], false),
  guide('startup', 'settings-display', 'compass', 'quick', 2, 1, { slug: GENERAL, anchor: 'start-page' }, ['language-region'], false),
  // Appearance
  guide('theme-scheme', 'settings-appearance', 'palette', 'guide', 3, 2, { slug: APPEARANCE }, ['readability', 'dashboard-widgets']),
  guide('readability', 'settings-appearance', 'eye', 'quick', 2, 2, { slug: APPEARANCE }, ['theme-scheme'], false),
  guide('dashboard-widgets', 'settings-appearance', 'layout', 'quick', 2, 2, { slug: APPEARANCE }, ['theme-scheme'], false),
  // Map
  guide('map-provider', 'settings-map', 'map', 'guide', 3, 2, { slug: MAP }, ['travel-map-prefs', 'map-compass'], false),
  // Notifications
  guide('notification-channels', 'settings-notifications', 'bell', 'guide', 3, 2, { slug: NOTIFICATIONS, anchor: 'notification-channels' }, [], false),
  // Integrations
  guide('photo-providers', 'settings-integrations', 'image', 'guide', 2, 2, { slug: 'Photo-Providers' }, ['api-keys'], false),
  guide('api-keys', 'settings-integrations', 'key', 'guide', 2, 2, { slug: SETTINGS, anchor: 'integrations-tab' }, ['mcp-oauth'], false),
  guide('mcp-oauth', 'settings-integrations', 'plug', 'guide', 3, 2, { slug: 'MCP-Setup' }, ['api-keys'], false),
  // Offline
  guide('offline-prepare', 'settings-offline', 'cloudOff', 'guide', 3, 2, { slug: OFFLINE, anchor: 'settings-offline' }, ['offline-conflicts'], false),
  guide('offline-conflicts', 'settings-offline', 'repeat', 'quick', 2, 1, { slug: OFFLINE, anchor: 'settings-offline' }, ['offline-prepare'], false),
  // Account
  guide('profile', 'settings-account', 'user', 'quick', 2, 1, { slug: SETTINGS, anchor: 'account-tab-summary' }, ['password'], false),
  guide('password', 'settings-account', 'lock', 'quick', 2, 1, { slug: SETTINGS, anchor: 'account-tab-summary' }, ['mfa'], false),
  guide('mfa', 'settings-account', 'shield', 'guide', 3, 2, { slug: 'Two-Factor-Authentication' }, ['passkeys', 'password']),
  // Passkeys only exist on https, which the media run is not: words only.
  { ...guide('passkeys', 'settings-account', 'fingerprint', 'quick', 2, 2, { slug: 'Passkeys' }, ['mfa'], false), media: { steps: false, result: false } },
  guide('delete-account', 'settings-account', 'trash', 'quick', 1, 2, { slug: SETTINGS, anchor: 'account-tab-summary' }, ['profile'], false),
]

const forContext = (id: string) => settingsGuides.filter(g => g.context === id).map(g => g.id)

export const settingsContext: HelpContext = {
  id: 'settings',
  route: '/settings',
  icon: 'sliders',
  bullets: 4,
  guides: [],
  docs: [{ slug: SETTINGS }, { slug: GENERAL }, { slug: APPEARANCE }],
  hero: true,
}

const tab = (id: string, icon: HelpContext['icon'], bullets: number, docs: HelpContext['docs']): HelpContext => ({
  id, parent: 'settings', route: `/settings?tab=${id.slice('settings-'.length)}`, icon, bullets, guides: forContext(id), docs, hero: true,
})

export const settingsTabContexts: HelpContext[] = [
  tab('settings-display', 'sliders', 3, [{ slug: GENERAL }]),
  tab('settings-appearance', 'palette', 4, [{ slug: APPEARANCE }]),
  tab('settings-map', 'map', 3, [{ slug: MAP }]),
  tab('settings-notifications', 'bell', 4, [{ slug: NOTIFICATIONS }]),
  tab('settings-integrations', 'plug', 4, [{ slug: SETTINGS, anchor: 'integrations-tab' }, { slug: 'MCP-Setup' }, { slug: 'Photo-Providers' }]),
  tab('settings-offline', 'cloudOff', 4, [{ slug: OFFLINE }]),
  tab('settings-account', 'user', 4, [{ slug: SETTINGS, anchor: 'account-tab-summary' }, { slug: 'Two-Factor-Authentication' }, { slug: 'Passkeys' }]),
]
