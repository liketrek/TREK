import { useEffect, useId } from 'react'
import { PencilLine, type LucideIcon } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT } from './DialogShell'

interface NameDialogProps {
  open: boolean
  title: string
  placeholder: string
  confirmLabel: string
  value: string
  onChange: (value: string) => void
  onConfirm: () => void
  onClose: () => void
  /** The icon on the head band's tile; a pencil unless the caller has a better one. */
  icon?: LucideIcon
}

/**
 * The small dialog that asks for one name: a new list, a template to save, a
 * booking's title. The name is typed into the head band itself; Enter confirms
 * and Escape cancels this dialog alone, never one it was opened from.
 */
export default function NameDialog({ open, title, placeholder, confirmLabel, value, onChange, onConfirm, onClose, icon: Icon = PencilLine }: NameDialogProps) {
  const { t } = useTranslation()
  const labelId = useId()
  const ready = value.trim().length > 0

  // Caught before any dialog underneath hears it, so only this one closes.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      e.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      header={(
        <DialogHeader
          tile={<DialogTile><Icon size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          eyebrow={title}
          titleInput={{
            value,
            onChange,
            label: title,
            placeholder,
            autoFocus: true,
            onKeyDown: e => { if (e.key === 'Enter' && ready) onConfirm() },
          }}
        />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
          <DialogButton variant="primary" onClick={onConfirm} disabled={!ready}>{confirmLabel}</DialogButton>
        </DialogFooter>
      )}
    />
  )
}
