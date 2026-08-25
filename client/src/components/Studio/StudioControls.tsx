import { useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import ToggleSwitch from '../Settings/ToggleSwitch'

/**
 * The inspector's vocabulary.
 *
 * ── Why this file exists ─────────────────────────────────────────────────
 *
 * The panel had grown four ways of saying "this one is on" — a filled pill, a
 * ring, a tinted border, ink on a tint — and used the *same* pill for a choice
 * between four things and for a switch that turns one thing off. A map showed
 * seventy controls in ten sections that were all open at once, all labelled in
 * the same small capitals, so nothing on the panel looked more important than
 * anything else. None of that was a decision; it was what happens when a panel
 * grows one control at a time.
 *
 * So there are now exactly three ways to answer a question here, and each looks
 * like what it is:
 *
 *   **Choose one** is a row of chips, and the chosen one is filled.
 *   **Choose several** is a row of chips that carry a tick when they are on,
 *     because a set with three of seven picked has to be readable at a glance.
 *   **On or off** is the app's switch, on its own line beside the words —
 *     the one control in TREK that already means exactly that.
 *
 * A section can be folded away, which is the other half of the answer: a
 * property panel is a reference, and a reference nobody can collapse is a wall.
 */

/**
 * One group of properties.
 *
 * `defaultOpen={false}` is for the groups you set once and rarely return to —
 * the frame's numbers, mostly. The state is per mounted section rather than
 * remembered: coming back to an element and finding its panel folded up
 * differently from last time is worse than opening one group again.
 */
export function Section({ label, children, defaultOpen = true, hint }: {
  label: string
  children: ReactNode
  defaultOpen?: boolean
  /** A line under the label, for a group whose name cannot carry the whole idea. */
  hint?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`st-section is-fold ${open ? '' : 'is-folded'}`}>
      <button type="button" className="st-section-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="st-section-label">{label}</span>
        <ChevronDown size={13} className="st-section-caret" />
      </button>
      {open && (
        <div className="st-section-body">
          {hint && <p className="st-hint st-section-hint">{hint}</p>}
          {children}
        </div>
      )}
    </div>
  )
}

/** A labelled line. The label sits left, the control fills what is left. */
export function Line({ label, children, wide = false }: {
  label: string
  children: ReactNode
  /** Put the control under the label rather than beside it, when it needs the width. */
  wide?: boolean
}) {
  return (
    <div className={`st-line ${wide ? 'is-wide' : ''}`}>
      <span className="st-line-label">{label}</span>
      <div className="st-line-body">{children}</div>
    </div>
  )
}

/** Choose one of a few. The chosen one is filled in. */
export function Choice<T extends string | number>({ value, options, onPick, ariaLabel }: {
  value: T
  options: { value: T; label: ReactNode; title?: string; disabled?: boolean }[]
  onPick: (v: T) => void
  ariaLabel?: string
}) {
  return (
    <div className="st-row" role="radiogroup" aria-label={ariaLabel}>
      {options.map(o => (
        <button type="button"
          key={String(o.value)}
          role="radio"
          aria-checked={o.value === value}
          className={`st-chip ${o.value === value ? 'is-on' : ''}`}
          disabled={o.disabled}
          title={o.title}
          onClick={() => onPick(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Choose several. A tick marks what is in the set.
 *
 * Not switches: seven metrics as seven switched lines is a column of switches
 * taller than the element it configures, and what matters about a set is which
 * of it is in — a question a row answers and a list does not.
 */
export function Picks<T extends string>({ value, options, onToggle }: {
  value: readonly T[]
  options: { value: T; label: ReactNode; disabled?: boolean }[]
  onToggle: (v: T) => void
}) {
  return (
    <div className="st-row">
      {options.map(o => {
        const on = value.includes(o.value)
        return (
          <button type="button"
            key={o.value}
            role="checkbox"
            aria-checked={on}
            className={`st-chip is-pick ${on ? 'is-on' : ''}`}
            disabled={o.disabled}
            onClick={() => onToggle(o.value)}
          >
            {on && <Check size={12} strokeWidth={3} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** On or off, said the way the rest of TREK says it. */
export function Switch({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="st-switch">
      <span className="st-switch-label">{label}</span>
      <ToggleSwitch on={on} onToggle={onToggle} label={label} />
    </div>
  )
}

/**
 * A number, with its unit.
 *
 * Held as text while it is being typed and only read back on blur or Enter,
 * which fixes three things at once: "0." no longer snaps to "0" the moment the
 * point is typed, an emptied field no longer collapses the element to zero,
 * and a value is one undo step rather than one per keystroke.
 */
export function NumField({
  label, value, onChange, min, max, step = 0.5, unit,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
}) {
  const shown = String(Math.round(value * 100) / 100)
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (raw: string) => {
    setDraft(null)
    const v = Number(raw)
    if (raw.trim() === '' || !Number.isFinite(v)) return
    const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v))
    if (clamped !== value) onChange(clamped)
  }

  return (
    <label className="st-num">
      <span className="st-num-label">{label}</span>
      <span className="st-num-box">
        <input
          className="st-input"
          type="number"
          value={draft ?? shown}
          step={step}
          min={min}
          max={max}
          onChange={e => setDraft(e.target.value)}
          onBlur={e => commit(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') setDraft(null)
          }}
        />
        {unit && <span className="st-num-unit">{unit}</span>}
      </span>
    </label>
  )
}
