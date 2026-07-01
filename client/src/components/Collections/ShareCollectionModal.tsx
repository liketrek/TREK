import React, { useEffect, useMemo, useState } from 'react'
import { UserPlus, UserMinus, Loader2, Clock, Crown, LogOut } from 'lucide-react'
import type { CollectionMember, CollectionRole } from '@trek/shared'
import Modal from '../shared/Modal'
import CustomSelect from '../shared/CustomSelect'
import { useToast } from '../shared/Toast'
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

function MemberAvatar({ member }: { member: CollectionMember }): React.ReactElement {
  const initial = (member.username || '?').charAt(0).toUpperCase()
  return (
    <span className="w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center bg-surface-secondary text-content-secondary text-[12px] font-semibold">
      {member.avatar ? (
        <img src={`/uploads/avatars/${member.avatar}`} alt="" className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </span>
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

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t('collections.share.titleNamed', { name: collectionName })}
      size="sm"
    >
      <div className="flex flex-col gap-5">
        {/* Member roster */}
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-content-faint mb-2.5 flex items-center gap-2">
            {t('collections.share.members')}
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-surface-secondary text-content-secondary text-[10px] font-bold tabular-nums">{sortedMembers.length}</span>
          </h3>
          <div className="flex flex-col gap-1.5">
            {sortedMembers.map(member => {
              const isSelf = member.user_id === currentUserId
              const pending = member.status === 'pending'
              return (
                <div
                  key={member.user_id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border border-edge bg-surface-secondary/50 ${pending ? 'opacity-90' : ''}`}
                >
                  <MemberAvatar member={member} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-content truncate flex items-center gap-1.5">
                      {member.username}
                      {isSelf && <span className="text-content-faint font-normal text-[12px]">({t('collections.share.you')})</span>}
                    </p>
                    {member.email && !pending && (
                      <p className="text-[11.5px] text-content-faint truncate">{member.email}</p>
                    )}
                  </div>
                  {member.is_owner ? (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-amber-500/12 text-amber-600 dark:text-amber-400 shrink-0">
                      <Crown size={11} /> {t('collections.share.owner')}
                    </span>
                  ) : pending ? (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-amber-500/12 text-amber-600 dark:text-amber-400 shrink-0">
                      <Clock size={11} /> {t('collections.share.pending')}
                    </span>
                  ) : isOwner ? (
                    <select
                      value={member.role ?? 'editor'}
                      onChange={e => handleSetRole(member.user_id, e.target.value as CollectionRole)}
                      disabled={settingRoleId === member.user_id}
                      aria-label={t('collections.role.label')}
                      className="shrink-0 text-[11.5px] font-medium rounded-md border border-edge bg-surface-input text-content-secondary px-1.5 py-1 outline-none focus:border-accent disabled:opacity-50"
                    >
                      {ROLE_ORDER.map(r => <option key={r} value={r}>{t(`collections.role.${r}`)}</option>)}
                    </select>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-surface-secondary text-content-secondary shrink-0">
                      {t(`collections.role.${member.role ?? 'editor'}`)}
                    </span>
                  )}
                  {isOwner && pending && (
                    <button
                      type="button"
                      onClick={() => handleCancel(member.user_id)}
                      disabled={cancellingId === member.user_id}
                      className="shrink-0 text-[11px] font-medium px-2 py-1 rounded-md text-content-faint hover:text-danger hover:bg-danger-soft transition-colors disabled:opacity-50"
                    >
                      {cancellingId === member.user_id ? <Loader2 size={12} className="animate-spin" /> : t('collections.share.cancel')}
                    </button>
                  )}
                  {isOwner && !member.is_owner && member.status === 'accepted' && (
                    <button
                      type="button"
                      onClick={() => handleRemove(member.user_id)}
                      disabled={removingId === member.user_id}
                      title={t('collections.share.remove')}
                      aria-label={t('collections.share.remove')}
                      className="shrink-0 p-1 rounded-md text-content-faint hover:text-danger hover:bg-danger-soft transition-colors disabled:opacity-50"
                    >
                      {removingId === member.user_id ? <Loader2 size={12} className="animate-spin" /> : <UserMinus size={13} />}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {isOwner ? (
          /* Owner: invite UI */
          <div className="pt-1 border-t border-edge-secondary">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-content-faint mt-4 mb-2">
              {t('collections.share.invite')}
            </h3>
            <p className="text-[12px] text-content-muted mb-3">{t('collections.share.inviteHint')}</p>
            {availableUsers.length === 0 ? (
              <p className="text-[12px] text-content-faint text-center py-3">{t('collections.share.noUsers')}</p>
            ) : (
              <div className="flex items-stretch gap-2">
                <div className="flex-1 min-w-0">
                  <CustomSelect
                    value={selectedUserId}
                    onChange={v => setSelectedUserId(v === '' ? '' : Number(v))}
                    options={availableUsers.map(u => ({ value: u.id, label: u.username }))}
                    placeholder={t('collections.share.inviteUser')}
                    searchable
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as CollectionRole)}
                  aria-label={t('collections.role.label')}
                  className="shrink-0 text-[12.5px] font-medium rounded-lg border border-edge bg-surface-input text-content-secondary px-2 outline-none focus:border-accent"
                >
                  {ROLE_ORDER.map(r => <option key={r} value={r}>{t(`collections.role.${r}`)}</option>)}
                </select>
                <button
                  type="button"
                  onClick={handleInvite}
                  disabled={selectedUserId === '' || inviting}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-text text-[13px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  <span className="hidden sm:inline">{t('collections.share.sendInvite')}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Member: read-only roster + leave */
          <div className="pt-1 border-t border-edge-secondary">
            <p className="text-[12px] text-content-muted mt-4 mb-3">{t('collections.share.memberHint')}</p>
            {confirmLeave ? (
              <div className="flex flex-col gap-2.5">
                <p className="text-[13px] text-content-secondary">{t('collections.share.leaveConfirm')}</p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmLeave(false)}
                    className="px-3 py-1.5 rounded-lg border border-edge text-content-secondary text-[13px] hover:bg-surface-hover transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleLeave}
                    disabled={leaving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {leaving ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                    {t('collections.share.leave')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmLeave(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-edge text-danger text-[13px] font-medium hover:bg-danger-soft transition-colors"
              >
                <LogOut size={14} /> {t('collections.share.leave')}
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
