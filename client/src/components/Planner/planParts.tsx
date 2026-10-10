import type { MouseEvent, ReactNode } from 'react'
import { Clock, MoreHorizontal, type LucideIcon } from 'lucide-react'
import { Tooltip } from '../shared/Tooltip'
import { ContextMenu, useContextMenu } from '../shared/ContextMenu'
import { fs } from '../shared/DialogShell'

/**
 * The small pieces the Plan tab is built from, so the day list, the places
 * list, the inspector and the day panel speak one language: the head band a
 * panel opens with, its icon buttons, the "…" that keeps a row's actions out
 * of sight until they are wanted, and the pills a row states its facts in.
 */

/** The band a floating panel opens with, tinted like every card head in the planner. */
export const PANEL_BAR = 'flex min-h-[52px] flex-none items-center gap-1.5 border-b border-edge-faint px-3 py-2'

/** A 32px icon control on a panel bar. Raised like an active filter tab while `active`. */
export function BarButton({ label, onClick, active = false, disabled = false, children, className = '', ariaPressed, ariaExpanded, ariaHaspopup, placement = 'bottom' }: {
  label: string
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  active?: boolean
  disabled?: boolean
  children: ReactNode
  className?: string
  ariaPressed?: boolean
  ariaExpanded?: boolean
  ariaHaspopup?: 'dialog' | 'menu'
  placement?: 'top' | 'bottom' | 'left' | 'right'
}) {
  return (
    <Tooltip label={label} placement={placement}>
      <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
        aria-pressed={ariaPressed} aria-expanded={ariaExpanded} aria-haspopup={ariaHaspopup}
        className={`grid h-8 w-8 flex-none place-items-center rounded-[10px] transition-colors disabled:cursor-default disabled:opacity-40 ${active ? 'bg-surface-card text-content shadow-sm' : 'text-content-muted enabled:hover:bg-surface-card enabled:hover:text-content'} ${className}`}>
        {children}
      </button>
    </Tooltip>
  )
}

export interface MenuEntry {
  label?: string
  icon?: LucideIcon
  onClick?: () => void
  danger?: boolean
  divider?: boolean
}

/**
 * The "…" of a row or card: the actions a right-click also offers, for the
 * mouse that doesn't right-click and for the keyboard. Quiet at rest, it comes
 * forward with its row's hover or focus (the row carries the `group` class).
 */
export function MoreButton({ label, items, size = 26, alwaysVisible = false, className = '' }: {
  label: string
  items: Array<MenuEntry | false | null | undefined>
  size?: number
  alwaysVisible?: boolean
  className?: string
}) {
  const menu = useContextMenu()
  const entries = items.filter(Boolean) as MenuEntry[]
  // Nothing but dividers is nothing to offer.
  if (!entries.some(e => !e.divider)) return null
  return (
    <>
      <Tooltip label={label} disabled={!!menu.menu}>
        <button type="button" aria-label={label} aria-haspopup="menu"
          onClick={e => menu.open(e, entries, true)}
          className={`grid flex-none place-items-center rounded-full text-content-muted transition-opacity hover:bg-surface-card hover:text-content focus-visible:opacity-100 ${alwaysVisible || menu.menu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100'} ${className}`}
          style={{ width: size, height: size }}>
          <MoreHorizontal size={15} strokeWidth={2} />
        </button>
      </Tooltip>
      <ContextMenu menu={menu.menu} onClose={menu.close} />
    </>
  )
}

/** A time or time range as a white badge, like the other facts on a card. */
/** A small white badge on a row's second line, for what the row says about when. */
export function WhiteBadge({ children, icon, className = '' }: { children: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-full bg-surface-card px-2 py-[2px] font-geist font-normal tabular-nums text-content-secondary shadow-sm ${className}`} style={fs(10.5)}>
      {icon}
      {children}
    </span>
  )
}

export function TimePill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <WhiteBadge className={className} icon={<Clock size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>{children}</WhiteBadge>
}

export type PillTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent'

// White badges on whatever tint the row has; the tone only colours the words and the icon.
const PILL_TONES: Record<PillTone, string> = {
  neutral: 'bg-surface-card text-content-secondary shadow-sm',
  success: 'bg-surface-card text-success shadow-sm',
  warning: 'bg-surface-card text-warning shadow-sm',
  danger: 'bg-surface-card text-danger shadow-sm',
  info: 'bg-surface-card text-info shadow-sm',
  accent: 'bg-accent text-accent-text',
}

/** A small fact on a row (a status, a carrier, a phase): a white badge, its words in one of the status tones. */
export function SoftPill({ tone = 'neutral', icon, children, className = '', caps = false }: {
  tone?: PillTone
  icon?: ReactNode
  children?: ReactNode
  className?: string
  caps?: boolean
}) {
  return (
    <span className={`inline-flex min-w-0 flex-none items-center gap-1 whitespace-nowrap rounded-full px-2 py-[2px] font-geist font-normal ${caps ? 'uppercase tracking-[.05em]' : ''} ${PILL_TONES[tone]} ${className}`} style={fs(caps ? 9.5 : 10.5)}>
      {icon}
      {children}
    </span>
  )
}

/** The tint a card head takes from a colour (a category, a note, a plugin's day tone). */
export const tintOf = (color: string, percent = 11) => `color-mix(in srgb, ${color} ${percent}%, transparent)`
