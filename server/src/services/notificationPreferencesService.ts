import type Database from 'better-sqlite3';
import { db } from '../db/database';
import { decrypt_api_key } from './apiKeyCrypto';

// ── Types ──────────────────────────────────────────────────────────────────

export type NotifChannel = 'email' | 'webhook' | 'inapp' | 'ntfy';

export type NotifEventType =
  | 'trip_invite'
  | 'booking_change'
  | 'trip_reminder'
  | 'todo_due'
  | 'vacay_invite'
  | 'photos_shared'
  | 'collab_message'
  | 'packing_tagged'
  | 'version_available'
  | 'synology_session_cleared';

export interface AvailableChannels {
  email: boolean;
  webhook: boolean;
  inapp: boolean;
  ntfy: boolean;
}

// Which channels are implemented for each event type.
// Only implemented combos show toggles in the user preferences UI.
const IMPLEMENTED_COMBOS: Record<NotifEventType, NotifChannel[]> = {
  trip_invite:       ['inapp', 'email', 'webhook', 'ntfy'],
  booking_change:    ['inapp', 'email', 'webhook', 'ntfy'],
  trip_reminder:     ['inapp', 'email', 'webhook', 'ntfy'],
  todo_due:          ['inapp', 'email', 'webhook', 'ntfy'],
  vacay_invite:      ['inapp', 'email', 'webhook', 'ntfy'],
  photos_shared:     ['inapp', 'email', 'webhook', 'ntfy'],
  collab_message:    ['inapp', 'email', 'webhook', 'ntfy'],
  packing_tagged:    ['inapp', 'email', 'webhook', 'ntfy'],
  version_available: ['inapp', 'email', 'webhook', 'ntfy'],
  synology_session_cleared: ['inapp'],
};

/** Events that target admins only (shown in admin panel, not in user settings). */
export const ADMIN_SCOPED_EVENTS = new Set<NotifEventType>(['version_available']);

// ── Helpers ────────────────────────────────────────────────────────────────

function getAppSetting(key: string): string | null {
  return (db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined)?.value || null;
}

// ── Active channels (admin-configured) ────────────────────────────────────

/**
 * Returns which channels the admin has enabled (email and/or webhook).
 * Reads `notification_channels` (plural) with fallback to `notification_channel` (singular).
 * In-app is always considered active at the service level.
 */
export function getActiveChannels(): NotifChannel[] {
  const raw = getAppSetting('notification_channels') || getAppSetting('notification_channel') || 'none';
  if (raw === 'none') return [];
  return raw.split(',').map(c => c.trim()).filter((c): c is NotifChannel => c === 'email' || c === 'webhook' || c === 'ntfy');
}

/**
 * Returns which channels are configured (have valid credentials/URLs set).
 * In-app is always available. Email/webhook depend on configuration.
 */
export function getAvailableChannels(): AvailableChannels {
  const hasSmtp = !!(process.env.SMTP_HOST || getAppSetting('smtp_host'));
  const activeChannels = getActiveChannels();
  return { email: hasSmtp, webhook: activeChannels.includes('webhook'), ntfy: activeChannels.includes('ntfy'), inapp: true };
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
  available_channels: AvailableChannels;
  event_types: NotifEventType[];
  implemented_combos: Record<NotifEventType, NotifChannel[]>;
  defaults?: { ntfyServer: string | null };
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

  // Build the full matrix with defaults (true when no row exists)
  const preferences: Partial<Record<NotifEventType, Partial<Record<NotifChannel, boolean>>>> = {};
  const allEvents = Object.keys(IMPLEMENTED_COMBOS) as NotifEventType[];

  for (const eventType of allEvents) {
    const channels = IMPLEMENTED_COMBOS[eventType];
    preferences[eventType] = {};
    for (const channel of channels) {
      // Admin-scoped events use global settings for email/webhook/ntfy
      if (scope === 'admin' && ADMIN_SCOPED_EVENTS.has(eventType) && (channel === 'email' || channel === 'webhook' || channel === 'ntfy')) {
        preferences[eventType]![channel] = getAdminGlobalPref(eventType, channel);
      } else {
        preferences[eventType]![channel] = stored[eventType]?.[channel] ?? true;
      }
    }
  }

  // Filter event types by scope
  const event_types = scope === 'admin'
    ? allEvents.filter(e => ADMIN_SCOPED_EVENTS.has(e))
    : allEvents.filter(e => !ADMIN_SCOPED_EVENTS.has(e));

  // Available channels depend on scope
  let available_channels: AvailableChannels;
  if (scope === 'admin') {
    const hasSmtp = !!(process.env.SMTP_HOST || getAppSetting('smtp_host'));
    const hasAdminWebhook = !!(getAppSetting('admin_webhook_url'));
    const hasAdminNtfy = !!(getAppSetting('admin_ntfy_topic'));
    available_channels = { email: hasSmtp, webhook: hasAdminWebhook, ntfy: hasAdminNtfy, inapp: true };
  } else {
    const activeChannels = getActiveChannels();
    available_channels = {
      email: activeChannels.includes('email'),
      webhook: activeChannels.includes('webhook'),
      ntfy: activeChannels.includes('ntfy'),
      inapp: true,
    };
  }

  return {
    preferences,
    available_channels,
    event_types,
    implemented_combos: IMPLEMENTED_COMBOS,
    ...(scope === 'user' && { defaults: { ntfyServer: getAppSetting('admin_ntfy_server') || null } }),
  };
}

// ── Admin global preferences (stored in app_settings) ─────────────────────

const ADMIN_GLOBAL_CHANNELS: NotifChannel[] = ['email', 'webhook', 'ntfy'];

/**
 * Returns the global admin preference for an event+channel.
 * Stored in app_settings as `admin_notif_pref_{event}_{channel}`.
 * Defaults to true (enabled) when no row exists.
 */
export function getAdminGlobalPref(event: NotifEventType, channel: 'email' | 'webhook' | 'ntfy'): boolean {
  const val = getAppSetting(`admin_notif_pref_${event}_${channel}`);
  return val !== '0';
}

function setAdminGlobalPref(event: NotifEventType, channel: 'email' | 'webhook' | 'ntfy', enabled: boolean): void {
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
      if (ADMIN_GLOBAL_CHANNELS.includes(channel as NotifChannel)) {
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
      setAdminGlobalPref(eventType as NotifEventType, channel as 'email' | 'webhook' | 'ntfy', enabled);
    }
  }

  // Apply per-user (inapp) prefs in a transaction
  db.transaction(() => applyUserChannelPrefs(userId, userPrefs, upsert, del))();
}

// ── SMTP availability helper (for authService) ─────────────────────────────

export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST || getAppSetting('smtp_host'));
}

export function isWebhookConfigured(): boolean {
  return getActiveChannels().includes('webhook');
}
