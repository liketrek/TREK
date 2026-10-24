import React from 'react'
import { Check, X, ArrowRight, Trash2, CheckCheck, Mail } from 'lucide-react'
import { useTranslation } from '../../i18n'
import type { InAppNotification } from '../../store/inAppNotificationStore'
import { compactTime, useNotificationItemActions } from './useNotificationItemActions'
import { KIND_LOOK, createdAt, kindOf } from './notificationModel'

interface NotificationItemProps {
  notification: InAppNotification
  onClose?: () => void
}

/** The quiet tool beside a notification, forward only when it is pointed at. */
const TOOL = 'grid place-items-center w-7 h-7 rounded-lg transition-colors text-content-faint hover:text-content hover:bg-surface-secondary focus-visible:bg-surface-secondary focus-visible:text-content'

/** An answer or a way on, as a button under the words. */
const ACTION = 'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-caption font-semibold transition-colors'

/** Under an hour it reads "5m"; after that the clock time, since the list is headed by its day. */
function timeOf(value: string, locale: string, justNow: string): string {
  const date = createdAt(value)
  if (Date.now() - date.getTime() < 3_600_000) return compactTime(date.toISOString(), justNow)
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date)
}

/** The tile on the start side: the kind's symbol on its colour, and who sent it as a small face on its corner. */
function KindTile({ notification }: { notification: InAppNotification }) {
  const { icon: Icon, tone } = KIND_LOOK[kindOf(notification.title_key)]
  const initial = notification.sender_username?.charAt(0).toUpperCase()
  return (
    <span className="relative block self-start flex-shrink-0">
      <span className={`grid place-items-center w-10 h-10 rounded-xl ${tone}`}>
        <Icon className="w-[18px] h-[18px]" aria-hidden />
      </span>
      {notification.sender_avatar ? (
        <img src={notification.sender_avatar} alt="" className="absolute -bottom-1 -end-1 w-5 h-5 rounded-full object-cover ring-2 ring-surface-card" />
      ) : initial ? (
        <span aria-hidden className="absolute -bottom-1 -end-1 grid place-items-center w-5 h-5 rounded-full text-caption leading-none font-bold bg-accent text-accent-text ring-2 ring-surface-card">
          {initial}
        </span>
      ) : null}
    </span>
  )
}

/**
 * One notification: a tile that says at a glance what it is about and who sent
 * it, the message itself, and what can be done with it. Unread ones are set in
 * bold with a dot in the accent; marking and deleting come forward when the row
 * is pointed at or focused, so a list reads as messages rather than as buttons.
 */
export default function InAppNotificationItem({ notification, onClose }: NotificationItemProps): React.ReactElement {
  const { t, locale } = useTranslation()
  const { responding, handleRespond, handleNavigate, markRead, markUnread, deleteNotification } =
    useNotificationItemActions(notification, onClose)

  const titleText = t(notification.title_key, notification.title_params)
  const bodyText = t(notification.text_key, notification.text_params)
  const unread = !notification.is_read
  const answered = notification.response !== null
  const { positive_text_key: yesKey, negative_text_key: noKey, navigate_text_key: goKey } = notification
  const asks = notification.type === 'boolean' && yesKey && noKey
  const leads = notification.type === 'navigate' && goKey && notification.navigate_target

  return (
    <div className="group relative flex gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-hover focus-within:bg-surface-hover">
      <KindTile notification={notification} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-body leading-snug text-content ${unread ? 'font-semibold' : 'font-medium'}`}>{titleText}</p>
          <div className="relative flex-shrink-0 h-6 flex items-center gap-2">
            <span className="text-caption tabular-nums text-content-faint transition-opacity group-hover:opacity-0 group-focus-within:opacity-0">
              {timeOf(notification.created_at, locale, t('common.justNow'))}
            </span>
            {unread && (
              <span aria-hidden className="w-2 h-2 rounded-full bg-accent transition-opacity group-hover:opacity-0 group-focus-within:opacity-0" />
            )}
            <div className="absolute end-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
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

        <p className="text-body mt-0.5 leading-relaxed text-content-muted">{bodyText}</p>

        {asks && (
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              onClick={() => handleRespond('positive')}
              disabled={responding || answered}
              className={`${ACTION} ${
                notification.response === 'positive'
                  ? 'bg-success-soft text-success'
                  : answered
                    ? 'border border-edge text-content-faint'
                    : 'bg-accent text-accent-text hover:bg-accent-hover'
              } disabled:cursor-default`}
            >
              <Check className="w-3.5 h-3.5" />
              {t(yesKey)}
            </button>
            <button
              type="button"
              onClick={() => handleRespond('negative')}
              disabled={responding || answered}
              className={`${ACTION} ${
                notification.response === 'negative'
                  ? 'bg-danger-soft text-danger'
                  : answered
                    ? 'border border-edge text-content-faint'
                    : 'border border-edge text-content hover:bg-surface-secondary'
              } disabled:cursor-default`}
            >
              <X className="w-3.5 h-3.5" />
              {t(noKey)}
            </button>
          </div>
        )}

        {leads && (
          <button
            type="button"
            onClick={handleNavigate}
            className={`${ACTION} mt-3 border border-edge text-content hover:bg-accent hover:text-accent-text hover:border-transparent focus-visible:bg-accent focus-visible:text-accent-text`}
          >
            {t(goKey)}
            <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
          </button>
        )}
      </div>
    </div>
  )
}
