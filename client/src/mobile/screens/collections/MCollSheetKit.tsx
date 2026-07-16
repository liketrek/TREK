import { ReactNode } from 'react'
import { X } from 'lucide-react'

/** Shared sheet scaffolding of the collections sheets (opaque floating cards). */

export const INPUT_CLS =
  'w-full box-border rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[13px] py-[11px] font-[inherit] text-[0.8125rem] text-m-ink outline-none placeholder:text-m-faint'

export const TEXTAREA_CLS =
  'w-full box-border resize-none rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[13px] py-[11px] font-geist text-[0.78125rem] leading-[1.5] text-m-ink outline-none placeholder:text-m-faint'

interface SheetHeaderProps {
  title: ReactNode
  onClose: () => void
  closeLabel: string
}

/** Sheet header: 17px/700 title + 34px round close, hairline below. */
export function SheetHeader({ title, onClose, closeLabel }: SheetHeaderProps) {
  return (
    <div className="flex flex-none items-center gap-[11px] border-b border-[color:var(--m-rowbr)] px-[18px] pb-[10px] pt-4">
      <div className="min-w-0 flex-1 truncate text-[1.0625rem] font-bold text-m-ink">{title}</div>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-ink"
      >
        <X size={15} strokeWidth={2.2} />
      </button>
    </div>
  )
}

/** Eyebrow section label: Geist 10px/700 letter-spacing .09em, faint. */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`font-geist text-[0.625rem] font-bold tracking-[.09em] text-m-faint ${className}`}>
      {children}
    </div>
  )
}

interface PillProps {
  onClick?: () => void
  disabled?: boolean
  className?: string
  children: ReactNode
}

/** Footer cancel pill (neutral --m-ic surface). */
export function CancelPill({ onClick, disabled, className = '', children }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-4 py-[9px] text-[0.78125rem] font-semibold text-m-ink disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

/** Footer primary pill on the --m-act surface. */
export function PrimaryPill({ onClick, disabled, className = '', children }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-[6px] rounded-full bg-m-act px-[18px] py-[9px] text-[0.78125rem] font-bold text-m-actfg disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

/** Sheet footer row above the safe area, hairline on top. */
export function SheetFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-none items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
      {children}
    </div>
  )
}
