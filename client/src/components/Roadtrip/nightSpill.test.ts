import { describe, it, expect } from 'vitest'
import { spillChains } from './nightSpill'
import type { QuietDay, RoadtripDay, RoadtripStop } from './useRoadtripRoutes'
import type { RouteSegment } from '../../types'

type PlanDay = Pick<RoadtripDay, 'dayId' | 'dayNumber' | 'date' | 'title' | 'stops'>

function stop(over: Partial<RoadtripStop> & { assignmentId: number; name: string }): RoadtripStop {
  return {
    ownerDayId: 1,
    ownerIndex: 0,
    placeId: over.assignmentId * 10,
    lat: 53.5,
    lng: 9.9,
    time: null,
    dwellMinutes: null,
    legMode: null,
    incomingLegMode: null,
    stopType: null,
    ...over,
  }
}

/** A day of the plan, with every stop's stored position filled in for it. */
function day(dayId: number, dayNumber: number, stops: RoadtripStop[]): PlanDay {
  return {
    dayId,
    dayNumber,
    date: null,
    title: null,
    stops: stops.map((s, i) => ({ ...s, ownerDayId: dayId, ownerIndex: i })),
  }
}

const seg = (minutes: number, km = 100): RouteSegment =>
  ({ distance: km * 1000, duration: minutes * 60, distanceText: `${km} km`, durationText: `${minutes} min`, mode: 'driving' }) as RouteSegment

/** Every leg the same length, which is all most of these cases need. */
const everyLeg = (minutes: number, km = 100) => () => ({ seg: seg(minutes, km), line: [[0, 0], [1, 1]] as [number, number][] })

/** No leg routed at all, which is what an unrouted or offline trip looks like. */
const noLegs = () => undefined

describe('spillChains', () => {
  it('FE-NIGHTSPILL-001: leaves an ordinary day exactly where it is', () => {
    const plan = [day(1, 1, [
      stop({ assignmentId: 1, name: 'Hamburg', time: '09:00', dwellMinutes: 60 }),
      stop({ assignmentId: 2, name: 'Berlin' }),
    ])]

    const chains = spillChains(plan, [], everyLeg(180))

    expect(chains).toHaveLength(1)
    expect(chains[0].stops.map(s => s.name)).toEqual(['Hamburg', 'Berlin'])
    expect(chains[0].spills).toEqual([])
  })

  it('FE-NIGHTSPILL-002: hands the stops reached after midnight to the next day', () => {
    // 21:00 + 1 h 30 stay = 22:30, then a three hour drive arrives at 01:30 tomorrow.
    const plan = [
      day(1, 1, [
        stop({ assignmentId: 1, name: 'Hamburg', time: '21:00', dwellMinutes: 90 }),
        stop({ assignmentId: 2, name: 'Neuruppin' }),
      ]),
      day(2, 2, [
        stop({ assignmentId: 3, name: 'Wittenberg', time: '10:00' }),
        stop({ assignmentId: 4, name: 'Leipzig' }),
      ]),
    ]

    const chains = spillChains(plan, [], everyLeg(180))

    expect(chains[0].stops.map(s => s.name)).toEqual(['Hamburg'])
    expect(chains[1].stops.map(s => s.name)).toEqual(['Neuruppin', 'Wittenberg', 'Leipzig'])
  })

  it('FE-NIGHTSPILL-003: the spill carries the night drive and the time it set off', () => {
    const plan = [
      day(1, 1, [
        stop({ assignmentId: 1, name: 'Hamburg', time: '21:00', dwellMinutes: 90 }),
        stop({ assignmentId: 2, name: 'Neuruppin' }),
      ]),
      day(2, 2, [
        stop({ assignmentId: 3, name: 'Wittenberg', time: '10:00' }),
        stop({ assignmentId: 4, name: 'Leipzig' }),
      ]),
    ]

    const chains = spillChains(plan, [], everyLeg(180, 240))

    expect(chains[1].spills).toHaveLength(1)
    const spill = chains[1].spills[0]
    expect(spill).toMatchObject({ at: 0, count: 1, fromDayNumber: 1, departure: '22:30' })
    // The leg is the drive that crossed midnight, not the one after it: without it the
    // card would gain a stop and none of the distance that reaches it.
    expect(spill.leg?.distance).toBe(240000)
    expect(spill.line.length).toBeGreaterThan(1)
  })

  it('FE-NIGHTSPILL-004: a stop that moved keeps the day the server stores it on', () => {
    const plan = [
      day(7, 1, [
        stop({ assignmentId: 1, name: 'Hamburg', time: '21:00', dwellMinutes: 90 }),
        stop({ assignmentId: 2, name: 'Neuruppin' }),
      ]),
      day(8, 2, [stop({ assignmentId: 3, name: 'Wittenberg', time: '10:00' })]),
    ]

    const chains = spillChains(plan, [], everyLeg(180))

    // Drawn under day 2, stored on day 1 — which is what every callback still names.
    const moved = chains[1].stops.find(s => s.name === 'Neuruppin')
    expect(moved?.ownerDayId).toBe(7)
    expect(moved?.ownerIndex).toBe(1)
  })

  it('FE-NIGHTSPILL-005: the last day of a trip keeps its own crossing, having nowhere to send it', () => {
    const plan = [day(1, 1, [
      stop({ assignmentId: 1, name: 'Hamburg', time: '21:00', dwellMinutes: 90 }),
      stop({ assignmentId: 2, name: 'Neuruppin' }),
    ])]

    const chains = spillChains(plan, [], everyLeg(180))

    expect(chains).toHaveLength(1)
    expect(chains[0].stops.map(s => s.name)).toEqual(['Hamburg', 'Neuruppin'])
    expect(chains[0].spills).toEqual([])
    // And it still says so: the arrival is a day past the one the card is under.
    expect(chains[0].schedule.entries[1].dayOffset).toBe(1)
  })

  it('FE-NIGHTSPILL-006: a pinned time resolved to yesterday does not tear the day apart', () => {
    // The case that broke it: 07:00 then 23:00. `computeSchedule` resolves the second pin
    // to the occurrence nearest the drive reaching it, so nine hours late reads as nearer
    // than fifteen hours of waiting and 23:00 lands on the PREVIOUS day. The whole chain
    // is then lifted to stay positive, which leaves the FIRST stop wearing a day offset
    // and the one after it none. Placing stops on those offsets moved the early stop to
    // tomorrow and left the late one behind, visiting them out of order.
    const plan = [
      day(1, 1, [
        stop({ assignmentId: 1, name: 'Cobbelsdorf', time: '07:00', dwellMinutes: 45 }),
        stop({ assignmentId: 2, name: 'Wittenberg', time: '23:00', dwellMinutes: 180 }),
        stop({ assignmentId: 3, name: 'Leipzig' }),
      ]),
      day(2, 2, [stop({ assignmentId: 4, name: 'Dresden', time: '12:00' })]),
    ]

    const chains = spillChains(plan, [], everyLeg(50))

    // Cobbelsdorf and Wittenberg both stay: nothing between them crosses midnight.
    expect(chains[0].stops.map(s => s.name)).toEqual(['Cobbelsdorf', 'Wittenberg'])
    // Leipzig is reached at 02:50, after the clock went back past 23:00, so it moves.
    expect(chains[1].stops.map(s => s.name)).toEqual(['Leipzig', 'Dresden'])
  })

  it('FE-NIGHTSPILL-007: two nights land on two different days', () => {
    // 20:00, then two twelve-hour drives: 08:00 the next day, 20:00 that evening, and
    // 08:00 the day after — two backwards jumps of the clock, two days on.
    const plan = [
      day(1, 1, [
        stop({ assignmentId: 1, name: 'A', time: '20:00' }),
        stop({ assignmentId: 2, name: 'B' }),
        stop({ assignmentId: 3, name: 'C' }),
        stop({ assignmentId: 4, name: 'D' }),
      ]),
      day(2, 2, []),
      day(3, 3, []),
    ]

    const chains = spillChains(plan, [], everyLeg(12 * 60))

    expect(chains[0].stops.map(s => s.name)).toEqual(['A'])
    expect(chains[1].stops.map(s => s.name)).toEqual(['B', 'C'])
    expect(chains[2].stops.map(s => s.name)).toEqual(['D'])
  })

  it('FE-NIGHTSPILL-008: a day whose legs never routed moves nothing', () => {
    const plan = [
      day(1, 1, [
        stop({ assignmentId: 1, name: 'Hamburg', time: '21:00' }),
        stop({ assignmentId: 2, name: 'Neuruppin' }),
      ]),
      day(2, 2, [stop({ assignmentId: 3, name: 'Wittenberg', time: '10:00' })]),
    ]

    const chains = spillChains(plan, [], noLegs)

    // No drive, no arrival, no crossing — and a guess would be worse than nothing.
    expect(chains[0].stops.map(s => s.name)).toEqual(['Hamburg', 'Neuruppin'])
    expect(chains[1].spills).toEqual([])
  })

  it('FE-NIGHTSPILL-009: a day that carries no drive of its own still receives one', () => {
    const plan = [day(1, 1, [
      stop({ assignmentId: 1, name: 'Hamburg', time: '21:00', dwellMinutes: 90 }),
      stop({ assignmentId: 2, name: 'Neuruppin' }),
    ])]
    const quiet: QuietDay[] = [{ dayId: 2, dayNumber: 2, date: null, title: null, stops: [] }]

    const chains = spillChains(plan, quiet, everyLeg(180))

    expect(chains).toHaveLength(2)
    expect(chains[1].dayId).toBe(2)
    expect(chains[1].stops.map(s => s.name)).toEqual(['Neuruppin'])
  })

  it('FE-NIGHTSPILL-010: the crossing is not marked twice on a stop that moved', () => {
    const plan = [
      day(1, 1, [
        stop({ assignmentId: 1, name: 'Hamburg', time: '21:00', dwellMinutes: 90 }),
        stop({ assignmentId: 2, name: 'Neuruppin' }),
      ]),
      day(2, 2, [stop({ assignmentId: 3, name: 'Wittenberg', time: '10:00' })]),
    ]

    const chains = spillChains(plan, [], everyLeg(180))

    // The block around it is what says the night happened; a band as well would say it
    // twice. And it is not "the next day" once it is drawn under the next day's date.
    expect(chains[1].schedule.warnings.some(w => w.code === 'overnight')).toBe(false)
    expect(chains[1].schedule.entries[0].dayOffset).toBe(0)
  })

  it('FE-NIGHTSPILL-011: a finding about a stop travels with it, renumbered', () => {
    // Wittenberg is pinned two hours before the drive can get there, which is a "late"
    // finding against index 1 of day 1. It moves to day 2 as index 0.
    const plan = [
      day(1, 1, [
        stop({ assignmentId: 1, name: 'Hamburg', time: '21:00', dwellMinutes: 90 }),
        stop({ assignmentId: 2, name: 'Neuruppin', time: '00:30' }),
      ]),
      day(2, 2, [stop({ assignmentId: 3, name: 'Wittenberg', time: '10:00' })]),
    ]

    const chains = spillChains(plan, [], everyLeg(180))

    const late = chains[1].schedule.warnings.filter(w => w.code === 'late')
    expect(late).toHaveLength(1)
    expect(late[0].index).toBe(0)
  })

  it('FE-NIGHTSPILL-012: two stops crossing together are one block, not two', () => {
    const plan = [
      day(1, 1, [
        stop({ assignmentId: 1, name: 'Hamburg', time: '21:00', dwellMinutes: 90 }),
        stop({ assignmentId: 2, name: 'Neuruppin' }),
        stop({ assignmentId: 3, name: 'Potsdam' }),
      ]),
      day(2, 2, [stop({ assignmentId: 4, name: 'Wittenberg', time: '10:00' })]),
    ]

    const chains = spillChains(plan, [], everyLeg(180))

    expect(chains[1].stops.map(s => s.name)).toEqual(['Neuruppin', 'Potsdam', 'Wittenberg'])
    expect(chains[1].spills).toHaveLength(1)
    expect(chains[1].spills[0]).toMatchObject({ at: 0, count: 2, fromDayNumber: 1 })
  })
})
