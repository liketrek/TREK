import { tourDetailResponseSchema, type TourDetailResponse, type TourObstacleReviewsRequest } from '@trek/shared';
import apiClient from './client';

/** PAD-06: what the paddlers decided about the obstacles of a paddle tour; answers the detail with its checklist. */
export const tourObstacleReviewsApi = {
  save: (
    tripId: number | string,
    placeId: number | string,
    body: TourObstacleReviewsRequest
  ): Promise<TourDetailResponse> =>
    apiClient
      .put(`/trips/${tripId}/tours/${placeId}/obstacle-reviews`, body)
      .then((r) => tourDetailResponseSchema.parse(r.data)),
};
