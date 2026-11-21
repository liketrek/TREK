import { describe, it, expect } from 'vitest'
import { bookingSeats, getFlightLegs, getTrainLegs, isMultiLegTrain, seatCells, seatLabel, stripAirportCode, usesStationRoute } from './flightLegs'
import type { Reservation } from '../types'

function res(partial: Partial<Reservation>): Reservation {
  return { id: 1, type: 'train', status: 'confirmed', ...partial } as unknown as Reservation
}

const ep = (role: 'from' | 'to' | 'stop', seq: number, name: string, extra: Record<string, unknown> = {}) =>
  ({ role, sequence: seq, name, code: null, lat: 0, lng: 0, timezone: null, local_time: null, local_date: null, ...extra })

describe('getTrainLegs (#1150)', () => {
  it('reads ordered legs from metadata.legs', () => {
    const r = res({
      metadata: JSON.stringify({
        train_number: 'ICE 100', platform: '5',
        legs: [
          { from: 'Berlin Hbf', to: 'Frankfurt Hbf', train_number: 'ICE 100', platform: '5', dep_time: '08:00', arr_time: '12:00' },
          { from: 'Frankfurt Hbf', to: 'München Hbf', train_number: 'ICE 500', platform: '9', dep_time: '12:30', arr_time: '15:30' },
        ],
      }),
    })
    const legs = getTrainLegs(r)
    expect(legs).toHaveLength(2)
    expect(legs[0]).toMatchObject({ from: 'Berlin Hbf', to: 'Frankfurt Hbf', train_number: 'ICE 100', platform: '5' })
    expect(legs[1]).toMatchObject({ from: 'Frankfurt Hbf', to: 'München Hbf', train_number: 'ICE 500', platform: '9' })
    expect(isMultiLegTrain(r)).toBe(true)
  })

  it('derives a single leg from endpoints + flat metadata (legacy train)', () => {
    const r = res({
      day_id: 3, end_day_id: 3,
      metadata: JSON.stringify({ train_number: 'RE 42', platform: '2' }),
      endpoints: [ep('from', 0, 'Köln Hbf', { local_time: '09:00' }), ep('to', 1, 'Aachen Hbf', { local_time: '10:00' })],
    })
    const legs = getTrainLegs(r)
    expect(legs).toHaveLength(1)
    expect(legs[0]).toMatchObject({ from: 'Köln Hbf', to: 'Aachen Hbf', train_number: 'RE 42', platform: '2', dep_time: '09:00', arr_time: '10:00' })
    expect(isMultiLegTrain(r)).toBe(false)
  })

  it('returns [] for a train with no stations and no train number', () => {
    expect(getTrainLegs(res({ metadata: '{}' }))).toEqual([])
  })

  it('does not disturb getFlightLegs for flights', () => {
    const flight = res({ type: 'flight', metadata: JSON.stringify({ departure_airport: 'FRA', arrival_airport: 'JFK', airline: 'LH', flight_number: 'LH 400' }) })
    const legs = getFlightLegs(flight)
    expect(legs).toHaveLength(1)
    expect(legs[0]).toMatchObject({ from: 'FRA', to: 'JFK', airline: 'LH', flight_number: 'LH 400' })
  })
})

describe('per-segment booking references (#1943)', () => {
  it('reads each segment its own code, and leaves a code-less segment undefined', () => {
    const flight = res({
      type: 'flight',
      confirmation_number: 'BOOK1',
      metadata: JSON.stringify({
        legs: [
          { from: 'FRA', to: 'BER', confirmation_number: 'ABC123' },
          { from: 'BER', to: 'HND' },
        ],
      }),
    })
    const legs = getFlightLegs(flight)
    expect(legs[0].confirmation_number).toBe('ABC123')
    // No fallback to the booking's own code: a segment either has one or it does
    // not, and the booking's reference is shown separately.
    expect(legs[1].confirmation_number).toBeUndefined()
  })

  it('reads a train segment code the same way', () => {
    const train = res({
      metadata: JSON.stringify({
        legs: [
          { from: 'Berlin Hbf', to: 'Frankfurt Hbf', confirmation_number: 'DB-1' },
          { from: 'Frankfurt Hbf', to: 'München Hbf', confirmation_number: 'DB-2' },
        ],
      }),
    })
    expect(getTrainLegs(train).map(l => l.confirmation_number)).toEqual(['DB-1', 'DB-2'])
  })

  it('gives the derived single leg of a legacy booking the booking code', () => {
    const flight = res({
      type: 'flight', confirmation_number: 'BOOK1', day_id: 3,
      metadata: JSON.stringify({ departure_airport: 'FRA', arrival_airport: 'JFK' }),
    })
    expect(getFlightLegs(flight)[0].confirmation_number).toBe('BOOK1')
    const train = res({
      confirmation_number: 'BOOK2',
      endpoints: [ep('from', 0, 'Köln Hbf'), ep('to', 1, 'Aachen Hbf')],
      metadata: '{}',
    })
    expect(getTrainLegs(train)[0].confirmation_number).toBe('BOOK2')
  })
})

describe('the seats of a booking with a stop', () => {
  const stopover = (legs: object[], extra: Record<string, unknown> = {}) =>
    res({ type: 'flight', metadata: JSON.stringify({ ...extra, legs }) })

  it('reads each flight leg its own seat, so one booked only on the second leg is not lost', () => {
    const r = stopover([{ from: 'MXP', to: 'IST' }, { from: 'IST', to: 'JFK', seat: '14C' }])
    expect(getFlightLegs(r).map(l => l.seat)).toEqual([undefined, '14C'])
    expect(bookingSeats(r)).toEqual([{ route: 'IST → JFK', seat: '14C' }])
  })

  it('gives the first leg the flat seat when it has none of its own, as the booking form does', () => {
    const r = stopover([{ from: 'MXP', to: 'IST' }, { from: 'IST', to: 'JFK' }], { seat: '3A' })
    expect(getFlightLegs(r).map(l => l.seat)).toEqual(['3A', undefined])
    expect(bookingSeats(r)).toEqual([{ route: 'MXP → IST', seat: '3A' }])
  })

  it('lists a train with a stop leg by leg too', () => {
    const r = res({ metadata: JSON.stringify({ legs: [{ from: 'Takayama', to: 'Nagoya', seat: '10-4C' }, { from: 'Nagoya', to: 'Kyoto', seat: '4-5A' }] }) })
    expect(bookingSeats(r)).toEqual([{ route: 'Takayama → Nagoya', seat: '10-4C' }, { route: 'Nagoya → Kyoto', seat: '4-5A' }])
  })

  it('gives a booking of one leg, of any type, its own seat without a route', () => {
    expect(bookingSeats(res({ type: 'flight', metadata: JSON.stringify({ seat: '31A' }) }))).toEqual([{ route: null, seat: '31A' }])
    expect(bookingSeats(res({ type: 'event', metadata: JSON.stringify({ seat: 'Row 4' }) }))).toEqual([{ route: null, seat: 'Row 4' }])
    expect(bookingSeats(res({ type: 'flight', metadata: null }))).toEqual([])
  })

  it('labels a leg seat with its route and a booking seat plainly', () => {
    expect(seatLabel('Seat', 'IST → JFK')).toBe('Seat IST → JFK')
    expect(seatLabel('Seat', null)).toBe('Seat')
    const r = stopover([{ from: 'MXP', to: 'IST', seat: '3A' }, { from: 'IST', to: 'JFK', seat: '14C' }])
    expect(seatCells(r, 'Seat', ' · Economy')).toEqual([{ label: 'Seat', value: '3A, 14C · Economy' }])
    expect(seatCells(res({ type: 'flight', metadata: null }), 'Seat')).toEqual([])
  })
})

describe('stripAirportCode', () => {
  it('drops the code the forms and the airport backfill append, and nothing else', () => {
    expect(stripAirportCode('Paris Charles de Gaulle (CDG)')).toBe('Paris Charles de Gaulle')
    expect(stripAirportCode('Hamburg (HAM)  ')).toBe('Hamburg')
    // A station has no such suffix, and a bracket that is not a code stays.
    expect(stripAirportCode('Hamburg Hbf')).toBe('Hamburg Hbf')
    expect(stripAirportCode('Frankfurt (Main)')).toBe('Frankfurt (Main)')
    expect(stripAirportCode('Munich (muc)')).toBe('Munich (muc)')
  })
})

describe('usesStationRoute (#1807)', () => {
  it('covers trains and cruises, nothing else', () => {
    expect(usesStationRoute('train')).toBe(true)
    expect(usesStationRoute('cruise')).toBe(true)
    expect(usesStationRoute('ferry')).toBe(false)
    expect(usesStationRoute(null)).toBe(false)
  })
})
