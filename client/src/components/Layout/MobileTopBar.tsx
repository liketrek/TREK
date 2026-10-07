import { Bell, LogOut, Settings, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { useTranslation } from '../../i18n';
import { useAuthStore } from '../../store/authStore';
import { useInAppNotificationStore } from '../../store/inAppNotificationStore';

// Mobile-only: a slim strip at the very top of the dashboard with the
// notification + profile icons (right-aligned). Scrolls with the page.
export default function MobileTopBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const unread = useInAppNotificationStore((s) => s.unreadCount);
  const fetchUnreadCount = useInAppNotificationStore((s) => s.fetchUnreadCount);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchUnreadCount();
  }, [isAuthenticated]);

  return (
    <>
      <div
        className="flex items-center justify-end gap-2 px-4 md:hidden"
        style={{ paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))', paddingBottom: 10 }}
      >
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          aria-label={t('notifications.title')}
          className="relative grid place-items-center rounded-full transition-transform active:scale-95"
          style={{ width: 36, height: 36, color: 'var(--ink-2, #52525b)' }}
        >
          <Bell size={20} strokeWidth={1.9} />
          {unread > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 7,
                right: 7,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'oklch(0.7 0.17 38)',
                boxShadow: '0 0 0 2px var(--bg, #fff)',
              }}
            />
          )}
        </button>
        <button
          type="button"
          onClick={() => setShowProfile(true)}
          aria-label={t('nav.profile')}
          className="grid place-items-center rounded-full text-[12px] font-semibold text-white transition-transform active:scale-95"
          style={{
            width: 34,
            height: 34,
            background: 'linear-gradient(135deg, oklch(0.7 0.14 38), oklch(0.55 0.13 25))',
          }}
        >
          {(user?.username || '?')[0].toUpperCase()}
        </button>
      </div>

      {showProfile && createPortal(<ProfileSheet onClose={() => setShowProfile(false)} />, document.body)}
    </>
  );
}

function ProfileSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    onClose();
    navigate(path);
  };
  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-[300] md:hidden" role="presentation" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-t-2xl bg-white dark:bg-zinc-900"
        style={{ animation: 'slideUp 0.25s ease-out', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        role="presentation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pb-2 pt-3">
          <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        <div className="px-6 pb-4 pt-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-[16px] font-bold text-white dark:bg-white dark:text-zinc-900">
              {(user?.username || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-zinc-900 dark:text-white">{user?.username}</p>
              <p className="truncate text-[12px] text-zinc-500">{user?.email}</p>
            </div>
            {user?.role === 'admin' && (
              <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                <Shield size={10} /> Admin
              </span>
            )}
          </div>
        </div>

        <div className="mx-4 h-px bg-zinc-100 dark:bg-zinc-800" />

        <div className="px-2 py-2">
          <button
            type="button"
            onClick={() => handleNav('/settings')}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-800"
          >
            <Settings size={18} className="text-zinc-500" />
            <span className="text-[14px] font-medium text-zinc-900 dark:text-white">{t('nav.bottomSettings')}</span>
          </button>

          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => handleNav('/admin')}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-800"
            >
              <Shield size={18} className="text-zinc-500" />
              <span className="text-[14px] font-medium text-zinc-900 dark:text-white">{t('nav.bottomAdmin')}</span>
            </button>
          )}
        </div>

        <div className="mx-4 h-px bg-zinc-100 dark:bg-zinc-800" />

        <div className="px-2 py-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-red-50 active:bg-red-100 dark:hover:bg-red-900/20"
          >
            <LogOut size={18} className="text-red-500" />
            <span className="text-[14px] font-medium text-red-600 dark:text-red-400">{t('nav.bottomLogout')}</span>
          </button>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
