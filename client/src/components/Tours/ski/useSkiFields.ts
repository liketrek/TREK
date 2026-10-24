import type { SkiRouteOptionsInput } from '@trek/shared';
import { useCallback, useState } from 'react';
import type { SkiChoice } from './skiChoice';

/**
 * The options a choice carries on to the next discipline. A snowboarder is
 * spared surface lifts unless they said otherwise: switching to snowboard
 * leaves them out where no lift class was chosen yet.
 */
function carriedOptions(previous: SkiChoice, next: SkiChoice): SkiRouteOptionsInput | null | undefined {
  const options = next.options !== undefined ? next.options : previous.options;
  const toBoard = next.discipline === 'snowboard' && previous.discipline !== 'snowboard';
  if (toBoard && options?.avoid_lifts === undefined) return { ...options, avoid_lifts: ['drag'] };
  return options;
}

const sameChoice = (a: SkiChoice, b: SkiChoice) =>
  a.discipline === b.discipline &&
  a.technique === b.technique &&
  JSON.stringify(a.options ?? null) === JSON.stringify(b.options ?? null);

/**
 * SKI-02: a planned ski tour's discipline, cross-country technique and piste
 * router options, fields of the draft like a paddle tour's boat: nothing
 * chosen until the traveller picks, and no step of the history. A technique
 * stays remembered while another discipline is tried, and so do the options.
 * `onEdit` tells the planner the draft changed, and says whether it may.
 */
export function useSkiFields(initial: SkiChoice, onEdit: () => boolean) {
  const [choice, setChoice] = useState<SkiChoice>(initial);
  const change = useCallback(
    (next: SkiChoice) => {
      const options = carriedOptions(choice, next);
      const merged: SkiChoice = { discipline: next.discipline, technique: next.technique };
      if (options !== undefined) merged.options = options;
      if (sameChoice(merged, choice)) return;
      if (onEdit()) setChoice(merged);
    },
    [choice, onEdit]
  );
  /** One option of the piste router changed, the rest kept. */
  const setOption = useCallback(
    (patch: Partial<SkiRouteOptionsInput>) => change({ ...choice, options: { ...choice.options, ...patch } }),
    [change, choice]
  );
  return {
    choice,
    change,
    setOption,
    /** Loaded from a tour, a draft or an import, or cleared; not an edit. */
    load: setChoice,
  };
}
