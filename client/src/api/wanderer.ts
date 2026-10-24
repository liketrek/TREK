import type {
  AdminFeatureToggleResponse,
  TourSourceCheckResponse,
  TourSourceHintResponse,
  WandererConnection,
  WandererImportPreview,
  WandererImportRequest,
  WandererImportResponse,
  WandererSaveResponse,
  WandererSearchRequest,
  WandererSearchResponse,
  WandererSettingsRequest,
  WandererTestRequest,
  WandererTestResponse,
  WandererWatch,
} from '@trek/shared';
import apiClient from './client';

/**
 * How long the browser waits for a call that makes the server ask wanderer.
 * A preview reads the trail's index entry, its record and its GPX one after
 * another, each allowed 15 s on the server, so the shared 8 s would give up
 * while the server carries on.
 */
const WANDERER_UPSTREAM_TIMEOUT_MS = 60_000;

const upstream = { timeout: WANDERER_UPSTREAM_TIMEOUT_MS };

export const wandererApi = {
  getSettings: (): Promise<WandererConnection> => apiClient.get('/integrations/wanderer/settings').then((r) => r.data),
  saveSettings: (data: WandererSettingsRequest): Promise<WandererSaveResponse> =>
    apiClient.put('/integrations/wanderer/settings', data).then((r) => r.data),
  disconnect: (): Promise<{ success: true }> => apiClient.delete('/integrations/wanderer/settings').then((r) => r.data),
  test: (data: WandererTestRequest): Promise<WandererTestResponse> =>
    apiClient.post('/integrations/wanderer/test', data, upstream).then((r) => r.data),
  /** WAN-02: the optional background watch of the connection, with the open hints. */
  getWatch: (): Promise<WandererWatch> => apiClient.get('/integrations/wanderer/watch').then((r) => r.data),
  setWatch: (enabled: boolean): Promise<WandererWatch> =>
    apiClient.put('/integrations/wanderer/watch', { enabled }).then((r) => r.data),

  search: (tripId: number, body: WandererSearchRequest, signal?: AbortSignal): Promise<WandererSearchResponse> =>
    apiClient.post(`/trips/${tripId}/tours/wanderer/search`, body, { ...upstream, signal }).then((r) => r.data),
  preview: (tripId: number, trailId: string, signal?: AbortSignal): Promise<WandererImportPreview> =>
    apiClient
      .get(`/trips/${tripId}/tours/wanderer/trails/${encodeURIComponent(trailId)}`, { ...upstream, signal })
      .then((r) => r.data),
  importTrail: (tripId: number, body: WandererImportRequest): Promise<WandererImportResponse> =>
    apiClient.post(`/trips/${tripId}/tours/wanderer/import`, body, upstream).then((r) => r.data),
  /** MF-03: whether the trail a snapshot came from changed since; the server reads, it writes nothing. */
  checkSource: (tripId: number, placeId: number): Promise<TourSourceCheckResponse> =>
    apiClient.post(`/trips/${tripId}/tours/wanderer/sources/${placeId}/check`, {}, upstream).then((r) => r.data),
  /** WAN-02: the caller's own background hint on a snapshot; the server only reads its own rows. */
  sourceHint: (tripId: number, placeId: number, signal?: AbortSignal): Promise<TourSourceHintResponse> =>
    apiClient.get(`/trips/${tripId}/tours/wanderer/sources/${placeId}/hint`, { signal }).then((r) => r.data),
};

/** The admin's switch for wanderer under the Tours addon. */
export const wandererAdminApi = {
  get: (): Promise<AdminFeatureToggleResponse> => apiClient.get('/admin/tours-wanderer').then((r) => r.data),
  update: (enabled: boolean): Promise<AdminFeatureToggleResponse> =>
    apiClient.put('/admin/tours-wanderer', { enabled }).then((r) => r.data),
};
