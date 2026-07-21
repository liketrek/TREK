import { useEffect, useState } from 'react'
import { ChevronDown, Eye, EyeOff, Loader2, Share2, X } from 'lucide-react'
import MSheet from '../../components/MSheet'
import MIconBtn from '../../components/MIconBtn'
import { useVacayStore } from '../../../store/vacayStore'
import { useTranslation } from '../../../i18n'
import { useToast } from '../../../components/shared/Toast'
import { getApiErrorMessage } from '../../../types'
import apiClient from '../../../api/client'

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
  const toast = useToast()
  const { incomingShares, outgoingShares, shareWith, removeShare, setShareHidden } = useVacayStore()
  const [available, setAvailable] = useState<{ id: number; username: string }[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const showError = (err: unknown) => toast.error(getApiErrorMessage(err, t('vacay.shareFailed')))

  useEffect(() => {
    if (!open) return
    setSelected(null)
    setPickerOpen(false)
    apiClient.get('/addons/vacay/shares/available-users')
      .then(r => setAvailable(r.data.users))
      .catch(() => setAvailable([]))
  }, [open])

  const selectedUser = available.find(u => u.id === selected)

  const handleShare = async () => {
    if (!selected) return
    setSending(true)
    try {
      await shareWith(selected)
      toast.success(t('vacay.shareSent'))
      setSelected(null)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('vacay.shareFailed')))
    } finally {
      setSending(false)
    }
  }

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
                onClick={() => setPickerOpen(o => !o)}
                className="flex min-w-0 flex-1 items-center gap-[9px] rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] py-3 text-[0.8125rem] font-semibold"
              >
                <span className={`min-w-0 flex-1 truncate text-left ${selectedUser ? '' : 'text-m-muted'}`}>
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
            {pickerOpen && (
              <div className="mt-[6px] max-h-[180px] overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-[6px]">
                {available.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => { setSelected(u.id); setPickerOpen(false) }}
                    className={`flex w-full items-center gap-[9px] rounded-[10px] px-[10px] py-[9px] text-left text-[0.8125rem] font-semibold ${
                      u.id === selected ? 'bg-[color:var(--m-ic)]' : ''
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{u.username}</span>
                  </button>
                ))}
              </div>
            )}
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
                  onClick={() => setShareHidden(s.id, !s.hidden).catch(showError)}
                  aria-label={s.hidden ? t('vacay.showInCalendar') : t('vacay.hideFromCalendar')}
                  className="flex h-[28px] w-[28px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)]"
                >
                  {s.hidden
                    ? <EyeOff size={13} strokeWidth={2.2} className="text-m-faint" />
                    : <Eye size={13} strokeWidth={2.2} className="text-m-muted" />}
                </button>
                <button
                  type="button"
                  onClick={() => removeShare(s.id).catch(showError)}
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
                  onClick={() => removeShare(s.id).catch(showError)}
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
