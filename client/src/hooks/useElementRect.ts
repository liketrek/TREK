import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Observe an element's viewport rect (left + width) via a callback ref. Used to
 * dock a fixed-position panel over another column. Re-measures on the element's
 * own resize and on window resize (layout shifts); vertical scroll doesn't move
 * a viewport-fixed left/width so it isn't tracked.
 */
export function useElementRect<T extends HTMLElement = HTMLElement>(): {
  ref: (el: T | null) => void
  rect: { left: number; width: number } | null
} {
  const [rect, setRect] = useState<{ left: number; width: number } | null>(null)
  const elRef = useRef<T | null>(null)
  const obs = useRef<ResizeObserver | null>(null)

  const measure = useCallback(() => {
    const el = elRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setRect(prev => (prev && prev.left === r.left && prev.width === r.width ? prev : { left: r.left, width: r.width }))
  }, [])

  const ref = useCallback((el: T | null) => {
    obs.current?.disconnect()
    obs.current = null
    elRef.current = el
    if (!el) { setRect(null); return }
    measure()
    obs.current = new ResizeObserver(measure)
    obs.current.observe(el)
  }, [measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  return { ref, rect }
}
