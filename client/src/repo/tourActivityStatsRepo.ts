import { tourActivityStatsResponseSchema, type TourActivityExclusionRequest } from '@trek/shared';
import { tourActivityStatsApi } from '../api/tourActivityStats';
import { isEffectivelyOffline } from '../sync/networkMode';

/**
 * STA-02: the user's own tour activities for the Atlas.
 *
 * **Deliberately online-only, and no Dexie table.** The sums run across every
 * trip the user can open, most of which are not on the device, and the Atlas
 * they belong to reads its statistics live as well; a copy of them would be a
 * stale one. Leaving a tour out is online-only for the same reason: the answer
 * is the new sums, which only the server can give. The precedent in this
 * directory is `dawarichRepo`.
 *
 * Offline means `isEffectivelyOffline()`, so the manual switch counts, and the
 * request is never built. Answers are parsed against the shared schema rather
 * than cast.
 */
export class TourActivityStatsOfflineError extends Error {
  constructor() {
    super('Tour activities need a connection');
    this.name = 'TourActivityStatsOfflineError';
  }
}

function requireOnline(): void {
  if (isEffectivelyOffline()) throw new TourActivityStatsOfflineError();
}

export const tourActivityStatsRepo = {
  async get(signal?: AbortSignal) {
    requireOnline();
    return tourActivityStatsResponseSchema.parse(await tourActivityStatsApi.get(signal));
  },

  async setExcluded(body: TourActivityExclusionRequest) {
    requireOnline();
    return tourActivityStatsResponseSchema.parse(await tourActivityStatsApi.setExcluded(body));
  },
};
