import { ReactNode, useEffect, useLayoutEffect, useRef } from 'react'

interface MDropdownPanelProps {
  open: boolean
  onClose: () => void
  /** Positioning classes (e.g. `top-[100px] end-4`); panel is fixed. */
  className?: string
  children: ReactNode
}

/**
 * Floating popover panel (user menu, filter dropdowns): heavy glass, r20,
 * closed by a transparent full-screen backdrop — no dim, unlike sheets.
 * Layered above the scrolling content but below the bottom nav (z-40) and
 * sheets (z-60), matching the design's stacking order. Opened, it takes the
 * focus onto its first button and Escape closes it; closed, the focus goes
 * back to the button it was opened from, unless a pick moved it on.
 */
export default function MDropdownPanel({ open, onClose, className = '', children }: MDropdownPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panelRef.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus({ preventScroll: true })
    // Captured and stopped, so the key closes the panel and nothing under it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onCloseRef.current()
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      // The focused button left with the panel: the focus fell back to the page, and goes to the opener.
      const lost = document.activeElement === null || document.activeElement === document.body
      if (lost && opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Invisible dismiss layer — decoration to a reader, which is why it carries
          no role of its own; the panel's own controls are the keyboard path. */}
      <div className="fixed inset-0 z-[35]" role="presentation" onClick={onClose} />
      <div
        ref={panelRef}
        className={`m-pop-in fixed z-[36] w-[228px] rounded-[20px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-[6px] text-m-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,.5)] backdrop-blur-[30px] backdrop-saturate-[1.8] ${className}`}
      >
        {children}
      </div>
    </>
  )
}
