import { ferrataBboxSpanOk, type FerrataBbox, type HorseRoute } from '@trek/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { horseRouteRepo } from '../../../repo/horseRouteRepo';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import { useTourMapViewportStore } from '../../../store/tourMapViewportStore';

type HorseRoutesStatus = 'idle' | 'loading' | 'ready' | 'failed' | 'offline' | 'zoom';

interface HorseRoutesState {
  status: HorseRoutesStatus;
  /** What the last search that answered found; kept while a later one loads or fails. */
  routes: HorseRoute[];
  truncated: boolean;
  /** The view that search looked in, as it was sent. */
  searched: string | null;
}

const IDLE: HorseRoutesState = { status: 'idle', routes: [], truncated: false, searched: null };

/** A view as it is sent: four edges rounded to five places, which is a metre and keeps the cache key short. */
export function horseRouteBbox(bounds: FerrataBbox): string {
  return [bounds.south, bounds.west, bounds.north, bounds.east].map((edge) => edge.toFixed(5)).join(',');
}

/** The rounded view, or null where it spans more than one search may ask for. */
function askableBbox(bounds: FerrataBbox | null): string | null {
  if (!bounds) return null;
  const bbox = horseRouteBbox(bounds);
  const [south, west, north, east] = bbox.split(',').map(Number) as [number, number, number, number];
  return ferrataBboxSpanOk({ south, west, north, east }) ? bbox : null;
}

/**
 * HOR-01: the signposted horse routes in the planner map's view, looked for
 * when the rider asks, never on every pan: Overpass is shared and slow. The
 * last answer stays on screen while a new search loads or fails, so a failed
 * search changes neither the list nor the ride. `stale` says the map has moved
 * since the routes shown were found.
 */
export function useHorseRoutes(tripId: number | string) {
  const [state, setState] = useState<HorseRoutesState>(IDLE);
  const abortRef = useRef<AbortController | null>(null);
  const view = useTourMapViewportStore((store) => store.bounds);

  useEffect(() => () => abortRef.current?.abort(), []);

  const search = useCallback(async () => {
    const bbox = askableBbox(useTourMapViewportStore.getState().bounds);
    abortRef.current?.abort();
    if (!bbox) {
      setState((current) => ({ ...current, status: 'zoom' }));
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setState((current) => ({ ...current, status: 'loading' }));
    try {
      const answer = await horseRouteRepo.list(tripId, bbox, controller.signal);
      if (controller.signal.aborted) return;
      setState({ status: 'ready', routes: answer.routes, truncated: answer.truncated, searched: bbox });
    } catch (failure) {
      if (controller.signal.aborted) return;
      setState((current) => ({ ...current, status: failure instanceof OnlineOnlyError ? 'offline' : 'failed' }));
    }
  }, [tripId]);

  const stale = state.searched !== null && view !== null && horseRouteBbox(view) !== state.searched;
  return { ...state, stale, search };
}

export type HorseRoutes = ReturnType<typeof useHorseRoutes>;
