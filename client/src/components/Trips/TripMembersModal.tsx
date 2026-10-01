import Modal from '../shared/Modal'
import { Crown, UserMinus, UserPlus, Users, LogOut, Link2, Trash2, Copy, Check, UserRound, Pencil, Plus } from 'lucide-react'
import { useTranslation } from '../../i18n'
import CustomSelect from '../shared/CustomSelect'
import { useIsPhone } from '../../mobile/useIsPhone'
import { TripMemberAvatar as Avatar } from './TripMemberAvatar'
import TripShareDialog from './TripShareDialog'
import { SHARE_OPTIONS, SHARE_SECTIONS, useShareLink, useTripInviteLink, useTripMembers } from './useTripShare'

function ShareLinkSection({ tripId, t }: { tripId: number; t: (key: string, params?: Record<string, string | number>) => string }) {
  const { loading, url: shareUrl, perms, copied, create: handleCreate, setPerm, remove: handleDelete, copy: handleCopy } = useShareLink(tripId)
  const handleUpdatePerms = (key: string, val: boolean) => setPerm(key as Parameters<typeof setPerm>[0], val)

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
        {[...SHARE_SECTIONS, ...SHARE_OPTIONS].map(opt => ({ ...opt, label: t(opt.label), always: 'always' in opt && !!opt.always })).map(opt => (
          <button type="button" key={opt.key} onClick={() => !opt.always && handleUpdatePerms(opt.key, !perms[opt.key])}
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
            <button type="button" onClick={handleCopy} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6,
              border: 'none', background: copied ? '#16a34a' : 'var(--accent)', color: copied ? 'white' : 'var(--accent-text)',
              fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s',
            }}>
              {copied ? <><Check size={10} /> {t('common.copied')}</> : <><Copy size={10} /> {t('common.copy')}</>}
            </button>
          </div>
          <button type="button" onClick={handleDelete} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '6px 0', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.06)', color: '#ef4444', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Trash2 size={11} /> {t('share.deleteLink')}
          </button>
        </div>
      ) : (
        <button type="button" onClick={handleCreate} className="border border-dashed border-edge text-content-muted" style={{
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
  const { loading, url: inviteUrl, busy, copied, create, remove, copy } = useTripInviteLink(tripId)

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
            <button type="button" onClick={copy} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6,
              border: 'none', background: copied ? '#16a34a' : 'var(--accent)', color: copied ? 'white' : 'var(--accent-text)',
              fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s',
            }}>
              {copied ? <><Check size={10} /> {t('common.copied')}</> : <><Copy size={10} /> {t('common.copy')}</>}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={create} disabled={busy} className="border border-edge text-content-muted" style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '6px 0', borderRadius: 8, background: 'none', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500,
              cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit',
            }}>
              <Link2 size={11} /> {t('trip.invite.regenerate')}
            </button>
            <button type="button" onClick={remove} disabled={busy} style={{
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
        <button type="button" onClick={create} disabled={busy} className="border border-dashed border-edge text-content-muted" style={{
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

/** Share: the new dialog on the desktop; the phone, which opens this from its More sheet, keeps the sheet below. */
export default function TripMembersModal(props: TripMembersModalProps) {
  const isPhone = useIsPhone()
  return isPhone ? <TripMembersSheet {...props} /> : <TripShareDialog {...props} />
}

function TripMembersSheet({ isOpen, onClose, tripId, tripTitle, onMembersChanged }: TripMembersModalProps) {
  const { t } = useTranslation()
  const m = useTripMembers({ isOpen, tripId, onClose, onMembersChanged })
  const {
    user, loading, realMembers, guests, allUsers, availableUsers, isCurrentOwner, canManageMembers, canManageShare,
    selectedUserId, setSelectedUserId, adding, transferringId, removingId,
    newGuestName, setNewGuestName, addingGuest, renamingGuestId, renameValue, setRenameValue,
  } = m
  const handleAdd = () => void m.add()
  const handleAddGuest = () => void m.addGuest()
  const handleRenameGuest = (userId: number) => void m.commitRename(userId)
  const handleTransfer = (newOwnerId: number, username: string) => {
    if (confirm(t('members.confirmTransfer', { name: username }))) void m.transfer(newOwnerId)
  }
  const handleRemove = (userId: number, isSelf: boolean) => {
    if (confirm(isSelf ? t('members.confirmLeave') : t('members.confirmRemove'))) void m.remove(userId, isSelf)
  }
  const handleDeleteGuest = (userId: number) => {
    if (confirm(t('members.confirmRemoveGuest'))) void m.removeGuest(userId)
  }

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
                // As a string: the select compares values strictly, and the chosen id is
                // kept as a string, so a number here left the trigger on its placeholder.
                ...availableUsers.map(u => ({
                  value: String(u.id),
                  label: u.username,
                })),
              ]}
              searchable
              style={{ flex: 1 }}
              size="sm"
            />
            <button type="button"
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
                      <button type="button"
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
                      <button type="button"
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
                    onKeyDown={e => { if (e.key === 'Enter') handleRenameGuest(g.id); if (e.key === 'Escape') m.cancelRename() }}
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
                    <button type="button"
                      onClick={() => m.startRename(g)}
                      title={t('common.rename')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: 6, display: 'flex', color: 'var(--text-faint)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                    >
                      <Pencil size={13} />
                    </button>
                    <button type="button"
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
              <button type="button"
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
