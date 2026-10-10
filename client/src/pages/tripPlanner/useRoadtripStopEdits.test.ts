// FE-TP-STOPEDITS-001 to FE-TP-STOPEDITS-016
//
// Edits to one stop on the drive, driven straight through useRoadtripStopEdits. The
// stop popup's draft and the stay release question are real state in the harness, so
// each case watches the hook open, answer and close them the way the planner does.
import { useState } from 'react'
import { act, renderHook } from '@testing-library/react'
import { accommodationsApi } from '../../api/client'
import type { RoadtripStopDraft } from '../../components/Roadtrip/RoadtripStopPopup'
import { reanchorAfterInsert, reanchorAfterRemove, reanchorAfterReorder } from '../../components/Roadtrip/roadtripModel'
import type { CorridorPoi } from '../../components/Roadtrip/useCorridorPois'
import type { RoadtripStop } from '../../components/Roadtrip/useRoadtripRoutes'
import { useTripStore, type TripStoreState } from '../../store/tripStore'
import { resetAllStores } from '../../../tests/helpers/store'
import { buildAssignment, buildPlace, buildReservation, buildTrip } from '../../../tests/helpers/factories'
import type { Accommodation, AssignmentsMap } from '../../types'
import type { Can, Translate } from './plannerTypes'
import type { PlannerDialogs } from './usePlannerDialogs'
import type { RoadtripFeed } from './useRoadtripFeed'
import { useRoadtripStopEdits } from './useRoadtripStopEdits'

type Options = Parameters<typeof useRoadtripStopEdits>[0]
type Fixed = Omit<Options, 'stopDraft' | 'setStopDraft' | 'stayRelease' | 'setStayRelease'>
type Via = { id: number; day_id: number; after_order_index: number; sequence: number; lat: number; lng: number }

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }
const t: Translate = key => key
let allowed = true
const can: Can = vi.fn(() => allowed)
const trip = buildTrip({ id: 42 })

// Day 1 holds a note without coordinates between its stops; day 3 is empty.
const lake = buildPlace({ id: 1, lat: 50, lng: 10 })
const note = buildPlace({ id: 2, lat: null, lng: null })
const castle = buildPlace({ id: 3, lat: 50, lng: 11 })
const pump = buildPlace({ id: 4, lat: 50, lng: 12 })
const harbour = buildPlace({ id: 5, lat: 51, lng: 10 })
const hotel = buildPlace({ id: 6, lat: 51, lng: 11 })
const assignments: AssignmentsMap = {
  1: [
    buildAssignment({ id: 13, day_id: 1, place: castle, order_index: 2 }),
    buildAssignment({ id: 11, day_id: 1, place: lake, order_index: 0 }),
    buildAssignment({ id: 14, day_id: 1, place: pump, order_index: 3 }),
    buildAssignment({ id: 12, day_id: 1, place: note, order_index: 1 }),
  ],
  2: [
    buildAssignment({ id: 22, day_id: 2, place: hotel, order_index: 1 }),
    buildAssignment({ id: 21, day_id: 2, place: harbour, order_index: 0 }),
  ],
  3: [],
}
const routable: Record<number, number[]> = { 1: [11, 13, 14], 2: [21, 22], 3: [] }

function makeActions() {
  return {
    updatePlace: vi.fn(async () => undefined),
    addPlace: vi.fn(async (): Promise<{ id: number } | null> => ({ id: 900 })),
    assignPlaceToDay: vi.fn(async () => ({ id: 555 })),
    refreshDays: vi.fn(async () => undefined),
    reorderAssignments: vi.fn(async () => undefined),
    setAssignmentEndDay: vi.fn(async () => undefined),
    moveAssignment: vi.fn(async () => undefined),
  }
}

let actions: ReturnType<typeof makeActions>
let vias: { byDay: Record<number, Via[]>; reanchor: ReturnType<typeof vi.fn> }
let boundaries: { boundaries: Array<{ day_number: number; from_assignment_id: number; to_assignment_id: number | null; fraction: number }>; save: ReturnType<typeof vi.fn> }
let fixed: Fixed

const hit = (over: Partial<CorridorPoi> = {}): CorridorPoi => ({
  osm_id: 'node/1', name: 'Rasthof', lat: 50, lng: 10.5, category: 'fuel', poi_type: 'fuel',
  address: 'A7', website: 'https://rasthof.example', phone: null, opening_hours: null, cuisine: null,
  source: 'osm', offRouteKm: 0.2, alongKm: 30, ...over,
})
const stop = (over: Partial<RoadtripStop>) => ({ assignmentId: 13, ownerDayId: 1, endDay: false, ...over }) as RoadtripStop

function renderEdits(draft: RoadtripStopDraft | null = null, over: Partial<Fixed> = {}) {
  const options = { ...fixed, ...over }
  return renderHook(() => {
    const [stopDraft, setStopDraft] = useState<RoadtripStopDraft | null>(draft)
    const [stayRelease, setStayRelease] = useState<PlannerDialogs['stayRelease']>(null)
    const edits = useRoadtripStopEdits({ ...options, stopDraft, setStopDraft, stayRelease, setStayRelease })
    return { ...edits, stopDraft, stayRelease }
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  resetAllStores()
  allowed = true
  actions = makeActions()
  vias = {
    byDay: {
      1: [
        { id: 7, day_id: 1, after_order_index: 0, sequence: 0, lat: 50, lng: 10.2 },
        { id: 8, day_id: 1, after_order_index: 0, sequence: 1, lat: 50, lng: 10.8 },
        { id: 9, day_id: 1, after_order_index: 1, sequence: 0, lat: 50, lng: 11.5 },
      ],
      2: [{ id: 10, day_id: 2, after_order_index: 0, sequence: 0, lat: 51, lng: 10.5 }],
    },
    reanchor: vi.fn(async () => undefined),
  }
  boundaries = { boundaries: [], save: vi.fn(async () => true) }
  fixed = {
    tripId: 42, trip, can, toast, t,
    tripActions: { ...useTripStore.getState(), ...actions } as unknown as TripStoreState,
    assignments, tripAccommodations: [], reservations: [],
    loadAccommodations: vi.fn(),
    updateRouteForDay: vi.fn(async () => undefined),
    roadtripVias: vias as unknown as RoadtripFeed['roadtripVias'],
    // The via on the near side of the new stop stays on the first half of the split leg.
    viaLiesBefore: (_dayId, at) => via => via.lng < at.lng,
    roadtripStopsOf: dayId => (assignments[String(dayId)] ?? [])
      .filter(a => routable[dayId]?.includes(a.id))
      .sort((a, b) => a.order_index - b.order_index),
    dailyTimesActive: true,
    dayBoundaries: boundaries as unknown as RoadtripFeed['dayBoundaries'],
  }
})

describe('useRoadtripStopEdits', () => {
  it('FE-TP-STOPEDITS-001: a new hit becomes a stop at its place in the drive, with the vias corrected first', async () => {
    const order: string[] = []
    actions.assignPlaceToDay.mockImplementation(async () => { order.push('assign'); return { id: 555 } })
    vias.reanchor.mockImplementation(async () => { order.push('reanchor') })
    vi.mocked(fixed.updateRouteForDay).mockImplementation(async () => { order.push('route') })
    const { result } = renderEdits({ poi: hit(), dayId: 1, position: 1, dayNumber: 1 })

    await act(async () => { await result.current.saveStopDraft({ stopType: 'fuel', dwellMinutes: 15 }) })

    expect(actions.addPlace).toHaveBeenCalledWith(42, {
      name: 'Rasthof', lat: 50, lng: 10.5, address: 'A7', website: 'https://rasthof.example', phone: undefined,
      osm_id: 'node/1', duration_minutes: 15, stop_type: 'fuel',
    })
    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 1, 900, 1)
    expect(vias.reanchor).toHaveBeenCalledWith(1, {
      vias: [{ id: 8, after_order_index: 1 }, { id: 9, after_order_index: 2 }],
      remove: [],
    })
    expect(order).toEqual(['assign', 'reanchor', 'route'])
    expect(fixed.updateRouteForDay).toHaveBeenCalledWith(1)
    expect(result.current.stopDraft).toBeNull()
    expect(toast.success).toHaveBeenCalledWith('trip.toast.placeAdded')
  })

  it('FE-TP-STOPEDITS-002: without a draft nothing is saved, and a place that came back without an id is not assigned', async () => {
    const empty = renderEdits()
    await act(async () => {
      await empty.result.current.saveStopDraft({ stopType: 'fuel', dwellMinutes: 15 })
      await empty.result.current.saveStopDraftAsNight({ endDayId: 2, checkIn: '', checkOut: '' })
    })
    expect(actions.addPlace).not.toHaveBeenCalled()

    actions.addPlace.mockResolvedValueOnce(null)
    const { result } = renderEdits({ poi: hit({ address: null, website: null, phone: '+49 1' }), dayId: 1, position: 1, dayNumber: 1 })
    await act(async () => { await result.current.saveStopDraft({ stopType: null, dwellMinutes: 30 }) })

    expect(actions.addPlace).toHaveBeenCalledWith(42, expect.objectContaining({ address: null, website: undefined, phone: '+49 1' }))
    expect(actions.assignPlaceToDay).not.toHaveBeenCalled()
    expect(vias.reanchor).not.toHaveBeenCalled()
    expect(result.current.stopDraft).toBeNull()
    expect(toast.success).toHaveBeenCalledWith('trip.toast.placeAdded')
  })

  it('FE-TP-STOPEDITS-003: editing a stop rewrites its kind and stay and re-routes its day', async () => {
    const editing = { placeId: 3, dwellMinutes: 20, stopType: null }
    const { result } = renderEdits({ poi: hit(), dayId: 1, position: 2, dayNumber: 1, editing })

    await act(async () => { await result.current.saveStopDraft({ stopType: 'rest_area', dwellMinutes: 25 }) })

    expect(actions.updatePlace).toHaveBeenCalledWith(42, 3, { stop_type: 'rest_area', duration_minutes: 25 })
    expect(actions.addPlace).not.toHaveBeenCalled()
    expect(fixed.updateRouteForDay).toHaveBeenCalledWith(1)
    expect(result.current.stopDraft).toBeNull()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('FE-TP-STOPEDITS-004: turning a booked night into a pause asks first, and the yes drops only the night', async () => {
    const deleteStay = vi.spyOn(accommodationsApi, 'delete').mockResolvedValue({ assignment: null })
    const stays = [{ id: 31, place_id: 3, reservation_title: 'Old Inn' }] as Accommodation[]
    const reservations = [buildReservation({ id: 61, title: 'Castle Hotel', accommodation_id: 31 })]
    const editing = { placeId: 3, dwellMinutes: 600, stopType: 'hotel' as const, accommodationId: 31 }
    const draft = { poi: hit({ name: 'Castle' }), dayId: 1, position: 2, dayNumber: 1, editing }
    const { result } = renderEdits(draft, { tripAccommodations: stays, reservations })

    await act(async () => { await result.current.saveStopDraft({ stopType: 'rest_area', dwellMinutes: 30 }) })
    expect(result.current.stayRelease).toEqual({ stop: { stopType: 'rest_area', dwellMinutes: 30 }, name: 'Castle', booking: 'Castle Hotel' })
    expect(actions.updatePlace).not.toHaveBeenCalled()
    expect(result.current.stopDraft).toBe(draft)

    await act(async () => { await result.current.confirmStayRelease() })
    expect(result.current.stayRelease).toBeNull()
    expect(actions.updatePlace).toHaveBeenCalledWith(42, 3, { stop_type: 'rest_area', duration_minutes: 30 })
    expect(deleteStay).toHaveBeenCalledWith(42, 31, { keepStop: true })
    expect(fixed.loadAccommodations).toHaveBeenCalled()
    expect(fixed.updateRouteForDay).toHaveBeenCalledWith(1)
    expect(result.current.stopDraft).toBeNull()

    // Nothing pending: the yes only closes the question.
    await act(async () => { await result.current.confirmStayRelease() })
    expect(actions.updatePlace).toHaveBeenCalledTimes(1)
  })

  it('FE-TP-STOPEDITS-005: the question names the booking the stay remembers, or none', async () => {
    const editing = { placeId: 3, dwellMinutes: 600, stopType: 'hotel' as const, accommodationId: 31 }
    const draft = { poi: hit({ name: 'Castle' }), dayId: 1, position: 2, dayNumber: 1, editing }

    const remembered = renderEdits(draft, { tripAccommodations: [{ id: 31, reservation_title: 'Old Inn' }] as Accommodation[] })
    await act(async () => { await remembered.result.current.saveStopDraft({ stopType: null, dwellMinutes: 30 }) })
    expect(remembered.result.current.stayRelease?.booking).toBe('Old Inn')

    const unknown = renderEdits(draft)
    await act(async () => { await unknown.result.current.saveStopDraft({ stopType: null, dwellMinutes: 30 }) })
    expect(unknown.result.current.stayRelease?.booking).toBeNull()
  })

  it('FE-TP-STOPEDITS-006: a save that fails keeps the popup open and says why', async () => {
    const { result } = renderEdits({ poi: hit(), dayId: 1, position: 1, dayNumber: 1 })

    actions.addPlace.mockRejectedValueOnce(new Error('offline'))
    await act(async () => { await result.current.saveStopDraft({ stopType: 'fuel', dwellMinutes: 15 }) })
    expect(toast.error).toHaveBeenLastCalledWith('offline')
    expect(result.current.stopDraft).not.toBeNull()

    actions.addPlace.mockRejectedValueOnce('nope')
    await act(async () => { await result.current.saveStopDraftAsNight({ endDayId: 2, checkIn: '', checkOut: '' }) })
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')
    expect(result.current.stopDraft).not.toBeNull()
  })

  it('FE-TP-STOPEDITS-007: a hit kept as a night becomes a stop with its booking, the times only when given', async () => {
    const create = vi.spyOn(accommodationsApi, 'create').mockResolvedValue({})
    const draft = { poi: hit({ name: 'Camping Elbe', category: 'campsite' }), dayId: 1, position: 1, dayNumber: 1 }
    const { result } = renderEdits(draft)

    await act(async () => { await result.current.saveStopDraftAsNight({ endDayId: 2, checkIn: '15:00', checkOut: '' }) })

    expect(actions.addPlace).toHaveBeenCalledWith(42, expect.objectContaining({ name: 'Camping Elbe', stop_type: 'campsite' }))
    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 1, 900, 1)
    expect(create).toHaveBeenCalledWith(42, { place_id: 900, start_day_id: 1, end_day_id: 2, check_in: '15:00' })
    expect(fixed.loadAccommodations).toHaveBeenCalled()
    expect(vias.reanchor).toHaveBeenCalledWith(1, expect.objectContaining({ remove: [] }))
    expect(fixed.updateRouteForDay).toHaveBeenCalledWith(1)
    expect(result.current.stopDraft).toBeNull()
    expect(toast.success).toHaveBeenCalledWith('roadtrip.stay.nightAdded')

    // A hotel hit, both times given, and a place that came back without an id.
    const second = renderEdits({ poi: hit({ category: 'hotel' }), dayId: 1, position: 1, dayNumber: 1 })
    await act(async () => { await second.result.current.saveStopDraftAsNight({ endDayId: 2, checkIn: '15:00', checkOut: '10:00' }) })
    expect(actions.addPlace).toHaveBeenLastCalledWith(42, expect.objectContaining({ stop_type: 'hotel' }))
    expect(create).toHaveBeenLastCalledWith(42, { place_id: 900, start_day_id: 1, end_day_id: 2, check_in: '15:00', check_out: '10:00' })

    actions.addPlace.mockResolvedValueOnce(null)
    const third = renderEdits({ poi: hit({ category: 'hotel' }), dayId: 1, position: 1, dayNumber: 1 })
    await act(async () => { await third.result.current.saveStopDraftAsNight({ endDayId: 2, checkIn: '', checkOut: '' }) })
    expect(create).toHaveBeenCalledTimes(2)
    expect(third.result.current.stopDraft).toBeNull()
  })

  it('FE-TP-STOPEDITS-008: an existing stop kept as a night books it, or moves the booking it has', async () => {
    const create = vi.spyOn(accommodationsApi, 'create').mockResolvedValue({})
    const moved = buildAssignment({ id: 13, day_id: 2, place: castle })
    const update = vi.spyOn(accommodationsApi, 'update').mockResolvedValue({ movedAssignment: { assignment: moved, oldDayId: 1 } })
    const handleRemoteEvent = vi.fn()
    useTripStore.setState({ handleRemoteEvent })

    const fresh = renderEdits({ poi: hit({ category: 'campsite' }), dayId: 1, position: 2, dayNumber: 1, editing: { placeId: 3, dwellMinutes: 20, stopType: null } })
    await act(async () => { await fresh.result.current.saveStopDraftAsNight({ endDayId: 2, checkIn: '', checkOut: '' }) })
    expect(create).toHaveBeenCalledWith(42, { place_id: 3, start_day_id: 1, end_day_id: 2, check_in: null, check_out: null })
    expect(actions.refreshDays).not.toHaveBeenCalled()
    expect(actions.updatePlace).toHaveBeenCalledWith(42, 3, { stop_type: 'campsite' })
    expect(fixed.updateRouteForDay).toHaveBeenCalledWith(1)
    expect(fresh.result.current.stopDraft).toBeNull()

    const booked = { placeId: 3, dwellMinutes: 600, stopType: 'hotel' as const, accommodationId: 31 }
    const rebooked = renderEdits({ poi: hit({ category: 'hotel' }), dayId: 1, position: 2, dayNumber: 1, editing: booked })
    await act(async () => { await rebooked.result.current.saveStopDraftAsNight({ endDayId: 3, checkIn: '16:00', checkOut: '09:00' }) })
    expect(update).toHaveBeenCalledWith(42, 31, { place_id: 3, start_day_id: 1, end_day_id: 3, check_in: '16:00', check_out: '09:00' })
    // The moved stop is folded in for this session, and its day read back whole.
    expect(handleRemoteEvent).toHaveBeenCalledWith({ type: 'assignment:moved', assignment: moved, oldDayId: 1, newDayId: 2 })
    expect(actions.refreshDays).toHaveBeenCalledWith(42)
    expect(actions.updatePlace).toHaveBeenLastCalledWith(42, 3, { stop_type: 'hotel' })
    expect(rebooked.result.current.stopDraft).toBeNull()
  })

  it('FE-TP-STOPEDITS-009: kind, fill and stay are one field each, behind the edit right', async () => {
    const { result, rerender } = renderEdits()

    await act(async () => {
      await result.current.setRoadtripStopKind(3, 'fuel')
      await result.current.setRoadtripStopFill(3, 80)
      await result.current.setRoadtripStay(3, 0)
    })
    expect(actions.updatePlace).toHaveBeenNthCalledWith(1, 42, 3, { stop_type: 'fuel' })
    expect(actions.updatePlace).toHaveBeenNthCalledWith(2, 42, 3, { fill_percent: 80 })
    expect(actions.updatePlace).toHaveBeenNthCalledWith(3, 42, 3, { duration_minutes: 0 })

    actions.updatePlace.mockRejectedValueOnce(new Error('locked')).mockRejectedValueOnce('?').mockRejectedValueOnce(new Error('gone'))
    await act(async () => {
      await result.current.setRoadtripStopKind(3, null)
      await result.current.setRoadtripStopFill(3, null)
      await result.current.setRoadtripStay(3, 45)
    })
    expect(toast.error.mock.calls.map(call => call[0])).toEqual(['locked', 'common.unknownError', 'gone'])

    allowed = false
    rerender()
    await act(async () => {
      await result.current.setRoadtripStopKind(3, 'fuel')
      await result.current.setRoadtripStopFill(3, 50)
      await result.current.setRoadtripStay(3, 10)
    })
    expect(actions.updatePlace).toHaveBeenCalledTimes(6)
  })

  it('FE-TP-STOPEDITS-010: a reorder from the rail is rebuilt on the day\'s whole list, and the vias follow', async () => {
    const { result } = renderEdits()

    // The rail's first slot is the lake; the pump goes in front of it, the hidden note keeps its row.
    await act(async () => { await result.current.reorderRoadtripStop(1, 14, 0) })
    expect(actions.reorderAssignments).toHaveBeenCalledWith(42, 1, [14, 11, 12, 13])
    expect(vias.reanchor).toHaveBeenCalledWith(1, reanchorAfterReorder(vias.byDay[1], 2, 0, 3))
    expect(fixed.updateRouteForDay).toHaveBeenCalledWith(1)

    // A row the rail never showed moves without touching the vias.
    vias.reanchor.mockClear()
    await act(async () => { await result.current.reorderRoadtripStop(1, 12, 9) })
    expect(actions.reorderAssignments).toHaveBeenLastCalledWith(42, 1, [11, 13, 14, 12])
    expect(vias.reanchor).not.toHaveBeenCalled()

    actions.reorderAssignments.mockRejectedValueOnce(new Error('conflict'))
    await act(async () => { await result.current.reorderRoadtripStop(1, 13, 0) })
    expect(toast.error).toHaveBeenLastCalledWith('conflict')
  })

  it('FE-TP-STOPEDITS-011: a reorder that goes nowhere, or that may not happen, writes nothing', async () => {
    const { result, rerender } = renderEdits()

    await act(async () => {
      await result.current.reorderRoadtripStop(1, 11, -3)
      await result.current.reorderRoadtripStop(1, 99, 0)
      await result.current.reorderRoadtripStop(5, 11, 0)
    })
    expect(actions.reorderAssignments).not.toHaveBeenCalled()

    allowed = false
    rerender()
    await act(async () => { await result.current.reorderRoadtripStop(1, 14, 0) })
    expect(actions.reorderAssignments).not.toHaveBeenCalled()
  })

  it('FE-TP-STOPEDITS-012: a day ends at a stop by its own flag or by a boundary filed against it', async () => {
    boundaries.boundaries = [{ day_number: 1, from_assignment_id: 13, to_assignment_id: null, fraction: 1 }]
    const { result, rerender } = renderEdits()

    expect(result.current.roadtripEndsDayAt(stop({ assignmentId: 14, endDay: true }))).toBe(true)
    expect(result.current.roadtripEndsDayAt(stop({ assignmentId: 13 }))).toBe(true)
    expect(result.current.roadtripEndsDayAt(stop({ assignmentId: 11 }))).toBe(false)

    // The boundary is what ended it, so clearing it is the whole switch.
    let moved: boolean | undefined
    await act(async () => { moved = await result.current.setRoadtripEndDay(stop({ assignmentId: 13 })) })
    expect(moved).toBe(true)
    expect(boundaries.save).toHaveBeenCalledWith(1, null)
    expect(actions.setAssignmentEndDay).not.toHaveBeenCalled()

    // Both at once: the boundary goes and the flag is cleared too.
    await act(async () => { moved = await result.current.setRoadtripEndDay(stop({ assignmentId: 13, endDay: true })) })
    expect(actions.setAssignmentEndDay).toHaveBeenCalledWith(42, 1, 13, false)

    await act(async () => { moved = await result.current.setRoadtripEndDay(stop({ assignmentId: 21, ownerDayId: 2 })) })
    expect(moved).toBe(true)
    expect(actions.setAssignmentEndDay).toHaveBeenLastCalledWith(42, 2, 21, true)

    actions.setAssignmentEndDay.mockRejectedValueOnce(new Error('offline'))
    await act(async () => { moved = await result.current.setRoadtripEndDay(stop({ assignmentId: 21, ownerDayId: 2 })) })
    expect(moved).toBe(false)
    expect(toast.error).toHaveBeenLastCalledWith('offline')

    actions.setAssignmentEndDay.mockRejectedValueOnce(0)
    await act(async () => { moved = await result.current.setRoadtripEndDay(stop({ assignmentId: 21, ownerDayId: 2 })) })
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')

    allowed = false
    rerender()
    await act(async () => { moved = await result.current.setRoadtripEndDay(stop({ assignmentId: 21, ownerDayId: 2 })) })
    expect(moved).toBe(false)
    expect(actions.setAssignmentEndDay).toHaveBeenCalledTimes(4)
  })

  it('FE-TP-STOPEDITS-013: without daily times there is no day end to move', async () => {
    const { result } = renderEdits(null, { dailyTimesActive: false })
    let moved: boolean | undefined
    await act(async () => { moved = await result.current.setRoadtripEndDay(stop({ assignmentId: 13 })) })
    expect(moved).toBe(false)
    expect(actions.setAssignmentEndDay).not.toHaveBeenCalled()
  })

  it('FE-TP-STOPEDITS-014: a stop moved onto another day corrects the vias on both', async () => {
    const { result, rerender } = renderEdits()

    await act(async () => { await result.current.moveRoadtripStopToDay(1, 13, 2, 1) })
    expect(actions.moveAssignment).toHaveBeenCalledWith(42, 13, 1, 2, 1)
    expect(vias.reanchor).toHaveBeenNthCalledWith(1, 1, reanchorAfterRemove(vias.byDay[1], 1, 3))
    expect(vias.reanchor).toHaveBeenNthCalledWith(2, 2, reanchorAfterInsert(vias.byDay[2], 1, () => true))
    expect(fixed.updateRouteForDay).toHaveBeenCalledWith(1)
    expect(fixed.updateRouteForDay).toHaveBeenCalledWith(2)

    // A row the rail never counted lands at the end of an empty day and moves no via.
    vias.reanchor.mockClear()
    await act(async () => { await result.current.moveRoadtripStopToDay(1, 12, 3, 5) })
    expect(actions.moveAssignment).toHaveBeenLastCalledWith(42, 12, 1, 3, 0)
    expect(vias.reanchor).not.toHaveBeenCalled()

    actions.moveAssignment.mockRejectedValueOnce(new Error('full'))
    await act(async () => { await result.current.moveRoadtripStopToDay(1, 14, 2, 0) })
    expect(toast.error).toHaveBeenLastCalledWith('full')

    await act(async () => { await result.current.moveRoadtripStopToDay(1, 13, 1, 0) })
    allowed = false
    rerender()
    await act(async () => { await result.current.moveRoadtripStopToDay(1, 13, 2, 0) })
    expect(actions.moveAssignment).toHaveBeenCalledTimes(3)
  })

  it('FE-TP-STOPEDITS-015: the stay dialog opens on the stop it was asked for and closes again', () => {
    const { result } = renderEdits()
    expect(result.current.stayDraft).toBeNull()

    const draft = { placeId: 3, name: 'Castle', minutes: 45 }
    act(() => { result.current.editRoadtripStay(draft) })
    expect(result.current.stayDraft).toBe(draft)

    act(() => { result.current.setStayDraft(null) })
    expect(result.current.stayDraft).toBeNull()
  })

  it('FE-TP-STOPEDITS-016: a day without vias is corrected from an empty list, and any failure is reported', async () => {
    vias.byDay = {}
    const create = vi.spyOn(accommodationsApi, 'create').mockResolvedValue(undefined)
    const draft = { poi: hit({ address: null, category: 'hotel' }), dayId: 1, position: 1, dayNumber: 1 }
    const empty = { vias: [], remove: [] }

    const first = renderEdits(draft)
    await act(async () => { await first.result.current.saveStopDraft({ stopType: 'fuel', dwellMinutes: 15 }) })
    expect(vias.reanchor).toHaveBeenLastCalledWith(1, empty)

    const night = renderEdits(draft)
    await act(async () => { await night.result.current.saveStopDraftAsNight({ endDayId: 2, checkIn: '', checkOut: '10:00' }) })
    expect(actions.addPlace).toHaveBeenLastCalledWith(42, expect.objectContaining({ address: null, website: 'https://rasthof.example' }))
    expect(create).toHaveBeenCalledWith(42, { place_id: 900, start_day_id: 1, end_day_id: 2, check_out: '10:00' })
    expect(vias.reanchor).toHaveBeenLastCalledWith(1, empty)

    const edited = renderEdits({ ...draft, editing: { placeId: 3, dwellMinutes: 20, stopType: null } })
    await act(async () => { await edited.result.current.saveStopDraftAsNight({ endDayId: 2, checkIn: '', checkOut: '' }) })
    expect(actions.refreshDays).not.toHaveBeenCalled()

    const { result } = renderEdits(draft)
    await act(async () => {
      await result.current.reorderRoadtripStop(1, 14, 0)
      await result.current.moveRoadtripStopToDay(1, 13, 2, 1)
    })
    expect(vias.reanchor).toHaveBeenCalledWith(1, reanchorAfterReorder([], 2, 0, 3))
    expect(vias.reanchor).toHaveBeenCalledWith(1, reanchorAfterRemove([], 1, 3))
    expect(vias.reanchor).toHaveBeenCalledWith(2, reanchorAfterInsert([], 1, () => true))

    toast.error.mockClear()
    actions.addPlace.mockRejectedValueOnce('?').mockRejectedValueOnce(new Error('no room'))
    actions.updatePlace.mockRejectedValueOnce('?').mockRejectedValueOnce(new Error('locked')).mockRejectedValueOnce('?')
    actions.reorderAssignments.mockRejectedValueOnce('?')
    actions.moveAssignment.mockRejectedValueOnce('?')
    await act(async () => {
      await result.current.saveStopDraft({ stopType: 'fuel', dwellMinutes: 15 })
      await result.current.saveStopDraftAsNight({ endDayId: 2, checkIn: '', checkOut: '' })
      await result.current.setRoadtripStopKind(3, 'fuel')
      await result.current.setRoadtripStopFill(3, 40)
      await result.current.setRoadtripStay(3, 15)
      await result.current.reorderRoadtripStop(1, 14, 0)
      await result.current.moveRoadtripStopToDay(1, 13, 2, 1)
    })
    expect(toast.error.mock.calls.map(call => call[0])).toEqual([
      'common.unknownError', 'no room', 'common.unknownError', 'locked', 'common.unknownError',
      'common.unknownError', 'common.unknownError',
    ])
  })
})
