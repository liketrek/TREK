import { ReactNode } from 'react'

interface MDropdownPanelProps {
  open: boolean
  onClose: () => void
  /** Positioning classes (e.g. `top-[100px] right-4`); panel is fixed. */
  className?: string
  children: ReactNode
}

/**
 * Floating popover panel (user menu, filter dropdowns): heavy glass, r20,
 * closed by a transparent full-screen backdrop — no dim, unlike sheets.
 * Layered above the scrolling content but below the bottom nav (z-40) and
 * sheets (z-60), matching the design's stacking order.
 */
export default function MDropdownPanel({ open, onClose, className = '', children }: MDropdownPanelProps) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[35]" onClick={onClose} />
      <div
        className={`m-pop-in fixed z-[36] w-[228px] rounded-[20px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-[6px] text-m-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,.5)] backdrop-blur-[30px] backdrop-saturate-[1.8] ${className}`}
      >
        {children}
      </div>
    </>
  )
}
