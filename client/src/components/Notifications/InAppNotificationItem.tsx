import React from 'react'
import { User, Check, X, ArrowRight, Trash2, CheckCheck, Mail } from 'lucide-react'
import { useTranslation } from '../../i18n'
import type { InAppNotification } from '../../store/inAppNotificationStore'
import { compactTime, useNotificationItemActions } from './useNotificationItemActions'

function relativeTime(dateStr: string, locale: string): string {
  return compactTime(dateStr, locale === 'ar' ? 'الآن' : 'just now')
}

interface NotificationItemProps {
  notification: InAppNotification
  onClose?: () => void
}

/** The round tool beside a notification, quiet until it is pointed at. */
const TOOL = 'grid place-items-center w-7 h-7 rounded-lg transition-colors text-content-faint hover:text-content hover:bg-surface-card focus-visible:bg-surface-card focus-visible:text-content'

/** An answer or a way on, as a pill under the words. */
const PILL = 'inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-caption font-medium transition-colors'

/**
 * One notification, as a card in the list: who sent it, what it says, and what
 * can be done with it. Unread ones carry a dot in the accent and a faint
 * ground; the tools to mark and delete come forward when the card is pointed
 * at or focused, so a list reads as messages rather than as rows of buttons.
 */
export default function InAppNotificationItem({ notification, onClose }: NotificationItemProps): React.ReactElement {
  const { t, locale } = useTranslation()
  const { responding, handleRespond, handleNavigate, markRead, markUnread, deleteNotification } =
    useNotificationItemActions(notification, onClose)

  const titleText = t(notification.title_key, notification.title_params)
  const bodyText = t(notification.text_key, notification.text_params)
  const hasUnknownTitle = titleText === notification.title_key
  const hasUnknownBody = bodyText === notification.text_key
  const unread = !notification.is_read
  const answered = notification.response !== null

  return (
    <div
      className={`group relative mx-2 my-1 rounded-xl px-3 py-3 transition-colors hover:bg-surface-hover focus-within:bg-surface-hover ${unread ? 'bg-surface-secondary' : ''}`}
    >
      {unread && <span aria-hidden className="absolute start-1 top-5 w-1.5 h-1.5 rounded-full bg-accent" />}

      <div className="flex gap-3 items-start">
        {/* Sender avatar */}
        <div className="flex-shrink-0">
          {notification.sender_avatar ? (
            <img src={notification.sender_avatar} alt="" className="w-9 h-9 rounded-xl object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-body font-semibold text-accent bg-accent-subtle">
              {notification.sender_username
                ? notification.sender_username.charAt(0).toUpperCase()
                : <User className="w-4 h-4" />}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-body leading-snug text-content ${unread ? 'font-semibold' : 'font-medium'}`}>
              {hasUnknownTitle ? notification.title_key : titleText}
            </p>
            <div className="relative flex-shrink-0 h-7 flex items-center">
              <span className="text-caption tabular-nums text-content-faint transition-opacity group-hover:opacity-0 group-focus-within:opacity-0">
                {relativeTime(notification.created_at, locale)}
              </span>
              <div className="absolute end-0 top-0 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                {notification.is_read ? (
                  <button type="button" onClick={() => markUnread(notification.id)} title={t('notifications.markUnread')} aria-label={t('notifications.markUnread')} className={TOOL}>
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button type="button" onClick={() => markRead(notification.id)} title={t('notifications.markRead')} aria-label={t('notifications.markRead')} className={TOOL}>
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteNotification(notification.id)}
                  title={t('notifications.delete')}
                  aria-label={t('notifications.delete')}
                  className={`${TOOL} hover:text-danger focus-visible:text-danger`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-caption mt-0.5 leading-relaxed text-content-muted">
            {hasUnknownBody ? notification.text_key : bodyText}
          </p>

          {/* Boolean actions */}
          {notification.type === 'boolean' && notification.positive_text_key && notification.negative_text_key && (
            <div className="flex gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => handleRespond('positive')}
                disabled={responding || answered}
                className={`${PILL} ${
                  notification.response === 'positive'
                    ? 'bg-accent text-accent-text'
                    : `bg-surface-card shadow-sm ${notification.response === 'negative' ? 'text-content-faint opacity-50' : 'text-content hover:bg-surface-tertiary'}`
                } ${answered || responding ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <Check className="w-3.5 h-3.5" />
                {t(notification.positive_text_key)}
              </button>
              <button
                type="button"
                onClick={() => handleRespond('negative')}
                disabled={responding || answered}
                className={`${PILL} ${
                  notification.response === 'negative'
                    ? 'bg-danger text-white'
                    : `bg-surface-card shadow-sm ${notification.response === 'positive' ? 'text-content-faint opacity-50' : 'text-content hover:bg-surface-tertiary'}`
                } ${answered || responding ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <X className="w-3.5 h-3.5" />
                {t(notification.negative_text_key)}
              </button>
            </div>
          )}

          {/* Navigate action */}
          {notification.type === 'navigate' && notification.navigate_text_key && notification.navigate_target && (
            <button
              type="button"
              onClick={handleNavigate}
              className={`${PILL} mt-2.5 bg-surface-card shadow-sm text-content hover:bg-accent hover:text-accent-text focus-visible:bg-accent focus-visible:text-accent-text`}
            >
              {t(notification.navigate_text_key)}
              <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
