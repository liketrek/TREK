import { useState, useEffect } from 'react'

const PHONE_QUERY = '(max-width: 767px)'

/**
 * Returns true below the md breakpoint (768px) — the cut between the new
 * mobile shell and the untouched desktop/tablet experience. Reactive: follows
 * viewport resizes and orientation changes via matchMedia.
 */
export function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY)
    const handler = (e: MediaQueryListEvent) => setIsPhone(e.matches)
    setIsPhone(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isPhone
}
