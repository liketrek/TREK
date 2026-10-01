import React from 'react'

/** The track and the knob glide with the same easing the planner's panels use. */
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'

/**
 * `describedBy` names the element that explains the switch, for a switch whose label alone
 * does not say what flipping it changes.
 */
export default function ToggleSwitch({ on, onToggle, label, describedBy }: { on: boolean; onToggle: () => void; label?: string; describedBy?: string }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={on} aria-label={label} aria-describedby={describedBy}
      // A keyboard focus ring in the text colour, like the fields; the pointer gets none.
      className="group outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--text-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-card)]"
      style={{
        position: 'relative', width: 44, height: 24, minWidth: 44, flexShrink: 0,
        borderRadius: 12, border: 'none', padding: 0, cursor: 'pointer',
        background: on ? 'var(--accent, #111827)' : 'var(--border-primary, #d1d5db)',
        boxShadow: 'inset 0 1px 2px color-mix(in srgb, var(--text-primary) 12%, transparent)',
        transition: `background 0.2s ${EASE}`,
      }}>
      {/* The knob reads against its own track: --accent-text is what the palette
          already picked to sit on --accent, so a light accent gets a dark knob
          instead of the white-on-near-white it used to be in dark mode. */}
      <span className="group-active:scale-95" style={{
        position: 'absolute', top: 2, left: on ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: on ? 'var(--accent-text, #ffffff)' : 'var(--bg-card, #ffffff)',
        transition: `left 0.22s ${EASE}, transform 0.15s ease`,
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.2))',
      }} />
    </button>
  )
}
