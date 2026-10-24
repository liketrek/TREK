import { useCallback, useState } from 'react';

/**
 * RUN-01: the pace a run is planned at, seconds per kilometre, a field of the
 * draft like its description: it plans no route again and is no step of the
 * history, it only changes the time. Null while the runner entered none; NaN
 * while the text typed is no pace. `onEdit` tells the planner the draft
 * changed, and says whether it may.
 */
export function useRunPace(initial: number | null, onEdit: () => boolean) {
  const [paceSecondsPerKm, setPaceState] = useState<number | null>(initial);
  const setPace = useCallback(
    (next: number | null) => {
      if (!Object.is(next, paceSecondsPerKm) && onEdit()) setPaceState(next);
    },
    [onEdit, paceSecondsPerKm]
  );
  return {
    paceSecondsPerKm,
    setPace,
    /** Loaded from a tour or a draft, or cleared; not an edit. */
    load: setPaceState,
  };
}
