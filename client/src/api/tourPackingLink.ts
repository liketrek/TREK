import type { TourDetailResponse, TourPackingLinkRequest, TourPackingLinkResponse } from '@trek/shared';
import apiClient from './client';

/**
 * Where a tour's packing link lives; a write queued offline replays to the
 * same path, `{id}` standing for a tour that has not synced yet.
 */
export function tourPackingLinkPath(tripId: number | string, placeId: number | string): string {
  return `/trips/${tripId}/tours/${placeId}/packing-link`;
}

/** P2D-XD-01: the packing list, or the category of it, a tour points at. */
export const tourPackingLinkApi = {
  read: (tripId: number | string, placeId: number, signal?: AbortSignal): Promise<TourPackingLinkResponse> =>
    apiClient.get(tourPackingLinkPath(tripId, placeId), { signal }).then((r) => r.data),
  link: (tripId: number | string, placeId: number, body: TourPackingLinkRequest): Promise<TourDetailResponse> =>
    apiClient.put(tourPackingLinkPath(tripId, placeId), body).then((r) => r.data),
  unlink: (tripId: number | string, placeId: number): Promise<TourDetailResponse> =>
    apiClient.delete(tourPackingLinkPath(tripId, placeId)).then((r) => r.data),
};
