import { describe, it, expect, vi } from 'vitest'
import { serviceStopChoice, serviceStopLegs, type ServiceStopMode } from './manualStop'

/**
 * FE-SERVICESTOP-001..010, 017..021: where a stop added by hand lands on the drive.
 *
 * The arithmetic on its own, free of React: which leg the form offers and where the stop
 * actually goes, from coordinates that only exist once a place has been chosen. One
 * function answers both, so what the select shows and what the save writes cannot
 * disagree, and a dropdown naming one leg while the stop lands on another is a lie told
 * quietly.
 */

const mode = (over: Partial<ServiceStopMode> = {}): ServiceStopMode => ({
  days: [
    { dayId: 5, dayNumber: 1, stops: ['Hamburg', 'Bremen', 'Berlin'] },
    { dayId: 6, dayNumber: 2, stops: ['Berlin', 'Dresden'] },
  ],
  appendDay: { dayId: 5, dayNumber: 1, position: 3 },
  targetFor: () => null,
  ...over,
})

/** A drive with places on it but no line drawn between them yet. */
const unrouted = () => mode({ days: [], appendDay: { dayId: 5, dayNumber: 1, position: 2 } })

/** Two stretches of one day, an even degree apart, so "nearer" is arithmetic and not luck. */
const measured = () => mode({
  days: [{
    dayId: 5,
    dayNumber: 1,
    stops: ['Hamburg', 'Bremen', 'Berlin'],
    legLines: [
      [{ lat: 50, lng: 10 }, { lat: 50, lng: 11 }],
      [{ lat: 51, lng: 10 }, { lat: 51, lng: 11 }],
    ],
  }],
  appendDay: null,
})

describe('serviceStopLegs', () => {
  it('FE-SERVICESTOP-001: every leg of every routed day, flat and in driving order', () => {
    expect(serviceStopLegs(mode().days).map(l => [l.value, l.position, l.from, l.to])).toEqual([
      ['5:0', 1, 'Hamburg', 'Bremen'],
      ['5:1', 2, 'Bremen', 'Berlin'],
      ['6:0', 1, 'Berlin', 'Dresden'],
    ])
  })

  it('FE-SERVICESTOP-002: a day with one stop has no leg to sit between', () => {
    expect(serviceStopLegs([{ dayId: 5, dayNumber: 1, stops: ['Hamburg'] }])).toEqual([])
  })

  it('FE-SERVICESTOP-020: a leg with no drawn road reports no distance and keeps its place', () => {
    // Null is not zero: zero would say the place stands on that road, and a leg nobody
    // could measure would then be offered ahead of every leg somebody could.
    const days = [
      { dayId: 5, dayNumber: 1, stops: ['Hamburg', 'Bremen'] },
      { dayId: 6, dayNumber: 2, stops: ['Berlin', 'Dresden'], legLines: [[{ lat: 51, lng: 10 }, { lat: 51, lng: 11 }]] },
    ]
    const legs = serviceStopLegs(days, { lat: 50.9, lng: 10.5 })

    expect(legs.map(l => l.value)).toEqual(['6:0', '5:0'])
    expect(legs[1]?.offRouteKm).toBeNull()
  })
})

describe('serviceStopChoice', () => {
  it('FE-SERVICESTOP-003: with no coordinates nothing is offered and nothing is placed', () => {
    // A name on its own cannot be measured onto a road. Picking a leg for it anyway
    // filed a petrol stop into the middle of the trip's first day without a word.
    const targetFor = vi.fn(() => ({ dayId: 6, position: 1, offRouteKm: 0 }))
    const choice = serviceStopChoice(mode({ targetFor }), null, null, '')

    expect(targetFor).not.toHaveBeenCalled()
    expect(choice.located).toBe(false)
    expect(choice.legs).toEqual([])
    expect(choice.end).toBeNull()
    expect(choice.placement).toBeNull()
  })

  it('FE-SERVICESTOP-004: a place is measured onto the drive, and that leg is preselected', () => {
    const targetFor = vi.fn(() => ({ dayId: 6, position: 1, offRouteKm: 0.4 }))
    const choice = serviceStopChoice(mode({ targetFor }), 51.05, 13.7, '')

    expect(targetFor).toHaveBeenCalledWith(51.05, 13.7)
    expect(choice.legValue).toBe('6:0')
    expect(choice.placement).toEqual({ dayId: 6, position: 1, offRouteKm: 0.4 })
  })

  it('FE-SERVICESTOP-005: the leg the traveller picked beats the one the drive guessed', () => {
    // A drive that passes the same junction twice can only be guessed at once, and they
    // are the one who knows which time they mean to stop.
    const targetFor = () => ({ dayId: 6, position: 1, offRouteKm: 0.4 })
    const choice = serviceStopChoice(mode({ targetFor }), 51.05, 13.7, '5:1')

    // No distance: the 0.4 km was measured against the stretch the projection named,
    // and this is a different one. A leg with no drawn road of its own says nothing
    // rather than borrowing a figure that is about somewhere else.
    expect(choice.placement).toEqual({ dayId: 5, position: 2, offRouteKm: null })
  })

  it('FE-SERVICESTOP-006: a place well off the road is placed all the same', () => {
    // The charger this whole path exists for is exactly the one sitting further off the
    // drawn line than a via is allowed to be. Refusing it would refuse the request.
    const targetFor = () => ({ dayId: 5, position: 2, offRouteKm: 14.8 })
    const choice = serviceStopChoice(mode({ targetFor }), 41.9, 12.5, '')

    expect(choice.placement).toEqual({ dayId: 5, position: 2, offRouteKm: 14.8 })
  })

  it('FE-SERVICESTOP-007: a leg the drive no longer draws falls back to the first offered', () => {
    const choice = serviceStopChoice(mode(), 53.5, 9.9, '9:4')
    expect(choice.legValue).toBe('5:0')
  })

  it('FE-SERVICESTOP-008: with nothing routed it goes at the end of the panel day', () => {
    const choice = serviceStopChoice(unrouted(), 53.5, 9.9, '')
    expect(choice.legs).toEqual([])
    expect(choice.end).toEqual({ value: '5:end', dayId: 5, dayNumber: 1, position: 2 })
    expect(choice.placement).toEqual({ dayId: 5, position: 2, offRouteKm: 0 })
  })

  it('FE-SERVICESTOP-009: with no drive and no day there is nowhere to put anything', () => {
    const choice = serviceStopChoice(mode({ days: [], appendDay: null }), 53.5, 9.9, '')
    expect(choice.placement).toBeNull()
  })

  it('FE-SERVICESTOP-010: half a coordinate is no coordinate, so nothing is placed', () => {
    const targetFor = vi.fn(() => ({ dayId: 6, position: 1, offRouteKm: 0 }))
    const choice = serviceStopChoice(mode({ targetFor }), Number.NaN, 13.7, '')

    expect(targetFor).not.toHaveBeenCalled()
    expect(choice.located).toBe(false)
    expect(choice.placement).toBeNull()
  })

  it('FE-SERVICESTOP-017: the day the panel is on stays reachable once the others have routed', () => {
    // Days 1 and 2 are drawn and the panel is on a third that is still calculating. Left
    // out, a stop meant for it was filed on one of the two without a word.
    const panelStillCalculating = mode({ appendDay: { dayId: 7, dayNumber: 3, position: 2 } })

    const offered = serviceStopChoice(panelStillCalculating, 53.5, 9.9, '')
    expect(offered.end).toEqual({ value: '7:end', dayId: 7, dayNumber: 3, position: 2 })

    // And it is a choice, not a label: picking it lands the stop on that day.
    const chosen = serviceStopChoice(panelStillCalculating, 53.5, 9.9, '7:end')
    expect(chosen.placement).toEqual({ dayId: 7, position: 2, offRouteKm: 0 })
  })

  it('FE-SERVICESTOP-018: a projection past the last stop of a day stays on that day', () => {
    // Legs carry positions 1..stops-1, and the night-drive branch can answer with
    // stops.length. No leg matches, and the first leg of the whole trip, which is what an
    // unfiltered fallback reached for, is a day and several hundred kilometres away.
    const targetFor = () => ({ dayId: 6, position: 2, offRouteKm: 1.1 })
    const choice = serviceStopChoice(mode({ targetFor }), 51.05, 13.7, '')

    expect(choice.legValue).toBe('6:0')
    // The 1.1 km belonged to the position the projection named, which is not this one,
    // so the fallback keeps the day and drops the figure rather than reusing it.
    expect(choice.placement).toEqual({ dayId: 6, position: 1, offRouteKm: null })
  })

  it('FE-SERVICESTOP-019: the legs are measured one by one and offered nearest first', () => {
    const choice = serviceStopChoice(measured(), 50.9, 10.5, '')

    // A tenth of a degree from the second stretch, nine tenths from the first.
    expect(choice.legs.map(l => l.value)).toEqual(['5:1', '5:0'])
    expect(choice.legs[0]?.offRouteKm).toBeCloseTo(11.1, 0)
    expect(choice.legs[1]?.offRouteKm).toBeCloseTo(100, 0)
    // Nothing projected, so the nearest measured stretch is the one on offer, and the
    // distance it carries is its own rather than the whole day's.
    expect(choice.legValue).toBe('5:1')
    expect(choice.placement?.position).toBe(2)
    expect(choice.placement?.offRouteKm).toBeCloseTo(11.1, 0)
  })

  it('FE-SERVICESTOP-021: overruling onto a far stretch moves the distance with it', () => {
    const choice = serviceStopChoice(measured(), 50.9, 10.5, '5:0')

    expect(choice.placement?.position).toBe(1)
    expect(choice.placement?.offRouteKm).toBeCloseTo(100, 0)
  })
})
