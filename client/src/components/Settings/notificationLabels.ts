/**
 * Labels for the notification matrix, shared by the desktop and phone settings
 * and the admin's defaults for users (#1536), so the three can never name an
 * event differently.
 */

export interface NotificationChannelDescriptor {
  id: string
  source?: 'builtin' | 'plugin'
  labelKey?: string
  label?: string
  settingsPath?: string
  active: boolean
  configured: boolean
}

export const EVENT_LABEL_KEYS: Record<string, string> = {
  trip_invite: 'settings.notifyTripInvite',
  booking_change: 'settings.notifyBookingChange',
  trip_reminder: 'settings.notifyTripReminder',
  todo_due: 'settings.notifyTodoDue',
  vacay_invite: 'settings.notifyVacayInvite',
  vacay_share: 'settings.notifyVacayShare',
  collection_invite: 'settings.notifyCollectionInvite',
  synology_session_cleared: 'settings.notifySynologySessionCleared',
  plugin_notification: 'settings.notifyPluginNotification',
  photos_shared: 'settings.notifyPhotosShared',
  collab_message: 'settings.notifyCollabMessage',
  packing_tagged: 'settings.notifyPackingTagged',
  version_available: 'settings.notifyVersionAvailable',
}

/** Plugin channels have no i18n; the server sends their display name outright. */
export function channelLabel(ch: { id: string; labelKey?: string; label?: string }, t: (k: string) => string): string {
  if (ch.labelKey) return t(ch.labelKey) || ch.id
  return ch.label || ch.id
}

/** True when the admin switched this cell off for everyone (#1536). */
export function isLockedCell(locked: Record<string, string[]> | undefined, eventType: string, channel: string): boolean {
  return !!locked?.[eventType]?.includes(channel)
}
