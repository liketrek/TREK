// FE-PDF-SCOPE-001 to FE-PDF-SCOPE-002 (#2168)
import { describe, it, expect } from 'vitest'
import type { AssignmentsMap } from '../../types'
import { hasPersonalPlan, onlyMyPlan } from './pdfScope'

const assignments = {
  1: [
    { id: 11, participants: [] },
    { id: 12, participants: [{ user_id: 7, username: 'me' }] },
    { id: 13, participants: [{ user_id: 8, username: 'anna' }] },
  ],
  2: [{ id: 21 }],
} as unknown as AssignmentsMap

describe('pdfScope', () => {
  it('FE-PDF-SCOPE-001: offers a personal plan only once somebody was given a part', () => {
    expect(hasPersonalPlan(assignments, [])).toBe(true)
    expect(hasPersonalPlan({ 1: [{ id: 1 }] } as unknown as AssignmentsMap, [{ travelers: [] }])).toBe(false)
    expect(hasPersonalPlan({}, [{ travelers: [{ user_id: 1 }] }])).toBe(true)
  })

  it('FE-PDF-SCOPE-002: keeps what names me and what names nobody', () => {
    const reservations = [{ id: 1, travelers: [{ user_id: 7 }] }, { id: 2, travelers: [{ user_id: 8 }] }, { id: 3 }]
    const out = onlyMyPlan(assignments, reservations, 7)
    expect(out.assignments[1].map(a => a.id)).toEqual([11, 12])
    expect(out.assignments[2].map(a => a.id)).toEqual([21])
    expect(out.reservations.map(r => r.id)).toEqual([1, 3])
  })
})
