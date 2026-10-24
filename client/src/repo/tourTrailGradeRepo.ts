import type { TourTrailGradeRequest, TourTrailGradeResponse } from '@trek/shared';
import { tourTrailGradeApi } from '../api/tourTrailGrade';
import { requireOnline } from './onlineOnly';

/**
 * BIK-05, online only: the grades come from OpenStreetMap through the server,
 * and the server keeps them a day; the client keeps nothing. Offline the card
 * says so.
 */
export const tourTrailGradeRepo = {
  async grades(
    tripId: number | string,
    body: TourTrailGradeRequest,
    signal?: AbortSignal
  ): Promise<TourTrailGradeResponse> {
    requireOnline();
    return await tourTrailGradeApi.grades(tripId, body, signal);
  },
};
