import React, { useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { Check, X } from 'lucide-react'
import { useTranslation } from '../../i18n'

interface CopyTripDialogProps {
  isOpen: boolean
  tripTitle: string
  onClose: () => void
  onConfirm: () => void
}

const WILL_COPY_KEYS = [
  'dashboard.confirm.copy.will1',
  'dashboard.confirm.copy.will2',
  'dashboard.confirm.copy.will3',
  'dashboard.confirm.copy.will4',
  'dashboard.confirm.copy.will5',
  'dashboard.confirm.copy.will6',
]

const WONT_COPY_KEYS = [
  'dashboard.confirm.copy.wont1',
  'dashboard.confirm.copy.wont2',
  'dashboard.confirm.copy.wont3',
  'dashboard.confirm.copy.wont4',
]

export default function CopyTripDialog({ isOpen, tripTitle, onClose, onConfirm }: CopyTripDialogProps) {
  const { t } = useTranslation()

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, handleEsc])

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center px-4 trek-backdrop-enter bg-[rgba(15,23,42,0.5)]"
      style={{ paddingBottom: 'var(--bottom-nav-h)' }}
      onClick={onClose}
    >
      <div
        className="trek-modal-enter rounded-2xl shadow-2xl w-full max-w-md p-6 bg-surface-card"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-1 text-content">
          {t('dashboard.confirm.copy.title')}
        </h3>
        <p className="text-sm mb-4 text-content-secondary">
          {tripTitle}
        </p>

        <div className="flex flex-col gap-3">
          <div className="rounded-xl p-3 border border-edge-secondary" style={{ background: 'var(--bg-subtle)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-[#16a34a]">
              {t('dashboard.confirm.copy.willCopy')}
            </p>
            <ul className="flex flex-col gap-1">
              {WILL_COPY_KEYS.map(key => (
                <li key={key} className="flex items-center gap-2 text-sm text-content-secondary">
                  <Check size={13} className="flex-shrink-0 text-[#16a34a]" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl p-3 border border-edge-secondary" style={{ background: 'var(--bg-subtle)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-content-muted">
              {t('dashboard.confirm.copy.wontCopy')}
            </p>
            <ul className="flex flex-col gap-1">
              {WONT_COPY_KEYS.map(key => (
                <li key={key} className="flex items-center gap-2 text-sm text-content-secondary">
                  <X size={13} className="flex-shrink-0 text-content-muted" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-content-secondary border border-edge-secondary"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-opacity hover:opacity-90 bg-content text-surface-card"
          >
            {t('dashboard.confirm.copy.confirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
