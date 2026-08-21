import { Injectable } from '@nestjs/common';
import type { ChannelTestResult } from '@trek/shared';
import { readEnv, getAppUrl } from '../../app-config';
import { logDebug, logError } from '../audit/audit-log.logger';
import { getEventText } from './mailer/email-html';
import { MailerService } from './mailer/mailer.service';
import { NtfyService, type NtfyConfig } from './transports/ntfy.service';
import { WebhookService } from './transports/webhook.service';
import { NotificationPreferencesService, type PreferencesMatrix } from './notification-preferences.service';
import { registerBuiltinChannels } from './channels/builtins';
import {
  ADMIN_SCOPED_EVENTS,
  isAdminGlobalChannel,
  type ChannelMessage,
  type ExternalChannel,
  type NotifEventType,
} from './notification-events';
import { getChannel, listChannels } from './channel-registry';
import { getAction } from './in-app-actions';
import { avatarUrl } from '../common/avatarUrl';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';


// SQLite's CURRENT_TIMESTAMP is UTC but the string ('YYYY-MM-DD HH:MM:SS') has
// no 'T'/'Z', so `new Date(...)` parses it as LOCAL time. Normalize to ISO-UTC
// so the client renders notification times in the viewer's own timezone (#1149).
function toUtcIso(ts: string): string {
  return ts.endsWith('Z') ? ts : ts.replace(' ', 'T') + 'Z';
}

type NotificationType = 'simple' | 'boolean' | 'navigate';
type NotificationScope = 'trip' | 'user' | 'admin';
type NotificationResponse = 'positive' | 'negative';

interface BaseNotificationInput {
  type: NotificationType;
  scope: NotificationScope;
  target: number;
  sender_id: number | null;
  event_type?: NotifEventType;
  title_key: string;
  title_params?: Record<string, string>;
  text_key: string;
  text_params?: Record<string, string>;
}

interface SimpleNotificationInput extends BaseNotificationInput {
  type: 'simple';
}

interface BooleanNotificationInput extends BaseNotificationInput {
  type: 'boolean';
  positive_text_key: string;
  negative_text_key: string;
  positive_callback: { action: string; payload: Record<string, unknown> };
  negative_callback: { action: string; payload: Record<string, unknown> };
}

interface NavigateNotificationInput extends BaseNotificationInput {
  type: 'navigate';
  navigate_text_key: string;
  navigate_target: string;
}

type NotificationInput = SimpleNotificationInput | BooleanNotificationInput | NavigateNotificationInput;

interface NotificationRow {
  id: number;
  type: NotificationType;
  scope: NotificationScope;
  target: number;
  sender_id: number | null;
  sender_username?: string | null;
  sender_avatar?: string | null;
  recipient_id: number;
  title_key: string;
  title_params: string;
  text_key: string;
  text_params: string;
  positive_text_key: string | null;
  negative_text_key: string | null;
  positive_callback: string | null;
  negative_callback: string | null;
  response: NotificationResponse | null;
  navigate_text_key: string | null;
  navigate_target: string | null;
  is_read: number;
  created_at: string;
}

type RespondResult = { success: boolean; error?: string; notification?: NotificationRow };

// ── Event config map ───────────────────────────────────────────────────────

interface EventNotifConfig {
  inAppType: 'simple' | 'navigate';
  titleKey: string;
  textKey: string | ((params: Record<string, string>) => string);
  navigateTextKey?: string;
  navigateTarget: (params: Record<string, string>) => string | null;
}

const EVENT_NOTIFICATION_CONFIG: Record<string, EventNotifConfig> = {
  // ── Dev-only test events ──────────────────────────────────────────────────
  test_simple: {
    inAppType: 'simple',
    titleKey: 'notif.test.title',
    textKey: 'notif.test.simple.text',
    navigateTarget: () => null,
  },
  test_boolean: {
    inAppType: 'simple', // overridden by inApp.type at call site
    titleKey: 'notif.test.title',
    textKey: 'notif.test.boolean.text',
    navigateTarget: () => null,
  },
  test_navigate: {
    inAppType: 'navigate',
    titleKey: 'notif.test.title',
    textKey: 'notif.test.navigate.text',
    navigateTextKey: 'notif.action.view',
    navigateTarget: () => '/dashboard',
  },
  // ── Plugin-mediated notification (#plugins) — raw title/body carried as params,
  // rendered by the passthrough keys. The plugin never picks a recipient directly;
  // the host forces scope/target to the acting user or a trip they belong to. ──────
  plugin_notification: {
    inAppType: 'navigate',
    titleKey: 'notif.plugin.title',
    textKey: 'notif.plugin.text',
    navigateTextKey: 'notif.action.view',
    navigateTarget: p => p.link || null,
  },
  // ── Production events ─────────────────────────────────────────────────────
  trip_invite: {
    inAppType: 'navigate',
    titleKey: 'notif.trip_invite.title',
    textKey: 'notif.trip_invite.text',
    navigateTextKey: 'notif.action.view_trip',
    navigateTarget: p => (p.tripId ? `/trips/${p.tripId}` : null),
  },
  booking_change: {
    inAppType: 'navigate',
    titleKey: 'notif.booking_change.title',
    textKey: 'notif.booking_change.text',
    navigateTextKey: 'notif.action.view_trip',
    navigateTarget: p => (p.tripId ? `/trips/${p.tripId}` : null),
  },
  trip_reminder: {
    inAppType: 'navigate',
    titleKey: 'notif.trip_reminder.title',
    textKey: 'notif.trip_reminder.text',
    navigateTextKey: 'notif.action.view_trip',
    navigateTarget: p => (p.tripId ? `/trips/${p.tripId}` : null),
  },
  todo_due: {
    inAppType: 'navigate',
    titleKey: 'notif.todo_due.title',
    textKey: 'notif.todo_due.text',
    navigateTextKey: 'notif.action.view_trip',
    navigateTarget: p => (p.tripId ? `/trips/${p.tripId}` : null),
  },
  vacay_invite: {
    inAppType: 'navigate',
    titleKey: 'notif.vacay_invite.title',
    textKey: 'notif.vacay_invite.text',
    navigateTextKey: 'notif.action.view_vacay',
    navigateTarget: p => (p.planId ? `/vacay/${p.planId}` : null),
  },
  vacay_share: {
    inAppType: 'navigate',
    titleKey: 'notif.vacay_share.title',
    textKey: 'notif.vacay_share.text',
    navigateTextKey: 'notif.action.view_vacay',
    navigateTarget: () => '/vacay',
  },
  collection_invite: {
    inAppType: 'navigate',
    titleKey: 'notif.collection_invite.title',
    textKey: 'notif.collection_invite.text',
    navigateTextKey: 'notif.action.view_collection',
    navigateTarget: p => (p.collectionId ? `/collections/${p.collectionId}` : '/collections'),
  },
  photos_shared: {
    inAppType: 'navigate',
    titleKey: 'notif.photos_shared.title',
    textKey: 'notif.photos_shared.text',
    navigateTextKey: 'notif.action.view_trip',
    navigateTarget: p => (p.tripId ? `/trips/${p.tripId}` : null),
  },
  collab_message: {
    inAppType: 'navigate',
    titleKey: 'notif.collab_message.title',
    textKey: 'notif.collab_message.text',
    navigateTextKey: 'notif.action.view_collab',
    navigateTarget: p => (p.tripId ? `/trips/${p.tripId}` : null),
  },
  packing_tagged: {
    inAppType: 'navigate',
    titleKey: 'notif.packing_tagged.title',
    textKey: 'notif.packing_tagged.text',
    navigateTextKey: 'notif.action.view_packing',
    navigateTarget: p => (p.tripId ? `/trips/${p.tripId}` : null),
  },
  version_available: {
    inAppType: 'navigate',
    titleKey: 'notif.version_available.title',
    textKey: 'notif.version_available.text',
    navigateTextKey: 'notif.action.view_admin',
    navigateTarget: () => '/admin',
  },
  replica_failure: {
    inAppType: 'navigate',
    titleKey: 'notif.replica_failure.title',
    textKey: (p) => (p.suppressed && p.suppressed !== '0' ? 'notif.replica_failure.textSuppressed' : 'notif.replica_failure.text'),
    navigateTextKey: 'notif.action.view',
    navigateTarget: () => '/admin?tab=storage',
  },
  synology_session_cleared: {
    inAppType: 'simple',
    titleKey: 'notifications.synologySessionCleared.title',
    textKey: 'notifications.synologySessionCleared.text',
    navigateTarget: () => null,
  },
};

// ── Fallback config for unknown event types ────────────────────────────────

const FALLBACK_EVENT_CONFIG: EventNotifConfig = {
  inAppType: 'simple',
  titleKey: 'notif.generic.title',
  textKey: 'notif.generic.text',
  navigateTarget: () => null,
};

// ── Unified send() API ─────────────────────────────────────────────────────

export interface NotificationPayload {
  event: NotifEventType;
  actorId: number | null;
  params: Record<string, string>;
  scope: 'trip' | 'user' | 'admin';
  targetId: number; // tripId for trip scope, userId for user scope, 0 for admin
  /** Optional in-app overrides (e.g. boolean type with callbacks) */
  inApp?: {
    type?: 'simple' | 'boolean' | 'navigate';
    positiveTextKey?: string;
    negativeTextKey?: string;
    positiveCallback?: { action: string; payload: Record<string, unknown> };
    negativeCallback?: { action: string; payload: Record<string, unknown> };
    navigateTarget?: string; // override the auto-generated navigate target
  };
}

/**
 * Should this channel deliver this event to this recipient?
 *
 * Encodes, unchanged, the gating the four hand-written dispatch blocks used to do:
 *  - admin-scoped events (version_available) reach recipients only over a channel
 *    that bypasses the `notification_channels` toggle (email), gated by the admin
 *    global pref rather than the per-user opt-out. Their webhook/ntfy copies go out
 *    once, globally, via sendGlobal() below — not per recipient.
 *  - everything else: the admin enabled the channel, the user didn't opt out of this
 *    event on it, and the user has credentials for it.
 */
function shouldSendToUser(
  channel: ExternalChannel,
  event: NotifEventType,
  recipientId: number,
  activeChannels: string[],
  prefs: NotificationPreferencesService,
): boolean {
  if (!channel.supportsEvent(event)) return false;
  if (channel.isInstanceConfigured && !channel.isInstanceConfigured()) return false;

  if (ADMIN_SCOPED_EVENTS.has(event)) {
    if (!channel.bypassesActiveToggleForAdminEvents) return false;
    if (!isAdminGlobalChannel(channel.id)) return false;
    if (!prefs.getAdminGlobalPref(event, channel.id)) return false;
  } else {
    // A built-in needs the admin's explicit switch; a plugin channel is on because the
    // admin enabled the plugin — that IS the opt-in (see getActiveChannels).
    if (channel.source === 'builtin' && !activeChannels.includes(channel.id)) return false;
    if (!prefs.isEnabledForEvent(recipientId, event, channel.id)) return false;
  }

  return channel.isConfiguredFor(recipientId);
}

/**
 * DI-native notifications domain service. The in-app notification SQL moved
 * 1:1 from the legacy `services/inAppNotifications.ts` (identical statements,
 * post-insert re-selects) and the unified `send()` dispatcher moved 1:1 from
 * `services/notificationService.ts` (identical event-config map, gating and
 * log lines). The trailing fix(server) commit then normalized the carried
 * defects: `toUtcIso` now applies on every broadcast/re-select path (#1149
 * was originally patched on only one of three), and `respond` claims the
 * response atomically BEFORE running the action handler (double-submits can
 * no longer execute the action twice; a handler failure releases the claim).
 * The channel transports and the preference matrix are injected providers
 * since the notifications fold; the channel registry stays a module singleton
 * so every separately-constructed instance (the no-Nest test harnesses — the
 * last production out-of-container consumer, notifications.instance.ts, died
 * with the bridge fold) sees the channels the plugin runtime pushes in.
 *
 * Every production consumer injects this service now: the plugin RPC host via
 * `HostSurfaceRpc`, the reminder crons via ReminderJobsService.
 */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly realtime: RealtimeService,
    private readonly mailer: MailerService,
    private readonly webhook: WebhookService,
    private readonly ntfy: NtfyService,
    private readonly prefs: NotificationPreferencesService,
  ) {
    // The registry is a module singleton shared with the plugin runtime and any
    // separately-constructed instance (which never runs onModuleInit), so
    // registering from here means every path that can dispatch has the
    // built-ins. registerChannel is an idempotent Map.set.
    registerBuiltinChannels({ mailer, webhook, ntfy });
  }

  getPreferences(userId: number, role: string): PreferencesMatrix {
    return this.prefs.getPreferencesMatrix(userId, role, 'user');
  }

  /** Send a test notification over any registered channel (built-in or plugin). */
  async testChannel(userId: number, channelId: string): Promise<ChannelTestResult> {
    const channel = getChannel(channelId);
    if (!channel) return { success: false, error: 'Unknown channel' };
    if (!channel.test) return { success: false, error: 'This channel does not support test sends' };
    if (!channel.isConfiguredFor(userId)) return { success: false, error: 'Channel is not configured for this user' };
    try {
      return await channel.test(userId);
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }

  setPreferences(userId: number, body: Parameters<NotificationPreferencesService['setPreferences']>[1]): void {
    this.prefs.setPreferences(userId, body);
  }

  testSmtp(to: string): Promise<ChannelTestResult> {
    return this.mailer.testSmtp(to);
  }

  testWebhook(url: string): Promise<ChannelTestResult> {
    return this.webhook.testWebhook(url);
  }

  testNtfy(cfg: { topic: string; server?: string | null; token?: string | null }): Promise<ChannelTestResult> {
    return this.ntfy.testNtfy(cfg);
  }

  userWebhookUrl(userId: number): string | null {
    return this.webhook.getUserWebhookUrl(userId);
  }

  adminWebhookUrl(): string | null {
    return this.webhook.getAdminWebhookUrl();
  }

  userNtfyConfig(userId: number): NtfyConfig | null {
    return this.ntfy.getUserNtfyConfig(userId);
  }

  adminNtfyConfig(): NtfyConfig {
    return this.ntfy.getAdminNtfyConfig();
  }

  // ── In-app notification store (from services/inAppNotifications.ts) ───────

  resolveRecipients(scope: NotificationScope, target: number, excludeUserId?: number | null): number[] {
    let userIds: number[] = [];

    // Guests (#1362) are trip members for assignment purposes but have no inbox/email,
    // so they must never be resolved as notification recipients on any scope. This is the
    // single chokepoint for in-app/email/webhook/ntfy, so filtering here covers all channels.
    if (scope === 'trip') {
      const owner = this.db.get<{ user_id: number }>('SELECT user_id FROM trips WHERE id = ?', target);
      const members = this.db.all<{ user_id: number }>('SELECT m.user_id FROM trip_members m JOIN users u ON u.id = m.user_id WHERE m.trip_id = ? AND COALESCE(u.is_guest, 0) = 0', target);
      const ids = new Set<number>();
      if (owner) ids.add(owner.user_id);
      for (const m of members) ids.add(m.user_id);
      userIds = Array.from(ids);
    } else if (scope === 'user') {
      // A guest can be a todo assignee (scope='user'); never notify them.
      const u = this.db.get<{ is_guest?: number }>('SELECT is_guest FROM users WHERE id = ?', target);
      userIds = u && u.is_guest ? [] : [target];
    } else if (scope === 'admin') {
      const admins = this.db.all<{ id: number }>("SELECT id FROM users WHERE role = ? AND COALESCE(is_guest, 0) = 0", 'admin');
      userIds = admins.map(a => a.id);
    }

    // Only exclude sender for group scopes (trip/admin) — for user scope, the target is explicit
    if (excludeUserId != null && scope !== 'user') {
      userIds = userIds.filter(id => id !== excludeUserId);
    }

    return userIds;
  }

  /**
   * Legacy multi-recipient insert path (resolve + per-recipient pref check in
   * one transaction). `send()` resolves recipients itself and uses
   * `createNotificationForRecipient`; this remains for direct callers/tests.
   */
  createNotification(input: NotificationInput): number[] {
    const recipients = this.resolveRecipients(input.scope, input.target, input.sender_id);
    if (recipients.length === 0) return [];

    const titleParams = JSON.stringify(input.title_params ?? {});
    const textParams = JSON.stringify(input.text_params ?? {});

    // Track inserted id → recipientId pairs (some recipients may be skipped by pref check)
    const insertedPairs: Array<{ id: number; recipientId: number }> = [];

    this.db.transaction(() => {
      const stmt = this.db.prepare(`
      INSERT INTO notifications (
        type, scope, target, sender_id, recipient_id,
        title_key, title_params, text_key, text_params,
        positive_text_key, negative_text_key, positive_callback, negative_callback,
        navigate_text_key, navigate_target
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

      for (const recipientId of recipients) {
        // Check per-user in-app preference if an event_type is provided
        if (input.event_type && !this.prefs.isEnabledForEvent(recipientId, input.event_type, 'inapp')) {
          continue;
        }

        let positiveTextKey: string | null = null;
        let negativeTextKey: string | null = null;
        let positiveCallback: string | null = null;
        let negativeCallback: string | null = null;
        let navigateTextKey: string | null = null;
        let navigateTarget: string | null = null;

        if (input.type === 'boolean') {
          positiveTextKey = input.positive_text_key;
          negativeTextKey = input.negative_text_key;
          positiveCallback = JSON.stringify(input.positive_callback);
          negativeCallback = JSON.stringify(input.negative_callback);
        } else if (input.type === 'navigate') {
          navigateTextKey = input.navigate_text_key;
          navigateTarget = input.navigate_target;
        }

        const result = stmt.run(
          input.type, input.scope, input.target, input.sender_id, recipientId,
          input.title_key, titleParams, input.text_key, textParams,
          positiveTextKey, negativeTextKey, positiveCallback, negativeCallback,
          navigateTextKey, navigateTarget
        );

        insertedPairs.push({ id: result.lastInsertRowid as number, recipientId });
      }
    });

    // Fetch sender info once for WS payloads
    const sender = input.sender_id
      ? this.db.get<{ username: string; avatar: string | null }>('SELECT username, avatar FROM users WHERE id = ?', input.sender_id)
      : null;

    // Broadcast to each recipient
    for (const { id: notificationId, recipientId } of insertedPairs) {
      const row = this.db.get<NotificationRow>('SELECT * FROM notifications WHERE id = ?', notificationId) as NotificationRow;
      if (!row) continue;

      this.realtime.broadcastToUser(recipientId, {
        type: 'notification:new',
        notification: {
          ...row,
          created_at: toUtcIso(row.created_at),
          sender_username: sender?.username ?? null,
          sender_avatar: avatarUrl({ avatar: sender?.avatar }),
        },
      });
    }

    return insertedPairs.map(p => p.id);
  }

  /**
   * Insert a single in-app notification for one pre-resolved recipient and broadcast via WebSocket.
   * Used by send() which handles recipient resolution externally.
   */
  createNotificationForRecipient(
    input: NotificationInput,
    recipientId: number,
    sender: { username: string; avatar: string | null } | null
  ): number | null {
    const titleParams = JSON.stringify(input.title_params ?? {});
    const textParams = JSON.stringify(input.text_params ?? {});

    let positiveTextKey: string | null = null;
    let negativeTextKey: string | null = null;
    let positiveCallback: string | null = null;
    let negativeCallback: string | null = null;
    let navigateTextKey: string | null = null;
    let navigateTarget: string | null = null;

    if (input.type === 'boolean') {
      positiveTextKey = input.positive_text_key;
      negativeTextKey = input.negative_text_key;
      positiveCallback = JSON.stringify(input.positive_callback);
      negativeCallback = JSON.stringify(input.negative_callback);
    } else if (input.type === 'navigate') {
      navigateTextKey = input.navigate_text_key;
      navigateTarget = input.navigate_target;
    }

    const result = this.db.run(`
    INSERT INTO notifications (
      type, scope, target, sender_id, recipient_id,
      title_key, title_params, text_key, text_params,
      positive_text_key, negative_text_key, positive_callback, negative_callback,
      navigate_text_key, navigate_target
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
      input.type, input.scope, input.target, input.sender_id, recipientId,
      input.title_key, titleParams, input.text_key, textParams,
      positiveTextKey, negativeTextKey, positiveCallback, negativeCallback,
      navigateTextKey, navigateTarget
    );

    const notificationId = result.lastInsertRowid as number;
    const row = this.db.get<NotificationRow>('SELECT * FROM notifications WHERE id = ?', notificationId);
    if (!row) return null;

    this.realtime.broadcastToUser(recipientId, {
      type: 'notification:new',
      notification: {
        ...row,
        created_at: toUtcIso(row.created_at),
        sender_username: sender?.username ?? null,
        sender_avatar: avatarUrl({ avatar: sender?.avatar }),
      },
    });

    return notificationId;
  }

  // Returns the native service shape (NotificationRow[] is a superset of the
  // client-facing InAppListResult contract); the controller surfaces it as-is.
  listInApp(
    userId: number,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ): { notifications: NotificationRow[]; total: number; unread_count: number } {
    const limit = Math.min(options.limit ?? 20, 50);
    const offset = options.offset ?? 0;
    const unreadOnly = options.unreadOnly ?? false;

    const whereAliased = unreadOnly ? 'WHERE n.recipient_id = ? AND n.is_read = 0' : 'WHERE n.recipient_id = ?';
    const wherePlain = unreadOnly ? 'WHERE recipient_id = ? AND is_read = 0' : 'WHERE recipient_id = ?';

    const rows = this.db.all<NotificationRow>(`
    SELECT n.*, u.username AS sender_username, u.avatar AS sender_avatar
    FROM notifications n
    LEFT JOIN users u ON n.sender_id = u.id
    ${whereAliased}
    ORDER BY n.created_at DESC
    LIMIT ? OFFSET ?
  `, userId, limit, offset);

    const { total } = this.db.get<{ total: number }>(`SELECT COUNT(*) as total FROM notifications ${wherePlain}`, userId) as { total: number };
    const { unread_count } = this.db.get<{ unread_count: number }>('SELECT COUNT(*) as unread_count FROM notifications WHERE recipient_id = ? AND is_read = 0', userId) as { unread_count: number };

    const mapped = rows.map(r => ({
      ...r,
      created_at: toUtcIso(r.created_at),
      sender_avatar: avatarUrl({ avatar: r.sender_avatar }),
    }));

    return { notifications: mapped, total, unread_count };
  }

  unreadCount(userId: number): number {
    const row = this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = 0', userId) as { count: number };
    return row.count;
  }

  markRead(notificationId: number, userId: number): boolean {
    const result = this.db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?', notificationId, userId);
    return result.changes > 0;
  }

  markUnread(notificationId: number, userId: number): boolean {
    const result = this.db.run('UPDATE notifications SET is_read = 0 WHERE id = ? AND recipient_id = ?', notificationId, userId);
    return result.changes > 0;
  }

  markAllRead(userId: number): number {
    const result = this.db.run('UPDATE notifications SET is_read = 1 WHERE recipient_id = ? AND is_read = 0', userId);
    return result.changes;
  }

  deleteOne(notificationId: number, userId: number): boolean {
    const result = this.db.run('DELETE FROM notifications WHERE id = ? AND recipient_id = ?', notificationId, userId);
    return result.changes > 0;
  }

  deleteAll(userId: number): number {
    const result = this.db.run('DELETE FROM notifications WHERE recipient_id = ?', userId);
    return result.changes;
  }

  async respond(
    notificationId: number,
    userId: number,
    response: NotificationResponse
  ): Promise<RespondResult> {
    const notification = this.db.get<NotificationRow>('SELECT * FROM notifications WHERE id = ? AND recipient_id = ?', notificationId, userId);

    if (!notification) return { success: false, error: 'Notification not found' };
    if (notification.type !== 'boolean') return { success: false, error: 'Not a boolean notification' };
    if (notification.response !== null) return { success: false, error: 'Already responded' };

    const callbackJson = response === 'positive' ? notification.positive_callback : notification.negative_callback;
    if (!callbackJson) return { success: false, error: 'No callback defined' };

    let callback: { action: string; payload: Record<string, unknown> };
    try {
      callback = JSON.parse(callbackJson);
    } catch {
      return { success: false, error: 'Invalid callback format' };
    }

    const handler = getAction(callback.action);
    if (!handler) return { success: false, error: `Unknown action: ${callback.action}` };

    // Atomic claim BEFORE the handler runs — only updates if response is still
    // NULL, so a concurrent double-submit can never execute the action twice
    // (the legacy order ran the handler first, letting both submits through).
    const result = this.db.run(
      'UPDATE notifications SET response = ?, is_read = 1 WHERE id = ? AND recipient_id = ? AND response IS NULL',
      response, notificationId, userId
    );

    if (result.changes === 0) return { success: false, error: 'Already responded' };

    try {
      await handler(callback.payload, userId);
    } catch (err) {
      // Release the claim so the user can retry — legacy contract: a handler
      // failure returns its message and leaves the notification unresponded.
      this.db.run(
        'UPDATE notifications SET response = NULL, is_read = ? WHERE id = ? AND recipient_id = ?',
        notification.is_read, notificationId, userId
      );
      return { success: false, error: err instanceof Error ? err.message : 'Action failed' };
    }

    const updated = this.db.get<NotificationRow>(`
    SELECT n.*, u.username AS sender_username, u.avatar AS sender_avatar
    FROM notifications n
    LEFT JOIN users u ON n.sender_id = u.id
    WHERE n.id = ?
  `, notificationId) as NotificationRow;

    const mappedUpdated = {
      ...updated,
      created_at: toUtcIso(updated.created_at),
      sender_avatar: avatarUrl({ avatar: updated.sender_avatar }),
    };

    this.realtime.broadcastToUser(userId, { type: 'notification:updated', notification: mappedUpdated });

    return { success: true, notification: mappedUpdated };
  }

  // ── Unified dispatcher (from services/notificationService.ts) ─────────────

  async send(payload: NotificationPayload): Promise<void> {
    const { event, actorId, params, scope, targetId, inApp } = payload;

    // Resolve recipients based on scope
    const recipients = this.resolveRecipients(scope, targetId, actorId);
    if (recipients.length === 0) return;

    const configEntry = EVENT_NOTIFICATION_CONFIG[event];
    if (!configEntry) {
      logDebug(`notificationService.send: unknown event type "${event}", using fallback`);
      if (readEnv().app.isDevelopment && actorId != null) {
        const devSender = this.db.get<{ username: string; avatar: string | null }>('SELECT username, avatar FROM users WHERE id = ?', actorId) ?? null;
        this.createNotificationForRecipient({
          type: 'simple',
          scope: 'user',
          target: actorId,
          sender_id: null,
          title_key: 'notif.dev.unknown_event.title',
          text_key: 'notif.dev.unknown_event.text',
          text_params: { event },
        }, actorId, devSender);
      }
    }
    const config = configEntry ?? FALLBACK_EVENT_CONFIG;
    const activeChannels = this.prefs.getActiveChannels();
    const channels = listChannels();
    const appUrl = getAppUrl();

    // Build navigate target (used by email/webhook CTA and in-app navigate)
    const navigateTarget = inApp?.navigateTarget ?? config.navigateTarget(params);
    const fullLink = navigateTarget ? `${appUrl}${navigateTarget}` : undefined;

    // Resolve the in-app text key once, so all three in-app branches below agree
    // (e.g. replica_failure picks the "N more failures suppressed" phrasing off params.suppressed).
    const textKey = typeof config.textKey === 'function' ? config.textKey(params) : config.textKey;

    // Fetch sender info once for in-app WS payloads
    const sender = actorId
      ? this.db.get<{ username: string; avatar: string | null }>('SELECT username, avatar FROM users WHERE id = ?', actorId) ?? null
      : null;

    logDebug(`notificationService.send event=${event} scope=${scope} targetId=${targetId} recipients=${recipients.length} channels=inapp,${activeChannels.join(',')}`);

    // Dispatch to each recipient in parallel
    await Promise.all(recipients.map(async (recipientId) => {
      const promises: Promise<unknown>[] = [];

      // ── In-app ──────────────────────────────────────────────────────────
      if (this.prefs.isEnabledForEvent(recipientId, event, 'inapp')) {
        const inAppType = inApp?.type ?? config.inAppType;
        let notifInput: NotificationInput;

        if (inAppType === 'boolean' && inApp?.positiveCallback && inApp?.negativeCallback) {
          notifInput = {
            type: 'boolean',
            scope,
            target: targetId,
            sender_id: actorId,
            event_type: event,
            title_key: config.titleKey,
            title_params: params,
            text_key: textKey,
            text_params: params,
            positive_text_key: inApp.positiveTextKey ?? 'notif.action.accept',
            negative_text_key: inApp.negativeTextKey ?? 'notif.action.decline',
            positive_callback: inApp.positiveCallback,
            negative_callback: inApp.negativeCallback,
          };
        } else if (inAppType === 'navigate' && navigateTarget) {
          notifInput = {
            type: 'navigate',
            scope,
            target: targetId,
            sender_id: actorId,
            event_type: event,
            title_key: config.titleKey,
            title_params: params,
            text_key: textKey,
            text_params: params,
            navigate_text_key: config.navigateTextKey ?? 'notif.action.view',
            navigate_target: navigateTarget,
          };
        } else {
          notifInput = {
            type: 'simple',
            scope,
            target: targetId,
            sender_id: actorId,
            event_type: event,
            title_key: config.titleKey,
            title_params: params,
            text_key: textKey,
            text_params: params,
          };
        }

        promises.push(
          Promise.resolve().then(() => this.createNotificationForRecipient(notifInput, recipientId, sender ?? null))
        );
      }

      // ── External channels (email, webhook, ntfy, plugin:*) ───────────────
      // One loop over the registry. The message is rendered once per recipient, in
      // their language, and handed to every channel that wants it — so a plugin
      // channel never touches i18n.
      const deliverable = channels.filter(ch => shouldSendToUser(ch, event, recipientId, activeChannels, this.prefs));
      if (deliverable.length > 0) {
        const lang = this.mailer.getUserLanguage(recipientId);
        const { title, body } = getEventText(lang, event, params);
        const msg: ChannelMessage = {
          event,
          title,
          body,
          navigateTarget: navigateTarget ?? undefined,
          url: fullLink,
          tripName: params.trip,
        };
        for (const ch of deliverable) promises.push(ch.sendToUser(recipientId, msg));
      }

      const results = await Promise.allSettled(promises);
      for (const result of results) {
        if (result.status === 'rejected') {
          logError(`notificationService.send channel dispatch failed event=${event} recipient=${recipientId}: ${result.reason instanceof Error ? result.reason.message : result.reason}`);
        }
      }
    }));

    // ── Admin-global copies (scope: admin) ───────────────────────────────
    // One send per channel, over the admin's own credentials, not per-recipient.
    // Always rendered in English — there is no single recipient to take a language from.
    if (scope === 'admin') {
      const globalChannels = channels.filter(
        ch => ch.sendGlobal && ch.supportsEvent(event) && isAdminGlobalChannel(ch.id) && this.prefs.getAdminGlobalPref(event, ch.id),
      );
      if (globalChannels.length > 0) {
        const { title, body } = getEventText('en', event, params);
        const msg: ChannelMessage = { event, title, body, navigateTarget: navigateTarget ?? undefined, url: fullLink };
        await Promise.all(
          globalChannels.map(ch =>
            ch.sendGlobal!(msg).catch((err: unknown) => {
              logError(`notificationService.send admin ${ch.id} failed event=${event}: ${err instanceof Error ? err.message : err}`);
            }),
          ),
        );
      }
    }
  }
}

export type { NotificationInput, NotificationRow, NotificationType, NotificationScope, NotificationResponse };
