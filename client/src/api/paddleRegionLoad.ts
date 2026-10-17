import { paddleRegionLoadResponseSchema, type PaddleRegionLoadRequest, type PaddleRegionLoadState } from '@trek/shared';
import apiClient from './client';

/** A first look into Geofabrik's list can take the server a while (it fetches the list itself, within 20 s). */
const GEOFABRIK = { timeout: 30_000 };

/** PAD-11C: the water data around places no paddle region covers yet, loaded or asked for by the server. */
export const paddleRegionLoadApi = {
  load: (request: PaddleRegionLoadRequest, signal?: AbortSignal): Promise<PaddleRegionLoadState[]> =>
    apiClient
      .post('/paddle/regions/load', request, { signal, ...GEOFABRIK })
      .then((r) => paddleRegionLoadResponseSchema.parse(r.data).points),
};
