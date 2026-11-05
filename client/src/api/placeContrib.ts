import type { PlaceContribDecisionRequest, PlaceContribLogQuery } from '@trek/shared';
import apiClient from './client';

/** /api/admin/places-contribute: sharing place details with the TREK Places API. Admin only. */
export const placeContribApi = {
  state: (signal?: AbortSignal): Promise<unknown> =>
    apiClient.get('/admin/places-contribute', { signal }).then((r) => r.data),
  decide: (body: PlaceContribDecisionRequest): Promise<unknown> =>
    apiClient.put('/admin/places-contribute/decision', body).then((r) => r.data),
  log: (query: Partial<PlaceContribLogQuery>, signal?: AbortSignal): Promise<unknown> =>
    apiClient.get('/admin/places-contribute/log', { params: query, signal }).then((r) => r.data),
  withdraw: (): Promise<unknown> =>
    apiClient.post('/admin/places-contribute/withdraw', { confirm: true }).then((r) => r.data),
};
