import React from 'react'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { useTranslation } from '../i18n'
import PageShell from '../components/Layout/PageShell'
import { Spinner } from '../components/shared/Spinner'
import InAppNotificationItem from '../components/Notifications/InAppNotificationItem.tsx'
import { useInAppNotifications } from './inAppNotifications/useInAppNotifications'

export default function InAppNotificationsPage(): React.ReactElement {
  const { t } = useTranslation()
  // Page = wiring container: store, filter, fetch + infinite scroll live in the hook.
  const {
    notifications, unreadCount, total, isLoading, hasMore,
    unreadOnly, setUnreadOnly, loaderRef, displayed,
    markAllRead, deleteAll,
  } = useInAppNotifications()

  return (
    <PageShell background="var(--bg-primary)">
      <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-content">
                {t('notifications.title')}
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium align-middle inline-flex items-center justify-center bg-content text-surface">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-sm mt-0.5 text-content-muted">
                {total} {total === 1 ? 'notification' : 'notifications'}
              </p>
            </div>

            {/* Bulk actions */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors text-content-secondary bg-surface-hover"
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('notifications.markAllRead')}</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={deleteAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('notifications.deleteAll')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setUnreadOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!unreadOnly ? 'bg-content text-surface' : 'bg-surface-hover text-content-secondary'}`}
            >
              {t('notifications.all')}
            </button>
            <button
              onClick={() => setUnreadOnly(true)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${unreadOnly ? 'bg-content text-surface' : 'bg-surface-hover text-content-secondary'}`}
            >
              {t('notifications.unreadOnly')}
            </button>
          </div>

          {/* Notification list */}
          <div className="rounded-xl border overflow-hidden border-edge bg-surface-card">
            {isLoading && displayed.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Spinner className="w-6 h-6 border-2 border-slate-200 border-t-current" />
              </div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
                <Bell className="w-12 h-12 text-content-faint" />
                <p className="text-base font-medium text-content-muted">{t('notifications.empty')}</p>
                <p className="text-sm text-content-faint">{t('notifications.emptyDescription')}</p>
              </div>
            ) : (
              displayed.map(n => (
                <InAppNotificationItem key={n.id} notification={n} />
              ))
            )}

            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={loaderRef} className="flex items-center justify-center py-4">
                {isLoading && <Spinner className="w-5 h-5 border-2 border-slate-200 border-t-current" />}
              </div>
            )}
          </div>
        </div>
    </PageShell>
  )
}
