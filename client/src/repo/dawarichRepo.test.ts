/**
 * FE-DAWARICH-API-020 to FE-DAWARICH-API-028
 *
 * `dawarichRepo` is the seam the rest of the client is supposed to read
 * Dawarich through, and it is deliberately the odd one out in this directory:
 * no Dexie table, no read-through cache, nothing written to the device. That
 * decision is the integration's privacy promise in code form (a cached copy of
 * somebody's GPS archive is the exact thing this feature exists not to keep),
 * and it is invisible in a type. Only a test can hold it.
 *
 * So what is pinned here is the two guarantees the seam actually makes:
 *
 *  - **Nothing leaves the device while it is offline.** `requireOnline()` throws
 *    BEFORE a request is built, and it asks `isEffectivelyOffline()` rather than
 *    `navigator.onLine`, so the manual Offline switch counts as well. Someone
 *    who flipped that switch before a flight has said they do not want requests
 *    fired; firing them anyway would hang the panel on an eight-second axios
 *    timeout for every one of the five reads. The forced-offline case therefore
 *    gets its own test, because it is the half that a naive `navigator.onLine`
 *    rewrite would silently drop.
 *  - **A response is parsed, not cast.** The upstream here is a server TREK does
 *    not own, running a version nobody controls. An answer that does not match
 *    the contract has to fail at this line, naming the field, instead of
 *    arriving three components later as an undefined that renders as blank.
 *  - **Nothing is remembered between reads.** Every other repo in this directory
 *    reads through a cache, so adding one here is the natural-looking change,
 *    and it is the one thing this repo must never do. A second read therefore
 *    has to reach the server again.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import { dawarichRepo, DawarichOfflineError } from './dawarichRepo'
import { setForcedOffline, _resetNetworkMode } from '../sync/networkMode'
import type {
  DawarichAtlasSuggestions,
  DawarichBucketScan,
  DawarichSuggestion,
  DawarichSuggestionList,
  DawarichTrack,
} from '@trek/shared'

const BASE = '/api/integrations/dawarich'

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true })
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
  lastSyncState: 'partial',
  lastSyncError: 'rate_limited',
}

const track: DawarichTrack = {
  days: [
    {
      date: '2026-09-10',
      segments: [
        {
          points: [
            [50.94, 6.96],
            [50.95, 6.97],
          ],
          mode: 'walking',
          startedAt: '2026-09-10T10:15:00+02:00',
          endedAt: '2026-09-10T10:40:00+02:00',
          distanceMeters: 1200,
        },
      ],
    },
  ],
  source: 'tracks',
  fetchedAt: '2026-09-13T21:05:00Z',
  pointCount: 2,
  truncated: false,
}

const bucketScan: DawarichBucketScan = {
  matches: [
    { itemId: 3, name: 'Uluru', match: { at: '2026-04-02T08:00:00Z', minutes: 95, distanceMeters: 120, points: 41 }, alreadyVisited: false },
    { itemId: 4, name: 'Machu Picchu', match: null, alreadyVisited: true },
  ],
  skippedWithoutCoordinates: 1,
  truncated: true,
  fetchedAt: '2026-09-13T21:05:00Z',
}

const atlas: DawarichAtlasSuggestions = {
  countries: [
    {
      countryCode: 'DE',
      sourceName: 'Germany',
      cities: [{ name: 'Koeln', minutes: 4200, lastSeenAt: '2026-09-12T18:00:00Z' }],
      alreadyVisited: false,
    },
  ],
  unresolved: ['Kosovo'],
  fetchedAt: '2026-09-13T21:05:00Z',
}

beforeEach(() => {
  setOnline(true)
  _resetNetworkMode()
})

afterEach(() => {
  _resetNetworkMode()
  setOnline(true)
})

describe('dawarichRepo online reads', () => {
  it('FE-DAWARICH-API-020: suggestions() parses the list and keeps the provenance fields', async () => {
    let seen = ''
    server.use(
      http.get(`${BASE}/suggestions`, ({ request }) => {
        seen = request.url
        return HttpResponse.json(suggestionList)
      }),
    )

    const res = await dawarichRepo.suggestions({ tripId: 7, state: 'new' })

    expect(new URL(seen).searchParams.get('tripId')).toBe('7')
    expect(res.suggestions.map(s => s.id)).toEqual([41])
    // The panel shows "last sync failed" from these, so they have to survive the
    // parse rather than being trimmed off as extras.
    expect(res.lastSyncState).toBe('partial')
    expect(res.lastSyncError).toBe('rate_limited')
  })

  it('FE-DAWARICH-API-021: tripTrack() forwards the range and returns the parsed segments', async () => {
    let seen = ''
    server.use(
      http.get(`${BASE}/trips/:id/track`, ({ request }) => {
        seen = request.url
        return HttpResponse.json(track)
      }),
    )

    const res = await dawarichRepo.tripTrack(7, { from: '2026-09-10', to: '2026-09-12' }, new AbortController().signal)

    expect(new URL(seen).pathname).toBe(`${BASE}/trips/7/track`)
    expect(new URL(seen).searchParams.get('from')).toBe('2026-09-10')
    expect(res.days[0]!.segments[0]!.points).toEqual([
      [50.94, 6.96],
      [50.95, 6.97],
    ])
  })

  it('FE-DAWARICH-API-022: windowTrack() parses a track for a bare date window', async () => {
    server.use(http.get(`${BASE}/track`, () => HttpResponse.json({ ...track, source: 'points', truncated: true })))

    const res = await dawarichRepo.windowTrack('2026-09-10', '2026-09-12')

    // `points` is the fallback source and `truncated` says the line is
    // incomplete; both are shown to the user, so neither may be normalised away.
    expect(res.source).toBe('points')
    expect(res.truncated).toBe(true)
  })

  it('FE-DAWARICH-API-023: bucketScan() parses matched and unmatched wishes alike', async () => {
    server.use(http.post(`${BASE}/bucket-list/scan`, () => HttpResponse.json(bucketScan)))

    const res = await dawarichRepo.bucketScan()

    expect(res.matches.map(m => m.match?.minutes ?? null)).toEqual([95, null])
    expect(res.skippedWithoutCoordinates).toBe(1)
    expect(res.truncated).toBe(true)
  })

  it('FE-DAWARICH-API-024: atlasSuggestions() parses the countries and names the unresolved ones', async () => {
    server.use(http.get(`${BASE}/atlas/suggestions`, () => HttpResponse.json(atlas)))

    const res = await dawarichRepo.atlasSuggestions('2026-01-01', '2026-12-31')

    expect(res.countries[0]!.cities[0]!.lastSeenAt).toBe('2026-09-12T18:00:00Z')
    expect(res.unresolved).toEqual(['Kosovo'])
  })
})

describe('dawarichRepo offline refusal', () => {
  /** Every read on the repo, so a sixth one added without the guard shows up as an omission here. */
  const reads: Array<[string, () => Promise<unknown>]> = [
    ['suggestions', () => dawarichRepo.suggestions()],
    ['tripTrack', () => dawarichRepo.tripTrack(7)],
    ['windowTrack', () => dawarichRepo.windowTrack('2026-09-10', '2026-09-12')],
    ['bucketScan', () => dawarichRepo.bucketScan()],
    ['atlasSuggestions', () => dawarichRepo.atlasSuggestions('2026-01-01', '2026-12-31')],
  ]

  it('FE-DAWARICH-API-025: a disconnected browser refuses all five reads before any request is built', async () => {
    let reached = false
    server.use(http.all(`${BASE}/*`, () => {
      reached = true
      return HttpResponse.json({})
    }))
    setOnline(false)

    for (const [name, run] of reads) {
      await expect(run(), name).rejects.toBeInstanceOf(DawarichOfflineError)
    }

    expect(reached).toBe(false)
  })

  // The manual switch is the half a `navigator.onLine` rewrite would lose: the
  // browser is perfectly online here and the reads still have to refuse, because
  // the user said so before boarding.
  it('FE-DAWARICH-API-026: the manual offline switch refuses just as hard, with the browser online', async () => {
    let reached = false
    server.use(http.all(`${BASE}/*`, () => {
      reached = true
      return HttpResponse.json({})
    }))
    setOnline(true)
    setForcedOffline(true)

    for (const [name, run] of reads) {
      await expect(run(), name).rejects.toBeInstanceOf(DawarichOfflineError)
    }

    expect(reached).toBe(false)

    const err = await dawarichRepo.suggestions().catch((e: unknown) => e)
    expect((err as Error).name).toBe('DawarichOfflineError')
    expect((err as Error).message).toBe('Dawarich needs a connection')
  })
})

describe('dawarichRepo contract enforcement', () => {
  // `source` is an enum of exactly two values. An instance answering a third
  // must fail here, naming the field, rather than reaching the overlay as an
  // unknown string that quietly draws nothing.
  it('FE-DAWARICH-API-027: an answer that does not match the contract fails in the repo, naming the field', async () => {
    server.use(http.get(`${BASE}/track`, () => HttpResponse.json({ ...track, source: 'guesswork' })))

    const err = await dawarichRepo.windowTrack('2026-09-10', '2026-09-12').catch((e: unknown) => e)

    expect(err).toBeInstanceOf(Error)
    expect((err as { issues?: Array<{ path: Array<string | number> }> }).issues?.[0]?.path).toEqual(['source'])
  })

  // The no-cache promise, stated at the seam that would have to break it. Every
  // sibling repo in this directory answers a repeat read from Dexie, so a cache
  // here would look like consistency rather than like a regression, and it
  // would mean a copy of somebody's movements outliving the panel that asked
  // for it. Two identical reads, two requests.
  it('FE-DAWARICH-API-028: a repeated read asks the server again instead of replaying an answer', async () => {
    let calls = 0
    server.use(
      http.get(`${BASE}/track`, () => {
        calls += 1
        return HttpResponse.json(track)
      }),
    )

    await dawarichRepo.windowTrack('2026-09-10', '2026-09-12')
    await dawarichRepo.windowTrack('2026-09-10', '2026-09-12')

    expect(calls).toBe(2)
  })
})
