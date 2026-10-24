import type { TourActivityAssignRequest, TourDetailResponse } from '@trek/shared';
import apiClient from './client';

/** ACT-01: the recorded tracks of a tour, assigned and taken off; both answer the tour's detail. */
export const tourActivitiesApi = {
  assign: (
    tripId: number | string,
    placeId: number | string,
    body: TourActivityAssignRequest
  ): Promise<TourDetailResponse> =>
    apiClient.put(`/trips/${tripId}/tours/${placeId}/activities`, body).then((r) => r.data),
  unassign: (tripId: number | string, placeId: number | string, activityId: number): Promise<TourDetailResponse> =>
    apiClient.delete(`/trips/${tripId}/tours/${placeId}/activities/${activityId}`).then((r) => r.data),
};
