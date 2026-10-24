import type { TourTrailGradeRequest, TourTrailGradeResponse } from '@trek/shared';
import apiClient from './client';

/**
 * BIK-05: the trail grades of the ways a mountain bike tour runs on. The
 * server asks Overpass in parts, one after another, so a long tour may take
 * longer than the shared default.
 */
const TRAIL_GRADE_TIMEOUT_MS = 60_000;

export const tourTrailGradeApi = {
  grades: (
    tripId: number | string,
    body: TourTrailGradeRequest,
    signal?: AbortSignal
  ): Promise<TourTrailGradeResponse> =>
    apiClient
      .post(`/trips/${tripId}/tours/trail-grades`, body, { signal, timeout: TRAIL_GRADE_TIMEOUT_MS })
      .then((r) => r.data),
};
