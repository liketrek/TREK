import type { BikeProfile, HikingPreferences, RunProfile, TourMaxHikingDifficulty } from '@trek/shared';
import { useCallback, useRef, useState } from 'react';

/**
 * What the route is planned with besides its points and type: a hike's limit
 * and its preferences (MF-08), a bike tour's profile (BIK-01) and a run's
 * (RUN-01). A change to any of them plans the route again.
 */
export interface RoutingChoices {
  difficulty: TourMaxHikingDifficulty;
  preferences: HikingPreferences | null;
  bikeProfile: BikeProfile;
  runProfile: RunProfile;
}

/** The choices of a new draft. */
export const DEFAULT_ROUTING_CHOICES: RoutingChoices = {
  difficulty: 2,
  preferences: null,
  bikeProfile: 'touring',
  runProfile: 'running',
};

/**
 * The planner's routing choices, held as one value with a ref that is current
 * at once, so a history step taken in the same handler reads what was just
 * chosen. A choice a restored draft lacks starts at its default. `load` lays
 * in the choices given and keeps the others; it is no step of the history,
 * the planner records that around it.
 */
export function useRoutingChoices(initial: Partial<RoutingChoices>) {
  const [choices, setChoices] = useState<RoutingChoices>(() => ({
    difficulty: initial.difficulty ?? DEFAULT_ROUTING_CHOICES.difficulty,
    preferences: initial.preferences ?? DEFAULT_ROUTING_CHOICES.preferences,
    bikeProfile: initial.bikeProfile ?? DEFAULT_ROUTING_CHOICES.bikeProfile,
    runProfile: initial.runProfile ?? DEFAULT_ROUTING_CHOICES.runProfile,
  }));
  const ref = useRef(choices);
  const load = useCallback((next: Partial<RoutingChoices>) => {
    ref.current = { ...ref.current, ...next };
    setChoices(ref.current);
  }, []);
  return { choices, ref, load };
}
