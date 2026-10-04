import { useEffect, useRef, useState } from 'react'

/**
 * The dropdown the corridor panel asks its question with: what to look for, and along which
 * day. One shape for both, so the two sit side by side as one line of the same control.
 */

/** The closed control: one line, on the card's own ground, with the card's edge. */
export const DROPDOWN_TRIGGER =
  'flex h-[32px] items-center gap-2 rounded-xl border border-edge bg-surface-card pe-2 ps-2.5 text-start transition-colors hover:border-content-faint'

/** The list it opens, under it and at least as wide. */
export const DROPDOWN_LIST =
  'absolute top-full z-[var(--z-toast)] mt-1 w-max min-w-full overflow-hidden rounded-xl border border-edge bg-surface-elevated shadow-dropdown backdrop-blur'

/** One option in that list. */
export const DROPDOWN_ROW = 'flex w-full items-center gap-2.5 px-2.5 py-2 text-start transition-colors hover:bg-surface-hover'

/** Open or not, closed again by a press outside it or by Escape. */
export function useDropdown<T extends HTMLElement>() {
  const [open, setOpen] = useState(false)
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return { open, setOpen, ref }
}
