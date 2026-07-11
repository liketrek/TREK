import { db } from '../db/database';
import { logDebug, logError } from './auditLog';
import {
  getActiveChannels,
  isEnabledForEvent,
  getAdminGlobalPref,
  isAdminGlobalChannel,
  ADMIN_SCOPED_EVENTS,
  type NotifEventType,
} from './notificationPreferencesService';
import { getEventText, getUserLanguage, getAppUrl } from './notifications';
import { listChannels, type ChannelMessage, type ExternalChannel } from './notifications/channelRegistry';
import {
  resolveRecipients,
  createNotificationForRecipient,
  type NotificationInput,
} from './inAppNotifications';

// ── Event config map ───────────────────────────────────────────────────────

interface EventNotifConfig {
  inAppType: 'simple' | 'navigate';
  titleKey: string;
  textKey: string;
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
): boolean {
  if (!channel.supportsEvent(event)) return false;
  if (channel.isInstanceConfigured && !channel.isInstanceConfigured()) return false;

  if (ADMIN_SCOPED_EVENTS.has(event)) {
    if (!channel.bypassesActiveToggleForAdminEvents) return false;
    if (!isAdminGlobalChannel(channel.id)) return false;
    if (!getAdminGlobalPref(event, channel.id)) return false;
  } else {
    // A built-in needs the admin's explicit switch; a plugin channel is on because the
    // admin enabled the plugin — that IS the opt-in (see getActiveChannels).
    if (channel.source === 'builtin' && !activeChannels.includes(channel.id)) return false;
    if (!isEnabledForEvent(recipientId, event, channel.id)) return false;
  }

  return channel.isConfiguredFor(recipientId);
}

export async function send(payload: NotificationPayload): Promise<void> {
  const { event, actorId, params, scope, targetId, inApp } = payload;

  // Resolve recipients based on scope
  const recipients = resolveRecipients(scope, targetId, actorId);
  if (recipients.length === 0) return;

  const configEntry = EVENT_NOTIFICATION_CONFIG[event];
  if (!configEntry) {
    logDebug(`notificationService.send: unknown event type "${event}", using fallback`);
    if (process.env.NODE_ENV?.toLowerCase() === 'development' && actorId != null) {
      const devSender = (db.prepare('SELECT username, avatar FROM users WHERE id = ?').get(actorId) as { username: string; avatar: string | null } | undefined) ?? null;
      createNotificationForRecipient({
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
  const activeChannels = getActiveChannels();
  const channels = listChannels();
  const appUrl = getAppUrl();

  // Build navigate target (used by email/webhook CTA and in-app navigate)
  const navigateTarget = inApp?.navigateTarget ?? config.navigateTarget(params);
  const fullLink = navigateTarget ? `${appUrl}${navigateTarget}` : undefined;

  // Fetch sender info once for in-app WS payloads
  const sender = actorId
    ? (db.prepare('SELECT username, avatar FROM users WHERE id = ?').get(actorId) as { username: string; avatar: string | null } | undefined) ?? null
    : null;

  logDebug(`notificationService.send event=${event} scope=${scope} targetId=${targetId} recipients=${recipients.length} channels=inapp,${activeChannels.join(',')}`);

  // Dispatch to each recipient in parallel
  await Promise.all(recipients.map(async (recipientId) => {
    const promises: Promise<unknown>[] = [];

    // ── In-app ──────────────────────────────────────────────────────────
    if (isEnabledForEvent(recipientId, event, 'inapp')) {
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
          text_key: config.textKey,
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
          text_key: config.textKey,
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
          text_key: config.textKey,
          text_params: params,
        };
      }

      promises.push(
        Promise.resolve().then(() => createNotificationForRecipient(notifInput, recipientId, sender ?? null))
      );
    }

    // ── External channels (email, webhook, ntfy, plugin:*) ───────────────
    // One loop over the registry. The message is rendered once per recipient, in
    // their language, and handed to every channel that wants it — so a plugin
    // channel never touches i18n.
    const deliverable = channels.filter(ch => shouldSendToUser(ch, event, recipientId, activeChannels));
    if (deliverable.length > 0) {
      const lang = getUserLanguage(recipientId);
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
        logError(`notificationService.send channel dispatch failed event=${event} recipient=${recipientId}: ${result.reason}`);
      }
    }
  }));

  // ── Admin-global copies (scope: admin) ───────────────────────────────
  // One send per channel, over the admin's own credentials, not per-recipient.
  // Always rendered in English — there is no single recipient to take a language from.
  if (scope === 'admin') {
    const globalChannels = channels.filter(
      ch => ch.sendGlobal && ch.supportsEvent(event) && isAdminGlobalChannel(ch.id) && getAdminGlobalPref(event, ch.id),
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
