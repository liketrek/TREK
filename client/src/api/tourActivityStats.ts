import type { TourActivityExclusionRequest, TourActivityStatsResponse } from '@trek/shared';
import apiClient from './client';

/** STA-02: the user's own tour activities across their trips, and leaving one out of them; both answer the sums. */
export const tourActivityStatsApi = {
  get: (signal?: AbortSignal): Promise<TourActivityStatsResponse> =>
    apiClient.get('/tours/activity-stats', { signal }).then((r) => r.data),
  setExcluded: (body: TourActivityExclusionRequest): Promise<TourActivityStatsResponse> =>
    apiClient.put('/tours/activity-stats/exclusions', body).then((r) => r.data),
};
