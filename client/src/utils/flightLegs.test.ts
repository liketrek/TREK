import { describe, it, expect } from 'vitest'
import { getFlightLegs, getTrainLegs, isMultiLegTrain } from './flightLegs'
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
