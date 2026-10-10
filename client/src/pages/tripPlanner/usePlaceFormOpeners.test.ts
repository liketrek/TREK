// FE-TP-OPENERS-001 to FE-TP-OPENERS-015
//
// Every way into the place form or the stop popup, driven straight through
// usePlaceFormOpeners. The form's fields and the popup's draft are real state in the
// harness, so each case reads what the form or the popup would open with.
import { useState } from 'react'
import { act, renderHook } from '@testing-library/react'
import type { RoadtripStopType } from '@trek/shared'
import { mapsApi } from '../../api/client'
import type { RoadtripStopDraft } from '../../components/Roadtrip/RoadtripStopPopup'
import type { CorridorPoi } from '../../components/Roadtrip/useCorridorPois'
import type { RoadtripStop } from '../../components/Roadtrip/useRoadtripRoutes'
import { buildAssignment, buildDay, buildPlace, buildTrip } from '../../../tests/helpers/factories'
import type { Accommodation, AssignmentsMap, Place } from '../../types'
import type { Can } from './plannerTypes'
import type { PlannerDialogs } from './usePlannerDialogs'
import type { RoadtripFeed } from './useRoadtripFeed'
import { usePlaceFormOpeners } from './usePlaceFormOpeners'

type Options = Parameters<typeof usePlaceFormOpeners>[0]
type Fixed = Omit<Options, 'stopDraft' | 'setStopDraft' | 'serviceStopForm' | 'setServiceStopForm' | 'serviceStopKind'
  | 'setServiceStopKind' | 'setPrefillCoords' | 'setEditingPlace' | 'setEditingAssignmentId' | 'setPlaceFormDayId'
  | 'setPlaceFormPosition' | 'setShowPlaceForm'>
type Card = RoadtripFeed['roadtripRoutes']['days'][number]

let allowed = true
const can: Can = vi.fn(() => allowed)
const trip = buildTrip({ id: 42 })

// Day 10 comes first in travel order although it is listed second; day 12 has no number.
const days = [
  buildDay({ id: 11, day_number: 2, date: '2026-05-02' }),
  buildDay({ id: 10, day_number: 1, date: '2026-05-01' }),
  buildDay({ id: 12, date: undefined }),
]
const lake = buildPlace({ id: 1, name: 'Lake', osm_id: 'node/1' })
const pump = buildPlace({ id: 2, name: 'Pump', stop_type: 'fuel', lat: 50, lng: 10.5, osm_id: 'node/2' })
const hotel = buildPlace({ id: 3, name: 'Inn', lat: 50, lng: 11, duration_minutes: undefined })
const inn = buildPlace({ id: 4, name: 'Second Inn', lat: 51, lng: 11 })
const noCoords = buildPlace({ id: 5, name: 'Note', stop_type: 'fuel', lat: null, lng: null })
const camp = buildPlace({ id: 7, name: 'Camp', stop_type: 'campsite', lat: 50, lng: 10.8 })
const assignments: AssignmentsMap = {
  10: [buildAssignment({ id: 101, place: lake, order_index: 0 }), buildAssignment({ id: 102, place: pump, order_index: 2 })],
  14: [buildAssignment({ id: 141, place: hotel, order_index: undefined })],
  11: [buildAssignment({ id: 111, place: inn, order_index: 1 })],
  12: [buildAssignment({ id: 121, place: camp, order_index: 0 })],
}
const stay = (over: Partial<Accommodation>) => ({ id: 70, trip_id: 42, start_day_id: 14, end_day_id: 12, ...over }) as Accommodation

const stop = (over: Partial<RoadtripStop>) => ({ name: 'Stop', lat: 50, lng: 10, stopType: null, ...over }) as RoadtripStop
/** Day 10's card: a lake, the pump, and a stop at the end, driven east from 10° to 11°. */
const card = (): Card => ({
  dayId: 10, dayNumber: 1,
  stops: [
    stop({ assignmentId: 101, ownerDayId: 10, ownerIndex: 0, name: 'Lake', lng: 10 }),
    stop({ assignmentId: 102, ownerDayId: 10, ownerIndex: 1, name: 'Pump', lng: 10.5 }),
    stop({ assignmentId: 103, ownerDayId: 10, ownerIndex: 2, name: 'Town', lng: 11 }),
  ],
  legs: [{ mode: 'driving', distance: 100_000, duration: 3_600 }, { mode: 'driving', distance: 100_000, duration: 3_600 }],
  schedule: { entries: [{ arrival: '09:00', departure: '09:30' }, { arrival: '11:15', departure: '11:45' }, { arrival: '13:00' }] },
  geometry: [[50, 10], [50, 11]],
}) as unknown as Card

const hit = (over: Partial<CorridorPoi> = {}): CorridorPoi => ({
  osm_id: 'node/9', name: 'Rasthof', lat: 50, lng: 10.25, category: 'fuel', poi_type: 'fuel',
  address: 'A7', website: 'rasthof.example', phone: '123', opening_hours: null, cuisine: null,
  source: 'osm', offRouteKm: 0.2, alongKm: 17, ...over,
})

let corridor: { day: { dayId: number; dayNumber: number } | null; insertIndexFor: ReturnType<typeof vi.fn> }
let fixed: Fixed

function renderOpeners(over: Partial<Fixed> = {}, draft: RoadtripStopDraft | null = null) {
  const options = { ...fixed, ...over }
  return renderHook(() => {
    const [prefillCoords, setPrefillCoords] = useState<PlannerDialogs['prefillCoords']>(null)
    const [editingPlace, setEditingPlace] = useState<Place | null>(null)
    const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null)
    const [placeFormDayId, setPlaceFormDayId] = useState<number | null>(null)
    const [placeFormPosition, setPlaceFormPosition] = useState<number | null>(null)
    const [showPlaceForm, setShowPlaceForm] = useState(false)
    const [serviceStopForm, setServiceStopForm] = useState(false)
    const [serviceStopKind, setServiceStopKind] = useState<RoadtripStopType | null>(null)
    const [stopDraft, setStopDraft] = useState<RoadtripStopDraft | null>(draft)
    const openers = usePlaceFormOpeners({
      ...options, stopDraft, setStopDraft, serviceStopForm, setServiceStopForm, serviceStopKind, setServiceStopKind,
      setPrefillCoords, setEditingPlace, setEditingAssignmentId, setPlaceFormDayId, setPlaceFormPosition, setShowPlaceForm,
    })
    const form = { prefillCoords, editingPlace, editingAssignmentId, placeFormDayId, placeFormPosition, showPlaceForm, serviceStopForm, serviceStopKind }
    return { ...openers, form, stopDraft, setPrefillCoords }
  })
}

const rightClick = (lat: number, lng: number) => ({ originalEvent: { preventDefault: vi.fn() }, latlng: { lat, lng } })

beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  allowed = true
  corridor = { day: { dayId: 10, dayNumber: 1 }, insertIndexFor: vi.fn(() => 1) }
  fixed = {
    trip, can, placeLang: 'de', isMobile: false, days, places: [lake, pump, hotel, inn, noCoords, camp], assignments,
    tripAccommodations: [], handlePlaceClick: vi.fn(), isTourPlace: id => id === 1,
    roadtripActive: false, roadtripFeedActive: false,
    roadtripRoutes: { days: [card()] } as unknown as RoadtripFeed['roadtripRoutes'],
    roadtripCorridor: corridor as unknown as RoadtripFeed['roadtripCorridor'],
    manualStopTargetFor: vi.fn(() => null),
  }
})

describe('usePlaceFormOpeners', () => {
  it('FE-TP-OPENERS-001: a right click opens the form on the spot and names it once the address is known', async () => {
    const reverse = vi.spyOn(mapsApi, 'reverse').mockResolvedValue({ name: 'Cafe', address: null } as never)
    const { result } = renderOpeners()
    const event = rightClick(50, 10)

    await act(async () => { await result.current.handleMapContextMenu(event, 10) })

    expect(event.originalEvent.preventDefault).toHaveBeenCalled()
    expect(reverse).toHaveBeenCalledWith(50, 10, 'de')
    expect(result.current.form).toMatchObject({
      prefillCoords: { lat: 50, lng: 10, name: 'Cafe', address: '' },
      editingPlace: null, editingAssignmentId: null, placeFormDayId: 10, serviceStopForm: false, showPlaceForm: true,
    })
  })

  it('FE-TP-OPENERS-002: a place the map cannot name keeps its bare coordinates, and a closed form stays closed', async () => {
    const reverse = vi.spyOn(mapsApi, 'reverse').mockResolvedValueOnce({ name: null, address: null } as never)
    const { result } = renderOpeners()

    await act(async () => { await result.current.handleMapContextMenu(rightClick(50, 10)) })
    expect(result.current.form.prefillCoords).toEqual({ lat: 50, lng: 10 })
    expect(result.current.form.placeFormDayId).toBeNull()

    let answer: (value: unknown) => void = () => undefined
    reverse.mockReturnValueOnce(new Promise(resolve => { answer = resolve }) as never)
    let pending: Promise<void> = Promise.resolve()
    act(() => { pending = result.current.handleMapContextMenu(rightClick(51, 11)) })
    act(() => { result.current.setPrefillCoords(null) })
    await act(async () => { answer({ name: 'Late', address: 'Somewhere' }); await pending })
    expect(result.current.form.prefillCoords).toBeNull()

    reverse.mockRejectedValueOnce(new Error('offline'))
    await act(async () => { await result.current.handleMapContextMenu(rightClick(52, 12)) })
    expect(result.current.form.prefillCoords).toEqual({ lat: 52, lng: 12 })

    reverse.mockResolvedValueOnce({ name: null, address: 'Main St 1' } as never)
    await act(async () => { await result.current.handleMapContextMenu(rightClick(53, 13)) })
    expect(result.current.form.prefillCoords).toEqual({ lat: 53, lng: 13, name: '', address: 'Main St 1' })
  })

  it('FE-TP-OPENERS-003: a reader opens neither the form nor the popup from the map', async () => {
    allowed = false
    const reverse = vi.spyOn(mapsApi, 'reverse')
    const { result } = renderOpeners({ roadtripFeedActive: true })

    await act(async () => { await result.current.handleMapContextMenu(rightClick(50, 10)) })
    act(() => { result.current.openAddPlaceFromPoi(hit()) })
    act(() => { result.current.handlePoiClick(hit()) })
    act(() => { result.current.openManualRoadtripStop('fuel') })
    act(() => { result.current.openPlaceEditor(lake) })

    expect(reverse).not.toHaveBeenCalled()
    expect(result.current.form.showPlaceForm).toBe(false)
    expect(result.current.stopDraft).toBeNull()
  })

  it('FE-TP-OPENERS-004: a POI fills the form with what it knows, the stop it was meant as included', () => {
    const { result } = renderOpeners()

    act(() => { result.current.openAddPlaceFromPoi(hit({ address: null, website: 'javascript:alert(1)', phone: null, poi_type: null }), 10, 3, { stopType: 'fuel', dwellMinutes: 15 }) })

    expect(result.current.form).toMatchObject({
      prefillCoords: {
        lat: 50, lng: 10.25, name: 'Rasthof', address: '', website: undefined, phone: undefined,
        osm_id: 'node/9', category: 'fuel', stop_type: 'fuel', duration_minutes: 15,
      },
      placeFormDayId: 10, placeFormPosition: 3, showPlaceForm: true, serviceStopForm: false,
    })

    act(() => { result.current.openAddPlaceFromPoi(hit({ category: null, poi_type: 'museum' })) })
    expect(result.current.form.prefillCoords).toMatchObject({ category: 'museum', stop_type: null, website: 'https://rasthof.example', phone: '123' })
    expect(result.current.form.placeFormDayId).toBeNull()
    expect(result.current.form.placeFormPosition).toBeNull()
  })

  it('FE-TP-OPENERS-005: a hit on the drive opens the popup at its place in the chain, with the time it is reached', () => {
    const { result } = renderOpeners({ roadtripFeedActive: true })

    act(() => { result.current.handlePoiClick(hit()) })

    expect(corridor.insertIndexFor).toHaveBeenCalledWith(expect.objectContaining({ alongKm: 17 }))
    expect(result.current.stopDraft).toEqual({ poi: hit(), arrivalTime: '09:40', dayId: 10, position: 1, dayNumber: 1 })
    expect(result.current.form.showPlaceForm).toBe(false)
  })

  it('FE-TP-OPENERS-006: a hit somebody could sleep at offers the days after it, in travel order', () => {
    const { result } = renderOpeners({ roadtripFeedActive: true })

    act(() => { result.current.handlePoiClick(hit({ category: 'hotel' })) })

    expect(result.current.stopDraft?.overnight).toEqual({
      days: [{ id: 10, number: 1, date: '2026-05-01' }, { id: 11, number: 2, date: '2026-05-02' }, { id: 12, number: 0, date: null }],
      defaultEndDayId: 11,
    })
  })

  it('FE-TP-OPENERS-007: a night on a day the trip does not list, or on a trip with no days, still has an end', () => {
    corridor.insertIndexFor.mockReturnValue(0)
    const elsewhere = { ...card(), stops: [stop({ assignmentId: 991, ownerDayId: 99, ownerIndex: 0 })] } as Card
    const routes = { days: [elsewhere] } as unknown as RoadtripFeed['roadtripRoutes']

    const listed = renderOpeners({ roadtripFeedActive: true, roadtripRoutes: routes })
    act(() => { listed.result.current.handlePoiClick(hit({ category: 'campsite' })) })
    expect(listed.result.current.stopDraft?.overnight).toMatchObject({ defaultEndDayId: 11 })
    expect(listed.result.current.stopDraft?.overnight?.days).toHaveLength(3)
    listed.unmount()

    const empty = renderOpeners({ roadtripFeedActive: true, roadtripRoutes: routes, days: [] })
    act(() => { empty.result.current.handlePoiClick(hit({ category: 'hotel' })) })
    expect(empty.result.current.stopDraft?.overnight).toEqual({ days: [], defaultEndDayId: 99 })
  })

  it('FE-TP-OPENERS-008: a hit on a day the rail draws no card for opens nothing', () => {
    const { result } = renderOpeners({ roadtripFeedActive: true, roadtripRoutes: { days: [] } as unknown as RoadtripFeed['roadtripRoutes'] })

    act(() => { result.current.handlePoiClick(hit()) })

    expect(result.current.stopDraft).toBeNull()
    expect(result.current.form.showPlaceForm).toBe(false)
  })

  it('FE-TP-OPENERS-009: a plain POI goes to the form, onto the searched day while the drive is fed', () => {
    const plain = { lat: 50, lng: 10.2, name: 'Museum', address: null, website: null, phone: null, osm_id: 'node/5' }

    const fed = renderOpeners({ roadtripFeedActive: true })
    act(() => { fed.result.current.handlePoiClick(plain) })
    expect(fed.result.current.form).toMatchObject({ placeFormDayId: 10, showPlaceForm: true })
    fed.unmount()

    const undrawn = renderOpeners({ roadtripFeedActive: true, roadtripRoutes: { days: [] } as unknown as RoadtripFeed['roadtripRoutes'] })
    act(() => { undrawn.result.current.handlePoiClick(plain) })
    expect(undrawn.result.current.form.placeFormDayId).toBe(10)
    undrawn.unmount()

    // Outside the drive even a corridor hit is just a place, and the day is left to the traveller.
    const off = renderOpeners()
    act(() => { off.result.current.handlePoiClick(hit()) })
    expect(off.result.current.stopDraft).toBeNull()
    expect(off.result.current.form).toMatchObject({ placeFormDayId: null, showPlaceForm: true })
  })

  it('FE-TP-OPENERS-010: a service stop by hand opens an empty form, and the legs it can go on come with it', () => {
    const targetFor = vi.fn(() => null)
    const { result } = renderOpeners({ roadtripCorridor: { ...corridor, day: card() } as unknown as RoadtripFeed['roadtripCorridor'], manualStopTargetFor: targetFor })
    expect(result.current.serviceStopMode).toBeNull()

    act(() => { result.current.openManualRoadtripStop('charging') })

    expect(result.current.form).toMatchObject({
      prefillCoords: null, editingPlace: null, editingAssignmentId: null, placeFormDayId: null, placeFormPosition: null,
      serviceStopKind: 'charging', serviceStopForm: true, showPlaceForm: true,
    })
    const mode = result.current.serviceStopMode!
    expect(mode.defaultKind).toBe('charging')
    expect(mode.days).toHaveLength(1)
    expect(mode.days[0]).toMatchObject({ dayId: 10, dayNumber: 1, stops: ['Lake', 'Pump', 'Town'] })
    expect(mode.days[0].legLines).toHaveLength(2)
    expect(mode.appendDay).toEqual({ dayId: 10, dayNumber: 1, position: 3 })
    expect(mode.targetFor).toBe(targetFor)
  })

  it('FE-TP-OPENERS-011: without a day on the panel the service stop has no end to append to, and an unrouted day is left out', () => {
    const unrouted = { ...card(), dayId: 11, geometry: [[50, 10]] } as Card
    const { result } = renderOpeners({
      roadtripCorridor: { ...corridor, day: null } as unknown as RoadtripFeed['roadtripCorridor'],
      roadtripRoutes: { days: [card(), unrouted] } as unknown as RoadtripFeed['roadtripRoutes'],
    })

    act(() => { result.current.openManualRoadtripStop() })

    expect(result.current.form.serviceStopKind).toBeNull()
    expect(result.current.serviceStopMode?.appendDay).toBeNull()
    expect(result.current.serviceStopMode?.days.map(day => day.dayId)).toEqual([10])
  })

  it('FE-TP-OPENERS-012: the popup hands over to the full form, for a new stop and for one being edited', () => {
    const draft = { poi: hit(), dayId: 10, position: 2, dayNumber: 1 }

    const fresh = renderOpeners({}, draft)
    expect(fresh.result.current.stopDraftDuplicate).toBeNull()
    act(() => { fresh.result.current.stopDraftToForm({ stopType: 'fuel', dwellMinutes: 20 }) })
    expect(fresh.result.current.stopDraft).toBeNull()
    expect(fresh.result.current.form).toMatchObject({
      prefillCoords: { name: 'Rasthof', stop_type: 'fuel', duration_minutes: 20 }, placeFormDayId: 10, placeFormPosition: 2, showPlaceForm: true,
    })
    // Nothing left to hand over.
    act(() => { fresh.result.current.stopDraftToForm() })
    expect(fresh.result.current.form.showPlaceForm).toBe(true)
    fresh.unmount()

    const editing = { ...draft, editing: { placeId: 2, dwellMinutes: 15, stopType: 'fuel' as const } }
    const edit = renderOpeners({}, editing)
    expect(edit.result.current.stopDraftDuplicate).toBeNull()
    act(() => { edit.result.current.stopDraftToForm() })
    expect(edit.result.current.form).toMatchObject({ editingPlace: pump, editingAssignmentId: 102, showPlaceForm: true, prefillCoords: null })
    edit.unmount()

    // A stop deleted meanwhile only closes the popup.
    const gone = renderOpeners({}, { ...draft, editing: { placeId: 77, dwellMinutes: 15, stopType: null } })
    act(() => { gone.result.current.stopDraftToForm() })
    expect(gone.result.current.stopDraft).toBeNull()
    expect(gone.result.current.form.showPlaceForm).toBe(false)
  })

  it('FE-TP-OPENERS-013: the popup names a place on the trip that came from the same map object', () => {
    const same = renderOpeners({}, { poi: hit({ osm_id: 'node/2' }), dayId: 10, position: 2, dayNumber: 1 })
    expect(same.result.current.stopDraftDuplicate).toBe('Pump')
    same.unmount()

    const none = renderOpeners({}, { poi: hit({ osm_id: '' }), dayId: 10, position: 2, dayNumber: 1 })
    expect(none.result.current.stopDraftDuplicate).toBeNull()
  })

  it('FE-TP-OPENERS-014: the place editor opens the popup for a stop or a night of the drive, and the form otherwise', () => {
    const tripAccommodations = [
      stay({ id: 70, place_id: 3, start_day_id: 14, end_day_id: 12, check_in: '15:00', check_out: '10:00' }),
      // Booked on another day than the visit being opened.
      stay({ id: 71, place_id: 4, start_day_id: 10, end_day_id: 11 }),
    ]
    const { result } = renderOpeners({ roadtripActive: true, tripAccommodations })

    act(() => { result.current.openPlaceEditor(pump) })
    expect(result.current.stopDraft).toMatchObject({
      poi: { osm_id: 'node/2', name: 'Pump', category: 'fuel', source: 'trek' },
      arrivalTime: '11:15', dayId: 10, dayNumber: 1, position: 2,
      editing: { placeId: 2, stopType: 'fuel', dwellMinutes: 60, accommodationId: undefined, checkIn: '', checkOut: '' },
    })
    expect(result.current.stopDraft?.overnight).toBeUndefined()

    // A night on a day the trip no longer lists: no number, no time, and the stay's own end.
    act(() => { result.current.openPlaceEditor(hotel) })
    expect(result.current.stopDraft).toMatchObject({
      poi: { category: 'hotel', osm_id: '' }, arrivalTime: null, dayId: 14, dayNumber: 0, position: 0,
      editing: { placeId: 3, stopType: 'hotel', dwellMinutes: 30, accommodationId: 70, checkIn: '15:00', checkOut: '10:00' },
      overnight: { defaultEndDayId: 12 },
    })

    act(() => { result.current.openPlaceEditor(inn, 111) })
    expect(result.current.stopDraft).toMatchObject({ dayId: 11, position: 1, editing: { stopType: null, accommodationId: undefined } })
    expect(result.current.stopDraft?.overnight).toBeUndefined()
    expect(result.current.form.showPlaceForm).toBe(false)

    // A campsite with no night booked yet can still become one, ending the day after.
    act(() => { result.current.openPlaceEditor(camp) })
    expect(result.current.stopDraft).toMatchObject({ dayId: 12, dayNumber: 0, editing: { stopType: 'campsite' }, overnight: { defaultEndDayId: 12 } })

    // No visit to open, or no coordinates to put on the drive: the full form.
    act(() => { result.current.openPlaceEditor(noCoords) })
    expect(result.current.form).toMatchObject({ editingPlace: noCoords, editingAssignmentId: null, showPlaceForm: true })
    act(() => { result.current.openPlaceEditor({ ...pump, id: 6 }) })
    expect(result.current.form.editingPlace?.id).toBe(6)
  })

  it('FE-TP-OPENERS-015: an ordinary place opens the form on its one visit, a tour on the phone selects it instead', () => {
    const { result } = renderOpeners()

    act(() => { result.current.openPlaceEditor(pump) })
    expect(result.current.stopDraft).toBeNull()
    expect(result.current.form).toMatchObject({ editingPlace: pump, editingAssignmentId: 102, placeFormDayId: null, serviceStopForm: false, showPlaceForm: true })

    act(() => { result.current.openPlaceEditor(lake, 555) })
    expect(result.current.form.editingAssignmentId).toBe(555)

    const phone = renderOpeners({ isMobile: true })
    act(() => { phone.result.current.openPlaceEditor(lake, 101) })
    act(() => { phone.result.current.openPlaceEditor(pump) })
    expect(fixed.handlePlaceClick).toHaveBeenCalledTimes(1)
    expect(fixed.handlePlaceClick).toHaveBeenCalledWith(1, 101)
    expect(phone.result.current.form.editingPlace).toBe(pump)
  })
})
