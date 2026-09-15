import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTripStore } from './tripStore'
import { applyStayStops } from './stayStops'
import type { Assignment } from '../types'

vi.mock('../db/offlineDb', () => ({
  offlineDb: { days: { get: vi.fn(), put: vi.fn() }, places: { put: vi.fn(), delete: vi.fn() } },
  upsertAccommodations: vi.fn(),
}))

const stop = (id: number, dayId: number): Assignment =>
  ({ id, day_id: dayId, place_id: 7, order_index: 0, notes: null, place: { id: 7, name: 'Hotel Adlon' } }) as unknown as Assignment

beforeEach(() => {
  useTripStore.setState({ assignments: {} })
})

describe('applyStayStops', () => {
  it('FE-STAY-STOPS-001 puts the stop a booking reported into the day it belongs to', () => {
    // The socket skips the session that sent the request, so the answer is the only
    // way the person who just booked the night learns about their own stop.
    applyStayStops({ assignment: stop(77, 3) })
    expect(useTripStore.getState().assignments['3']).toEqual([stop(77, 3)])
  })

  it('FE-STAY-STOPS-002 takes a stop back off the old day when the booking moved', () => {
    useTripStore.setState({ assignments: { '3': [stop(77, 3)] } })
    applyStayStops({ assignment: stop(78, 4), removedAssignments: [{ id: 77, dayId: 3 }] })
    expect(useTripStore.getState().assignments['3']).toEqual([])
    expect(useTripStore.getState().assignments['4']).toEqual([stop(78, 4)])
  })

  it('FE-STAY-STOPS-003 does nothing for a write that left the day plan alone', () => {
    useTripStore.setState({ assignments: { '3': [stop(77, 3)] } })
    // Booking a night at a place that was already planned for that day, and every
    // older server that answers without the field at all.
    applyStayStops({ assignment: null, removedAssignments: [] })
    applyStayStops(undefined)
    expect(useTripStore.getState().assignments['3']).toEqual([stop(77, 3)])
  })
})
