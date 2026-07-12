import { useState, useEffect, useRef } from 'react'
import Modal from '../shared/Modal'
import { tripsApi, authApi, shareApi, tripInviteApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import { useAuthStore } from '../../store/authStore'
import { useCanDo } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'
import { Crown, UserMinus, UserPlus, Users, LogOut, Link2, Trash2, Copy, Check, UserRound, Pencil, Plus } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { getApiErrorMessage } from '../../types'
import CustomSelect from '../shared/CustomSelect'

interface AvatarProps {
  username: string
  avatarUrl: string | null
  size?: number
}

function Avatar({ username, avatarUrl, size = 32 }: AvatarProps) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  const letter = (username || '?')[0].toUpperCase()
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']
  const color = colors[letter.charCodeAt(0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, color: 'white', flexShrink: 0,
    }}>
      {letter}
    </div>
  )
}

function ShareLinkSection({ tripId, t }: { tripId: number; t: (key: string, params?: Record<string, string | number>) => string }) {
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [perms, setPerms] = useState({ share_map: true, share_bookings: true, share_packing: false, share_budget: false, share_collab: false })
  const toast = useToast()
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current) }
  }, [])

  useEffect(() => {
    shareApi.getLink(tripId).then(d => {
      setShareToken(d.token)
      if (d.token) setPerms({ share_map: d.share_map ?? true, share_bookings: d.share_bookings ?? true, share_packing: d.share_packing ?? false, share_budget: d.share_budget ?? false, share_collab: d.share_collab ?? false })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [tripId])

  const shareUrl = shareToken ? `${window.location.origin}/shared/${shareToken}` : null

  const handleCreate = async () => {
    try {
      const d = await shareApi.createLink(tripId, perms)
      setShareToken(d.token)
    } catch { toast.error(t('share.createError')) }
  }

  const handleUpdatePerms = async (key: string, val: boolean) => {
    const newPerms = { ...perms, [key]: val }
    setPerms(newPerms)
    if (shareToken) {
      try { await shareApi.createLink(tripId, newPerms) } catch { toast.error(t('share.createError')) }
    }
  }

  const handleDelete = async () => {
    try {
      await shareApi.deleteLink(tripId)
      setShareToken(null)
    } catch { toast.error(t('common.error')) }
  }

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Link2 size={14} className="text-content-muted" />
        <span className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{t('share.linkTitle')}</span>
      </div>
      <p className="text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', marginBottom: 10, lineHeight: 1.5 }}>{t('share.linkHint')}</p>

      {/* Permission checkboxes */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {[
          { key: 'share_map', label: t('share.permMap'), always: true },
          { key: 'share_bookings', label: t('share.permBookings') },
          { key: 'share_packing', label: t('share.permPacking') },
          { key: 'share_budget', label: t('share.permBudget') },
          { key: 'share_collab', label: t('share.permCollab') },
        ].map(opt => (
          <button key={opt.key} onClick={() => !opt.always && handleUpdatePerms(opt.key, !perms[opt.key])}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20,
              border: '1.5px solid', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500, cursor: opt.always ? 'default' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.12s',
              background: perms[opt.key] ? 'var(--text-primary)' : 'transparent',
              borderColor: perms[opt.key] ? 'var(--text-primary)' : 'var(--border-primary)',
              color: perms[opt.key] ? 'var(--bg-primary)' : 'var(--text-muted)',
              opacity: opt.always ? 0.7 : 1,
            }}>
            {perms[opt.key] ? <Check size={10} /> : null}
            {opt.label}
          </button>
        ))}
      </div>

      {shareUrl ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="bg-surface-tertiary border border-edge-faint" style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px',
            borderRadius: 8,
          }}>
            <input type="text" value={shareUrl} readOnly className="text-content" style={{
              flex: 1, border: 'none', background: 'none', fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
              outline: 'none', fontFamily: 'monospace',
            }} />
            <button onClick={handleCopy} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6,
              border: 'none', background: copied ? '#16a34a' : 'var(--accent)', color: copied ? 'white' : 'var(--accent-text)',
              fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s',
            }}>
              {copied ? <><Check size={10} /> {t('common.copied')}</> : <><Copy size={10} /> {t('common.copy')}</>}
            </button>
          </div>
          <button onClick={handleDelete} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '6px 0', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.06)', color: '#ef4444', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Trash2 size={11} /> {t('share.deleteLink')}
          </button>
        </div>
      ) : (
        <button onClick={handleCreate} className="border border-dashed border-edge text-content-muted" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          width: '100%', padding: '8px 0', borderRadius: 8,
          background: 'none', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Link2 size={12} /> {t('share.createLink')}
        </button>
      )}
    </div>
  )
}

/**
 * Trip invite link (#1143). One rotating token per trip that an existing,
 * logged-in user opens to join the trip as a member. Mirrors ShareLinkSection
 * but the link points at /join/:token (login-required, no registration).
 */
function TripInviteLinkSection({ tripId, t }: { tripId: number; t: (key: string, params?: Record<string, string | number>) => string }) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const toast = useToast()
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current) }, [])

  useEffect(() => {
    tripInviteApi.getLink(tripId)
      .then((d: { token: string | null }) => setToken(d.token))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tripId])

  const inviteUrl = token ? `${window.location.origin}/join/${token}` : null

  const create = async () => {
    setBusy(true)
    try { const d = await tripInviteApi.createLink(tripId); setToken(d.token) }
    catch { toast.error(t('share.createError')) }
    finally { setBusy(false) }
  }

  const remove = async () => {
    setBusy(true)
    try { await tripInviteApi.deleteLink(tripId); setToken(null) }
    catch { toast.error(t('common.error')) }
    finally { setBusy(false) }
  }

  const copy = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return null

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-faint)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <UserPlus size={14} className="text-content-muted" />
        <span className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{t('trip.invite.linkTitle')}</span>
      </div>
      <p className="text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', marginBottom: 12, lineHeight: 1.5 }}>{t('trip.invite.linkHint')}</p>

      {inviteUrl ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="bg-surface-tertiary border border-edge-faint" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 8 }}>
            <input type="text" value={inviteUrl} readOnly className="text-content" style={{ flex: 1, border: 'none', background: 'none', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', outline: 'none', fontFamily: 'monospace' }} />
            <button onClick={copy} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6,
              border: 'none', background: copied ? '#16a34a' : 'var(--accent)', color: copied ? 'white' : 'var(--accent-text)',
              fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s',
            }}>
              {copied ? <><Check size={10} /> {t('common.copied')}</> : <><Copy size={10} /> {t('common.copy')}</>}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={create} disabled={busy} className="border border-edge text-content-muted" style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '6px 0', borderRadius: 8, background: 'none', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500,
              cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit',
            }}>
              <Link2 size={11} /> {t('trip.invite.regenerate')}
            </button>
            <button onClick={remove} disabled={busy} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '6px 0', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.06)', color: '#ef4444', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500,
              cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit',
            }}>
              <Trash2 size={11} /> {t('trip.invite.disable')}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={create} disabled={busy} className="border border-dashed border-edge text-content-muted" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          width: '100%', padding: '8px 0', borderRadius: 8,
          background: 'none', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500,
          cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit',
        }}>
          <UserPlus size={12} /> {t('trip.invite.create')}
        </button>
      )}
    </div>
  )
}

interface TripMembersModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: number
  tripTitle: string
  /** Called after the roster changes (guest/member added, renamed or removed) so the
   *  planner can refresh its members for Costs participants, Collab, etc. */
  onMembersChanged?: () => void
}

export default function TripMembersModal({ isOpen, onClose, tripId, tripTitle, onMembersChanged }: TripMembersModalProps) {
  const [data, setData] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [transferringId, setTransferringId] = useState(null)
  const [newGuestName, setNewGuestName] = useState('')
  const [addingGuest, setAddingGuest] = useState(false)
  const [renamingGuestId, setRenamingGuestId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const toast = useToast()
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const can = useCanDo()
  const trip = useTripStore((s) => s.trip)
  const canManageMembers = can('member_manage', trip)
  const canManageShare = can('share_manage', trip)

  useEffect(() => {
    if (isOpen && tripId) {
      loadMembers()
      loadAllUsers()
    }
  }, [isOpen, tripId])

  const loadMembers = async (notify = false) => {
    setLoading(true)
    try {
      const d = await tripsApi.getMembers(tripId)
      setData(d)
      // Notify the planner to re-sync (Costs participants etc.) only after an actual
      // roster mutation — not on the initial open load, which would be a redundant fetch.
      if (notify) onMembersChanged?.()
    } catch {
      toast.error(t('members.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const loadAllUsers = async () => {
    try {
      const d = await authApi.listUsers()
      setAllUsers(d.users)
    } catch {}
  }

  const handleAdd = async () => {
    if (!selectedUserId) return
    setAdding(true)
    try {
      const target = allUsers.find(u => String(u.id) === String(selectedUserId))
      await tripsApi.addMember(tripId, target.username)
      setSelectedUserId('')
      await loadMembers(true)
      toast.success(`${target.username} ${t('members.added')}`)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('members.addError')))
    } finally {
      setAdding(false)
    }
  }

  const handleTransfer = async (newOwnerId, username) => {
    if (!confirm(t('members.confirmTransfer', { name: username }))) return
    setTransferringId(newOwnerId)
    try {
      await tripsApi.transferOwnership(tripId, newOwnerId)
      // The current user just dropped from owner to member — reload so the trip
      // state and permissions everywhere reflect the new ownership.
      onClose()
      window.location.reload()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('members.transferError')))
      setTransferringId(null)
    }
  }

  const handleAddGuest = async () => {
    const name = newGuestName.trim()
    if (!name) return
    setAddingGuest(true)
    try {
      await tripsApi.createGuest(tripId, name)
      setNewGuestName('')
      await loadMembers(true)
      toast.success(t('members.guestAdded'))
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('members.guestAddError')))
    } finally {
      setAddingGuest(false)
    }
  }

  const handleRenameGuest = async (userId) => {
    const name = renameValue.trim()
    if (!name) { setRenamingGuestId(null); return }
    try {
      await tripsApi.renameGuest(tripId, userId, name)
      setRenamingGuestId(null)
      await loadMembers(true)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('members.guestRenameError')))
    }
  }

  const handleDeleteGuest = async (userId) => {
    if (!confirm(t('members.confirmRemoveGuest'))) return
    setRemovingId(userId)
    try {
      await tripsApi.deleteGuest(tripId, userId)
      await loadMembers(true)
      toast.success(t('members.guestRemoved'))
    } catch {
      toast.error(t('members.removeError'))
    } finally {
      setRemovingId(null)
    }
  }

  const handleRemove = async (userId, isSelf) => {
    const msg = isSelf
      ? t('members.confirmLeave')
      : t('members.confirmRemove')
    if (!confirm(msg)) return
    setRemovingId(userId)
    try {
      await tripsApi.removeMember(tripId, userId)
      if (isSelf) { onClose(); window.location.reload() }
      else { await loadMembers(true); toast.success(t('members.removed')) }
    } catch {
      toast.error(t('members.removeError'))
    } finally {
      setRemovingId(null)
    }
  }

  // Users not yet in the trip (guests are accountless and never live in the directory)
  const existingIds = new Set([
    data?.owner?.id,
    ...(data?.members?.map(m => m.id) || []),
  ])
  const availableUsers = allUsers.filter(u => !existingIds.has(u.id) && !u.is_guest)

  const isCurrentOwner = data?.owner?.id === user?.id
  // Real members (owner + accounts) and guests (#1362) are listed separately.
  const realMembers = data ? [
    { ...data.owner, role: 'owner' },
    ...data.members.filter(m => !m.is_guest),
  ] : []
  const guests = data ? data.members.filter(m => m.is_guest) : []

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('members.shareTrip')} size="3xl">
      <div style={{ display: 'grid', gridTemplateColumns: canManageShare ? '1fr 1fr' : '1fr', gap: 24, fontFamily: "var(--font-system)" }} className="share-modal-grid">
        <style>{`@media (max-width: 640px) { .share-modal-grid { grid-template-columns: 1fr !important; } }`}</style>

        {/* Left column: Members */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Trip name */}
        <div className="bg-surface-secondary border border-edge-secondary" style={{ padding: '10px 14px', borderRadius: 10 }}>
          <div className="text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{t('nav.trip')}</div>
          <div className="text-content" style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{tripTitle}</div>
        </div>

        {/* Add member dropdown */}
        {canManageMembers && <div>
          <label className="text-content-secondary" style={{ display: 'block', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, marginBottom: 8 }}>
            {t('members.inviteUser')}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <CustomSelect
              value={selectedUserId}
              onChange={value => setSelectedUserId(String(value))}
              placeholder={t('members.selectUser')}
              options={[
                { value: '', label: t('members.selectUser') },
                ...availableUsers.map(u => ({
                  value: u.id,
                  label: u.username,
                })),
              ]}
              searchable
              style={{ flex: 1 }}
              size="sm"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !selectedUserId}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px',
                background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: 10,
                fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: adding || !selectedUserId ? 'default' : 'pointer',
                fontFamily: 'inherit', opacity: adding || !selectedUserId ? 0.4 : 1, flexShrink: 0,
              }}
            >
              <UserPlus size={13} /> {adding ? '…' : t('members.invite')}
            </button>
          </div>
          {availableUsers.length === 0 && allUsers.length > 0 && canManageMembers && (
            <p className="text-content-faint" style={{ fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', margin: '6px 0 0' }}>{t('members.allHaveAccess')}</p>
          )}
        </div>}

        {/* Members list */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Users size={13} className="text-content-faint" />
            <span className="text-content-secondary" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600 }}>
              {t('members.access')} ({realMembers.length} {realMembers.length === 1 ? t('members.person') : t('members.persons')})
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2].map(i => (
                <div key={i} className="bg-surface-tertiary" style={{ height: 48, borderRadius: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {realMembers.map(member => {
                const isSelf = member.id === user?.id
                const canRemove = isSelf || (canManageMembers && member.role !== 'owner')
                return (
                  <div key={member.id} className="bg-surface-secondary border border-edge-secondary" style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 10,
                  }}>
                    <Avatar username={member.username} avatarUrl={member.avatar_url} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{member.username}</span>
                        {isSelf && <span className="text-content-faint" style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))' }}>({t('members.you')})</span>}
                        {member.role === 'owner' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 700, color: '#d97706', background: '#fef9c3', padding: '1px 6px', borderRadius: 99 }}>
                            <Crown size={9} /> {t('members.owner')}
                          </span>
                        )}
                      </div>
                    </div>
                    {isCurrentOwner && member.role !== 'owner' && (
                      <button
                        onClick={() => handleTransfer(member.id, member.username)}
                        disabled={transferringId === member.id}
                        title={t('members.makeOwner')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: 6, display: 'flex', color: 'var(--text-faint)', opacity: transferringId === member.id ? 0.4 : 1 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#d97706'}
                        onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                      >
                        <Crown size={14} />
                      </button>
                    )}
                    {canRemove && (
                      <button
                        onClick={() => handleRemove(member.id, isSelf)}
                        disabled={removingId === member.id}
                        title={isSelf ? t('members.leaveTrip') : t('members.removeAccess')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: 6, display: 'flex', color: 'var(--text-faint)', opacity: removingId === member.id ? 0.4 : 1 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                      >
                        {isSelf ? <LogOut size={14} /> : <UserMinus size={14} />}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Guests (#1362) — accountless participants, managed by the owner */}
        {(isCurrentOwner || guests.length > 0) && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <UserRound size={13} className="text-content-faint" />
            <span className="text-content-secondary" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600 }}>
              {t('members.guests')}{guests.length > 0 ? ` (${guests.length})` : ''}
            </span>
          </div>
          <p className="text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', margin: '0 0 10px', lineHeight: 1.5 }}>{t('members.guestsHint')}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {guests.map(g => (
              <div key={g.id} className="bg-surface-secondary border border-edge-secondary" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10,
              }}>
                <Avatar username={g.username} avatarUrl={null} />
                {renamingGuestId === g.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRenameGuest(g.id); if (e.key === 'Escape') setRenamingGuestId(null) }}
                    onBlur={() => handleRenameGuest(g.id)}
                    maxLength={50}
                    className="bg-surface border border-edge text-content"
                    style={{ flex: 1, minWidth: 0, fontSize: 'calc(13px * var(--fs-scale-body, 1))', padding: '4px 8px', borderRadius: 8, outline: 'none', fontFamily: 'inherit' }}
                  />
                ) : (
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{g.username}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: 99 }}>
                      <UserRound size={9} /> {t('members.guest')}
                    </span>
                  </div>
                )}
                {isCurrentOwner && renamingGuestId !== g.id && (
                  <>
                    <button
                      onClick={() => { setRenamingGuestId(g.id); setRenameValue(g.username) }}
                      title={t('common.rename')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: 6, display: 'flex', color: 'var(--text-faint)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteGuest(g.id)}
                      disabled={removingId === g.id}
                      title={t('members.removeAccess')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: 6, display: 'flex', color: 'var(--text-faint)', opacity: removingId === g.id ? 0.4 : 1 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {isCurrentOwner && (
            <div style={{ display: 'flex', gap: 8, marginTop: guests.length > 0 ? 8 : 0 }}>
              <input
                value={newGuestName}
                onChange={e => setNewGuestName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddGuest() }}
                placeholder={t('members.guestNamePlaceholder')}
                maxLength={50}
                className="bg-surface border border-edge text-content"
                style={{ flex: 1, minWidth: 0, fontSize: 'calc(13px * var(--fs-scale-body, 1))', padding: '8px 10px', borderRadius: 10, outline: 'none', fontFamily: 'inherit' }}
              />
              <button
                onClick={handleAddGuest}
                disabled={addingGuest || !newGuestName.trim()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px',
                  background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', borderRadius: 10,
                  fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: addingGuest || !newGuestName.trim() ? 'default' : 'pointer',
                  fontFamily: 'inherit', opacity: addingGuest || !newGuestName.trim() ? 0.4 : 1, flexShrink: 0,
                }}
              >
                <Plus size={13} /> {addingGuest ? '…' : t('members.addGuest')}
              </button>
            </div>
          )}
        </div>
        )}

        </div>

        {/* Right column: Share Link */}
        {canManageShare && <div className="border-l border-edge-faint" style={{ paddingLeft: 24 }}>
        <ShareLinkSection tripId={tripId} t={t} />
        <TripInviteLinkSection tripId={tripId} t={t} />
        </div>}

        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    </Modal>
  )
}
