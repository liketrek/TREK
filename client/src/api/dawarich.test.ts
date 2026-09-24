/**
 * FE-DAWARICH-API-001 to FE-DAWARICH-API-019, plus FE-DAWARICH-API-040 and -041
 * for how long the browser waits.
 *
 * `dawarichApi` is one line per endpoint: a verb, a URL, and the shape of what
 * goes into the body or the query string. There is no logic in it to get wrong,
 * which is exactly why a mistake here is so quiet: a wrong path or a dropped
 * query parameter does not throw, it hands the layer above an empty answer, and
 * the panel three levels up simply shows nothing. Every method is therefore
 * driven through MSW and its verb, path and payload pinned.
 *
 * Three things here matter more than the URL bookkeeping:
 *
 *  - **`offset`.** Recorded points are bare instants, so the reader's own UTC
 *    offset is the one fact the server cannot derive. Both track calls send it,
 *    and they send it negated: `getTimezoneOffset()` counts minutes *behind*
 *    local time, the wire wants minutes *ahead* of UTC. Were it to stop being
 *    sent, or to be sent unsigned, an evening east of UTC would land on the
 *    previous day of the trip and nothing would fail anywhere. The line would
 *    just be drawn on the wrong day, which is the whole reason the parameter
 *    exists. Hence two zones rather than one: a single European fixture cannot
 *    tell a negation from a magnitude.
 *  - **The failure reaches the caller intact.** `useDawarichConnection` and
 *    `useDawarichSuggestions` both translate `err.response.data.code` into the
 *    reader's language. A `.catch()` added anywhere in this file would turn
 *    every upstream failure into a silent success with an undefined body.
 *  - **An abort really cancels.** The track overlay issues a fresh request
 *    whenever the looked-at window changes and aborts the previous one; a call
 *    that resolved anyway would repaint the map with the older answer.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse, delay, type JsonBodyType } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import { dawarichApi, DAWARICH_ATLAS_TIMEOUT_MS, DAWARICH_UPSTREAM_TIMEOUT_MS } from './dawarich'
import apiClient from './client'
import type {
  DawarichAtlasSuggestions,
  DawarichBucketScan,
  DawarichConnection,
  DawarichSuggestion,
  DawarichSuggestionList,
  DawarichTrack,
} from '@trek/shared'

const BASE = '/api/integrations/dawarich'

let requestUrl = ''
let requestBody: unknown

/** Records the url and the parsed JSON body of the intercepted request, then answers with `data`. */
function record<T extends JsonBodyType>(data: T) {
  return async ({ request }: { request: Request }) => {
    requestUrl = request.url
    const text = await request.text()
    requestBody = text ? JSON.parse(text) : undefined
    return HttpResponse.json(data)
  }
}

function query(): URLSearchParams {
  return new URL(requestUrl).searchParams
}

const connection: DawarichConnection = {
  url: 'https://dawarich.example',
  apiKeyMasked: '••••••••',
  allowInsecureTls: false,
  syncEnabled: true,
  connected: true,
  lastSyncAt: '2026-09-13T21:00:00Z',
  lastSyncState: 'ok',
  lastSyncError: null,
  capabilities: null,
}

const suggestion: DawarichSuggestion = {
  id: 41,
  sourceVisitId: 'v-41',
  tripId: 7,
  tripTitle: 'Koeln',
  name: 'Cafe Reichard',
  lat: 50.94,
  lng: 6.96,
  startedAt: '2026-09-10T10:15:00+02:00',
  endedAt: '2026-09-10T12:40:00+02:00',
  durationMinutes: 145,
  localDate: '2026-09-10',
  sourceStatus: 'suggested',
  confidence: 82,
  confidenceBand: 'high',
  state: 'new',
  target: null,
  acceptedPlaceId: null,
  acceptedJournalEntryId: null,
  acceptedBucketListItemId: null,
  sourceChanged: false,
  sourceMissing: false,
  matchedBucketListItemId: null,
  matchedBucketListName: null,
  countryCode: 'DE',
  firstSeenAt: '2026-09-10T06:00:00Z',
  lastSeenAt: '2026-09-10T06:00:00Z',
}

const suggestionList: DawarichSuggestionList = {
  suggestions: [suggestion],
  connected: true,
  lastSyncAt: '2026-09-13T21:00:00Z',
  lastSyncState: 'ok',
  lastSyncError: null,
}

const track: DawarichTrack = {
  days: [{ date: '2026-09-10', segments: [] }],
  source: 'tracks',
  fetchedAt: '2026-09-13T21:05:00Z',
  pointCount: 0,
  truncated: false,
}

const bucketScan: DawarichBucketScan = {
  matches: [{ itemId: 3, name: 'Uluru', match: null, alreadyVisited: false }],
  skippedWithoutCoordinates: 1,
  truncated: false,
  fetchedAt: '2026-09-13T21:05:00Z',
}

const atlas: DawarichAtlasSuggestions = {
  countries: [{ countryCode: 'DE', sourceName: 'Germany', cities: [], alreadyVisited: false }],
  unresolved: ['Kosovo'],
  fetchedAt: '2026-09-13T21:05:00Z',
}

beforeEach(() => {
  requestUrl = ''
  requestBody = undefined
  // Berlin in summer. localOffsetMinutes() negates getTimezoneOffset(), so the
  // value on the wire is +120 (positive for a zone ahead of UTC), which is the
  // sign convention the server's day resolution expects.
  vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-120)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('dawarichApi connection', () => {
  it('FE-DAWARICH-API-001: getSettings() reads the connection card and unwraps the body', async () => {
    server.use(http.get(`${BASE}/settings`, record(connection)))

    const res = await dawarichApi.getSettings()

    expect(requestUrl).toContain(`${BASE}/settings`)
    expect(res).toEqual(connection)
  })

  // The three warning fields are why this endpoint does not just answer
  // `{ success }`: the server writes its sentence in English, the client renders
  // the code in the reader's language and quotes the resolved address back.
  // Dropping any of them leaves a private-IP connection looking perfectly healthy.
  it('FE-DAWARICH-API-002: saveSettings() puts the settings and keeps the warning triple', async () => {
    server.use(
      http.put(
        `${BASE}/settings`,
        record({
          success: true,
          warning: 'That host resolves to a private address.',
          warningCode: 'private_ip',
          warningIp: '192.168.178.72',
        }),
      ),
    )

    const res = await dawarichApi.saveSettings({
      url: 'https://dawarich.lan',
      apiKey: 'secret',
      allowInsecureTls: true,
      syncEnabled: false,
    })

    expect(requestBody).toEqual({
      url: 'https://dawarich.lan',
      apiKey: 'secret',
      allowInsecureTls: true,
      syncEnabled: false,
    })
    expect(res.warningCode).toBe('private_ip')
    expect(res.warningIp).toBe('192.168.178.72')
    expect(res.warning).toContain('private address')
  })

  it('FE-DAWARICH-API-003: disconnect() deletes the stored connection', async () => {
    server.use(http.delete(`${BASE}/settings`, record({ success: true })))

    expect(await dawarichApi.disconnect()).toEqual({ success: true })
    expect(requestUrl).toContain(`${BASE}/settings`)
  })

  // A probe runs before anything is stored, so the body is deliberately partial:
  // a url with no key is the shape the connect dialog sends on its first attempt.
  it('FE-DAWARICH-API-004: test() posts a partial settings body and returns the probe verdict', async () => {
    server.use(http.post(`${BASE}/test`, record({ connected: false, error: 'unauthorized' })))

    const res = await dawarichApi.test({ url: 'https://dawarich.example' })

    expect(requestBody).toEqual({ url: 'https://dawarich.example' })
    expect(res.connected).toBe(false)
    expect(res.error).toBe('unauthorized')
  })

  // `alreadyRunning` is how a second press of Sync Now is told apart from a sync
  // that genuinely found nothing; both report created/updated/missing as zero.
  it('FE-DAWARICH-API-005: syncNow() posts to the sync endpoint and passes alreadyRunning through', async () => {
    server.use(http.post(`${BASE}/sync`, record({ state: 'ok', created: 0, updated: 0, missing: 0, alreadyRunning: true })))

    const res = await dawarichApi.syncNow()

    expect(requestUrl).toContain(`${BASE}/sync`)
    expect(res.alreadyRunning).toBe(true)
  })
})

describe('dawarichApi suggestions', () => {
  it('FE-DAWARICH-API-006: listSuggestions() sends the filter as query params, and none when unfiltered', async () => {
    server.use(http.get(`${BASE}/suggestions`, record(suggestionList)))

    const res = await dawarichApi.listSuggestions({ tripId: 7, state: 'new' })
    expect(query().get('tripId')).toBe('7')
    expect(query().get('state')).toBe('new')
    expect(res.suggestions).toHaveLength(1)

    await dawarichApi.listSuggestions()
    expect(new URL(requestUrl).search).toBe('')
  })

  it('FE-DAWARICH-API-007: accept() posts the corrected stay to the suggestion it belongs to', async () => {
    server.use(
      http.post(
        `${BASE}/suggestions/:id/accept`,
        record({ suggestion, createdPlaceId: 900, createdJournalEntryId: null, bucketListItemId: null }),
      ),
    )

    const res = await dawarichApi.accept(41, { target: 'place', tripId: 7, dayId: 12, name: 'Cafe Reichard', time: '10:15' })

    expect(requestUrl).toContain(`${BASE}/suggestions/41/accept`)
    expect(requestBody).toEqual({ target: 'place', tripId: 7, dayId: 12, name: 'Cafe Reichard', time: '10:15' })
    expect(res.createdPlaceId).toBe(900)
  })

  it('FE-DAWARICH-API-008: setState() puts the new state on the suggestion', async () => {
    server.use(http.put(`${BASE}/suggestions/:id/state`, record({ ...suggestion, state: 'dismissed' })))

    const res = await dawarichApi.setState(41, 'dismissed')

    expect(requestUrl).toContain(`${BASE}/suggestions/41/state`)
    expect(requestBody).toEqual({ state: 'dismissed' })
    expect(res.state).toBe('dismissed')
  })
})

describe('dawarichApi bucket list', () => {
  it('FE-DAWARICH-API-009: scanBucketList() posts to the scan endpoint', async () => {
    server.use(http.post(`${BASE}/bucket-list/scan`, record(bucketScan)))

    const res = await dawarichApi.scanBucketList()

    expect(requestUrl).toContain(`${BASE}/bucket-list/scan`)
    expect(res.skippedWithoutCoordinates).toBe(1)
  })

  // `visitedAt` is optional because the default is "whenever the recording says",
  // which only the server knows. An omitted one must not turn into a null on the
  // wire, which the server would read as an instruction to store no date at all.
  it('FE-DAWARICH-API-010: confirmBucketVisits() sends visitedAt only when the caller supplied one', async () => {
    server.use(http.post(`${BASE}/bucket-list/confirm`, record({ updated: 2 })))

    const res = await dawarichApi.confirmBucketVisits([3, 4], '2026-09-10T10:15:00Z')
    expect(requestBody).toEqual({ itemIds: [3, 4], visitedAt: '2026-09-10T10:15:00Z' })
    expect(res.updated).toBe(2)

    await dawarichApi.confirmBucketVisits([3])
    expect(requestBody).toEqual({ itemIds: [3] })
  })

  it('FE-DAWARICH-API-011: clearBucketVisit() deletes the visit off one entry', async () => {
    server.use(http.delete(`${BASE}/bucket-list/:id/visit`, record({ success: true })))

    expect(await dawarichApi.clearBucketVisit(3)).toEqual({ success: true })
    expect(requestUrl).toContain(`${BASE}/bucket-list/3/visit`)
  })
})

describe('dawarichApi atlas', () => {
  it('FE-DAWARICH-API-012: atlasSuggestions() sends the window as from/to', async () => {
    server.use(http.get(`${BASE}/atlas/suggestions`, record(atlas)))

    const res = await dawarichApi.atlasSuggestions('2026-01-01', '2026-12-31')

    expect(query().get('from')).toBe('2026-01-01')
    expect(query().get('to')).toBe('2026-12-31')
    expect(res.unresolved).toEqual(['Kosovo'])
  })

  it('FE-DAWARICH-API-013: acceptAtlasCountries() posts the codes the user ticked', async () => {
    server.use(http.post(`${BASE}/atlas/accept`, record({ marked: 2 })))

    const res = await dawarichApi.acceptAtlasCountries(['DE', 'NL'])

    expect(requestBody).toEqual({ countryCodes: ['DE', 'NL'] })
    expect(res.marked).toBe(2)
  })
})

describe('dawarichApi track overlay', () => {
  it('FE-DAWARICH-API-014: tripTrack() sends the range plus the reader\'s own UTC offset', async () => {
    server.use(http.get(`${BASE}/trips/:id/track`, record(track)))

    const res = await dawarichApi.tripTrack(7, { from: '2026-09-10', to: '2026-09-12' })

    expect(new URL(requestUrl).pathname).toBe(`${BASE}/trips/7/track`)
    expect(query().get('from')).toBe('2026-09-10')
    expect(query().get('to')).toBe('2026-09-12')
    expect(query().get('offset')).toBe('120')
    expect(res.source).toBe('tracks')
  })

  // The whole-trip case passes no range at all. The offset still has to be there:
  // without it the server has to guess a day boundary for every recorded instant.
  it('FE-DAWARICH-API-015: tripTrack() without a range still sends the offset and nothing else', async () => {
    server.use(http.get(`${BASE}/trips/:id/track`, record(track)))

    await dawarichApi.tripTrack(7)

    expect([...query().keys()]).toEqual(['offset'])
    expect(query().get('offset')).toBe('120')
  })

  it('FE-DAWARICH-API-016: windowTrack() sends from, to and the offset to the window endpoint', async () => {
    server.use(http.get(`${BASE}/track`, record(track)))

    const res = await dawarichApi.windowTrack('2026-09-10', '2026-09-12')

    expect(new URL(requestUrl).pathname).toBe(`${BASE}/track`)
    expect(query().get('from')).toBe('2026-09-10')
    expect(query().get('to')).toBe('2026-09-12')
    expect(query().get('offset')).toBe('120')
    expect(res.pointCount).toBe(0)
  })

  // The health handler is here because the axios error interceptor probes
  // reachability whenever an error carries no response, and a cancellation is
  // exactly that. Answering the probe keeps the detour short; whichever verdict
  // it comes back with, the cancellation has to be re-rejected untouched, and
  // that is what this pins.
  it('FE-DAWARICH-API-017: an aborted windowTrack rejects as a cancellation, not as a result', async () => {
    server.use(
      http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
      http.get(`${BASE}/track`, async () => {
        await delay(50)
        return HttpResponse.json(track)
      }),
    )

    const ctrl = new AbortController()
    const pending = dawarichApi.windowTrack('2026-09-10', '2026-09-12', ctrl.signal)
    ctrl.abort()

    await expect(pending).rejects.toMatchObject({ code: 'ERR_CANCELED' })
  })

  // Nothing in this file catches, on purpose: the connection card and the
  // suggestions hook both read the upstream reason off `response.data.code` to
  // say it in the reader's language. A swallowed rejection would reach them as a
  // successful call carrying an undefined body.
  it('FE-DAWARICH-API-018: a 502 rejects with the upstream reason code intact', async () => {
    server.use(
      http.get(`${BASE}/suggestions`, () =>
        HttpResponse.json({ error: 'Dawarich is unreachable', code: 'unreachable' }, { status: 502 }),
      ),
    )

    await expect(dawarichApi.listSuggestions()).rejects.toMatchObject({
      response: { status: 502, data: { code: 'unreachable' } },
    })
  })

  // Every other test here runs in Berlin, where -120 negated and -120 made
  // positive look identical. New York separates them: the platform reports +300
  // and the wire has to carry -300. A `Math.abs` slipped in would leave every
  // European install working perfectly and put every American one a day out,
  // which is the kind of bug that gets reported as "sometimes wrong".
  //
  // UTC is the second half of the pair: the offset there is falsy, and a guard
  // that only sends it "when there is one" would drop it exactly for the readers
  // whose day boundary the server would then have to guess.
  it('FE-DAWARICH-API-019: the offset is the negation of getTimezoneOffset, not its magnitude', async () => {
    server.use(http.get(`${BASE}/track`, record(track)))

    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(300)
    await dawarichApi.windowTrack('2026-09-10', '2026-09-12')
    expect(query().get('offset')).toBe('-300')

    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(0)
    await dawarichApi.windowTrack('2026-09-10', '2026-09-12')
    expect(query().get('offset')).toBe('0')
  })
})

describe('dawarichApi: how long the browser waits', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-DAWARICH-API-040: every call that makes the server ask Dawarich outlasts the shared 8 s', async () => {
    // The server gives each request to Dawarich 15 s on its own. At the shared
    // 8 s the browser gave up first, the server cached the answer anyway, and the
    // recorded route turned up only after a reload.
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: {} })
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} })
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: {} })

    await dawarichApi.tripTrack(7)
    await dawarichApi.windowTrack('2026-09-01T00:00:00Z', '2026-09-02T00:00:00Z')
    await dawarichApi.test({ url: 'https://dawarich.example' })
    await dawarichApi.syncNow()
    await dawarichApi.scanBucketList()
    await dawarichApi.saveSettings({ url: 'https://dawarich.example', allowInsecureTls: false, syncEnabled: true })

    const configs = [
      ...get.mock.calls.map(call => call[1]),
      ...post.mock.calls.map(call => call[2]),
      ...put.mock.calls.map(call => call[2]),
    ]
    expect(configs).toHaveLength(6)
    for (const config of configs) {
      expect(config).toEqual(expect.objectContaining({ timeout: DAWARICH_UPSTREAM_TIMEOUT_MS }))
    }
    expect(DAWARICH_UPSTREAM_TIMEOUT_MS).toBeGreaterThan(15_000)
    // The track calls still carry their offset alongside the longer wait.
    expect(get.mock.calls[0][1]).toEqual(expect.objectContaining({ params: expect.objectContaining({ offset: expect.any(Number) }) }))
  })

  it('FE-DAWARICH-API-041: the Atlas waits longest, and the purely local calls keep the shared default', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: {} })
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} })

    await dawarichApi.atlasSuggestions('2025-09-14T00:00:00Z', '2026-09-14T00:00:00Z')
    expect(get.mock.calls[0][1]).toEqual(expect.objectContaining({ timeout: DAWARICH_ATLAS_TIMEOUT_MS }))
    expect(DAWARICH_ATLAS_TIMEOUT_MS).toBeGreaterThan(DAWARICH_UPSTREAM_TIMEOUT_MS)

    // Reading suggestions and confirming countries touch TREK's own database
    // only; a two-minute wait there would just hide a stuck server.
    await dawarichApi.listSuggestions()
    await dawarichApi.acceptAtlasCountries(['DE'])
    expect(get.mock.calls[1][1]).not.toEqual(expect.objectContaining({ timeout: expect.anything() }))
    expect(post.mock.calls[0][2]).toBeUndefined()
  })
})
