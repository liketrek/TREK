import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Plus } from 'lucide-react'
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition'
import { POPOVER } from '../Packing/packingPopoverStyles'
import { PopoverItem } from '../Packing/PackingPopover'
import { PILL, fs } from './DialogShell'

// The editors' fields in the cards' language: framed white boxes under small
// Geist eyebrows. The sizes are classes, not fs() styles, so components that
// only take a className (BookingLinkAndFiles, BookingCodeInput, AddressInput)
// get them too; both scale with the user's text size the same way.

/** A text input in the box look. Same height and inset as CustomSelect and CustomTimePicker, so they line up in a row. */
export const INPUT = 'block w-full min-w-0 rounded-[10px] border border-edge bg-surface-input px-3 py-2 text-[length:calc(13px*var(--fs-scale-body,1))] text-content outline-none placeholder:text-content-faint focus:ring-2 focus:ring-[color:var(--text-primary)] disabled:cursor-default disabled:opacity-50'
export const TEXTAREA = 'block w-full min-w-0 resize-none rounded-[10px] border border-edge bg-surface-input px-3 py-2 text-[length:calc(13px*var(--fs-scale-body,1))] leading-normal text-content outline-none placeholder:text-content-faint focus:ring-2 focus:ring-[color:var(--text-primary)] disabled:cursor-default disabled:opacity-50'
/** A value shown in the box look that cannot be typed into, such as an airport's timezone. */
export const READONLY_BOX = 'block w-full min-w-0 truncate rounded-[10px] border border-edge-faint bg-surface-tertiary px-3 py-2 text-[length:calc(12.5px*var(--fs-scale-body,1))] text-content-muted'
/** The eyebrow over a field, as a class for components that take a labelClass. */
export const LABEL = 'mb-[5px] block font-geist text-[length:calc(9.5px*var(--fs-scale-caption,1))] font-bold uppercase tracking-[.08em] text-content-faint'
/** Fields side by side; a narrow window stacks them. */
export const GRID_2 = 'grid grid-cols-2 items-start gap-3 max-sm:grid-cols-1'
export const GRID_3 = 'grid grid-cols-3 items-start gap-3 max-sm:grid-cols-1'
/** A framed group inside the body, such as one stop of a route: the card surface with white fields on it. */
export const PANEL = 'flex flex-col gap-3 rounded-[14px] border border-edge-faint bg-surface-secondary p-3'
/**
 * Wraps an AirportSelect or LocationSelect on a PANEL. Their search box keeps
 * the grey fill it has everywhere else; here it gets the white of the fields
 * beside it, set from outside because the phone shares the component.
 */
export const SEARCH_ON_PANEL = 'min-w-0 [&>div>div:first-child]:bg-surface-input'

/** An eyebrow label over one control, with an optional hint or error line under it. */
export function EditorField({ label, htmlFor, hint, error, className = '', children }: {
  label: ReactNode
  htmlFor?: string
  hint?: ReactNode
  /** Shown in the danger colour in place of the hint. */
  error?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={htmlFor} className={LABEL}>{label}</label>
      {children}
      {error
        ? <p className="m-0 mt-1 text-danger" style={fs(11)}>{error}</p>
        : hint ? <p className="m-0 mt-1 text-content-faint" style={fs(11)}>{hint}</p> : null}
    </div>
  )
}

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
}

/** A row of choices on a grey track, the chosen one raised like the status filter (or filled like the view switcher). */
export function Segmented<T extends string>({ value, options, onChange, label, accent = false, fill = false }: {
  value: T
  options: readonly SegmentedOption<T>[]
  onChange: (value: T) => void
  /** The group's accessible name. */
  label: string
  /** The chosen option in the accent fill instead of the raised card. */
  accent?: boolean
  /** Stretch across the row, each option taking an equal share. */
  fill?: boolean
}) {
  return (
    <div role="group" aria-label={label} className={`${fill ? 'flex w-full' : 'inline-flex'} flex-none gap-0.5 rounded-[10px] bg-surface-tertiary p-[3px]`}>
      {options.map(o => {
        const on = o.value === value
        const look = on ? (accent ? 'bg-accent text-accent-text' : 'bg-surface-card text-content shadow-sm') : 'text-content-muted hover:text-content'
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} aria-pressed={on}
            className={`${fill ? 'flex-1' : ''} inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] px-3 py-1.5 font-medium ${look}`}
            style={fs(12.5, 'body')}>
            {o.icon}{o.label}
          </button>
        )
      })}
    </div>
  )
}

export interface PillOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
  /** A quieter second part after the label, such as a day's date. */
  hint?: string
}

const itemsOf = (list: HTMLElement | null) => Array.from(list?.querySelectorAll('button') ?? [])

/**
 * A head band pill that opens a list to pick from, such as the booking type.
 * Opening moves the focus onto the current choice; the arrow keys walk the
 * list, Escape closes it and leaves the dialog open, Tab closes it and goes on
 * from the pill.
 */
/** A PillSelect sitting in the body rather than on a head band: grey, flat and small. */
const QUIET_PILL = 'inline-flex flex-none items-center gap-1.5 rounded-full bg-surface-tertiary px-2.5 py-1 font-semibold text-content'

export function PillSelect<T extends string>({ value, options, onChange, label, fallback, quiet = false }: {
  value: T
  options: readonly PillOption<T>[]
  onChange: (value: T) => void
  /** What is being picked; read before the value by screen readers, and the list's name. */
  label: string
  /** What the pill shows while the value is none of the options, such as a type the list does not offer. */
  fallback?: { label: string; icon?: ReactNode; hint?: string }
  /** In the body of a dialog instead of on its head band. */
  quiet?: boolean
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const startAt = useRef(0)
  const listId = useId()
  const box = useAnchoredPosition(triggerRef, open, { matchWidth: false, estimatedHeight: 320 })
  const current = options.find(o => o.value === value)
  const shown = current ?? fallback
  const listShown = open && !!box

  const toggle = () => {
    if (!open) startAt.current = Math.max(0, options.findIndex(o => o.value === value))
    setOpen(o => !o)
  }

  useEffect(() => {
    if (listShown) itemsOf(menuRef.current)[startAt.current]?.focus({ preventScroll: true })
  }, [listShown])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    // Captured and stopped, so the key takes back the list and not the dialog under it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  const pick = (next: T) => {
    setOpen(false)
    onChange(next)
    triggerRef.current?.focus()
  }

  const onListKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      // Back on the pill before the browser moves on, so Tab carries on from there.
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    const items = itemsOf(menuRef.current)
    const at = items.indexOf(document.activeElement as HTMLButtonElement)
    const last = items.length - 1
    let next: number
    if (e.key === 'ArrowDown') next = at < 0 || at === last ? 0 : at + 1
    else if (e.key === 'ArrowUp') next = at <= 0 ? last : at - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else return
    e.preventDefault()
    items[next]?.focus()
  }

  return (
    <>
      <button ref={triggerRef} type="button" onClick={toggle} aria-expanded={open} aria-controls={open ? listId : undefined}
        className={`${quiet ? QUIET_PILL : PILL} hover:opacity-80`} style={quiet ? fs(11.5, 'body') : undefined}>
        <span className="sr-only">{label}: </span>
        {shown?.icon}
        <span>{shown?.label}</span>
        {shown?.hint && <span className="font-medium text-content-muted">{shown.hint}</span>}
        <ChevronDown size={12} strokeWidth={2.2} className={`-mr-0.5 flex-none text-content-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && box && createPortal(
        <div ref={menuRef} id={listId} role="group" aria-label={label} onKeyDown={onListKey}
          className="fixed z-[var(--z-toast)] min-w-[200px] overflow-y-auto"
          style={{ ...POPOVER, top: box.top, bottom: box.bottom, left: box.left, maxHeight: box.maxHeight }}>
          {options.map(o => (
            <PopoverItem key={o.value} icon={o.icon ?? null} label={o.label} active={o.value === value} onClick={() => pick(o.value)}
              trailing={o.hint ? <span className="font-geist text-content-faint" style={fs(11)}>{o.hint}</span> : undefined} />
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}

/** The dashed full-width button that adds a row: a stop, a leg. */
export function AddRowButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-edge px-3 py-2 font-semibold text-content-muted hover:border-content-faint hover:text-content disabled:cursor-default disabled:opacity-50"
      style={fs(12, 'body')}>
      <Plus size={13} strokeWidth={2.2} />{children}
    </button>
  )
}
