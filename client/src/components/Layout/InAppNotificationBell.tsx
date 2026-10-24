import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { Bell, Trash2, CheckCheck } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useInAppNotificationStore } from '../../store/inAppNotificationStore.ts'
import { useAuthStore } from '../../store/authStore'
import NotificationDayList from '../Notifications/NotificationDayList'
import ConfirmDialog from '../shared/ConfirmDialog'

export default function InAppNotificationBell(): React.ReactElement {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const { notifications, unreadCount, isLoading, fetchNotifications, fetchUnreadCount, markAllRead, deleteAll } = useInAppNotificationStore()

  const [open, setOpen] = useState(false)
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount()
    }
  }, [isAuthenticated])

  const handleOpen = () => {
    if (!open) {
      fetchNotifications(true)
    }
    setOpen(v => !v)
  }

  const handleShowAll = () => {
    setOpen(false)
    navigate('/notifications')
  }

  const displayCount = unreadCount > 99 ? '99+' : unreadCount

  return (
    <div className="relative flex-shrink-0">
      <button type="button"
        onClick={handleOpen}
        title={t('notifications.title')}
        className="relative p-2 rounded-lg transition-colors text-content-muted hover:bg-surface-hover focus-visible:bg-surface-hover"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute -top-1.5 -end-1.5 flex items-center justify-center rounded-full bg-danger text-white font-bold tabular-nums ring-2 ring-surface-card"
            style={{
              fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))',
              minWidth: 20,
              height: 20,
              padding: '0 5px',
              lineHeight: 1,
            }}
          >
            {displayCount}
          </span>
        )}
      </button>

      {open && createPortal(
        <>
          {/* Click-away catcher only — the bell button itself closes the panel again from the keyboard. */}
          <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div
            className="rounded-2xl shadow-xl border overflow-hidden bg-surface-card border-edge"
            style={{
              position: 'fixed',
              top: 'var(--nav-h)',
              insetInlineEnd: 8,
              width: 400,
              maxWidth: 'calc(100vw - 16px)',
              maxHeight: 'min(560px, calc(100vh - var(--nav-h) - 16px))',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header: the dialogs' head, a tile, the name and how many are unread, the tools at the end. */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-accent-subtle text-accent flex-shrink-0">
                <Bell className="w-4 h-4" />
              </span>
              <span className="flex-1 min-w-0 flex items-center gap-2 text-subtitle font-semibold text-content">
                {t('notifications.title')}
                {unreadCount > 0 && (
                  <span className="px-2 h-5 inline-flex items-center rounded-full text-caption font-semibold tabular-nums bg-accent text-accent-text">
                    {unreadCount}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button type="button"
                    onClick={markAllRead}
                    title={t('notifications.markAllRead')}
                    aria-label={t('notifications.markAllRead')}
                    className="grid place-items-center w-8 h-8 rounded-lg transition-colors text-content-muted bg-surface-secondary hover:bg-surface-hover hover:text-content focus-visible:bg-surface-hover"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button type="button"
                    onClick={() => setConfirmingDeleteAll(true)}
                    title={t('notifications.deleteAll')}
                    aria-label={t('notifications.deleteAll')}
                    className="grid place-items-center w-8 h-8 rounded-lg transition-colors text-content-muted bg-surface-secondary hover:bg-danger-soft hover:text-danger focus-visible:bg-danger-soft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto flex-1 pb-1 border-t border-edge-secondary">
              {isLoading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 rounded-full animate-spin border-edge border-t-content" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-2">
                  <span className="grid place-items-center w-12 h-12 rounded-2xl bg-surface-secondary text-content-faint">
                    <Bell className="w-5 h-5" />
                  </span>
                  <p className="text-body font-semibold text-content">{t('notifications.empty')}</p>
                  <p className="text-caption text-content-muted">{t('notifications.emptyDescription')}</p>
                </div>
              ) : (
                <NotificationDayList notifications={notifications.slice(0, 10)} onClose={() => setOpen(false)} compact />
              )}
            </div>

            {/* Footer */}
            <div className="p-2 flex-shrink-0 border-t border-edge-secondary">
              <button type="button"
                onClick={handleShowAll}
                className="w-full h-9 rounded-xl text-body font-medium transition-colors bg-surface-secondary text-content hover:bg-surface-hover focus-visible:bg-surface-hover"
              >
                {t('notifications.showAll')}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
      <ConfirmDialog
        isOpen={confirmingDeleteAll}
        onClose={() => setConfirmingDeleteAll(false)}
        onConfirm={() => { setConfirmingDeleteAll(false); void deleteAll() }}
        title={t('notifications.deleteAllConfirmTitle')}
        message={t('notifications.deleteAllConfirmText')}
        confirmLabel={t('notifications.deleteAll')}
      />
    </div>
  )
}
