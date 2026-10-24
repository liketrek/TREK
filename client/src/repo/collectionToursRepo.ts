import type {
  Collection,
  CollectionTourDetailResponse,
  CollectionTourListResponse,
  CollectionTourSaveRequest,
  CollectionTourSaveResponse,
  CollectionTourTakeOverRequest,
  TourCreateResponse,
} from '@trek/shared';
import { collectionsApi } from '../api/collections';
import { collectionToursApi } from '../api/collectionTours';
import { cacheTourAnswer } from '../db/cacheTour';
import { requireOnline } from './onlineOnly';

/**
 * LIB-03, online only on purpose, like the collections themselves: a kept
 * tour lives apart from every trip, so there is no trip cache it belongs to,
 * and who may read, keep or take one is decided by the server at the moment
 * it is asked. A tour taken into a trip goes into that trip's cache once it
 * exists, as the take-over from another trip does.
 */
export const collectionToursRepo = {
  /** The user's collections, to choose the one a tour is kept in. */
  async lists(): Promise<Collection[]> {
    requireOnline();
    return (await collectionsApi.list()).collections;
  },

  async list(collectionId: number, signal?: AbortSignal): Promise<CollectionTourListResponse> {
    requireOnline();
    return await collectionToursApi.list(collectionId, signal);
  },

  async detail(collectionId: number, tourId: number, signal?: AbortSignal): Promise<CollectionTourDetailResponse> {
    requireOnline();
    return await collectionToursApi.detail(collectionId, tourId, signal);
  },

  async save(collectionId: number, body: CollectionTourSaveRequest): Promise<CollectionTourSaveResponse> {
    requireOnline();
    return await collectionToursApi.save(collectionId, body);
  },

  async remove(collectionId: number, tourId: number): Promise<void> {
    requireOnline();
    await collectionToursApi.remove(collectionId, tourId);
  },

  async takeOver(tripId: number, body: CollectionTourTakeOverRequest): Promise<TourCreateResponse> {
    requireOnline();
    const result = await collectionToursApi.takeOver(tripId, body);
    await cacheTourAnswer(tripId, result);
    return result;
  },
};
