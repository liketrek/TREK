import type { TourSourceHint } from '@trek/shared';
import { useEffect, useState } from 'react';
import { wandererRepo } from '../../../repo/wandererRepo';

/**
 * WAN-02: the reader's own background hint on a wanderer snapshot, read with
 * the tour's detail when it can lead anywhere (a snapshot the reader may
 * check). Null while it loads, offline, on a failed read and when the watch
 * left none: a missing hint only means there is nothing to point at, never
 * that the trail is unchanged.
 */
export function useSourceHint({
  tripId,
  placeId,
  enabled,
}: {
  tripId: number;
  placeId: number;
  enabled: boolean;
}): TourSourceHint | null {
  const [state, setState] = useState<{ key: string; hint: TourSourceHint | null } | null>(null);
  const key = `${tripId}|${placeId}`;

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    wandererRepo.sourceHint(tripId, placeId, controller.signal).then(
      (hint) => {
        if (!controller.signal.aborted) setState({ key, hint });
      },
      () => {
        if (!controller.signal.aborted) setState({ key, hint: null });
      }
    );
    return () => controller.abort();
  }, [enabled, key, tripId, placeId]);

  return enabled && state?.key === key ? state.hint : null;
}
