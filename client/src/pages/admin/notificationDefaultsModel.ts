import type { NotificationDefault } from '@trek/shared';
import { Check, Lock, Minus } from 'lucide-react';
import type { NotificationDefaultsMatrix } from './useNotificationDefaults';

/**
 * The notification defaults grid (#1536) as both views draw it, the desktop
 * AdminNotificationDefaultsPanel and the phone MAdminNotificationDefaults: each
 * cell cycles On → Off → Blocked, Off a default a user may still turn on,
 * Blocked off for everyone.
 */
export const NEXT_DEFAULT: Record<NotificationDefault, NotificationDefault> = {
  on: 'off',
  off: 'blocked',
  blocked: 'on',
};
export const DEFAULT_ICON = { on: Check, off: Minus, blocked: Lock } as const;
export const DEFAULT_LABEL_KEYS: Record<NotificationDefault, string> = {
  on: 'admin.notificationDefaults.on',
  off: 'admin.notificationDefaults.off',
  blocked: 'admin.notificationDefaults.blocked',
};

/** The channels at least one event can be sent on; a channel nothing uses gets no column. */
export function defaultChannels(matrix: NotificationDefaultsMatrix): NotificationDefaultsMatrix['channels'] {
  return matrix.channels.filter((ch) =>
    matrix.event_types.some((evt) => matrix.implemented_combos[evt]?.includes(ch.id))
  );
}

/** A cell's current default; a cell the server does not list starts on. */
export function defaultOf(matrix: NotificationDefaultsMatrix, eventType: string, channel: string): NotificationDefault {
  return matrix.defaults[eventType]?.[channel] ?? 'on';
}
