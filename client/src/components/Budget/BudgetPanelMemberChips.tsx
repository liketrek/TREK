import ReactDOM from 'react-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Pencil, Users, Check } from 'lucide-react'
import type { BudgetItemMember } from '../../types'

export interface TripMember {
  id: number
  username: string
  avatar_url?: string | null
}

// ── Chip with custom tooltip ─────────────────────────────────────────────────
interface ChipWithTooltipProps {
  label: string
  avatarUrl: string | null
  size?: number
  paid?: boolean
  onClick?: () => void
}

export function ChipWithTooltip({ label, avatarUrl, size = 20, paid, onClick }: ChipWithTooltipProps) {
  const [hover, setHover] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)

  const onEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setPos({ top: rect.top - 6, left: rect.left + rect.width / 2 })
    }
    setHover(true)
  }

  const borderColor = paid ? '#22c55e' : 'var(--border-primary)'
  const bg = paid ? 'rgba(34,197,94,0.15)' : 'var(--bg-tertiary)'

  return (
    <>
      <div ref={ref} onMouseEnter={onEnter} onMouseLeave={() => setHover(false)}
        onClick={onClick}
        style={{
          width: size, height: size, borderRadius: '50%', border: `2px solid ${borderColor}`,
          background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4, fontWeight: 700, color: paid ? '#16a34a' : 'var(--text-muted)',
          overflow: 'hidden', flexShrink: 0, cursor: onClick ? 'pointer' : 'default',
          transition: 'border-color 0.15s, background 0.15s',
        }}>
        {avatarUrl
          ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : label?.[0]?.toUpperCase()
        }
      </div>
      {hover && ReactDOM.createPortal(
        <div style={{
          position: 'fixed', top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)',
          pointerEvents: 'none', zIndex: 10000, whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'var(--bg-card, white)', color: 'var(--text-primary, #111827)',
          fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid var(--border-faint, #e5e7eb)',
        }}>
          {label}
          {paid && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
              background: 'rgba(34,197,94,0.15)', color: '#16a34a',
              textTransform: 'uppercase', letterSpacing: '0.03em',
            }}>Paid</span>
          )}
        </div>,
        document.body
      )}
    </>
  )
}

// ── Budget Member Chips (for Persons column) ────────────────────────────────
interface BudgetMemberChipsProps {
  members?: BudgetItemMember[]
  tripMembers?: TripMember[]
  onSetMembers: (memberIds: number[]) => void
  onTogglePaid?: (userId: number, paid: boolean) => void
  compact?: boolean
  readOnly?: boolean
}

export default function BudgetMemberChips({ members = [], tripMembers = [], onSetMembers, onTogglePaid, compact = true, readOnly = false }: BudgetMemberChipsProps) {
  const chipSize = compact ? 20 : 30
  const btnSize = compact ? 18 : 28
  const iconSize = compact ? (members.length > 0 ? 8 : 9) : (members.length > 0 ? 12 : 14)
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
      if (dropRef.current && dropRef.current.contains(e.target as Node)) return
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return
      setShowDropdown(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showDropdown])

  const memberIds = members.map(m => m.user_id)

  const toggleMember = (userId: number) => {
    const newIds = memberIds.includes(userId)
      ? memberIds.filter(id => id !== userId)
      : [...memberIds, userId]
    onSetMembers(newIds)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
      {members.map(m => (
        <ChipWithTooltip key={m.user_id} label={m.username} avatarUrl={m.avatar_url} size={chipSize}
          paid={!!m.paid}
          onClick={!readOnly && onTogglePaid ? () => onTogglePaid(m.user_id, !m.paid) : undefined}
        />
      ))}
      {!readOnly && (
        <button ref={btnRef} onClick={openDropdown}
          style={{
            width: btnSize, height: btnSize, borderRadius: '50%', border: '1.5px dashed var(--border-primary)',
            background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-faint)', padding: 0, flexShrink: 0,
          }}>
          {members.length > 0 ? <Pencil size={iconSize} /> : <Users size={iconSize} />}
        </button>
      )}
      {showDropdown && ReactDOM.createPortal(
        <div ref={dropRef} style={{
          position: 'fixed', top: dropPos.top, left: dropPos.left, transform: 'translateX(-50%)', zIndex: 10000,
          background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 4, minWidth: 150,
        }}>
          {tripMembers.map(tm => {
            const isActive = memberIds.includes(tm.id)
            return (
              <button key={tm.id} onClick={() => toggleMember(tm.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 8px',
                borderRadius: 6, border: 'none', background: isActive ? 'var(--bg-hover)' : 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 11, color: 'var(--text-primary)', textAlign: 'left',
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none' }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700,
                  color: 'var(--text-muted)', overflow: 'hidden', flexShrink: 0,
                }}>
                  {tm.avatar_url
                    ? <img src={tm.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : tm.username?.[0]?.toUpperCase()
                  }
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
