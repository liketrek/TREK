import { ChevronDown, Clock, Loader2, X } from 'lucide-react'
import MSheet from '../../components/MSheet'
import MIconBtn from '../../components/MIconBtn'
import MUserPickerList from '../../components/MUserPickerList'
import { useVacayStore } from '../../../store/vacayStore'
import { useTranslation } from '../../../i18n'
import { type VacayUser } from '../../../types'
import { useVacayUserPicker } from '../../../components/Vacay/useVacayUserPicker'

interface MVacayInviteSheetProps {
  open: boolean
  onClose: () => void
}

/**
 * Fusion "Invite user" sheet: pick another TREK user and send the invite.
 * Pending invites are listed underneath and can be withdrawn (the desktop
 * persons panel's cancel action).
 */
export default function MVacayInviteSheet({ open, onClose }: MVacayInviteSheetProps) {
  const { t } = useTranslation()
  const { invite, pendingInvites, cancelInvite } = useVacayStore()
  const { available, selected, selectedUser, sending, send, pickerOpen, togglePicker, pick } = useVacayUserPicker<VacayUser>({
    endpoint: '/addons/vacay/available-users',
    submit: invite,
    successKey: 'vacay.inviteSent',
    errorKey: 'vacay.inviteError',
    sheetOpen: open,
  })

  const handleSend = () => send(onClose)

  return (
    <MSheet open={open} onClose={onClose} variant="card" material="glass" ariaLabel={t('vacay.inviteUser')}>
      <div className="px-[18px] pb-[18px] pt-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 text-[1.0625rem] font-bold">{t('vacay.inviteUser')}</div>
          <MIconBtn variant="neutral" size={34} onClick={onClose} ariaLabel={t('common.close')}>
            <X size={15} strokeWidth={2.2} />
          </MIconBtn>
        </div>
        <div className="mb-3 mt-2 font-geist text-[0.75rem] leading-normal text-m-muted">
          {t('vacay.inviteHint')}
        </div>

        {available.length === 0 ? (
          <div className="rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] py-3 text-center font-geist text-[0.75rem] text-m-faint">
            {t('vacay.noUsersAvailable')}
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={togglePicker}
              className="flex w-full items-center gap-[9px] rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] py-3 text-[0.8125rem] font-semibold"
            >
              <span className={`min-w-0 flex-1 truncate text-start ${selectedUser ? '' : 'text-m-muted'}`}>
                {selectedUser ? selectedUser.username : t('vacay.selectUser')}
              </span>
              <ChevronDown size={14} strokeWidth={2} className="flex-none text-m-faint" />
            </button>
            {pickerOpen && <MUserPickerList users={available} selected={selected} onPick={pick} />}
          </>
        )}

        {pendingInvites.length > 0 && (
          <div className="mt-3 flex flex-col gap-[6px]">
            {pendingInvites.map(inv => (
              <div key={inv.user_id} className="flex items-center gap-[9px] rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[14px] py-[10px]">
                <Clock size={13} strokeWidth={2} className="flex-none text-m-faint" />
                <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold">
                  {inv.username} <span className="font-geist text-[0.65625rem] font-medium text-m-faint">({t('vacay.pending')})</span>
                </span>
                <button
                  type="button"
                  onClick={() => cancelInvite(inv.user_id)}
                  className="flex-none rounded-full px-[10px] py-1 font-geist text-[0.6875rem] font-semibold text-m-muted"
                >
                  {t('common.cancel')}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="ms-auto rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-4 py-[9px] text-[0.78125rem] font-semibold"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!selected || sending}
            className="flex items-center gap-[6px] rounded-full bg-m-act px-[18px] py-[9px] text-[0.78125rem] font-semibold text-m-actfg disabled:opacity-40"
          >
            {sending && <Loader2 size={13} className="animate-spin" />}
            {t('vacay.sendInvite')}
          </button>
        </div>
      </div>
    </MSheet>
  )
}
