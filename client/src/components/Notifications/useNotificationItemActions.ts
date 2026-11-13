import { useState } from 'react';
import { useNavigate } from 'react-router';

import { type InAppNotification, useInAppNotificationStore } from '../../store/inAppNotificationStore';

/** Resolve old inbox rows too: their stored links predate the current destinations. */
function notificationTarget(notification: InAppNotification): string | null {
  if (notification.title_key === 'notif.vacay_invite.title' || notification.title_key === 'notif.vacay_share.title') {
    return '/vacay';
  }
  if (notification.title_key === 'notif.collab_message.title') {
    const tripId =
      /^\/trips\/([1-9]\d*)(?:[/?#]|$)/.exec(notification.navigate_target ?? '')?.[1] ??
      (notification.scope === 'trip' && notification.target > 0 ? String(notification.target) : null);
    return tripId ? `/trips/${tripId}?tab=collab` : '/dashboard';
  }
  return notification.navigate_target;
}

/** Compact relative timestamp ("5m" / "3h" / "2d"); under a minute it reads `justNow`. */
export function compactTime(dateStr: string, justNow: string): string {
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (minutes < 1) return justNow;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/**
 * What one in-app notification can do, behind both lists (the desktop bell's item and
 * the phone row render their own markup over this): answer a yes or no question once,
 * follow its link (marking it read first), mark it read or unread and delete it.
 */
export function useNotificationItemActions(notification: InAppNotification, onClose?: () => void) {
  const navigate = useNavigate();
  const [responding, setResponding] = useState(false);
  const { markRead, markUnread, deleteNotification, respondToBoolean } = useInAppNotificationStore();

  const handleRespond = async (response: 'positive' | 'negative') => {
    if (responding || notification.response !== null) return;
    setResponding(true);
    await respondToBoolean(notification.id, response);
    setResponding(false);
  };

  const handleNavigate = async () => {
    if (!notification.is_read) await markRead(notification.id);
    const target = notificationTarget(notification);
    if (target) {
      navigate(target);
      onClose?.();
    }
  };

  return { responding, handleRespond, handleNavigate, markRead, markUnread, deleteNotification };
}
