import type { FlightLiveLeg } from '@trek/shared';
import { useEffect } from 'react';
import { useFlightLiveStore, watchFlightLive } from '../../../store/flightLiveStore';
import { toMs } from '../../../utils/flightLiveModel';

const ACTIVE_MS = 60_000;
const IDLE_MS = 10 * 60_000;
const BEFORE_MS = 3 * 60 * 60_000;
const AFTER_MS = 2 * 60 * 60_000;

const legsOf = (tripId: number): FlightLiveLeg[] =>
  Object.values(useFlightLiveStore.getState().trips[tripId]?.legs ?? {});
const departureOf = (leg: FlightLiveLeg) => toMs(leg.departed_at) ?? toMs(leg.scheduled_departure);
const arrivalOf = (leg: FlightLiveLeg) =>
  toMs(leg.landed_at) ?? toMs(leg.estimated_arrival) ?? toMs(leg.scheduled_arrival);

/** True while one of the trip's flights still lies ahead or is under way: only then is re-reading worth it. */
function anyToFollow(tripId: number, now: number): boolean {
  return legsOf(tripId).some((leg) => {
    const arr = arrivalOf(leg);
    return leg.phase !== 'landed' && arr != null && now <= arr + AFTER_MS;
  });
}

/** True while one of the trip's flights is inside its watch window, where minutes matter. */
function anyActive(tripId: number, now: number): boolean {
  return legsOf(tripId).some((leg) => {
    const dep = departureOf(leg);
    const arr = arrivalOf(leg);
    return dep != null && arr != null && now >= dep - BEFORE_MS && now <= arr + AFTER_MS && leg.phase !== 'landed';
  });
}

/**
 * Keeps the open trip's live flight states current: one read when the trip has
 * flights, the server's `flight:live` pushes in between, and a quiet re-read
 * (every minute while a flight is near, every ten otherwise) as the safety net
 * for a missed push, but only while a flight still lies ahead: a trip whose
 * flights are all over is read once and left alone. Nothing runs while the tab
 * is hidden; coming back reads once. Mounted once per open trip by the
 * planner, on desktop and phone alike.
 */
export function useFlightLiveSync(tripId: number, hasFlights: boolean): void {
  useEffect(() => {
    if (!hasFlights || !Number.isFinite(tripId)) return;
    let timer = 0;
    let stopped = false;
    const load = () => useFlightLiveStore.getState().load(tripId);
    const schedule = () => {
      window.clearTimeout(timer);
      const now = Date.now();
      if (stopped || !anyToFollow(tripId, now)) return;
      timer = window.setTimeout(tick, anyActive(tripId, now) ? ACTIVE_MS : IDLE_MS);
    };
    const tick = () => {
      if (document.hidden) schedule();
      else void load().then(schedule);
    };
    void load().then(schedule);
    const stopWatching = watchFlightLive(tripId);
    const onVisible = () => {
      if (!document.hidden) void load().then(schedule);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stopWatching();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [tripId, hasFlights]);
}
