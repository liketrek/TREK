import { skiRouteResponseSchema, type SkiRouteInput, type SkiRouteResponse } from '@trek/shared';
import apiClient from './client';

/** The piste router: a ski tour's legs planned on the piste data the server keeps, held to the contract. */
export const skiRouteApi = {
  plan: (tripId: number | string, request: SkiRouteInput, signal?: AbortSignal): Promise<SkiRouteResponse> =>
    apiClient.post(`/trips/${tripId}/ski/route`, request, { signal }).then((r) => skiRouteResponseSchema.parse(r.data)),
};
