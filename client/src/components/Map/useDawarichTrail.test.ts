/**
 * useDawarichTrail unit tests: FE-DAWARICH-TRAIL-009 to FE-DAWARICH-TRAIL-024
 * (the numbering continues the one in `dawarichTrail.test.ts`, so a grep for
 * FE-DAWARICH-TRAIL finds the whole overlay in one list).
 *
 * This hook is the only fetcher for the recorded route. It is called once in
 * `MapViewAuto` and the answer is handed to both renderers as a prop, so a bug
 * here is not a rendering glitch. It is either a request storm against a
 * server the user pays for and runs themselves, or a line on the map that is
 * telling them about a different moment than the one they are looking at.
 *
 * What is pinned, and why each one matters:
 *
 *  - **the gate.** `enabled && tripId && the addon is on`: three separate ways
 *    to be switched off, and the hook must reach the network for none of them.
 *    The addon check is the one a reviewer forgets, and forgetting it means an
 *    instance with Dawarich turned off still hammers `/api/dawarich/...` every
 *    two minutes.
 *  - **the offline contract.** `isEffectivelyOffline()` and not
 *    `navigator.onLine`, so the manual switch someone flipped before a flight
 *    is honoured; a request fired anyway blocks on a timeout instead of
 *    failing, and that is the case the user cannot see.
 *  - **staleness is said, never faked.** A refresh keeps the previous line on
 *    screen and only moves the status, because blanking the map makes a routine
 *    two-minute poll look like the recording was deleted. A failure keeps the
 *    line too, and says `unavailable`.
 *  - **nothing that arrives late is allowed to paint.** Three ways a response
 *    can be obsolete by the time it lands (the layer was switched off, the
 *    device went offline, a newer request superseded it), and all three have to
 *    end in the answer being dropped rather than drawn over a newer truth.
 *  - **the timer is torn down with the hook.** An interval that outlives the
 *    map is an unattributable request every two minutes, for the rest of the
 *    session.
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DawarichTrack } from '@trek/shared'

const { tripTrack } = vi.hoisted(() => ({ tripTrack: vi.fn() }))
vi.mock('../../repo/dawarichRepo', () => ({ dawarichRepo: { tripTrack } }))

import { seedStore } from '../../../tests/helpers/store'
import { useAddonStore } from '../../store/addonStore'
import { _resetNetworkMode, setForcedOffline } from '../../sync/networkMode'
import { useDawarichTrail } from './useDawarichTrail'

const REFRESH_MS = 120_000

const trackWith = (dates: string[], fetchedAt = '2026-05-03T10:00:00Z'): DawarichTrack => ({
  days: dates.map(date => ({
    date,
    segments: [
      {
        points: [
          [52.52, 13.405],
          [52.51, 13.41],
        ],
        mode: 'walking',
        startedAt: `${date}T08:00:00Z`,
        endedAt: `${date}T09:00:00Z`,
        distanceMeters: 1200,
      },
    ],
  })),
  source: 'tracks',
  fetchedAt,
  pointCount: 2 * dates.length,
  truncated: false,
})

const TRACK = trackWith(['2026-05-01'])
const NEWER = trackWith(['2026-05-01', '2026-05-02'], '2026-05-03T10:02:00Z')
const EMPTY: DawarichTrack = { ...trackWith([]), pointCount: 0 }

const addon = (enabled: boolean) => [
  { id: 'dawarich', name: 'Dawarich', description: '', type: 'integration', icon: 'map', enabled },
]

/**
 * A promise the test settles by hand. "In flight" is a state this hook has
 * opinions about (it keeps the old line, it aborts on the next load), and none
 * of them are observable against a promise that has already resolved.
 */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/** Let the repo promise and the state updates it schedules settle inside act. */
const flush = () =>
  act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })

/** jsdom's onLine is a prototype getter; an own property shadows it for one test. */
const setBrowserOnline = (value: boolean) =>
  Object.defineProperty(navigator, 'onLine', { value, writable: true, configurable: true })

const signalOf = (call: number): AbortSignal => tripTrack.mock.calls[call][2] as AbortSignal

beforeEach(() => {
  tripTrack.mockReset()
  tripTrack.mockResolvedValue(TRACK)
  // The `isEnabled` selector is a stable function reference, so a store change
  // after mount does not re-render the hook. Every test seeds before it renders.
  seedStore(useAddonStore, { addons: addon(true), loaded: true })
  _resetNetworkMode()
  setBrowserOnline(true)
})

afterEach(() => {
  vi.useRealTimers()
  _resetNetworkMode()
  setBrowserOnline(true)
})

describe('useDawarichTrail: the gate', () => {
  it('FE-DAWARICH-TRAIL-009: stays idle and reaches for nothing while the layer is off', () => {
    const { result } = renderHook(() => useDawarichTrail(7, false))

    expect(result.current.status).toBe('idle')
    expect(result.current.track).toBeNull()
    expect(result.current.fetchedAt).toBeNull()
    expect(tripTrack).not.toHaveBeenCalled()
  })

  it('FE-DAWARICH-TRAIL-010: a trip that has not loaded its id yet is not a trip to fetch for', () => {
    const { result } = renderHook(() => useDawarichTrail(undefined, true))

    expect(result.current.status).toBe('idle')
    expect(tripTrack).not.toHaveBeenCalled()
  })

  it('FE-DAWARICH-TRAIL-011: an instance with the addon switched off never calls the integration', () => {
    seedStore(useAddonStore, { addons: addon(false), loaded: true })

    const { result } = renderHook(() => useDawarichTrail(7, true))

    expect(result.current.status).toBe('idle')
    expect(tripTrack).not.toHaveBeenCalled()
  })
})

describe('useDawarichTrail: fetching', () => {
  it('FE-DAWARICH-TRAIL-012: fetches the trip window with an abort signal and reports it ready', async () => {
    const { result } = renderHook(() =>
      useDawarichTrail(7, true, { from: '2026-05-01', to: '2026-05-03' }),
    )

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.track).toEqual(TRACK)
    // fetchedAt comes off the answer, not off the clock: it is the server's
    // statement about how fresh the recording is, and the pill quotes it.
    expect(result.current.fetchedAt).toBe('2026-05-03T10:00:00Z')
    expect(tripTrack).toHaveBeenCalledTimes(1)
    expect(tripTrack.mock.calls[0][0]).toBe(7)
    expect(tripTrack.mock.calls[0][1]).toEqual({ from: '2026-05-01', to: '2026-05-03' })
    expect(signalOf(0)).toBeInstanceOf(AbortSignal)
    expect(signalOf(0).aborted).toBe(false)
  })

  it('FE-DAWARICH-TRAIL-013: a window with no recording is empty, which is not the same as ready', async () => {
    tripTrack.mockResolvedValue(EMPTY)

    const { result } = renderHook(() => useDawarichTrail(7, true))

    await waitFor(() => expect(result.current.status).toBe('empty'))
    expect(result.current.track).toEqual(EMPTY)
    expect(result.current.fetchedAt).toBe(EMPTY.fetchedAt)
  })

  it('FE-DAWARICH-TRAIL-014: a failed refresh keeps the line that is already drawn', async () => {
    tripTrack.mockResolvedValueOnce(TRACK).mockRejectedValueOnce(new Error('502 from Dawarich'))

    const { result } = renderHook(() => useDawarichTrail(7, true))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    act(() => {
      result.current.reload()
    })

    await waitFor(() => expect(result.current.status).toBe('unavailable'))
    // A line from two minutes ago beats an empty map; the status is the part
    // that admits it may be stale.
    expect(result.current.track).toEqual(TRACK)
    expect(result.current.fetchedAt).toBe(TRACK.fetchedAt)
    expect(tripTrack).toHaveBeenCalledTimes(2)
  })

  it('FE-DAWARICH-TRAIL-015: a refresh does not blank the map while the next answer is in flight', async () => {
    const second = deferred<DawarichTrack>()
    tripTrack.mockResolvedValueOnce(TRACK).mockReturnValueOnce(second.promise)

    const { result } = renderHook(() => useDawarichTrail(7, true))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    act(() => {
      result.current.reload()
    })

    // Not 'loading': flipping back to the spinner every two minutes would make
    // a routine poll look like the recording had gone away.
    expect(result.current.status).toBe('ready')
    expect(result.current.track).toEqual(TRACK)
    expect(tripTrack).toHaveBeenCalledTimes(2)

    await act(async () => {
      second.resolve(NEWER)
      await Promise.resolve()
    })
    await waitFor(() => expect(result.current.track).toEqual(NEWER))
    expect(result.current.fetchedAt).toBe(NEWER.fetchedAt)
  })

  it('FE-DAWARICH-TRAIL-016: changing the window refetches, re-rendering with the same window does not', async () => {
    type Range = { from?: string; to?: string }
    const { result, rerender } = renderHook(
      ({ range }: { range: Range }) => useDawarichTrail(7, true, range),
      { initialProps: { range: { from: '2026-05-01' } as Range } },
    )
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(tripTrack).toHaveBeenCalledTimes(1)

    // A fresh object literal with the same window: the parent produces one on
    // every render, and re-fetching on each of them is the bug the range key
    // exists to prevent.
    rerender({ range: { from: '2026-05-01' } })
    await flush()
    expect(tripTrack).toHaveBeenCalledTimes(1)

    rerender({ range: { from: '2026-05-01', to: '2026-05-04' } })
    await waitFor(() => expect(tripTrack).toHaveBeenCalledTimes(2))
    expect(tripTrack.mock.calls[1][1]).toEqual({ from: '2026-05-01', to: '2026-05-04' })
  })
})

describe('useDawarichTrail: offline', () => {
  it('FE-DAWARICH-TRAIL-017: a device that is offline by choice is never asked to reach the network', () => {
    setForcedOffline(true)

    const { result } = renderHook(() => useDawarichTrail(7, true))

    expect(result.current.status).toBe('offline')
    expect(tripTrack).not.toHaveBeenCalled()
  })

  it('FE-DAWARICH-TRAIL-018: going offline mid-flight aborts the request and drops the answer', async () => {
    const first = deferred<DawarichTrack>()
    tripTrack.mockReturnValueOnce(first.promise)

    const { result } = renderHook(() => useDawarichTrail(7, true))
    expect(result.current.status).toBe('loading')

    act(() => {
      setForcedOffline(true)
    })

    // The hook subscribes to network-mode changes, so the switch re-enters the
    // load immediately rather than waiting out the two-minute timer.
    expect(signalOf(0).aborted).toBe(true)
    expect(result.current.status).toBe('offline')
    expect(tripTrack).toHaveBeenCalledTimes(1)

    await act(async () => {
      first.resolve(TRACK)
      await Promise.resolve()
    })
    // The answer belonged to a request the hook has already given up on.
    // Painting it now would contradict the status the user is reading.
    expect(result.current.status).toBe('offline')
    expect(result.current.track).toBeNull()
  })

  it('FE-DAWARICH-TRAIL-019: a request that fails after the connection dropped says offline, not unavailable', async () => {
    tripTrack.mockImplementationOnce(async () => {
      // The browser drops the connection after the request left: the pre-flight
      // check passed, and only the failure knows the device is gone.
      setBrowserOnline(false)
      throw new Error('network error')
    })

    const { result } = renderHook(() => useDawarichTrail(7, true))

    await waitFor(() => expect(result.current.status).toBe('offline'))
    expect(result.current.track).toBeNull()
  })
})

describe('useDawarichTrail: lifecycle', () => {
  it('FE-DAWARICH-TRAIL-020: switching the layer off mid-flight discards the answer instead of drawing it', async () => {
    const first = deferred<DawarichTrack>()
    tripTrack.mockReturnValueOnce(first.promise)

    const { result, rerender } = renderHook(({ on }: { on: boolean }) => useDawarichTrail(7, on), {
      initialProps: { on: true },
    })
    expect(result.current.status).toBe('loading')

    rerender({ on: false })
    expect(result.current.status).toBe('idle')
    expect(signalOf(0).aborted).toBe(true)

    await act(async () => {
      first.resolve(TRACK)
      await Promise.resolve()
    })
    // Nobody asked for this line any more; drawing it would put the overlay
    // back on a map the user just cleared.
    expect(result.current.status).toBe('idle')
    expect(result.current.track).toBeNull()
  })

  it('FE-DAWARICH-TRAIL-021: a failure that lands after the layer was switched off stays quiet', async () => {
    const first = deferred<DawarichTrack>()
    tripTrack.mockReturnValueOnce(first.promise)

    const { result, rerender } = renderHook(({ on }: { on: boolean }) => useDawarichTrail(7, on), {
      initialProps: { on: true },
    })
    rerender({ on: false })

    await act(async () => {
      first.reject(new Error('too late'))
      await Promise.resolve()
    })
    // 'unavailable' here would light up a warning pill about a layer that is
    // not on screen.
    expect(result.current.status).toBe('idle')
  })

  it('FE-DAWARICH-TRAIL-022: switching off clears the drawn track and switching back on refetches', async () => {
    const { result, rerender } = renderHook(({ on }: { on: boolean }) => useDawarichTrail(7, on), {
      initialProps: { on: true },
    })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.track).toEqual(TRACK)

    rerender({ on: false })
    expect(result.current.track).toBeNull()
    expect(result.current.status).toBe('idle')
    // fetchedAt is deliberately not cleared: it describes the last answer the
    // hook actually received, and the pill reads it again on the way back.
    expect(result.current.fetchedAt).toBe(TRACK.fetchedAt)

    rerender({ on: true })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(tripTrack).toHaveBeenCalledTimes(2)
    expect(result.current.track).toEqual(TRACK)
  })

  it('FE-DAWARICH-TRAIL-023: refreshes on the two-minute timer and stops the timer with the hook', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    const { result, unmount } = renderHook(() => useDawarichTrail(7, true))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(result.current.status).toBe('ready')
    expect(tripTrack).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REFRESH_MS)
    })
    expect(tripTrack).toHaveBeenCalledTimes(2)
    // Each poll supersedes the one before it, so a slow answer can never land
    // on top of a newer one.
    expect(signalOf(0).aborted).toBe(true)

    unmount()
    expect(signalOf(1).aborted).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REFRESH_MS * 3)
    })
    // An interval that outlived the map would be a request every two minutes
    // for the rest of the session, against somebody's own hardware.
    expect(tripTrack).toHaveBeenCalledTimes(2)
  })

  it('FE-DAWARICH-TRAIL-024: a superseded request that fails afterwards leaves the newer one alone', async () => {
    const superseded = deferred<DawarichTrack>()
    const current = deferred<DawarichTrack>()
    tripTrack.mockReturnValueOnce(superseded.promise).mockReturnValueOnce(current.promise)

    const { result } = renderHook(() => useDawarichTrail(7, true))
    expect(result.current.status).toBe('loading')

    // Offline and straight back: two network-mode notifications inside the same
    // effect, so the first request is abandoned without the hook being torn down
    // or reloaded. That is the only way to get an aborted request whose failure
    // still arrives at a live listener, which is what the abort check in the
    // failure path is for. A timer tick does the same thing two minutes later.
    act(() => {
      setForcedOffline(true)
    })
    expect(result.current.status).toBe('offline')
    act(() => {
      setForcedOffline(false)
    })

    expect(tripTrack).toHaveBeenCalledTimes(2)
    expect(signalOf(0).aborted).toBe(true)
    expect(signalOf(1).aborted).toBe(false)
    expect(result.current.status).toBe('loading')

    await act(async () => {
      superseded.reject(new Error('aborted while the next request was already out'))
      // The failure travels through the then() before it reaches the catch(),
      // so one tick is not enough to see it land.
      await Promise.resolve()
      await Promise.resolve()
    })
    // 'unavailable' here would put a warning on the map about a request the hook
    // threw away itself, while the request it is actually waiting for is fine.
    expect(result.current.status).toBe('loading')

    await act(async () => {
      current.resolve(TRACK)
      await Promise.resolve()
    })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.track).toEqual(TRACK)
  })
})
