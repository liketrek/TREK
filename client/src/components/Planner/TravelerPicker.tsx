import { Check, Users } from 'lucide-react'
import type { ReservationTraveler } from '@trek/shared'
import { SPLIT_COLORS } from '../Budget/BudgetPanel.constants'
import type { TripMember } from '../Budget/BudgetPanelMemberChips'
import GuestBadge from '../shared/GuestBadge'
import { useTranslation } from '../../i18n'

// Deterministic colour per user so the same person keeps their gradient across the
// picker, the card and the cost-split chips (mirrors BudgetPanel.helpers).
function colorFor(userId: number) {
  const n = SPLIT_COLORS.length
  return SPLIT_COLORS[((((userId | 0) - 1) % n) + n) % n]
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
 * Toggle picker for the booking/transport edit & create modals — assign trip
 * members and named guests to a reservation (#1517). Guests ride along on
 * tripMembers, so no separate list is needed.
 */
export function TravelerPicker({ tripMembers, selectedIds, onToggle }: {
  tripMembers: TripMember[]
  selectedIds: Set<number>
  onToggle: (id: number) => void
}) {
  const { t } = useTranslation()
  if (tripMembers.length === 0) {
    return <div className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>{t('reservations.travelers.none')}</div>
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {tripMembers.map(m => {
        const on = selectedIds.has(m.id)
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onToggle(m.id)}
            aria-pressed={on}
            className={on ? 'bg-surface-hover text-content' : 'text-content-muted'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '4px 11px 4px 4px', borderRadius: 99,
              border: `1.5px solid ${on ? 'var(--text-primary)' : 'var(--border-primary)'}`,
              background: on ? undefined : 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500,
              opacity: on ? 1 : 0.6, transition: 'opacity 0.12s, border-color 0.12s, background 0.12s',
            }}
            onMouseEnter={e => { if (!on) e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { if (!on) e.currentTarget.style.opacity = '0.6' }}
          >
            <Avatar userId={m.id} username={m.username} avatarUrl={m.avatar_url} dim={!on} />
            <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.username}</span>
            {m.is_guest && <GuestBadge size="xs" />}
            {on && <Check size={13} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
          </button>
        )
      })}
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
