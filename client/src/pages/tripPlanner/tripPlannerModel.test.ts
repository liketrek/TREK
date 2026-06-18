import { describe, it, expect } from 'vitest'
import { resolvePoolAssignmentId } from './tripPlannerModel'
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
