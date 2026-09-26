import { useEffect } from 'react'
import { useHelpStore } from '../store/helpStore'

/**
 * `Escape` closes the help dialog (the lightbox first, when one is open). The
 * `?` in the navbar is the only way in: a hotkey would fire while someone is
 * typing a question mark into a note, and the help is one click away anyway.
 */
export function useHelpShortcut(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      const { open, closeHelp, lightbox, openLightbox } = useHelpStore.getState()
      if (!open) return
      if (lightbox) openLightbox(null)
      // A modal the reader opened while following a guide keeps its own Escape.
      else if (!document.querySelector('.trek-modal-backdrop')) closeHelp()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
