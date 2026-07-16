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

/** Small confirm dialog as a centred floating card. Without onConfirm it is a plain notice. */
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
      <div className="p-[18px]">
        <div className="text-[0.9375rem] font-extrabold text-m-ink">{title}</div>
        <p className="mt-2 text-[0.78125rem] leading-relaxed text-m-muted">{message}</p>
        {children}
        <div className="mt-4 flex justify-end gap-2">
          <MSetButton variant="ghost" onClick={onClose}>
            {cancelLabel}
          </MSetButton>
          {onConfirm && confirmLabel && (
            <MSetButton variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
              {confirmLabel}
            </MSetButton>
          )}
        </div>
      </div>
    </MSheet>
  )
}
