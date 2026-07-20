import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

/**
 * Scroll body shared by the list-style trip tabs (transports, bookings, costs,
 * lists, files). The shell paints the opaque z-30 overlay behind us and floats
 * the top controls (z-42) and the dock (z-40) on top; a panel fills the space
 * between them with the same clearance the browse overlay uses — the top clears
 * the floating controls, the bottom clears the dock via --bottom-nav-h. (Collab
 * lays out its own column so its composer can sit just above the dock.)
 */
export function TabScroller({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(var(--bottom-nav-h,84px)+22px)] pt-[calc(var(--m-safe-top,12px)+58px)]">
        {children}
      </div>
    </div>
  )
}

/** Small count badge next to a section label / settle row (spec 03 §1.1). */
export function CountPill({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-[0.59375rem] font-bold text-m-muted">
      {children}
    </span>
  )
}

/**
 * Collapsible group header (Confirmed / Pending / … ). Chevron flips up when the
 * section is open; the count pill is optional. Layout per spec 03 §1.1.
 */
export function SectionHeader({ label, count, open, onToggle }: {
  label: string
  count?: ReactNode
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="mb-[2px] mt-[15px] flex w-full items-center gap-[7px] px-[2px] text-left"
    >
      <span className="font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">
        {label}
      </span>
      {count != null && <CountPill>{count}</CountPill>}
      {open ? (
        <ChevronUp size={13} strokeWidth={2} className="ml-auto flex-none text-m-faint" />
      ) : (
        <ChevronDown size={13} strokeWidth={2} className="ml-auto flex-none text-m-faint" />
      )}
    </button>
  )
}

/**
 * Uppercase label over a bordered value box — the field pattern used all over
 * the transport / booking cards (spec 03 §1.1). Width is set by the caller via
 * `className` (e.g. flex weights); `tabular` aligns times and prices.
 */
export function Field({ label, children, className = '', tabular = false }: {
  label: string
  children: ReactNode
  className?: string
  tabular?: boolean
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="mb-[3px] font-geist text-[0.5625rem] font-bold uppercase tracking-[.08em] text-m-faint">
        {label}
      </div>
      <div
        className={`overflow-hidden text-ellipsis whitespace-nowrap rounded-[10px] border border-[color:var(--m-rowbr)] bg-m-card px-[10px] py-[7px] text-center text-[0.71875rem] font-semibold text-m-ink ${
          tabular ? 'tabular-nums' : ''
        }`}
      >
        {children}
      </div>
    </div>
  )
}

/** 7px status dot; `color` is a --m-st-* token from STATUS_COLOR. */
export function StatusDot({ color }: { color: string }) {
  return <span className="h-[7px] w-[7px] flex-none rounded-full" style={{ background: color }} />
}
