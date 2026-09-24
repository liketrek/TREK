import { describe, it, expect } from 'vitest'
import { plannedPlaceIds, plannedPlaceIdsForDay } from './plannedPlaces'
import type { AssignmentsMap, Day } from '../types'

// FE-UTIL-PLANNED-001 to FE-UTIL-PLANNED-010
//
// #2072 — a hotel linked to a booking sat under "Unplanned" while its name was
// printed in the day header, because being planned meant one thing only: a
// day_assignments row.

const assignments = (map: Record<string, number[]>): AssignmentsMap =>
  Object.fromEntries(
    Object.entries(map).map(([dayId, ids]) => [dayId, ids.map((id, i) => ({
      id: 900 + id, day_id: Number(dayId), order_index: i, place: { id },
    }))]),
  ) as unknown as AssignmentsMap

const DAYS = [
  { id: 10, day_number: 1 }, { id: 11, day_number: 2 }, { id: 12, day_number: 3 }, { id: 13, day_number: 4 },
] as unknown as Day[]

describe('plannedPlaceIds', () => {
  it('FE-UTIL-PLANNED-001: an assigned place is planned, as it always was', () => {
    expect([...plannedPlaceIds({ assignments: assignments({ 10: [1, 2] }) })]).toEqual([1, 2])
  })

  it('FE-UTIL-PLANNED-002: a stay plans its place without any assignment', () => {
    const ids = plannedPlaceIds({
      assignments: assignments({}),
      accommodations: [{ place_id: 7, start_day_id: 10, end_day_id: 12 }],
    })
    expect(ids.has(7)).toBe(true)
  })

  it('FE-UTIL-PLANNED-003: a stay whose place was deleted contributes nothing', () => {
    const ids = plannedPlaceIds({
      assignments: assignments({}),
      accommodations: [{ place_id: null, start_day_id: 10, end_day_id: 12 }],
    })
    expect(ids.size).toBe(0)
  })

  it('FE-UTIL-PLANNED-004: a booking on a day plans the place it points at', () => {
    const ids = plannedPlaceIds({
      assignments: assignments({}),
      reservations: [{ place_id: 5, day_id: 10 }],
    })
    expect(ids.has(5)).toBe(true)
  })

  // The boundary the issue itself calls out: a booking that names no day is not
  // on the plan, and the day view renders nothing for it either.
  it('FE-UTIL-PLANNED-005: a booking with no day plans nothing', () => {
    const ids = plannedPlaceIds({
      assignments: assignments({}),
      reservations: [{ place_id: 5, day_id: null }],
    })
    expect(ids.size).toBe(0)
  })

  it('FE-UTIL-PLANNED-006: a place reachable two ways is counted once', () => {
    const ids = plannedPlaceIds({
      assignments: assignments({ 10: [7] }),
      accommodations: [{ place_id: 7, start_day_id: 10, end_day_id: 12 }],
      reservations: [{ place_id: 7, day_id: 10 }],
    })
    expect([...ids]).toEqual([7])
  })

  it('FE-UTIL-PLANNED-007: no sources at all is an empty set, not a throw', () => {
    expect(plannedPlaceIds({ assignments: {} as AssignmentsMap }).size).toBe(0)
  })
})

describe('plannedPlaceIdsForDay', () => {
  it('FE-UTIL-PLANNED-008: a stay covers the nights in between, not just its two ends', () => {
    const sources = {
      assignments: assignments({}),
      accommodations: [{ place_id: 7, start_day_id: 10, end_day_id: 12 }],
    }
    expect(plannedPlaceIdsForDay(10, DAYS, sources).has(7)).toBe(true)
    expect(plannedPlaceIdsForDay(11, DAYS, sources).has(7)).toBe(true)
    expect(plannedPlaceIdsForDay(12, DAYS, sources).has(7)).toBe(true)
    expect(plannedPlaceIdsForDay(13, DAYS, sources).has(7)).toBe(false)
  })

  // The day rows are the only thing that can order a stay. Without them the
  // planner falls back to the id range rather than dropping the middle nights.
  it('FE-UTIL-PLANNED-009: an unloaded day list still keeps the middle of a stay', () => {
    const sources = {
      assignments: assignments({}),
      accommodations: [{ place_id: 7, start_day_id: 10, end_day_id: 12 }],
    }
    expect(plannedPlaceIdsForDay(11, [], sources).has(7)).toBe(true)
    expect(plannedPlaceIdsForDay(13, [], sources).has(7)).toBe(false)
  })

  it('FE-UTIL-PLANNED-010: a booking counts only on the day it names', () => {
    const sources = { assignments: assignments({}), reservations: [{ place_id: 5, day_id: 11 }] }
    expect(plannedPlaceIdsForDay(11, DAYS, sources).has(5)).toBe(true)
    expect(plannedPlaceIdsForDay(10, DAYS, sources).has(5)).toBe(false)
  })
})
