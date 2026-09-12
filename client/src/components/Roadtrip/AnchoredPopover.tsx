import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * A small panel hung under something in the rail.
 *
 * The rail has more than one badge worth opening — what kind of stop this is, how full it
 * fills — and every one of them needs the same four things: measure before showing,
 * flip above when the window is short, close on an outside click or Escape, and close on
 * a scroll rather than chase the anchor. Each is one line to get wrong and none of them
 * is about what the panel contains, which is why they live here once instead of beside
 * every panel that needs them.
 *
 * Deliberately not the `CustomSelect` machinery: that one is a select, with a value, a
 * search and a keyboard model. This is a surface.
 */
export default function AnchoredPopover({ anchor, label, children, onClose }: {
  /** The element the panel hangs under. Null renders nothing, which is how it stays closed. */
  anchor: HTMLElement | null
  /** What the dialog is called, for anyone who cannot see where it is hanging. */
  label: string
  children: React.ReactNode
  onClose: () => void
}): React.ReactElement | null {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  // Measured after paint, before the browser shows it: reading the size first and then
  // placing it is what stops the panel appearing at 0,0 for one frame.
  useLayoutEffect(() => {
    if (!anchor || !ref.current) return
    const a = anchor.getBoundingClientRect()
    const p = ref.current.getBoundingClientRect()
    const gap = 8
    let top = a.bottom + gap
    // Flips above when there is no room below, which is most of the rail on a short
    // window: a panel clipped by the viewport is one that cannot be used at all.
    if (top + p.height > window.innerHeight - 8) top = Math.max(8, a.top - p.height - gap)
    // Centred on the column, not on the anchor. A badge sits hard against one edge of the
    // rail, so a panel centred on it hangs half off the sidebar and points at the map.
    // Vertically it still follows the row it belongs to.
    const column = anchor.closest('section')?.getBoundingClientRect() ?? a
    const left = Math.min(
      Math.max(8, column.left + column.width / 2 - p.width / 2),
      window.innerWidth - p.width - 8,
    )
    setPos({ top, left })
  }, [anchor])

  useEffect(() => {
    if (!anchor) return
    const onDown = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return
      if (anchor.contains(e.target as Node)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    // Any scroll moves the anchor out from under the panel, and following it would mean
    // measuring on every frame for a menu that is open for two seconds.
    window.addEventListener('scroll', onClose, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [anchor, onClose])

  if (!anchor) return null

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      className="fixed z-[70] rounded-2xl border border-edge bg-surface-card p-2 shadow-xl"
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? 'visible' : 'hidden' }}
    >
      {children}
    </div>,
    document.body,
  )
}
