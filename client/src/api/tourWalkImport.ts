import type { WalkImportPreviewRequest, WalkImportPreviewResponse } from '@trek/shared';
import apiClient from './client';

/**
 * CW-07: a Google Maps walking route read into its stops. The server may
 * follow a short link a few hops within its own deadline, so the call waits
 * a little longer than that before it gives up.
 */
const WALK_IMPORT_TIMEOUT_MS = 20_000;

export const tourWalkImportApi = {
  preview: (
    tripId: number | string,
    body: WalkImportPreviewRequest,
    signal?: AbortSignal
  ): Promise<WalkImportPreviewResponse> =>
    apiClient
      .post(`/trips/${tripId}/tours/import/google-maps/preview`, body, { signal, timeout: WALK_IMPORT_TIMEOUT_MS })
      .then((r) => r.data),
};
