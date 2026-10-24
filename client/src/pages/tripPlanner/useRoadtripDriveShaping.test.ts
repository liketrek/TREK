// FE-TP-DRIVE-001 to FE-TP-DRIVE-016
//
// Shaping the drawn drive, driven straight through useRoadtripDriveShaping. The cards
// are plain fixtures laid along straight lines, so every distance in a case can be
// checked by hand: a tenth of a degree of latitude is about 11 km, a ten-thousandth
// about 11 metres. The stop popup's draft is real state, so the cases that hand a stop
// to the popup read what it would open with.
import { useState } from 'react'
import { act, renderHook } from '@testing-library/react'
import type { RoadtripPreferences } from '@trek/shared'
import type { RoadtripStopDraft } from '../../components/Roadtrip/RoadtripStopPopup'
import type { CorridorPoi } from '../../components/Roadtrip/useCorridorPois'
import type { RoadtripStop } from '../../components/Roadtrip/useRoadtripRoutes'
import { buildTrip } from '../../../tests/helpers/factories'
import type { Can, Translate } from './plannerTypes'
import type { RoadtripFeed } from './useRoadtripFeed'
import { useRoadtripDriveShaping } from './useRoadtripDriveShaping'

type Options = Parameters<typeof useRoadtripDriveShaping>[0]
type Card = RoadtripFeed['roadtripRoutes']['days'][number]

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }
const t: Translate = key => key
let allowed = true
const can: Can = vi.fn(() => allowed)
const trip = buildTrip({ id: 42 })

const stop = (lat: number, lng: number, over: Partial<RoadtripStop> = {}) =>
  ({ name: `${lat},${lng}`, lat, lng, stopType: null, ...over }) as RoadtripStop
const card = (over: Partial<Card>) =>
  ({ dayId: 5, dayNumber: 1, stops: [], legs: [], geometry: [], ...over }) as Card
/** A card driven due east along one parallel, from 10° to 11° of longitude. */
const eastward = (dayId: number, lat: number, stops: RoadtripStop[], over: Partial<Card> = {}) =>
  card({ dayId, dayNumber: dayId - 4, stops, geometry: [[lat, 10], [lat, 11]], ...over })

let vias: { add: ReturnType<typeof vi.fn>; move: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> }
let refuel: { ask: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> }
let corridor: { visible: CorridorPoi[]; day: Card | null; search: { spine: { lat: number; lng: number }[] }; widthKm: number; insertIndexFor: ReturnType<typeof vi.fn> }

function renderShaping(days: Card[], over: Partial<Options> = {}) {
  return renderHook(() => {
    const [stopDraft, setStopDraft] = useState<RoadtripStopDraft | null>(null)
    const shaping = useRoadtripDriveShaping({
      trip, can, toast, t,
      roadtripSettings: { roadtrip_vehicle: 'electric' } as RoadtripPreferences,
      setStopDraft,
      roadtripRoutes: { days } as unknown as RoadtripFeed['roadtripRoutes'],
      roadtripVias: vias as unknown as RoadtripFeed['roadtripVias'],
      roadtripCorridor: corridor as unknown as RoadtripFeed['roadtripCorridor'],
      refuel: refuel as unknown as RoadtripFeed['refuel'],
      ...over,
    })
    return { ...shaping, stopDraft, setStopDraft }
  })
}

const hit = (over: Partial<CorridorPoi> = {}): CorridorPoi => ({
  osm_id: 'node/1', name: 'Rasthof', lat: 52, lng: 10.5, category: 'fuel', poi_type: 'fuel',
  address: null, website: null, phone: null, opening_hours: null, cuisine: null,
  source: 'osm', offRouteKm: 0.2, alongKm: 30, ...over,
})
const dry = { legIndex: 1, intoLegKm: 10, drivenMeters: 150_000, sinceKm: 300, lat: 52, lng: 10.5 }

beforeEach(() => {
  vi.clearAllMocks()
  allowed = true
  vias = { add: vi.fn(async () => undefined), move: vi.fn(async () => undefined), remove: vi.fn(async () => undefined) }
  refuel = { ask: vi.fn(async () => undefined), close: vi.fn() }
  corridor = { visible: [], day: null, search: { spine: [] }, widthKm: 5, insertIndexFor: vi.fn(() => 1) }
})

describe('useRoadtripDriveShaping', () => {
  it('FE-TP-DRIVE-001: a click on the line is filed behind the stop it follows, by the day and index that stop is stored at', async () => {
    // The card is a date: its first stop is stored on the day before, at index 3 there.
    const days = [eastward(5, 52, [stop(52, 10, { ownerDayId: 4, ownerIndex: 3 }), stop(52, 11, { ownerDayId: 5, ownerIndex: 0 })])]
    const { result } = renderShaping(days)

    await act(async () => { await result.current.addRoadtripVia(52, 10.5) })

    expect(vias.add).toHaveBeenCalledWith(4, 3, 52, 10.5)
  })

  it('FE-TP-DRIVE-002: a stop that names no other day is filed by the numbers of its own card', async () => {
    const days = [eastward(5, 52, [stop(52, 10), stop(52, 11)])]
    const { result } = renderShaping(days)

    await act(async () => { await result.current.addRoadtripVia(52, 10.5) })

    expect(vias.add).toHaveBeenCalledWith(5, 0, 52, 10.5)
  })

  it('FE-TP-DRIVE-003: a click well off every line, on a ride, or on the hotel drive puts no via anywhere', async () => {
    const terminal = { reservationId: 1, type: 'ferry', role: 'arrival', title: 'Ferry', code: null, at: null } as const
    const days = [
      eastward(5, 52, [stop(52, 10), stop(52, 11)]),
      eastward(6, 53, [stop(53, 10, { carrier: terminal }), stop(53, 11)]),
      eastward(7, 54, [stop(54, 10, { bookend: {} as RoadtripStop['bookend'] }), stop(54, 11)]),
    ]
    const { result } = renderShaping(days)

    await act(async () => { await result.current.addRoadtripVia(52.5, 10.5) })
    await act(async () => { await result.current.addRoadtripVia(53, 10.5) })
    expect(vias.add).not.toHaveBeenCalled()
    expect(toast.info).not.toHaveBeenCalled()

    await act(async () => { await result.current.addRoadtripVia(54, 10.5) })
    expect(vias.add).not.toHaveBeenCalled()
    expect(toast.info).toHaveBeenCalledWith('roadtrip.bookend.noVia')
  })

  it('FE-TP-DRIVE-004: a pass on the hotel drive beats a pass between places only when it is clearly closer', async () => {
    const ordinary = (lat: number) => eastward(5, lat, [stop(lat, 10), stop(lat, 11)])
    const hotelDrive = (lat: number) => eastward(6, lat, [stop(lat, 10, { bookend: {} as RoadtripStop['bookend'] }), stop(lat, 11)])

    // About 20 m to the places and 10 m to the hotel drive: the same road, so the pass
    // that can take a via keeps it.
    const near = renderShaping([ordinary(52.00018), hotelDrive(51.99991)])
    await act(async () => { await near.result.current.addRoadtripVia(52, 10.5) })
    expect(vias.add).toHaveBeenCalledWith(5, 0, 52, 10.5)
    expect(toast.info).not.toHaveBeenCalled()
    near.unmount()

    // About 50 m against none at all: that is the hotel drive, and it says so.
    vias.add.mockClear()
    const apart = renderShaping([ordinary(52.00045), hotelDrive(52)])
    await act(async () => { await apart.result.current.addRoadtripVia(52, 10.5) })
    expect(vias.add).not.toHaveBeenCalled()
    expect(toast.info).toHaveBeenCalledWith('roadtrip.bookend.noVia')
  })

  it('FE-TP-DRIVE-005: a hotel drive with no place between two stops has no inner stretch to ask again', async () => {
    const bookend = {} as RoadtripStop['bookend']
    const days = [eastward(5, 52, [stop(52, 10, { bookend }), stop(52, 11, { bookend })])]
    const { result } = renderShaping(days)

    await act(async () => { await result.current.addRoadtripVia(52, 10.5) })

    expect(vias.add).not.toHaveBeenCalled()
    expect(toast.info).toHaveBeenCalledWith('roadtrip.bookend.noVia')
  })

  it('FE-TP-DRIVE-006: a point on the drive in from yesterday follows the stop it left from', async () => {
    // The card's line starts at 10° but its first stop only at 10.5°.
    const from = stop(52, 9, { ownerDayId: 4, ownerIndex: 2 })
    const days = [eastward(5, 52, [stop(52, 10.5), stop(52, 11)], { arrivingFrom: from })]
    const { result } = renderShaping(days)

    await act(async () => { await result.current.addRoadtripVia(52, 10.2) })
    expect(vias.add).toHaveBeenCalledWith(4, 2, 52, 10.2)

    // A drag on day 5 cannot take an anchor that day 4 owns.
    await act(async () => { await result.current.moveRoadtripVia(5, 9, 52, 10.2) })
    expect(vias.move).toHaveBeenCalledWith(5, 9, 52, 10.2, undefined)
  })

  it('FE-TP-DRIVE-007: a stop arrived from that names no day of its own belongs to the card', async () => {
    const days = [eastward(5, 52, [stop(52, 10.5), stop(52, 11)], { arrivingFrom: stop(52, 9) })]
    const { result } = renderShaping(days)

    await act(async () => { await result.current.addRoadtripVia(52, 10.2) })

    expect(vias.add).toHaveBeenCalledWith(5, 0, 52, 10.2)
  })

  it('FE-TP-DRIVE-008: a line with no stops on it anchors nothing', async () => {
    const days = [eastward(5, 52, [], { arrivingFrom: stop(52, 9) })]
    const { result } = renderShaping(days)

    await act(async () => { await result.current.addRoadtripVia(52, 10.5) })

    expect(vias.add).not.toHaveBeenCalled()
    expect(result.current.manualStopTargetFor(52, 10.5)).toBeNull()
  })

  it('FE-TP-DRIVE-009: a dragged via is re-pinned to the leg it landed on, and a drag that will not save is reported', async () => {
    const days = [eastward(5, 52, [stop(52, 10, { ownerDayId: 5, ownerIndex: 0 }), stop(52, 10.5, { ownerDayId: 5, ownerIndex: 1 }), stop(52, 11, { ownerDayId: 5, ownerIndex: 2 })])]
    const { result } = renderShaping(days)

    await act(async () => { await result.current.moveRoadtripVia(5, 9, 52, 10.8) })
    expect(vias.move).toHaveBeenCalledWith(5, 9, 52, 10.8, 1)

    vias.move.mockRejectedValueOnce(new Error('offline'))
    await act(async () => { await result.current.moveRoadtripVia(5, 9, 52, 10.2) })
    expect(toast.error).toHaveBeenLastCalledWith('offline')

    vias.move.mockRejectedValueOnce('nope')
    await act(async () => { await result.current.moveRoadtripVia(5, 9, 52, 10.2) })
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')
  })

  it('FE-TP-DRIVE-010: adding or removing a via that will not save is reported, whatever was thrown', async () => {
    const days = [eastward(5, 52, [stop(52, 10), stop(52, 11)])]
    const { result } = renderShaping(days)

    vias.add.mockRejectedValueOnce('nope')
    await act(async () => { await result.current.addRoadtripVia(52, 10.5) })
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')

    await act(async () => { await result.current.removeRoadtripVia(5, 9) })
    expect(vias.remove).toHaveBeenCalledWith(5, 9)

    vias.remove.mockRejectedValueOnce(new Error('gone'))
    await act(async () => { await result.current.removeRoadtripVia(5, 9) })
    expect(toast.error).toHaveBeenLastCalledWith('gone')

    vias.remove.mockRejectedValueOnce('nope')
    await act(async () => { await result.current.removeRoadtripVia(5, 9) })
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')
  })

  it('FE-TP-DRIVE-011: a reader shapes nothing at all', async () => {
    allowed = false
    corridor.visible = [hit()]
    const days = [eastward(5, 52, [stop(52, 10), stop(52, 11)], { legs: [{ mode: 'driving', distance: 68_000 }] as Card['legs'] })]
    corridor.day = days[0]
    corridor.search.spine = [{ lat: 52, lng: 10 }, { lat: 52, lng: 11 }]
    const { result } = renderShaping(days)

    await act(async () => { await result.current.addRoadtripVia(52, 10.5) })
    await act(async () => { await result.current.moveRoadtripVia(5, 9, 52, 10.5) })
    await act(async () => { await result.current.removeRoadtripVia(5, 9) })
    act(() => { result.current.acceptRefuel(5, { ...hit(), alongKm: 10 } as never, dry) })
    act(() => { result.current.dropPoiOnRoute('node/1', 52, 10.5) })

    expect(vias.add).not.toHaveBeenCalled()
    expect(vias.move).not.toHaveBeenCalled()
    expect(vias.remove).not.toHaveBeenCalled()
    expect(refuel.close).not.toHaveBeenCalled()
    expect(result.current.stopDraft).toBeNull()
  })

  it('FE-TP-DRIVE-012: a place chosen by hand goes where the card draws the stop it follows', () => {
    const departure = { reservationId: 1, type: 'flight', role: 'departure', title: 'Flight', code: null, at: null } as const
    const arrival = { ...departure, role: 'arrival' } as const
    const days = [
      // Card 6 draws two stops day 5 stores, then one of its own.
      eastward(6, 52, [
        stop(52, 10, { ownerDayId: 5, ownerIndex: 1 }),
        stop(52, 10.5, { ownerDayId: 5, ownerIndex: 2 }),
        stop(52, 11, { ownerDayId: 6, ownerIndex: 0 }),
      ]),
      eastward(7, 53, [stop(53, 10, { carrier: departure }), stop(53, 11)]),
      eastward(8, 54, [stop(54, 10, { carrier: arrival, ownerDayId: 8, ownerIndex: 0 }), stop(54, 11, { ownerDayId: 8, ownerIndex: 1 })]),
      // Stops that name no day of their own match no stored stop on any card.
      eastward(9, 55, [stop(55, 10), stop(55, 11)]),
    ]
    const { result } = renderShaping(days)

    expect(result.current.manualStopTargetFor(52, 10.7)).toMatchObject({ dayId: 6, position: 2 })
    expect(result.current.manualStopTargetFor(53, 10.5)).toBeNull()
    expect(result.current.manualStopTargetFor(54, 10.5)).toMatchObject({ dayId: 8, position: 1 })
    expect(result.current.manualStopTargetFor(55, 10.5)).toMatchObject({ dayId: 9, position: 1 })
  })

  it('FE-TP-DRIVE-013: a refuel question starts the tank at the last charge and counts only the road driven', () => {
    const days = [
      card({
        dayId: 6,
        stops: [stop(52, 10), stop(52, 10.5, { stopType: 'charging' }), stop(52, 10.8), stop(52, 11)],
        geometry: [[52, 10], [52, 11]],
        drivingGeometry: [[52, 10], [52, 10.9], [52, 11]],
        legs: [{ mode: 'driving', distance: 30_000 }, { mode: 'ferry', distance: 5_000 }, { mode: 'driving' }] as Card['legs'],
      }),
      card({ dayId: 7, stops: [stop(53, 10)], geometry: [[53, 10]] }),
    ]
    const { result } = renderShaping(days)

    act(() => { result.current.askRefuel(6, { ...dry, legIndex: 2 }) })
    expect(refuel.ask).toHaveBeenCalledWith(
      '6:2',
      { lat: 52, lng: 10.5 },
      [{ lat: 52, lng: 10 }, { lat: 52, lng: 10.9 }, { lat: 52, lng: 11 }],
      150,
      [{ lat: 52, lng: 10 }, { lat: 52, lng: 10.5 }, { lat: 52, lng: 10.8 }, { lat: 52, lng: 11 }],
      30,
    )

    // The drive in from yesterday is measured along its own line.
    act(() => { result.current.askRefuel(6, { ...dry, legIndex: 0, inboundLine: [[51, 10], [52, 10]] }) })
    expect(refuel.ask).toHaveBeenLastCalledWith('6:0', expect.anything(), [{ lat: 51, lng: 10 }, { lat: 52, lng: 10 }], 150, expect.anything(), 0)

    // A day the rail has no line for, or no day at all, asks nothing.
    refuel.ask.mockClear()
    act(() => { result.current.askRefuel(7, dry) })
    act(() => { result.current.askRefuel(99, dry) })
    expect(refuel.ask).not.toHaveBeenCalled()
  })

  it('FE-TP-DRIVE-014: with no vehicle chosen, any refuelling stop fills the tank again', () => {
    const days = [card({
      dayId: 6,
      stops: [stop(52, 10), stop(52, 10.5, { stopType: 'fuel' }), stop(52, 11)],
      geometry: [[52, 10], [52, 11]],
      legs: [{ mode: 'driving', distance: 30_000 }, { mode: 'driving', distance: 40_000 }] as Card['legs'],
    })]
    const { result } = renderShaping(days, { roadtripSettings: { roadtrip_vehicle: null } as unknown as RoadtripPreferences })

    act(() => { result.current.askRefuel(6, dry) })

    expect(refuel.ask).toHaveBeenCalledWith('6:1', expect.anything(), expect.anything(), 150, expect.anything(), 30)
  })

  it('FE-TP-DRIVE-015: an accepted station goes to the popup in front of the stop after the leg it stands on', () => {
    const days = [card({
      dayId: 6,
      dayNumber: 2,
      stops: [
        stop(52, 10, { ownerDayId: 5, ownerIndex: 1 }), stop(52, 10.2, { ownerDayId: 6, ownerIndex: 0 }),
        stop(52, 10.6, { ownerDayId: 6, ownerIndex: 1 }), stop(52, 11, { ownerDayId: 6, ownerIndex: 2 }),
      ],
      geometry: [[52, 10], [52, 11]],
      legs: [{ mode: 'ferry', distance: 5_000 }, { mode: 'driving', distance: 100_000 }, { mode: 'driving' }] as Card['legs'],
    })]
    const { result } = renderShaping(days)
    const station = { ...hit(), alongKm: 50 } as never

    act(() => { result.current.acceptRefuel(6, station, dry) })
    expect(refuel.close).toHaveBeenCalledTimes(1)
    expect(result.current.stopDraft).toMatchObject({ dayId: 6, position: 1, dayNumber: 2 })

    // Past every driving leg, the station goes in front of the stop after the dry leg.
    act(() => { result.current.acceptRefuel(6, { ...hit(), alongKm: 500 } as never, { ...dry, legIndex: 0 }) })
    expect(result.current.stopDraft).toMatchObject({ dayId: 6, position: 0 })

    // On the drive in from yesterday, and on a day the rail does not draw, nothing opens.
    refuel.close.mockClear()
    act(() => { result.current.acceptRefuel(6, station, { ...dry, inboundLine: [[51, 10], [52, 10]] }) })
    act(() => { result.current.acceptRefuel(99, station, dry) })
    expect(refuel.close).not.toHaveBeenCalled()
  })

  it('FE-TP-DRIVE-016: a hit dropped on the drive opens the popup where it was dropped, and nowhere else', () => {
    const days = [card({ dayId: 6, dayNumber: 2, stops: [stop(52, 10, { ownerDayId: 6, ownerIndex: 0 }), stop(52, 11, { ownerDayId: 6, ownerIndex: 1 })], geometry: [[52, 10], [52, 11]] })]
    corridor.visible = [hit()]
    corridor.search.spine = [{ lat: 52, lng: 10 }, { lat: 52, lng: 11 }]
    corridor.widthKm = 2

    // No day on the panel yet, a hit the panel no longer lists, a drop too far out.
    const { result, rerender } = renderShaping(days)
    act(() => { result.current.dropPoiOnRoute('node/1', 52, 10.5) })
    corridor.day = days[0]
    rerender()
    act(() => { result.current.dropPoiOnRoute('node/2', 52, 10.5) })
    act(() => { result.current.dropPoiOnRoute('node/1', 52.1, 10.5) })
    expect(result.current.stopDraft).toBeNull()

    act(() => { result.current.dropPoiOnRoute('node/1', 52, 10.5) })
    expect(corridor.insertIndexFor).toHaveBeenCalledWith(expect.objectContaining({ offRouteKm: expect.any(Number) }))
    expect(result.current.stopDraft).toMatchObject({ poi: { osm_id: 'node/1' }, dayId: 6, position: 1, dayNumber: 2 })

    // A day with no stops left has nowhere to put it.
    corridor.day = card({ dayId: 6, stops: [] })
    act(() => { result.current.setStopDraft(null) })
    act(() => { result.current.dropPoiOnRoute('node/1', 52, 10.5) })
    expect(result.current.stopDraft).toBeNull()
  })
})
