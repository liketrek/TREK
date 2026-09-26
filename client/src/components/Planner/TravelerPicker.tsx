import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Users } from 'lucide-react'
import type { ReservationTraveler } from '@trek/shared'
import { SPLIT_COLORS } from '../Budget/BudgetPanel.constants'
import type { TripMember } from '../Budget/BudgetPanelMemberChips'
import GuestBadge from '../shared/GuestBadge'
import { useTranslation } from '../../i18n'

// Deterministic colour per user so the same person keeps their gradient across the
// picker, the card and the cost-split chips (mirrors BudgetPanel.helpers).
function colorFor(userId: number) {
  const n = SPLIT_COLORS.length
  return SPLIT_COLORS[(((Math.trunc(userId) - 1) % n) + n) % n]
}

function Avatar({ userId, username, avatarUrl, size = 22, dim = false }: {
  userId: number
  username?: string
  avatarUrl?: string | null
  size?: number
  dim?: boolean
}) {
  const base = { width: size, height: size, borderRadius: '50%', flexShrink: 0, opacity: dim ? 0.5 : 1 } as const
  if (avatarUrl) return <img src={avatarUrl} alt="" style={{ ...base, objectFit: 'cover' }} />
  return (
    <span style={{
      ...base, background: colorFor(userId).gradient, color: '#fff',
      display: 'grid', placeItems: 'center', fontSize: Math.round(size * 0.4), fontWeight: 700,
    }}>
      {(username || '?').charAt(0).toUpperCase()}
    </span>
  )
}

/**
 * Who travels on a booking or transport, for its edit and create dialogs
 * (#1517): a field shaped like the TREK dropdown beside it, showing the chosen
 * people as avatars and names, that opens a list to tick them on and off.
 * Guests ride along on tripMembers, so no separate list is needed.
 */
export function TravelerPicker({ tripMembers, selectedIds, onToggle }: {
  tripMembers: TripMember[]
  selectedIds: Set<number>
  onToggle: (id: number) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open])

  const field = {
    width: '100%', minHeight: 38, display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 8px',
    borderRadius: 10, border: '1px solid var(--border-primary)', background: 'var(--bg-input)',
    fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, fontFamily: 'inherit', textAlign: 'left',
  } as const

  if (tripMembers.length === 0) {
    return <div className="text-content-faint" style={{ ...field, paddingLeft: 12 }}>{t('reservations.travelers.none')}</div>
  }

  const chosen = tripMembers.filter(m => selectedIds.has(m.id))
  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-haspopup="listbox"
        className="text-content transition-colors hover:border-content-faint" style={{ ...field, cursor: 'pointer' }}>
        {chosen.length > 0 ? (
          <>
            <span style={{ display: 'inline-flex', flexShrink: 0 }}>
              {chosen.slice(0, 4).map((m, i) => (
                <span key={m.id} style={{ marginLeft: i ? -7 : 0, borderRadius: '50%', boxShadow: '0 0 0 2px var(--bg-input)', display: 'inline-flex' }}>
                  <Avatar userId={m.id} username={m.username} avatarUrl={m.avatar_url} />
                </span>
              ))}
            </span>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {chosen.map(m => m.username).join(', ')}
            </span>
          </>
        ) : (
          <>
            <Users size={15} className="text-content-faint" style={{ flexShrink: 0, marginLeft: 4 }} />
            <span className="text-content-faint" style={{ flex: 1 }}>{t('reservations.travelers.assign')}</span>
          </>
        )}
        <ChevronDown size={14} className="text-content-faint" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div role="listbox" aria-multiselectable="true" className="bg-surface-card" style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 50,
          border: '1px solid var(--border-secondary)', borderRadius: 12, padding: 6, maxHeight: 260, overflowY: 'auto',
          boxShadow: '0 12px 32px -8px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.06)',
        }}>
          {tripMembers.map(m => {
            const on = selectedIds.has(m.id)
            return (
              <button key={m.id} type="button" onClick={() => onToggle(m.id)} aria-pressed={on}
                className={`transition-colors hover:bg-surface-tertiary ${on ? 'text-content' : 'text-content-muted'}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 9px', borderRadius: 8,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: on ? 600 : 500,
                }}>
                <Avatar userId={m.id} username={m.username} avatarUrl={m.avatar_url} dim={!on} />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.username}</span>
                {m.is_guest && <GuestBadge size="xs" />}
                <Check size={14} strokeWidth={2.5} style={{ flexShrink: 0, opacity: on ? 1 : 0 }} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Read-only traveler pills for a reservation card. Each person is a rounded badge
 * (avatar + name) on bg-surface-card so they stand out inside the card's grey field
 * box. Renders nothing when nobody is assigned, so a card without travelers stays
 * clean (#1517).
 */
export function TravelerAvatarRow({ travelers }: { travelers?: ReservationTraveler[] }) {
  if (!travelers || travelers.length === 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {travelers.map(tv => (
        <span key={tv.user_id} className="bg-surface-card" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 99,
          border: '1px solid var(--border-primary)', padding: '3px 11px 3px 3px',
        }}>
          <Avatar userId={tv.user_id} username={tv.username} avatarUrl={tv.avatar_url} size={18} />
          <span className="text-content-secondary" style={{ fontSize: 'calc(12px * var(--fs-scale-caption, 1))', fontWeight: 600, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tv.username}</span>
          {!!tv.is_guest && <GuestBadge size="xs" />}
        </span>
      ))}
    </div>
  )
}

/**
 * Avatar filter row for the reservations toolbar — toggle to show only bookings
 * assigned to the picked members/guests (#1517/#1557). Active avatars get an accent
 * ring + check badge; the rest dim once any filter is on. Gradient avatars keep it
 * consistent with the traveler pills and the cost-split chips.
 */
export function TravelerFilterAvatars({ members, active, onToggle, label }: {
  members: TripMember[]
  active: Set<number>
  onToggle: (id: number) => void
  label?: string
}) {
  const hasFilter = active.size > 0
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }} title={label} aria-label={label}>
      <Users size={13} className="text-content-faint" style={{ flexShrink: 0, marginRight: 1 }} />
      {members.map(m => {
        const on = active.has(m.id)
        const dim = hasFilter && !on
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onToggle(m.id)}
            title={m.username}
            aria-pressed={on}
            style={{
              position: 'relative', width: 28, height: 28, borderRadius: '50%', padding: 0, flexShrink: 0,
              border: 'none', background: 'none', cursor: 'pointer',
              opacity: dim ? 0.4 : 1, transform: on ? 'scale(1.05)' : 'scale(1)',
              transition: 'opacity 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={e => { if (!on) e.currentTarget.style.opacity = dim ? '0.7' : '0.82' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = dim ? '0.4' : '1' }}
          >
            <span style={{
              display: 'grid', placeItems: 'center', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
              background: m.avatar_url ? 'transparent' : colorFor(m.id).gradient,
              color: '#fff', fontSize: 11, fontWeight: 700,
              boxShadow: on ? '0 0 0 2px var(--accent)' : 'inset 0 0 0 1.5px var(--border-primary)',
              transition: 'box-shadow 0.15s ease',
            }}>
              {m.avatar_url
                ? <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (m.username || '?').charAt(0).toUpperCase()}
            </span>
            {on && (
              <span style={{
                position: 'absolute', right: -2, bottom: -2, width: 13, height: 13, borderRadius: '50%',
                background: 'var(--accent)', display: 'grid', placeItems: 'center', boxShadow: '0 0 0 1.5px var(--bg-tertiary)',
              }}>
                <Check size={8} strokeWidth={3.5} color="#fff" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
