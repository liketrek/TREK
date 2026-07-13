import { useState, useEffect } from 'react'

/**
 * Returns true when the primary pointer is coarse (finger/stylus) — phones and
 * tablets, at any viewport width. A mouse-driven desktop is false, including a
 * touchscreen laptop, whose primary pointer is still the mouse.
 *
 * Viewport width is not a proxy for touch: an iPad is 820-1366 CSS px, so a
 * width-based check leaves HTML5 `draggable` armed there and the drag swallows
 * the scroll gesture (#1432).
 */
export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches)
    setIsTouch(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isTouch
}
