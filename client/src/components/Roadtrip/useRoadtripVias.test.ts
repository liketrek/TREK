import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { roadtripApi } = vi.hoisted(() => ({
  roadtripApi: {
    listVias: vi.fn(),
    addVia: vi.fn(),
    moveVia: vi.fn(),
    removeVia: vi.fn(),
  },
}))
vi.mock('../../api/client', () => ({ roadtripApi }))

// Offline is the hook's headline rule and it has no other way in: `editable` is read
// straight off useNetworkMode, so a test that never drives it can only ever see the
// online answer.
const { networkMode } = vi.hoisted(() => ({ networkMode: { offline: false } }))
vi.mock('../../hooks/useNetworkMode', () => ({ useNetworkMode: () => networkMode }))

// The remote path is driven by hand: the hook hands its handler to addListener, and the
// cases below call it the way a message from another screen would arrive.
const { addListener, removeListener } = vi.hoisted(() => ({
  addListener: vi.fn(),
  removeListener: vi.fn(),
}))
vi.mock('../../api/websocket', () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getSocketId: vi.fn(() => null),
  setRefetchCallback: vi.fn(),
  setPreReconnectHook: vi.fn(),
  addListener,
  removeListener,
}))

import { useRoadtripVias } from './useRoadtripVias'

const via = (over: Partial<{ id: number; day_id: number; after_order_index: number; sequence: number; lat: number; lng: number }> = {}) => ({
  id: 1, day_id: 1, after_order_index: 0, sequence: 0, lat: 53, lng: 10, ...over,
})

/** Whatever the hook last gave the socket, which is how a change from another screen gets in. */
const socketHandler = (): ((event: Record<string, unknown>) => void) => {
  const call = addListener.mock.calls[addListener.mock.calls.length - 1]
  if (!call) throw new Error('the hook never subscribed to the socket')
  return call[0]
}

beforeEach(() => {
  networkMode.offline = false
  roadtripApi.listVias.mockReset().mockResolvedValue({ vias: [] })
  roadtripApi.addVia.mockReset().mockResolvedValue({ via: via() })
  roadtripApi.moveVia.mockReset().mockResolvedValue({ via: via() })
  roadtripApi.removeVia.mockReset().mockResolvedValue({ success: true })
})

describe('useRoadtripVias', () => {
  it('FE-ROADTRIP-VIAS-001: asks once for the whole trip, not once per day', async () => {
    roadtripApi.listVias.mockResolvedValue({ vias: [via({ id: 1, day_id: 1 }), via({ id: 2, day_id: 2 })] })

    const { result } = renderHook(() => useRoadtripVias(7, true))

    await waitFor(() => expect(Object.keys(result.current.byDay)).toHaveLength(2))
    expect(roadtripApi.listVias).toHaveBeenCalledTimes(1)
    expect(result.current.byDay[1].map(v => v.id)).toEqual([1])
  })

  it('FE-ROADTRIP-VIAS-002: with road trip mode off nothing is fetched', async () => {
    const { result } = renderHook(() => useRoadtripVias(7, false))

    await waitFor(() => expect(result.current.byDay).toEqual({}))
    expect(roadtripApi.listVias).not.toHaveBeenCalled()
  })

  it('FE-ROADTRIP-VIAS-003: an addon that is switched off means no vias, not an error', async () => {
    // Shaped like the rejection axios actually produces, so the branch that
    // reads the status is the one under test.
    roadtripApi.listVias.mockRejectedValue({ response: { status: 404 } })

    const { result } = renderHook(() => useRoadtripVias(7, true))

    await waitFor(() => expect(roadtripApi.listVias).toHaveBeenCalled())
    expect(result.current.byDay).toEqual({})
    expect(result.current.stale).toBe(false)
  })

  it('FE-ROADTRIP-VIAS-007: a read that fails for another reason keeps the vias it has', async () => {
    // This read runs after every write, and the via list feeds the routing key.
    // Emptying on a 502, a dropped connection or a tab that just went offline
    // re-routed the whole trip along the roads the traveller had steered away
    // from — with no toast, nothing retrying, and no way to tell it apart from
    // having deleted them.
    roadtripApi.listVias.mockResolvedValue({ vias: [via({ id: 1, day_id: 1 })] })
    const { result } = renderHook(() => useRoadtripVias(7, true))
    await waitFor(() => expect(result.current.byDay[1]).toHaveLength(1))

    roadtripApi.listVias.mockRejectedValue({ response: { status: 502 } })
    await act(async () => { await result.current.move(1, 1, 54, 11) })

    expect(result.current.byDay[1]).toHaveLength(1)
    expect(result.current.stale).toBe(true)

    // And a read that works again clears the doubt.
    roadtripApi.listVias.mockResolvedValue({ vias: [via({ id: 1, day_id: 1 })] })
    await act(async () => { await result.current.move(1, 1, 54, 11) })
    expect(result.current.stale).toBe(false)
  })

  it('FE-ROADTRIP-VIAS-004: adding one re-reads the list rather than guessing its id', async () => {
    const { result } = renderHook(() => useRoadtripVias(7, true))
    await waitFor(() => expect(roadtripApi.listVias).toHaveBeenCalledTimes(1))

    roadtripApi.listVias.mockResolvedValue({ vias: [via({ id: 5, day_id: 3 })] })
    await act(async () => { await result.current.add(3, 1, 52, 11) })

    expect(roadtripApi.addVia).toHaveBeenCalledWith(7, 3, { after_order_index: 1, lat: 52, lng: 11 })
    // The server assigns id and sequence; patching the list by hand would be a second
    // source of truth for the sake of one round trip.
    await waitFor(() => expect(result.current.byDay[3]?.[0].id).toBe(5))
  })

  it('FE-ROADTRIP-VIAS-005: moving and removing go to the day they belong to', async () => {
    const { result } = renderHook(() => useRoadtripVias(7, true))
    await waitFor(() => expect(roadtripApi.listVias).toHaveBeenCalled())

    await act(async () => { await result.current.move(2, 9, 51, 12) })
    expect(roadtripApi.moveVia).toHaveBeenCalledWith(7, 2, 9, { lat: 51, lng: 12 })

    await act(async () => { await result.current.remove(2, 9) })
    expect(roadtripApi.removeVia).toHaveBeenCalledWith(7, 2, 9)
  })

  it('FE-ROADTRIP-VIAS-006: without a trip there is nothing to write to', async () => {
    const { result } = renderHook(() => useRoadtripVias(null, true))

    await act(async () => { await result.current.add(1, 0, 53, 10) })

    expect(roadtripApi.addVia).not.toHaveBeenCalled()
  })
it('FE-ROADTRIP-VIAS-008: a via somebody else moved replaces that day and only that day', async () => {
    // The screen holds the id the router handed it, a string, and the socket sends the
    // number the server broadcasts. Compared as they arrive, every remote change is lost.
    roadtripApi.listVias.mockResolvedValue({ vias: [via({ id: 1, day_id: 1 }), via({ id: 2, day_id: 2 })] })
    const { result } = renderHook(() => useRoadtripVias('7', true))
    await waitFor(() => expect(result.current.byDay[2]).toHaveLength(1))
    const untouched = result.current.byDay[1]

    // dayId travels as the route param it came from, so it is a string on the wire too.
    act(() => socketHandler()({
      type: 'roadtripVia:changed',
      tripId: 7,
      dayId: '2',
      vias: [via({ id: 8, day_id: 2, lat: 48 }), via({ id: 9, day_id: 2, lat: 49 })],
    }))

    // The server sends the day's whole list, so this replaces rather than merges: a merge
    // keeps drawing the point the other screen has just deleted.
    expect(result.current.byDay[2].map(v => v.id)).toEqual([8, 9])
    expect(result.current.byDay[1]).toBe(untouched)
  })

  it('FE-ROADTRIP-VIAS-009: a change to another trip is not applied to this one', async () => {
    roadtripApi.listVias.mockResolvedValue({ vias: [via({ id: 1, day_id: 1 })] })
    const { result } = renderHook(() => useRoadtripVias(7, true))
    await waitFor(() => expect(result.current.byDay[1]).toHaveLength(1))
    const before = result.current.byDay

    act(() => socketHandler()({
      type: 'roadtripVia:changed', tripId: 8, dayId: '1', vias: [via({ id: 4, day_id: 1 })],
    }))

    // The same object, not merely an equal one: this list feeds the routing key, so even
    // handing back a fresh copy re-routes the trip for an event meant for somebody else.
    expect(result.current.byDay).toBe(before)
  })

  it('FE-ROADTRIP-VIAS-010: a day emptied elsewhere leaves the map instead of lingering empty', async () => {
    roadtripApi.listVias.mockResolvedValue({ vias: [via({ id: 1, day_id: 1 }), via({ id: 2, day_id: 2 })] })
    const { result } = renderHook(() => useRoadtripVias(7, true))
    await waitFor(() => expect(result.current.byDay[2]).toHaveLength(1))

    act(() => socketHandler()({ type: 'roadtripVia:changed', tripId: 7, dayId: '2', vias: [] }))

    // An empty list left behind still answers yes to a `dayId in byDay` check, which is
    // how the surfaces ask whether a day is shaped at all.
    expect(2 in result.current.byDay).toBe(false)
    expect(result.current.byDay[1]).toHaveLength(1)

    const before = result.current.byDay
    act(() => socketHandler()({ type: 'roadtripVia:changed', tripId: 7, dayId: '2', vias: [] }))
    // Nothing left to drop, so nothing new to hand out — a copy here would re-route the
    // whole trip for an event that changed nothing.
    expect(result.current.byDay).toBe(before)
  })

  it('FE-ROADTRIP-VIAS-011: only a track event moves the track, and it clears just its own day', async () => {
    roadtripApi.listVias.mockResolvedValue({
      vias: [via({ id: 1, day_id: 1 })],
      tracks: [{ day_id: 1, place_id: 11, stray_km: 0.4 }, { day_id: 2, place_id: 22, stray_km: null }],
    })
    const { result } = renderHook(() => useRoadtripVias(7, true))
    await waitFor(() => expect(result.current.trackByDay[1]?.place_id).toBe(11))

    // A via event carries no track at all. Letting it reach the track map would drop the
    // badge for the road the day follows every time anybody nudged a point on it.
    act(() => socketHandler()({
      type: 'roadtripVia:changed', tripId: 7, dayId: '1', vias: [via({ id: 3, day_id: 1 })],
    }))
    expect(result.current.trackByDay[1]?.place_id).toBe(11)

    act(() => socketHandler()({ type: 'roadtripTrack:changed', tripId: 7, dayId: '1', track: null }))
    expect(1 in result.current.trackByDay).toBe(false)
    expect(result.current.trackByDay[2]?.place_id).toBe(22)

    act(() => socketHandler()({
      type: 'roadtripTrack:changed', tripId: 7, dayId: '2', track: { day_id: 2, place_id: 33, stray_km: 1 },
    }))
    expect(result.current.trackByDay[2].place_id).toBe(33)
  })

  it('FE-ROADTRIP-VIAS-012: the listener follows the trip and goes down with the screen', async () => {
    roadtripApi.listVias.mockResolvedValue({ vias: [via({ id: 1, day_id: 1 })] })
    const { result, rerender, unmount } = renderHook(({ id }: { id: number }) => useRoadtripVias(id, true), {
      initialProps: { id: 7 },
    })
    await waitFor(() => expect(result.current.byDay[1]).toHaveLength(1))
    const first = socketHandler()

    rerender({ id: 8 })
    await waitFor(() => expect(roadtripApi.listVias).toHaveBeenCalledWith(8))
    const second = socketHandler()
    expect(second).not.toBe(first)
    expect(removeListener).toHaveBeenCalledWith(first)

    // The live handler is the one built for the trip on screen. One kept from the previous
    // trip would keep writing that trip's days into this one.
    act(() => second({
      type: 'roadtripVia:changed',
      tripId: 7,
      dayId: '1',
      vias: [via({ id: 4, day_id: 1 }), via({ id: 5, day_id: 1 })],
    }))
    expect(result.current.byDay[1]).toHaveLength(1)

    // A handler that outlives its screen writes into a trip nobody is looking at.
    unmount()
    expect(removeListener).toHaveBeenCalledWith(second)
  })

  it('FE-ROADTRIP-VIAS-014: with no network the map is told not to offer a drag', async () => {
    // A via anchors to a POSITION in the day stop list, not to an id, so a write queued
    // offline and replayed after somebody else added a stop would re-pin the drive onto
    // a leg nobody chose, silently and hours later. Until the anchor is an assignment id
    // the honest answer is to stop offering the gesture rather than to lose the edit one
    // write at a time.
    roadtripApi.listVias.mockResolvedValue({ vias: [] })
    networkMode.offline = true

    const { result } = renderHook(() => useRoadtripVias(7, true))

    expect(result.current.editable).toBe(false)
  })

  it('FE-ROADTRIP-VIAS-013: an event that names no day is dropped rather than filed under NaN', async () => {
    roadtripApi.listVias.mockResolvedValue({ vias: [via({ id: 1, day_id: 1 })] })
    const { result } = renderHook(() => useRoadtripVias(7, true))
    await waitFor(() => expect(result.current.byDay[1]).toHaveLength(1))
    const before = result.current.byDay

    act(() => socketHandler()({ type: 'roadtripVia:changed', tripId: 7, vias: [via({ id: 4, day_id: 1 })] }))

    // Unguarded this lands under the key NaN, and everything that walks the days then
    // routes a day the trip does not have.
    expect(result.current.byDay).toBe(before)
    expect(Object.keys(result.current.byDay)).toEqual(['1'])
  })
})
