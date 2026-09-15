/**
 * FE-DAWARICH-JTRAIL-001 to FE-DAWARICH-JTRAIL-013: the recorded route a
 * journal draws over its own dates (#2279).
 *
 * This hook is the one place a journal reaches across the network to somebody's
 * self-hosted location history, and almost everything worth pinning about it is
 * a thing that must NOT happen.
 *
 * The gate first. Three separate switches have to agree before a single request
 * leaves the browser (the journal's own "show trip tracks" preference, the
 * Dawarich addon being enabled on the instance, and the journal actually
 * covering some dates), and each of them is a promise to the user: a journal
 * whose tracks are switched off must not go and fetch a GPS archive anyway.
 * They are `&&`-chained, so a regression in any one of them looks identical on
 * screen (nothing is drawn) while the request goes out regardless. Only the
 * absence of the call catches that, which is why the first three cases assert
 * on `windowTrack` never having been called rather than on what was rendered.
 *
 * Then the window. A `Set` has no order and a journal's dates are accumulated
 * from several trips, so the earliest and latest day are found by sorting, not
 * by trusting insertion order. Get that wrong and the fetched span is some
 * arbitrary pair of days out of the middle of the journey.
 *
 * Then the shape. The overlay rides the journey map's existing `JourneyTrack[]`
 * layer, which keys its polylines on `place_id`. The synthetic ids are negative
 * precisely so they can never collide with a real place's. A collision would
 * make the map drop or duplicate a line rather than fail loudly.
 *
 * Finally the four endings, because the journal map has no other way to say
 * what happened: a route, nothing recorded, the instance not answering, and the
 * device being offline. The last one is checked twice, before the request and
 * again when it fails, so a connection that dies mid-flight is reported as
 * "offline" rather than blamed on the user's Dawarich instance.
 *
 * The late-answer cases exist because this hook lives on a page the user leaves
 * and a switch they flip: an in-flight request that lands after the layer has
 * been switched off must not paint a line onto a map that no longer wants one.
 *
 * That switch going off after a route is already drawn is its own case. The
 * line has to leave the map with it rather than linger until something else
 * happens to clear it, and turning it back on has to ask again rather than
 * replay a recording that may have grown in the meantime. This hook keeps no
 * cache, deliberately, because a cached copy of somebody's location history is
 * the thing the integration exists not to keep.
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DawarichTrack, DawarichTrackDay } from '@trek/shared'

const { windowTrack, offline } = vi.hoisted(() => ({ windowTrack: vi.fn(), offline: vi.fn() }))
vi.mock('../repo/dawarichRepo', () => ({ dawarichRepo: { windowTrack } }))
// Only `isEffectivelyOffline` is swapped out. `addonStore` reaches `api/client`,
// which imports from this module as well, and a factory that named a single
// export would hand every other importer in the graph `undefined`.
vi.mock('../sync/networkMode', async importOriginal => ({
  ...(await importOriginal<typeof import('../sync/networkMode')>()),
  isEffectivelyOffline: offline,
}))

import { useAddonStore } from '../store/addonStore'
import { DAWARICH_DAY_COLORS } from '../components/Map/dawarichTrail'
import { useDawarichJournalTrail } from './useDawarichJournalTrail'

const DAY_ONE = '2026-03-03'
const DAY_TWO = '2026-03-04'
const DAY_THREE = '2026-03-05'

const FETCHED_AT = '2026-03-06T09:12:00.000Z'

const journalDates = (...days: string[]) => new Set(days)

function segment(points: Array<[number, number]>) {
  return {
    points,
    mode: 'walking',
    startedAt: `${DAY_ONE}T08:00:00Z`,
    endedAt: `${DAY_ONE}T09:00:00Z`,
    distanceMeters: 1200,
  }
}

/** One recorded day with a single two-point line: the smallest thing that draws. */
const day = (date: string, points: Array<[number, number]> = [[53.5, 10.0], [53.6, 10.1]]): DawarichTrackDay =>
  ({ date, segments: [segment(points)] })

function track(over: Partial<DawarichTrack> = {}): DawarichTrack {
  return { days: [], source: 'tracks', fetchedAt: FETCHED_AT, pointCount: 0, truncated: false, ...over }
}

/**
 * A request left hanging, so the world can change underneath it: the dates
 * edited, the layer switched off, the network lost. None of that is observable
 * against a promise that has already resolved.
 */
function held() {
  let settle!: (value: DawarichTrack) => void
  let fail!: (reason: Error) => void
  const promise = new Promise<DawarichTrack>((resolve, reject) => { settle = resolve; fail = reject })
  return { promise, settle, fail }
}

/**
 * Land a held request and let the hook's whole `.then`/`.catch` chain run
 * before anything is asserted. Two ticks, because a rejection travels through
 * the `.then` that has no rejection handler before it reaches the `.catch`.
 *
 * Worth being exact about: the late-answer cases assert that nothing changed,
 * so a chain that had not run yet would pass them for the wrong reason and
 * never reach the `cancelled` guard they exist to pin.
 */
const settleAndFlush = (fire: () => void) =>
  act(async () => {
    fire()
    await Promise.resolve()
    await Promise.resolve()
  })

const spanOf = (call: unknown[]) => ({ from: call[0] as string, to: call[1] as string })
const signalOf = (call: unknown[]) => call[2] as AbortSignal

const render = (initialProps: { dates: Set<string>; enabled: boolean }) =>
  renderHook(({ dates, enabled }) => useDawarichJournalTrail(dates, enabled), { initialProps })

beforeEach(() => {
  windowTrack.mockReset().mockResolvedValue(track())
  offline.mockReset().mockReturnValue(false)
  useAddonStore.setState({
    addons: [{ id: 'dawarich', name: 'Dawarich', type: 'integration', icon: 'Route', enabled: true }],
    loaded: true,
  })
})

describe('useDawarichJournalTrail', () => {
  it('FE-DAWARICH-JTRAIL-001: asks nothing on an instance where the addon is switched off', () => {
    useAddonStore.setState({ addons: [] })

    const set = journalDates(DAY_ONE, DAY_TWO)
    const { result, rerender } = render({ dates: set, enabled: true })

    // The addon being off is an instance-wide "do not talk to Dawarich". A
    // journal that fetched anyway would keep hitting a server the admin has
    // disconnected, and nothing on screen would show it.
    expect(windowTrack).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')
    expect(result.current.tracks).toHaveLength(0)
    expect(result.current.fetchedAt).toBeNull()

    // The empty result is one shared array, not a fresh literal per pass: the
    // journey map memoises on `tracks`, so a new identity every render would
    // rebuild every polyline on the map for nothing.
    const first = result.current.tracks
    rerender({ dates: set, enabled: false })
    expect(result.current.tracks).toBe(first)
  })

  it('FE-DAWARICH-JTRAIL-002: asks nothing while the journal has its track layer switched off', async () => {
    const set = journalDates(DAY_ONE, DAY_TWO)
    const { result, rerender } = render({ dates: set, enabled: false })

    // `show_trip_tracks` gates the REQUEST, not just the drawing. Fetching and
    // then hiding would send the journal's whole date range to Dawarich on
    // behalf of somebody who asked for no tracks at all.
    expect(windowTrack).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')

    rerender({ dates: set, enabled: true })
    await waitFor(() => expect(windowTrack).toHaveBeenCalledTimes(1))
  })

  it('FE-DAWARICH-JTRAIL-003: a journal with no dated trips has no window to ask about', () => {
    // Entries whose trips carry no start/end date contribute nothing to the
    // set. With an empty set there are no bounds to build a window from, and
    // sending one anyway would mean sending `undefined` as a timestamp.
    const { result } = render({ dates: journalDates(), enabled: true })

    expect(windowTrack).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')
    expect(result.current.tracks).toHaveLength(0)
    expect(result.current.fetchedAt).toBeNull()
  })

  it('FE-DAWARICH-JTRAIL-004: spans earliest to latest day whatever order the dates arrived in', async () => {
    // The dates come out of several trips in whatever order those trips are
    // listed, so the set is deliberately built back to front here. Trusting
    // insertion order would fetch the 5th to the 3rd: a backwards window, which
    // comes back empty rather than failing.
    const { result } = render({ dates: journalDates(DAY_THREE, DAY_ONE, DAY_TWO), enabled: true })

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))

    // Whole-day bounds in UTC: a window that started at the moment of the fetch
    // would silently drop the morning of the first day.
    expect(spanOf(windowTrack.mock.calls[0])).toEqual({
      from: `${DAY_ONE}T00:00:00Z`,
      to: `${DAY_THREE}T23:59:59Z`,
    })
    expect(signalOf(windowTrack.mock.calls[0])).toBeInstanceOf(AbortSignal)
    expect(signalOf(windowTrack.mock.calls[0]).aborted).toBe(false)
  })

  it('FE-DAWARICH-JTRAIL-005: turns each drawable segment into one journey track the map cannot confuse with a place', async () => {
    windowTrack.mockResolvedValue(track({
      days: [
        {
          date: DAY_ONE,
          segments: [
            segment([[53.5, 10.0], [53.6, 10.1]]),
            // A single fix is not a line. It has to disappear here rather than
            // reach the renderer, which would draw a zero-length polyline.
            segment([[53.7, 10.2]]),
          ],
        },
        day(DAY_TWO, [[48.1, 11.5], [48.2, 11.6], [48.3, 11.7]]),
      ],
      pointCount: 6,
    }))

    const { result } = render({ dates: journalDates(DAY_ONE, DAY_TWO), enabled: true })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(result.current.tracks).toEqual([
      {
        place_id: -1,
        trip_id: 0,
        name: DAY_ONE,
        color: DAWARICH_DAY_COLORS[0],
        points: [[53.5, 10.0], [53.6, 10.1]],
      },
      {
        place_id: -2,
        trip_id: 0,
        name: DAY_TWO,
        // Per-day hues, so "we were here on Tuesday" is readable; a second day
        // in the first day's colour would read as one continuous recording.
        color: DAWARICH_DAY_COLORS[1],
        points: [[48.1, 11.5], [48.2, 11.6], [48.3, 11.7]],
      },
    ])
    // The journey map keys its polylines on place_id. Real places are positive,
    // so negative-and-distinct is what keeps a recorded line from evicting the
    // GPX track of an actual place.
    const ids = result.current.tracks.map(t => t.place_id)
    expect(ids.every(id => id < 0)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)

    expect(result.current.fetchedAt).toBe(FETCHED_AT)
  })

  it('FE-DAWARICH-JTRAIL-006: a window with nothing recorded is an answer, not a failure', async () => {
    // Somebody who was not carrying a phone that week gets an empty track back,
    // and that is a perfectly good reply. Treating it as unavailable would
    // accuse their Dawarich instance of being broken.
    windowTrack.mockResolvedValue(track({ days: [] }))

    const { result } = render({ dates: journalDates(DAY_ONE), enabled: true })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(result.current.tracks).toHaveLength(0)
    expect(result.current.fetchedAt).toBe(FETCHED_AT)
  })

  it('FE-DAWARICH-JTRAIL-007: an instance that does not answer leaves the journal without a line and says so', async () => {
    // Anything the repo throws lands here: a 502 from the proxy, a body that
    // does not parse against the shared schema, a missing API key. None of them
    // is the journal's fault and none may leave a half-drawn route.
    windowTrack.mockRejectedValue(new Error('502 from the Dawarich instance'))

    const { result } = render({ dates: journalDates(DAY_ONE, DAY_TWO), enabled: true })
    await waitFor(() => expect(result.current.status).toBe('unavailable'))

    expect(result.current.tracks).toHaveLength(0)
  })

  it('FE-DAWARICH-JTRAIL-008: a connection that dies mid-flight is reported as offline, not as a broken instance', async () => {
    // The device is online when the request leaves and gone by the time it
    // fails. The flag is flipped while the request is held in the air, rather
    // than queued per call, so the case says what it means and does not depend
    // on how many times the hook happens to consult it. Blaming the instance
    // here would send the user reading server logs over a dropped wifi.
    const inFlight = held()
    windowTrack.mockImplementationOnce(() => inFlight.promise)

    const { result } = render({ dates: journalDates(DAY_ONE), enabled: true })
    expect(result.current.status).toBe('loading')

    offline.mockReturnValue(true)
    await settleAndFlush(() => inFlight.fail(new Error('network error')))

    expect(result.current.status).toBe('offline')
    expect(windowTrack).toHaveBeenCalledTimes(1)
    expect(result.current.tracks).toHaveLength(0)
  })

  it('FE-DAWARICH-JTRAIL-009: a device already offline is not made to wait for a timeout', () => {
    // `isEffectivelyOffline()` includes the manual switch, so this is also the
    // person who turned offline mode on before a flight. Firing the request
    // anyway would block the journal map until the request timed out, for an
    // answer that cannot arrive.
    offline.mockReturnValue(true)

    const { result } = render({ dates: journalDates(DAY_ONE, DAY_THREE), enabled: true })

    expect(windowTrack).not.toHaveBeenCalled()
    expect(result.current.status).toBe('offline')
    expect(result.current.tracks).toHaveLength(0)
  })

  it('FE-DAWARICH-JTRAIL-010: a journal whose dates change abandons the answer to the old span', async () => {
    const first = held()
    windowTrack.mockImplementationOnce(() => first.promise)

    const { result, rerender } = render({ dates: journalDates(DAY_ONE), enabled: true })
    expect(result.current.status).toBe('loading')

    windowTrack.mockResolvedValueOnce(track({ days: [day(DAY_THREE)] }))
    rerender({ dates: journalDates(DAY_THREE), enabled: true })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(spanOf(windowTrack.mock.calls[1]).from).toBe(`${DAY_THREE}T00:00:00Z`)
    // The first request is cancelled at the wire, not merely ignored: a journal
    // being edited would otherwise pile up requests against somebody's own
    // server, each one a full location-history query.
    expect(signalOf(windowTrack.mock.calls[0]).aborted).toBe(true)

    // The abandoned request answers late, the way a slow one does. Landing it
    // now would draw the old span's route under the new dates.
    await settleAndFlush(() => first.settle(track({ days: [day(DAY_ONE)] })))

    expect(result.current.tracks.map(t => t.name)).toEqual([DAY_THREE])
  })

  it('FE-DAWARICH-JTRAIL-011: an answer that arrives after the layer was switched off is dropped', async () => {
    const pending = held()
    windowTrack.mockImplementationOnce(() => pending.promise)

    const set = journalDates(DAY_ONE)
    const { result, rerender } = render({ dates: set, enabled: true })
    expect(result.current.status).toBe('loading')

    rerender({ dates: set, enabled: false })
    expect(result.current.status).toBe('idle')

    // Switching the layer off is an instruction about the map, and a request
    // that was already in the air must not undo it a second later.
    await settleAndFlush(() => pending.settle(track({ days: [day(DAY_ONE)] })))

    expect(result.current.status).toBe('idle')
    expect(result.current.tracks).toHaveLength(0)
  })

  it('FE-DAWARICH-JTRAIL-012: a failure that arrives after the layer was switched off stays silent', async () => {
    const pending = held()
    windowTrack.mockImplementationOnce(() => pending.promise)

    const set = journalDates(DAY_ONE, DAY_TWO)
    const { result, rerender } = render({ dates: set, enabled: true })
    expect(result.current.status).toBe('loading')

    rerender({ dates: set, enabled: false })

    // The mirror of the case above: a late failure would put the layer into
    // `unavailable` while it is switched off, which is a complaint about a
    // request nobody is waiting for any more.
    await settleAndFlush(() => pending.fail(new Error('too late to matter')))

    expect(result.current.status).toBe('idle')
    expect(result.current.tracks).toHaveLength(0)
  })

  it('FE-DAWARICH-JTRAIL-013: a route already drawn leaves the map with the switch, and is asked for again when it comes back', async () => {
    windowTrack.mockResolvedValue(track({ days: [day(DAY_ONE)], pointCount: 2 }))

    const set = journalDates(DAY_ONE, DAY_TWO)
    const { result, rerender } = render({ dates: set, enabled: true })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.tracks).toHaveLength(1)

    // Switching off has to withdraw the line that is already on screen, not
    // merely stop the next fetch: a hook that kept handing out the last answer
    // would leave somebody's recorded route drawn over a journal that asked for
    // it to be hidden, and nothing would clear it until the page was reloaded.
    rerender({ dates: set, enabled: false })
    expect(result.current.status).toBe('idle')
    expect(result.current.tracks).toHaveLength(0)

    rerender({ dates: set, enabled: true })
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))

    // Asked again rather than replayed. Nothing here is cached by design, and
    // the recording may well have grown while the layer was off.
    expect(windowTrack).toHaveBeenCalledTimes(2)
    expect(result.current.tracks).toHaveLength(1)
  })
})
