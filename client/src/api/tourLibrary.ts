import type {
  TourCreateResponse,
  TourLibraryDetailResponse,
  TourLibraryQuery,
  TourLibraryResponse,
  TourTakeOverRequest,
} from '@trek/shared';
import apiClient from './client';

/** LIB-02: the tours of the user's other trips, one's preview, and taking one over into a trip. */
export const tourLibraryApi = {
  list: (query: TourLibraryQuery, signal?: AbortSignal): Promise<TourLibraryResponse> =>
    apiClient.get('/tours/library', { params: query, signal }).then((r) => r.data),
  detail: (placeId: number, signal?: AbortSignal): Promise<TourLibraryDetailResponse> =>
    apiClient.get(`/tours/library/${placeId}`, { signal }).then((r) => r.data),
  takeOver: (tripId: number | string, body: TourTakeOverRequest): Promise<TourCreateResponse> =>
    apiClient.post(`/trips/${tripId}/tours/take-over`, body).then((r) => r.data),
};
