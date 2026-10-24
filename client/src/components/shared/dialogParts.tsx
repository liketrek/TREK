import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Plus } from 'lucide-react'
import { POPOVER } from '../Packing/packingPopoverStyles'
import { PopoverItem } from '../Packing/PackingPopover'
import { PILL, fs } from './DialogShell'
import { usePopoverList } from './usePopoverList'

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

/** The track laid out as a grid of this many columns, for more choices than one row holds. */
const SEGMENTED_COLUMNS = { 2: 'grid w-full grid-cols-2', 3: 'grid w-full grid-cols-3' } as const

/** A row of choices on a grey track, the chosen one raised like the status filter (or filled like the view switcher). */
export function Segmented<T extends string>({ value, options, onChange, label, accent = false, fill = false, columns }: {
  value: T
  options: readonly SegmentedOption<T>[]
  onChange: (value: T) => void
  /** The group's accessible name. */
  label: string
  /** The chosen option in the accent fill instead of the raised card. */
  accent?: boolean
  /** Stretch across the row, each option taking an equal share. */
  fill?: boolean
  /** Wrap the options into a grid of this many equal columns on the same track. */
  columns?: keyof typeof SEGMENTED_COLUMNS
}) {
  const track = columns ? SEGMENTED_COLUMNS[columns] : fill ? 'flex w-full' : 'inline-flex'
  return (
    <div role="group" aria-label={label} className={`${track} flex-none gap-0.5 rounded-[10px] bg-surface-tertiary p-[3px]`}>
      {options.map(o => {
        const on = o.value === value
        const look = on ? (accent ? 'bg-accent text-accent-text' : 'bg-surface-card text-content shadow-sm') : 'text-content-muted hover:text-content'
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} aria-pressed={on}
            className={`${fill ? 'flex-1' : ''} ${columns ? 'min-w-0' : ''} inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] px-3 py-1.5 font-medium ${look}`}
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
  const list = usePopoverList(options.findIndex(o => o.value === value))
  const { open, toggle, triggerRef, listId } = list
  const current = options.find(o => o.value === value)
  const shown = current ?? fallback

  const pick = (next: T) => {
    list.close()
    onChange(next)
  }

  return (
    <>
      <button ref={triggerRef} type="button" onClick={toggle} aria-expanded={open} aria-controls={open ? listId : undefined}
        className={`${quiet ? QUIET_PILL : PILL} hover:opacity-80`} style={quiet ? fs(11.5, 'body') : undefined}>
        <span className="sr-only">{label}: </span>
        {shown?.icon}
        <span>{shown?.label}</span>
        {shown?.hint && <span className="font-medium text-content-muted">{shown.hint}</span>}
        <ChevronDown size={12} strokeWidth={2.2} className={`-me-0.5 flex-none text-content-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <PopoverListPanel list={list} label={label} className="min-w-[200px]">
        {options.map(o => (
          <PopoverItem key={o.value} icon={o.icon ?? null} label={o.label} active={o.value === value} onClick={() => pick(o.value)}
            trailing={o.hint ? <span className="font-geist text-content-faint" style={fs(11)}>{o.hint}</span> : undefined} />
        ))}
      </PopoverListPanel>
    </>
  )
}

/**
 * The open list of a `usePopoverList` button, in the popover look, laid over
 * the page beside its button: where the button sits decides where it opens.
 */
export function PopoverListPanel({ list, label, className = '', children }: {
  list: ReturnType<typeof usePopoverList>
  /** The list's name for a screen reader. */
  label: string
  className?: string
  children: ReactNode
}) {
  const { open, box, menuRef, listId, onListKey } = list
  if (!open || !box) return null
  return createPortal(
    <div ref={menuRef} id={listId} role="group" aria-label={label} onKeyDown={onListKey}
      className={`fixed z-[var(--z-toast)] overflow-y-auto ${className}`}
      style={{ ...POPOVER, top: box.top, bottom: box.bottom, left: box.left, maxHeight: box.maxHeight }}>
      {children}
    </div>,
    document.body,
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
