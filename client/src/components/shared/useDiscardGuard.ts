import { useCallback, useEffect, useRef, useState } from 'react'

const snapshot = (value: unknown): string | null => {
  try { return JSON.stringify(value) ?? null } catch { return null }
}

/**
 * The unsaved-changes question (#2253) for a dialog or a sheet. `guard` is the
 * editor's state, JSON-serialisable; undefined turns the question off. The
 * state at the first key or pointer press (`markStart`) is the starting point,
 * so whatever the editor loaded on open does not count as a change. The ways
 * out a hand takes by accident go through `requestClose`, which asks before
 * throwing away a state that differs from that starting point.
 */
export function useDiscardGuard(guard: unknown, onClose: () => void) {
  const baseline = useRef<string | null>(null)
  const guardRef = useRef(guard)
  useEffect(() => { guardRef.current = guard })
  const [asking, setAsking] = useState(false)

  const markStart = useCallback(() => {
    if (guardRef.current !== undefined && baseline.current === null) baseline.current = snapshot(guardRef.current)
  }, [])

  const requestClose = useCallback(() => {
    if (guardRef.current !== undefined && baseline.current !== null && snapshot(guardRef.current) !== baseline.current) setAsking(true)
    else onClose()
  }, [onClose])

  const keepEditing = useCallback(() => setAsking(false), [])
  const discard = useCallback(() => { setAsking(false); onClose() }, [onClose])
  /** Forget the starting point, for a surface that stays mounted between openings. */
  const reset = useCallback(() => { baseline.current = null; setAsking(false) }, [])

  return { asking, markStart, requestClose, keepEditing, discard, reset }
}
