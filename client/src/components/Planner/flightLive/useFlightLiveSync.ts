import { useEffect } from 'react';
import { useFlightLiveStore, watchFlightLive } from '../../../store/flightLiveStore';
import { toMs } from '../../../utils/flightLiveModel';

const ACTIVE_MS = 60_000;
const IDLE_MS = 10 * 60_000;
const BEFORE_MS = 3 * 60 * 60_000;
const AFTER_MS = 2 * 60 * 60_000;

/** True while one of the trip's legs is inside its watch window, where minutes matter. */
function anyActive(tripId: number, now: number): boolean {
  const legs = Object.values(useFlightLiveStore.getState().trips[tripId]?.legs ?? {});
  return legs.some((leg) => {
    const dep = toMs(leg.departed_at) ?? toMs(leg.scheduled_departure);
    const arr = toMs(leg.landed_at) ?? toMs(leg.estimated_arrival) ?? toMs(leg.scheduled_arrival);
    return dep != null && arr != null && now >= dep - BEFORE_MS && now <= arr + AFTER_MS && leg.phase !== 'landed';
  });
}

/**
 * Keeps the open trip's live flight states current: one read when the trip has
 * flights, the server's `flight:live` pushes in between, and a quiet re-read
 * (every minute while a flight is near, every ten otherwise) as the safety net
 * for a missed push. Nothing runs while the tab is hidden; coming back reads
 * once. Mounted once per open trip by the planner, on desktop and phone alike.
 */
export function useFlightLiveSync(tripId: number, hasFlights: boolean): void {
  useEffect(() => {
    if (!hasFlights || !Number.isFinite(tripId)) return;
    const load = () => void useFlightLiveStore.getState().load(tripId);
    load();
    const stopWatching = watchFlightLive(tripId);

    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => {
          if (!document.hidden) load();
          schedule();
        },
        anyActive(tripId, Date.now()) ? ACTIVE_MS : IDLE_MS
      );
    };
    schedule();
    const onVisible = () => {
      if (!document.hidden) {
        load();
        schedule();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearTimeout(timer);
      stopWatching();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [tripId, hasFlights]);
}
