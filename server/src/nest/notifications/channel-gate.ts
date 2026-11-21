import {
  ADMIN_SCOPED_EVENTS,
  isAdminGlobalChannel,
  type ExternalChannel,
  type NotifEventType,
} from './notification-events';
import type { NotificationPreferencesService } from './notification-preferences.service';

/**
 * Should this channel deliver this event to this recipient?
 *
 * Encodes, unchanged, the gating the four hand-written dispatch blocks used to do:
 *  - admin-scoped events (version_available) reach recipients only over a channel
 *    that bypasses the `notification_channels` toggle (email), gated by the admin
 *    global pref rather than the per-user opt-out. Their webhook/ntfy copies go out
 *    once, globally, via sendGlobal() in NotificationsService, not per recipient.
 *  - everything else: the admin enabled the channel, the user didn't opt out of this
 *    event on it, and the user has credentials for it.
 */
export async function shouldSendToUser(
  channel: ExternalChannel,
  event: NotifEventType,
  recipientId: number,
  activeChannels: string[],
  prefs: NotificationPreferencesService,
): Promise<boolean> {
  if (!channel.supportsEvent(event)) return false;

  if (ADMIN_SCOPED_EVENTS.has(event)) {
    if (!channel.bypassesActiveToggleForAdminEvents) return false;
    if (!isAdminGlobalChannel(channel.id)) return false;
    if (!(await prefs.getAdminGlobalPref(event, channel.id))) return false;
  } else {
    // A built-in needs the admin's explicit switch; a plugin channel is on because the
    // admin enabled the plugin; that IS the opt-in (see getActiveChannels).
    if (channel.source === 'builtin' && !activeChannels.includes(channel.id)) return false;
    if (!(await prefs.isEnabledForEvent(recipientId, event, channel.id))) return false;
  }

  if (!(await channel.isConfiguredFor(recipientId))) return false;
  // Last, since it is the costly check: Web Push reads and verifies the server's
  // key pair. Every check here is a plain AND, so the order changes no answer.
  return !channel.isInstanceConfigured || (await channel.isInstanceConfigured());
}
