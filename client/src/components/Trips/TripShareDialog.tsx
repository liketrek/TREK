import { useId, useState, type ReactNode } from 'react'
import { Check, Copy, Crown, Link2, LogOut, Pencil, Plus, Trash2, UserMinus, UserPlus, UserRound, Users } from 'lucide-react'
import { useTranslation } from '../../i18n'
import CustomSelect from '../shared/CustomSelect'
import ConfirmDialog from '../shared/ConfirmDialog'
import { Tooltip } from '../shared/Tooltip'
import { DialogButton, DialogHeader, DialogSection, DialogShell, DialogTile, NEUTRAL_TINT, PILL, fs } from '../shared/DialogShell'
import { AddRowButton, INPUT, LABEL, PANEL } from '../shared/dialogParts'
import { TripMemberAvatar } from './TripMemberAvatar'
import { SHARE_OPTIONS, SHARE_SECTIONS, useShareLink, useTripInviteLink, useTripMembers, type TripMembersState } from './useTripShare'

interface TripShareDialogProps {
  isOpen: boolean
  onClose: () => void
  tripId: number
  tripTitle: string
  onMembersChanged?: () => void
}

/** A question the dialog asks before it acts, answered in a ConfirmDialog over it. */
interface Ask {
  title: string
  message: string
  confirmLabel: string
  run: () => void
}

const COUNT = 'rounded-full bg-surface-tertiary px-2 py-[2px] font-geist font-bold text-content-muted'
const ROWS = 'flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5'
const ROW = 'flex min-h-[48px] items-center gap-3 rounded-[10px] px-2.5 py-1.5 hover:bg-surface-card'
const BADGE = 'inline-flex flex-none items-center gap-1 rounded-full px-2 py-[2px] font-semibold'
const DANGER_BUTTON = 'inline-flex items-center gap-1.5 rounded-[10px] bg-surface-card px-3.5 py-2 font-medium text-danger shadow-sm ring-1 ring-edge-faint hover:bg-danger-soft disabled:cursor-default disabled:opacity-50'

/** The desktop dialog behind Share: who is on the trip, its guests, and the two links that let others in. */
export default function TripShareDialog(props: TripShareDialogProps) {
  return props.isOpen ? <OpenDialog {...props} /> : null
}

function OpenDialog({ onClose, tripId, tripTitle, onMembersChanged }: TripShareDialogProps) {
  const { t } = useTranslation()
  const labelId = useId()
  const m = useTripMembers({ isOpen: true, tripId, onClose, onMembersChanged })
  const [ask, setAsk] = useState<Ask | null>(null)
  const persons = `${m.realMembers.length} ${m.realMembers.length === 1 ? t('members.person') : t('members.persons')}`

  return (
    <>
      <DialogShell
        onClose={onClose}
        labelledBy={labelId}
        width={m.canManageShare ? 'wide' : 'detail'}
        blocked={!!ask}
        header={(
          <DialogHeader
            tile={<DialogTile><Users size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
            tint={NEUTRAL_TINT}
            labelId={labelId}
            onClose={onClose}
            eyebrow={t('members.shareTrip')}
            title={tripTitle}
            pills={m.loading ? undefined : (
              <>
                <span className={PILL}><Users size={13} strokeWidth={2.2} />{persons}</span>
                {m.guests.length > 0 && <span className={PILL}><UserRound size={13} strokeWidth={2.2} />{t('members.guests')} {m.guests.length}</span>}
              </>
            )}
          />
        )}
      >
        <div className={m.canManageShare ? 'grid grid-cols-2 items-start gap-6 max-md:grid-cols-1' : ''}>
          <div className="flex flex-col gap-5">
            {m.canManageMembers && <InviteUser m={m} />}
            <MembersList m={m} onAsk={setAsk} />
            {(m.isCurrentOwner || m.guests.length > 0) && <GuestsList m={m} onAsk={setAsk} />}
          </div>
          {m.canManageShare && (
            <div className="flex flex-col gap-5">
              <PublicLink tripId={tripId} />
              <InviteLink tripId={tripId} />
            </div>
          )}
        </div>
      </DialogShell>
      <ConfirmDialog
        isOpen={!!ask}
        onClose={() => setAsk(null)}
        onConfirm={() => { ask?.run(); setAsk(null) }}
        title={ask?.title}
        message={ask?.message}
        confirmLabel={ask?.confirmLabel}
      />
    </>
  )
}

function InviteUser({ m }: { m: TripMembersState }) {
  const { t } = useTranslation()
  return (
    <DialogSection label={t('members.inviteUser')}>
      <div className="flex items-center gap-2">
        <CustomSelect
          value={m.selectedUserId}
          onChange={value => m.setSelectedUserId(String(value))}
          placeholder={t('members.selectUser')}
          options={[
            { value: '', label: t('members.selectUser') },
            // As a string: the select compares values strictly and the pick is kept as one.
            ...m.availableUsers.map(u => ({ value: String(u.id), label: u.username })),
          ]}
          searchable
          style={{ flex: 1 }}
          size="sm"
        />
        <DialogButton variant="primary" onClick={() => void m.add()} disabled={m.adding || !m.selectedUserId} icon={<UserPlus size={14} strokeWidth={2.2} />}>
          {m.adding ? '...' : t('members.invite')}
        </DialogButton>
      </div>
      {m.availableUsers.length === 0 && m.allUsers.length > 0 && (
        <p className="m-0 mt-2 text-content-faint" style={fs(11.5)}>{t('members.allHaveAccess')}</p>
      )}
    </DialogSection>
  )
}

/** A round icon button of a row, named by its tooltip; faint until the pointer is on it. */
function RowAction({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <Tooltip label={label}>
      <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
        className={`grid h-8 w-8 flex-none place-items-center rounded-[9px] text-content-faint hover:bg-surface-secondary disabled:opacity-40 ${danger ? 'hover:text-danger' : 'hover:text-content'}`}>
        {children}
      </button>
    </Tooltip>
  )
}

function SectionLabel({ text, count }: { text: string; count?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      {text}
      {count != null && <span className={COUNT} style={fs(10)}>{count}</span>}
    </span>
  )
}

function MembersList({ m, onAsk }: { m: TripMembersState; onAsk: (ask: Ask) => void }) {
  const { t } = useTranslation()
  return (
    <DialogSection label={<SectionLabel text={t('members.access')} count={m.loading ? undefined : m.realMembers.length} />}>
      {m.loading ? (
        <div className={ROWS}>
          {[1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-[10px] bg-surface-tertiary" />)}
        </div>
      ) : (
        <div className={ROWS}>
          {m.realMembers.map(member => {
            const isSelf = member.id === m.user?.id
            const isOwner = member.role === 'owner'
            const canRemove = isSelf || (m.canManageMembers && !isOwner)
            return (
              <div key={member.id} className={ROW}>
                <TripMemberAvatar username={member.username} avatarUrl={member.avatar_url ?? null} />
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                  <span className="truncate font-semibold text-content" style={fs(13, 'body')}>{member.username}</span>
                  {isSelf && <span className={`${BADGE} bg-surface-tertiary text-content-muted`} style={fs(10.5)}>{t('members.you')}</span>}
                  {isOwner && (
                    <span className={`${BADGE} bg-warning-soft text-warning`} style={fs(10.5)}>
                      <Crown size={10} strokeWidth={2.4} />{t('members.owner')}
                    </span>
                  )}
                </div>
                {m.isCurrentOwner && !isOwner && (
                  <RowAction label={t('members.makeOwner')} disabled={m.transferringId === member.id}
                    onClick={() => onAsk({
                      title: t('members.makeOwner'),
                      message: t('members.confirmTransfer', { name: member.username }),
                      confirmLabel: t('common.confirm'),
                      run: () => void m.transfer(member.id),
                    })}>
                    <Crown size={15} />
                  </RowAction>
                )}
                {canRemove && (
                  <RowAction label={isSelf ? t('members.leaveTrip') : t('members.removeAccess')} danger disabled={m.removingId === member.id}
                    onClick={() => onAsk({
                      title: isSelf ? t('members.leaveTrip') : t('members.removeAccess'),
                      message: isSelf ? t('members.confirmLeave') : t('members.confirmRemove'),
                      confirmLabel: t('common.confirm'),
                      run: () => void m.remove(member.id, isSelf),
                    })}>
                    {isSelf ? <LogOut size={15} /> : <UserMinus size={15} />}
                  </RowAction>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DialogSection>
  )
}

/** Accountless participants (#1362): the owner names, renames and removes them. */
function GuestsList({ m, onAsk }: { m: TripMembersState; onAsk: (ask: Ask) => void }) {
  const { t } = useTranslation()
  return (
    <DialogSection label={<SectionLabel text={t('members.guests')} count={m.guests.length || undefined} />}>
      <p className="m-0 mb-2.5 leading-normal text-content-faint" style={fs(11.5)}>{t('members.guestsHint')}</p>
      {m.guests.length > 0 && (
        <div className={`${ROWS} mb-2.5`}>
          {m.guests.map(g => (
            <div key={g.id} className={ROW}>
              <TripMemberAvatar username={g.username} avatarUrl={null} />
              {m.renamingGuestId === g.id ? (
                <input
                  autoFocus
                  value={m.renameValue}
                  onChange={e => m.setRenameValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') void m.commitRename(g.id)
                    // Escape ends the rename, not the dialog.
                    if (e.key === 'Escape') { e.preventDefault(); m.cancelRename() }
                  }}
                  onBlur={() => void m.commitRename(g.id)}
                  maxLength={50}
                  aria-label={t('common.rename')}
                  className={`${INPUT} flex-1`}
                />
              ) : (
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                  <span className="truncate font-semibold text-content" style={fs(13, 'body')}>{g.username}</span>
                  <span className={`${BADGE} bg-surface-tertiary text-content-muted`} style={fs(10.5)}>
                    <UserRound size={10} strokeWidth={2.4} />{t('members.guest')}
                  </span>
                </div>
              )}
              {m.isCurrentOwner && m.renamingGuestId !== g.id && (
                <>
                  <RowAction label={t('common.rename')} onClick={() => m.startRename(g)}>
                    <Pencil size={14} />
                  </RowAction>
                  <RowAction label={t('members.removeAccess')} danger disabled={m.removingId === g.id}
                    onClick={() => onAsk({
                      title: t('members.removeAccess'),
                      message: t('members.confirmRemoveGuest'),
                      confirmLabel: t('common.delete'),
                      run: () => void m.removeGuest(g.id),
                    })}>
                    <Trash2 size={14} />
                  </RowAction>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {m.isCurrentOwner && (
        <div className="flex items-center gap-2">
          <input
            value={m.newGuestName}
            onChange={e => m.setNewGuestName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void m.addGuest() }}
            placeholder={t('members.guestNamePlaceholder')}
            aria-label={t('members.guestNamePlaceholder')}
            maxLength={50}
            className={`${INPUT} flex-1`}
          />
          <DialogButton onClick={() => void m.addGuest()} disabled={m.addingGuest || !m.newGuestName.trim()} icon={<Plus size={14} strokeWidth={2.2} />}>
            {m.addingGuest ? '...' : t('members.addGuest')}
          </DialogButton>
        </div>
      )}
    </DialogSection>
  )
}

/** A link as a read-only line with its copy button, the way the calendar feed shows its addresses. */
function LinkLine({ url, copied, onCopy }: { url: string; copied: boolean; onCopy: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-edge bg-surface-input py-1 pl-3 pr-1">
      <input type="text" value={url} readOnly aria-label={url} onFocus={e => e.currentTarget.select()}
        className="min-w-0 flex-1 truncate border-0 bg-transparent font-mono text-content outline-none" style={fs(11.5)} />
      <button type="button" onClick={onCopy}
        className={`inline-flex flex-none items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 font-semibold ${copied ? 'bg-success-soft text-success' : 'bg-accent text-accent-text hover:opacity-90'}`}
        style={fs(11.5, 'body')}>
        {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={2.2} />}
        {copied ? t('common.copied') : t('common.copy')}
      </button>
    </div>
  )
}

function LinkCard({ icon, title, hint, children }: { icon: ReactNode; title: string; hint: string; children: ReactNode }) {
  return (
    <section className={PANEL}>
      <div className="flex items-start gap-2.5">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-card text-content-muted shadow-sm">{icon}</span>
        <div className="min-w-0">
          <h3 className="m-0 font-semibold text-content" style={fs(13, 'body')}>{title}</h3>
          <p className="m-0 mt-0.5 leading-normal text-content-faint" style={fs(11.5)}>{hint}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

/** One toggle of the link, a filled pill with a tick while it is on. */
function PermChip({ on, disabled, label, hint, onToggle }: { on: boolean; disabled?: boolean; label: string; hint?: string; onToggle: () => void }) {
  const chip = (
    <button type="button" aria-pressed={on} disabled={disabled} onClick={onToggle}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold disabled:cursor-default ${on ? 'bg-accent text-accent-text disabled:opacity-70' : 'bg-surface-card text-content-muted ring-1 ring-edge-faint hover:text-content'}`}
      style={fs(11.5, 'body')}>
      {on && <Check size={11} strokeWidth={2.6} />}{label}
    </button>
  )
  return hint ? <Tooltip label={hint}>{chip}</Tooltip> : chip
}

/** The read-only public link, and which parts of the trip it shows. */
function PublicLink({ tripId }: { tripId: number }) {
  const { t } = useTranslation()
  const link = useShareLink(tripId)
  if (link.loading) return null
  return (
    <LinkCard icon={<Link2 size={15} strokeWidth={2.2} />} title={t('share.linkTitle')} hint={t('share.linkHint')}>
      <div className="flex flex-wrap gap-1.5">
        {SHARE_SECTIONS.map(opt => (
          <PermChip key={opt.key} on={link.perms[opt.key]} disabled={opt.always} label={t(opt.label)}
            onToggle={() => void link.setPerm(opt.key, !link.perms[opt.key])} />
        ))}
      </div>
      <div>
        <span className={LABEL}>{t('share.options')}</span>
        <div className="flex flex-wrap gap-1.5">
          {SHARE_OPTIONS.map(opt => (
            <PermChip key={opt.key} on={link.perms[opt.key]} label={t(opt.label)} hint={t(`${opt.label}Hint`)}
              onToggle={() => void link.setPerm(opt.key, !link.perms[opt.key])} />
          ))}
        </div>
      </div>
      {link.url ? (
        <>
          <LinkLine url={link.url} copied={link.copied} onCopy={() => void link.copy()} />
          <div>
            <button type="button" onClick={() => void link.remove()} className={DANGER_BUTTON} style={fs(12.5, 'body')}>
              <Trash2 size={13} strokeWidth={2.2} />{t('share.deleteLink')}
            </button>
          </div>
        </>
      ) : (
        <AddRowButton onClick={() => void link.create()}>{t('share.createLink')}</AddRowButton>
      )}
    </LinkCard>
  )
}

/** The link an existing user opens to join as a member (#1143). */
function InviteLink({ tripId }: { tripId: number }) {
  const { t } = useTranslation()
  const link = useTripInviteLink(tripId)
  if (link.loading) return null
  return (
    <LinkCard icon={<UserPlus size={15} strokeWidth={2.2} />} title={t('trip.invite.linkTitle')} hint={t('trip.invite.linkHint')}>
      {link.url ? (
        <>
          <LinkLine url={link.url} copied={link.copied} onCopy={() => void link.copy()} />
          <div className="flex flex-wrap gap-2">
            <DialogButton onClick={() => void link.create()} disabled={link.busy} icon={<Link2 size={14} strokeWidth={2.2} />}>
              {t('trip.invite.regenerate')}
            </DialogButton>
            <button type="button" onClick={() => void link.remove()} disabled={link.busy} className={DANGER_BUTTON} style={fs(12.5, 'body')}>
              <Trash2 size={13} strokeWidth={2.2} />{t('trip.invite.disable')}
            </button>
          </div>
        </>
      ) : (
        <AddRowButton onClick={() => void link.create()} disabled={link.busy}>{t('trip.invite.create')}</AddRowButton>
      )}
    </LinkCard>
  )
}
