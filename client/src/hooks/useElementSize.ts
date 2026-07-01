import { useCallback, useRef, useState } from 'react'

/**
 * Observe an element's border-box size via a callback ref. Returns the ref to
 * attach plus the current width/height. The ResizeObserver is (re)connected
 * whenever the ref is attached and disconnected when it detaches (React calls
 * the callback ref with null on unmount), so no cleanup effect is needed —
 * which keeps this usable straight from a page's data hook.
 */
export function useElementSize<T extends HTMLElement = HTMLElement>(): {
  ref: (el: T | null) => void
  width: number
  height: number
} {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const obs = useRef<ResizeObserver | null>(null)

  const ref = useCallback((el: T | null) => {
    obs.current?.disconnect()
    obs.current = null
    if (!el) return
    // Only update state when the size actually changed — avoids re-render churn.
    const measure = () => setSize(prev => {
      const w = el.offsetWidth, h = el.offsetHeight
      return prev.width === w && prev.height === h ? prev : { width: w, height: h }
    })
    measure()
    obs.current = new ResizeObserver(measure)
    obs.current.observe(el)
  }, [])

  return { ref, width: size.width, height: size.height }
}
