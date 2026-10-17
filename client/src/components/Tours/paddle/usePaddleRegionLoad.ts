import { MAX_PADDLE_LOAD_POINTS, type PaddleRegionLoadState, type PaddleRoutePoint } from '@trek/shared';
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { paddleRegionLoadRepo } from '../../../repo/paddleRegionLoadRepo';
import type { PaddleTourRoute } from '../planner/paddleRouting';

/** How soon the planner asks again: often while a region loads, now and then while it waits for an admin. */
const POLL_MS = { loading: 2_000, requested: 30_000, error: 10_000 } as const;

type Failure = PaddleTourRoute['failures'][number];

/** A place as the key it is asked and remembered by; five decimals are about a metre. */
function keyOf(point: PaddleRoutePoint): string {
  return `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`;
}

function placeOf(key: string): PaddleRoutePoint {
  const [lat, lng] = key.split(',').map(Number);
  return { lat, lng };
}

/** The places the planner asks about: where its legs ran out of water data, each once. */
function placeKeysOf(failures: readonly Failure[] | null | undefined): string {
  const keys = new Set<string>();
  for (const failure of failures ?? []) {
    if (failure.code === 'no_region' && failure.at) keys.add(keyOf(failure.at));
  }
  return [...keys].slice(0, MAX_PADDLE_LOAD_POINTS).join('|');
}

function nextPoll(states: readonly PaddleRegionLoadState[]): number | null {
  if (states.some((state) => state.state === 'loading')) return POLL_MS.loading;
  if (states.some((state) => state.state === 'requested')) return POLL_MS.requested;
  return null;
}

/**
 * PAD-11C: where a paddle leg failed for want of water data, the planner
 * asks the server for it right away; the server loads the region around the
 * place or asks an admin for it, as the instance is set up. While it loads
 * the leg shows how far it is, and once it is there the route is planned
 * again on its own. `onReady` plans again; it is called once per place.
 */
export function usePaddleRegionLoad(failures: readonly Failure[] | null | undefined, onReady: () => void) {
  const placesKey = placeKeysOf(failures);
  const places = useMemo(() => (placesKey ? placesKey.split('|').map(placeOf) : []), [placesKey]);
  const [states, setStates] = useState<ReadonlyMap<string, PaddleRegionLoadState>>(new Map());
  const [retryToken, setRetryToken] = useState(0);
  const readied = useRef(new Set<string>());
  const retrying = useRef(false);

  /** The answers taken in; the route is planned again where a place's data has just arrived. */
  const take = useEffectEvent((answers: readonly PaddleRegionLoadState[]) => {
    setStates(new Map(places.flatMap((place, index) => (answers[index] ? [[keyOf(place), answers[index]]] : []))));
    const fresh = places.filter((place, index) => {
      const key = keyOf(place);
      if (answers[index]?.state !== 'ready' || readied.current.has(key)) return false;
      readied.current.add(key);
      return true;
    });
    if (fresh.length > 0) onReady();
  });

  useEffect(() => {
    if (places.length === 0) return undefined;
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ask = async () => {
      const retry = retrying.current;
      retrying.current = false;
      let answers: PaddleRegionLoadState[] | null;
      try {
        answers = await paddleRegionLoadRepo.load(places, retry, abort.signal);
      } catch {
        // The failure row keeps saying why the leg is unplanned; a later look may get through.
        if (!abort.signal.aborted) timer = setTimeout(() => void ask(), POLL_MS.error);
        return;
      }
      if (abort.signal.aborted || !answers) return;
      take(answers);
      const wait = nextPoll(answers);
      if (wait !== null) timer = setTimeout(() => void ask(), wait);
    };
    void ask();
    return () => {
      abort.abort();
      clearTimeout(timer);
    };
  }, [places, retryToken]);

  /** Reads a region again whose last read failed. */
  const retry = useCallback(() => {
    retrying.current = true;
    setRetryToken((token) => token + 1);
  }, []);

  /** The state of each failed leg's place, by the leg's index. */
  const byLeg = useMemo(() => {
    const result = new Map<number, PaddleRegionLoadState>();
    for (const failure of failures ?? []) {
      if (failure.code !== 'no_region' || !failure.at) continue;
      const state = states.get(keyOf(failure.at));
      if (state) result.set(failure.index, state);
    }
    return result;
  }, [failures, states]);

  return { byLeg, retry };
}
