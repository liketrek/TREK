import { useCallback, useEffect, useState } from 'react';

/** How long the note stays up after a way was taken, unless the pointer rests on it. */
export const APPLIED_HINT_MS = 4000;

interface Applied {
  id: number;
  /** The points before the way was written, to spot the list the write produced. */
  before: readonly unknown[];
  /** The list right after the write; any other list means something came after it. */
  after: readonly unknown[] | null;
}

/**
 * RTE-02: the "way taken" note over the map after a section took another way,
 * with the undo that takes exactly that back. It goes as soon as anything else
 * changes the points, so the editor's undo, which reverts the latest step,
 * always means the way.
 */
export function useAppliedWayHint(waypoints: readonly unknown[], undo: () => void) {
  const [applied, setApplied] = useState<Applied | null>(null);
  const [count, setCount] = useState(0);
  const [held, setHeld] = useState(false);

  // Adjusted while rendering: the write lands in a render of its own after the note.
  if (applied && applied.after === null && waypoints !== applied.before) {
    setApplied({ ...applied, after: waypoints });
  } else if (applied?.after && waypoints !== applied.after) {
    setApplied(null);
  }

  const shown = !!applied?.after && applied.after === waypoints;
  const shownId = shown ? applied.id : null;

  useEffect(() => {
    if (shownId === null || held) return;
    const timer = window.setTimeout(() => setApplied(null), APPLIED_HINT_MS);
    return () => window.clearTimeout(timer);
  }, [held, shownId]);

  /** Called with the points as they were right before the way is written. */
  const note = useCallback(
    (before: readonly unknown[]) => {
      setHeld(false);
      setCount(count + 1);
      setApplied({ id: count + 1, before, after: null });
    },
    [count]
  );

  const undoApplied = useCallback(() => {
    if (!shown) return;
    setApplied(null);
    undo();
  }, [shown, undo]);

  return { note, view: { shown, key: shownId, undo: undoApplied, hold: setHeld } };
}
