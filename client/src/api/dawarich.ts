import apiClient from './client'
import type {
  DawarichAccept,
  DawarichAcceptResult,
  DawarichAtlasSuggestions,
  DawarichBucketScan,
  DawarichConnection,
  DawarichSettings,
  DawarichStatus,
  DawarichSuggestion,
  DawarichSuggestionList,
  DawarichTrack,
} from '@trek/shared'

/**
 * The Dawarich surface, in its own file rather than in the `client.ts` god
 * module. Types come from the shared contracts, so a server change that the
 * client has not caught up with is a typecheck failure rather than a runtime
 * surprise.
 */
/**
 * How long the browser waits for a call that makes the server go and ask
 * Dawarich.
 *
 * The shared 8 s on `apiClient` is right for TREK's own routes and wrong for
 * these: the server allows each request to Dawarich 15 s by itself, walks pages
 * of points for a route, and runs six probes one after another to test a
 * connection. Cut off at 8 s, the browser gave up while the server carried on
 * and cached the answer, so the recorded route showed "unavailable" and then
 * appeared on the next reload.
 */
export const DAWARICH_UPSTREAM_TIMEOUT_MS = 120_000

/**
 * The Atlas asks for a year of visited cities a month at a time, one request
 * after another, so it gets longer again. Still bounded, and under Node's own
 * five-minute request limit on the server side.
 */
export const DAWARICH_ATLAS_TIMEOUT_MS = 240_000

const upstream = { timeout: DAWARICH_UPSTREAM_TIMEOUT_MS }

export const dawarichApi = {
  // ── Connection ─────────────────────────────────────────────────────────────
  getSettings: (): Promise<DawarichConnection> =>
    apiClient.get('/integrations/dawarich/settings').then(r => r.data),
  saveSettings: (data: DawarichSettings): Promise<{
    success: boolean
    /** The server's own sentence, English — the fallback when the code below is unknown here. */
    warning?: string
    /** What the warning is about, so the UI can say it in the reader's language. */
    warningCode?: string
    /** The address it resolved to, for the private-IP warning. */
    warningIp?: string
  }> =>
    apiClient.put('/integrations/dawarich/settings', data, upstream).then(r => r.data),
  disconnect: (): Promise<{ success: boolean }> =>
    apiClient.delete('/integrations/dawarich/settings').then(r => r.data),
  test: (data: Partial<DawarichSettings>): Promise<DawarichStatus> =>
    apiClient.post('/integrations/dawarich/test', data, upstream).then(r => r.data),
  syncNow: (): Promise<{ state: string; created: number; updated: number; missing: number; alreadyRunning?: boolean }> =>
    apiClient.post('/integrations/dawarich/sync', undefined, upstream).then(r => r.data),

  // ── Suggestions ────────────────────────────────────────────────────────────
  listSuggestions: (params?: { tripId?: number; state?: string }): Promise<DawarichSuggestionList> =>
    apiClient.get('/integrations/dawarich/suggestions', { params }).then(r => r.data),
  accept: (id: number, body: DawarichAccept): Promise<DawarichAcceptResult> =>
    apiClient.post(`/integrations/dawarich/suggestions/${id}/accept`, body).then(r => r.data),
  setState: (id: number, state: 'new' | 'dismissed'): Promise<DawarichSuggestion> =>
    apiClient.put(`/integrations/dawarich/suggestions/${id}/state`, { state }).then(r => r.data),

  // ── Bucket list ────────────────────────────────────────────────────────────
  scanBucketList: (): Promise<DawarichBucketScan> =>
    apiClient.post('/integrations/dawarich/bucket-list/scan', undefined, upstream).then(r => r.data),
  confirmBucketVisits: (itemIds: number[], visitedAt?: string): Promise<{ updated: number }> =>
    apiClient.post('/integrations/dawarich/bucket-list/confirm', { itemIds, visitedAt }).then(r => r.data),
  clearBucketVisit: (itemId: number): Promise<{ success: boolean }> =>
    apiClient.delete(`/integrations/dawarich/bucket-list/${itemId}/visit`).then(r => r.data),

  // ── Atlas ──────────────────────────────────────────────────────────────────
  atlasSuggestions: (from: string, to: string): Promise<DawarichAtlasSuggestions> =>
    apiClient
      .get('/integrations/dawarich/atlas/suggestions', { params: { from, to }, timeout: DAWARICH_ATLAS_TIMEOUT_MS })
      .then(r => r.data),
  acceptAtlasCountries: (countryCodes: string[]): Promise<{ marked: number }> =>
    apiClient.post('/integrations/dawarich/atlas/accept', { countryCodes }).then(r => r.data),

  // ── Track overlay ──────────────────────────────────────────────────────────
  //
  // Recorded points are bare instants, so the server cannot know which day they
  // belong to without being told whose day is meant. The browser is the only
  // party that knows, so it says so — otherwise an evening east of UTC lands on
  // the wrong day of the trip.
  tripTrack: (tripId: number, params?: { from?: string; to?: string }, signal?: AbortSignal): Promise<DawarichTrack> =>
    apiClient
      .get(`/integrations/dawarich/trips/${tripId}/track`, { ...upstream, params: { ...params, offset: localOffsetMinutes() }, signal })
      .then(r => r.data),
  windowTrack: (from: string, to: string, signal?: AbortSignal): Promise<DawarichTrack> =>
    apiClient
      .get('/integrations/dawarich/track', { ...upstream, params: { from, to, offset: localOffsetMinutes() }, signal })
      .then(r => r.data),
}

/** The reader's own UTC offset in minutes — +120 for Berlin in summer. */
function localOffsetMinutes(): number {
  return -new Date().getTimezoneOffset()
}
