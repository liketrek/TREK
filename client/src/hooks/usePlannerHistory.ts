import { useCallback, useRef, useReducer } from 'react'

export interface UndoEntry {
  label: string
  undo: () => Promise<void> | void
  /** The days the step acts on. Deleting one of them drops the step. */
  dayIds?: number[]
}

export function usePlannerHistory(maxEntries = 30) {
  const historyRef = useRef<UndoEntry[]>([])
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)

  const pushUndo = (label: string, undoFn: () => Promise<void> | void, dayIds?: number[]) => {
    historyRef.current = [{ label, undo: undoFn, dayIds }, ...historyRef.current].slice(0, maxEntries)
    forceUpdate()
  }

  /**
   * Take the last step back. Resolves true when it went through, false when it
   * failed, and null when there was nothing to take back.
   */
  const undo = async (): Promise<boolean | null> => {
    if (historyRef.current.length === 0) return null
    const [first, ...rest] = historyRef.current
    historyRef.current = rest
    forceUpdate()
    try {
      await first.undo()
      return true
    } catch (e) {
      console.error('Undo failed:', e)
      return false
    }
  }

  /**
   * Drop the steps that act on a day that is gone. They could only fail now,
   * and the undo button would point at one of them.
   */
  const forgetDay = useCallback((dayId: number) => {
    const kept = historyRef.current.filter(entry => !entry.dayIds?.includes(dayId))
    if (kept.length === historyRef.current.length) return
    historyRef.current = kept
    forceUpdate()
  }, [])

  const canUndo = historyRef.current.length > 0
  const lastActionLabel = historyRef.current[0]?.label ?? null

  return { pushUndo, undo, forgetDay, canUndo, lastActionLabel }
}
