import type { TourDetailResponse, TourSkiClassificationRequest } from '@trek/shared';
import apiClient from './client';

/** SKI-02: a ski track classified again, its discipline and cross-country technique. */
export const tourSkiApi = {
  classify: (
    tripId: number | string,
    placeId: number | string,
    body: TourSkiClassificationRequest
  ): Promise<TourDetailResponse> => apiClient.put(`/trips/${tripId}/tours/${placeId}/ski`, body).then((r) => r.data),
};
