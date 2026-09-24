import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Assignment, AssignmentsMap, Day } from '../../types'

// #2455: "the road trip plan should align with the days ordering". The road trip drives a
// day in its stored order (order_index); the Days list draws the same stored day by time.
// Where the two agree the rail must read exactly like the list, and where a day is stored
// against its own times the rail must at least keep every stop on its own card.

const { calculateRouteWithLegs, RoutingRefusedError } = vi.hoisted(() => {
  class RoutingRefusedError extends Error {
    constructor(readonly status: number, readonly retryAfterMs: number | null) {
      super('refused')
      this.name = 'RoutingRefusedError'
    }
    get isRateLimit(): boolean { return this.status === 429 || this.status === 503 }
  }
  return { calculateRouteWithLegs: vi.fn(), RoutingRefusedError }
})
vi.mock('../Map/RouteCalculator', () => ({ calculateRouteWithLegs, RoutingRefusedError }))

import { useRoadtripRoutes } from './useRoadtripRoutes'
import { getMergedItems } from '../../utils/dayMerge'

interface Visit {
  id: number
  name: string
  at: [number, number]
  /** The visit's start, as the day list shows it. */
  time?: string | null
}

const day = (id: number, number: number): Day =>
  ({ id, day_number: number, date: null, title: null }) as unknown as Day

/**
 * A stored visit shaped the way the server hands it over: `place.place_time` is the
 * visit's own start folded over the place's (COALESCE in AssignmentsService), which is
 * the field the Days list sorts by.
 */
const visit = (v: Visit, orderIndex: number, dayId: number): Assignment =>
  ({
    id: v.id,
    day_id: dayId,
    place_id: v.id * 10,
    order_index: orderIndex,
    assignment_time: v.time ?? null,
    assignment_end_time: null,
    leg_transport_mode: null,
    incoming_leg_transport_mode: null,
    place: {
      id: v.id * 10,
      name: v.name,
      lat: v.at[0],
      lng: v.at[1],
      place_time: v.time ?? null,
      end_time: null,
      duration_minutes: 30,
      stop_type: null,
    },
  }) as unknown as Assignment

/** A day as stored: `order_index` is the position in the array. */
const stored = (dayId: number, visits: Visit[]): AssignmentsMap =>
  ({ [String(dayId)]: visits.map((v, i) => visit(v, i, dayId)) }) as unknown as AssignmentsMap

/** The places of one day in the order the Days list draws them (DayPlanSidebar, MPlanTimeline). */
const daysListOrder = (assignments: AssignmentsMap, dayId: number): string[] =>
  getMergedItems({
    dayAssignments: [...(assignments[String(dayId)] ?? [])].sort((a, b) => a.order_index - b.order_index),
    dayNotes: [],
    dayTransports: [],
    dayId,
  })
    .filter(item => item.type === 'place')
    .map(item => (item.data as Assignment).place!.name)

type Card = { dayId: number; stops: { ownerDayId: number; name: string; automaticNight?: unknown }[] }

/** What one card of the rail draws, by name. */
const cardOf = (days: Card[], dayId: number): string[] =>
  days.find(d => d.dayId === dayId)?.stops.filter(s => !s.automaticNight).map(s => s.name) ?? []

/** The cards that draw a stop stored on `dayId`. */
const cardsHolding = (days: Card[], dayId: number): number[] =>
  days.filter(d => d.stops.some(s => !s.automaticNight && s.ownerDayId === dayId)).map(d => d.dayId)

beforeEach(() => {
  calculateRouteWithLegs.mockReset()
  // Twenty minutes and 20 km between any two waypoints, one leg per pair, the way OSRM answers.
  calculateRouteWithLegs.mockImplementation(async (waypoints: { lat: number; lng: number }[]) => ({
    coordinates: waypoints.map(w => [w.lat, w.lng] as [number, number]),
    distance: 20000 * (waypoints.length - 1),
    duration: 1200 * (waypoints.length - 1),
    legs: waypoints.slice(1).map(() => ({ distance: 20000, duration: 1200, text: '20 km' })),
  }))
})

describe('the road trip reads a day the way the Days list does (#2455)', () => {
  it('FE-ROADTRIP-ORDER-001: a day arranged by hand drives in the order the list shows', async () => {
    const days = [day(1, 1)]
    // Handed over out of array order on purpose: order_index decides, not the array.
    const assignments = {
      '1': [
        visit({ id: 3, name: 'Schwerin', at: [53.63, 11.41] }, 2, 1),
        visit({ id: 1, name: 'Lübeck', at: [53.87, 10.69] }, 0, 1),
        visit({ id: 2, name: 'Wismar', at: [53.89, 11.46], time: '11:00' }, 1, 1),
      ],
    } as unknown as AssignmentsMap

    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(daysListOrder(assignments, 1)).toEqual(['Lübeck', 'Wismar', 'Schwerin'])
    expect(cardOf(result.current.days, 1)).toEqual(daysListOrder(assignments, 1))
  })

  it('FE-ROADTRIP-ORDER-002: a stop stored behind later starts stays on its own card, flagged late', async () => {
    // What a Days drop onto a day header used to leave behind, and what a trip moved
    // that way still holds: a 10:00 stop stored after a 14:00 one. The schedule reaches
    // it late on day one; the rail used to take that for a night and open day two with it.
    const days = [day(1, 1), day(2, 2)]
    const assignments = {
      ...stored(1, [
        { id: 1, name: 'Lübeck', at: [53.87, 10.69], time: '09:00' },
        { id: 2, name: 'Wismar', at: [53.89, 11.46], time: '11:00' },
        { id: 3, name: 'Rostock', at: [54.09, 12.10], time: '14:00' },
        { id: 4, name: 'Travemünde', at: [53.96, 10.87], time: '10:00' },
      ]),
      ...stored(2, [
        { id: 5, name: 'Stralsund', at: [54.31, 13.09] },
        { id: 6, name: 'Greifswald', at: [54.09, 13.38] },
      ]),
    } as AssignmentsMap

    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(cardOf(result.current.days, 1)).toEqual(['Lübeck', 'Wismar', 'Rostock', 'Travemünde'])
    expect(cardsHolding(result.current.days, 1)).toEqual([1])
    expect(cardOf(result.current.days, 2)).toEqual(['Stralsund', 'Greifswald'])
    const dayOne = result.current.days.find(d => d.dayId === 1)!
    expect(dayOne.schedule.warnings).toContainEqual(expect.objectContaining({ index: 3, code: 'late' }))
    expect(result.current.days.find(d => d.dayId === 2)!.spills).toEqual([])
  })

  it('FE-ROADTRIP-ORDER-003: a day stored against its times is not torn across two cards', async () => {
    // However it came about (a cross-day move, a start set on the place through the MCP
    // tools, a trip planned before the time sort), day one keeps its card: it was demoted
    // to a one-stop placeholder while its other stops opened day two.
    const days = [day(1, 1), day(2, 2)]
    const assignments = {
      ...stored(1, [
        { id: 1, name: 'Lübeck', at: [53.87, 10.69], time: '14:00' },
        { id: 2, name: 'Wismar', at: [53.89, 11.46], time: '10:00' },
        { id: 3, name: 'Rostock', at: [54.09, 12.10], time: '16:00' },
      ]),
      ...stored(2, [
        { id: 4, name: 'Stralsund', at: [54.31, 13.09] },
        { id: 5, name: 'Greifswald', at: [54.09, 13.38] },
      ]),
    } as AssignmentsMap

    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(cardOf(result.current.days, 1)).toEqual(['Lübeck', 'Wismar', 'Rostock'])
    expect(cardsHolding(result.current.days, 1)).toEqual([1])
    expect(cardOf(result.current.days, 2)).toEqual(['Stralsund', 'Greifswald'])
    expect(result.current.quietDays.map(d => d.dayId)).toEqual([])
  })
})
