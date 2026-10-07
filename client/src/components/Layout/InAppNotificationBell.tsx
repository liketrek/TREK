import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { useTranslation } from '../../i18n';
import { useAuthStore } from '../../store/authStore';
import { useInAppNotificationStore } from '../../store/inAppNotificationStore.ts';
import { useSettingsStore } from '../../store/settingsStore';
import InAppNotificationItem from '../Notifications/InAppNotificationItem.tsx';

export default function InAppNotificationBell(): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const darkMode = settings.dark_mode;
  const dark =
    darkMode === true ||
    darkMode === 'dark' ||
    (darkMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { notifications, unreadCount, isLoading, fetchNotifications, fetchUnreadCount, markAllRead, deleteAll } =
    useInAppNotificationStore();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  const handleOpen = () => {
    if (!open) {
      fetchNotifications(true);
    }
    setOpen((v) => !v);
  };

  const handleShowAll = () => {
    setOpen(false);
    navigate('/notifications');
  };

  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={handleOpen}
        title={t('notifications.title')}
        className="relative rounded-lg p-2 text-content-muted transition-colors"
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full font-bold text-white"
            style={{
              background: '#ef4444',
              fontSize: 'calc(9px * var(--fs-scale-caption, 1))',
              minWidth: 14,
              height: 14,
              padding: '0 3px',
              lineHeight: 1,
            }}
          >
            {displayCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <>
            {/* Click-away catcher only — the bell button itself closes the panel again from the keyboard. */}
            <div
              role="presentation"
              style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
              onClick={() => setOpen(false)}
            />
            <div
              className="overflow-hidden rounded-xl border border-edge bg-surface-card shadow-xl"
              style={{
                position: 'fixed',
                top: 'var(--nav-h)',
                right: 8,
                width: 360,
                maxWidth: 'calc(100vw - 16px)',
                maxHeight: 'min(480px, calc(100vh - var(--nav-h) - 16px))',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div className="flex flex-shrink-0 items-center justify-between border-b border-edge-secondary px-4 py-3">
                <span className="text-sm font-semibold text-content">
                  {t('notifications.title')}
                  {unreadCount > 0 && (
                    <span className="ml-2 rounded-full bg-content px-1.5 py-0.5 text-xs font-medium text-surface">
                      {unreadCount}
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      title={t('notifications.markAllRead')}
                      className="rounded-lg p-1.5 text-content-muted transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={deleteAll}
                      title={t('notifications.deleteAll')}
                      className="rounded-lg p-1.5 text-content-muted transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification list */}
              <div className="flex-1 overflow-y-auto">
                {isLoading && notifications.length === 0 ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-edge border-t-content" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                    <Bell className="h-8 w-8 text-content-faint" />
                    <p className="text-sm font-medium text-content-muted">{t('notifications.empty')}</p>
                    <p className="text-xs text-content-faint">{t('notifications.emptyDescription')}</p>
                  </div>
                ) : (
                  notifications
                    .slice(0, 10)
                    .map((n) => <InAppNotificationItem key={n.id} notification={n} onClose={() => setOpen(false)} />)
                )}
              </div>

              {/* Footer */}
              <button
                type="button"
                onClick={handleShowAll}
                className="w-full flex-shrink-0 border-t border-edge-secondary py-2.5 text-xs font-medium text-content transition-colors"
                style={{
                  background: 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {t('notifications.showAll')}
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
