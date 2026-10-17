import {
  paddleRegionCatalogResponseSchema,
  paddleRegionListResponseSchema,
  paddleRegionSchema,
  successResponseSchema,
  type PaddleRegionRequest,
} from '@trek/shared';
import apiClient from './client';

/** A first look into Geofabrik's list can take the server a while (it fetches the list itself, within 20 s). */
const GEOFABRIK = { timeout: 30_000 };

/** PAD-05A, the admin side: the regions TREK reads paddle data for. */
export const paddleRegionsApi = {
  list: () => apiClient.get('/admin/paddle-regions').then((r) => paddleRegionListResponseSchema.parse(r.data).regions),
  catalog: (q: string, signal?: AbortSignal) =>
    apiClient
      .get('/admin/paddle-regions/catalog', { params: { q }, signal, ...GEOFABRIK })
      .then((r) => paddleRegionCatalogResponseSchema.parse(r.data).regions),
  add: (id: string) =>
    apiClient
      .post('/admin/paddle-regions', { id } satisfies PaddleRegionRequest, GEOFABRIK)
      .then((r) => paddleRegionSchema.parse(r.data)),
  refresh: (id: string) =>
    apiClient
      .post('/admin/paddle-regions/refresh', { id } satisfies PaddleRegionRequest)
      .then((r) => paddleRegionSchema.parse(r.data)),
  remove: (id: string) =>
    apiClient
      .post('/admin/paddle-regions/remove', { id } satisfies PaddleRegionRequest)
      .then((r) => successResponseSchema.parse(r.data)),
};
