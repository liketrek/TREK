import { ReactNode, Ref } from 'react'
import { X } from 'lucide-react'
import MIconBtn from '../../../components/MIconBtn'
import { formatTime } from '../../../../utils/formatters'

/** Shared scaffolding of the trip inspection sheets (glass floating cards). */

/** Inner row/card surface used inside glass sheets. */
export const INNER_CLS = 'border border-[color:var(--m-inbr)] bg-[color:var(--m-inner)]'

/** Eyebrow section label: Geist 10px/700 letter-spacing .09em, faint. */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`font-geist text-[0.625rem] font-bold tracking-[.09em] text-m-faint ${className}`}>
      {children}
    </div>
  )
}

/** A text field of the sheets: 42 px, round, on the icon surface. */
export const SHEET_FIELD =
  'h-[42px] min-w-0 flex-1 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] text-[length:calc(13px*var(--fs-scale-body,1))] font-medium text-m-ink outline-none placeholder:text-m-faint'
/** The filled action with a label. Never icon-only: its padding leaves an icon no room in a circle, use SHEET_ROUND_PRIMARY. */
export const SHEET_PRIMARY =
  'flex h-[42px] flex-none items-center gap-1.5 rounded-full bg-m-act px-4 text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-actfg disabled:opacity-40'
/** The round, filled icon button next to a picker or field: invite, add. */
export const SHEET_ROUND_PRIMARY =
  'flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-m-act text-m-actfg disabled:opacity-40'
/** The quiet action with a label: add, invite, end. Full width in a section. */
export const SHEET_SECONDARY =
  'flex h-[42px] items-center justify-center gap-1.5 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-4 text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-ink disabled:opacity-40'
/** The quiet round icon action of a row: remove, rename, make owner. */
export const SHEET_ROUND =
  'flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted disabled:opacity-40'
/** A small badge inside a row (owner, you). */
export const SHEET_PILL =
  'flex h-[22px] flex-none items-center gap-[3px] rounded-full px-[8px] font-geist text-[length:calc(9.5px*var(--fs-scale-caption,1))] font-bold uppercase tracking-[.06em]'

/** A titled block of the sheet: the eyebrow, an optional line under it and the content on the inner surface. */
export function SheetSection({
  title,
  count,
  hint,
  children,
}: {
  /** Left out where each field below carries its own label. */
  title?: string
  /** How many there are, as a small badge next to the title rather than glued onto it. */
  count?: number
  hint?: string
  children: ReactNode
}) {
  return (
    <section className={`rounded-[18px] p-3 ${INNER_CLS}`}>
      {title && (
      <div className="flex items-center gap-1.5">
        <Eyebrow className="uppercase">{title}</Eyebrow>
        {count != null && (
          <span className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[color:var(--m-ic)] px-[5px] font-geist text-[length:calc(9.5px*var(--fs-scale-caption,1))] font-bold text-m-muted">
            {count}
          </span>
        )}
      </div>
      )}
      {hint && (
        <p className="mt-1 font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] leading-snug text-m-muted">
          {hint}
        </p>
      )}
      <div className={`${title || hint ? 'mt-2.5 ' : ''}flex flex-col gap-2`}>{children}</div>
    </section>
  )
}

interface TileHeaderProps {
  icon: ReactNode
  title: ReactNode
  sub?: ReactNode
  /** Let a sentence-length subtitle wrap instead of truncating it to one line. */
  subWrap?: boolean
  onClose: () => void
  closeLabel: string
}

/**
 * Sheet header: 40px icon tile + title/sub + 34px round close.
 *
 * `sub` is truncated to one line by default, which is right for a filename or a
 * date but wrong for a sentence: the icon tile and the close button leave so
 * little width that a hint like "Hold and drag to reorder" was cut off mid-word
 * (#1814), and it is longer still in most translations. Pass `subWrap` where the
 * subtitle is prose.
 */
export function TileHeader({ icon, title, sub, subWrap = false, onClose, closeLabel }: TileHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[13px] bg-[color:var(--m-ic)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[6px] text-[1.0625rem] font-bold leading-tight">{title}</div>
        {sub && (
          <div className={`font-geist text-[0.71875rem] text-m-muted ${subWrap ? 'leading-snug' : 'truncate'}`}>
            {sub}
          </div>
        )}
      </div>
      <MIconBtn variant="neutral" size={34} onClick={onClose} ariaLabel={closeLabel}>
        <X size={15} strokeWidth={2.2} />
      </MIconBtn>
    </div>
  )
}

interface StatBoxProps {
  value: ReactNode
  label: ReactNode
  blurred?: boolean
  onClick?: () => void
  /** Colours the label, so a check-in or check-out time carries its own state. */
  labelTone?: 'confirmed' | 'danger'
}

const LABEL_TONE: Record<NonNullable<StatBoxProps['labelTone']>, string> = {
  confirmed: 'font-bold uppercase tracking-[.05em] text-[color:var(--m-st-confirmed)]',
  danger: 'font-bold uppercase tracking-[.05em] text-[color:var(--m-st-danger)]',
}

/** Small stat box (check-in / times / code): value 700 tabular over a faint Geist label. */
export function StatBox({ value, label, blurred = false, onClick, labelTone }: StatBoxProps) {
  const box = 'min-w-0 flex-1 rounded-[10px] bg-[color:var(--m-ic)] px-[9px] py-[7px] text-center'
  const inner = (
    <>
      <div
        className={`truncate text-[0.8125rem] font-bold tabular-nums leading-tight ${blurred ? 'blur-[4px] select-none' : ''}`}
      >
        {value}
      </div>
      <div className={`truncate font-geist text-[0.5625rem] ${labelTone ? LABEL_TONE[labelTone] : 'text-m-faint'}`}>{label}</div>
    </>
  )
  // A tappable stat is a real button — value and label give it its name. Without
  // a handler it stays a plain box rather than an empty stop in the tab order.
  if (!onClick) return <div className={box}>{inner}</div>
  return (
    <button type="button" onClick={onClick} className={`${box} block border-0`}>
      {inner}
    </button>
  )
}

interface ActionCircleProps {
  onClick?: () => void
  label: string
  primary?: boolean
  danger?: boolean
  className?: string
  children: ReactNode
  /** For callers that anchor a popup to the button. React 19 passes it through. */
  ref?: Ref<HTMLButtonElement>
}

/** 38px round action button of the inspector footer rows. */
export function ActionCircle({ onClick, label, primary = false, danger = false, className = '', children, ref }: ActionCircleProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full ${
        primary
          ? 'bg-m-act text-m-actfg'
          : `border border-[color:var(--m-gbr)] bg-[color:var(--m-ic)] ${danger ? 'text-[color:var(--m-st-danger)]' : 'text-m-ink'}`
      } ${className}`}
    >
      {children}
    </button>
  )
}

/** Formats a stored time — plain "HH:MM" or a full ISO timestamp — for display. */
export function displayTime(value: string | null | undefined, locale: string, timeFormat: string): string {
  if (!value) return ''
  if (value.includes('T')) {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h' })
    }
  }
  return formatTime(value, locale, timeFormat)
}
