import React from 'react'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { useTranslation } from '../i18n'
import PageShell from '../components/Layout/PageShell'
import HelpAnchor from '../components/Help/HelpAnchor'
import EmptyState from '../components/shared/EmptyState'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { Spinner } from '../components/shared/Spinner'
import NotificationDayList from '../components/Notifications/NotificationDayList'
import { useInAppNotifications } from './inAppNotifications/useInAppNotifications'

export default function InAppNotificationsPage(): React.ReactElement {
  // ViewportRoute in App.tsx picks the branch now, so the phone screen is a
  // chunk of its own instead of a dead limb in this one.
  return <InAppNotificationsPageDesktop />
}

function InAppNotificationsPageDesktop(): React.ReactElement {
  const { t } = useTranslation()
  // Page = wiring container: store, filter, fetch + infinite scroll live in the hook.
  const {
    notifications, unreadCount, total, isLoading, hasMore,
    unreadOnly, setUnreadOnly, loaderRef, displayed,
    markAllRead, confirmingDeleteAll, requestDeleteAll, cancelDeleteAll, confirmDeleteAll,
  } = useInAppNotifications()

  return (
    <PageShell background="var(--bg-primary)">
      <HelpAnchor id="notifications" />
      <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header: a tile, the name with how many are unread, the count under it, the bulk tools at the end. */}
          <div className="flex items-center gap-4 mb-6">
            <span className="grid place-items-center w-12 h-12 rounded-2xl bg-accent-subtle text-accent flex-shrink-0">
              <Bell className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <h1 className="flex items-center gap-2 text-title font-semibold text-content">
                {t('notifications.title')}
                {unreadCount > 0 && (
                  <span className="px-2 h-6 inline-flex items-center rounded-full text-caption font-semibold tabular-nums bg-accent text-accent-text">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-body mt-0.5 text-content-muted">
                {total} {t('notifications.countLabel', { count: total })}
              </p>
            </div>

            {/* Bulk actions */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-body font-medium transition-colors text-content bg-surface-card border border-edge hover:bg-surface-hover focus-visible:bg-surface-hover"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('notifications.markAllRead')}</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button type="button"
                  onClick={requestDeleteAll}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-body font-medium transition-colors text-danger bg-surface-card border border-edge hover:bg-danger-soft focus-visible:bg-danger-soft"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('notifications.deleteAll')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter: one segmented control rather than two loose buttons. */}
          <div className="inline-flex gap-1 p-1 mb-4 rounded-xl bg-surface-secondary" role="group" aria-label={t('notifications.title')}>
            <button type="button"
              onClick={() => setUnreadOnly(false)}
              aria-pressed={!unreadOnly}
              className={`h-8 px-3.5 rounded-lg text-body font-medium transition-colors ${!unreadOnly ? 'bg-surface-card text-content shadow-sm' : 'text-content-muted hover:text-content'}`}
            >
              {t('notifications.all')}
            </button>
            <button type="button"
              onClick={() => setUnreadOnly(true)}
              aria-pressed={unreadOnly}
              className={`h-8 px-3.5 rounded-lg text-body font-medium transition-colors ${unreadOnly ? 'bg-surface-card text-content shadow-sm' : 'text-content-muted hover:text-content'}`}
            >
              {t('notifications.unreadOnly')}
            </button>
          </div>

          {/* The list, one card per day. */}
          {isLoading && displayed.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="w-6 h-6 border-2 border-edge border-t-current" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="rounded-2xl border border-edge bg-surface-card">
              <EmptyState scene="notifications" title={t('notifications.empty')} />
            </div>
          ) : (
            <NotificationDayList notifications={displayed} />
          )}

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={loaderRef} className="flex items-center justify-center py-4">
              {isLoading && <Spinner className="w-5 h-5 border-2 border-edge border-t-current" />}
            </div>
          )}
        </div>
      <ConfirmDialog
        isOpen={confirmingDeleteAll}
        onClose={cancelDeleteAll}
        onConfirm={confirmDeleteAll}
        title={t('notifications.deleteAllConfirmTitle')}
        message={t('notifications.deleteAllConfirmText')}
        confirmLabel={t('notifications.deleteAll')}
      />
    </PageShell>
  )
}
