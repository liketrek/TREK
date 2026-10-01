import type { ReactNode } from 'react'
import { Tooltip } from '../shared/Tooltip'
import { MAP_CONTROL_SHADOW } from './mapControlShadow'

/**
 * One round on/off control in the frosted shell every map control wears, so a new
 * one lines up with the compass, the layer switcher and the overview toggle.
 */
export function MapTogglePill({ active, onToggle, label, icon, testId, tooltipPlacement = 'left' }: {
  active: boolean
  onToggle: () => void
  label: string
  icon: ReactNode
  testId?: string
  /** Away from the edge the control hugs: left on the right edge, right on the left one. */
  tooltipPlacement?: 'left' | 'right'
}) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', padding: 4, borderRadius: 999, pointerEvents: 'auto',
      background: 'var(--sidebar-bg)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: MAP_CONTROL_SHADOW,
    }}>
      {/* TREK's own tooltip, not the browser's: the native one ignores the colour
          scheme, waits a second and a half, and cannot be read on a touch device. */}
      <Tooltip label={label} placement={tooltipPlacement}>
        <button
          type="button"
          onClick={onToggle}
          aria-label={label}
          aria-pressed={active}
          data-testid={testId}
          className={active ? 'text-accent' : 'text-content-muted'}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, borderRadius: 999, border: 'none', cursor: 'pointer',
            background: 'transparent', padding: 0,
            transition: 'background 0.14s, color 0.14s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          {icon}
        </button>
      </Tooltip>
    </div>
  )
}
