import { useEffect } from 'react';
import type { PlannerSearchParams } from './plannerTypes';

interface PlaceDeepLinkOptions {
  searchParams: PlannerSearchParams[0];
  setSearchParams: PlannerSearchParams[1];
  /** The places of this trip, empty until they are loaded. */
  placeIds: readonly number[];
  selectPlace: (placeId: number) => void;
}

/**
 * `?place=<id>` opens that place of the trip, a tour in its detail: the link a
 * notification about one of them carries (WAN-02). It waits until the trip's
 * places are there, then leaves the URL, so a reload or the way back does not
 * open it again. An id the trip does not hold is dropped without a word.
 */
export function usePlaceDeepLink({ searchParams, setSearchParams, placeIds, selectPlace }: PlaceDeepLinkOptions): void {
  const requested = searchParams.get('place');
  const known = requested !== null && placeIds.includes(Number(requested));
  const loaded = placeIds.length > 0;

  useEffect(() => {
    if (requested === null || (!known && !loaded)) return;
    if (known) selectPlace(Number(requested));
    setSearchParams(
      (params) => {
        params.delete('place');
        return params;
      },
      { replace: true }
    );
  }, [requested, known, loaded, selectPlace, setSearchParams]);
}
