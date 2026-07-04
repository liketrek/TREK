import { describe, it, expect } from 'vitest'
import { parseTimeToMinutes, getSpanPhase, getTransportRouteEndpoints, getDisplayTimeForDay, getTransportForDay, getMergedItems } from './dayMerge'

describe('parseTimeToMinutes', () => {
  it('parses HH:MM string', () => {
    expect(parseTimeToMinutes('09:30')).toBe(570)
  })

  it('parses ISO datetime string', () => {
    expect(parseTimeToMinutes('2025-03-30T14:00:00')).toBe(840)
  })

  it('returns null for null/empty', () => {
    expect(parseTimeToMinutes(null)).toBeNull()
    expect(parseTimeToMinutes(undefined)).toBeNull()
  })
})

describe('getSpanPhase', () => {
  it('returns single when start === end', () => {
    expect(getSpanPhase({ day_id: 1, end_day_id: 1 }, 1)).toBe('single')
  })

  it('returns start for the departure day', () => {
    expect(getSpanPhase({ day_id: 1, end_day_id: 3 }, 1)).toBe('start')
  })

  it('returns end for the arrival day', () => {
    expect(getSpanPhase({ day_id: 1, end_day_id: 3 }, 3)).toBe('end')
  })

  it('returns middle for days in between', () => {
    expect(getSpanPhase({ day_id: 1, end_day_id: 3 }, 2)).toBe('middle')
  })
})

describe('getTransportRouteEndpoints', () => {
  const pickup = { role: 'from', lat: 48.1, lng: 11.5 }
  const dropoff = { role: 'to', lat: 52.5, lng: 13.4 }
  // A car rental spanning day 1 (pickup) through day 3 (drop-off).
  const rental = { day_id: 1, end_day_id: 3, endpoints: [pickup, dropoff] }

  it('routes to the pickup only on the start day of a multi-day rental', () => {
    expect(getTransportRouteEndpoints(rental, 1)).toEqual({ from: { lat: 48.1, lng: 11.5 }, to: null })
  })

  it('routes from the drop-off only on the end day', () => {
    expect(getTransportRouteEndpoints(rental, 3)).toEqual({ from: null, to: { lat: 52.5, lng: 13.4 } })
  })

  it('adds no waypoints on the days in between (regression for #1210)', () => {
    expect(getTransportRouteEndpoints(rental, 2)).toEqual({ from: null, to: null })
  })

  it('uses both endpoints for a single-day transport', () => {
    const sameDay = { day_id: 1, end_day_id: 1, endpoints: [pickup, dropoff] }
    expect(getTransportRouteEndpoints(sameDay, 1)).toEqual({
      from: { lat: 48.1, lng: 11.5 },
      to: { lat: 52.5, lng: 13.4 },
    })
  })

  it('returns nulls when the endpoints carry no coordinates', () => {
    const noCoords = { day_id: 1, end_day_id: 1, endpoints: [{ role: 'from' }, { role: 'to' }] }
    expect(getTransportRouteEndpoints(noCoords, 1)).toEqual({ from: null, to: null })
  })
})

describe('getDisplayTimeForDay', () => {
  const r = { day_id: 1, end_day_id: 3, reservation_time: '2025-01-01T09:00:00', reservation_end_time: '2025-01-03T14:00:00' }

  it('returns reservation_time on start day', () => {
    expect(getDisplayTimeForDay(r, 1)).toBe(r.reservation_time)
  })

  it('returns reservation_end_time on end day', () => {
    expect(getDisplayTimeForDay(r, 3)).toBe(r.reservation_end_time)
  })

  it('returns null for middle day', () => {
    expect(getDisplayTimeForDay(r, 2)).toBeNull()
  })
})

describe('getTransportForDay', () => {
  const days = [
    { id: 1, day_number: 1 },
    { id: 2, day_number: 2 },
    { id: 3, day_number: 3 },
  ]

  it('excludes hotel (rendered via accommodation path)', () => {
    const reservations = [{ id: 10, type: 'hotel', day_id: 1 }]
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [], days })).toHaveLength(0)
  })

  it('includes tour booking on the correct day', () => {
    const reservations = [{ id: 20, type: 'tour', day_id: 1 }]
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [], days })).toHaveLength(1)
    expect(getTransportForDay({ reservations, dayId: 2, dayAssignmentIds: [], days })).toHaveLength(0)
  })

  it('includes restaurant, event, and other bookings by day_id', () => {
    const reservations = [
      { id: 30, type: 'restaurant', day_id: 2 },
      { id: 31, type: 'event', day_id: 2 },
      { id: 32, type: 'other', day_id: 2 },
    ]
    expect(getTransportForDay({ reservations, dayId: 2, dayAssignmentIds: [], days })).toHaveLength(3)
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [], days })).toHaveLength(0)
  })

  it('includes single-day transport on the correct day', () => {
    const reservations = [{ id: 10, type: 'flight', day_id: 1, end_day_id: 1 }]
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [], days })).toHaveLength(1)
    expect(getTransportForDay({ reservations, dayId: 2, dayAssignmentIds: [], days })).toHaveLength(0)
  })

  it('includes multi-day transport on all spanned days', () => {
    const reservations = [{ id: 10, type: 'train', day_id: 1, end_day_id: 3 }]
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [], days })).toHaveLength(1)
    expect(getTransportForDay({ reservations, dayId: 2, dayAssignmentIds: [], days })).toHaveLength(1)
    expect(getTransportForDay({ reservations, dayId: 3, dayAssignmentIds: [], days })).toHaveLength(1)
  })

  it('excludes transport linked to an assignment on that day', () => {
    const reservations = [{ id: 10, type: 'bus', day_id: 1, end_day_id: 1, assignment_id: 42 }]
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [42], days })).toHaveLength(0)
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [99], days })).toHaveLength(1)
  })

  it('expands a multi-leg TRAIN into one row per leg with train detail on __leg (#1150)', () => {
    const reservations = [{
      id: 40, type: 'train', day_id: 1, end_day_id: 2,
      metadata: JSON.stringify({
        train_number: 'ICE 100',
        legs: [
          { from: 'Berlin', to: 'Frankfurt', train_number: 'ICE 100', platform: '5', dep_day_id: 1, dep_time: '08:00', arr_day_id: 1, arr_time: '12:00' },
          { from: 'Frankfurt', to: 'München', train_number: 'ICE 500', platform: '9', dep_day_id: 2, dep_time: '09:00', arr_day_id: 2, arr_time: '12:00' },
        ],
      }),
    }]
    const day1 = getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [], days })
    expect(day1).toHaveLength(1)
    expect(day1[0].__leg).toMatchObject({ index: 0, total: 2, from: 'Berlin', to: 'Frankfurt', train_number: 'ICE 100', platform: '5' })
    const day2 = getTransportForDay({ reservations, dayId: 2, dayAssignmentIds: [], days })
    expect(day2).toHaveLength(1)
    expect(day2[0].__leg).toMatchObject({ index: 1, from: 'Frankfurt', to: 'München', train_number: 'ICE 500', platform: '9' })
  })

  it('leaves a single-leg train untouched (no __leg)', () => {
    const reservations = [{ id: 41, type: 'train', day_id: 1, end_day_id: 1, metadata: JSON.stringify({ train_number: 'RE 1' }) }]
    const rows = getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [], days })
    expect(rows).toHaveLength(1)
    expect(rows[0].__leg).toBeUndefined()
  })
})

describe('getMergedItems', () => {
  it('merges places and notes sorted by sortKey', () => {
    const dayAssignments = [
      { id: 1, order_index: 0, place: { place_time: null } },
      { id: 2, order_index: 2, place: { place_time: null } },
    ]
    const dayNotes = [{ id: 10, sort_order: 1 }]
    const result = getMergedItems({ dayAssignments, dayNotes, dayTransports: [], dayId: 5 })
    expect(result.map(i => i.type)).toEqual(['place', 'note', 'place'])
    expect(result[0].data.id).toBe(1)
    expect(result[1].data.id).toBe(10)
    expect(result[2].data.id).toBe(2)
  })

  it('inserts transport by time when no per-day position is set', () => {
    const dayAssignments = [
      { id: 1, order_index: 0, place: { place_time: '08:00' } },
      { id: 2, order_index: 1, place: { place_time: '13:00' } },
    ]
    const dayTransports = [
      { id: 20, type: 'flight', day_id: 5, end_day_id: 5, reservation_time: '10:30', day_positions: null },
    ]
    const result = getMergedItems({ dayAssignments, dayNotes: [], dayTransports, dayId: 5 })
    const types = result.map(i => i.type)
    // transport (10:30) should be between place at 08:00 (idx 0) and place at 13:00 (idx 1)
    expect(types).toEqual(['place', 'transport', 'place'])
  })

  it('orders a timed transport chronologically regardless of a stale per-day position', () => {
    const dayAssignments = [
      { id: 1, order_index: 0, place: { place_time: '08:00' } },
      { id: 2, order_index: 1, place: { place_time: '13:00' } },
    ]
    // The train is at 10:30, so it sorts between the 08:00 and 13:00 places by time —
    // timed items are arranged chronologically even if an old manual position exists.
    const dayTransports = [
      { id: 20, type: 'train', day_id: 5, end_day_id: 5, reservation_time: '10:30', day_positions: { 5: 1.5 } },
    ]
    const result = getMergedItems({ dayAssignments, dayNotes: [], dayTransports, dayId: 5 })
    const types = result.map(i => i.type)
    expect(types).toEqual(['place', 'transport', 'place'])
  })
})
