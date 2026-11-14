import { ComponentProps, HTMLAttributes, ReactNode, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import MIconBtn from '../../../components/MIconBtn'
import { edgeFadeClass, useEdgeFade } from '../../../components/useEdgeFade'
import { CustomDatePicker } from '../../../../components/shared/CustomDateTimePicker'

/**
 * Shared chrome of the form sheets (expense, payment, booking, transport, note,
 * place edit, new trip, import): the header with its 40px icon tile, the
 * scrolling body, eyebrow labels, the standard field surfaces and the
 * delete/cancel/save footer. Header, body and footer are what MSheet's `form`
 * lays out (mobile.css, m-form-sheet), so a form uses all three.
 */

export const FIELD_CLS =
  'w-full min-w-0 box-border rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] py-[10px] font-[inherit] text-[0.84375rem] font-medium text-m-ink outline-none placeholder:text-m-faint'

/**
 * A field that holds more than its input: a currency before or after the
 * amount, a search icon. The round field is the wrapper; the input inside it
 * stays clear (bg-transparent, no border), so only one box is painted.
 */
export const AMOUNT_FIELD_CLS =
  'flex h-[42px] w-full min-w-0 items-center gap-[6px] rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px]'

/**
 * Two fields side by side where the form is wide enough for both, one above
 * the other where it is not (a phone upright, a narrow Split View): a day
 * named "Departure" with its date beside it read "Depa…" in half a phone.
 */
export const FORM_PAIR_CLS = 'grid grid-cols-1 gap-2 [@container(min-width:400px)]:grid-cols-2'

/** A button that opens a picker, drawn as the field it fills in. */
export const SELECT_FIELD_CLS =
  'flex h-[42px] w-full min-w-0 items-center overflow-hidden rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px]'

export const FIELD_AREA_CLS =
  'w-full box-border resize-none rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] py-[10px] font-geist text-[0.78125rem] leading-[1.5] text-m-ink outline-none placeholder:text-m-faint'

/**
 * A date field of the form sheets: the shared picker inside the 42px round
 * field. Its "type the date" button moves into the picker's popup (the
 * picker's borderless mode), so the date has the field's whole width and
 * keeps its year where a second round button used to take the room.
 */
export function SheetDateField(props: Omit<ComponentProps<typeof CustomDatePicker>, 'borderless' | 'style'>) {
  return (
    <div className="flex h-[42px] w-full min-w-0 items-center rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] [&>*]:min-w-0 [&>*]:flex-1">
      <CustomDatePicker {...props} borderless />
    </div>
  )
}

// One Eyebrow for all trip sheets — defined with the inspection-sheet chrome.
export { Eyebrow } from './MTripSheetUi'
import { SHEET_PRIMARY, SHEET_SECONDARY } from './MTripSheetUi'

interface FormSheetHeaderProps {
  /** 40px rounded icon tile left of the title (place edit / import sheets). */
  icon?: LucideIcon
  title: ReactNode
  /** Geist 11.5px subline under the title (note sheet: "Day n · title"). */
  subtitle?: ReactNode
  /** Replaces the icon tile, e.g. a back button on the import sub-steps. */
  leading?: ReactNode
  /** A 34px action before the close button (the booking's Wallet pass). */
  trailing?: ReactNode
  onClose: () => void
  closeLabel: string
}

/** Form-sheet header: optional tile, 17px/700 title, 34px close. No hairline. */
export function FormSheetHeader({ icon: Icon, title, subtitle, leading, trailing, onClose, closeLabel }: FormSheetHeaderProps) {
  return (
    <div className="m-fs-head flex flex-none items-center gap-3 px-[18px] pb-2 pt-4">
      {leading}
      {!leading && Icon && (
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[13px] bg-[color:var(--m-ic)]">
          <Icon size={19} strokeWidth={1.8} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {/* Two lines before it ends in an ellipsis: "Редактировать бронирование"
            and "Eintrag bearbeiten" were cut after one at phone width. */}
        <div className="line-clamp-2 break-words text-[1.0625rem] font-bold leading-tight text-m-ink">{title}</div>
        {subtitle && <div className="truncate font-geist text-[0.71875rem] text-m-muted">{subtitle}</div>}
      </div>
      {trailing}
      <MIconBtn ariaLabel={closeLabel} onClick={onClose} variant="neutral" size={34} className="m-fs-close">
        <X size={15} strokeWidth={2.2} />
      </MIconBtn>
    </div>
  )
}

/**
 * The form's fields, between the header and the footer: the one part that
 * scrolls. It fades out at the top once scrolled and at the foot while more
 * waits below, so a field the footer cuts reads as "the form goes on". It is
 * the container its rows measure themselves against (FORM_PAIR_CLS), since a
 * form is as narrow on a phone as it is wide in a form sheet.
 */
export function FormSheetBody({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  const fade = useEdgeFade(el, 'y')
  return (
    <div
      ref={setEl}
      className={`m-fs-body min-h-0 flex-1 overflow-y-auto px-[18px] pb-4 pt-[2px] [container-type:inline-size] ${edgeFadeClass(fade, 'y')} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

interface FormSheetFooterProps {
  /** Renders the 42px delete circle; two-tap confirm is the caller's business. */
  onDelete?: () => void
  deleteLabel?: string
  /** Delete circle switches to the danger surface while armed. */
  deleteArmed?: boolean
  onCancel: () => void
  cancelLabel: string
  onSubmit: () => void
  submitLabel: string
  submitDisabled?: boolean
}

/** Footer row: optional delete circle left, cancel + primary pill right. */
export function FormSheetFooter({
  onDelete, deleteLabel, deleteArmed = false,
  onCancel, cancelLabel, onSubmit, submitLabel, submitDisabled = false,
}: FormSheetFooterProps) {
  return (
    <div className="m-fs-foot flex flex-none items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={deleteLabel}
          className={`flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full border ${
            deleteArmed
              ? 'border-transparent bg-[color:var(--m-st-danger)] text-white'
              : 'border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted'
          }`}
        >
          <Trash2 size={15} strokeWidth={2} />
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        className={`${SHEET_SECONDARY} ms-auto`}
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitDisabled}
        className={SHEET_PRIMARY}
      >
        {submitLabel}
      </button>
    </div>
  )
}
