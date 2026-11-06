import { ReactNode } from 'react'
import { AlertTriangle, CircleHelp, Info } from 'lucide-react'
import MSheet from '../../components/MSheet'
import { SHEET_DANGER, SHEET_PRIMARY, SHEET_SECONDARY } from '../trip/sheets/MTripSheetUi'

interface MConfirmSheetProps {
  open: boolean
  onClose: () => void
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel: string
  danger?: boolean
  busy?: boolean
  onConfirm?: () => void
  /** Extra content between message and buttons (e.g. a password field). */
  children?: ReactNode
}

/**
 * Small confirm dialog as a centred floating card, in the shape of every phone
 * sheet: the icon tile and title, the message, the sheets' 42 px buttons.
 * Without onConfirm it is a plain notice. The card stops at the screen height:
 * a long message or list scrolls between the title and the buttons, which
 * always stay in reach.
 */
export default function MConfirmSheet({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  busy = false,
  onConfirm,
  children,
}: MConfirmSheetProps) {
  const Icon = danger ? AlertTriangle : onConfirm ? CircleHelp : Info
  return (
    <MSheet open={open} onClose={onClose} variant="card" material="glass" ariaLabel={title}>
      <div className="flex flex-none items-center gap-3 px-[18px] pt-4">
        <span
          className={`flex h-10 w-10 flex-none items-center justify-center rounded-[13px] bg-[color:var(--m-ic)] ${
            danger ? 'text-[color:var(--m-st-danger)]' : 'text-m-ink'
          }`}
        >
          <Icon size={19} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1 text-[1.0625rem] font-bold leading-tight text-m-ink text-pretty">{title}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[18px] pt-3">
        <p className="text-[0.8125rem] leading-relaxed text-m-muted text-pretty">{message}</p>
        {children}
      </div>
      {/* A long label moves its button to a row of its own instead of wrapping inside it. */}
      <div className="flex flex-none flex-wrap justify-end gap-2 px-[18px] pb-[18px] pt-4">
        <button type="button" onClick={onClose} className={`${SHEET_SECONDARY} whitespace-nowrap`}>
          {cancelLabel}
        </button>
        {onConfirm && confirmLabel && (
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={
              danger
                ? `${SHEET_DANGER} whitespace-nowrap`
                : `${SHEET_PRIMARY} whitespace-nowrap`
            }
          >
            {confirmLabel}
          </button>
        )}
      </div>
    </MSheet>
  )
}
