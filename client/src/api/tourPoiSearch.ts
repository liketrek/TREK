import type { TourPoiSearchRequest, TourPoiSearchResponse } from '@trek/shared';
import apiClient from './client';

/**
 * PLN-02: places along a tour. A search runs several stretches against the map
 * search on the server, each allowed its own timeout there, so it may take
 * longer than the shared default: up to three rounds of stretches, each asking
 * the Overpass mirrors one after another for about twenty seconds at most.
 */
const POI_SEARCH_TIMEOUT_MS = 75_000;

export const tourPoiSearchApi = {
  search: (tripId: number | string, body: TourPoiSearchRequest, signal?: AbortSignal): Promise<TourPoiSearchResponse> =>
    apiClient
      .post(`/trips/${tripId}/tours/poi-search`, body, { signal, timeout: POI_SEARCH_TIMEOUT_MS })
      .then((r) => r.data),
};
