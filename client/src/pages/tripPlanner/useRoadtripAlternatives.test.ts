// FE-TP-ALTERNATIVES-001 to FE-TP-ALTERNATIVES-015
//
// The other ways of driving one leg and what the road trip map frames, driven straight
// through useRoadtripAlternatives. The picker's own state and the pin search are
// fixtures with suites of their own; the drive helpers beside them stay real, since
// which leg a choice lands on is what these cases are about.
import { act, renderHook } from '@testing-library/react'
import type { PinProof } from '../../components/Roadtrip/alternativePins'
import type { LegAlternatives, OfferedRoute } from '../../components/Roadtrip/useRouteAlternatives'
import { openLeg } from '../../../tests/helpers/legAlternatives'
import type { Translate } from './plannerTypes'
import type { RoadtripFeed } from './useRoadtripFeed'
import { useRoadtripAlternatives } from './useRoadtripAlternatives'

const fx = vi.hoisted(() => ({
  alt: {
    open: null as unknown,
    ask: vi.fn(),
    close: vi.fn(),
    prove: vi.fn(),
    settle: vi.fn(),
  },
  pin: vi.fn(),
}))

vi.mock('../../components/Roadtrip/useRouteAlternatives', async importOriginal => ({
  ...(await importOriginal<typeof import('../../components/Roadtrip/useRouteAlternatives')>()),
  useRouteAlternatives: () => fx.alt,
}))
vi.mock('../../components/Roadtrip/alternativePins', async importOriginal => ({
  ...(await importOriginal<typeof import('../../components/Roadtrip/alternativePins')>()),
  pinAlternative: (...args: unknown[]) => fx.pin(...args),
}))

type Options = Parameters<typeof useRoadtripAlternatives>[0]
type Via = { id: number; day_id: number; after_order_index: number; sequence: number; lat: number; lng: number }

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }
const t: Translate = (key, params) => (params ? `${key} ${JSON.stringify(params)}` : key)

const stopAt = (assignmentId: number, ownerDayId: number, ownerIndex: number, lng: number, extra: object = {}) => (
  { assignmentId, ownerDayId, ownerIndex, placeId: assignmentId, name: `Stop ${assignmentId}`, lat: 50, lng, ...extra }
)
const seg = { distance: 70000, duration: 3600, mode: 'driving' }

// Day 2 drives three stops, and arrives from the last stop of day 1. Day 3 has a single
// stop: it draws no card, but the drive into it leaves from day 2's last stop.
const dayOneEnd = stopAt(13, 1, 2, 9)
const dayTwo = {
  dayId: 2, dayNumber: 2,
  stops: [stopAt(21, 2, 0, 10), stopAt(22, 2, 1, 11), stopAt(23, 2, 2, 12)],
  legs: [seg, seg],
  legLines: [[[50, 10], [50, 11]]],
  arrivingFrom: dayOneEnd, arrivingLeg: seg, arrivingLine: [[50, 9], [50, 10]],
  schedule: { entries: [] },
  geometry: [[50, 10], [50, 11], [50, 12]],
}
const quietDay = { dayId: 3, dayNumber: 3, stops: [stopAt(31, 3, 0, 13)] }

const offers: OfferedRoute[] = [
  { coordinates: [[50, 10], [50.2, 10.5], [50, 11]], distance: 70000, duration: 3600, divergence: null, current: true },
  { coordinates: [[50, 10], [49.6, 10.5], [50, 11]], distance: 90000, duration: 4200, divergence: null, hasFerry: true },
  { coordinates: [[50, 10], [49.8, 10.5], [50, 11]], distance: 80000, duration: 3900, divergence: null, direct: true },
]

let router: { mode: string; avoid: string[]; engine: string; route: ReturnType<typeof vi.fn> }
let routes: Record<string, unknown> & { days: unknown[]; quietDays: unknown[]; legRouter: ReturnType<typeof vi.fn>; reroute: ReturnType<typeof vi.fn> }
let vias: { byDay: Record<number, Via[]>; editable: boolean; addMany: ReturnType<typeof vi.fn> }
let refuel: { offered: Array<{ lat: number; lng: number }>; close: ReturnType<typeof vi.fn> }
let signal: AbortController

function baseOptions(over: Partial<Options> = {}): Options {
  return {
    t, toast, isMobile: false, activeTab: 'plan', roadtripActive: true, roadtripFeedActive: true,
    roadtripRoutes: routes as unknown as RoadtripFeed['roadtripRoutes'],
    roadtripVias: vias as unknown as RoadtripFeed['roadtripVias'],
    refuel: refuel as unknown as RoadtripFeed['refuel'],
    collapsedRoadtripDays: new Set<number>(),
    ...over,
  }
}

function renderAlternatives(over: Partial<Options> = {}) {
  return renderHook((props: Options) => useRoadtripAlternatives(props), { initialProps: baseOptions(over) })
}

/** The picker open on day 2's first leg, as the rail asked about it. */
function openFirstLeg(over: Partial<LegAlternatives> = {}) {
  fx.alt.open = openLeg({ routes: offers, ends: { from: 21, to: 22 }, ...over })
}

const proof = (over: Partial<PinProof> = {}): PinProof => ({
  held: true, pins: [{ lat: 49.6, lng: 10.5 }], fellBack: false,
  last: { coordinates: [], distance: 0, duration: 0 } as unknown as PinProof['last'], ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  fx.alt.open = null
  signal = new AbortController()
  fx.alt.prove.mockImplementation(() => signal.signal)
  fx.pin.mockReset().mockResolvedValue(proof())
  router = { mode: 'driving', avoid: [], engine: 'osrm', route: vi.fn() }
  routes = {
    days: [dayTwo], quietDays: [quietDay], lines: [], lineDays: [], vias: [{ lat: 1, lng: 2 }],
    legRouter: vi.fn(() => router), reroute: vi.fn(),
  }
  vias = { byDay: {}, editable: true, addMany: vi.fn(async () => undefined) }
  refuel = { offered: [], close: vi.fn() }
})

describe('useRoadtripAlternatives', () => {
  it('FE-TP-ALTERNATIVES-001: with the picker closed nothing is offered, highlighted or framed', () => {
    const { result } = renderAlternatives()

    expect(result.current.routeAlternatives).toBe(fx.alt)
    expect(result.current.highlightedAlternative).toBeNull()
    expect(result.current.alternativeOverlays).toEqual([])
    expect(result.current.alternativeFocusPoints).toEqual([])
    expect(result.current.mapFocusPoints).toEqual([])
    expect(result.current.roadtripMapVias).toEqual([{ lat: 1, lng: 2 }])
    expect(fx.alt.close).not.toHaveBeenCalled()
  })

  it('FE-TP-ALTERNATIVES-002: the highlighted road is forgotten once the picker closes', () => {
    openFirstLeg()
    const { result, rerender } = renderAlternatives()

    act(() => { result.current.setHighlightedAlternative(1) })
    expect(result.current.highlightedAlternative).toBe(1)

    fx.alt.open = null
    rerender(baseOptions())
    expect(result.current.highlightedAlternative).toBeNull()
  })

  it('FE-TP-ALTERNATIVES-003: the picker closes wherever it can no longer be seen', () => {
    // At the desk it lives in road trip mode.
    const desk = renderAlternatives({ roadtripActive: false })
    expect(fx.alt.close).toHaveBeenCalledTimes(1)
    desk.unmount()

    // On the phone it lives on the drive tab, and leaving the tab closes it.
    fx.alt.close.mockClear()
    const phone = { isMobile: true, roadtripActive: false }
    const { rerender } = renderAlternatives({ ...phone, activeTab: 'roadtrip' })
    expect(fx.alt.close).not.toHaveBeenCalled()
    rerender(baseOptions({ ...phone, activeTab: 'plan' }))
    expect(fx.alt.close).toHaveBeenCalledTimes(1)
    rerender(baseOptions({ ...phone, activeTab: 'roadtrip' }))
    expect(fx.alt.close).toHaveBeenCalledTimes(1)
    // Without the feed there is no drive to offer other ways of.
    rerender(baseOptions({ ...phone, activeTab: 'roadtrip', roadtripFeedActive: false }))
    expect(fx.alt.close).toHaveBeenCalledTimes(2)
  })

  it('FE-TP-ALTERNATIVES-004: the offers are drawn, framed, and give way to refuel offers on the map', () => {
    openFirstLeg()
    const { result, rerender } = renderAlternatives()

    expect(result.current.alternativeOverlays.map(o => o.note)).toEqual(['roadtrip.alt.current', '', ''])
    expect(result.current.alternativeFocusPoints).toEqual(offers.flatMap(o => o.coordinates))
    expect(result.current.mapFocusPoints).toBe(result.current.alternativeFocusPoints)

    refuel.offered = [{ lat: 48, lng: 9 }, { lat: 48.5, lng: 9.5 }]
    rerender(baseOptions())
    expect(result.current.mapFocusPoints).toEqual([[48, 9], [48.5, 9.5]])
  })

  it('FE-TP-ALTERNATIVES-005: focusing a point on the drive closes both pickers and frames that point', () => {
    const { result, rerender } = renderAlternatives()

    act(() => { result.current.focusRoadtripPoint(50.5, 10.5) })
    expect(refuel.close).toHaveBeenCalled()
    expect(fx.alt.close).toHaveBeenCalled()
    expect(result.current.mapFocusPoints).toEqual([[50.5, 10.5]])

    // A rail rebuilt since is a different drive: the point no longer stands.
    routes.days = [{ ...dayTwo }]
    rerender(baseOptions())
    expect(result.current.mapFocusPoints).toEqual([])
  })

  it('FE-TP-ALTERNATIVES-006: asking about a leg hands the picker the leg as the rail drives it', () => {
    const { result } = renderAlternatives()

    act(() => { result.current.askRouteAlternatives(2, { kind: 'leg', index: 0 }) })
    expect(routes.legRouter).toHaveBeenCalledWith(dayTwo.stops[0], dayTwo.stops[1], 2)
    expect(fx.alt.ask).toHaveBeenCalledWith({
      dayId: 2,
      drive: { kind: 'leg', index: 0 },
      from: { lat: 50, lng: 10 },
      to: { lat: 50, lng: 11 },
      driven: { coordinates: [[50, 10], [50, 11]], distance: 70000, duration: 3600 },
      anchor: { dayId: 2, afterIndex: 0 },
      ends: { from: 21, to: 22 },
      router,
    })

    // A leg the rail drew no line for is asked about with an empty one.
    act(() => { result.current.askRouteAlternatives(2, { kind: 'leg', index: 1 }) })
    expect(fx.alt.ask).toHaveBeenLastCalledWith(expect.objectContaining({
      driven: { coordinates: [], distance: 70000, duration: 3600 },
      anchor: { dayId: 2, afterIndex: 1 },
    }))

    // The drive arriving at the head of the card is filed behind yesterday's last stop.
    act(() => { result.current.askRouteAlternatives(2, { kind: 'arriving' }) })
    expect(fx.alt.ask).toHaveBeenLastCalledWith(expect.objectContaining({
      from: { lat: 50, lng: 9 },
      anchor: { dayId: 1, afterIndex: 2 },
      ends: { from: 13, to: 21 },
    }))
  })

  it('FE-TP-ALTERNATIVES-007: a second ask about the open leg closes it, and an unknown leg asks nothing', () => {
    openFirstLeg()
    const { result } = renderAlternatives()

    act(() => { result.current.askRouteAlternatives(2, { kind: 'leg', index: 0 }) })
    expect(fx.alt.close).toHaveBeenCalledTimes(1)
    expect(fx.alt.ask).not.toHaveBeenCalled()

    act(() => {
      result.current.askRouteAlternatives(9, { kind: 'leg', index: 0 })
      result.current.askRouteAlternatives(2, { kind: 'leg', index: 5 })
    })
    routes.legRouter.mockReturnValueOnce(undefined)
    act(() => { result.current.askRouteAlternatives(2, { kind: 'leg', index: 1 }) })
    expect(fx.alt.ask).not.toHaveBeenCalled()
  })

  it('FE-TP-ALTERNATIVES-008: a choice that cannot be checked is not tried', async () => {
    const { result, rerender } = renderAlternatives()
    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(fx.alt.prove).not.toHaveBeenCalled()

    openFirstLeg()
    rerender(baseOptions())
    await act(async () => { await result.current.chooseRouteAlternative(7) })
    expect(fx.alt.prove).not.toHaveBeenCalled()

    // The road already driven changes nothing and just closes the picker.
    await act(async () => { await result.current.chooseRouteAlternative(0) })
    expect(fx.alt.close).toHaveBeenCalledTimes(1)

    openFirstLeg({ proving: 2 })
    rerender(baseOptions())
    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(fx.alt.prove).not.toHaveBeenCalled()

    openFirstLeg()
    vias.editable = false
    rerender(baseOptions())
    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(toast.error).toHaveBeenCalledWith('roadtrip.alt.offline')
    expect(fx.alt.prove).not.toHaveBeenCalled()
  })

  it('FE-TP-ALTERNATIVES-009: a check the router could not answer is said in the bar, and on the phone as a toast', async () => {
    openFirstLeg()
    fx.pin.mockRejectedValue(new Error('429'))
    const { result, rerender } = renderAlternatives()

    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(fx.alt.prove).toHaveBeenCalledWith(1)
    expect(fx.pin).toHaveBeenCalledWith({ offer: offers[1], current: offers[0], route: (fx.alt.open as LegAlternatives).route, signal: signal.signal })
    expect(fx.alt.settle).toHaveBeenCalledWith('roadtrip.alt.failed')
    expect(toast.error).not.toHaveBeenCalled()

    rerender(baseOptions({ isMobile: true }))
    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(toast.error).toHaveBeenCalledWith('roadtrip.alt.failed')

    // Abandoned on the way: nobody is waiting for the answer any more.
    fx.alt.settle.mockClear()
    signal.abort()
    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(fx.alt.settle).not.toHaveBeenCalled()
  })

  it('FE-TP-ALTERNATIVES-010: a way the router will not hold is refused with the way out, where there is one', async () => {
    openFirstLeg()
    const { result, rerender } = renderAlternatives()

    fx.pin.mockResolvedValueOnce(proof({ held: false, pins: [], last: { hasFerry: false } as unknown as PinProof['last'] }))
    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(fx.alt.settle).toHaveBeenLastCalledWith('roadtrip.alt.notHeld roadtrip.alt.ferryNotHeld')
    expect(toast.error).not.toHaveBeenCalled()

    fx.pin.mockResolvedValueOnce(proof({ held: false, pins: [] }))
    await act(async () => { await result.current.chooseRouteAlternative(2) })
    expect(fx.alt.settle).toHaveBeenLastCalledWith('roadtrip.alt.notHeld')

    fx.pin.mockResolvedValueOnce(proof({ held: false, pins: [], fellBack: true }))
    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(fx.alt.settle).toHaveBeenLastCalledWith('roadtrip.alt.failed')

    rerender(baseOptions({ isMobile: true }))
    fx.pin.mockResolvedValueOnce(proof({ held: false, pins: [], last: { hasFerry: false } as unknown as PinProof['last'] }))
    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(toast.error).toHaveBeenLastCalledWith('roadtrip.alt.notHeld', 6000)
    expect(toast.info).toHaveBeenLastCalledWith('roadtrip.alt.ferryNotHeld', 8000)

    fx.pin.mockResolvedValueOnce(proof({ held: false, pins: [] }))
    await act(async () => { await result.current.chooseRouteAlternative(2) })
    expect(toast.error).toHaveBeenLastCalledWith('roadtrip.alt.notHeld', 6000)
    expect(toast.info).toHaveBeenCalledTimes(1)
  })

  it('FE-TP-ALTERNATIVES-011: an answer that comes back after the picker moved on writes nothing', async () => {
    openFirstLeg()
    fx.pin.mockImplementation(async () => { signal.abort(); return proof() })
    const { result } = renderAlternatives()

    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(vias.addMany).not.toHaveBeenCalled()
    expect(fx.alt.settle).not.toHaveBeenCalled()
    expect(fx.alt.close).not.toHaveBeenCalled()
  })

  it('FE-TP-ALTERNATIVES-012: a leg that changed under the check is not written', async () => {
    openFirstLeg({ ends: { from: 21, to: 23 } })
    const { result, rerender } = renderAlternatives()

    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(toast.error).toHaveBeenCalledWith('roadtrip.alt.legChanged', 6000)
    expect(fx.alt.close).toHaveBeenCalledTimes(1)
    expect(vias.addMany).not.toHaveBeenCalled()

    // Nor one whose stop is gone from the rail altogether.
    openFirstLeg({ anchor: { dayId: 2, afterIndex: 9 } })
    rerender(baseOptions())
    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(fx.alt.close).toHaveBeenCalledTimes(2)
    expect(vias.addMany).not.toHaveBeenCalled()
  })

  it('FE-TP-ALTERNATIVES-013: a held way replaces the leg\'s vias in one write, the drive into a quiet day included', async () => {
    openFirstLeg()
    const { result, rerender } = renderAlternatives()

    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(vias.addMany).toHaveBeenCalledWith(2, [{ after_order_index: 0, lat: 49.6, lng: 10.5 }], [0])
    expect(fx.alt.close).toHaveBeenCalledTimes(1)
    expect(toast.info).not.toHaveBeenCalled()

    // The drive from day 2's last stop into the day with one stop, which draws no card.
    openFirstLeg({ drive: { kind: 'leg', index: 2 }, anchor: { dayId: 2, afterIndex: 2 }, ends: { from: 23, to: 31 }, standIn: true })
    rerender(baseOptions())
    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(vias.addMany).toHaveBeenLastCalledWith(2, [{ after_order_index: 2, lat: 49.6, lng: 10.5 }], [2])
    expect(toast.info).toHaveBeenCalledWith('roadtrip.alt.standIn', 8000)
    expect(routes.reroute).not.toHaveBeenCalled()
  })

  it('FE-TP-ALTERNATIVES-014: without pins the leg is cleared when bent, re-routed when drawn by a stand-in, and left alone otherwise', async () => {
    openFirstLeg()
    fx.pin.mockResolvedValue(proof({ pins: [] }))
    const { result, rerender } = renderAlternatives()

    await act(async () => { await result.current.chooseRouteAlternative(2) })
    expect(vias.addMany).not.toHaveBeenCalled()
    expect(routes.reroute).not.toHaveBeenCalled()
    expect(fx.alt.close).toHaveBeenCalledTimes(1)

    vias.byDay = { 2: [{ id: 5, day_id: 2, after_order_index: 0, sequence: 0, lat: 50.3, lng: 10.4 }] }
    rerender(baseOptions())
    await act(async () => { await result.current.chooseRouteAlternative(2) })
    expect(vias.addMany).toHaveBeenCalledWith(2, [], [0])

    vias.byDay = {}
    openFirstLeg({ standIn: true })
    rerender(baseOptions())
    await act(async () => { await result.current.chooseRouteAlternative(2) })
    expect(routes.reroute).toHaveBeenCalledTimes(1)
    expect(toast.info).toHaveBeenCalledWith('roadtrip.alt.standIn', 8000)
  })

  it('FE-TP-ALTERNATIVES-015: a write that fails is said in the bar and as a toast, the bar only while it is still that leg\'s', async () => {
    openFirstLeg()
    const { result } = renderAlternatives()

    vias.addMany.mockRejectedValueOnce(new Error('offline'))
    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(fx.alt.settle).toHaveBeenCalledWith('offline')
    expect(toast.error).toHaveBeenCalledWith('offline')
    expect(fx.alt.close).not.toHaveBeenCalled()

    fx.alt.settle.mockClear()
    vias.addMany.mockImplementationOnce(async () => { signal.abort(); throw 'gone' })
    await act(async () => { await result.current.chooseRouteAlternative(1) })
    expect(fx.alt.settle).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')
  })
})
