import React, { ReactNode, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'

export type MSheetVariant = 'card' | 'bottom' | 'drawer'
export type MSheetMaterial = 'glass' | 'bar-glass' | 'opaque'

interface MSheetProps {
  open: boolean
  onClose: () => void
  /** card = centred floating card, bottom = docked panel above the nav, drawer = left drawer */
  variant?: MSheetVariant
  /**
   * glass = translucent sheet (--m-sheet), bar-glass = lighter bar glass
   * (--m-glass, default for the bottom variant), opaque = solid (--m-sheetop)
   */
  material?: MSheetMaterial
  /** Transparent scrim (the "Mehr" sheet sits on the UI without dimming it) */
  dimTransparent?: boolean
  ariaLabel?: string
  className?: string
  children?: ReactNode
}

const EXIT_MS = 280

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const POSITION: Record<MSheetVariant, string> = {
  card: 'absolute left-[14px] right-[14px] top-1/2 -translate-y-1/2',
  bottom: 'absolute left-4 right-4 bottom-[calc(var(--bottom-nav-h,84px)+16px)]',
  drawer: 'absolute left-0 top-0 bottom-0 w-[78%] max-w-[320px]',
}

const SHAPE: Record<MSheetVariant, string> = {
  card: 'rounded-[28px] shadow-[0_30px_80px_-24px_rgba(0,0,0,.6)] max-h-[calc(100dvh-var(--m-safe-top,12px)-96px)]',
  bottom: 'rounded-[26px] shadow-[0_-8px_40px_-14px_rgba(0,0,0,.45)] max-h-[calc(100dvh-var(--bottom-nav-h,84px)-var(--m-safe-top,12px)-72px)]',
  drawer: 'h-full shadow-[0_0_60px_-10px_rgba(0,0,0,.5)]',
}

// Deliberate normalisation: the demo borders a few opaque sheets (journey
// create/entry/settings, drawer) with --rowbr instead of --shbr; both hairlines
// are near-identical on the solid sheet surface, so every material keeps one
// border token here.
const MATERIAL: Record<MSheetMaterial, string> = {
  glass:
    'bg-[color:var(--m-sheet)] backdrop-blur-[40px] backdrop-saturate-[1.8] border border-[color:var(--m-shbr)]',
  'bar-glass':
    'bg-[color:var(--m-glass)] backdrop-blur-[30px] backdrop-saturate-[1.8] border border-[color:var(--m-gbr)]',
  opaque: 'bg-[color:var(--m-sheetop)] border border-[color:var(--m-shbr)]',
}

function sheetRoot(): HTMLElement {
  return document.getElementById('m-sheet-root') ?? document.body
}

// Body scroll lock shared across stacked sheets: only the first lock saves the
// original overflow and only the last unlock restores it.
let scrollLocks = 0
let savedBodyOverflow = ''

function lockBodyScroll() {
  if (scrollLocks === 0) {
    savedBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  scrollLocks++
}

function unlockBodyScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1)
  if (scrollLocks === 0) document.body.style.overflow = savedBodyOverflow
}

/**
 * The one sheet primitive of the mobile design system. Handles portal,
 * scrim, ESC/backdrop dismissal, body scroll lock, focus trapping, 280ms
 * enter/exit and — for the bottom variant — drag-to-dismiss on the top edge.
 */
export default function MSheet({
  open,
  onClose,
  variant = 'card',
  material,
  dimTransparent = false,
  ariaLabel,
  className = '',
  children,
}: MSheetProps) {
  const [rendered, setRendered] = useState(open)
  // Once the enter animation has played it is removed again: its forwards
  // fill would otherwise override the inline drag transform for good.
  const [entered, setEntered] = useState(false)
  const [dragY, setDragY] = useState<number | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startY: number; lastY: number; lastT: number; velocity: number } | null>(null)

  // Keep the sheet mounted through the exit animation.
  useEffect(() => {
    if (open) {
      setRendered(true)
      return
    }
    setEntered(false)
    setDragY(null)
    const t = setTimeout(() => setRendered(false), EXIT_MS)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    lockBodyScroll()
    return unlockBodyScroll
  }, [open])

  // Move focus into the dialog on open, hand it back on close.
  useEffect(() => {
    if (!open || !rendered) return
    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    return () => previous?.focus()
  }, [open, rendered])

  if (!rendered) return null

  const handlePointerDown = (e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { startY: e.clientY, lastY: e.clientY, lastT: e.timeStamp, velocity: 0 }
    setDragY(0)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    d.velocity = (e.clientY - d.lastY) / Math.max(1, e.timeStamp - d.lastT)
    d.lastY = e.clientY
    d.lastT = e.timeStamp
    setDragY(Math.max(0, e.clientY - d.startY))
  }

  const handlePointerEnd = () => {
    const d = dragRef.current
    if (!d) return
    dragRef.current = null
    const height = panelRef.current?.offsetHeight ?? 0
    const dy = Math.max(0, d.lastY - d.startY)
    setDragY(null)
    // Past 30% of the panel or a decisive flick → dismiss.
    if ((height > 0 && dy > height * 0.3) || d.velocity > 0.6) onClose()
  }

  // Keep Tab inside the dialog while it is open.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const panel = panelRef.current
    if (!panel) return
    const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE)
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const enterClass = variant === 'drawer' ? 'm-drawer-in' : 'm-sheet-in'
  const exitClass = variant === 'drawer' ? 'm-drawer-out' : 'm-sheet-out'
  const animation = open ? (entered ? '' : enterClass) : exitClass

  const resolvedMaterial = material ?? (variant === 'bottom' ? 'bar-glass' : 'glass')

  const dragStyle: React.CSSProperties =
    dragY !== null
      ? { transform: `translateY(${dragY}px)`, transition: 'none' }
      : { transition: 'transform 280ms var(--ease-drawer)' }

  return ReactDOM.createPortal(
    // m-root on the overlay so the --m-* tokens resolve even when the portal
    // has to fall back to document.body (sheet mounted in the same commit as
    // the shell).
    <div
      className={`m-root fixed inset-0 z-[60] ${dimTransparent ? 'bg-transparent' : 'bg-[color:var(--m-dim)]'} ${open ? 'm-fade-in' : 'm-fade-out'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={POSITION[variant]}>
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          tabIndex={-1}
          className={`relative flex flex-col overflow-hidden outline-none text-m-ink ${SHAPE[variant]} ${MATERIAL[resolvedMaterial]} ${animation} ${className}`}
          style={variant === 'bottom' ? dragStyle : undefined}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget && open) setEntered(true)
          }}
        >
          {variant === 'bottom' && (
            // Invisible drag strip along the top edge — the design shows no
            // handle, the panel starts directly with its content.
            <div
              className="absolute inset-x-0 top-0 z-[1] h-5 cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
            />
          )}
          {children}
        </div>
      </div>
    </div>,
    sheetRoot(),
  )
}
