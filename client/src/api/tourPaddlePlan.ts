import type { TourDetailResponse, TourPaddlePlanRequest } from '@trek/shared';
import apiClient from './client';

/** PAD-03/PAD-07: the portages, locks and speeds laid onto a recorded paddle track. */
export const tourPaddlePlanApi = {
  update: (
    tripId: number | string,
    placeId: number | string,
    body: TourPaddlePlanRequest
  ): Promise<TourDetailResponse> =>
    apiClient.put(`/trips/${tripId}/tours/${placeId}/paddle-plan`, body).then((r) => r.data),
};
