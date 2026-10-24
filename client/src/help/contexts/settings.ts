import type { HelpContext, HelpGuide } from '../types'

/**
 * Help for the user settings (`/settings`). The page is one route with tabs,
 * so every tab is a screen of its own under `settings`; the page anchors the
 * tab that is open (`settings-<tab>`, falling back to `settings`). The step
 * actions that produce the pictures live in `e2e/help/settings.guide.ts`,
 * keyed by the same ids.
 */

const SETTINGS = 'User-Settings'
const GENERAL = 'Display-Settings'
const APPEARANCE = 'Appearance-Settings'
const MAP = 'Map-Settings'
const NOTIFICATIONS = 'Notifications'
const OFFLINE = 'Offline-Mode-and-PWA'
const PLUGINS = 'Plugins'

/** What a guide's pictures are: every step and the result, the steps only, or words only. */
type Media = 'result' | 'steps' | 'none'

const guide = (
  id: string, context: string, icon: HelpGuide['icon'], size: HelpGuide['size'], steps: number, tips: number,
  docs: HelpGuide['docs'], related: string[], media: Media = 'steps',
): HelpGuide => ({
  id, context, icon, size, steps, tips, docs, related,
  media: { steps: media !== 'none', result: media === 'result' },
})

export const settingsGuides: HelpGuide[] = [
  // General, in the order of its cards: Startup, Language & region, Travel & map
  guide('startup', 'settings-display', 'compass', 'quick', 2, 2, { slug: GENERAL, anchor: 'start-page' }, ['language-region']),
  guide('language-region', 'settings-display', 'globe', 'quick', 3, 3, { slug: GENERAL, anchor: 'language' }, ['travel-map-prefs', 'startup']),
  guide('travel-map-prefs', 'settings-display', 'mapPin', 'quick', 3, 2, { slug: GENERAL, anchor: 'always-show-booking-routes' }, ['language-region', 'map-provider']),
  // Appearance
  guide('theme-scheme', 'settings-appearance', 'palette', 'guide', 3, 2, { slug: APPEARANCE, anchor: 'theme' }, ['readability', 'dashboard-widgets'], 'result'),
  guide('readability', 'settings-appearance', 'eye', 'quick', 2, 3, { slug: APPEARANCE, anchor: 'readability' }, ['theme-scheme']),
  guide('dashboard-widgets', 'settings-appearance', 'layout', 'quick', 3, 2, { slug: APPEARANCE, anchor: 'dashboard-widgets' }, ['theme-scheme']),
  // Map
  guide('map-provider', 'settings-map', 'map', 'guide', 3, 3, { slug: MAP, anchor: 'map-provider' }, ['travel-map-prefs', 'map-compass']),
  // Notifications
  guide('notification-channels', 'settings-notifications', 'bell', 'guide', 3, 2, { slug: NOTIFICATIONS, anchor: 'notification-channels' }, ['web-push-device']),
  guide('web-push-device', 'settings-notifications', 'bellRing', 'quick', 2, 3, { slug: NOTIFICATIONS, anchor: 'web-push' }, ['notification-channels']),
  // Integrations, in the order of the cards on the tab
  guide('photo-providers', 'settings-integrations', 'image', 'guide', 2, 2, { slug: 'Photo-Providers' }, ['api-keys']),
  guide('connect-airtrail', 'settings-integrations', 'plane', 'guide', 3, 2, undefined, ['airtrail-import'], 'result'),
  guide('connect-dawarich', 'settings-integrations', 'route', 'guide', 3, 2, { slug: 'Dawarich', anchor: 'setting-it-up' }, ['dawarich-stays', 'map-dawarich-trail', 'dawarich-countries'], 'result'),
  guide('tour-connect-wanderer', 'settings-integrations', 'mountain', 'guide', 3, 3, undefined, ['tour-wanderer-watch'], 'result'),
  guide('tour-wanderer-watch', 'settings-integrations', 'bellRing', 'quick', 2, 3, undefined, ['tour-connect-wanderer']),
  guide('api-keys', 'settings-integrations', 'key', 'guide', 2, 3, { slug: 'Public-API', anchor: 'getting-a-key' }, ['mcp-oauth']),
  guide('mcp-oauth', 'settings-integrations', 'plug', 'guide', 3, 3, { slug: 'MCP-Setup' }, ['api-keys']),
  // Plugins
  guide('plugin-settings', 'settings-plugins', 'blocks', 'quick', 2, 2, { slug: PLUGINS, anchor: 'plugin-settings-actions' }, ['install-plugin']),
  // Offline
  guide('offline-prepare', 'settings-offline', 'cloudOff', 'guide', 3, 2, { slug: OFFLINE, anchor: 'settings-offline' }, ['offline-conflicts']),
  guide('offline-conflicts', 'settings-offline', 'repeat', 'quick', 3, 2, { slug: OFFLINE, anchor: 'sync-conflicts' }, ['offline-prepare']),
  // Account
  guide('profile', 'settings-account', 'user', 'quick', 3, 1, { slug: SETTINGS, anchor: 'account-tab-summary' }, ['password']),
  guide('password', 'settings-account', 'lock', 'quick', 2, 1, { slug: SETTINGS, anchor: 'account-tab-summary' }, ['mfa']),
  guide('mfa', 'settings-account', 'shield', 'guide', 3, 2, { slug: 'Two-Factor-Authentication' }, ['passkeys', 'password'], 'result'),
  // A passkey needs a device prompt the media run cannot answer: words only.
  guide('passkeys', 'settings-account', 'fingerprint', 'quick', 2, 2, { slug: 'Passkeys' }, ['mfa'], 'none'),
  guide('delete-account', 'settings-account', 'trash', 'quick', 1, 2, { slug: SETTINGS, anchor: 'account-tab-summary' }, ['profile']),
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

// In the order of the sidebar.
export const settingsTabContexts: HelpContext[] = [
  tab('settings-display', 'sliders', 3, [{ slug: GENERAL }]),
  tab('settings-appearance', 'palette', 4, [{ slug: APPEARANCE }]),
  tab('settings-map', 'map', 3, [{ slug: MAP }]),
  tab('settings-notifications', 'bell', 4, [{ slug: NOTIFICATIONS }]),
  tab('settings-integrations', 'plug', 4, [{ slug: SETTINGS, anchor: 'integrations-tab' }, { slug: 'Photo-Providers' }, { slug: 'Dawarich' }, { slug: 'Public-API' }, { slug: 'MCP-Setup' }]),
  tab('settings-plugins', 'blocks', 3, [{ slug: PLUGINS }]),
  tab('settings-offline', 'cloudOff', 4, [{ slug: OFFLINE }]),
  tab('settings-account', 'user', 4, [{ slug: SETTINGS, anchor: 'account-tab-summary' }, { slug: 'Two-Factor-Authentication' }, { slug: 'Passkeys' }]),
  tab('settings-about', 'info', 3, [{ slug: SETTINGS }]),
]
