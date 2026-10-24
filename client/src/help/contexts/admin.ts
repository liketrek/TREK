import type { HelpContext, HelpGuide } from '../types'

/**
 * Help for the admin area (`/admin`): one route with tabs, so every tab is a
 * screen under `admin`, anchored by the page for the tab that is open. The
 * step actions that produce the pictures live in `e2e/help/admin.guide.ts`.
 */

const OVERVIEW = 'Admin-Panel-Overview'
const USERS = 'Admin-Users-and-Invites'
const DEFAULTS = 'Admin-User-Defaults'
const SETTINGS = 'Admin-Settings'
const ADDONS = 'Admin-Addons'
const CATEGORIES = 'Admin-Categories'
const PLUGINS = 'Admin-Plugins'
const STORAGE = 'Admin-Storage'
const NOTIFICATIONS = 'Notifications'
const ADMIN_NOTIFICATIONS = 'Admin-Notifications'
const BACKUP = 'Backups'
const MCP = 'Admin-MCP-Tokens'
const TEMPLATES = 'Admin-Packing-Templates'
const GITHUB = 'Admin-GitHub-Releases'

const guide = (
  id: string, context: string, icon: HelpGuide['icon'], size: HelpGuide['size'], steps: number, tips: number,
  docs: HelpGuide['docs'], related: string[], result = false,
): HelpGuide => ({ id, context, icon, size, steps, tips, media: { steps: true, result }, docs, related })

export const adminGuides: HelpGuide[] = [
  // Users
  guide('create-user', 'admin-users', 'userPlus', 'guide', 3, 2, { slug: USERS, anchor: 'creating-a-user-directly' }, ['edit-user', 'invite-links'], true),
  guide('edit-user', 'admin-users', 'pencil', 'quick', 2, 2, { slug: USERS, anchor: 'edit-a-user' }, ['create-user', 'delete-user']),
  guide('invite-links', 'admin-users', 'link', 'guide', 3, 2, { slug: USERS, anchor: 'invite-links' }, ['create-user'], true),
  guide('delete-user', 'admin-users', 'trash', 'quick', 1, 2, { slug: USERS, anchor: 'delete-a-user' }, ['edit-user']),
  guide('permissions', 'admin-users', 'sliders', 'quick', 2, 2, { slug: 'Admin-Permissions' }, ['edit-user']),
  // User Defaults
  guide('default-user-settings', 'admin-defaults', 'user', 'quick', 2, 2, { slug: DEFAULTS, anchor: 'default-user-settings' }, ['default-map']),
  guide('default-map', 'admin-defaults', 'map', 'guide', 3, 2, { slug: DEFAULTS, anchor: 'map' }, ['default-user-settings', 'own-routing-engine']),
  guide('own-routing-engine', 'admin-defaults', 'route', 'quick', 2, 2, { slug: DEFAULTS, anchor: 'own-routing-engine' }, ['default-map']),
  // Personalization
  guide('packing-templates', 'admin-config', 'library', 'guide', 3, 3, { slug: TEMPLATES }, ['categories'], true),
  guide('categories', 'admin-config', 'tags', 'quick', 2, 2, { slug: CATEGORIES }, ['packing-templates']),
  // Related across screens: the Vacay guide that switches these holidays on.
  guide('school-holiday-catalog', 'admin-config', 'graduationCap', 'quick', 2, 1, { slug: 'Vacay', anchor: 'manually-maintained-school-holidays' }, ['school-holidays', 'categories']),
  // Settings
  guide('auth-methods', 'admin-settings', 'lock', 'guide', 3, 2, { slug: SETTINGS, anchor: 'authentication-methods' }, ['oidc', 'admin-passkeys']),
  guide('admin-passkeys', 'admin-settings', 'fingerprint', 'quick', 2, 3, { slug: SETTINGS, anchor: 'passkey-login' }, ['auth-methods', 'passkeys']),
  guide('oidc', 'admin-settings', 'shield', 'guide', 2, 2, { slug: 'OIDC-SSO' }, ['auth-methods']),
  guide('instance-keys', 'admin-settings', 'key', 'guide', 3, 4, { slug: SETTINGS, anchor: 'api-keys' }, ['places-transit', 'default-map']),
  guide('places-transit', 'admin-settings', 'search', 'quick', 2, 2, { slug: SETTINGS, anchor: 'transit-provider' }, ['instance-keys']),
  guide('file-types', 'admin-settings', 'fileInput', 'quick', 1, 1, { slug: SETTINGS, anchor: 'allowed-file-types' }, ['storage-backends']),
  guide('rotate-jwt-secret', 'admin-settings', 'shield', 'quick', 2, 2, { slug: SETTINGS, anchor: 'danger-zone' }, ['edit-user', 'auth-methods']),
  // Addons
  guide('toggle-addon', 'admin-addons', 'sliders', 'quick', 2, 2, { slug: ADDONS }, ['install-plugin', 'document-providers']),
  guide('document-providers', 'admin-addons', 'plug', 'quick', 2, 2, { slug: 'Document-Sync', anchor: 'switching-stores-on' }, ['toggle-addon', 'files-sync']),
  // Plugins
  guide('install-plugin', 'admin-plugins', 'plug', 'guide', 3, 2, { slug: PLUGINS, anchor: 'installing-from-the-registry' }, ['toggle-addon']),
  // Storage
  guide('storage-backends', 'admin-storage', 'download', 'guide', 4, 3, { slug: STORAGE, anchor: 'backends' }, ['create-backup']),
  // Notifications
  guide('channels-instance', 'admin-notifications', 'bell', 'guide', 3, 3, { slug: ADMIN_NOTIFICATIONS, anchor: 'channels-for-users' }, ['notification-defaults', 'admin-channels']),
  guide('admin-channels', 'admin-notifications', 'bell', 'guide', 3, 2, { slug: ADMIN_NOTIFICATIONS, anchor: 'admin-alerts' }, ['channels-instance']),
  guide('notification-defaults', 'admin-notifications', 'sliders', 'quick', 2, 2, { slug: ADMIN_NOTIFICATIONS, anchor: 'defaults-for-users' }, ['channels-instance', 'notification-channels']),
  // MCP Access
  guide('mcp-tokens-admin', 'admin-mcp-tokens', 'key', 'quick', 2, 2, { slug: MCP }, ['auth-methods']),
  // GitHub
  guide('release-history', 'admin-github', 'bookOpen', 'quick', 2, 2, { slug: GITHUB }, ['create-backup']),
  // Backup
  guide('create-backup', 'admin-backup', 'archive', 'guide', 3, 2, { slug: BACKUP, anchor: 'manual-backup' }, ['auto-backup', 'storage-backends'], true),
  guide('auto-backup', 'admin-backup', 'repeat', 'quick', 2, 2, { slug: BACKUP, anchor: 'auto-backup' }, ['create-backup']),
  // Audit
  guide('audit-log', 'admin-audit', 'search', 'quick', 2, 2, { slug: 'Audit-Log' }, ['edit-user']),
]

const forContext = (id: string) => adminGuides.filter(g => g.context === id).map(g => g.id)

export const adminContext: HelpContext = {
  id: 'admin',
  route: '/admin',
  icon: 'shield',
  bullets: 5,
  guides: [],
  docs: [{ slug: OVERVIEW }, { slug: USERS }, { slug: SETTINGS }],
  hero: true,
}

const tab = (id: string, icon: HelpContext['icon'], bullets: number, docs: HelpContext['docs']): HelpContext => ({
  id, parent: 'admin', route: `/admin?tab=${id.slice('admin-'.length)}`, icon, bullets, guides: forContext(id), docs, hero: true,
})

export const adminTabContexts: HelpContext[] = [
  tab('admin-users', 'user', 4, [{ slug: USERS }, { slug: 'Admin-Permissions' }]),
  tab('admin-defaults', 'map', 3, [{ slug: DEFAULTS }]),
  tab('admin-config', 'sliders', 3, [{ slug: CATEGORIES }, { slug: TEMPLATES }]),
  tab('admin-settings', 'lock', 5, [{ slug: SETTINGS }, { slug: 'OIDC-SSO' }, { slug: 'Places-and-Search' }]),
  tab('admin-addons', 'plug', 3, [{ slug: ADDONS }]),
  tab('admin-plugins', 'plug', 3, [{ slug: PLUGINS }]),
  tab('admin-storage', 'download', 3, [{ slug: STORAGE }]),
  tab('admin-notifications', 'bell', 4, [{ slug: ADMIN_NOTIFICATIONS }, { slug: NOTIFICATIONS }]),
  tab('admin-mcp-tokens', 'key', 2, [{ slug: MCP }]),
  tab('admin-github', 'bookOpen', 3, [{ slug: GITHUB }, { slug: 'Updating' }]),
  tab('admin-backup', 'archive', 3, [{ slug: BACKUP }]),
  tab('admin-audit', 'search', 2, [{ slug: 'Audit-Log' }]),
]
