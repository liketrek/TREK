import type { TourDetailResponse } from '@trek/shared';
import apiClient from './client';

/** An import that was planned over in place keeps its recorded track; this brings it back. */
export const recordedTrackApi = {
  restore: (tripId: number | string, placeId: number | string): Promise<TourDetailResponse> =>
    apiClient.post(`/trips/${tripId}/tours/${placeId}/restore-recorded`).then((r) => r.data),
};
