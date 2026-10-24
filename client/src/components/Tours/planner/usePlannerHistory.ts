import { useCallback, useState } from 'react';

const HISTORY_LIMIT = 30;

/**
 * The planner's undo and redo: snapshots of what a step changed, the newest
 * last, at most thirty each way. Taking a new step forgets what was undone.
 * The planner says what a snapshot is and how it is put back.
 */
export function usePlannerHistory<Entry>() {
  const [past, setPast] = useState<Entry[]>([]);
  const [future, setFuture] = useState<Entry[]>([]);
  // Counts every step taken, undone or redone: a caller can tell whether its own step is still the last one.
  const [mark, setMark] = useState(0);

  /** A new step: the state before it goes on the stack, and nothing is left to redo. */
  const record = useCallback((before: Entry) => {
    setPast((current) => [...current, before].slice(-HISTORY_LIMIT));
    setFuture([]);
    setMark((current) => current + 1);
  }, []);

  /** The step to go back to, with the present kept for redo; null when there is none. */
  const undo = useCallback(
    (present: Entry): Entry | null => {
      const previous = past[past.length - 1];
      if (previous === undefined) return null;
      setPast(past.slice(0, -1));
      setFuture([present, ...future].slice(0, HISTORY_LIMIT));
      setMark((current) => current + 1);
      return previous;
    },
    [future, past]
  );

  const redo = useCallback(
    (present: Entry): Entry | null => {
      const next = future[0];
      if (next === undefined) return null;
      setPast([...past, present].slice(-HISTORY_LIMIT));
      setFuture(future.slice(1));
      setMark((current) => current + 1);
      return next;
    },
    [future, past]
  );

  const clear = useCallback(() => {
    setPast([]);
    setFuture([]);
    setMark((current) => current + 1);
  }, []);

  return { record, undo, redo, clear, mark, canUndo: past.length > 0, canRedo: future.length > 0 };
}
