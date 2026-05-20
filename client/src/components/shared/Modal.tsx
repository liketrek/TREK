import React, { useEffect, useCallback, useRef } from 'react'
import { X } from 'lucide-react'

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
  '3xl': 'max-w-5xl',
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  children?: React.ReactNode
  size?: string
  footer?: React.ReactNode
  hideCloseButton?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  hideCloseButton = false,
}: ModalProps) {
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEsc])

  const mouseDownTarget = useRef<EventTarget | null>(null)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center px-4 modal-backdrop trek-backdrop-enter"
      style={{
        backgroundColor: 'var(--modal-backdrop)',
        backdropFilter: 'blur(12px) saturate(150%)',
        WebkitBackdropFilter: 'blur(12px) saturate(150%)',
        paddingTop: 70,
        paddingBottom: 'calc(20px + var(--bottom-nav-h))',
        overflow: 'hidden',
      }}
      onMouseDown={e => { mouseDownTarget.current = e.target }}
      onClick={e => {
        if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) onClose()
        mouseDownTarget.current = null
      }}
    >
      <div
        className={`
          trek-modal-enter modal-glass
          rounded-2xl overflow-hidden w-full ${sizeClasses[size] || sizeClasses.md}
          flex flex-col
          max-h-[calc(100dvh-var(--bottom-nav-h)-90px)] sm:max-h-[calc(100dvh-90px)]
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--modal-border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          {!hideCloseButton && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
              style={{
                color: 'var(--text-muted)',
                background: 'var(--glass-bg-subtle)',
                border: '1px solid var(--glass-border-inner)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--glass-bg-subtle)'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="px-6 py-4 flex-shrink-0"
            style={{ borderTop: '1px solid var(--modal-border)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
