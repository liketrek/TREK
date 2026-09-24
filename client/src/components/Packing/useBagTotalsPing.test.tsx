// FE-COMP-BAGPING-001 to FE-COMP-BAGPING-009

/**
 * The bag-totals ping listener (#2191).
 *
 * Bag weights are summed server-side across every member, so the event that
 * says they moved cannot carry the new numbers without leaking what produced
 * them. That makes every ping a refetch, and the server deliberately sends it
 * to the whole room including the writer — so the coalescing and the in-flight
 * guard here are what stop a busy trip turning one write into a storm of
 * listBags requests on every connected client.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBagTotalsPing } from './useBagTotalsPing'
import { setForcedOffline, _resetNetworkMode } from '../../sync/networkMode'

const listeners = new Set<(e: Record<string, unknown>) => void>()

vi.mock('../../api/websocket', () => ({
  addListener: (fn: (e: Record<string, unknown>) => void) => { listeners.add(fn) },
  removeListener: (fn: (e: Record<string, unknown>) => void) => { listeners.delete(fn) },
}))

/** Deliver an event the way the websocket layer would. */
function emit(type: string): void {
  for (const fn of [...listeners]) fn({ type })
}

/** Past the 250ms coalescing window. */
async function flushCoalesce(): Promise<void> {
  await act(async () => { await vi.advanceTimersByTimeAsync(300) })
}

beforeEach(() => {
  listeners.clear()
  _resetNetworkMode()
  vi.useFakeTimers()
})

afterEach(() => {
  setForcedOffline(false)
  vi.useRealTimers()
})

describe('useBagTotalsPing', () => {
  it('FE-COMP-BAGPING-001: reloads once a ping arrives', async () => {
    const reload = vi.fn(async () => {})
    renderHook(() => useBagTotalsPing(true, reload))

    expect(reload).not.toHaveBeenCalled()
    act(() => emit('packing:bag-totals'))
    await flushCoalesce()

    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-BAGPING-002: folds a burst of pings into a single refetch', async () => {
    // Clearing twelve checked items issues twelve deletes; an import writes a
    // whole list. Each one pings the room.
    const reload = vi.fn(async () => {})
    renderHook(() => useBagTotalsPing(true, reload))

    act(() => { for (let i = 0; i < 12; i++) emit('packing:bag-totals') })
    await flushCoalesce()

    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-BAGPING-003: never overlaps two refetches, and serves a ping that arrived mid-flight', async () => {
    let release: (() => void) | undefined
    const reload = vi.fn(() => new Promise<void>(resolve => { release = resolve }))
    renderHook(() => useBagTotalsPing(true, reload))

    act(() => emit('packing:bag-totals'))
    await flushCoalesce()
    expect(reload).toHaveBeenCalledTimes(1)

    // A second burst while the first request is still open must not start a
    // parallel one...
    act(() => emit('packing:bag-totals'))
    await flushCoalesce()
    expect(reload).toHaveBeenCalledTimes(1)

    // ...but it must not be dropped either: the totals moved again.
    await act(async () => { release?.(); await Promise.resolve() })
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it('FE-COMP-BAGPING-004: ignores every other event type', async () => {
    const reload = vi.fn(async () => {})
    renderHook(() => useBagTotalsPing(true, reload))

    act(() => { emit('packing:created'); emit('packing:updated'); emit('place:created') })
    await flushCoalesce()

    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-COMP-BAGPING-005: subscribes to nothing while bag tracking is off', async () => {
    const reload = vi.fn(async () => {})
    renderHook(() => useBagTotalsPing(false, reload))

    expect(listeners.size).toBe(0)
    act(() => emit('packing:bag-totals'))
    await flushCoalesce()
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-COMP-BAGPING-006: unsubscribes on unmount and does not reload afterwards', async () => {
    const reload = vi.fn(async () => {})
    const { unmount } = renderHook(() => useBagTotalsPing(true, reload))
    expect(listeners.size).toBe(1)

    // A ping already collecting when the panel closes must not land on a
    // component that is gone.
    act(() => emit('packing:bag-totals'))
    unmount()
    await flushCoalesce()

    expect(listeners.size).toBe(0)
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-COMP-BAGPING-007: reloads when the socket re-joins the room', async () => {
    // A ping sent while the socket was down is gone for good (a container
    // restart, a tunnel that dropped), and bags have no offline cache to catch
    // up from. The re-join is the only notice this client gets.
    const reload = vi.fn(async () => {})
    renderHook(() => useBagTotalsPing(true, reload))

    act(() => emit('joined'))
    await flushCoalesce()

    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-BAGPING-008: reloads on the way back online, not on the way out', async () => {
    const reload = vi.fn(async () => {})
    renderHook(() => useBagTotalsPing(true, reload))

    act(() => setForcedOffline(true))
    await flushCoalesce()
    expect(reload).not.toHaveBeenCalled()

    // Going online is where the surfaces stop summing locally and show the
    // server totals again, so those totals had better not be the pre-outage ones.
    act(() => setForcedOffline(false))
    await flushCoalesce()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-BAGPING-009: stops watching the network mode after unmount', async () => {
    const reload = vi.fn(async () => {})
    const { unmount } = renderHook(() => useBagTotalsPing(true, reload))

    act(() => setForcedOffline(true))
    unmount()
    act(() => setForcedOffline(false))
    await flushCoalesce()

    expect(reload).not.toHaveBeenCalled()
  })
})
