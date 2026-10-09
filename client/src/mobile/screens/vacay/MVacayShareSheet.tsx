import { ChevronDown, Eye, EyeOff, Loader2, Share2, X } from 'lucide-react'
import MSheet from '../../components/MSheet'
import MIconBtn from '../../components/MIconBtn'
import MUserPickerList from '../../components/MUserPickerList'
import { useVacayStore } from '../../../store/vacayStore'
import { useTranslation } from '../../../i18n'
import { useVacayShareActions } from '../../../components/Vacay/useVacayShareActions'
import { useVacayUserPicker } from '../../../components/Vacay/useVacayUserPicker'

interface MVacayShareSheetProps {
  open: boolean
  onClose: () => void
}

/**
 * Read-only calendar sharing sheet (#444/#667): share your own calendar with
 * another TREK user (view only, no fusion), see who shares with you (with a
 * per-person overlay eye toggle) and stop shares in both directions.
 */
export default function MVacayShareSheet({ open, onClose }: MVacayShareSheetProps) {
  const { t } = useTranslation()
  const { incomingShares, outgoingShares, shareWith } = useVacayStore()
  const { available, selected, setSelected, selectedUser, sending, send, pickerOpen, togglePicker, pick } = useVacayUserPicker({
    endpoint: '/addons/vacay/shares/available-users',
    submit: shareWith,
    successKey: 'vacay.shareSent',
    errorKey: 'vacay.shareFailed',
    sheetOpen: open,
  })
  const { toggleHidden, remove } = useVacayShareActions()

  const handleShare = () => send(() => setSelected(null))

  return (
    <MSheet open={open} onClose={onClose} variant="card" material="glass" ariaLabel={t('vacay.sharedCalendars')}>
      <div className="px-[18px] pb-[18px] pt-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 text-[1.0625rem] font-bold">{t('vacay.sharedCalendars')}</div>
          <MIconBtn variant="neutral" size={34} onClick={onClose} ariaLabel={t('common.close')}>
            <X size={15} strokeWidth={2.2} />
          </MIconBtn>
        </div>
        <div className="mb-3 mt-2 font-geist text-[0.75rem] leading-normal text-m-muted">
          {t('vacay.shareCalendarHint')}
        </div>

        {available.length === 0 ? (
          <div className="rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] py-3 text-center font-geist text-[0.75rem] text-m-faint">
            {t('vacay.noUsersAvailable')}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePicker}
                className="flex min-w-0 flex-1 items-center gap-[9px] rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] py-3 text-[0.8125rem] font-semibold"
              >
                <span className={`min-w-0 flex-1 truncate text-start ${selectedUser ? '' : 'text-m-muted'}`}>
                  {selectedUser ? selectedUser.username : t('vacay.selectUser')}
                </span>
                <ChevronDown size={14} strokeWidth={2} className="flex-none text-m-faint" />
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={!selected || sending}
                className="flex flex-none items-center gap-[6px] rounded-full bg-m-act px-4 py-[10px] text-[0.78125rem] font-semibold text-m-actfg disabled:opacity-40"
              >
                {sending ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} strokeWidth={2.2} />}
                {t('vacay.share')}
              </button>
            </div>
            {pickerOpen && <MUserPickerList users={available} selected={selected} onPick={pick} />}
          </>
        )}

        {incomingShares.length > 0 && (
          <div className="mt-3 flex flex-col gap-[6px]">
            <div className="px-1 font-geist text-[0.625rem] font-bold uppercase tracking-[.06em] text-m-faint">
              {t('vacay.sharedWithYou')}
            </div>
            {incomingShares.map(s => (
              <div key={s.id} className="flex items-center gap-[9px] rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[14px] py-[10px]">
                <span className="h-[11px] w-[11px] flex-none rounded-full" style={{ border: `2.5px solid ${s.color}` }} />
                <span className={`min-w-0 flex-1 truncate text-[0.8125rem] font-semibold ${s.hidden ? 'text-m-faint' : ''}`}>
                  {s.username}
                </span>
                <button
                  type="button"
                  onClick={() => toggleHidden(s.id, !s.hidden)}
                  aria-label={s.hidden ? t('vacay.showInCalendar') : t('vacay.hideFromCalendar')}
                  className="flex h-[28px] w-[28px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)]"
                >
                  {s.hidden
                    ? <EyeOff size={13} strokeWidth={2.2} className="text-m-faint" />
                    : <Eye size={13} strokeWidth={2.2} className="text-m-muted" />}
                </button>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="flex-none rounded-full px-[8px] py-1 font-geist text-[0.6875rem] font-semibold text-m-muted"
                >
                  {t('vacay.remove')}
                </button>
              </div>
            ))}
          </div>
        )}

        {outgoingShares.length > 0 && (
          <div className="mt-3 flex flex-col gap-[6px]">
            <div className="px-1 font-geist text-[0.625rem] font-bold uppercase tracking-[.06em] text-m-faint">
              {t('vacay.youShareWith')}
            </div>
            {outgoingShares.map(s => (
              <div key={s.id} className="flex items-center gap-[9px] rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[14px] py-[10px]">
                <Share2 size={13} strokeWidth={2} className="flex-none text-m-faint" />
                <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold">{s.username}</span>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="flex-none rounded-full px-[10px] py-1 font-geist text-[0.6875rem] font-semibold text-m-muted"
                >
                  {t('vacay.stopSharing')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MSheet>
  )
}
