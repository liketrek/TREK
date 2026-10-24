import type {
  CollectionTourDetailResponse,
  CollectionTourListResponse,
  CollectionTourSaveRequest,
  CollectionTourSaveResponse,
  CollectionTourTakeOverRequest,
  TourCreateResponse,
} from '@trek/shared';
import apiClient from './client';

const base = (collectionId: number) => `/addons/collections/${collectionId}/tours`;

/** LIB-03: the whole tours a collection keeps, keeping one, removing one and taking one into a trip. */
export const collectionToursApi = {
  list: (collectionId: number, signal?: AbortSignal): Promise<CollectionTourListResponse> =>
    apiClient.get(base(collectionId), { signal }).then((r) => r.data),
  detail: (collectionId: number, tourId: number, signal?: AbortSignal): Promise<CollectionTourDetailResponse> =>
    apiClient.get(`${base(collectionId)}/${tourId}`, { signal }).then((r) => r.data),
  save: (collectionId: number, body: CollectionTourSaveRequest): Promise<CollectionTourSaveResponse> =>
    apiClient.post(base(collectionId), body).then((r) => r.data),
  remove: (collectionId: number, tourId: number): Promise<void> =>
    apiClient.delete(`${base(collectionId)}/${tourId}`).then(() => undefined),
  takeOver: (tripId: number, body: CollectionTourTakeOverRequest): Promise<TourCreateResponse> =>
    apiClient.post(`/trips/${tripId}/tours/from-collection`, body).then((r) => r.data),
};
