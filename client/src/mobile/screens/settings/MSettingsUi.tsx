import React, { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

/**
 * Shared building blocks of the mobile settings screen, all straight from the
 * demo's "Language & region" card: opaque r18 cards, Geist eyebrow labels,
 * select rows, wide segments and the small On/Off pill.
 */

interface MSetCardProps {
  title: string
  icon: LucideIcon
  badge?: ReactNode
  className?: string
  children: ReactNode
}

/** Opaque settings card: r18 on --m-sheetop with a bold 14px title row. */
export function MSetCard({ title, icon: Icon, badge, className = '', children }: MSetCardProps) {
  return (
    <section className={`rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-[14px] ${className}`}>
      <div className="mb-3 flex items-center gap-2 text-[0.875rem] font-extrabold text-m-ink">
        <Icon size={16} strokeWidth={2.2} className="flex-none" />
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {badge}
      </div>
      {children}
    </section>
  )
}

/** Geist 10px uppercase eyebrow above a control ("CURRENCY", "LANGUAGE", …). */
export function MSetEyebrow({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint ${className}`}>
      {children}
    </div>
  )
}

interface MSetSelectRowProps {
  label: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  className?: string
}

/** Tappable select row (11/13px padding, r12 on the --m-sheet surface). */
export function MSetSelectRow({ label, trailing, onClick, className = '' }: MSetSelectRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[13px] py-[11px] text-left text-[0.8125rem] font-semibold text-m-ink ${className}`}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing}
    </button>
  )
}

export interface MSetSegmentOption<T extends string = string> {
  value: T
  label: ReactNode
}

interface MSetSegmentsProps<T extends string = string> {
  options: MSetSegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** Wide segment pair/triple of the General card: r12 blocks, active on --m-act. */
export function MSetSegments<T extends string = string>({ options, value, onChange, className = '' }: MSetSegmentsProps<T>) {
  return (
    <div className={`flex gap-[6px] ${className}`}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`min-w-0 flex-1 rounded-xl py-[9px] text-center text-[0.78125rem] ${
              active ? 'bg-m-act font-semibold text-m-actfg' : 'font-medium text-m-ink'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

interface MSetOnOffProps {
  on: boolean
  onChange: (on: boolean) => void
  onLabel: string
  offLabel: string
  ariaLabel?: string
}

/** Small On/Off pill of the Travel & map rows (3px track, 11px bold segments). */
export function MSetOnOff({ on, onChange, onLabel, offLabel, ariaLabel }: MSetOnOffProps) {
  const seg = (active: boolean) =>
    `rounded-full px-3 py-[5px] text-[0.6875rem] font-bold ${
      active
        ? 'bg-m-act text-m-actfg'
        : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'
    }`
  return (
    <span role="group" aria-label={ariaLabel} className="flex flex-none rounded-full bg-[color:var(--m-ic)] p-[3px]">
      <button type="button" aria-pressed={on} onClick={() => onChange(true)} className={seg(on)}>
        {onLabel}
      </button>
      <button type="button" aria-pressed={!on} onClick={() => onChange(false)} className={seg(!on)}>
        {offLabel}
      </button>
    </span>
  )
}

interface MSetRowProps {
  label: ReactNode
  sub?: ReactNode
  trailing?: ReactNode
  first?: boolean
}

/** Setting row with label + Geist sub line and a trailing control. */
export function MSetRow({ label, sub, trailing, first = false }: MSetRowProps) {
  return (
    <div className={`flex items-center gap-[10px] py-[10px] ${first ? '' : 'border-t border-[color:var(--m-rowbr)]'}`}>
      <div className="min-w-0 flex-1">
        <div className="text-[0.78125rem] font-bold text-m-ink">{label}</div>
        {sub && <div className="mt-[1px] font-geist text-[0.625rem] text-m-muted">{sub}</div>}
      </div>
      {trailing}
    </div>
  )
}

type MSetInputProps = React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }

/** Text input on the --m-sheet surface, matching the select rows. */
export function MSetInput({ mono = false, className = '', ...rest }: MSetInputProps) {
  return (
    <input
      {...rest}
      className={`w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[13px] py-[11px] text-[0.8125rem] font-semibold text-m-ink outline-none placeholder:font-medium placeholder:text-m-faint ${
        mono ? 'font-mono' : ''
      } ${className}`}
    />
  )
}

/** Textarea sibling of MSetInput. */
export function MSetTextarea({ className = '', ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      className={`w-full resize-none rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[13px] py-[11px] text-[0.8125rem] font-semibold text-m-ink outline-none placeholder:font-medium placeholder:text-m-faint ${className}`}
    />
  )
}

interface MSetButtonProps {
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'ghost' | 'danger'
  className?: string
  children: ReactNode
}

/** Pill button: act-filled primary, neutral ghost, outlined danger. */
export function MSetButton({ onClick, disabled = false, variant = 'primary', className = '', children }: MSetButtonProps) {
  const look =
    variant === 'primary'
      ? 'bg-m-act text-m-actfg'
      : variant === 'danger'
        ? 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-[color:var(--m-st-danger)]'
        : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-[6px] rounded-full px-4 py-[9px] text-[0.78125rem] font-bold disabled:opacity-50 ${look} ${className}`}
    >
      {children}
    </button>
  )
}

/** Faint hint line under a control. */
export function MSetHint({ className = '', children }: { className?: string; children: ReactNode }) {
  return <p className={`mt-[6px] font-geist text-[0.625rem] leading-relaxed text-m-muted ${className}`}>{children}</p>
}
