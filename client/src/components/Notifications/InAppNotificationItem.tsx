import { ArrowRight, Check, CheckCheck, Trash2, User, X } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../../i18n';
import { InAppNotification, useInAppNotificationStore } from '../../store/inAppNotificationStore';
import { useSettingsStore } from '../../store/settingsStore';

function relativeTime(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return locale === 'ar' ? 'الآن' : 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface NotificationItemProps {
  notification: InAppNotification;
  onClose?: () => void;
}

export default function InAppNotificationItem({ notification, onClose }: NotificationItemProps): React.ReactElement {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const darkMode = settings.dark_mode;
  const dark =
    darkMode === true ||
    darkMode === 'dark' ||
    (darkMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [responding, setResponding] = useState(false);

  const { markRead, markUnread, deleteNotification, respondToBoolean } = useInAppNotificationStore();

  const handleNavigate = async () => {
    if (!notification.is_read) await markRead(notification.id);
    if (notification.navigate_target) {
      navigate(notification.navigate_target);
      onClose?.();
    }
  };

  const handleRespond = async (response: 'positive' | 'negative') => {
    if (responding || notification.response !== null) return;
    setResponding(true);
    await respondToBoolean(notification.id, response);
    setResponding(false);
  };

  const titleText = t(notification.title_key, notification.title_params);
  const bodyText = t(notification.text_key, notification.text_params);
  const hasUnknownTitle = titleText === notification.title_key;
  const hasUnknownBody = bodyText === notification.text_key;

  return (
    <div
      className="relative border-b border-edge-secondary px-4 py-3 transition-colors"
      style={{
        background: notification.is_read ? 'transparent' : dark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.05)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Sender avatar */}
        <div className="mt-0.5 flex-shrink-0">
          {notification.sender_avatar ? (
            <img src={notification.sender_avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-content-muted"
              style={{ background: dark ? '#27272a' : '#f1f5f9' }}
            >
              {notification.sender_username ? (
                notification.sender_username.charAt(0).toUpperCase()
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug text-content">
              {hasUnknownTitle ? notification.title_key : titleText}
            </p>
            <div className="flex flex-shrink-0 items-center gap-0.5">
              <span className="mr-1 text-xs text-content-faint">{relativeTime(notification.created_at, locale)}</span>
              {!notification.is_read && (
                <button
                  type="button"
                  onClick={() => markRead(notification.id)}
                  title={t('notifications.markRead')}
                  className="rounded p-1 transition-colors"
                  style={{ color: 'var(--text-faint)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-faint)';
                  }}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => deleteNotification(notification.id)}
                title={t('notifications.delete')}
                className="rounded p-1 transition-colors"
                style={{ color: 'var(--text-faint)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-faint)';
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <p className="mt-0.5 text-xs leading-relaxed text-content-muted">
            {hasUnknownBody ? notification.text_key : bodyText}
          </p>

          {/* Boolean actions */}
          {notification.type === 'boolean' && notification.positive_text_key && notification.negative_text_key && (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleRespond('positive')}
                disabled={responding || notification.response !== null}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  background:
                    notification.response === 'positive' ? 'var(--text-primary)' : dark ? '#27272a' : '#f1f5f9',
                  color:
                    notification.response === 'positive'
                      ? '#fff'
                      : notification.response === 'negative'
                        ? 'var(--text-faint)'
                        : 'var(--text-secondary)',
                  opacity: notification.response === 'negative' ? 0.5 : 1,
                  cursor: notification.response !== null || responding ? 'default' : 'pointer',
                }}
              >
                <Check className="h-3 w-3" />
                {t(notification.positive_text_key)}
              </button>
              <button
                type="button"
                onClick={() => handleRespond('negative')}
                disabled={responding || notification.response !== null}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  background: notification.response === 'negative' ? '#ef4444' : dark ? '#27272a' : '#f1f5f9',
                  color:
                    notification.response === 'negative'
                      ? '#fff'
                      : notification.response === 'positive'
                        ? 'var(--text-faint)'
                        : 'var(--text-secondary)',
                  opacity: notification.response === 'positive' ? 0.5 : 1,
                  cursor: notification.response !== null || responding ? 'default' : 'pointer',
                }}
              >
                <X className="h-3 w-3" />
                {t(notification.negative_text_key)}
              </button>
            </div>
          )}

          {/* Navigate action */}
          {notification.type === 'navigate' && notification.navigate_text_key && notification.navigate_target && (
            <button
              type="button"
              onClick={handleNavigate}
              className="mt-2 flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
              style={{ background: dark ? '#27272a' : '#f1f5f9', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = dark ? '#27272a' : '#f1f5f9')}
            >
              <ArrowRight className="h-3 w-3" />
              {t(notification.navigate_text_key)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
