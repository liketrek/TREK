import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useTripAddons } from '../../components/Trips/useTripAddons';
import { useAddonStore } from '../../store/addonStore';
import { tripAddonEnabled } from '../../utils/tripAddons';

/**
 * What the planner shows while neither the trip's list nor the instance's is
 * known (offline on a trip the device never read the addons of): the core
 * sections on, the rest off, as the planner always guessed.
 */
const WHEN_UNKNOWN: Readonly<Record<string, boolean>> = {
  packing: true,
  budget: true,
  documents: true,
  collab: false,
  roadtrip: false,
  tours: false,
  dawarich: false,
};

/**
 * The addons the trip planner shows for one trip, in both shells: the trip
 * addons as the trip has them (the owner's choice or the instance switch),
 * Dawarich (an integration) and the collab sub-features from the instance.
 * Follows a change of the trip's addons live, so tabs, dock, rail and More
 * sheet appear and go as the owner switches.
 */
export function usePlannerAddons(tripId: number) {
  const tripAddons = useTripAddons(Number.isFinite(tripId) ? tripId : null);
  const instance = useAddonStore(
    useShallow((s) => ({ addons: s.addons, known: (s.loaded && !s.failed) || s.addons.length > 0, loaded: s.loaded }))
  );
  const collabFeatures = useAddonStore((s) => s.collabFeatures);

  // The app reads the instance list once signed in; a planner opened before that answered asks itself.
  useEffect(() => {
    if (!useAddonStore.getState().loaded) void useAddonStore.getState().loadAddons();
  }, []);

  const enabledAddons = useMemo(() => {
    const instanceOn = (id: string) =>
      instance.known ? instance.addons.some((a) => a.id === id && a.enabled) : WHEN_UNKNOWN[id];
    return Object.fromEntries(
      Object.keys(WHEN_UNKNOWN).map((id) => [id, tripAddonEnabled(tripAddons.addons, id, instanceOn(id))])
    ) as Record<string, boolean>;
  }, [tripAddons.addons, instance]);

  // Until then enabledAddons is a guess, and the tab guard must not evict a tab on it.
  const addonsLoaded = tripAddons.loaded && (tripAddons.addons.length > 0 || instance.loaded);

  return { enabledAddons, addonsLoaded, collabFeatures, toursEnabled: !!enabledAddons.tours };
}
