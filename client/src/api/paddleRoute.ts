import { paddleRouteResponseSchema, type PaddleRouteInput, type PaddleRouteResponse } from '@trek/shared';
import apiClient from './client';

/** PAD-11: legs of a paddle tour planned on the water by the server's router. */
export const paddleRouteApi = {
  plan: (tripId: number | string, request: PaddleRouteInput, signal?: AbortSignal): Promise<PaddleRouteResponse> =>
    apiClient
      .post(`/trips/${tripId}/paddle/route`, request, { signal })
      .then((r) => paddleRouteResponseSchema.parse(r.data)),
};
