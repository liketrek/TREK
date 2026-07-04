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
