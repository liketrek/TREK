import { describe, expect, it } from 'vitest'
import { buildTransitLeg, buildTransitNameIndex } from './transitLeg'
import type { Accommodation, Assignment, Reservation, RouteSegment } from '../../types'

// FE-PLANNER-TRANSITLEG-001 to FE-PLANNER-TRANSITLEG-006

const visit = (id: number, dayId: number, name: string, lat: number, lng: number, placeTime?: string) =>
  ({ id, day_id: dayId, place: { id, name, lat, lng, place_time: placeTime ?? null } }) as unknown as Assignment

const seg = (from: [number, number], to: [number, number]) => ({ from, to }) as unknown as RouteSegment

describe('buildTransitNameIndex', () => {
  it('FE-PLANNER-TRANSITLEG-001: names every located place, hotel and booking endpoint by its coordinate', () => {
    const names = buildTransitNameIndex(
      { '1': [visit(11, 1, 'Louvre', 48.86, 2.34)] },
      [{ place_lat: 48.85, place_lng: 2.35, place_name: 'Hotel Lutetia' } as unknown as Accommodation],
      [{ endpoints: [{ lat: 48.88, lng: 2.36, name: 'Gare du Nord' }] } as unknown as Reservation],
    )
    expect(names.get('48.86,2.34')).toBe('Louvre')
    expect(names.get('48.85,2.35')).toBe('Hotel Lutetia')
    expect(names.get('48.88,2.36')).toBe('Gare du Nord')
  })

  it('FE-PLANNER-TRANSITLEG-002: keeps the first name for a coordinate and skips what has no position or name', () => {
    const names = buildTransitNameIndex(
      { '1': [visit(11, 1, 'First', 1, 2), visit(12, 1, 'Second', 1, 2)] },
      [{ place_lat: null, place_lng: null, place_name: 'Nowhere' } as unknown as Accommodation],
      [{ endpoints: [{ lat: 3, lng: 4, name: '' }] } as unknown as Reservation, {} as Reservation],
    )
    expect(names.get('1,2')).toBe('First')
    expect(names.size).toBe(1)
  })
})

describe('buildTransitLeg', () => {
  const assignments = {
    '1': [visit(11, 1, 'Louvre', 48.86, 2.34, '9:05'), visit(12, 1, 'Orsay', 48.87, 2.33)],
    '2': [visit(21, 2, 'Louvre', 48.86, 2.34, '15:30:00')],
  }
  const names = buildTransitNameIndex(assignments, [], [])

  it('FE-PLANNER-TRANSITLEG-003: seeds both ends and the origin\'s time on that day, as HH:mm', () => {
    expect(buildTransitLeg(seg([48.86, 2.34], [48.87, 2.33]), 1, names, assignments, [])).toEqual({
      from: { name: 'Louvre', lat: 48.86, lng: 2.34 },
      to: { name: 'Orsay', lat: 48.87, lng: 2.33 },
      time: '09:05',
    })
    // The same place on another day carries that day's time.
    expect(buildTransitLeg(seg([48.86, 2.34], [48.87, 2.33]), 2, names, assignments, [])?.time).toBe('15:30')
  })

  it('FE-PLANNER-TRANSITLEG-004: takes the time from a booking endpoint that touches the day', () => {
    const reservations = [
      { day_id: 9, end_day_id: null, endpoints: [{ lat: 1, lng: 1, local_time: '07:00' }] },
      { day_id: 3, end_day_id: 1, endpoints: [{ lat: 1, lng: 1, local_time: '18:45' }] },
    ] as unknown as Reservation[]
    expect(buildTransitLeg(seg([1, 1], [2, 2]), 1, new Map(), {}, reservations)).toEqual({
      from: { name: '', lat: 1, lng: 1 },
      to: { name: '', lat: 2, lng: 2 },
      time: '18:45',
    })
  })

  it('FE-PLANNER-TRANSITLEG-005: leaves the time empty when the origin has none', () => {
    expect(buildTransitLeg(seg([48.87, 2.33], [48.86, 2.34]), 1, names, assignments, [])?.time).toBeNull()
  })

  it('FE-PLANNER-TRANSITLEG-006: answers nothing for a leg without both ends', () => {
    expect(buildTransitLeg(undefined, 1, names, assignments, [])).toBeNull()
    expect(buildTransitLeg({ from: [1, 1] } as unknown as RouteSegment, 1, names, assignments, [])).toBeNull()
  })
})
