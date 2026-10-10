import { useState, useEffect } from 'react'

/**
 * The phone shell's viewport: narrower than the md breakpoint (768px), or a
 * touch screen short enough to be a phone on its side.
 *
 * Width alone flipped a phone into the desktop planner the moment it was
 * turned: most phones are wider than 767px in landscape. That swapped the
 * whole route tree, so an open sheet, what was typed into it and the map's
 * position were gone. A tablet stays where it was, since none is under 500px
 * tall, and a desktop window keeps following its width, since its pointer is
 * fine.
 *
 * The phone rules in `index.css` repeat this query; keep them in step.
 */
export const PHONE_QUERY = '(max-width: 767px), (pointer: coarse) and (max-height: 500px)'

/** Whether the phone shell applies right now, for code that is not a component. */
export function isPhoneViewport(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(PHONE_QUERY).matches
}

/**
 * True while the phone shell applies (see {@link PHONE_QUERY}). Reactive:
 * follows viewport resizes and orientation changes via matchMedia.
 */
export function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState(isPhoneViewport)

  useEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY)
    const handler = (e: MediaQueryListEvent) => setIsPhone(e.matches)
    setIsPhone(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isPhone
}
