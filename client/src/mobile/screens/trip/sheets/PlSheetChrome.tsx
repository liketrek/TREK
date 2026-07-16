import { ReactNode } from 'react'
import { Trash2, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import MIconBtn from '../../../components/MIconBtn'

/**
 * Shared chrome of the trip form sheets (place edit, day note, import):
 * glass-card header with optional 40px icon tile, eyebrow labels, the standard
 * field surfaces and the delete/cancel/save footer.
 */

export const FIELD_CLS =
  'w-full min-w-0 box-border rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[10px] font-[inherit] text-[0.84375rem] font-medium text-m-ink outline-none placeholder:text-m-faint'

export const FIELD_AREA_CLS =
  'w-full box-border resize-none rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[10px] font-geist text-[0.78125rem] leading-[1.5] text-m-ink outline-none placeholder:text-m-faint'

// One Eyebrow for all trip sheets — defined with the inspection-sheet chrome.
export { Eyebrow } from './MTripSheetUi'

interface FormSheetHeaderProps {
  /** 40px rounded icon tile left of the title (place edit / import sheets). */
  icon?: LucideIcon
  title: ReactNode
  /** Geist 11.5px subline under the title (note sheet: "Day n · title"). */
  subtitle?: ReactNode
  /** Replaces the icon tile, e.g. a back button on the import sub-steps. */
  leading?: ReactNode
  onClose: () => void
  closeLabel: string
}

/** Glass-sheet header: optional tile, 17px/700 title, 34px close. No hairline. */
export function FormSheetHeader({ icon: Icon, title, subtitle, leading, onClose, closeLabel }: FormSheetHeaderProps) {
  return (
    <div className="flex flex-none items-center gap-3 px-[18px] pb-2 pt-4">
      {leading}
      {!leading && Icon && (
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[13px] bg-[color:var(--m-ic)]">
          <Icon size={19} strokeWidth={1.8} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[1.0625rem] font-bold text-m-ink">{title}</div>
        {subtitle && <div className="truncate font-geist text-[0.71875rem] text-m-muted">{subtitle}</div>}
      </div>
      <MIconBtn ariaLabel={closeLabel} onClick={onClose} variant="neutral" size={34}>
        <X size={15} strokeWidth={2.2} />
      </MIconBtn>
    </div>
  )
}

interface FormSheetFooterProps {
  /** Renders the 38px delete circle; two-tap confirm is the caller's business. */
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
    <div className="flex flex-none items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={deleteLabel}
          className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full border ${
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
        className="ml-auto rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-4 py-[9px] text-[0.78125rem] font-semibold text-m-ink"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitDisabled}
        className="rounded-full bg-m-act px-[18px] py-[9px] text-[0.78125rem] font-semibold text-m-actfg disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </div>
  )
}
