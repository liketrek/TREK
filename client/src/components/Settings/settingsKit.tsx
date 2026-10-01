import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { NEUTRAL_TINT, fs } from '../shared/DialogShell'

/*
 * The settings and admin pages in the planner's language (#2541): a tinted bar
 * on top, cards with a head band, white rows inside them, eyebrow labels over
 * fields. One kit for both pages, so a toggle, a hint or a danger zone reads the
 * same wherever it sits. Fields themselves come from shared/dialogParts (INPUT,
 * EditorField, Segmented) and shared/CustomSelect, like in the editors.
 */

type IconLike = LucideIcon | React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>

/** The page's own bar: icon tile, title and subtitle on the left, actions on the right. */
export function SettingsHeader({ icon: Icon, title, subtitle, actions }: {
  icon: IconLike
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[18px] bg-surface-tertiary py-3 pl-3 pr-3">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-[12px] bg-surface-card text-content-secondary shadow-sm">
        <Icon size={18} strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="m-0 text-subtitle font-semibold tracking-[-0.01em] text-content">{title}</h1>
        {subtitle && <p className="m-0 text-content-muted" style={fs(12.5, 'body')}>{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/**
 * A group of settings: a card with a head band (icon tile, title, an optional
 * badge and an action on the right) and its body below. `tone` tints the band:
 * neutral for ordinary groups, danger for the destructive ones.
 */
export function SettingsCard({ icon: Icon, title, hint, badge, action, tone = 'neutral', children, id, bodyClassName }: {
  icon?: IconLike
  title: ReactNode
  /** One line under the title in the band. */
  hint?: ReactNode
  badge?: ReactNode
  action?: ReactNode
  tone?: 'neutral' | 'danger'
  children?: ReactNode
  id?: string
  /** Replaces the body's padded column. */
  bodyClassName?: string
}) {
  const tint = tone === 'danger' ? 'color-mix(in srgb, var(--danger) 9%, transparent)' : NEUTRAL_TINT
  return (
    <section id={id} className="mb-5 overflow-hidden rounded-2xl border border-edge-faint bg-surface-secondary">
      <div className="flex items-center gap-3 border-b border-edge-faint px-4 py-3" style={{ background: tint }}>
        {Icon && (
          <span className={`grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-card shadow-sm ${tone === 'danger' ? 'text-danger' : 'text-content-secondary'}`}>
            <Icon size={15} strokeWidth={2} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="m-0 truncate font-bold text-content" style={fs(14, 'body')}>{title}</h2>
            {badge}
          </div>
          {hint && <p className="m-0 mt-0.5 text-content-faint" style={fs(11.5)}>{hint}</p>}
        </div>
        {action && <div className="flex flex-none items-center gap-1.5">{action}</div>}
      </div>
      {children != null && <div className={bodyClassName ?? 'flex flex-col gap-4 p-4'}>{children}</div>}
    </section>
  )
}

/** A white box of rows separated by hairlines, the way the bag sidebar lists its bags. */
export function SettingRows({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`divide-y divide-edge-faint overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card ${className}`}>
      {children}
    </div>
  )
}

/**
 * One setting as a row: what it is (and a hint) on the left, the control on the
 * right. `stacked` puts the control under the text for wide controls (a select,
 * a segmented row) on narrow windows and always for a `full` control.
 */
export function SettingRow({ label, hint, control, children, stacked = false, dimmed = false, htmlFor }: {
  label: ReactNode
  hint?: ReactNode
  /** The control on the right. */
  control?: ReactNode
  /** Extra content under the row (an expanded editor, a list). */
  children?: ReactNode
  stacked?: boolean
  /** While a save is on its way. */
  dimmed?: boolean
  htmlFor?: string
}) {
  return (
    <div className={`px-3.5 py-3 ${dimmed ? 'opacity-60' : ''}`}>
      <div className={stacked ? 'flex flex-col gap-2.5' : 'flex flex-wrap items-center gap-x-4 gap-y-2'}>
        {/* The basis only in a row: in the stacked column it would read as a height. */}
        <div className={stacked ? 'min-w-0' : 'min-w-0 flex-1 basis-56'}>
          <label htmlFor={htmlFor} className="block font-medium text-content" style={fs(13, 'body')}>{label}</label>
          {hint && <p className="m-0 mt-0.5 leading-snug text-content-faint" style={fs(11.5)}>{hint}</p>}
        </div>
        {control && <div className={stacked ? 'min-w-0' : 'flex flex-none items-center gap-2'}>{control}</div>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}

/** A quiet line of explanation inside a card body. */
export function SettingsHint({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`m-0 leading-normal text-content-faint ${className}`} style={fs(11.5)}>{children}</p>
}

/** A row of pills to pick one (or several) from, for choices too many for a segmented track. */
export function ChoiceChips<T extends string>({ value, options, onChange, label, multi }: {
  value: T | T[]
  options: readonly { value: T; label: ReactNode; title?: string }[]
  onChange: (value: T) => void
  label: string
  multi?: boolean
}) {
  const isOn = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v)
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map(o => {
        const on = isOn(o.value)
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} aria-pressed={on} title={o.title}
            {...(multi ? { role: 'checkbox', 'aria-checked': on } : {})}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-[5px] font-medium transition-colors ${on ? 'border-[color:var(--text-primary)] bg-surface-card text-content shadow-sm' : 'border-edge bg-surface-card text-content-muted hover:text-content'}`}
            style={fs(12.5, 'body')}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** A small status pill for a card's band or a row: neutral, success, warning or danger. */
export function StatusPill({ tone = 'neutral', children, icon }: { tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent'; children: ReactNode; icon?: ReactNode }) {
  const look = {
    neutral: 'border border-edge-faint bg-surface-card text-content-secondary',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    accent: 'bg-accent text-accent-text',
  }[tone]
  return (
    <span className={`inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-full px-2 py-[2px] font-geist font-semibold tabular-nums ${look}`} style={fs(11)}>
      {icon}{children}
    </span>
  )
}

/** The buttons of a settings card, in the dialogs' shapes. */
export const SETTINGS_BUTTON = 'inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-surface-card px-3.5 py-2 font-medium text-content shadow-sm ring-1 ring-edge-faint hover:bg-surface-secondary disabled:cursor-default disabled:opacity-50'
export const SETTINGS_BUTTON_PRIMARY = 'inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-accent px-4 py-2 font-medium text-accent-text hover:opacity-90 disabled:cursor-default disabled:opacity-50'
export const SETTINGS_BUTTON_DANGER = 'inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-danger-soft px-3.5 py-2 font-medium text-danger hover:opacity-90 disabled:cursor-default disabled:opacity-50'
/** A round icon action in a band or a row, named by its tooltip. */
export const SETTINGS_ICON_BUTTON = 'grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-card text-content-muted shadow-sm ring-1 ring-edge-faint hover:text-content disabled:cursor-default disabled:opacity-50'
