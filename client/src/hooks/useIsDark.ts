import { useState, useEffect } from 'react'

/**
 * Returns true while the dark palette is active, read off the `.dark` class on
 * `<html>` — the single source of truth that `applyAppearance()` writes.
 *
 * Deriving it from the settings store instead (`dark_mode === 'auto' &&
 * matchMedia(...)`) duplicates theme state into React and misses an OS-level
 * switch under `auto`, because nothing re-renders when the media query flips.
 * The observer sees every path, including the pre-paint replay in
 * `public/theme-boot.js`.
 *
 * Only for the handful of places that need the flag in JS — an `<img src>` that
 * differs per theme. Colours belong on tokens, not on this hook.
 */
export function useIsDark(): boolean {
  const [dark, setDark] = useState<boolean>(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    if (typeof document === 'undefined') return
    const mo = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])

  return dark
}
