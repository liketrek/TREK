import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import {
  RT_ALT_BAR_HEIGHT, RT_ALT_BAR_LIFT, useMRtAlternatives,
} from '../../../../src/mobile/screens/trip/roadtrip/useMRtAlternatives'
import { buildAlternativeOverlays } from '../../../../src/components/Roadtrip/alternativeOverlays'
import type { LegAlternatives, OfferedRoute } from '../../../../src/components/Roadtrip/useRouteAlternatives'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'

// FE-MOB-RTALTH-001 to FE-MOB-RTALTH-009
//
// The hook holds no picker state, so every case is a planner shape and what the hook
// reads out of it or asks of it.

/** Three ways of driving one leg: the road already driven first, then two offers. */
const ROUTES: OfferedRoute[] = [
  { coordinates: [[35.7, 139.8], [35.4, 138.6], [34.98, 135.75]], distance: 210_000, duration: 9_600, divergence: null, current: true },
  { coordinates: [[35.7, 139.8], [35.9, 138.2], [34.98, 135.75]], distance: 198_000, duration: 10_320, divergence: { lat: 35.9, lng: 138.2 } },
  { coordinates: [[35.7, 139.8], [35.2, 138.9], [34.98, 135.75]], distance: 236_000, duration: 11_400, divergence: { lat: 35.2, lng: 138.9 }, avoids: 'motorway' },
]

const OVERLAYS = buildAlternativeOverlays(ROUTES, {
  fastest: 'Fastest', current: 'Current', noMotorway: 'No motorway', noToll: 'No tolls', noFerry: 'No ferry',
})

function leg(over: Partial<LegAlternatives> = {}): LegAlternatives {
  return { dayId: 2, index: 1, routes: ROUTES, loading: false, error: false, ...over }
}

/** A planner with the picker open on leg 1 of day 2, answered with three roads. */
function planner(over: Partial<TripPlanner> = {}, open: LegAlternatives | null = leg()): TripPlanner {
  const base = buildPlanner()
  return buildPlanner({
    selectedDayId: 2,
    routeAlternatives: { ...base.routeAlternatives, open },
    alternativeOverlays: open ? OVERLAYS : [],
    ...over,
  } as Partial<TripPlanner>)
}

function setup(p: TripPlanner = planner(), shell: MTripShellApi = buildShell()) {
  const view = renderHook(({ pl, sh }) => useMRtAlternatives(pl, sh), { initialProps: { pl: p, sh: shell } })
  return { ...view, planner: p, shell }
}

describe('useMRtAlternatives', () => {
  it('FE-MOB-RTALTH-001: a leg is open only when both its day and its position match', () => {
    const { result } = setup()

    expect(result.current.isOpenFor(2, 1)).toBe(true)
    // The same position on another card, and another leg of the same card.
    expect(result.current.isOpenFor(1, 1)).toBe(false)
    expect(result.current.isOpenFor(2, 0)).toBe(false)

    const closed = setup(planner({}, null))
    expect(closed.result.current.isOpenFor(2, 1)).toBe(false)
  })

  it('FE-MOB-RTALTH-002: reads the phase and the picked road off the planner, and has neither while closed', () => {
    const closed = setup(planner({}, null))
    expect(closed.result.current.open).toBeNull()
    expect(closed.result.current.phase).toBeNull()
    expect(closed.result.current.picked).toBeNull()

    const asking = setup(planner({ alternativeOverlays: [] }, leg({ loading: true, routes: [] })))
    expect(asking.result.current.phase).toBe('loading')

    const picked = setup(planner({ highlightedAlternative: 2 }))
    expect(picked.result.current.phase).toBe('choose')
    expect(picked.result.current.overlays).toBe(OVERLAYS)
    expect(picked.result.current.picked).toBe(OVERLAYS[2])

    // A pick the overlays do not hold is no pick, rather than a road nobody is shown.
    const stray = setup(planner({ highlightedAlternative: 7 }))
    expect(stray.result.current.picked).toBeNull()
  })

  it('FE-MOB-RTALTH-003: confirm needs a road other than the one driven, a connection and a choice to make', () => {
    expect(setup(planner()).result.current.canConfirm).toBe(false)
    // The road already driven writes nothing, so there is nothing to confirm.
    expect(setup(planner({ highlightedAlternative: 0 })).result.current.canConfirm).toBe(false)
    expect(setup(planner({ highlightedAlternative: 1 })).result.current.canConfirm).toBe(true)

    const base = buildPlanner()
    const offline = setup(planner({ highlightedAlternative: 1, roadtripVias: { ...base.roadtripVias, editable: false } }))
    expect(offline.result.current.editable).toBe(false)
    expect(offline.result.current.canConfirm).toBe(false)

    // A pick left over from the answer before is not a choice while the router is asked again.
    const asking = setup(planner({ highlightedAlternative: 1 }, leg({ loading: true })))
    expect(asking.result.current.canConfirm).toBe(false)
  })

  it('FE-MOB-RTALTH-004: asking a new leg clears the old pick and the fuel search, then goes to the map', () => {
    const p = planner({}, null)
    const shell = buildShell({ rtView: 'list' })
    const { result } = setup(p, shell)

    act(() => { result.current.ask(2, 0) })

    expect(p.setHighlightedAlternative).toHaveBeenCalledWith(null)
    expect(p.refuel.close).toHaveBeenCalledTimes(1)
    expect(p.askRouteAlternatives).toHaveBeenCalledWith(2, 0)
    // The pick is cleared before the new question goes out.
    const cleared = vi.mocked(p.setHighlightedAlternative).mock.invocationCallOrder[0]
    expect(cleared).toBeLessThan(vi.mocked(p.askRouteAlternatives).mock.invocationCallOrder[0])
    expect(shell.toggleRtView).toHaveBeenCalledTimes(1)

    // Already on the map, the switch would take the traveller back to the chain.
    const onMap = buildShell({ rtView: 'map' })
    const second = setup(planner({}, null), onMap)
    act(() => { second.result.current.ask(2, 0) })
    expect(second.planner.askRouteAlternatives).toHaveBeenCalledWith(2, 0)
    expect(onMap.toggleRtView).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTALTH-005: asking the leg already open only goes back to its answer', () => {
    const p = planner({ highlightedAlternative: 1 })
    const shell = buildShell({ rtView: 'list' })
    const { result } = setup(p, shell)

    act(() => { result.current.ask(2, 1) })

    // The planner's ask toggles an open leg shut, and the pick on it is still wanted.
    expect(p.askRouteAlternatives).not.toHaveBeenCalled()
    expect(p.setHighlightedAlternative).not.toHaveBeenCalled()
    expect(p.refuel.close).not.toHaveBeenCalled()
    expect(shell.toggleRtView).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-RTALTH-006: a stage change closes the picker, and nothing else does', () => {
    const p = planner()
    const { rerender, shell } = setup(p)
    expect(p.routeAlternatives.close).not.toHaveBeenCalled()

    // Re-rendered on the same stage, as the shell does on every store write.
    rerender({ pl: { ...p }, sh: shell })
    expect(p.routeAlternatives.close).not.toHaveBeenCalled()

    rerender({ pl: { ...p, selectedDayId: 3 }, sh: shell })
    expect(p.routeAlternatives.close).toHaveBeenCalledTimes(1)

    // The all days view has no stage at all, so no leg of one either.
    const allDays = planner({ selectedDayId: null })
    setup(allDays)
    expect(allDays.routeAlternatives.close).toHaveBeenCalledTimes(1)

    // With nothing open there is nothing to close.
    const closed = planner({ selectedDayId: 3 }, null)
    setup(closed)
    expect(closed.routeAlternatives.close).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTALTH-007: confirm writes the picked road once and is pending until the write lands', async () => {
    let land: () => void = () => {}
    const p = planner({
      highlightedAlternative: 2,
      chooseRouteAlternative: vi.fn(() => new Promise<void>(resolve => { land = resolve })),
    })
    const { result } = setup(p)

    act(() => { result.current.confirm() })

    expect(p.chooseRouteAlternative).toHaveBeenCalledWith(2)
    expect(result.current.saving).toBe(true)
    expect(result.current.canConfirm).toBe(false)
    // A second tap while the first is in flight writes nothing more.
    act(() => { result.current.confirm() })
    expect(p.chooseRouteAlternative).toHaveBeenCalledTimes(1)

    await act(async () => { land() })
    expect(result.current.saving).toBe(false)
    expect(result.current.canConfirm).toBe(true)
  })

  it('FE-MOB-RTALTH-008: a pick only lights a road, cancel closes, and the question needs day edit rights', () => {
    const p = planner()
    const { result } = setup(p)

    act(() => { result.current.pick(1) })
    expect(p.setHighlightedAlternative).toHaveBeenCalledWith(1)
    expect(p.chooseRouteAlternative).not.toHaveBeenCalled()

    act(() => { result.current.confirm() })
    // Nothing picked in this planner, so the confirm stays a no-op.
    expect(p.chooseRouteAlternative).not.toHaveBeenCalled()

    act(() => { result.current.cancel() })
    expect(p.routeAlternatives.close).toHaveBeenCalledTimes(1)

    expect(result.current.canAsk).toBe(true)
    expect(p.can).toHaveBeenCalledWith('day_edit', p.trip)
    const viewer = setup(planner({ can: vi.fn(() => false) }))
    expect(viewer.result.current.canAsk).toBe(false)
  })

  it('FE-MOB-RTALTH-009: the map lifts its floor by the bar and the gap it keeps from the dock', () => {
    // The same 15px a bar standing over the dock keeps from it. This is the only such bar
    // left: the stage bar that used to hold the slot the rest of the time is gone.
    expect(RT_ALT_BAR_HEIGHT).toBe(174)
    expect(RT_ALT_BAR_LIFT).toBe(189)
  })
})
