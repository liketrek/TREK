import { useState } from 'react';
import { useNavigate } from 'react-router';

import { type InAppNotification, useInAppNotificationStore } from '../../store/inAppNotificationStore';

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
 * follow its link (marking it read first), mark it read and delete it.
 */
export function useNotificationItemActions(notification: InAppNotification, onClose?: () => void) {
  const navigate = useNavigate();
  const [responding, setResponding] = useState(false);
  const { markRead, deleteNotification, respondToBoolean } = useInAppNotificationStore();

  const handleRespond = async (response: 'positive' | 'negative') => {
    if (responding || notification.response !== null) return;
    setResponding(true);
    await respondToBoolean(notification.id, response);
    setResponding(false);
  };

  const handleNavigate = async () => {
    if (!notification.is_read) await markRead(notification.id);
    if (notification.navigate_target) {
      navigate(notification.navigate_target);
      onClose?.();
    }
  };

  return { responding, handleRespond, handleNavigate, markRead, deleteNotification };
}
