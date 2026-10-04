import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { NOTIFICATION_DEFAULTS, type NotificationDefault } from '@trek/shared';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { NotificationChannelPreferences } from '../../db/entities/NotificationChannelPreferences.entity';
import type { NotificationChannelPreferencesRepository } from '../../db/repositories/NotificationChannelPreferences.repository';
import { UnitOfWork } from '../database/unit-of-work';
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
  /** Cells the admin switched off for everyone (#1536), event → channels. User scope only. */
  locked?: Partial<Record<NotifEventType, NotifChannel[]>>;
}

/** The admin's per-cell defaults for user notifications, with the matrix to draw them in (#1536). */
export interface InstanceDefaultsMatrix {
  defaults: Partial<Record<NotifEventType, Partial<Record<NotifChannel, NotificationDefault>>>>;
  channels: ChannelDescriptor[];
  event_types: NotifEventType[];
  implemented_combos: Record<string, NotifChannel[]>;
}

const DEFAULT_KEY = (event: string, channel: string) => `notif_default_${event}_${channel}`;

/**
 * Who gets which notification over which channel: the admin's channel switches,
 * the per-user event opt-outs, and the matrix the settings UI renders.
 *
 * It reads the live channel set from the registry but never sends anything —
 * the dispatch loop in NotificationsService applies what is decided here.
 *
 * DI-native (Plan 3f Task 3): the `SELECT value FROM app_settings WHERE
 * key = ?`/`INSERT OR REPLACE INTO app_settings ...` reads/writes (NP1/NP4)
 * moved onto the shared `AppSettingsRepository.getValue`/`.setValue` pair
 * (already built, Plan 3a) rather than a new method — this is the first of
 * six identical `app_settings` single-key sites in this cluster to converge
 * on it (plan3f-sql-inventory.md §15 surprise 8). `notification_channel_preferences`'s
 * reads/writes (NP2/NP3/NP5/NP6) go through `NotificationChannelPreferencesRepository`,
 * whose `upsertPreference`/`deletePreference` target the table's genuine
 * 3-column composite primary key (`user`, `event_type`, `channel`) via
 * `em.upsert({ onConflictFields: [...] })`, per Task 0's R5 pin.
 */
@Injectable()
export class NotificationPreferencesService {
  constructor(
    private readonly mailer: MailerService,
    private readonly uow: UnitOfWork,
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    @InjectRepository(NotificationChannelPreferences) private readonly channelPrefs: NotificationChannelPreferencesRepository,
  ) {}

  /**
   * Channels implemented for an event. In-app takes everything; external channels
   * decide for themselves (today: everything except `synology_session_cleared`).
   */
  async combosFor(event: NotifEventType): Promise<NotifChannel[]> {
    return [INAPP_CHANNEL, ...(await listChannels()).filter(c => c.supportsEvent(event)).map(c => c.id)];
  }

  private async allCombos(): Promise<Record<string, NotifChannel[]>> {
    const out: Record<string, NotifChannel[]> = {};
    for (const event of ALL_EVENT_TYPES) out[event] = await this.combosFor(event);
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
  async getActiveChannels(): Promise<NotifChannel[]> {
    const raw = (await this.appSettings.getValue('notification_channels')) || (await this.appSettings.getValue('notification_channel')) || 'none';
    if (raw === 'none') return [];
    const builtins = new Set((await listChannels()).filter(c => c.source === 'builtin').map(c => c.id));
    return raw.split(',').map(c => c.trim()).filter(c => builtins.has(c));
  }

  /** Is this channel switched on? Plugin channels are on by virtue of being live. */
  async isChannelActive(channel: ExternalChannel): Promise<boolean> {
    return channel.source === 'plugin' || (await this.getActiveChannels()).includes(channel.id);
  }

  /**
   * Is the channel offered to users at all right now? Switched on, and for a
   * channel that says so, ready on this instance too: Web Push without a usable
   * key pair is off for everyone, whatever the admin switch says.
   */
  private async isChannelOffered(channel: ExternalChannel): Promise<boolean> {
    if (!(await this.isChannelActive(channel))) return false;
    return !channel.hiddenWhileInstanceUnconfigured || (await channel.isInstanceConfigured?.()) !== false;
  }

  // ── Per-user preference checks ─────────────────────────────────────────────

  /**
   * Returns true if the user has this event+channel enabled.
   * Default (no row) = enabled. Only returns false if there's an explicit disabled row.
   */
  async isEnabledForEvent(userId: number, eventType: NotifEventType, channel: NotifChannel): Promise<boolean> {
    const fallback = await this.instanceDefault(eventType, channel);
    if (fallback === 'blocked') return false;
    const row = await this.channelPrefs.findEnabled(userId, eventType, channel);
    return row === null ? fallback === 'on' : row.enabled === 1;
  }

  // ── Instance defaults (#1536) ──────────────────────────────────────────────

  /**
   * What a cell is for a user who never touched it. Admin-scoped events keep
   * their own global switches and are never affected; an unknown stored value
   * means the old behaviour, on.
   */
  async instanceDefault(eventType: NotifEventType, channel: NotifChannel): Promise<NotificationDefault> {
    if (ADMIN_SCOPED_EVENTS.has(eventType)) return 'on';
    const raw = await this.appSettings.getValue(DEFAULT_KEY(eventType, channel));
    return (NOTIFICATION_DEFAULTS as readonly string[]).includes(raw ?? '') ? (raw as NotificationDefault) : 'on';
  }

  private userEventTypes(): NotifEventType[] {
    return ALL_EVENT_TYPES.filter(e => !ADMIN_SCOPED_EVENTS.has(e));
  }

  async getInstanceDefaults(adminId: number): Promise<InstanceDefaultsMatrix> {
    const event_types = this.userEventTypes();
    const implemented_combos = await this.allCombos();
    const defaults: InstanceDefaultsMatrix['defaults'] = {};
    for (const event of event_types) {
      defaults[event] = {};
      for (const channel of implemented_combos[event]) defaults[event]![channel] = await this.instanceDefault(event, channel);
    }
    return { defaults, channels: await this.describeChannels(adminId, 'user'), event_types, implemented_combos };
  }

  /** Stores the cells given; `on` removes the row, so the table only holds what differs. Unknown cells are skipped. */
  async setInstanceDefaults(defaults: Partial<Record<string, Partial<Record<string, NotificationDefault>>>>): Promise<void> {
    const userEvents = new Set<string>(this.userEventTypes());
    // The channel set is read before the transaction opens: listChannels() may
    // ask the plugin runtime, which is no work to hold the connection for.
    const combos = await this.allCombos();
    await this.uow.transactional(async () => {
      for (const [event, channels] of Object.entries(defaults)) {
        if (!userEvents.has(event) || !channels) continue;
        const allowed = new Set(combos[event] ?? []);
        for (const [channel, value] of Object.entries(channels)) {
          if (!allowed.has(channel) || !value) continue;
          // `DELETE FROM app_settings WHERE key = ?` / `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`
          if (value === 'on') await this.appSettings.deleteValue(DEFAULT_KEY(event, channel));
          else await this.appSettings.upsertOrReplace(DEFAULT_KEY(event, channel), value);
        }
      }
    });
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
  private async describeChannels(userId: number, scope: 'user' | 'admin'): Promise<ChannelDescriptor[]> {
    const out: ChannelDescriptor[] = [this.inAppDescriptor()];

    if (scope === 'admin') {
      // Admin-scoped events go out over the admin's own global credentials, which
      // are independent of the per-user `notification_channels` toggle.
      const hasSmtp = await this.mailer.isSmtpConfigured();
      const hasAdminWebhook = !!(await this.appSettings.getValue('admin_webhook_url'));
      const hasAdminNtfy = !!(await this.appSettings.getValue('admin_ntfy_topic'));
      const adminActive: Record<string, boolean> = { email: hasSmtp, webhook: hasAdminWebhook, ntfy: hasAdminNtfy };
      for (const channel of await listChannels()) {
        // Only the channels with an admin-global copy. Plugin channels and push are
        // user-scoped: they never carry an admin-scoped event, so a column for them
        // here could never be switched on.
        if (channel.source !== 'builtin' || !isAdminGlobalChannel(channel.id)) continue;
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

    for (const channel of await listChannels()) {
      out.push({
        id: channel.id,
        source: channel.source,
        labelKey: channel.labelKey,
        label: channel.label,
        settingsPath: channel.settingsPath,
        // A live plugin channel is always a column. `configured` tells the user whether
        // they still need to enter credentials — it does not hide the channel from them.
        active: await this.isChannelOffered(channel),
        configured: await channel.isConfiguredFor(userId),
      });
    }
    return out;
  }

  /**
   * Returns the preferences matrix for a user.
   * scope='user'  — excludes admin-scoped events (for user settings page)
   * scope='admin' — returns only admin-scoped events (for admin notifications tab)
   */
  async getPreferencesMatrix(userId: number, userRole: string, scope: 'user' | 'admin' = 'user'): Promise<PreferencesMatrix> {
    const rows = await this.channelPrefs.listForUser(userId);

    // Build a lookup from stored rows
    const stored: Partial<Record<string, Partial<Record<string, boolean>>>> = {};
    for (const row of rows) {
      if (!stored[row.event_type]) stored[row.event_type] = {};
      stored[row.event_type]![row.channel] = row.enabled === 1;
    }

    const implemented_combos = await this.allCombos();

    // Build the full matrix with defaults: the admin's instance default when no
    // row exists (on unless set otherwise), and off for a cell the admin blocked.
    const preferences: Partial<Record<NotifEventType, Partial<Record<NotifChannel, boolean>>>> = {};
    const locked: Partial<Record<NotifEventType, NotifChannel[]>> = {};

    for (const eventType of ALL_EVENT_TYPES) {
      preferences[eventType] = {};
      for (const channel of implemented_combos[eventType]) {
        // Admin-scoped events use global settings for the built-in external channels
        if (scope === 'admin' && ADMIN_SCOPED_EVENTS.has(eventType) && isAdminGlobalChannel(channel)) {
          preferences[eventType]![channel] = await this.getAdminGlobalPref(eventType, channel);
          continue;
        }
        const fallback = await this.instanceDefault(eventType, channel);
        if (fallback === 'blocked') {
          preferences[eventType]![channel] = false;
          (locked[eventType] ??= []).push(channel);
        } else {
          preferences[eventType]![channel] = stored[eventType]?.[channel] ?? fallback === 'on';
        }
      }
    }

    // Filter event types by scope
    const event_types = scope === 'admin'
      ? ALL_EVENT_TYPES.filter(e => ADMIN_SCOPED_EVENTS.has(e))
      : ALL_EVENT_TYPES.filter(e => !ADMIN_SCOPED_EVENTS.has(e));

    return {
      preferences,
      channels: await this.describeChannels(userId, scope),
      event_types,
      implemented_combos,
      ...(scope === 'user' && { defaults: { ntfyServer: (await this.appSettings.getValue('admin_ntfy_server')) || null }, locked }),
    };
  }

  // ── Admin global preferences (stored in app_settings) ─────────────────────

  /**
   * Returns the global admin preference for an event+channel.
   * Stored in app_settings as `admin_notif_pref_{event}_{channel}`.
   * Defaults to true (enabled) when no row exists.
   */
  async getAdminGlobalPref(event: NotifEventType, channel: AdminGlobalChannel): Promise<boolean> {
    const val = await this.appSettings.getValue(`admin_notif_pref_${event}_${channel}`);
    return val !== '0';
  }

  private async setAdminGlobalPref(event: NotifEventType, channel: AdminGlobalChannel, enabled: boolean): Promise<void> {
    await this.appSettings.setValue(`admin_notif_pref_${event}_${channel}`, enabled ? '1' : '0');
  }

  // ── Preferences update ─────────────────────────────────────────────────────

  /** Shared helper for per-user channel preference upserts. */
  private async applyUserChannelPrefs(
    userId: number,
    prefs: Partial<Record<string, Partial<Record<string, boolean>>>>,
  ): Promise<void> {
    for (const [eventType, channels] of Object.entries(prefs)) {
      if (!channels) continue;
      for (const [channel, enabled] of Object.entries(channels)) {
        const fallback = await this.instanceDefault(eventType as NotifEventType, channel);
        // A cell the admin blocked stays off whatever is sent (#1536).
        if (fallback === 'blocked') continue;
        // A value that matches the instance default is stored as no row, so a later
        // change of the default reaches everybody who never chose otherwise.
        if (enabled === (fallback === 'on')) await this.channelPrefs.deletePreference(userId, eventType, channel);
        else await this.channelPrefs.upsertPreference(userId, eventType, channel, enabled ? 1 : 0);
      }
    }
  }

  /**
   * Bulk-update preferences from the matrix UI.
   * Inserts disabled rows (enabled=0) and removes rows that are enabled (default).
   */
  async setPreferences(
    userId: number,
    prefs: Partial<Record<string, Partial<Record<string, boolean>>>>
  ): Promise<void> {
    await this.uow.transactional(async () => {
      await this.applyUserChannelPrefs(userId, prefs);
    });
  }

  /**
   * Bulk-update admin notification preferences.
   * email/webhook channels are stored globally in app_settings (not per-user).
   * inapp channel remains per-user in notification_channel_preferences.
   */
  async setAdminPreferences(
    userId: number,
    prefs: Partial<Record<string, Partial<Record<string, boolean>>>>
  ): Promise<void> {
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

    // Apply global prefs outside the transaction (they write to app_settings).
    // Mixed atomicity, preserved as-is (plan3f-sql-inventory.md §4b's flag, R10):
    // these are single-key upserts with no cross-row invariant, so a partial
    // failure here is low-risk — widening this into the transaction below is a
    // ruling this task does not make on its own.
    for (const [eventType, channels] of Object.entries(globalPrefs)) {
      if (!channels) continue;
      for (const [channel, enabled] of Object.entries(channels)) {
        if (!isAdminGlobalChannel(channel)) continue;
        await this.setAdminGlobalPref(eventType as NotifEventType, channel, enabled);
      }
    }

    // Apply per-user (inapp) prefs in a transaction
    await this.uow.transactional(async () => {
      await this.applyUserChannelPrefs(userId, userPrefs);
    });
  }

  // ── Instance-level readiness ──────────────────────────────────────────────

  /** SMTP set up at all? Kept here because the settings UI asks preferences, not the mailer. */
  async isSmtpConfigured(): Promise<boolean> {
    return await this.mailer.isSmtpConfigured();
  }

  async isWebhookConfigured(): Promise<boolean> {
    return (await this.getActiveChannels()).includes('webhook');
  }
}
