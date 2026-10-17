import { useCallback, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { tourVisibilityScope, useTourMapVisibilityStore } from '../../store/tourMapVisibilityStore';

const NONE: ReadonlySet<number> = new Set();

/**
 * PR1-07/08: the tours the signed-in person hid from this trip's map, read
 * against the tours the trip has now, so a deleted tour hides nothing. The
 * list and the map read the same store, so a toggle shows on both at once.
 */
export function useTourMapVisibility(tripId: number, tourIds: ReadonlySet<number>) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const scope = userId === null ? null : tourVisibilityScope(userId, tripId);
  const load = useTourMapVisibilityStore((state) => state.load);
  const loaded = useTourMapVisibilityStore((state) => scope !== null && state.scope === scope);
  const hidden = useTourMapVisibilityStore((state) => state.hidden);
  const toggleStored = useTourMapVisibilityStore((state) => state.toggle);
  const showAll = useTourMapVisibilityStore((state) => state.showAll);

  useEffect(() => {
    if (scope) load(scope);
  }, [load, scope]);

  const hiddenIds = useMemo(
    () => (loaded ? new Set(hidden.filter((id) => tourIds.has(id))) : NONE),
    [hidden, loaded, tourIds]
  );
  const isHidden = useCallback((placeId: number) => hiddenIds.has(placeId), [hiddenIds]);
  const toggle = useCallback(
    (placeId: number) => {
      if (loaded) toggleStored(placeId);
    },
    [loaded, toggleStored]
  );

  return { hiddenIds, isHidden, toggle, showAll, hiddenCount: hiddenIds.size };
}
