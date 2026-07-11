import type Database from 'better-sqlite3';
import { db } from '../db/database';
import { isSmtpConfigured } from './notifications';
import { listChannels, type ExternalChannel } from './notifications/channelRegistry';
// Side-effect import: populates the registry with email/webhook/ntfy. Safe from
// here — builtins only reaches ../notifications, which imports this module's
// types with `import type`, so there is no runtime cycle.
import './notifications/builtins';

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * A channel id. Open by design: the built-ins below plus `plugin:<id>` for any
 * plugin implementing the `notificationChannel` hook. The DB column is a bare
 * TEXT with no CHECK constraint and the Zod contract is already a string record,
 * so the set was only ever closed in TypeScript.
 */
export type NotifChannel = string;

export const INAPP_CHANNEL = 'inapp';

export type NotifEventType =
  | 'trip_invite'
  | 'booking_change'
  | 'trip_reminder'
  | 'todo_due'
  | 'vacay_invite'
  | 'collection_invite'
  | 'photos_shared'
  | 'collab_message'
  | 'packing_tagged'
  | 'version_available'
  | 'synology_session_cleared'
  | 'plugin_notification';

/** Every event, in the order the preferences UI lists them. */
export const ALL_EVENT_TYPES: NotifEventType[] = [
  'trip_invite',
  'booking_change',
  'trip_reminder',
  'todo_due',
  'vacay_invite',
  'collection_invite',
  'photos_shared',
  'collab_message',
  'packing_tagged',
  'version_available',
  'synology_session_cleared',
  'plugin_notification',
];

/** One channel column in the preferences matrix. */
export interface ChannelDescriptor {
  id: string;
  source: 'builtin' | 'plugin';
  /** Built-ins: an i18n key. */
  labelKey?: string;
  /** Plugin channels: a literal display name. */
  label?: string;
  /** Where the user sets their credentials for this channel, if anywhere. */
  settingsPath?: string;
  /** The admin has enabled this channel (in-app is always on). */
  active: boolean;
  /** This user has credentials for it. */
  configured: boolean;
}

/**
 * Channels implemented for an event. In-app takes everything; external channels
 * decide for themselves (today: everything except `synology_session_cleared`).
 */
export function combosFor(event: NotifEventType): NotifChannel[] {
  return [INAPP_CHANNEL, ...listChannels().filter(c => c.supportsEvent(event)).map(c => c.id)];
}

function allCombos(): Record<string, NotifChannel[]> {
  const out: Record<string, NotifChannel[]> = {};
  for (const event of ALL_EVENT_TYPES) out[event] = combosFor(event);
  return out;
}

/** Events that target admins only (shown in admin panel, not in user settings). */
export const ADMIN_SCOPED_EVENTS = new Set<NotifEventType>(['version_available']);

// ── Helpers ────────────────────────────────────────────────────────────────

function getAppSetting(key: string): string | null {
  return (db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined)?.value || null;
}

// ── Active channels (admin-configured) ────────────────────────────────────

/**
 * Which channels the admin has enabled, as ids.
 * Reads `notification_channels` (plural) with fallback to `notification_channel` (singular).
 *
 * BUILT-INS ONLY. A plugin channel is NOT gated on this list: a built-in always exists in
 * the code and so needs an explicit switch, but a plugin channel only exists because an
 * admin installed and enabled that plugin — that IS the opt-in. Requiring a second one
 * meant a plugin channel could never be turned on at all (nothing writes a `plugin:` id
 * into this CSV, and the admin toggle rebuilds it from the three built-in booleans, which
 * would silently drop any that were).
 */
export function getActiveChannels(): NotifChannel[] {
  const raw = getAppSetting('notification_channels') || getAppSetting('notification_channel') || 'none';
  if (raw === 'none') return [];
  const builtins = new Set(listChannels().filter(c => c.source === 'builtin').map(c => c.id));
  return raw.split(',').map(c => c.trim()).filter(c => builtins.has(c));
}

/** Is this channel switched on? Plugin channels are on by virtue of being live. */
export function isChannelActive(channel: ExternalChannel): boolean {
  return channel.source === 'plugin' || getActiveChannels().includes(channel.id);
}

// ── Per-user preference checks ─────────────────────────────────────────────

/**
 * Returns true if the user has this event+channel enabled.
 * Default (no row) = enabled. Only returns false if there's an explicit disabled row.
 */
export function isEnabledForEvent(userId: number, eventType: NotifEventType, channel: NotifChannel): boolean {
  const row = db.prepare(
    'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?'
  ).get(userId, eventType, channel) as { enabled: number } | undefined;
  return row === undefined || row.enabled === 1;
}

// ── Preferences matrix ─────────────────────────────────────────────────────

export interface PreferencesMatrix {
  preferences: Partial<Record<NotifEventType, Partial<Record<NotifChannel, boolean>>>>;
  /** The columns to render, in order. Replaces the old fixed-shape available_channels. */
  channels: ChannelDescriptor[];
  event_types: NotifEventType[];
  implemented_combos: Record<string, NotifChannel[]>;
  defaults?: { ntfyServer: string | null };
}

/** The in-app pseudo-channel — always active, never configurable. */
function inAppDescriptor(): ChannelDescriptor {
  return {
    id: INAPP_CHANNEL,
    source: 'builtin',
    labelKey: 'settings.notificationPreferences.inapp',
    active: true,
    configured: true,
  };
}

/**
 * The channel columns for a scope.
 * scope='user'  — a column per channel the admin turned on in `notification_channels`.
 * scope='admin' — a column per channel that has admin-global credentials.
 */
function describeChannels(userId: number, scope: 'user' | 'admin'): ChannelDescriptor[] {
  const out: ChannelDescriptor[] = [inAppDescriptor()];

  if (scope === 'admin') {
    // Admin-scoped events go out over the admin's own global credentials, which
    // are independent of the per-user `notification_channels` toggle.
    const hasSmtp = isSmtpConfigured();
    const hasAdminWebhook = !!getAppSetting('admin_webhook_url');
    const hasAdminNtfy = !!getAppSetting('admin_ntfy_topic');
    const adminActive: Record<string, boolean> = { email: hasSmtp, webhook: hasAdminWebhook, ntfy: hasAdminNtfy };
    for (const channel of listChannels()) {
      // Plugin channels are user-scoped only — they never carry admin-global events.
      if (channel.source !== 'builtin') continue;
      const active = adminActive[channel.id] ?? false;
      out.push({
        id: channel.id,
        source: channel.source,
        labelKey: channel.labelKey,
        label: channel.label,
        active,
        configured: active,
      });
    }
    return out;
  }

  for (const channel of listChannels()) {
    out.push({
      id: channel.id,
      source: channel.source,
      labelKey: channel.labelKey,
      label: channel.label,
      settingsPath: channel.settingsPath,
      // A live plugin channel is always a column. `configured` tells the user whether
      // they still need to enter credentials — it does not hide the channel from them.
      active: isChannelActive(channel),
      configured: channel.isConfiguredFor(userId),
    });
  }
  return out;
}

/**
 * Returns the preferences matrix for a user.
 * scope='user'  — excludes admin-scoped events (for user settings page)
 * scope='admin' — returns only admin-scoped events (for admin notifications tab)
 */
export function getPreferencesMatrix(userId: number, userRole: string, scope: 'user' | 'admin' = 'user'): PreferencesMatrix {
  const rows = db.prepare(
    'SELECT event_type, channel, enabled FROM notification_channel_preferences WHERE user_id = ?'
  ).all(userId) as Array<{ event_type: string; channel: string; enabled: number }>;

  // Build a lookup from stored rows
  const stored: Partial<Record<string, Partial<Record<string, boolean>>>> = {};
  for (const row of rows) {
    if (!stored[row.event_type]) stored[row.event_type] = {};
    stored[row.event_type]![row.channel] = row.enabled === 1;
  }

  const implemented_combos = allCombos();

  // Build the full matrix with defaults (true when no row exists)
  const preferences: Partial<Record<NotifEventType, Partial<Record<NotifChannel, boolean>>>> = {};

  for (const eventType of ALL_EVENT_TYPES) {
    preferences[eventType] = {};
    for (const channel of implemented_combos[eventType]) {
      // Admin-scoped events use global settings for the built-in external channels
      if (scope === 'admin' && ADMIN_SCOPED_EVENTS.has(eventType) && isAdminGlobalChannel(channel)) {
        preferences[eventType]![channel] = getAdminGlobalPref(eventType, channel);
      } else {
        preferences[eventType]![channel] = stored[eventType]?.[channel] ?? true;
      }
    }
  }

  // Filter event types by scope
  const event_types = scope === 'admin'
    ? ALL_EVENT_TYPES.filter(e => ADMIN_SCOPED_EVENTS.has(e))
    : ALL_EVENT_TYPES.filter(e => !ADMIN_SCOPED_EVENTS.has(e));

  return {
    preferences,
    channels: describeChannels(userId, scope),
    event_types,
    implemented_combos,
    ...(scope === 'user' && { defaults: { ntfyServer: getAppSetting('admin_ntfy_server') || null } }),
  };
}

// ── Admin global preferences (stored in app_settings) ─────────────────────

/**
 * Channels whose admin-scoped preference is global (app_settings) rather than
 * per-user. Built-ins only: plugin channels are user-scoped and never carry
 * admin-scoped events.
 */
const ADMIN_GLOBAL_CHANNELS = ['email', 'webhook', 'ntfy'] as const;
export type AdminGlobalChannel = (typeof ADMIN_GLOBAL_CHANNELS)[number];

export function isAdminGlobalChannel(channel: string): channel is AdminGlobalChannel {
  return (ADMIN_GLOBAL_CHANNELS as readonly string[]).includes(channel);
}

/**
 * Returns the global admin preference for an event+channel.
 * Stored in app_settings as `admin_notif_pref_{event}_{channel}`.
 * Defaults to true (enabled) when no row exists.
 */
export function getAdminGlobalPref(event: NotifEventType, channel: AdminGlobalChannel): boolean {
  const val = getAppSetting(`admin_notif_pref_${event}_${channel}`);
  return val !== '0';
}

function setAdminGlobalPref(event: NotifEventType, channel: AdminGlobalChannel, enabled: boolean): void {
  db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(
    `admin_notif_pref_${event}_${channel}`,
    enabled ? '1' : '0'
  );
}

// ── Preferences update ─────────────────────────────────────────────────────

// ── Shared helper for per-user channel preference upserts ─────────────────

function applyUserChannelPrefs(
  userId: number,
  prefs: Partial<Record<string, Partial<Record<string, boolean>>>>,
  upsert: Database.Statement<unknown[]>,
  del: Database.Statement<unknown[]>
): void {
  for (const [eventType, channels] of Object.entries(prefs)) {
    if (!channels) continue;
    for (const [channel, enabled] of Object.entries(channels)) {
      if (enabled) {
        // Remove explicit row — default is enabled
        del.run(userId, eventType, channel);
      } else {
        upsert.run(userId, eventType, channel, 0);
      }
    }
  }
}

/**
 * Bulk-update preferences from the matrix UI.
 * Inserts disabled rows (enabled=0) and removes rows that are enabled (default).
 */
export function setPreferences(
  userId: number,
  prefs: Partial<Record<string, Partial<Record<string, boolean>>>>
): void {
  const upsert = db.prepare(
    'INSERT OR REPLACE INTO notification_channel_preferences (user_id, event_type, channel, enabled) VALUES (?, ?, ?, ?)'
  );
  const del = db.prepare(
    'DELETE FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?'
  );
  db.transaction(() => applyUserChannelPrefs(userId, prefs, upsert, del))();
}

/**
 * Bulk-update admin notification preferences.
 * email/webhook channels are stored globally in app_settings (not per-user).
 * inapp channel remains per-user in notification_channel_preferences.
 */
export function setAdminPreferences(
  userId: number,
  prefs: Partial<Record<string, Partial<Record<string, boolean>>>>
): void {
  const upsert = db.prepare(
    'INSERT OR REPLACE INTO notification_channel_preferences (user_id, event_type, channel, enabled) VALUES (?, ?, ?, ?)'
  );
  const del = db.prepare(
    'DELETE FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?'
  );

  // Split global (email/webhook) from per-user (inapp) prefs
  const globalPrefs: Partial<Record<string, Partial<Record<string, boolean>>>> = {};
  const userPrefs: Partial<Record<string, Partial<Record<string, boolean>>>> = {};

  for (const [eventType, channels] of Object.entries(prefs)) {
    if (!channels) continue;
    for (const [channel, enabled] of Object.entries(channels)) {
      if (isAdminGlobalChannel(channel)) {
        if (!globalPrefs[eventType]) globalPrefs[eventType] = {};
        globalPrefs[eventType]![channel] = enabled;
      } else {
        if (!userPrefs[eventType]) userPrefs[eventType] = {};
        userPrefs[eventType]![channel] = enabled;
      }
    }
  }

  // Apply global prefs outside the transaction (they write to app_settings)
  for (const [eventType, channels] of Object.entries(globalPrefs)) {
    if (!channels) continue;
    for (const [channel, enabled] of Object.entries(channels)) {
      if (!isAdminGlobalChannel(channel)) continue;
      setAdminGlobalPref(eventType as NotifEventType, channel, enabled);
    }
  }

  // Apply per-user (inapp) prefs in a transaction
  db.transaction(() => applyUserChannelPrefs(userId, userPrefs, upsert, del))();
}

// ── SMTP availability helper (for authService) ─────────────────────────────
// Lives in ./notifications now (the module that owns SMTP config); re-exported
// here so existing importers keep working.

export { isSmtpConfigured };

export function isWebhookConfigured(): boolean {
  return getActiveChannels().includes('webhook');
}
