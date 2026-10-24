import type { TourDraftPutRequest, TourDraftResponse } from '@trek/shared';
import apiClient from './client';

/** Where the signed-in user's planner draft of a trip lives; a write queued offline replays to the same path. */
export function tourDraftPath(tripId: number | string): string {
  return `/trips/${tripId}/tour-draft`;
}

/** The Tours planner's unsaved draft on the account, one per user and trip. */
export const tourDraftsApi = {
  read: (tripId: number | string): Promise<TourDraftResponse> =>
    apiClient.get(tourDraftPath(tripId)).then((r) => r.data),
  keep: (tripId: number | string, body: TourDraftPutRequest): Promise<TourDraftResponse> =>
    apiClient.put(tourDraftPath(tripId), body).then((r) => r.data),
  forget: (tripId: number | string): Promise<void> => apiClient.delete(tourDraftPath(tripId)).then(() => undefined),
};
