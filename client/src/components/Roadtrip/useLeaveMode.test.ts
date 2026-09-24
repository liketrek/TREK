import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLeaveMode, type LeaveSubject } from './useLeaveMode'
import { useAuthStore } from '../../store/authStore'
import { usePermissionsStore } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'
import { buildAssignment, buildPlace } from '../../../tests/helpers/factories'
import { server } from '../../../tests/helpers/msw/server'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'

// FE-ROADTRIP-LEAVE-001..014: the part of the stay dialog that is about a time set to
// leave a stop, and how it takes that time off the visit.

type AddToast = NonNullable<typeof window.__addToast>

const visit = {
  id: 102,
  day_id: 11,
  place_id: 202,
  order_index: 1,
  assignment_time: '09:00',
  assignment_end_time: '14:00',
  place: { id: 202, name: 'Bremen', place_time: '09:00', end_time: '14:00' },
}

const subject: LeaveSubject = { leaveAt: '14:00', arrival: '10:00', departure: '14:00', assignmentId: 102, dayId: 11 }

let setAssignmentTimes: ReturnType<typeof vi.fn>
let updatePlace: ReturnType<typeof vi.fn>
let refreshDays: ReturnType<typeof vi.fn>
let addToast: ReturnType<typeof vi.fn<AddToast>>

beforeEach(() => {
  resetAllStores()
  setAssignmentTimes = vi.fn(async () => undefined)
  updatePlace = vi.fn(async () => undefined)
  refreshDays = vi.fn(async () => undefined)
  addToast = vi.fn<AddToast>(() => 0)
  window.__addToast = addToast
  seedStore(useAuthStore, { user: { id: 1, role: 'user' } })
  seedStore(useTripStore, { trip: { id: 4, user_id: 1 }, assignments: { '11': [visit] } })
  useTripStore.setState({ setAssignmentTimes, updatePlace, refreshDays } as never)
})

afterEach(() => {
  delete window.__addToast
})

describe('useLeaveMode', () => {
  it('FE-ROADTRIP-LEAVE-001: reads the time the stop is left at and the stay that makes', () => {
    const { result } = renderHook(() => useLeaveMode(subject))
    expect(result.current).toMatchObject({ until: '14:00', minutes: 240, removing: false })
    expect(result.current.remove).toBeTypeOf('function')
  })

  it('FE-ROADTRIP-LEAVE-002: an ordinary stay is nothing for it to answer', () => {
    const { result } = renderHook(() => useLeaveMode({ ...subject, leaveAt: null }))
    expect(result.current.until).toBeNull()
    expect(renderHook(() => useLeaveMode(null)).result.current.until).toBeNull()
  })

  it('FE-ROADTRIP-LEAVE-003: removing clears the End through the time write and keeps the Start', async () => {
    const { result } = renderHook(() => useLeaveMode(subject))
    await act(async () => { await result.current.remove!() })
    expect(setAssignmentTimes).toHaveBeenCalledWith(4, 11, 102, { place_time: '09:00', end_time: null })
    // The day is read back as the place form reads it after the same write.
    expect(refreshDays).toHaveBeenCalledWith(4)
    expect(result.current.until).toBeNull()
  })

  it('FE-ROADTRIP-LEAVE-004: a refused write says so and leaves the end time standing', async () => {
    setAssignmentTimes.mockRejectedValueOnce(new Error('Denied'))
    const { result } = renderHook(() => useLeaveMode(subject))
    await act(async () => { await result.current.remove!() })
    expect(addToast).toHaveBeenCalledWith('Denied', 'error', undefined)
    expect(result.current.until).toBe('14:00')
    expect(refreshDays).not.toHaveBeenCalled()
  })

  it('FE-ROADTRIP-LEAVE-005: nothing to remove for a traveller who may not change the day', () => {
    usePermissionsStore.setState({ permissions: { day_edit: 'trip_owner' } })
    seedStore(useTripStore, { trip: { id: 4, user_id: 2 } })
    const reader = renderHook(() => useLeaveMode(subject))
    expect(reader.result.current.remove).toBeUndefined()
    reader.unmount()
    // Nor for a visit still waiting for the id the server gives it.
    seedStore(useTripStore, { trip: { id: 4, user_id: 1 } })
    expect(renderHook(() => useLeaveMode({ ...subject, assignmentId: -5 })).result.current.remove).toBeUndefined()
  })

  it('FE-ROADTRIP-LEAVE-006: an End only the place carries is taken off the place', async () => {
    // The visit's own time write cannot reach it, so clearing that alone would change nothing.
    seedStore(useTripStore, {
      places: [{ id: 202, name: 'Bremen', end_time: '14:00' }],
      assignments: { '11': [{ ...visit, assignment_end_time: null }] },
    })
    const { result } = renderHook(() => useLeaveMode(subject))
    expect(result.current.until).toBe('14:00')
    await act(async () => { await result.current.remove!() })
    expect(setAssignmentTimes).not.toHaveBeenCalled()
    expect(updatePlace).toHaveBeenCalledWith(4, 202, { end_time: null })
    expect(result.current.until).toBeNull()
  })

  it.each([['the same', '14:00'], ['another', '11:00']])(
    'FE-ROADTRIP-LEAVE-009: with %s End on the place as well, removing clears both',
    async (_label, placeEnd) => {
      // A migration copied the place's End onto every visit, so older trips carry it
      // twice. Clearing only the visit's left the stop leaving at the place's.
      seedStore(useTripStore, { places: [{ id: 202, name: 'Bremen', end_time: placeEnd }] })
      const { result } = renderHook(() => useLeaveMode(subject))
      await act(async () => { await result.current.remove!() })
      expect(setAssignmentTimes).toHaveBeenCalledWith(4, 11, 102, { place_time: '09:00', end_time: null })
      expect(updatePlace).toHaveBeenCalledWith(4, 202, { end_time: null })
      expect(result.current.until).toBeNull()
    },
  )

  it('FE-ROADTRIP-LEAVE-010: not offered when another visit of the place still leans on its End', () => {
    // Taking the place's End would take that visit's too, and keeping it keeps this one's.
    const other = { id: 150, day_id: 12, place_id: 202, order_index: 0, assignment_time: null, assignment_end_time: null }
    seedStore(useTripStore, {
      places: [{ id: 202, name: 'Bremen', end_time: '14:00' }],
      assignments: { '11': [visit], '12': [other] },
    })
    const leaning = renderHook(() => useLeaveMode(subject))
    expect(leaning.result.current.until).toBe('14:00')
    expect(leaning.result.current.remove).toBeUndefined()
    leaning.unmount()
    // One with an End of its own does not care what the place carries.
    seedStore(useTripStore, { assignments: { '11': [visit], '12': [{ ...other, assignment_end_time: '16:00' }] } })
    expect(renderHook(() => useLeaveMode(subject)).result.current.remove).toBeTypeOf('function')
  })

  it('FE-ROADTRIP-LEAVE-011: not offered to a traveller who may not edit the place its End sits on', () => {
    usePermissionsStore.setState({ permissions: { place_edit: 'trip_owner' } })
    seedStore(useTripStore, { trip: { id: 4, user_id: 2 }, places: [{ id: 202, name: 'Bremen', end_time: '14:00' }] })
    expect(renderHook(() => useLeaveMode(subject)).result.current.remove).toBeUndefined()
  })

  it('FE-ROADTRIP-LEAVE-012: through the real store the stop has no End left afterwards', async () => {
    // Nothing stubbed but the day read back: the visit's time write and the place write
    // both go out, and the End the road trip reads for the visit is gone.
    resetAllStores()
    seedStore(useAuthStore, { user: { id: 1, role: 'user' } })
    const pool = buildPlace({ id: 202, trip_id: 4, name: 'Bremen', place_time: null, end_time: '14:00' })
    const stored = buildAssignment({
      id: 102, day_id: 11, place_id: 202, assignment_time: '09:00', assignment_end_time: '14:00',
      place: { ...pool, place_time: '09:00', end_time: '14:00' },
    })
    seedStore(useTripStore, { trip: { id: 4, user_id: 1 }, places: [pool], assignments: { '11': [stored] } })
    useTripStore.setState({ refreshDays } as never)
    server.use(
      http.put('/api/trips/4/assignments/102/time', () =>
        HttpResponse.json({ assignment: { ...stored, assignment_end_time: null, place: { ...pool, place_time: '09:00' } } })),
      http.put('/api/trips/4/places/202', () => HttpResponse.json({ place: { ...pool, end_time: null } })),
    )
    const { result } = renderHook(() => useLeaveMode(subject))
    await act(async () => { await result.current.remove!() })
    const after = useTripStore.getState().assignments['11']![0]!
    expect(after.assignment_end_time ?? after.place?.end_time ?? null).toBeNull()
    expect(result.current.until).toBeNull()
    expect(addToast).not.toHaveBeenCalled()
  })

  it('FE-ROADTRIP-LEAVE-013: a refused write shows what the server said, not the request library', async () => {
    setAssignmentTimes.mockRejectedValueOnce({
      message: 'Request failed with status code 404',
      response: { status: 404, data: { error: 'Assignment not found' } },
    })
    const { result } = renderHook(() => useLeaveMode(subject))
    await act(async () => { await result.current.remove!() })
    expect(addToast).toHaveBeenCalledWith('Assignment not found', 'error', undefined)
    // With nothing from the server, the translated fallback rather than the English boilerplate.
    setAssignmentTimes.mockRejectedValueOnce({ message: 'Request failed with status code 500', response: { status: 500 } })
    await act(async () => { await result.current.remove!() })
    expect(addToast).toHaveBeenLastCalledWith('common.unknownError', 'error', undefined)
  })

  it('FE-ROADTRIP-LEAVE-014: hands on the finding of a missed time and a day that ends first', () => {
    expect(renderHook(() => useLeaveMode({ ...subject, arrival: '14:30', departure: '14:30', missedBy: 30 })).result.current)
      .toMatchObject({ until: '14:00', minutes: 0, missedBy: 30, dayEndsFirst: false })
    expect(renderHook(() => useLeaveMode({ ...subject, leaveAt: '20:00', arrival: '10:30', departure: '18:00' })).result.current)
      .toMatchObject({ until: '20:00', minutes: null, missedBy: null, dayEndsFirst: true })
  })

  it('FE-ROADTRIP-LEAVE-008: a visit gone from the store by the time of the tap is left alone', async () => {
    const { result } = renderHook(() => useLeaveMode(subject))
    const remove = result.current.remove!
    act(() => seedStore(useTripStore, { assignments: { '11': [] } }))
    await act(async () => { await remove() })
    expect(setAssignmentTimes).not.toHaveBeenCalled()
  })

  it('FE-ROADTRIP-LEAVE-007: opened on another visit, the removal of the last one is forgotten', async () => {
    const { result, rerender } = renderHook(({ s }) => useLeaveMode(s), { initialProps: { s: subject } })
    await act(async () => { await result.current.remove!() })
    expect(result.current.until).toBeNull()
    rerender({ s: { ...subject, assignmentId: 103, leaveAt: '16:00' } })
    await waitFor(() => expect(result.current.until).toBe('16:00'))
  })
})
