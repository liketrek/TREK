// FE-TP-DAYPLAN-001 to FE-TP-DAYPLAN-010
//
// The day plan's edits, driven straight through useDayPlanEdits. The store holds the
// day lists the remove and reorder handlers capture for their undo, every write goes
// to a recorded stand-in for the store's actions, and the road trip helpers are small
// stand-ins, so each case can read which vias were carried along.
import { act, renderHook } from '@testing-library/react'
import { useTripStore, type TripStoreState } from '../../store/tripStore'
import { resetAllStores } from '../../../tests/helpers/store'
import { buildAssignment, buildDay, buildPlace } from '../../../tests/helpers/factories'
import type { Assignment } from '../../types'
import type { Translate } from './plannerTypes'
import type { RoadtripFeed } from './useRoadtripFeed'
import { useDayPlanEdits } from './useDayPlanEdits'

type Options = Parameters<typeof useDayPlanEdits>[0]
type Undo = () => Promise<void>

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }
const t = ((key: string) => key) as Translate

const lake = buildPlace({ id: 1, name: 'Lake', lat: 50, lng: 10, place_time: '08:00' })
const castle = buildPlace({ id: 2, name: 'Castle', lat: 50, lng: 11, place_time: '12:00' })
const summit = buildPlace({ id: 3, name: 'Summit', lat: 50, lng: 12, tour_place_id: 3 })
const museum = buildPlace({ id: 4, name: 'Museum', lat: 50, lng: 10.5, place_time: '10:00' })
const day10: Assignment[] = [
  buildAssignment({ id: 101, day_id: 10, place: lake, order_index: 0 }),
  buildAssignment({ id: 102, day_id: 10, place: castle, order_index: 1 }),
  buildAssignment({ id: 103, day_id: 10, place: summit, order_index: 2 }),
]
const day11: Assignment[] = [buildAssignment({ id: 111, day_id: 11, place: summit, order_index: 0 })]
const reanchoring = { vias: [{ id: 7, after_order_index: 2 }], remove: [] }

function makeActions() {
  return {
    assignPlaceToDay: vi.fn(async (): Promise<{ id: number } | undefined> => ({ id: 555 })),
    removeAssignment: vi.fn(async () => undefined),
    moveAssignment: vi.fn(async () => undefined),
    reorderAssignments: vi.fn(async () => undefined),
    updateDayTitle: vi.fn(async () => undefined),
    reorderDays: vi.fn(async () => undefined),
  }
}

let actions: ReturnType<typeof makeActions>
let vias: { byDay: Record<number, { id: number; after_order_index: number; lat: number; lng: number }[]>; reanchor: ReturnType<typeof vi.fn> }
let fixed: Options

function renderEdits(over: Partial<Options> = {}) {
  const options = { ...fixed, ...over }
  return renderHook(() => useDayPlanEdits(options))
}

const lastUndo = (): Undo => vi.mocked(fixed.pushUndo).mock.lastCall![1] as Undo
// The reorders hand their write on without returning it, so a case waits for the chain to settle.
const settle = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 0)) })

beforeEach(() => {
  vi.clearAllMocks()
  resetAllStores()
  actions = makeActions()
  vias = { byDay: { 10: [{ id: 7, after_order_index: 0, lat: 50, lng: 10.2 }] }, reanchor: vi.fn(async () => undefined) }
  const assignments = { 10: day10, 11: day11 }
  useTripStore.setState({
    places: [lake, castle, summit, museum],
    days: [buildDay({ id: 10, day_number: 1 }), buildDay({ id: 11, day_number: 2 }), buildDay({ id: 12, day_number: 3 })],
    assignments,
  })
  fixed = {
    tripId: 42, toast, t,
    tripActions: { ...useTripStore.getState(), ...actions } as unknown as TripStoreState,
    places: [lake, castle, summit, museum], storedAssignments: assignments, tripAccommodations: [], selectedDayId: 10,
    pushUndo: vi.fn(), reloadTourPlaceIds: vi.fn(async () => undefined), updateRouteForDay: vi.fn(async () => undefined),
    isTourPlace: (placeId: number) => placeId === 3,
    roadtripVias: vias as unknown as RoadtripFeed['roadtripVias'],
    roadtripStopsOf: (dayId: number) => (dayId === 10 ? day10 : []),
    viasAfterInsert: vi.fn(() => null),
  }
})

describe('useDayPlanEdits', () => {
  it('FE-TP-DAYPLAN-001: with no day chosen nothing is assigned, and a tour already on the day is not added twice', async () => {
    const { result } = renderEdits({ selectedDayId: null })

    let assigned: boolean | undefined
    await act(async () => { assigned = await result.current.handleAssignToDay(1) })
    expect(assigned).toBe(false)
    expect(toast.error).toHaveBeenCalledWith('trip.toast.selectDay')

    await act(async () => { assigned = await result.current.handleAssignToDay(3, 11) })
    expect(assigned).toBe(false)
    expect(actions.assignPlaceToDay).not.toHaveBeenCalled()
  })

  it('FE-TP-DAYPLAN-002: a place with a start of its own is stored behind the row it is drawn after, and carries the vias along', async () => {
    vi.mocked(fixed.viasAfterInsert).mockReturnValue(reanchoring)
    const { result } = renderEdits()

    let assigned: boolean | undefined
    await act(async () => { assigned = await result.current.handleAssignToDay(4) })

    expect(assigned).toBe(true)
    // Behind the lake at eight, ahead of the castle at noon.
    expect(fixed.viasAfterInsert).toHaveBeenCalledWith(10, 1, museum)
    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 10, 4, 1)
    expect(toast.success).toHaveBeenCalledWith('trip.toast.assignedToDay')
    expect(vias.reanchor).toHaveBeenCalledWith(10, reanchoring)
    expect(fixed.updateRouteForDay).toHaveBeenCalledWith(10)
    expect(fixed.pushUndo).toHaveBeenCalledWith('undo.assignPlace', expect.any(Function), [10], [4])
    expect(fixed.reloadTourPlaceIds).not.toHaveBeenCalled()

    await act(async () => { await lastUndo()() })
    expect(actions.removeAssignment).toHaveBeenCalledWith(42, 10, 555)
  })

  it('FE-TP-DAYPLAN-003: a tour put on another day reloads the tours, and so does its undo', async () => {
    const { result } = renderEdits()

    await act(async () => { await result.current.handleAssignToDay(3, 12, 0) })
    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 12, 3, 0)
    expect(fixed.reloadTourPlaceIds).toHaveBeenCalledTimes(1)
    expect(vias.reanchor).not.toHaveBeenCalled()

    await act(async () => { await lastUndo()() })
    expect(actions.removeAssignment).toHaveBeenCalledWith(42, 12, 555)
    expect(fixed.reloadTourPlaceIds).toHaveBeenCalledTimes(2)
  })

  it('FE-TP-DAYPLAN-004: a failed assignment is reported whatever was thrown, a failed via move still keeps the stop', async () => {
    const { result } = renderEdits()
    let assigned: boolean | undefined

    actions.assignPlaceToDay.mockRejectedValueOnce(new Error('day.full'))
    await act(async () => { assigned = await result.current.handleAssignToDay(1) })
    expect(assigned).toBe(false)
    expect(toast.error).toHaveBeenLastCalledWith('day.full')

    actions.assignPlaceToDay.mockRejectedValueOnce('nope')
    await act(async () => { assigned = await result.current.handleAssignToDay(1) })
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')
    expect(fixed.pushUndo).not.toHaveBeenCalled()

    // A write the store answered without a row is not offered for undo.
    actions.assignPlaceToDay.mockResolvedValueOnce(undefined)
    await act(async () => { assigned = await result.current.handleAssignToDay(1) })
    expect(assigned).toBe(true)
    expect(fixed.pushUndo).not.toHaveBeenCalled()

    vi.mocked(fixed.viasAfterInsert).mockReturnValue(reanchoring)
    vias.reanchor.mockRejectedValueOnce(new Error('vias.locked')).mockRejectedValueOnce('nope')
    await act(async () => { assigned = await result.current.handleAssignToDay(1) })
    expect(assigned).toBe(true)
    expect(toast.error).toHaveBeenLastCalledWith('vias.locked')
    await act(async () => { await result.current.handleAssignToDay(1) })
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')
    expect(fixed.updateRouteForDay).toHaveBeenLastCalledWith(10)
  })

  it('FE-TP-DAYPLAN-005: a stop moved to another day takes its place along to the via plan, and a failed move rejects', async () => {
    vi.mocked(fixed.viasAfterInsert).mockReturnValueOnce(reanchoring)
    const { result } = renderEdits()

    await act(async () => { await result.current.handleMoveToDay(101, 10, 11, 0) })
    expect(fixed.viasAfterInsert).toHaveBeenCalledWith(11, 0, lake)
    expect(actions.moveAssignment).toHaveBeenCalledWith(42, 101, 10, 11, 0)
    expect(vias.reanchor).toHaveBeenCalledWith(11, reanchoring)

    // A row the stored list does not know has no place, and an append moves no via.
    await act(async () => { await result.current.handleMoveToDay(999, 12, 11) })
    expect(fixed.viasAfterInsert).toHaveBeenLastCalledWith(11, undefined, undefined)
    expect(vias.reanchor).toHaveBeenCalledTimes(1)

    actions.moveAssignment.mockRejectedValueOnce(new Error('offline'))
    await expect(act(() => result.current.handleMoveToDay(101, 10, 11))).rejects.toThrow('offline')
  })

  it('FE-TP-DAYPLAN-006: removing a stop moves the vias behind it, and its undo puts it back where it stood', async () => {
    vias.byDay[10] = [{ id: 7, after_order_index: 1, lat: 50, lng: 11.5 }]
    const { result } = renderEdits()

    await act(async () => { await result.current.handleRemoveAssignment(10, 102) })

    expect(actions.removeAssignment).toHaveBeenCalledWith(42, 10, 102)
    // The via behind the castle now follows the lake, the stop ahead of the one taken away.
    expect(vias.reanchor).toHaveBeenCalledWith(10, { vias: [{ id: 7, after_order_index: 0 }], remove: [] })
    expect(fixed.updateRouteForDay).toHaveBeenCalledWith(10)
    expect(fixed.reloadTourPlaceIds).not.toHaveBeenCalled()
    expect(fixed.pushUndo).toHaveBeenCalledWith('undo.removeAssignment', expect.any(Function), [10], [2])

    await act(async () => { await lastUndo()() })
    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 10, 2, 1)
  })

  it('FE-TP-DAYPLAN-007: a removed tour reloads the tours both ways, and an unknown row leaves the vias and the undo alone', async () => {
    const { result } = renderEdits()

    await act(async () => { await result.current.handleRemoveAssignment(11, 111) })
    expect(fixed.reloadTourPlaceIds).toHaveBeenCalledTimes(1)
    await act(async () => { await lastUndo()() })
    expect(actions.assignPlaceToDay).toHaveBeenCalledWith(42, 11, 3, 0)
    expect(fixed.reloadTourPlaceIds).toHaveBeenCalledTimes(2)

    vi.mocked(fixed.pushUndo).mockClear()
    await act(async () => { await result.current.handleRemoveAssignment(12, 999) })
    expect(actions.removeAssignment).toHaveBeenLastCalledWith(42, 12, 999)
    expect(vias.reanchor).not.toHaveBeenCalled()
    expect(fixed.pushUndo).not.toHaveBeenCalled()

    actions.removeAssignment.mockRejectedValueOnce(new Error('gone')).mockRejectedValueOnce('nope')
    await act(async () => { await result.current.handleRemoveAssignment(10, 101) })
    expect(toast.error).toHaveBeenLastCalledWith('gone')
    await act(async () => { await result.current.handleRemoveAssignment(10, 101) })
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')
  })

  it('FE-TP-DAYPLAN-008: a reordered day keeps its hidden rows in place, carries its vias and undoes to the old order', async () => {
    vias.byDay[10] = [{ id: 7, after_order_index: 1, lat: 50, lng: 11.5 }]
    const { result } = renderEdits()

    // The list hides the castle; the lake and the summit swap around it.
    await act(async () => { result.current.handleReorder(10, [103, 101]) })
    await settle()

    expect(actions.reorderAssignments).toHaveBeenCalledWith(42, 10, [103, 102, 101])
    expect(fixed.updateRouteForDay).toHaveBeenCalledWith(10)
    // The via drawn behind the castle stays behind it, and the castle is still second.
    expect(vias.reanchor).not.toHaveBeenCalled()
    expect(fixed.pushUndo).toHaveBeenCalledWith('undo.reorder', expect.any(Function), [10], [1, 2, 3])

    await act(async () => { await lastUndo()() })
    expect(actions.reorderAssignments).toHaveBeenLastCalledWith(42, 10, [101, 102, 103])

    // Behind the lake, which is now last, the via has no leg left and goes.
    vias.byDay[10] = [{ id: 7, after_order_index: 0, lat: 50, lng: 10.2 }]
    const moved = renderEdits()
    await act(async () => { moved.result.current.handleReorder(10, [102, 103, 101]) })
    await settle()
    expect(vias.reanchor).toHaveBeenCalledWith(10, { vias: [], remove: [7] })
  })

  it('FE-TP-DAYPLAN-009: a reorder that fails says so, however it fails', async () => {
    const { result } = renderEdits()

    actions.reorderAssignments.mockRejectedValueOnce(new Error('conflict')).mockRejectedValueOnce('nope')
    await act(async () => { result.current.handleReorder(10, [101, 102, 103]) })
    await settle()
    expect(toast.error).toHaveBeenLastCalledWith('conflict')
    await act(async () => { result.current.handleReorder(10, [101, 102, 103]) })
    await settle()
    expect(toast.error).toHaveBeenLastCalledWith('trip.toast.reorderError')

    // A write that throws before it promises anything is caught too.
    actions.reorderAssignments.mockImplementationOnce(() => { throw new Error('sync') })
    toast.error.mockClear()
    await act(async () => { result.current.handleReorder(12, []) })
    await settle()
    expect(toast.error).toHaveBeenCalledWith('trip.toast.reorderError')
    expect(fixed.pushUndo).not.toHaveBeenCalled()
  })

  it('FE-TP-DAYPLAN-010: a day is renamed, the days reorder with an undo that steps aside once the days changed', async () => {
    const { result } = renderEdits()

    await act(async () => { await result.current.handleUpdateDayTitle(10, 'Coast') })
    expect(actions.updateDayTitle).toHaveBeenCalledWith(42, 10, 'Coast')
    actions.updateDayTitle.mockRejectedValueOnce(new Error('too.long')).mockRejectedValueOnce('nope')
    await act(async () => { await result.current.handleUpdateDayTitle(10, 'x') })
    expect(toast.error).toHaveBeenLastCalledWith('too.long')
    await act(async () => { await result.current.handleUpdateDayTitle(10, 'x') })
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')

    await act(async () => { result.current.handleReorderDays([12, 10, 11]) })
    await settle()
    expect(actions.reorderDays).toHaveBeenCalledWith(42, [12, 10, 11])
    expect(fixed.pushUndo).toHaveBeenCalledWith('dayplan.reorderUndo', expect.any(Function))
    const undo = lastUndo()

    // A day deleted since then drops out of the old order.
    useTripStore.setState({ days: [buildDay({ id: 10 }), buildDay({ id: 12 })] })
    await act(async () => { await undo() })
    expect(actions.reorderDays).toHaveBeenLastCalledWith(42, [10, 12])

    // A day added since then makes the old order one the server could not take.
    useTripStore.setState({ days: [buildDay({ id: 10 }), buildDay({ id: 11 }), buildDay({ id: 12 }), buildDay({ id: 13 })] })
    actions.reorderDays.mockClear()
    await act(async () => { await undo() })
    expect(actions.reorderDays).not.toHaveBeenCalled()

    actions.reorderDays.mockRejectedValueOnce(new Error('locked')).mockRejectedValueOnce('nope')
    await act(async () => { result.current.handleReorderDays([10, 11, 12]) })
    await settle()
    expect(toast.error).toHaveBeenLastCalledWith('locked')
    await act(async () => { result.current.handleReorderDays([10, 11, 12]) })
    await settle()
    expect(toast.error).toHaveBeenLastCalledWith('dayplan.reorderError')
  })
})
