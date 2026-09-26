import type { ReactNode } from 'react'
import { Check } from 'lucide-react'

/** An entry in a packing popover: icon column, label, a tick on the current choice (the shared look is in packingPopoverStyles.ts). */
interface PopoverItemProps {
  icon: ReactNode
  label: string
  onClick: () => void
  active?: boolean
  danger?: boolean
  /** A secondary line, such as Add bag, in the faint text colour. */
  muted?: boolean
  /** What sits at the right end; the current choice gets a tick by default. */
  trailing?: ReactNode
}

export function PopoverItem({ icon, label, onClick, active = false, danger = false, muted = false, trailing }: PopoverItemProps) {
  const tone = danger ? '#ef4444' : muted ? 'var(--text-faint)' : 'var(--text-primary)'
  return (
    <button type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9, width: '100%',
        padding: '8px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
        background: active ? 'var(--bg-tertiary)' : 'none',
        color: tone,
        fontFamily: 'inherit', fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 500, textAlign: 'left',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.1)' : 'var(--bg-tertiary)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none' }}
    >
      <span style={{ width: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: danger ? '#ef4444' : 'var(--text-muted)' }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {trailing ?? (active ? <Check size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : null)}
    </button>
  )
}
