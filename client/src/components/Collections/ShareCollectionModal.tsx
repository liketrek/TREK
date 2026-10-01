import React, { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { avatarSrc } from '../../utils/avatarSrc'
import { UserPlus, UserMinus, UserX, Loader2, Clock, Crown, LogOut, Share2 } from 'lucide-react'
import type { CollectionMember, CollectionRole } from '@trek/shared'
import { DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import ConfirmDialog from '../shared/ConfirmDialog'
import CustomSelect from '../shared/CustomSelect'
import { Tooltip } from '../shared/Tooltip'
import { useToast } from '../shared/Toast'
import { TripMemberAvatar } from '../Trips/TripMemberAvatar'
import { useCollectionStore } from '../../store/collectionStore'
import { useAuthStore } from '../../store/authStore'
import { collectionsApi } from '../../api/collections'
import { getApiErrorMessage } from '../../utils/apiError'
import type { TranslationFn } from '../../types'

interface ShareCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  collectionId: number
  collectionName: string
  isOwner: boolean
  members: CollectionMember[]
  /** Called after the current (member) user successfully leaves the list. */
  onAfterLeave: () => void
  t: TranslationFn
}

const ROLE_ORDER: CollectionRole[] = ['viewer', 'editor', 'admin']

// The trip share dialog's roster, so a shared list and a shared trip read alike.
const COUNT = 'rounded-full bg-surface-tertiary px-2 py-[2px] font-geist font-bold text-content-muted'
const ROWS = 'flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5'
const ROW = 'flex min-h-[48px] items-center gap-3 rounded-[10px] px-2.5 py-1.5 hover:bg-surface-card'
const BADGE = 'inline-flex flex-none items-center gap-1 rounded-full px-2 py-[2px] font-semibold'
const DANGER_BUTTON = 'inline-flex items-center gap-1.5 rounded-[10px] bg-surface-card px-3.5 py-2 font-medium text-danger shadow-sm ring-1 ring-edge-faint hover:bg-danger-soft disabled:cursor-default disabled:opacity-50'

/** A round icon button of a row, named by its tooltip; faint until the pointer is on it. */
function RowAction({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <Tooltip label={label}>
      <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
        className="grid h-8 w-8 flex-none place-items-center rounded-[9px] text-content-faint hover:bg-surface-secondary hover:text-danger disabled:opacity-40">
        {children}
      </button>
    </Tooltip>
  )
}

/**
 * Fusion-share surface for a single list (blueprint 4.4 / 4.8). The OWNER sees the
 * member roster with accepted/pending status, can invite a user from
 * GET /:id/available-users and cancel a pending invite. A non-owner MEMBER sees the
 * roster read-only plus a "Leave shared list" action (the server blocks the owner
 * from leaving). Incoming invites are accepted/declined from the lists rail, not here.
 */
export default function ShareCollectionModal({
  isOpen,
  onClose,
  collectionId,
  collectionName,
  isOwner,
  members,
  onAfterLeave,
  t,
}: ShareCollectionModalProps): React.ReactElement | null {
  const toast = useToast()
  const labelId = useId()
  const currentUserId = useAuthStore(s => s.user?.id)
  const invite = useCollectionStore(s => s.invite)
  const cancelInvite = useCollectionStore(s => s.cancelInvite)
  const removeMember = useCollectionStore(s => s.removeMember)
  const setMemberRole = useCollectionStore(s => s.setMemberRole)
  const leave = useCollectionStore(s => s.leave)

  const [availableUsers, setAvailableUsers] = useState<{ id: number; username: string }[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('')
  const [inviteRole, setInviteRole] = useState<CollectionRole>('editor')
  const [settingRoleId, setSettingRoleId] = useState<number | null>(null)
  const [inviting, setInviting] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [leaving, setLeaving] = useState(false)

  // Load the invitable users whenever an owner opens the modal.
  useEffect(() => {
    if (!isOpen || !isOwner) return
    let cancelled = false
    collectionsApi.availableUsers(collectionId)
      .then(data => { if (!cancelled) setAvailableUsers(data.users) })
      .catch(() => { if (!cancelled) setAvailableUsers([]) })
    return () => { cancelled = true }
  }, [isOpen, isOwner, collectionId, members.length])

  // Reset transient state on close.
  useEffect(() => {
    if (!isOpen) {
      setSelectedUserId('')
      setConfirmLeave(false)
    }
  }, [isOpen])

  const sortedMembers = useMemo(() => {
    // Owner first, then accepted, then pending — alphabetised within each band.
    const rank = (m: CollectionMember) => (m.is_owner ? 0 : m.status === 'accepted' ? 1 : 2)
    return [...members].sort((a, b) => rank(a) - rank(b) || a.username.localeCompare(b.username))
  }, [members])

  if (!isOpen) return null

  const handleInvite = async () => {
    if (selectedUserId === '' || inviting) return
    setInviting(true)
    try {
      await invite(collectionId, Number(selectedUserId), inviteRole)
      toast.success(t('collections.invite.sent'))
      setSelectedUserId('')
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('collections.invite.error')))
    } finally {
      setInviting(false)
    }
  }

  const handleSetRole = async (userId: number, role: CollectionRole) => {
    if (settingRoleId != null) return
    setSettingRoleId(userId)
    try {
      await setMemberRole(collectionId, userId, role)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSettingRoleId(null)
    }
  }

  const handleCancel = async (userId: number) => {
    if (cancellingId != null) return
    setCancellingId(userId)
    try {
      await cancelInvite(collectionId, userId)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setCancellingId(null)
    }
  }

  const handleRemove = async (userId: number) => {
    if (removingId != null) return
    setRemovingId(userId)
    try {
      await removeMember(collectionId, userId)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setRemovingId(null)
    }
  }

  const handleLeave = async () => {
    setLeaving(true)
    try {
      await leave(collectionId)
      toast.success(t('collections.share.left'))
      onAfterLeave()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setLeaving(false)
    }
  }

  const roleOptions = ROLE_ORDER.map(r => ({ value: r, label: t(`collections.role.${r}`) }))

  return (
    <>
      <DialogShell
        onClose={onClose}
        labelledBy={labelId}
        width="detail"
        // While the leave question is up, Escape and the backdrop answer it, not this dialog.
        blocked={confirmLeave}
        header={(
          <DialogHeader
            tile={<DialogTile><Share2 size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
            tint={NEUTRAL_TINT}
            labelId={labelId}
            onClose={onClose}
            eyebrow={t('collections.share.title')}
            title={collectionName}
          />
        )}
        // A member's way out sits where an editor keeps its delete: bottom left.
        footer={isOwner ? undefined : (
          <DialogFooter>
            <button type="button" onClick={() => setConfirmLeave(true)} disabled={leaving} className={DANGER_BUTTON} style={fs(13, 'body')}>
              {leaving ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} strokeWidth={2.2} />}
              {t('collections.share.leave')}
            </button>
            <FooterSpacer />
          </DialogFooter>
        )}
      >
        {isOwner && (
          <DialogSection label={t('collections.share.invite')}>
            <p className="m-0 mb-2.5 leading-normal text-content-faint" style={fs(11.5)}>{t('collections.share.inviteHint')}</p>
            {availableUsers.length === 0 ? (
              <p className="m-0 rounded-[12px] border border-dashed border-edge px-3 py-3 text-center text-content-faint" style={fs(12, 'body')}>
                {t('collections.share.noUsers')}
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <CustomSelect
                    value={selectedUserId}
                    onChange={v => setSelectedUserId(v === '' ? '' : Number(v))}
                    options={availableUsers.map(u => ({ value: u.id, label: u.username }))}
                    placeholder={t('collections.share.inviteUser')}
                    searchable
                    size="sm"
                  />
                </div>
                <div className="w-[128px] flex-none">
                  <CustomSelect size="sm" value={inviteRole} onChange={v => setInviteRole(v as CollectionRole)} options={roleOptions} />
                </div>
                <DialogButton
                  variant="primary"
                  onClick={() => void handleInvite()}
                  disabled={selectedUserId === '' || inviting}
                  icon={inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} strokeWidth={2.2} />}
                >
                  {t('collections.share.sendInvite')}
                </DialogButton>
              </div>
            )}
          </DialogSection>
        )}

        <DialogSection label={(
          <span className="inline-flex items-center gap-2">
            {t('collections.share.members')}
            <span className={COUNT} style={fs(10)}>{sortedMembers.length}</span>
          </span>
        )}>
          <div className={ROWS}>
            {sortedMembers.map(member => {
              const isSelf = member.user_id === currentUserId
              const pending = member.status === 'pending'
              let standing: ReactNode
              if (member.is_owner) {
                standing = <span className={`${BADGE} bg-warning-soft text-warning`} style={fs(10.5)}><Crown size={10} strokeWidth={2.4} />{t('collections.share.owner')}</span>
              } else if (pending) {
                standing = <span className={`${BADGE} bg-warning-soft text-warning`} style={fs(10.5)}><Clock size={10} strokeWidth={2.4} />{t('collections.share.pending')}</span>
              } else if (isOwner) {
                standing = (
                  <div className="w-[118px] flex-none">
                    <CustomSelect
                      size="sm"
                      value={member.role ?? 'editor'}
                      onChange={v => handleSetRole(member.user_id, v as CollectionRole)}
                      options={roleOptions}
                      disabled={settingRoleId === member.user_id}
                    />
                  </div>
                )
              } else {
                standing = <span className={`${BADGE} bg-surface-tertiary text-content-muted`} style={fs(10.5)}>{t(`collections.role.${member.role ?? 'editor'}`)}</span>
              }
              return (
                <div key={member.user_id} className={ROW}>
                  <TripMemberAvatar username={member.username} avatarUrl={avatarSrc(member.avatar)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-content" style={fs(13, 'body')}>
                      {member.username}
                      {isSelf && <span className="ml-1 font-normal text-content-faint">({t('collections.share.you')})</span>}
                    </div>
                    {member.email && !pending && (
                      <div className="truncate text-content-faint" style={fs(11.5)}>{member.email}</div>
                    )}
                  </div>
                  {standing}
                  {isOwner && pending && (
                    <RowAction label={t('collections.share.cancel')} onClick={() => handleCancel(member.user_id)} disabled={cancellingId === member.user_id}>
                      {cancellingId === member.user_id ? <Loader2 size={14} className="animate-spin" /> : <UserX size={15} />}
                    </RowAction>
                  )}
                  {isOwner && !member.is_owner && member.status === 'accepted' && (
                    <RowAction label={t('collections.share.remove')} onClick={() => handleRemove(member.user_id)} disabled={removingId === member.user_id}>
                      {removingId === member.user_id ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={15} />}
                    </RowAction>
                  )}
                </div>
              )
            })}
          </div>
          {!isOwner && <p className="m-0 mt-2.5 leading-normal text-content-faint" style={fs(11.5)}>{t('collections.share.memberHint')}</p>}
        </DialogSection>
      </DialogShell>
      <ConfirmDialog
        isOpen={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => void handleLeave()}
        title={t('collections.share.leave')}
        message={t('collections.share.leaveConfirm')}
        confirmLabel={t('collections.share.leave')}
      />
    </>
  )
}
