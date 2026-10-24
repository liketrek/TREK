import type {
  TourCreateResponse,
  TourLibraryDetailResponse,
  TourLibraryQuery,
  TourLibraryResponse,
  TourTakeOverRequest,
} from '@trek/shared';
import { tourLibraryApi } from '../api/tourLibrary';
import { cacheTourAnswer } from '../db/cacheTour';
import { requireOnline } from './onlineOnly';

/**
 * LIB-02, online only on purpose: the list reads across trips this device may
 * never have cached and whose access the server decides at the moment it is
 * asked, so an offline copy could show a tour of a trip the user has left.
 * The take-over is made from the server's copy of the source, like the in-trip
 * copy, and the new tour goes into this trip's cache once it exists.
 */
export const tourLibraryRepo = {
  async list(query: TourLibraryQuery, signal?: AbortSignal): Promise<TourLibraryResponse> {
    requireOnline();
    return await tourLibraryApi.list(query, signal);
  },

  async detail(placeId: number, signal?: AbortSignal): Promise<TourLibraryDetailResponse> {
    requireOnline();
    return await tourLibraryApi.detail(placeId, signal);
  },

  async takeOver(tripId: number | string, body: TourTakeOverRequest): Promise<TourCreateResponse> {
    requireOnline();
    const result = await tourLibraryApi.takeOver(tripId, body);
    await cacheTourAnswer(Number(tripId), result);
    return result;
  },
};
