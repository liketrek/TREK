import { useEffect, useState } from 'react'
import { Check, ChevronDown, Clock, Crown, Loader2, LogOut, UserPlus, X } from 'lucide-react'
import type { CollectionMember } from '@trek/shared'
import { COLLECTION_ROLES } from '@trek/shared'
import type { TranslationFn } from '../../../types'
import { avatarSrc } from '../../../utils/avatarSrc'
import { useCollectionSharing } from '../../../components/Collections/useCollectionSharing'
import MSheet from '../../components/MSheet'
import { CancelPill, Eyebrow, PrimaryPill, SheetHeader } from './MCollSheetKit'

interface MCollShareSheetProps {
  open: boolean
  collectionId: number | null
  collectionName: string
  isOwner: boolean
  members: CollectionMember[]
  onClose: () => void
  onAfterLeave: () => void
  t: TranslationFn
}

// Owner-crown amber of the design — identical in both themes.
const OWNER_BADGE_CLS = 'text-[#D98324]' // theme-lint-disable

function MemberAvatar({ member }: { member: CollectionMember }) {
  const src = member.avatar ? avatarSrc(member.avatar) : null
  return (
    <span className="flex h-[34px] w-[34px] flex-none items-center justify-center overflow-hidden rounded-full bg-m-act text-[0.75rem] font-extrabold text-m-actfg">
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : (member.username || '?').charAt(0).toUpperCase()}
    </span>
  )
}

/**
 * Fusion sharing for the active list. The owner sees the roster with per-member
 * roles (Viewer / Editor / Admin), can cancel pending invites, remove members
 * and invite from the available users. A member sees the roster read-only plus
 * "Leave list" (with confirm).
 */
export default function MCollShareSheet({
  open, collectionId, collectionName, isOwner, members, onClose, onAfterLeave, t,
}: MCollShareSheetProps) {
  const {
    currentUserId, availableUsers, sortedMembers, selectedUserId, setSelectedUserId, inviteRole, setInviteRole,
    inviting, confirmLeave, setConfirmLeave, leaving, busyUserId, cycleRole, cancel, remove, handleInvite, handleLeave,
  } = useCollectionSharing({ open, collectionId, isOwner, members, onAfterLeave, t, singleBusySlot: true })
  const [userPickerOpen, setUserPickerOpen] = useState(false)

  useEffect(() => {
    if (!open) setUserPickerOpen(false)
  }, [open])

  const selectedUser = availableUsers.find(u => u.id === selectedUserId) ?? null
  const badge = 'inline-flex flex-none items-center gap-[3px] font-geist text-[0.625rem] font-extrabold'

  return (
    <MSheet open={open} onClose={onClose} material="opaque" ariaLabel={t('collections.share.title')}>
      <SheetHeader title={t('collections.share.titleNamed', { name: collectionName })} onClose={onClose} closeLabel={t('common.close')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px] pt-[14px]">
        <div className="mb-2 flex items-center gap-[7px]">
          <Eyebrow>{t('collections.share.members').toUpperCase()}</Eyebrow>
          <span className="rounded-full bg-[color:var(--m-ic)] px-[7px] py-[1px] font-geist text-[0.625rem] font-bold text-m-ink">
            {sortedMembers.length}
          </span>
        </div>
        {sortedMembers.map(member => {
          const isSelf = member.user_id === currentUserId
          const pending = member.status === 'pending'
          const busy = busyUserId('role') === member.user_id
          return (
            <div
              key={member.user_id}
              className="mb-2 flex items-center gap-[11px] rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-3 py-[10px]"
            >
              <MemberAvatar member={member} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[0.8125rem] font-bold text-m-ink">
                  {member.username}
                  {isSelf && <span className="font-normal text-m-faint"> ({t('collections.share.you')})</span>}
                </div>
                {member.email && !pending && <div className="truncate font-geist text-[0.625rem] text-m-muted">{member.email}</div>}
              </div>
              {member.is_owner ? (
                <span className={`${badge} ${OWNER_BADGE_CLS}`}>
                  <Crown size={11} strokeWidth={2.4} /> {t('collections.share.owner').toUpperCase()}
                </span>
              ) : pending ? (
                <span className={`${badge} text-[color:var(--m-st-pending)]`}>
                  <Clock size={11} strokeWidth={2.4} /> {t('collections.share.pending').toUpperCase()}
                </span>
              ) : isOwner ? (
                <button
                  type="button"
                  onClick={() => cycleRole(member)}
                  disabled={busy}
                  aria-label={t('collections.role.label')}
                  className="flex flex-none items-center gap-1 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[10px] py-[5px] font-geist text-[0.625rem] font-extrabold text-m-ink disabled:opacity-50"
                >
                  {busy ? <Loader2 size={11} className="animate-spin" /> : t(`collections.role.${member.role ?? 'editor'}`).toUpperCase()}
                  <ChevronDown size={11} strokeWidth={2.4} className="text-m-faint" />
                </button>
              ) : (
                <span className={`${badge} text-m-muted`}>{t(`collections.role.${member.role ?? 'editor'}`).toUpperCase()}</span>
              )}
              {isOwner && !member.is_owner && collectionId != null && (
                <button
                  type="button"
                  onClick={() => (pending ? cancel(member.user_id) : remove(member.user_id))}
                  disabled={busy}
                  aria-label={pending ? t('collections.share.cancel') : t('collections.share.remove')}
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-m-faint active:bg-[color:var(--m-ic)] disabled:opacity-50"
                >
                  <X size={13} strokeWidth={2.4} />
                </button>
              )}
            </div>
          )
        })}

        {isOwner ? (
          <>
            <Eyebrow className="mb-1 mt-[14px]">{t('collections.share.invite').toUpperCase()}</Eyebrow>
            {availableUsers.length === 0 ? (
              <div className="py-3 text-center font-geist text-[0.71875rem] text-m-faint">{t('collections.share.noUsers')}</div>
            ) : (
              <>
                <div className="relative mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUserPickerOpen(v => !v)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[13px] py-[11px] text-start text-[0.78125rem]"
                  >
                    <span className={`truncate ${selectedUser ? 'font-semibold text-m-ink' : 'text-m-faint'}`}>
                      {selectedUser?.username ?? t('collections.share.inviteUser')}
                    </span>
                    <ChevronDown size={13} strokeWidth={2} className="flex-none text-m-faint" />
                  </button>
                  <button
                    type="button"
                    onClick={handleInvite}
                    disabled={selectedUserId == null || inviting}
                    aria-label={t('collections.share.sendInvite')}
                    className="flex w-11 flex-none items-center justify-center rounded-[12px] bg-m-act text-m-actfg disabled:opacity-40"
                  >
                    {inviting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} strokeWidth={2.2} />}
                  </button>
                  {userPickerOpen && (
                    <div className="absolute start-0 end-[52px] top-[calc(100%+6px)] z-[5] max-h-[180px] overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-m-sheetop shadow-[0_20px_44px_-18px_rgba(0,0,0,.45)]">
                      {availableUsers.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => { setSelectedUserId(u.id); setUserPickerOpen(false) }}
                          className="flex w-full items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[13px] py-[10px] text-start text-[0.8125rem] font-semibold text-m-ink first:border-t-0"
                        >
                          <span className="min-w-0 flex-1 truncate">{u.username}</span>
                          {selectedUserId === u.id && <Check size={14} strokeWidth={2.6} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-2 flex gap-[6px]">
                  {COLLECTION_ROLES.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setInviteRole(role)}
                      aria-pressed={inviteRole === role}
                      className={`flex-1 rounded-full py-[7px] text-[0.71875rem] font-bold ${
                        inviteRole === role ? 'bg-m-act text-m-actfg' : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'
                      }`}
                    >
                      {t(`collections.role.${role}`)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="mt-[14px]">
            <div className="mb-3 font-geist text-[0.71875rem] leading-[1.5] text-m-muted">{t('collections.share.memberHint')}</div>
            {confirmLeave ? (
              <>
                <div className="mb-2 text-[0.8125rem] text-m-ink">{t('collections.share.leaveConfirm')}</div>
                <div className="flex items-center gap-2">
                  <CancelPill className="ms-auto" onClick={() => setConfirmLeave(false)}>{t('common.cancel')}</CancelPill>
                  <PrimaryPill onClick={handleLeave} disabled={leaving} className="!bg-[color:var(--m-st-danger)] !text-white">
                    {leaving ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} strokeWidth={2.2} />} {t('collections.share.leave')}
                  </PrimaryPill>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmLeave(true)}
                className="flex w-full items-center justify-center gap-[6px] rounded-[13px] border border-[color:var(--m-rowbr)] p-[11px] text-[0.78125rem] font-bold text-[color:var(--m-st-danger)]"
              >
                <LogOut size={14} strokeWidth={2.2} /> {t('collections.share.leave')}
              </button>
            )}
          </div>
        )}
      </div>
    </MSheet>
  )
}
