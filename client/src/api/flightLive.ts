import apiClient from './client';

/**
 * GET /api/trips/:tripId/flights/live: the live state of every flight leg of a
 * trip TREK can follow. The answer comes back unparsed; store/flightLiveStore.ts
 * checks it against the shared contract before anything draws it.
 */
export const flightLiveApi = {
  trip: (tripId: number, signal?: AbortSignal): Promise<unknown> =>
    apiClient.get(`/trips/${tripId}/flights/live`, { signal }).then((response) => response.data as unknown),
};
