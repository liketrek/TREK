import ReactDOM from 'react-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Pencil, Users, Check } from 'lucide-react'
import { ChipWithTooltip, type TripMember } from '../Budget/BudgetPanelMemberChips'
import type { ReservationTraveler } from '@trek/shared'
import { useTranslation } from '../../i18n'

interface TravelerChipsProps {
  travelers?: ReservationTraveler[]
  tripMembers?: TripMember[]
  onSetTravelers: (userIds: number[]) => void
  compact?: boolean
  readOnly?: boolean
}

/**
 * Avatar-chip cluster + member/guest picker for a reservation's travelers (#1517).
 * Reuses the budget member ChipWithTooltip for the avatars, but drops the
 * cost-split (paid) semantics — a booking traveler is just a person, not a payer.
 * The picker list already includes named guests (they ride along on tripMembers).
 */
export default function TravelerChips({ travelers = [], tripMembers = [], onSetTravelers, compact = true, readOnly = false }: TravelerChipsProps) {
  const { t } = useTranslation()
  const chipSize = compact ? 20 : 26
  const btnSize = compact ? 18 : 24
  const iconSize = compact ? (travelers.length > 0 ? 8 : 9) : (travelers.length > 0 ? 11 : 13)
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const openDropdown = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + 4, left: rect.left + rect.width / 2 })
    }
    setShowDropdown(v => !v)
  }, [])

  useEffect(() => {
    if (!showDropdown) return
    const close = (e: MouseEvent) => {
      if (dropRef.current?.contains(e.target as Node)) return
      if (btnRef.current?.contains(e.target as Node)) return
      setShowDropdown(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showDropdown])

  const travelerIds = travelers.map(tv => tv.user_id)
  const toggle = (userId: number) => {
    onSetTravelers(travelerIds.includes(userId) ? travelerIds.filter(id => id !== userId) : [...travelerIds, userId])
  }

  // Read-only with nobody assigned renders nothing (keeps cards clean).
  if (readOnly && travelers.length === 0) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      {travelers.map(tv => (
        <ChipWithTooltip key={tv.user_id} label={tv.username} avatarUrl={tv.avatar_url ?? null} size={chipSize} />
      ))}
      {!readOnly && (
        <button ref={btnRef} onClick={openDropdown} type="button"
          title={t('reservations.travelers.assign')}
          aria-label={t('reservations.travelers.assign')}
          style={{
            width: btnSize, height: btnSize, borderRadius: '50%', border: '1.5px dashed var(--border-primary)',
            background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-faint)', padding: 0, flexShrink: 0,
          }}>
          {travelers.length > 0 ? <Pencil size={iconSize} /> : <Users size={iconSize} />}
        </button>
      )}
      {showDropdown && ReactDOM.createPortal(
        <div ref={dropRef} style={{
          position: 'fixed', top: dropPos.top, left: dropPos.left, transform: 'translateX(-50%)', zIndex: 10000,
          background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 4, minWidth: 168, maxHeight: 280, overflowY: 'auto',
        }}>
          {tripMembers.length === 0 && (
            <div style={{ padding: '6px 8px', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>
              {t('reservations.travelers.none')}
            </div>
          )}
          {tripMembers.map(tm => {
            const isActive = travelerIds.includes(tm.id)
            return (
              <button key={tm.id} type="button" onClick={() => toggle(tm.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 8px',
                borderRadius: 6, border: 'none', background: isActive ? 'var(--bg-hover)' : 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-primary)', textAlign: 'left',
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none' }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(8px * var(--fs-scale-caption, 1))', fontWeight: 700,
                  color: 'var(--text-muted)', overflow: 'hidden', flexShrink: 0,
                }}>
                  {tm.avatar_url
                    ? <img src={tm.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    : tm.username?.[0]?.toUpperCase()}
                </div>
                <span style={{ flex: 1 }}>{tm.username}</span>
                {isActive && <Check size={12} color="var(--text-primary)" />}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}
