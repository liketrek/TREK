import type { TourPoiSearchRequest, TourPoiSearchResponse } from '@trek/shared';
import { tourPoiSearchApi } from '../api/tourPoiSearch';
import { requireOnline } from './onlineOnly';

/**
 * PLN-02, online only: the places along a tour come from the map search
 * behind the server, and nothing of them is kept. Offline the card says so.
 */
export const tourPoiSearchRepo = {
  async search(
    tripId: number | string,
    body: TourPoiSearchRequest,
    signal?: AbortSignal
  ): Promise<TourPoiSearchResponse> {
    requireOnline();
    return await tourPoiSearchApi.search(tripId, body, signal);
  },
};
