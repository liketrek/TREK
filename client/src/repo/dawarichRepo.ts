import {
  dawarichAtlasSuggestionsSchema,
  dawarichBucketScanSchema,
  dawarichSuggestionListSchema,
  dawarichTrackSchema,
} from '@trek/shared'
import { dawarichApi } from '../api/dawarich'
import { isEffectivelyOffline } from '../sync/networkMode'

/**
 * Reads from the Dawarich integration.
 *
 * **Deliberately online-only, and no Dexie table.** Everything here is a live
 * read of somebody's location history on a server TREK does not own: a cached
 * recording is a stale one, and a cached copy of a GPS archive is the thing
 * this integration exists not to keep. The precedent in this directory is
 * `roadtripHazardsRepo` / `chargingRepo` / `schoolHolidayCatalogRepo` — same
 * shape, same reason.
 *
 * The offline check is `isEffectivelyOffline()` rather than `navigator.onLine`,
 * so the manual offline switch counts: someone who turned it on before a flight
 * has said they do not want requests fired, and firing them anyway would block
 * the UI on a timeout.
 *
 * Responses are parsed against the shared schema rather than cast. A server
 * that answered something unexpected should fail here, loudly, not three
 * components later where the cause is invisible.
 */

/** Thrown before a request is made when the device is offline by choice or by circumstance. */
export class DawarichOfflineError extends Error {
  constructor() {
    super('Dawarich needs a connection')
    this.name = 'DawarichOfflineError'
  }
}

function requireOnline(): void {
  if (isEffectivelyOffline()) throw new DawarichOfflineError()
}

export const dawarichRepo = {
  async suggestions(params?: { tripId?: number; state?: string }) {
    requireOnline()
    return dawarichSuggestionListSchema.parse(await dawarichApi.listSuggestions(params))
  },

  async tripTrack(tripId: number, range?: { from?: string; to?: string }, signal?: AbortSignal) {
    requireOnline()
    return dawarichTrackSchema.parse(await dawarichApi.tripTrack(tripId, range, signal))
  },

  async windowTrack(from: string, to: string, signal?: AbortSignal) {
    requireOnline()
    return dawarichTrackSchema.parse(await dawarichApi.windowTrack(from, to, signal))
  },

  async bucketScan() {
    requireOnline()
    return dawarichBucketScanSchema.parse(await dawarichApi.scanBucketList())
  },

  async atlasSuggestions(from: string, to: string) {
    requireOnline()
    return dawarichAtlasSuggestionsSchema.parse(await dawarichApi.atlasSuggestions(from, to))
  },
}
