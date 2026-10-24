import { useEffect, useState } from 'react';
import { readWalkPoints, type WalkPoints } from './walkStationsRead';

const UNREAD: WalkPoints = { stations: [], ferries: [] };

/**
 * CW-03: a saved walk's stations in order, with its ferry legs (CW-12): null
 * while they load, none where they could not be read. Read again when the
 * walk is saved (its revision moves on), here or by someone else, so the
 * detail never shows the stations of before; the ones shown stay until the
 * new ones are in.
 */
export function useWalkStations(
  tripId: number | string,
  placeId: number,
  enabled: boolean,
  revision?: number
): WalkPoints | null {
  const [walk, setWalk] = useState<{ placeId: number; points: WalkPoints } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    readWalkPoints(tripId, placeId, controller.signal)
      .then((points) => {
        if (!controller.signal.aborted) setWalk({ placeId, points });
      })
      .catch(() => {
        if (!controller.signal.aborted) setWalk({ placeId, points: UNREAD });
      });
    return () => controller.abort();
  }, [enabled, placeId, revision, tripId]);
  return enabled && walk?.placeId === placeId ? walk.points : null;
}
