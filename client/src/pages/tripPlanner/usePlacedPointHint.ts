import { useCallback, useEffect, useRef, useState } from 'react';

/** How long the hint stays up after a point was set, unless the pointer rests on it. */
export const PLACED_HINT_MS = 4000;

interface Hint {
  id: number;
  /** The points before the click, to spot the list the new point produced. */
  before: readonly unknown[];
  /** The list right after the point went in; any other list means something came after it. */
  after: readonly unknown[] | null;
  difficulty: unknown;
}

interface Options {
  waypoints: readonly unknown[];
  /** Part of the editor's undo history too: a change to it after the point makes undo mean that. */
  difficulty: unknown;
  undo: () => void;
  /** False while the hint must not show (not editing, a ferrata card open). */
  enabled: boolean;
}

/**
 * The "point set" hint after a click on the map, with an undo that takes back
 * exactly that point. It goes as soon as anything else changes the tour, so
 * the editor's undo, which reverts the latest change, always means the point.
 */
export function usePlacedPointHint({ waypoints, difficulty, undo, enabled }: Options) {
  const [hint, setHint] = useState<Hint | null>(null);
  const [held, setHeld] = useState(false);
  const count = useRef(0);

  // Adjusted while rendering: the add lands in the same batch as the click that noted it.
  // A list that did not grow by one was no add of this click's point (it was refused).
  if (hint && hint.after === null && waypoints !== hint.before) {
    setHint(waypoints.length === hint.before.length + 1 ? { ...hint, after: waypoints } : null);
  } else if (hint?.after && (waypoints !== hint.after || difficulty !== hint.difficulty)) {
    setHint(null);
  }

  const shown = enabled && !!hint?.after && hint.after === waypoints && hint.difficulty === difficulty;
  const hintId = shown ? hint.id : null;

  useEffect(() => {
    if (hintId === null || held) return;
    const timer = window.setTimeout(() => setHint(null), PLACED_HINT_MS);
    return () => window.clearTimeout(timer);
  }, [hintId, held]);

  /** Called right before the point is added. */
  const notePlacement = useCallback(() => {
    count.current += 1;
    setHeld(false);
    setHint({ id: count.current, before: waypoints, after: null, difficulty });
  }, [waypoints, difficulty]);

  const undoPlacement = useCallback(() => {
    if (!shown) return;
    setHint(null);
    undo();
  }, [shown, undo]);

  return { shown, key: hintId, notePlacement, undoPlacement, hold: setHeld };
}
