// FE-TP-PLACEEDITS-001 to FE-TP-PLACEEDITS-012
//
// Writes to the trip's places, driven straight through usePlaceEdits. The store holds
// the places and day lists the delete and category handlers capture for their undo,
// and every write goes to a recorded stand-in for the store's actions, so each case
// can read what was written and what the undo would put back.
import { act, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { assignmentsApi } from '../../api/client'
import { offlineDb, clearAll } from '../../db/offlineDb'
import { mutationQueue } from '../../sync/mutationQueue'
import { setAuthed } from '../../sync/authGate'
import { server } from '../../../tests/helpers/msw/server'
import { useTripStore, type TripStoreState } from '../../store/tripStore'
import { resetAllStores } from '../../../tests/helpers/store'
import { buildAssignment, buildDay, buildPlace, buildReservation, buildTrip } from '../../../tests/helpers/factories'
import type { Accommodation } from '../../types'
import type { Can, Translate } from './plannerTypes'
import type { RoadtripFeed } from './useRoadtripFeed'
import { usePlaceEdits } from './usePlaceEdits'

type Options = Parameters<typeof usePlaceEdits>[0]
type Undo = () => Promise<void>

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }
// The parameters ride along in the text, so a case can read which names a sentence got.
const t = ((key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key)) as Translate
let allowed = true
const can: Can = vi.fn(() => allowed)
const trip = buildTrip({ id: 42 })

const lake = buildPlace({ id: 1, name: 'Lake', category_id: 3 })
const castle = buildPlace({ id: 2, name: 'Castle', category_id: null })
const summit = buildPlace({ id: 3, name: 'Summit', tour_place_id: 3 })
const stay = (over: Partial<Accommodation>) => ({ id: 70, trip_id: 42, start_day_id: 10, end_day_id: 11, ...over }) as Accommodation

function makeActions() {
  return {
    updatePlace: vi.fn(async () => undefined),
    addPlace: vi.fn(async (): Promise<{ id: number } | null> => ({ id: 900 })),
    assignPlaceToDay: vi.fn(async () => ({ id: 555 })),
    refreshDays: vi.fn(async () => undefined),
    setAssignmentTimes: vi.fn(async () => undefined),
    setAssignmentNotes: vi.fn(async () => undefined),
    addFile: vi.fn(async () => undefined),
    deletePlace: vi.fn(async (): Promise<{ tourPlaceIds?: number[] } | undefined> => undefined),
    deletePlacesMany: vi.fn(async (): Promise<{ tourPlaceIds?: number[] } | undefined> => undefined),
    updatePlacesMany: vi.fn(async () => undefined),
  }
}

let actions: ReturnType<typeof makeActions>
let vias: { byDay: Record<number, { id: number; after_order_index: number; lat: number; lng: number }[]>; reanchor: ReturnType<typeof vi.fn> }
let fixed: Options

function renderEdits(over: Partial<Options> = {}) {
  const options = { ...fixed, ...over }
  return renderHook(() => usePlaceEdits(options))
}

const lastUndo = (): Undo => vi.mocked(fixed.pushUndo).mock.lastCall![1] as Undo

beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  resetAllStores()
  allowed = true
  actions = makeActions()
  vias = { byDay: { 10: [{ id: 7, after_order_index: 0, lat: 50, lng: 10.5 }] }, reanchor: vi.fn(async () => undefined) }
  useTripStore.setState({
    places: [lake, castle, summit],
    days: [buildDay({ id: 10 }), buildDay({ id: 11 })],
    assignments: {
      10: [buildAssignment({ id: 101, day_id: 10, place: lake, order_index: 2 })],
      11: [buildAssignment({ id: 111, day_id: 11, place: castle, order_index: 0 })],
      12: [buildAssignment({ id: 121, day_id: 12, place: lake, order_index: 1 })],
    },
  })
  fixed = {
    tripId: 42, trip, can, toast, t,
    tripActions: { ...useTripStore.getState(), ...actions } as unknown as TripStoreState,
    places: [lake, castle, summit], allPlaces: [lake, castle, summit], tripAccommodations: [], reservations: [],
    toursEnabled: true, tourPlaceIds: new Set<number>(), invalidateTourPlaceIds: vi.fn(), reloadTourPlaceIds: vi.fn(async () => undefined),
    selectedPlaceId: null, setSelectedPlaceId: vi.fn(), selectedDayId: 10,
    updateRouteForDay: vi.fn(async () => undefined), pushUndo: vi.fn(), forgetPlace: vi.fn(),
    editingPlace: null, editingAssignmentId: null, placeFormDayId: null, placeFormPosition: null,
    roadtripRoutes: { days: [] } as unknown as RoadtripFeed['roadtripRoutes'],
    roadtripVias: vias as unknown as RoadtripFeed['roadtripVias'],
    viaLiesBefore: () => via => via.lng < 10.5,
  }
})

describe('usePlaceEdits', () => {
  it('FE-TP-PLACEEDITS-001: the delete question names the booked nights at stake, and only those', () => {
    const { result } = renderEdits({
      tripAccommodations: [
        stay({ id: 70, place_id: 1 }),
        // A stay whose place is not loaded is named by the stay, and one with no name at all is left out.
        stay({ id: 71, place_id: 4, place_name: 'Old Mill' }),
        stay({ id: 72, place_id: 5 }),
      ],
      reservations: [buildReservation({ id: 80, accommodation_id: 70, title: 'Lake' })],
    })
    expect(result.current.deletePlaceNote).toBeNull()
    expect(result.current.deletePlacesNote).toBeNull()

    act(() => { result.current.setDeletePlaceId(1) })
    expect(result.current.deletePlaceNote).toBe('trip.confirm.deletePlaceBookedSame {"name":"Lake"}')

    act(() => { result.current.setDeletePlaceIds([4, 5]) })
    expect(result.current.deletePlacesNote).toBe('trip.confirm.deletePlaceNight {"name":"Old Mill"}')

    act(() => { result.current.setDeletePlaceIds([1, 4]) })
    expect(result.current.deletePlacesNote).toBe('trip.confirm.deletePlaceBookedSame {"name":"Lake, Old Mill"}')

    act(() => { result.current.setDeletePlaceId(2) })
    expect(result.current.deletePlaceNote).toBeNull()
  })

  it('FE-TP-PLACEEDITS-002: a booking named otherwise is quoted beside the place', () => {
    const { result } = renderEdits({
      tripAccommodations: [stay({ id: 70, place_id: 1, reservation_title: 'Lakeside Inn' })],
    })

    act(() => { result.current.setDeletePlaceId(1) })

    expect(result.current.deletePlaceNote).toBe('trip.confirm.deletePlaceBooked {"name":"Lake","booking":"Lakeside Inn"}')
  })

  it('FE-TP-PLACEEDITS-003: a tour is told apart from a place, by its own id or by the tours list', () => {
    const { result } = renderEdits({ tourPlaceIds: new Set([2]) })

    expect(result.current.isTourPlace(3)).toBe(true)
    expect(result.current.isTourPlace(2)).toBe(true)
    expect(result.current.isTourPlace(1)).toBe(false)
    expect(result.current.deletePlaceIsTour).toBe(false)
    expect(result.current.deletePlacesIncludeTours).toBe(false)

    act(() => { result.current.setDeletePlaceId(3) })
    act(() => { result.current.setDeletePlaceIds([1, 2]) })
    expect(result.current.deletePlaceIsTour).toBe(true)
    expect(result.current.deletePlacesIncludeTours).toBe(true)
  })

  it('FE-TP-PLACEEDITS-004: deleting asks only for a place, and deleting a tour only for a tour', () => {
    const { result } = renderEdits()

    act(() => { result.current.handleDeletePlace(3) })
    expect(result.current.deletePlaceId).toBeNull()
    act(() => { result.current.handleDeleteTour(1) })
    expect(result.current.deletePlaceId).toBeNull()

    act(() => { result.current.handleDeleteTour(3) })
    expect(result.current.deletePlaceId).toBe(3)
    act(() => { result.current.handleDeletePlace(1) })
    expect(result.current.deletePlaceId).toBe(1)
  })

  it('FE-TP-PLACEEDITS-005: a reader is asked nothing, and with tours off a tour is deleted like a place', () => {
    allowed = false
    const reader = renderEdits()
    act(() => { reader.result.current.handleDeletePlace(1) })
    act(() => { reader.result.current.handleDeleteTour(3) })
    expect(reader.result.current.deletePlaceId).toBeNull()
    reader.unmount()

    allowed = true
    const { result } = renderEdits({ toursEnabled: false })
    act(() => { result.current.handleDeleteTour(3) })
    expect(result.current.deletePlaceId).toBeNull()
    act(() => { result.current.handleDeletePlace(3) })
    expect(result.current.deletePlaceId).toBe(3)
  })

  it('FE-TP-PLACEEDITS-006: an edited place keeps its times and note on the visit, and its files land on it', async () => {
    const updateTime = vi.spyOn(assignmentsApi, 'updateTime').mockResolvedValue({} as never)
    const updateNotes = vi.spyOn(assignmentsApi, 'updateNotes').mockResolvedValue({} as never)
    actions.addFile.mockRejectedValueOnce(new Error('files.tooLarge')).mockResolvedValueOnce(undefined)
    const file = new File(['x'], 'a.pdf')
    useTripStore.setState(state => ({ assignments: { ...state.assignments, 10: [{ ...state.assignments[10][0], notes: 'old' }] } }))
    const { result } = renderEdits({ editingPlace: lake, editingAssignmentId: 101 })

    let saved: unknown
    await act(async () => {
      saved = await result.current.handleSavePlace({
        name: 'Lake', place_time: '09:00', end_time: '', assignment_notes: '', _pendingFiles: [file, file],
      })
    })

    expect(saved).toEqual({ id: 1 })
    expect(actions.updatePlace).toHaveBeenCalledWith(42, 1, { name: 'Lake' })
    // The times go through the store and the visit's repo, never straight to the API.
    expect(actions.setAssignmentTimes).toHaveBeenCalledWith(42, 10, 101, { place_time: '09:00', end_time: null })
    expect(updateTime).not.toHaveBeenCalled()
    // The note goes through the store and the visit's repo too, which caches it on the day,
    // and the days are not reloaded over a queued time.
    expect(actions.setAssignmentNotes).toHaveBeenCalledWith(42, 10, 101, null)
    expect(updateNotes).not.toHaveBeenCalled()
    expect(actions.refreshDays).not.toHaveBeenCalled()
    expect(actions.addFile).toHaveBeenCalledTimes(2)
    expect(toast.error).toHaveBeenCalledWith('files.uploadError')
    expect(toast.success).toHaveBeenCalledWith('trip.toast.placeUpdated')
  })

  it('FE-TP-PLACEEDITS-007: a place edited from the pool touches no visit and leaves an untouched note alone', async () => {
    const updateTime = vi.spyOn(assignmentsApi, 'updateTime').mockResolvedValue({} as never)
    const { result } = renderEdits({ editingPlace: castle })

    await act(async () => { await result.current.handleSavePlace({ name: 'Castle', place_time: '10:00' }) })

    expect(actions.updatePlace).toHaveBeenCalledWith(42, 2, { name: 'Castle' })
    expect(actions.setAssignmentTimes).not.toHaveBeenCalled()
    expect(actions.setAssignmentNotes).not.toHaveBeenCalled()
    expect(updateTime).not.toHaveBeenCalled()
    expect(actions.refreshDays).not.toHaveBeenCalled()
  })

  it('FE-TP-PLACEEDITS-006b: a time saved from the dialog waits behind a parked time of the same visit', async () => {
    // The older time was parked as failed; the one saved now online must not land first,
    // or Try again would replay the older time over it.
    await clearAll()
    mutationQueue._resetFlushing()
    setAuthed(true)
    onTestFinished(() => setAuthed(false))
    await offlineDb.mutationQueue.put({
      id: 'parked', tripId: 42, method: 'PUT', url: '/trips/42/assignments/101/time',
      body: { place_time: '07:00', end_time: null }, createdAt: 1, status: 'failed', attempts: 8,
      lastError: 'boom', resource: 'assignments', entityId: 101,
    })
    const sent: string[] = []
    server.use(http.put('/api/trips/42/assignments/101/time', async ({ request }) => {
      const body = await request.json() as { place_time: string }
      sent.push(body.place_time)
      return HttpResponse.json({ assignment: buildAssignment({ id: 101, day_id: 10, place: lake, assignment_time: body.place_time }) })
    }))
    const { setAssignmentTimes } = useTripStore.getState()
    const { result } = renderEdits({
      editingPlace: lake, editingAssignmentId: 101,
      tripActions: { ...fixed.tripActions, setAssignmentTimes } as TripStoreState,
    })

    await act(async () => { await result.current.handleSavePlace({ name: 'Lake', place_time: '09:00', end_time: '' }) })
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(sent).toEqual([])
    expect(useTripStore.getState().assignments[10][0].assignment_time).toBe('09:00')

    await mutationQueue.retryFailed()
    expect(sent).toEqual(['07:00', '09:00'])
    expect(await offlineDb.mutationQueue.count()).toBe(0)
  })

  it('FE-TP-PLACEEDITS-008: a service stop the drawn card does not show still lands on the day and position it named', async () => {
    const { result } = renderEdits()

    let saved: unknown
    await act(async () => {
      saved = await result.current.handleSavePlace({ name: 'Charger', lat: 50, lng: 11, _serviceStop: { dayId: 11, position: 2 } })
    })

    expect(saved).toEqual({ id: 900 })
    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 11, 900, 2)
    expect(fixed.updateRouteForDay).toHaveBeenCalledWith(11)
    expect(fixed.pushUndo).toHaveBeenCalledWith('undo.addPlace', expect.any(Function))
    await act(async () => { await lastUndo()() })
    expect(actions.deletePlace).toHaveBeenCalledWith(42, 900)
  })

  it('FE-TP-PLACEEDITS-009: a new place at a position carries the vias behind it along, and a failed day link is reported', async () => {
    const { result } = renderEdits({ placeFormDayId: 10, placeFormPosition: 1 })

    await act(async () => { await result.current.handleSavePlace({ name: 'Pump', lat: 50, lng: 11 }) })
    // The via on the far side of the new stop now follows it.
    expect(vias.reanchor).toHaveBeenCalledWith(10, { vias: [{ id: 7, after_order_index: 1 }], remove: [] })

    actions.assignPlaceToDay.mockRejectedValueOnce('nope')
    await act(async () => { await result.current.handleSavePlace({ name: 'Pump', lat: 50, lng: 11 }) })
    expect(toast.error).toHaveBeenCalledWith('common.unknownError')
    // The place itself was saved, and says so.
    expect(toast.success).toHaveBeenLastCalledWith('trip.toast.placeAdded')
  })

  it('FE-TP-PLACEEDITS-010: a place the store could not add is not offered for undo', async () => {
    actions.addPlace.mockResolvedValueOnce(null)
    const { result } = renderEdits({ placeFormDayId: 10 })

    let saved: unknown = 'unset'
    await act(async () => { saved = await result.current.handleSavePlace({ name: 'Ghost', _pendingFiles: [new File(['x'], 'a.pdf')] }) })

    expect(saved).toBeUndefined()
    expect(actions.assignPlaceToDay).not.toHaveBeenCalled()
    expect(actions.addFile).not.toHaveBeenCalled()
    expect(fixed.pushUndo).not.toHaveBeenCalled()
  })

  it('FE-TP-PLACEEDITS-011: deleting a place offers it back on the days that still exist, and a place already gone offers nothing', async () => {
    const { result } = renderEdits({ selectedPlaceId: 1 })
    act(() => { result.current.setDeletePlaceId(1) })

    let deleted: unknown
    await act(async () => { deleted = await result.current.confirmDeletePlace() })
    expect(deleted).toBeNull()
    expect(fixed.setSelectedPlaceId).toHaveBeenCalledWith(null)
    expect(fixed.reloadTourPlaceIds).toHaveBeenCalled()
    expect(fixed.updateRouteForDay).toHaveBeenCalledWith(10)
    await act(async () => { await lastUndo()() })
    expect(actions.addPlace).toHaveBeenCalledWith(42, expect.objectContaining({ name: 'Lake', category_id: 3 }))
    // Day 12 is gone, so only day 10 takes it back.
    expect(actions.assignPlaceToDay).toHaveBeenCalledTimes(1)
    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 10, 900, 2)

    vi.mocked(fixed.pushUndo).mockClear()
    act(() => { result.current.setDeletePlaceId(99) })
    await act(async () => { await result.current.confirmDeletePlace() })
    expect(fixed.pushUndo).not.toHaveBeenCalled()

    actions.deletePlace.mockRejectedValueOnce('nope')
    await act(async () => { deleted = await result.current.confirmDeletePlace() })
    expect(deleted).toBeNull()
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')
  })

  it('FE-TP-PLACEEDITS-012: bulk deletes and category moves undo by group, and report a failure whatever was thrown', async () => {
    const { result } = renderEdits()

    await act(async () => { await result.current.confirmDeletePlaces([98, 99]) })
    expect(actions.deletePlacesMany).toHaveBeenCalledWith(42, [98, 99])
    expect(fixed.pushUndo).not.toHaveBeenCalled()

    actions.deletePlacesMany.mockRejectedValueOnce('nope')
    await act(async () => { await result.current.confirmDeletePlaces([1]) })
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')

    await act(async () => { await result.current.confirmChangeCategory([98], 4) })
    expect(actions.updatePlacesMany).toHaveBeenCalledWith(42, [98], { category_id: 4 })
    expect(fixed.pushUndo).not.toHaveBeenCalled()

    await act(async () => { await result.current.confirmChangeCategory([1, 2], 4) })
    await act(async () => { await lastUndo()() })
    expect(actions.updatePlacesMany).toHaveBeenCalledWith(42, [1], { category_id: 3 })
    expect(actions.updatePlacesMany).toHaveBeenCalledWith(42, [2], { category_id: null })

    actions.updatePlacesMany.mockRejectedValueOnce('nope')
    await act(async () => { await result.current.confirmChangeCategory([1], 4) })
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')
  })
})
