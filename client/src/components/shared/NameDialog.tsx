import Modal from './Modal'
import { useTranslation } from '../../i18n'

interface NameDialogProps {
  open: boolean
  title: string
  placeholder: string
  confirmLabel: string
  value: string
  onChange: (value: string) => void
  onConfirm: () => void
  onClose: () => void
}

/**
 * The small dialog that asks for one name: a new list, a template to save.
 * It takes the name in the middle of the screen instead of pushing a field
 * into the page; Enter confirms and Esc (from the modal) cancels.
 */
export default function NameDialog({ open, title, placeholder, confirmLabel, value, onChange, onConfirm, onClose }: NameDialogProps) {
  const { t } = useTranslation()
  const ready = value.trim().length > 0
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={(
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-edge px-4 py-2 text-body text-content-muted hover:bg-surface-hover">
            {t('common.cancel')}
          </button>
          <button type="button" onClick={onConfirm} disabled={!ready}
            className="rounded-lg bg-accent px-4 py-2 text-body font-medium text-accent-text hover:bg-accent-hover disabled:cursor-default disabled:opacity-40">
            {confirmLabel}
          </button>
        </div>
      )}
    >
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && ready) onConfirm() }}
        placeholder={placeholder}
        aria-label={title}
        className="w-full rounded-lg border border-edge bg-surface-input px-3 py-2.5 text-body text-content outline-none focus:border-content-muted"
      />
    </Modal>
  )
}
