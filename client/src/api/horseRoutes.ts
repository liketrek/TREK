import apiClient from './client';

/**
 * How long the browser waits for GET /api/trips/:tripId/tours/horse-routes.
 * The server races the Overpass mirrors under its own deadline (25 s by
 * default) and answers 502 when none made it, so this sits just above it, as
 * the via ferrata layer's wait does.
 */
const HORSE_ROUTES_TIMEOUT_MS = 30_000;

/**
 * HOR-01 GET /api/trips/:tripId/tours/horse-routes: the signposted horse
 * routes OpenStreetMap knows inside one map view. The answer comes back
 * unparsed; repo/horseRouteRepo.ts checks it against the shared contract.
 */
export const horseRoutesApi = {
  list: (tripId: number | string, bbox: string, signal?: AbortSignal): Promise<unknown> =>
    apiClient
      .get(`/trips/${tripId}/tours/horse-routes`, { params: { bbox }, signal, timeout: HORSE_ROUTES_TIMEOUT_MS })
      .then((response) => response.data as unknown),
};
