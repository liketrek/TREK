import { describe, it, expect } from 'vitest'
import { parseTimeToMinutes, getSpanPhase, getDisplayTimeForDay, getTransportForDay, getMergedItems } from './dayMerge'

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

  it('excludes non-transport types', () => {
    const reservations = [{ id: 10, type: 'hotel', day_id: 1 }]
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

  it('per-day position overrides time-based insertion', () => {
    const dayAssignments = [
      { id: 1, order_index: 0, place: { place_time: '08:00' } },
      { id: 2, order_index: 1, place: { place_time: '13:00' } },
    ]
    // Transport at 10:30 would normally go between the two places
    // but per-day position 1.5 puts it after the second place
    const dayTransports = [
      { id: 20, type: 'train', day_id: 5, end_day_id: 5, reservation_time: '10:30', day_positions: { 5: 1.5 } },
    ]
    const result = getMergedItems({ dayAssignments, dayNotes: [], dayTransports, dayId: 5 })
    const types = result.map(i => i.type)
    expect(types).toEqual(['place', 'place', 'transport'])
  })
})
