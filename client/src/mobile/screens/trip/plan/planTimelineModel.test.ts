import { describe, expect, it } from 'vitest'
import { buildPlanRows } from './planTimelineModel'
import type { MergedItem } from '../../../../utils/dayMerge'
import type { Reservation } from '../../../../types'

// FE-MOBILE-PLANROWS-001 to FE-MOBILE-PLANROWS-003

const zooStop = [
  { type: 'place', sortKey: 0, data: { id: 11, day_id: 5, order_index: 0, place: { id: 1, name: 'Zoo' } } },
] as unknown as MergedItem[]

describe('buildPlanRows', () => {
  it('FE-MOBILE-PLANROWS-001: carries every booking linked to the stop, earliest first (#2201)', () => {
    const reservations = [
      { id: 531, assignment_id: 11, title: 'Zoo tickets', reservation_time: '2025-06-01T10:15:00' },
      { id: 530, assignment_id: 11, title: 'Parking pass', reservation_time: '2025-06-01T09:00:00' },
      { id: 532, assignment_id: 12, title: 'Another stop', reservation_time: null },
    ] as unknown as Reservation[]
    const rows = buildPlanRows({ merged: zooStop, reservations, routeSegments: [], dayId: 5 })
    expect(rows).toHaveLength(1)
    const row = rows[0]
    if (row.kind !== 'place') throw new Error('expected a place row')
    expect(row.linkedReservations.map(r => r.id)).toEqual([530, 531])
  })

  it('FE-MOBILE-PLANROWS-002: a stop without bookings gets an empty list', () => {
    const reservations = [
      { id: 532, assignment_id: 12, title: 'Another stop', reservation_time: null },
    ] as unknown as Reservation[]
    const rows = buildPlanRows({ merged: zooStop, reservations, routeSegments: [], dayId: 5 })
    const row = rows[0]
    if (row.kind !== 'place') throw new Error('expected a place row')
    expect(row.linkedReservations).toEqual([])
  })

  it('FE-MOBILE-PLANROWS-003: an unlinked booking stays a transport row of its own', () => {
    const merged = [
      ...zooStop,
      { type: 'transport', sortKey: 1, data: { id: 540, type: 'taxi', day_id: 5, title: 'Cab' } },
    ] as unknown as MergedItem[]
    const reservations = [
      { id: 540, assignment_id: null, type: 'taxi', title: 'Cab', reservation_time: null },
    ] as unknown as Reservation[]
    const rows = buildPlanRows({ merged, reservations, routeSegments: [], dayId: 5 })
    expect(rows.map(r => r.kind)).toEqual(['place', 'transport'])
    const place = rows[0]
    if (place.kind !== 'place') throw new Error('expected a place row')
    expect(place.linkedReservations).toEqual([])
  })
})
