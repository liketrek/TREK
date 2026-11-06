import { ReactNode } from 'react'
import { X } from 'lucide-react'

/** Shared sheet scaffolding of the collections sheets (opaque floating cards). */

export const INPUT_CLS =
  'w-full box-border rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] py-[10px] font-[inherit] text-[0.8125rem] text-m-ink outline-none placeholder:text-m-faint'

export const TEXTAREA_CLS =
  'w-full box-border resize-none rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] py-[10px] font-geist text-[0.78125rem] leading-[1.5] text-m-ink outline-none placeholder:text-m-faint'

interface SheetHeaderProps {
  title: ReactNode
  /** The icon tile in front of the title, as every phone sheet has. */
  icon?: ReactNode
  sub?: ReactNode
  onClose: () => void
  closeLabel: string
}

/** Sheet header: the icon tile, the 17px/700 title (with an optional line under it) and the 34px round close, as TileHeader. */
export function SheetHeader({ title, icon, sub, onClose, closeLabel }: SheetHeaderProps) {
  return (
    <div className="flex flex-none items-center gap-3 px-[18px] pb-1 pt-4">
      {icon && (
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[13px] bg-[color:var(--m-ic)] text-m-ink">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[1.0625rem] font-bold leading-tight text-m-ink">{title}</div>
        {sub && <div className="truncate font-geist text-[0.71875rem] text-m-muted">{sub}</div>}
      </div>
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
      className={`flex h-[42px] items-center justify-center rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-4 text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-ink disabled:opacity-40 ${className}`}
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
      className={`flex h-[42px] items-center justify-center gap-[6px] rounded-full bg-m-act px-4 text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-actfg disabled:opacity-40 ${className}`}
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
