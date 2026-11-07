import { useRef } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, CheckCheck, Trash2 } from 'lucide-react'
import MDancingTrek from '../../components/MDancingTrek'
import ConfirmDialog from '../../../components/shared/ConfirmDialog'
import { useTranslation } from '../../../i18n'
import { useInAppNotifications } from '../../../pages/inAppNotifications/useInAppNotifications'
import MGlassBar from '../../components/MGlassBar'
import MIconBtn from '../../components/MIconBtn'
import MSegmented from '../../components/MSegmented'
import MNotificationRow from './MNotificationRow'
import { usePullToRefresh } from '../../usePullToRefresh'
import MPullIndicator from '../../components/MPullIndicator'

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-[color:var(--m-trackoff)] border-t-[color:var(--m-ink)]"
      style={{ width: size, height: size }}
    />
  )
}

/**
 * Mobile notifications screen (/notifications). Glass top bar with back +
 * bulk actions, All/Unread segment, and the list as one dashboard-widget-style
 * card (--m-card, r20, --m-rowbr dividers). Data and infinite scroll come from
 * the same useInAppNotifications hook the desktop page wires up.
 */
export default function MNotifications() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    notifications, unreadCount, isLoading, hasMore,
    unreadOnly, setUnreadOnly, loaderRef, displayed, refresh,
    markAllRead, confirmingDeleteAll, requestDeleteAll, cancelDeleteAll, confirmDeleteAll,
  } = useInAppNotifications()
  const contentRef = useRef<HTMLDivElement>(null)
  const pull = usePullToRefresh(contentRef, refresh)

  return (
    <>
      {/* On a wide window the bar keeps to the column of the list below it. */}
      <MGlassBar className="wide:mx-auto wide:max-w-[760px]">
        <MIconBtn ariaLabel={t('common.back')} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} strokeWidth={2} />
        </MIconBtn>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="truncate text-[0.9375rem] font-bold text-m-ink">{t('notifications.title')}</h1>
          {unreadCount > 0 && (
            <span className="flex-none rounded-full bg-m-act px-[7px] py-[2px] font-geist text-[0.625rem] font-bold text-m-actfg">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <MIconBtn ariaLabel={t('notifications.markAllRead')} onClick={markAllRead}>
            <CheckCheck size={17} strokeWidth={2} />
          </MIconBtn>
        )}
        {notifications.length > 0 && (
          <MIconBtn ariaLabel={t('notifications.deleteAll')} onClick={requestDeleteAll}>
            <Trash2 size={16} strokeWidth={2} className="text-[color:var(--m-st-danger)]" />
          </MIconBtn>
        )}
      </MGlassBar>

      <MPullIndicator state={pull} label={t('common.loading')} />
      <div ref={contentRef} className="px-4 pb-[calc(var(--bottom-nav-h)+24px)] pt-[calc(var(--m-safe-top,12px)+66px)] wide:mx-auto wide:max-w-[808px] wide:px-6">
        <MSegmented
          options={[
            { value: 'all', label: t('notifications.all') },
            { value: 'unread', label: t('notifications.unreadOnly') },
          ]}
          value={unreadOnly ? 'unread' : 'all'}
          onChange={v => setUnreadOnly(v === 'unread')}
        />

        <div className="mt-3 overflow-hidden rounded-[20px] border border-[color:var(--m-cbr)] bg-[color:var(--m-card)] px-[14px]">
          {isLoading && displayed.length === 0 ? (
            <div className="flex justify-center py-14">
              <Spinner size={24} />
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-10 text-center">
              <MDancingTrek scene="notifications" className="mb-2" />
              <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('notifications.empty')}</p>
            </div>
          ) : (
            displayed.map(n => <MNotificationRow key={n.id} notification={n} />)
          )}

          {hasMore && (
            <div ref={loaderRef} className="flex justify-center py-4">
              {isLoading && <Spinner />}
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={confirmingDeleteAll}
        onClose={cancelDeleteAll}
        onConfirm={confirmDeleteAll}
        title={t('notifications.deleteAllConfirmTitle')}
        message={t('notifications.deleteAllConfirmText')}
        confirmLabel={t('notifications.deleteAll')}
      />
    </>
  )
}
