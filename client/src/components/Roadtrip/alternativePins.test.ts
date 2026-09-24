import { describe, it, expect, vi } from 'vitest'
import { MAX_PINS, pinAlternative, railDriveOn, railLegAt, refusalHint } from './alternativePins'
import type { RailLegRoute, RailLegRouter, RoadtripDay, RoadtripStop } from './useRoadtripRoutes'
import type { OfferedRoute } from './useRouteAlternatives'

/**
 * FE-ALTPIN-001..013: proving a choice with the rail's own router before it is saved.
 *
 * A choice used to be one via at the point where the offer strayed furthest, written
 * without asking whether the router then drove the offer. On a ferry it did not (OSRM
 * pulls the point to the pier and drives through Calais), and on a way weighed away from
 * motorways it kept the motorway after the one point. These cases pin down how the pins
 * are found, how many, in which order, and when there is no verdict at all.
 */

/** The road being driven, and a detour that leaves it twice before rejoining. */
const RAIL: [number, number][] = [[53.55, 9.99], [53.0, 11.5], [52.52, 13.4]]
const DETOUR: [number, number][] = [[53.55, 9.99], [53.4, 11.5], [53.3, 12.8], [52.52, 13.4]]

const offer = (over: Partial<OfferedRoute> = {}): OfferedRoute =>
  ({ coordinates: DETOUR, distance: 310_000, duration: 11_400, divergence: null, ...over })
const current = { coordinates: RAIL, distance: 290_000, duration: 10_800 }
const answer = (coordinates: [number, number][], over: Partial<RailLegRoute> = {}): RailLegRoute =>
  ({ coordinates, distance: 300_000, duration: 11_000, ...over })

const signal = () => new AbortController().signal
type Route = RailLegRouter['route']

describe('pinAlternative', () => {
  it('FE-ALTPIN-001: the router own preference is asked with no pin at all', async () => {
    const route = vi.fn<Route>(async () => answer(DETOUR))

    const proof = await pinAlternative({ offer: offer({ direct: true }), current, route, signal: signal() })

    expect(route).toHaveBeenCalledTimes(1)
    expect(route.mock.calls[0][0]).toEqual([])
    expect(proof).toMatchObject({ held: true, pins: [], fellBack: false })
  })

  it('FE-ALTPIN-002: any other offer starts from the point where it leaves the driven road furthest', async () => {
    const route = vi.fn<Route>(async () => answer(DETOUR))

    const proof = await pinAlternative({ offer: offer(), current, route, signal: signal() })

    expect(route).toHaveBeenCalledTimes(1)
    expect(proof).toMatchObject({ held: true, pins: [{ lat: 53.3, lng: 12.8 }] })
  })

  it('FE-ALTPIN-003: an answer that is not the offer adds the point it missed, in the order the offer drives', async () => {
    // The first answer passes the pin and still takes the old road for its first half.
    const route = vi.fn<Route>()
      .mockResolvedValueOnce(answer([[53.55, 9.99], [53.0, 11.5], [53.3, 12.8], [52.52, 13.4]]))
      .mockResolvedValueOnce(answer(DETOUR))

    const proof = await pinAlternative({ offer: offer(), current, route, signal: signal() })

    expect(route).toHaveBeenCalledTimes(2)
    // Driven through backwards the leg would double back between them.
    expect(route.mock.calls[1][0]).toEqual([{ lat: 53.4, lng: 11.5 }, { lat: 53.3, lng: 12.8 }])
    expect(proof.pins).toEqual([{ lat: 53.4, lng: 11.5 }, { lat: 53.3, lng: 12.8 }])
    expect(proof.held).toBe(true)
  })

  it('FE-ALTPIN-004: no more than three pins are tried before the offer counts as not held', async () => {
    // A long detour the router leaves somewhere new on every answer.
    const long: [number, number][] = [[50, 0], [50.5, 1], [51, 2], [51.5, 3], [52, 4], [52.5, 5], [52, 6]]
    const answers: [number, number][][] = [
      [[50, 0], [50, 1], [51, 2], [51.5, 3], [52, 4], [52.5, 5], [52, 6]],
      [[50, 0], [50.5, 1], [51, 2], [51, 3], [52, 4], [52.5, 5], [52, 6]],
      [[50, 0], [50.5, 1], [51, 2], [51.5, 3], [52, 4], [52, 5], [52, 6]],
    ]
    const route = vi.fn<Route>()
    for (const line of answers) route.mockResolvedValueOnce(answer(line))

    const proof = await pinAlternative({ offer: offer({ coordinates: long }), current: { ...current, coordinates: [[50, 0], [52, 6]] }, route, signal: signal() })

    expect(MAX_PINS).toBe(3)
    expect(route).toHaveBeenCalledTimes(3)
    expect(route.mock.calls[2][0]).toHaveLength(3)
    expect(proof).toMatchObject({ held: false, pins: [], fellBack: false })
    expect(proof.last.coordinates).toEqual(answers[2])
  })

  it('FE-ALTPIN-005: an answer that misses the same point again ends the check rather than repeating it', async () => {
    // A point OSRM pulls off a ferry to the pier: pinned again, the same road comes back.
    const route = vi.fn<Route>(async () => answer(RAIL))

    const proof = await pinAlternative({ offer: offer(), current, route, signal: signal() })

    expect(route).toHaveBeenCalledTimes(1)
    expect(proof).toMatchObject({ held: false, fellBack: false })
    expect(proof.last.coordinates).toEqual(RAIL)
  })

  it('FE-ALTPIN-006: an answer from the stand-in engine gives no verdict on the road', async () => {
    // It would prove the offer to an engine that will not be the one drawing the leg.
    const route = vi.fn<Route>(async () => answer(DETOUR, { fellBack: true }))

    const proof = await pinAlternative({ offer: offer(), current, route, signal: signal() })

    expect(proof).toMatchObject({ held: false, fellBack: true, pins: [] })
  })

  it('FE-ALTPIN-007: with no road to measure against, the check starts unpinned', async () => {
    const route = vi.fn<Route>(async () => answer(DETOUR))

    await pinAlternative({ offer: offer(), current: undefined, route, signal: signal() })

    expect(route.mock.calls[0][0]).toEqual([])
  })

  it('FE-ALTPIN-008: an abandoned check asks the router nothing more', async () => {
    const controller = new AbortController()
    const route = vi.fn<Route>(async () => {
      controller.abort()
      return answer([[53.55, 9.99], [53.0, 11.5], [53.3, 12.8], [52.52, 13.4]])
    })

    await expect(pinAlternative({ offer: offer(), current, route, signal: controller.signal }))
      .rejects.toMatchObject({ name: 'AbortError' })
    expect(route).toHaveBeenCalledTimes(1)
  })
})

describe('railLegAt', () => {
  const stop = (assignmentId: number, ownerDayId: number, ownerIndex: number, over: Partial<RoadtripStop> = {}) =>
    ({ assignmentId, ownerDayId, ownerIndex, lat: 50, lng: 10, ...over }) as RoadtripStop
  const day = (dayId: number, stops: RoadtripStop[]) => ({ dayId, stops }) as RoadtripDay

  it('FE-ALTPIN-009: finds the leg leaving the stop filed at the anchor, inside a card or across to the next', () => {
    const days = [
      day(1, [stop(10, 1, 0), stop(11, 1, 1)]),
      // A card that opens on a stop stored the day before, and a night marker standing on
      // the same position as a real stop.
      day(2, [stop(12, 1, 2), stop(12, 1, 2, { automaticNight: { phase: 'start' } as RoadtripStop['automaticNight'] }), stop(20, 2, 0)]),
    ]

    expect(railLegAt(days, { dayId: 1, afterIndex: 0 })).toMatchObject({ from: { assignmentId: 10 }, to: { assignmentId: 11 } })
    expect(railLegAt(days, { dayId: 1, afterIndex: 1 })).toMatchObject({ from: { assignmentId: 11 }, to: { assignmentId: 12 } })
    expect(railLegAt(days, { dayId: 1, afterIndex: 2 })).toMatchObject({ from: { assignmentId: 12 }, to: { assignmentId: 20 } })
  })

  it('FE-ALTPIN-010: a terminal borrowing the index is no answer, and an anchor with nothing after it is none', () => {
    const terminal = stop(-99, 1, 0, { carrier: { role: 'departure' } as RoadtripStop['carrier'] })
    const days = [day(1, [terminal, stop(10, 1, 0), stop(11, 1, 1)])]

    expect(railLegAt(days, { dayId: 1, afterIndex: 0 })).toMatchObject({ from: { assignmentId: 10 }, to: { assignmentId: 11 } })
    expect(railLegAt(days, { dayId: 1, afterIndex: 1 })).toBeNull()
    expect(railLegAt(days, { dayId: 3, afterIndex: 0 })).toBeNull()
  })

  it('FE-ALTPIN-013: neither is the hotel a day sets out from, so a choice on the first leg is still that leg', () => {
    // The morning's hotel borrows the first stop's index. Answering for it, the leg read
    // back was hotel to first stop, and every choice on leg 0 came back as changed.
    const bookend = (id: number, ownerIndex: number, phase: 'morning' | 'evening') => stop(id, 1, ownerIndex, {
      bookend: { phase, accommodationId: 5, reservationId: null, checkingOut: false, checkingIn: false, checkOut: null },
    })
    const days = [day(1, [bookend(-6_000_000_002, 0, 'morning'), stop(10, 1, 0), stop(11, 1, 1), bookend(-6_000_000_003, 2, 'evening')])]

    expect(railLegAt(days, { dayId: 1, afterIndex: 0 })).toMatchObject({ from: { assignmentId: 10 }, to: { assignmentId: 11 } })
    // Behind the last stop the rail drives to tonight's hotel, and that is what it reports.
    expect(railLegAt(days, { dayId: 1, afterIndex: 1 })).toMatchObject({ from: { assignmentId: 11 }, to: { assignmentId: -6_000_000_003 } })
  })
})

describe('railDriveOn', () => {
  const stop = (assignmentId: number, ownerDayId: number, ownerIndex: number) =>
    ({ assignmentId, ownerDayId, ownerIndex, lat: 50, lng: 10 }) as RoadtripStop
  const seg = (distance: number) => ({ distance, duration: distance / 20 }) as RoadtripDay['legs'][number]
  const LEG_LINE: [number, number][] = [[50, 10], [50.2, 10.4]]
  const DRIVE_IN: [number, number][] = [[51, 9], [50, 10]]
  const card = (over: Partial<RoadtripDay> = {}) => ({
    dayId: 2,
    stops: [stop(20, 2, 0), stop(21, 2, 1)],
    legs: [seg(40_000)],
    legLines: [LEG_LINE],
    arrivingFrom: stop(12, 1, 2),
    arrivingLeg: seg(90_000),
    arrivingLine: DRIVE_IN,
    ...over,
  }) as RoadtripDay

  it('FE-ALTPIN-011: a leg is read off its index, the drive in off the stop the day before ended on', () => {
    expect(railDriveOn(card(), { kind: 'leg', index: 0 })).toMatchObject({
      from: { assignmentId: 20 }, to: { assignmentId: 21 }, seg: { distance: 40_000 }, line: LEG_LINE,
    })
    expect(railDriveOn(card(), { kind: 'arriving' })).toMatchObject({
      from: { assignmentId: 12, ownerDayId: 1, ownerIndex: 2 }, to: { assignmentId: 20 }, seg: { distance: 90_000 }, line: DRIVE_IN,
    })
    // Nothing past the last stop, no drive in on a card nothing joins, and no road yet.
    expect(railDriveOn(card(), { kind: 'leg', index: 1 })).toBeNull()
    expect(railDriveOn(card({ arrivingFrom: undefined, arrivingLeg: undefined }), { kind: 'arriving' })).toBeNull()
    expect(railDriveOn(card({ legs: [] }), { kind: 'leg', index: 0 })).toBeNull()
    // A line the card does not have yet is no reason to refuse the drive.
    expect(railDriveOn(card({ legLines: undefined }), { kind: 'leg', index: 0 })?.line).toBeUndefined()
  })
})

describe('refusalHint', () => {
  /** Echoes the key with its values, so a case reads which sentence was picked and with what. */
  const t = (key: string, params?: Record<string, string | number>) =>
    params ? `${key}(${Object.entries(params).map(([k, v]) => `${k}=${v}`).join(',')})` : key

  it('FE-ALTPIN-012: a refused way says what would get it driven: a ferry booking, or the class left out avoided', () => {
    // The ferry the router would not board wins: the crossing is a booking, whatever else
    // the way leaves out.
    expect(refusalHint({ hasFerry: true, avoids: 'motorway' }, { hasFerry: false }, t)).toBe('roadtrip.alt.ferryNotHeld')
    // A way without the motorway on a trip that does not avoid it is held for a few pins
    // at most; ticking the class is what drives it.
    expect(refusalHint({ avoids: 'motorway' }, { hasFerry: false }, t))
      .toBe('roadtrip.alt.avoidNotHeld(class=roadtrip.avoid.motorway,setting=roadtrip.avoid.section)')
    expect(refusalHint({ avoids: 'toll' }, {}, t))
      .toBe('roadtrip.alt.avoidNotHeld(class=roadtrip.avoid.toll,setting=roadtrip.avoid.section)')
    // A plain way, or a ferry the router did board, has no way out to offer.
    expect(refusalHint({}, {}, t)).toBeNull()
    expect(refusalHint({ hasFerry: true }, { hasFerry: true }, t)).toBeNull()
  })
})
