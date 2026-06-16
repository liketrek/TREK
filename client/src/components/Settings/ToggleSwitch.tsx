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
      <span style={{
        position: 'absolute', top: 2, left: on ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%', background: 'white',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}
