import type { WandererErrorCode, WandererImportRequest, WandererSearchRequest } from '@trek/shared';
import { wandererApi } from '../api/wanderer';
import { offlineDb } from '../db/offlineDb';
import { isEffectivelyOffline } from '../sync/networkMode';

/**
 * wanderer, deliberately online-only: the connection is the user's own and
 * every read goes to their instance through the server, so there is nothing a
 * device could answer offline. What the import writes is an ordinary tour,
 * cached like every other the moment it comes back.
 */
export const wandererRepo = {
  getSettings: wandererApi.getSettings,
  saveSettings: wandererApi.saveSettings,
  disconnect: wandererApi.disconnect,
  test: wandererApi.test,
  getWatch: wandererApi.getWatch,
  setWatch: wandererApi.setWatch,

  async search(tripId: number, body: WandererSearchRequest, signal?: AbortSignal) {
    if (isEffectivelyOffline()) throw new WandererOfflineError();
    return await wandererApi.search(tripId, body, signal);
  },

  async preview(tripId: number, trailId: string, signal?: AbortSignal) {
    if (isEffectivelyOffline()) throw new WandererOfflineError();
    return await wandererApi.preview(tripId, trailId, signal);
  },

  async checkSource(tripId: number, placeId: number) {
    if (isEffectivelyOffline()) throw new WandererOfflineError();
    return await wandererApi.checkSource(tripId, placeId);
  },

  /** WAN-02: the caller's own background hint on a snapshot; offline there is none to show. */
  async sourceHint(tripId: number, placeId: number, signal?: AbortSignal) {
    if (isEffectivelyOffline()) return null;
    return (await wandererApi.sourceHint(tripId, placeId, signal)).hint;
  },

  async importTrail(tripId: number, body: WandererImportRequest) {
    if (isEffectivelyOffline()) throw new WandererOfflineError();
    const result = await wandererApi.importTrail(tripId, body);
    await offlineDb.tours.put({ ...result.tour, trip_id: tripId });
    return result;
  },
};

/** Thrown instead of a request while the app is offline, so the caller can say so. */
export class WandererOfflineError extends Error {
  constructor() {
    super('offline');
    this.name = 'WandererOfflineError';
  }
}

/** The reason code of a failed wanderer call: the server's own, or what the failure itself says. */
export function wandererErrorCode(
  error: unknown
): WandererErrorCode | 'offline' | 'preview_stale' | 'already_imported' | 'no_track' | 'unknown' {
  if (error instanceof WandererOfflineError) return 'offline';
  const code = (error as { response?: { data?: { code?: unknown } } })?.response?.data?.code;
  return typeof code === 'string' ? (code as WandererErrorCode) : 'unknown';
}
