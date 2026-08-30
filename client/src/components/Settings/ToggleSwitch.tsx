import React from 'react'

export default function ToggleSwitch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label?: string }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={on} aria-label={label}
      style={{
        position: 'relative', width: 44, height: 24, minWidth: 44, flexShrink: 0,
        borderRadius: 12, border: 'none', padding: 0, cursor: 'pointer',
        background: on ? 'var(--accent, #111827)' : 'var(--border-primary, #d1d5db)',
        transition: 'background 0.2s',
      }}>
      {/* The knob reads against its own track: --accent-text is what the palette
          already picked to sit on --accent, so a light accent gets a dark knob
          instead of the white-on-near-white it used to be in dark mode. */}
      <span style={{
        position: 'absolute', top: 2, left: on ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: on ? 'var(--accent-text, #ffffff)' : 'var(--bg-card, #ffffff)',
        transition: 'left 0.2s', boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.2))',
      }} />
    </button>
  )
}
