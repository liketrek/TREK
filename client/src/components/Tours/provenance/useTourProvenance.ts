import type { TourListItem, TourProvenance } from '@trek/shared';
import { useEffect, useState } from 'react';
import { tourRepo } from '../../../repo/tourRepo';

/**
 * Where a tour came from (P2C-02), read with its detail: online from the
 * server, offline from the copy the last detail left. Asked again whenever a
 * field it depends on changes (the name and line for the local edit state, the
 * kept track, the import it was planned from). Null while it loads and when no
 * copy is to be had; the caller then simply shows no provenance.
 */
export function useTourProvenance(tripId: number, tour: TourListItem): TourProvenance | null {
  const [state, setState] = useState<{ key: string; provenance: TourProvenance | null } | null>(null);
  const key = [
    tripId,
    tour.place_id,
    tour.name,
    tour.distance,
    tour.has_recorded_track,
    tour.derived_from_place_id,
    tour.origin,
  ].join('|');

  useEffect(() => {
    const controller = new AbortController();
    tourRepo.detail(tripId, tour.place_id, controller.signal).then(
      (detail) => {
        if (!controller.signal.aborted) setState({ key, provenance: detail.provenance ?? null });
      },
      () => {
        if (!controller.signal.aborted) setState({ key, provenance: null });
      }
    );
    return () => controller.abort();
    // `key` also carries the fields the detail is asked again for.
  }, [key, tripId, tour.place_id]);

  return state?.key === key ? state.provenance : null;
}
