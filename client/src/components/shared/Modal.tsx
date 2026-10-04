import React, { useEffect, useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { lockBodyScroll } from '../../utils/bodyScrollLock'
import { useTranslation } from '../../i18n'
import { Tooltip } from './Tooltip'
import { focusDialog, trapTab } from './dialogFocus'

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
  '3xl': 'max-w-5xl',
  // Wide enough for the add-place dialog to carry a detail column beside the
  // form, and both together beside the collection picker.
  '4xl': 'max-w-6xl',
  '5xl': 'max-w-7xl',
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  children?: React.ReactNode
  size?: string
  footer?: React.ReactNode
  hideCloseButton?: boolean
  /**
   * Where the panel stands on a wide screen. Centred by default; 'top' pins its
   * upper edge, so a dialog whose content changes height grows and shrinks at
   * the bottom only instead of jumping. Phones always start at the top.
   */
  align?: 'center' | 'top'
}

export default function Modal({ isOpen, ...frame }: ModalProps) {
  return isOpen ? <ModalFrame {...frame} /> : null
}

function ModalFrame({
  onClose,
  title,
  children,
  size = 'md',
  footer,
  hideCloseButton = false,
  align = 'center',
}: Omit<ModalProps, 'isOpen'>) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const mouseDownTarget = useRef<EventTarget | null>(null)
  // Read while rendering, before a field inside can take the focus with autoFocus.
  const [focusedBefore] = useState(() => document.activeElement)

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [handleEsc])

  // Separate from the key listener so a new onClose identity does not release
  // and re-take the lock on every render. The shared lock is ref-counted: this
  // modal must not clear a lock another overlay is still holding (#1809).
  useEffect(() => lockBodyScroll(), [])

  // The focus moves into the dialog when it opens (the first text field on a
  // desktop) and back to whatever opened it when it closes, the way DialogShell
  // does it (#1302). Without this Tab ran through the page behind first.
  useEffect(() => {
    const panel = panelRef.current
    if (panel) focusDialog(panel)
    return () => {
      if (focusedBefore instanceof HTMLElement && focusedBefore.isConnected) focusedBefore.focus()
    }
  }, [focusedBefore])

  return createPortal(
    <div
      // Backdrop and panel are plain boxes: the backdrop only catches the
      // click-away, the panel only keeps that click from reaching it. Escape
      // and the header's close button are the keyboard route out.
      role="presentation"
      className={`fixed inset-0 z-[10000] flex items-start ${align === 'top' ? '' : 'sm:items-center'} justify-center px-4 trek-modal-backdrop trek-backdrop-enter bg-[rgba(15,23,42,0.5)]`}
      style={{ paddingTop: 70, paddingBottom: 'calc(20px + var(--bottom-nav-h))', overflow: 'hidden' }}
      onMouseDown={e => { mouseDownTarget.current = e.target }}
      onClick={e => {
        if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) onClose()
        mouseDownTarget.current = null
      }}
    >
      <div
        ref={panelRef}
        role="presentation"
        tabIndex={-1}
        onKeyDown={e => { if (panelRef.current) trapTab(e, panelRef.current) }}
        className={`
          trek-modal-enter outline-none
          rounded-2xl overflow-hidden shadow-2xl w-full ${sizeClasses[size] || sizeClasses.md}
          flex flex-col
          max-h-[calc(100dvh-var(--bottom-nav-h)-90px)] sm:max-h-[calc(100dvh-90px)]
          bg-surface-card
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* Header — stays put even while the body scrolls */}
        <div className="flex items-center justify-between p-6 flex-shrink-0 border-b border-edge-secondary">
          <h2 className="text-lg font-semibold text-content">{title}</h2>
          {!hideCloseButton && (
            <Tooltip label={t('common.close')}>
            <button type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="p-2 rounded-lg text-content-faint hover:text-content-secondary hover:bg-surface-hover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            </Tooltip>
          )}
        </div>

        {/* Body — scrolls when content overflows. min-h-0 lets the flex child shrink below its intrinsic height. */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {children}
        </div>

        {/* Footer — sticky at the bottom of the modal, never compressed */}
        {footer && (
          <div className="p-6 flex-shrink-0 border-t border-edge-secondary">
            {footer}
          </div>
        )}
      </div>

    </div>,
    document.body
  )
}
