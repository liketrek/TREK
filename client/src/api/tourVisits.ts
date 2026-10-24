import type { TourVisitListResponse, TourVisitUpdateRequest } from '@trek/shared';
import apiClient from './client';

/** Where one station of a walk is marked for one day; a write queued offline replays to the same path. */
export function tourVisitPath(tripId: number | string, assignmentId: number, stationKey: string): string {
  return `/trips/${tripId}/tour-visits/${assignmentId}/${encodeURIComponent(stationKey)}`;
}

/** CW-03: the stations of a trip's city walks visited or skipped on their days. */
export const tourVisitsApi = {
  list: (tripId: number | string): Promise<TourVisitListResponse> =>
    apiClient.get(`/trips/${tripId}/tour-visits`).then((r) => r.data),
  update: (
    tripId: number | string,
    assignmentId: number,
    stationKey: string,
    body: TourVisitUpdateRequest
  ): Promise<TourVisitListResponse> =>
    apiClient.put(tourVisitPath(tripId, assignmentId, stationKey), body).then((r) => r.data),
};
