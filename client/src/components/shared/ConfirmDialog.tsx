import React, { useEffect, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../i18n'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  /** Extra content under the message, such as a list of what the action takes with it. */
  children?: ReactNode
}

// Callers commonly pass an async handler that reports its own failure and then
// rethrows. The dialog has already closed at that point, so the rejection would
// escape as an unhandled promise — absorb it here.
function runConfirm(onConfirm: () => void): void {
  const result = onConfirm() as unknown
  if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
    void Promise.resolve(result).catch(() => {})
  }
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = true,
  children,
}: ConfirmDialogProps) {
  const { t } = useTranslation()

  // Captured and stopped here: the question often opens over another dialog
  // (a Modal) that closes on Escape too, and one key press should only take
  // back the question, not the dialog it was asked from.
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    e.stopPropagation()
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleEsc, true)
    return () => document.removeEventListener('keydown', handleEsc, true)
  }, [isOpen, handleEsc])

  if (!isOpen) return null

  return createPortal(
    <div
      // Backdrop only — Escape (above) and the Cancel button below are the
      // keyboard routes out of the dialog.
      role="presentation"
      className="fixed inset-0 z-[10000] flex items-center justify-center px-4 trek-backdrop-enter bg-[rgba(15,23,42,0.5)]"
      style={{ paddingBottom: 'var(--bottom-nav-h)' }}
      onClick={onClose}
    >
      {/* Capped at the viewport: a long list of what goes along scrolls on its
          own, and the two buttons below it always stay in reach. */}
      <div
        role="presentation"
        className={`trek-modal-enter flex max-h-[calc(100dvh-2rem-var(--bottom-nav-h,0px))] flex-col rounded-2xl shadow-2xl w-full ${children ? 'max-w-md' : 'max-w-sm'} p-6 bg-surface-card`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex min-h-0 items-start gap-4 overflow-y-auto overscroll-contain">
          {danger && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-danger-soft flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-content">
              {title || t('common.confirm')}
            </h3>
            <p className="mt-1 text-sm text-content-secondary">
              {message}
            </p>
            {children}
          </div>
        </div>

        <div className="flex flex-none justify-end gap-3 mt-6">
          <button type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-content-secondary border border-edge-secondary"
          >
            {cancelLabel || t('common.cancel')}
          </button>
          <button type="button"
            onClick={() => { runConfirm(onConfirm); onClose() }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-opacity hover:opacity-90 ${
              danger ? 'bg-danger text-white' : 'bg-accent text-accent-text'
            }`}
          >
            {confirmLabel || t('common.delete')}
          </button>
        </div>
      </div>

    </div>,
    document.body
  )
}
