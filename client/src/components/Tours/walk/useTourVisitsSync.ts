import { useEffect } from 'react';
import { useNetworkMode } from '../../../hooks/useNetworkMode';
import { useTourVisitStore, watchTourVisits } from '../../../store/tourVisitStore';

/**
 * CW-03: the visits of a trip's city walks, read when the trip opens and again
 * when the connection comes and goes, and kept current by its socket, so a
 * station another traveller checks off shows on every day plan at once. Once a
 * reconnect has sent the waiting marks, the sync reads them once more
 * (reloadTourVisits). Offline they read from this device, with the marks made
 * here still waiting to sync.
 */
export function useTourVisitsSync(tripId: number | string | undefined, enabled: boolean) {
  const { offline } = useNetworkMode();
  const id = enabled && tripId !== undefined && !Number.isNaN(Number(tripId)) ? tripId : null;

  useEffect(() => {
    if (id === null) return;
    let current = true;
    useTourVisitStore
      .getState()
      .load(id)
      .catch(() => {
        // Refused, or no copy on this device: the day plan shows no progress rather than another trip's.
        if (current) useTourVisitStore.getState().reset(id);
      });
    return () => {
      current = false;
    };
  }, [id, offline]);

  useEffect(() => {
    if (id === null) return;
    return watchTourVisits(id);
  }, [id]);
}
