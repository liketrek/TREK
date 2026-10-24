import type { TourCopyRequest, TourCreateResponse } from '@trek/shared';
import apiClient from './client';

/** P2C-07: a tour of the trip saved again as a new, independent tour. */
export const tourCopiesApi = {
  copy: (tripId: number | string, placeId: number | string, body: TourCopyRequest): Promise<TourCreateResponse> =>
    apiClient.post(`/trips/${tripId}/tours/${placeId}/copy`, body).then((r) => r.data),
};
