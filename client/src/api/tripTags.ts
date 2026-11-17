import type { TripTagCreateRequest, TripTagListResponse, TripTagResponse } from '@trek/shared';
import apiClient from './client';

/** The tags a trip owns: every member reads them, and whoever may edit its places adds one. */
export const tripTagsApi = {
  list: (tripId: number | string): Promise<TripTagListResponse> =>
    apiClient.get(`/trips/${tripId}/tags`).then((r) => r.data),
  /** Answers the trip's existing tag when it already has one of that name. */
  create: (tripId: number | string, body: TripTagCreateRequest): Promise<TripTagResponse> =>
    apiClient.post(`/trips/${tripId}/tags`, body).then((r) => r.data),
};
