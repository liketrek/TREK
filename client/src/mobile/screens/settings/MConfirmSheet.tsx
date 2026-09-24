import { ReactNode } from 'react'
import MSheet from '../../components/MSheet'
import { MSetButton } from './MSettingsUi'

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
 * Small confirm dialog as a centred floating card. Without onConfirm it is a
 * plain notice. The card stops at the screen height: a long message or list
 * scrolls between the title and the buttons, which always stay in reach.
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
  return (
    <MSheet open={open} onClose={onClose} variant="card" material="opaque" ariaLabel={title}>
      <div className="flex min-h-0 flex-col p-[18px]">
        <div className="flex-none text-[0.9375rem] font-extrabold text-m-ink">{title}</div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <p className="mt-2 text-[0.78125rem] leading-relaxed text-m-muted text-pretty">{message}</p>
          {children}
        </div>
        {/* A long label moves its button to a row of its own instead of wrapping inside it. */}
        <div className="mt-4 flex flex-none flex-wrap justify-end gap-2">
          <MSetButton variant="ghost" onClick={onClose} className="whitespace-nowrap">
            {cancelLabel}
          </MSetButton>
          {onConfirm && confirmLabel && (
            <MSetButton variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy} className="whitespace-nowrap">
              {confirmLabel}
            </MSetButton>
          )}
        </div>
      </div>
    </MSheet>
  )
}
