import type { JourneyMapLayersResponse, JourneyPublicMapLayersResponse } from '@trek/shared';
import apiClient from './client';

/** JRN-04: what a journey map shows beside its entries and photos, for its people and through a share link. */
export const journeyMapApi = {
  layers: (journeyId: number, signal?: AbortSignal): Promise<JourneyMapLayersResponse> =>
    apiClient.get(`/journeys/${journeyId}/map-layers`, { signal }).then((r) => r.data),
  publicLayers: (token: string, signal?: AbortSignal): Promise<JourneyPublicMapLayersResponse> =>
    apiClient.get(`/public/journey/${encodeURIComponent(token)}/map-layers`, { signal }).then((r) => r.data),
};
