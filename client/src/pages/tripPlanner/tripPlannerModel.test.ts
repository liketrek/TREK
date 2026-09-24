import { describe, it, expect } from 'vitest'
import { placesForDays, resolvePoolAssignmentId } from './tripPlannerModel'
import { buildAssignment, buildPlace } from '../../../tests/helpers/factories'

describe('resolvePoolAssignmentId', () => {
  it('returns the lone assignment id when the place is assigned to exactly one day', () => {
    const place = buildPlace({ id: 7 })
    const assignment = buildAssignment({ id: 42, day_id: 3, place })
    const assignments = { 3: [assignment], 4: [buildAssignment({ id: 99, day_id: 4 })] }
    expect(resolvePoolAssignmentId(assignments, 7)).toBe(42)
  })

  it('returns null when the place is not assigned to any day', () => {
    const assignments = { 3: [buildAssignment({ id: 99, day_id: 3 })] }
    expect(resolvePoolAssignmentId(assignments, 7)).toBeNull()
  })

  it('returns null when the place is assigned to multiple days (ambiguous time)', () => {
    const assignments = {
      3: [buildAssignment({ id: 1, day_id: 3, place: buildPlace({ id: 7 }) })],
      4: [buildAssignment({ id: 2, day_id: 4, place: buildPlace({ id: 7 }) })],
    }
    expect(resolvePoolAssignmentId(assignments, 7)).toBeNull()
  })
})

describe('placesForDays', () => {
  const town = buildPlace({ id: 1, stop_type: null })
  const hotel = buildPlace({ id: 2, stop_type: 'hotel' })
  const pump = buildPlace({ id: 3, stop_type: 'fuel' })
  const brauhaus = buildPlace({ id: 4, stop_type: 'restaurant' })
  const campsite = buildPlace({ id: 5, stop_type: 'campsite' })
  const all = [town, hotel, pump, brauhaus, campsite]
  const none = { accommodations: [], reservations: [] }

  it('FE-TP-MODEL-001: hands the list back untouched while road trip stops show in Days', () => {
    expect(placesForDays(all, false, none)).toBe(all)
  })

  it('FE-TP-MODEL-002: leaves out every road trip stop nobody booked, but never a lodging', () => {
    // The hotel's booking may be gone; the 'hotel' type it stamped on the place is not.
    expect(placesForDays(all, true, none).map(p => p.id)).toEqual([1, 2])
  })

  it('FE-TP-MODEL-003: keeps the place a stay is at, whatever type it carries', () => {
    const kept = placesForDays(all, true, { accommodations: [{ place_id: 5 }, { place_id: null }], reservations: [] })
    expect(kept.map(p => p.id)).toEqual([1, 2, 5])
  })

  it('FE-TP-MODEL-004: keeps the place a booking names, directly or through its stay', () => {
    const kept = placesForDays(all, true, {
      accommodations: [],
      reservations: [{ place_id: 4 }, { accommodation_place_id: 5 }, { place_id: null, accommodation_place_id: null }],
    })
    expect(kept.map(p => p.id)).toEqual([1, 2, 4, 5])
  })
})
