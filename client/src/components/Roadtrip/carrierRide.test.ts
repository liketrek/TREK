import { describe, expect, it } from 'vitest'
import { missedRide, rideDuration, rideReading, terminalReading } from './carrierRide'
import type { CarrierTerminal, RoadtripStop, RouteSegment, ScheduleWarning } from '@trek/shared/roadtrip'

// FE-CARRIER-RIDE-001 to FE-CARRIER-RIDE-009

/** A translator that shows the key and what went into it, so a test reads which sentence was asked for. */
const t = (key: string, params?: Record<string, string | number | null>) =>
  params ? `${key}(${Object.entries(params).map(([k, v]) => `${k}=${v}`).join(',')})` : key

/**
 * One end of LH 2078 as the routing round seats it: the departure pinned an hour ahead of
 * the timetable for the check-in and left at the timetable's minute, the arrival pinned at
 * its own. Named the way every airport writer names an endpoint.
 */
function terminal(role: CarrierTerminal['role'], over: Partial<CarrierTerminal> = {}, stop: Partial<RoadtripStop> = {}): RoadtripStop {
  const departs = role === 'departure'
  const carrier: CarrierTerminal = {
    reservationId: 78,
    type: 'flight',
    role,
    title: 'LH 2078 HAM-MUC (ohne Endpunkte)',
    code: departs ? 'HAM' : 'MUC',
    at: departs ? '15:15' : '17:20',
    ...over,
  }
  return {
    assignmentId: departs ? -780 : -781,
    ownerDayId: 3,
    ownerIndex: 1,
    placeId: -78,
    name: departs ? 'Hamburg (HAM)' : 'Munich (MUC)',
    lat: departs ? 53.63 : 48.35,
    lng: departs ? 9.99 : 11.78,
    time: departs ? '14:15' : '17:20',
    dwellMinutes: departs ? 60 : 0,
    legMode: departs ? carrier.type : null,
    incomingLegMode: departs ? null : carrier.type,
    stopType: null,
    carrier,
    ...stop,
  }
}

const FLIGHT: RouteSegment = {
  mid: [50, 10], from: [53.63, 9.99], to: [48.35, 11.78],
  distance: 0, duration: 7500, walkingText: '', drivingText: '', distanceText: '', durationText: '2 h 5 min',
  mode: 'flight',
}

const late = (minutes: number): ScheduleWarning => ({ index: 1, code: 'late', minutes })

const read = (warnings: ScheduleWarning[] = [], is12h = false, over: Partial<CarrierTerminal> = {}) =>
  rideReading({
    departure: terminal('departure', over),
    arrival: terminal('arrival', over),
    entries: [
      { arrival: '14:15', departure: '15:15', anchored: true, dayOffset: 0 },
      { arrival: '17:20', departure: '17:20', anchored: true, dayOffset: 0 },
    ],
    warnings,
    seg: FLIGHT,
  }, t, is12h)

describe('a ride as its block reads it', () => {
  it('FE-CARRIER-RIDE-001: every fact once, the title as typed, the code off the place, and the check-in with its hour', () => {
    const ride = read()
    expect(ride.title).toBe('LH 2078 HAM-MUC (ohne Endpunkte)')
    expect(ride.duration).toBe('2 h 5 min')
    expect(ride.from).toEqual({
      code: 'HAM',
      place: 'Hamburg',
      chip: 'HAM',
      placeLine: 'Hamburg',
      clock: '15:15',
      dayOffset: 0,
      label: 'roadtrip.ride.departureFlight(time=15:15)',
    })
    expect(ride.to).toMatchObject({ chip: 'MUC', placeLine: 'Munich', clock: '17:20', label: 'roadtrip.ride.arrival(time=17:20)' })
    expect(ride.checkIn).toEqual({
      state: 'ok',
      lead: 'roadtrip.ride.checkIn',
      value: '14:15',
      hint: 'roadtrip.ride.hintFlight(title=LH 2078 HAM-MUC (ohne Endpunkte),departs=15:15,pin=14:15)',
    })
  })

  it('FE-CARRIER-RIDE-002: reached after the check-in but before take-off is tight, and says by how much', () => {
    const checkIn = read([late(25)]).checkIn!
    expect(checkIn.state).toBe('tight')
    expect(checkIn.lead).toBe('roadtrip.ride.checkIn')
    expect(checkIn.value).toBe('roadtrip.ride.lateBy(time=25 min)')
    expect(checkIn.hint).toBe(
      'roadtrip.ride.lateHintFlight(title=LH 2078 HAM-MUC (ohne Endpunkte),departs=15:15,pin=14:15,place=Hamburg,time=14:40)',
    )
    // Reaching the gate as the plane leaves is still a catch.
    expect(read([late(60)]).checkIn!.state).toBe('tight')
  })

  it('FE-CARRIER-RIDE-003: reached after take-off is missed, and says when the drive gets there instead of a delta', () => {
    const checkIn = read([late(579)]).checkIn!
    expect(checkIn.state).toBe('missed')
    expect(checkIn.lead).toBe('roadtrip.ride.missed')
    expect(checkIn.value).toBe('roadtrip.ride.reachedAt(time=23:54)')
    expect(checkIn.hint).toContain('place=Hamburg,time=23:54')
    // Past midnight the clock carries its day the way the rail's arrivals do, in the reader's clock.
    expect(read([late(12 * 60 + 15)], true).checkIn!.value).toBe('roadtrip.ride.reachedAt(time=2:30 AM+1)')
    // Findings that are not about being late leave the check-in alone.
    expect(read([{ index: 1, code: 'leg', overMinutes: 30 }]).checkIn!.state).toBe('ok')
  })

  it('FE-CARRIER-RIDE-004: a train or a bus is boarded, a ferry or a cruise sails, and only a flight has its own departure word', () => {
    const train = read([], false, { type: 'train', code: null })
    expect(train.checkIn!.lead).toBe('roadtrip.ride.boarding')
    expect(train.checkIn!.hint).toMatch(/^roadtrip\.ride\.hintBoarding\(/)
    expect(train.from.label).toBe('roadtrip.ride.departure(time=15:15)')
    expect(read([late(25)], false, { type: 'bus' }).checkIn!.hint).toMatch(/^roadtrip\.ride\.lateHintBoarding\(/)
    const ferry = read([], false, { type: 'ferry' })
    expect(ferry.checkIn!.lead).toBe('roadtrip.ride.checkIn')
    expect(ferry.checkIn!.hint).toMatch(/^roadtrip\.ride\.hintShip\(/)
    expect(read([], false, { type: 'cruise' }).checkIn!.hint).toMatch(/^roadtrip\.ride\.hintShip\(/)
  })

  it('FE-CARRIER-RIDE-005: a terminal without a code puts its name in the chip, and one without a timetable names no clock and no check-in', () => {
    const station = rideReading({
      departure: terminal('departure', { type: 'train', code: null, at: null }, { name: 'Hamburg Hbf', time: null }),
      arrival: terminal('arrival', { type: 'train', code: null, at: null }, { name: 'München Hbf', time: null }),
      entries: [undefined, { arrival: '07:20', departure: '07:20', anchored: false, dayOffset: 1 }],
      warnings: [],
      seg: undefined,
    }, t, false)
    expect(station.from).toMatchObject({ code: null, chip: 'Hamburg Hbf', placeLine: null, clock: null, label: null, dayOffset: 0 })
    expect(station.to).toMatchObject({ chip: 'München Hbf', dayOffset: 1 })
    expect(station.duration).toBeNull()
    expect(station.checkIn).toBeNull()
  })
})

describe('a terminal on a row of its own', () => {
  it('FE-CARRIER-RIDE-006: a desk says which one it is and has no check-in; a lone departure has one, a lone arrival has none', () => {
    const pickup = terminalReading(
      terminal('pickup', { type: 'car', title: 'Sixt Hamburg', code: null, at: '09:00' }, { name: 'Sixt Hauptbahnhof', time: '09:00' }),
      undefined,
      [],
      t,
      false,
    )
    expect(pickup.desk).toBe('reservations.span.pickup')
    expect(pickup.checkIn).toBeNull()
    expect(pickup.end).toMatchObject({ place: 'Sixt Hauptbahnhof', clock: '09:00', label: 'roadtrip.ride.pickup(time=09:00)' })

    const leaving = terminalReading(terminal('departure'), undefined, [late(579)], t, false)
    expect(leaving.desk).toBeNull()
    expect(leaving.checkIn!.state).toBe('missed')
    expect(terminalReading(terminal('arrival'), undefined, [late(30)], t, false).checkIn).toBeNull()
  })
})

describe('the day a ride is missed on', () => {
  const day = (warnings: ScheduleWarning[], type = 'flight') => ({
    stops: [
      { ...terminal('pickup', { type: 'car', code: null }), carrier: undefined, name: 'Hotel Atlantic' },
      terminal('departure', { type }),
      terminal('arrival', { type }),
    ],
    schedule: { entries: [], warnings },
  })

  it('FE-CARRIER-RIDE-007: names the kind of ride in the header and keeps the sentence for its tooltip', () => {
    expect(missedRide(day([late(579)]), t, false)).toEqual({
      label: 'roadtrip.day.rideMissed.flight',
      hint: expect.stringContaining('time=23:54'),
    })
    expect(missedRide(day([late(579)], 'ferry'), t, false)!.label).toBe('roadtrip.day.rideMissed.ferry')
  })

  it('FE-CARRIER-RIDE-008: a ride caught, late or not, and a finding at another stop say nothing in the header', () => {
    expect(missedRide(day([]), t, false)).toBeNull()
    expect(missedRide(day([late(25)]), t, false)).toBeNull()
    expect(missedRide(day([{ index: 2, code: 'late', minutes: 600 }]), t, false)).toBeNull()
  })
})

describe('rideDuration', () => {
  it('FE-CARRIER-RIDE-009: the leg\'s own text, else its seconds, else nothing', () => {
    expect(rideDuration(FLIGHT)).toBe('2 h 5 min')
    expect(rideDuration({ ...FLIGHT, durationText: '' })).toBe('2 h 5 min')
    expect(rideDuration({ ...FLIGHT, durationText: '', duration: 0 })).toBeNull()
    expect(rideDuration(undefined)).toBeNull()
  })
})
