import apiClient from './client';

/**
 * How long the browser waits for GET /api/trips/:tripId/ferratas.
 *
 * The server races the configured Overpass mirrors under one OVERPASS_TIMEOUT_MS
 * (25 s by default) and answers 502 when none of them made it. The shared 8 s
 * on `apiClient` would give up on a slow but healthy mirror and show an error
 * the server was about to resolve, so this sits just above the server's own
 * ceiling.
 */
const FERRATAS_TIMEOUT_MS = 30_000;

/**
 * GET /api/trips/:tripId/ferratas: the via ferratas OpenStreetMap knows inside
 * one map area. In its own file rather than in the `client.ts` god module. The
 * answer comes back unparsed; repo/ferrataRepo.ts checks it against the shared
 * contract before anything draws it.
 */
export const ferratasApi = {
  list: (tripId: number, bbox: string, signal?: AbortSignal): Promise<unknown> =>
    apiClient
      .get(`/trips/${tripId}/ferratas`, { params: { bbox }, signal, timeout: FERRATAS_TIMEOUT_MS })
      .then((response) => response.data as unknown),
};
