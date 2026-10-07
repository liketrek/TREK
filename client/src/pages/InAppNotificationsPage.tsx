import { CheckCheck, Trash2 } from 'lucide-react';
import React from 'react';
import PageShell from '../components/Layout/PageShell';
import InAppNotificationItem from '../components/Notifications/InAppNotificationItem.tsx';
import EmptyState from '../components/shared/EmptyState';
import { Spinner } from '../components/shared/Spinner';
import { useTranslation } from '../i18n';
import { useInAppNotifications } from './inAppNotifications/useInAppNotifications';

export default function InAppNotificationsPage(): React.ReactElement {
  // ViewportRoute in App.tsx picks the branch now, so the phone screen is a
  // chunk of its own instead of a dead limb in this one.
  return <InAppNotificationsPageDesktop />;
}

function InAppNotificationsPageDesktop(): React.ReactElement {
  const { t } = useTranslation();
  // Page = wiring container: store, filter, fetch + infinite scroll live in the hook.
  const {
    notifications,
    unreadCount,
    total,
    isLoading,
    hasMore,
    unreadOnly,
    setUnreadOnly,
    loaderRef,
    displayed,
    markAllRead,
    deleteAll,
  } = useInAppNotifications();

  return (
    <PageShell background="var(--bg-primary)">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-content">
              {t('notifications.title')}
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-content px-2 py-0.5 align-middle text-xs font-medium text-surface">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="mt-0.5 text-sm text-content-muted">
              {total} {total === 1 ? 'notification' : 'notifications'}
            </p>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1.5 rounded-lg bg-surface-hover px-3 py-1.5 text-sm text-content-secondary transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              >
                <CheckCheck className="h-4 w-4" />
                <span className="hidden sm:inline">{t('notifications.markAllRead')}</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={deleteAll}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-red-500 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('notifications.deleteAll')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter toggle */}
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setUnreadOnly(false)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${!unreadOnly ? 'bg-content text-surface' : 'bg-surface-hover text-content-secondary'}`}
          >
            {t('notifications.all')}
          </button>
          <button
            type="button"
            onClick={() => setUnreadOnly(true)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${unreadOnly ? 'bg-content text-surface' : 'bg-surface-hover text-content-secondary'}`}
          >
            {t('notifications.unreadOnly')}
          </button>
        </div>

        {/* Notification list */}
        <div className="overflow-hidden rounded-xl border border-edge bg-surface-card">
          {isLoading && displayed.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="h-6 w-6 border-2 border-slate-200 border-t-current" />
            </div>
          ) : displayed.length === 0 ? (
            <EmptyState scene="notifications" title={t('notifications.empty')} />
          ) : (
            displayed.map((n) => <InAppNotificationItem key={n.id} notification={n} />)
          )}

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={loaderRef} className="flex items-center justify-center py-4">
              {isLoading && <Spinner className="h-5 w-5 border-2 border-slate-200 border-t-current" />}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
