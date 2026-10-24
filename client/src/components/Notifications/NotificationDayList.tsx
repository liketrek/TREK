import React, { useMemo } from 'react';
import { useTranslation } from '../../i18n';
import type { InAppNotification } from '../../store/inAppNotificationStore';
import InAppNotificationItem from './InAppNotificationItem';
import { groupByDay } from './notificationModel';

interface NotificationDayListProps {
  notifications: InAppNotification[];
  /** Closes the bell's panel after a notification led somewhere. */
  onClose?: () => void;
  /** The bell's panel: headings stick to its top and the days need no cards of their own. */
  compact?: boolean;
}

/**
 * The notifications cut into days, each under its heading (Today, Yesterday,
 * a weekday, then the date). On the page every day is a card of its own; in
 * the bell's panel the headings stay at the top while the day scrolls by.
 */
export default function NotificationDayList({
  notifications,
  onClose,
  compact = false,
}: NotificationDayListProps): React.ReactElement {
  const { locale } = useTranslation();
  const groups = useMemo(() => groupByDay(notifications, locale), [notifications, locale]);

  return (
    <div className={compact ? '' : 'flex flex-col gap-6'}>
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <h2
            className={
              compact
                ? 'sticky top-0 z-10 bg-surface-card px-4 pb-1.5 pt-3 text-caption font-semibold text-content-muted'
                : 'mb-2 px-1 text-caption font-semibold text-content-muted'
            }
          >
            {group.label}
          </h2>
          <div
            className={
              compact
                ? 'divide-y divide-edge-secondary'
                : 'divide-y divide-edge-secondary overflow-hidden rounded-2xl border border-edge bg-surface-card'
            }
          >
            {group.items.map((n) => (
              <InAppNotificationItem key={n.id} notification={n} onClose={onClose} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
