import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { MailerService } from './mailer/mailer.service';
import { listChannels } from './channel-registry';
import {
  ADMIN_SCOPED_EVENTS,
  ALL_EVENT_TYPES,
  INAPP_CHANNEL,
  isAdminGlobalChannel,
  type AdminGlobalChannel,
  type ChannelDescriptor,
  type ExternalChannel,
  type NotifChannel,
  type NotifEventType,
} from './notification-events';

export interface PreferencesMatrix {
  preferences: Partial<Record<NotifEventType, Partial<Record<NotifChannel, boolean>>>>;
  /** The columns to render, in order. Replaces the old fixed-shape available_channels. */
  channels: ChannelDescriptor[];
  event_types: NotifEventType[];
  implemented_combos: Record<string, NotifChannel[]>;
  defaults?: { ntfyServer: string | null };
}

/**
 * Who gets which notification over which channel: the admin's channel switches,
 * the per-user event opt-outs, and the matrix the settings UI renders.
 *
 * It reads the live channel set from the registry but never sends anything —
 * the dispatch loop in NotificationsService applies what is decided here.
 */
@Injectable()
export class NotificationPreferencesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly mailer: MailerService,
  ) {}

  private getAppSetting(key: string): string | null {
    return this.db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', key)?.value || null;
  }

  /**
   * Channels implemented for an event. In-app takes everything; external channels
   * decide for themselves (today: everything except `synology_session_cleared`).
   */
  combosFor(event: NotifEventType): NotifChannel[] {
    return [INAPP_CHANNEL, ...listChannels().filter(c => c.supportsEvent(event)).map(c => c.id)];
  }

  private allCombos(): Record<string, NotifChannel[]> {
    const out: Record<string, NotifChannel[]> = {};
    for (const event of ALL_EVENT_TYPES) out[event] = this.combosFor(event);
    return out;
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
  getActiveChannels(): NotifChannel[] {
    const raw = this.getAppSetting('notification_channels') || this.getAppSetting('notification_channel') || 'none';
    if (raw === 'none') return [];
    const builtins = new Set(listChannels().filter(c => c.source === 'builtin').map(c => c.id));
    return raw.split(',').map(c => c.trim()).filter(c => builtins.has(c));
  }

  /** Is this channel switched on? Plugin channels are on by virtue of being live. */
  isChannelActive(channel: ExternalChannel): boolean {
    return channel.source === 'plugin' || this.getActiveChannels().includes(channel.id);
  }

  // ── Per-user preference checks ─────────────────────────────────────────────

  /**
   * Returns true if the user has this event+channel enabled.
   * Default (no row) = enabled. Only returns false if there's an explicit disabled row.
   */
  isEnabledForEvent(userId: number, eventType: NotifEventType, channel: NotifChannel): boolean {
    const row = this.db.get<{ enabled: number }>(
      'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?',
      userId, eventType, channel,
    );
    return row === undefined || row.enabled === 1;
  }

  // ── Preferences matrix ─────────────────────────────────────────────────────

  /** The in-app pseudo-channel — always active, never configurable. */
  private inAppDescriptor(): ChannelDescriptor {
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
  private describeChannels(userId: number, scope: 'user' | 'admin'): ChannelDescriptor[] {
    const out: ChannelDescriptor[] = [this.inAppDescriptor()];

    if (scope === 'admin') {
      // Admin-scoped events go out over the admin's own global credentials, which
      // are independent of the per-user `notification_channels` toggle.
      const hasSmtp = this.mailer.isSmtpConfigured();
      const hasAdminWebhook = !!this.getAppSetting('admin_webhook_url');
      const hasAdminNtfy = !!this.getAppSetting('admin_ntfy_topic');
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
        active: this.isChannelActive(channel),
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
  getPreferencesMatrix(userId: number, userRole: string, scope: 'user' | 'admin' = 'user'): PreferencesMatrix {
    const rows = this.db.all<{ event_type: string; channel: string; enabled: number }>(
      'SELECT event_type, channel, enabled FROM notification_channel_preferences WHERE user_id = ?', userId,
    );

    // Build a lookup from stored rows
    const stored: Partial<Record<string, Partial<Record<string, boolean>>>> = {};
    for (const row of rows) {
      if (!stored[row.event_type]) stored[row.event_type] = {};
      stored[row.event_type]![row.channel] = row.enabled === 1;
    }

    const implemented_combos = this.allCombos();

    // Build the full matrix with defaults (true when no row exists)
    const preferences: Partial<Record<NotifEventType, Partial<Record<NotifChannel, boolean>>>> = {};

    for (const eventType of ALL_EVENT_TYPES) {
      preferences[eventType] = {};
      for (const channel of implemented_combos[eventType]) {
        // Admin-scoped events use global settings for the built-in external channels
        if (scope === 'admin' && ADMIN_SCOPED_EVENTS.has(eventType) && isAdminGlobalChannel(channel)) {
          preferences[eventType]![channel] = this.getAdminGlobalPref(eventType, channel);
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
      channels: this.describeChannels(userId, scope),
      event_types,
      implemented_combos,
      ...(scope === 'user' && { defaults: { ntfyServer: this.getAppSetting('admin_ntfy_server') || null } }),
    };
  }

  // ── Admin global preferences (stored in app_settings) ─────────────────────

  /**
   * Returns the global admin preference for an event+channel.
   * Stored in app_settings as `admin_notif_pref_{event}_{channel}`.
   * Defaults to true (enabled) when no row exists.
   */
  getAdminGlobalPref(event: NotifEventType, channel: AdminGlobalChannel): boolean {
    const val = this.getAppSetting(`admin_notif_pref_${event}_${channel}`);
    return val !== '0';
  }

  private setAdminGlobalPref(event: NotifEventType, channel: AdminGlobalChannel, enabled: boolean): void {
    this.db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
      `admin_notif_pref_${event}_${channel}`,
      enabled ? '1' : '0',
    );
  }

  // ── Preferences update ─────────────────────────────────────────────────────

  /** Shared helper for per-user channel preference upserts. */
  private applyUserChannelPrefs(
    userId: number,
    prefs: Partial<Record<string, Partial<Record<string, boolean>>>>,
  ): void {
    const upsert = this.db.prepare(
      'INSERT OR REPLACE INTO notification_channel_preferences (user_id, event_type, channel, enabled) VALUES (?, ?, ?, ?)'
    );
    const del = this.db.prepare(
      'DELETE FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?'
    );
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
  setPreferences(
    userId: number,
    prefs: Partial<Record<string, Partial<Record<string, boolean>>>>
  ): void {
    this.db.transaction(() => this.applyUserChannelPrefs(userId, prefs));
  }

  /**
   * Bulk-update admin notification preferences.
   * email/webhook channels are stored globally in app_settings (not per-user).
   * inapp channel remains per-user in notification_channel_preferences.
   */
  setAdminPreferences(
    userId: number,
    prefs: Partial<Record<string, Partial<Record<string, boolean>>>>
  ): void {
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
        this.setAdminGlobalPref(eventType as NotifEventType, channel, enabled);
      }
    }

    // Apply per-user (inapp) prefs in a transaction
    this.db.transaction(() => this.applyUserChannelPrefs(userId, userPrefs));
  }

  // ── Instance-level readiness ──────────────────────────────────────────────

  /** SMTP set up at all? Kept here because the settings UI asks preferences, not the mailer. */
  isSmtpConfigured(): boolean {
    return this.mailer.isSmtpConfigured();
  }

  isWebhookConfigured(): boolean {
    return this.getActiveChannels().includes('webhook');
  }
}
