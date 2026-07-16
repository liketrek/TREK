import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Bell, Check, Trash2, X } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useInAppNotificationStore, InAppNotification } from '../../../store/inAppNotificationStore'
import MChip from '../../components/MChip'

/** Compact relative timestamp ("5m" / "3h" / "2d"), locale-neutral like the desktop item. */
function compactTime(dateStr: string, justNow: string): string {
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (minutes < 1) return justNow
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

interface MNotificationRowProps {
  notification: InAppNotification
}

/**
 * One notification as a widget-panel row (avatar tile, title + Geist subtext,
 * --m-rowbr divider). Tapping the row marks it read; boolean/navigate actions
 * render as chips below the text, per-row delete sits in the trailing column.
 */
export default function MNotificationRow({ notification }: MNotificationRowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [responding, setResponding] = useState(false)
  const { markRead, deleteNotification, respondToBoolean } = useInAppNotificationStore()

  const title = t(notification.title_key, notification.title_params)
  const body = t(notification.text_key, notification.text_params)

  const handleRespond = async (response: 'positive' | 'negative') => {
    if (responding || notification.response !== null) return
    setResponding(true)
    await respondToBoolean(notification.id, response)
    setResponding(false)
  }

  const handleNavigate = async () => {
    if (!notification.is_read) await markRead(notification.id)
    if (notification.navigate_target) navigate(notification.navigate_target)
  }

  return (
    <div
      className="flex items-start gap-[11px] border-b border-[color:var(--m-rowbr)] py-3 last:border-b-0"
      onClick={() => { if (!notification.is_read) markRead(notification.id) }}
    >
      {notification.sender_avatar ? (
        <img src={notification.sender_avatar} alt="" className="h-8 w-8 flex-none rounded-full object-cover" />
      ) : (
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-[0.75rem] font-bold text-m-ink">
          {notification.sender_username
            ? notification.sender_username.charAt(0).toUpperCase()
            : <Bell size={14} strokeWidth={2} className="text-m-muted" />}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem] font-semibold leading-snug text-m-ink">{title}</p>
        <p className="mt-[2px] font-geist text-[0.65625rem] leading-relaxed text-m-muted">{body}</p>

        {notification.type === 'boolean' && notification.positive_text_key && notification.negative_text_key && (
          <div className="mt-2 flex gap-[6px]" onClick={e => e.stopPropagation()}>
            <MChip
              active={notification.response === 'positive'}
              onClick={() => handleRespond('positive')}
              className={notification.response === 'negative' ? 'opacity-50' : ''}
            >
              <Check size={12} strokeWidth={2.2} />
              {t(notification.positive_text_key)}
            </MChip>
            <MChip
              active={notification.response === 'negative'}
              onClick={() => handleRespond('negative')}
              className={notification.response === 'positive' ? 'opacity-50' : ''}
            >
              <X size={12} strokeWidth={2.2} />
              {t(notification.negative_text_key)}
            </MChip>
          </div>
        )}

        {notification.type === 'navigate' && notification.navigate_text_key && notification.navigate_target && (
          <div className="mt-2" onClick={e => e.stopPropagation()}>
            <MChip onClick={handleNavigate}>
              <ArrowRight size={12} strokeWidth={2.2} />
              {t(notification.navigate_text_key)}
            </MChip>
          </div>
        )}
      </div>

      <div className="flex flex-none flex-col items-end gap-[6px]">
        <div className="flex items-center gap-[6px]">
          {!notification.is_read && (
            <span aria-hidden className="h-[7px] w-[7px] flex-none rounded-full bg-m-ink" />
          )}
          <span className="font-geist text-[0.625rem] font-semibold text-m-faint">
            {compactTime(notification.created_at, t('common.justNow'))}
          </span>
        </div>
        <button
          type="button"
          aria-label={t('notifications.delete')}
          onClick={e => { e.stopPropagation(); deleteNotification(notification.id) }}
          className="flex h-7 w-7 items-center justify-center rounded-full text-m-faint active:bg-[color:var(--m-ic)]"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
