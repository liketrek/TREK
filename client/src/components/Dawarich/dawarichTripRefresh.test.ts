/**
 * FE-DAWARICH-API-030 to FE-DAWARICH-API-032
 *
 * Two lines of code, and both of them are the kind that rot without a sound.
 *
 * Accepting a recorded stay into a trip is written entirely server-side, so the
 * planner learns nothing about the place it produced until something pulls the
 * trip back in. This is that something, and both trip shells (the desktop
 * `PlacesSidebar` and the phone `MPlacesBrowser`) call it as a one-liner
 * precisely so the two copies cannot drift apart. What the tests hold is:
 *
 *  - **Both refreshes are started, not one.** A stay accepted onto a day creates
 *    an assignment as well as a place, so refreshing only the places leaves the
 *    day rail one entry short until a reload. That is a plausible "simplification"
 *    for someone reading the call site, and nothing else in the app would notice.
 *  - **They run together, not in sequence.** `Promise.all` fires both before
 *    awaiting either; rewritten as two awaits it still works, just twice as
 *    slowly, and the button keeps spinning for both round trips. The order check
 *    below is synchronous, so it distinguishes the two shapes without timing.
 *  - **The id goes through verbatim.** The phone shell hands over a route param,
 *    which is a string; the desktop one hands over a number. Coercing either
 *    direction here would break the other caller.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useTripStore } from '../../store/tripStore'
import { refreshTripAfterAccept } from './dawarichTripRefresh'

const original = {
  refreshPlaces: useTripStore.getState().refreshPlaces,
  refreshDays: useTripStore.getState().refreshDays,
}

afterEach(() => {
  useTripStore.setState(original)
})

describe('refreshTripAfterAccept', () => {
  it('FE-DAWARICH-API-030: starts the day refresh without waiting for the place refresh', async () => {
    const order: string[] = []
    let releasePlaces!: () => void
    // A gate rather than a timer: with Promise.all both calls are made before
    // anything is awaited, so the day refresh has already run by the time control
    // returns. Rewritten as `await a; await b` it would still be waiting here.
    const placesGate = new Promise<void>(resolve => {
      releasePlaces = resolve
    })

    useTripStore.setState({
      refreshPlaces: vi.fn(async (_tripId: number | string) => {
        order.push('places:called')
        await placesGate
        order.push('places:settled')
      }),
      refreshDays: vi.fn(async (_tripId: number | string) => {
        order.push('days:called')
      }),
    })

    const pending = refreshTripAfterAccept(7)
    expect(order).toEqual(['places:called', 'days:called'])

    releasePlaces()
    await pending
    expect(order).toEqual(['places:called', 'days:called', 'places:settled'])
  })

  it('FE-DAWARICH-API-031: resolves only once both refreshes have finished', async () => {
    let releaseDays!: () => void
    const daysGate = new Promise<void>(resolve => {
      releaseDays = resolve
    })
    let settled = false

    useTripStore.setState({
      refreshPlaces: vi.fn(async (_tripId: number | string) => {}),
      refreshDays: vi.fn(async (_tripId: number | string) => {
        await daysGate
      }),
    })

    const pending = refreshTripAfterAccept(7).then(() => {
      settled = true
    })

    // Drain the microtask queue: the places half is already done, so anything
    // that only awaited that one would be finished by now.
    await Promise.resolve()
    await Promise.resolve()
    expect(settled).toBe(false)

    releaseDays()
    await pending
    expect(settled).toBe(true)
  })

  it('FE-DAWARICH-API-032: hands both refreshes the id exactly as the caller gave it', async () => {
    const refreshPlaces = vi.fn(async (_tripId: number | string) => {})
    const refreshDays = vi.fn(async (_tripId: number | string) => {})
    useTripStore.setState({ refreshPlaces, refreshDays })

    // The phone shell reads the trip id off the route, so it is a string there
    // and a number on the desktop. Both repos accept either; a cast added here
    // would only break whichever caller was not the one being looked at.
    await refreshTripAfterAccept('42')
    expect(refreshPlaces).toHaveBeenCalledWith('42')
    expect(refreshDays).toHaveBeenCalledWith('42')

    await refreshTripAfterAccept(42)
    expect(refreshPlaces).toHaveBeenLastCalledWith(42)
    expect(refreshDays).toHaveBeenLastCalledWith(42)
  })
})
