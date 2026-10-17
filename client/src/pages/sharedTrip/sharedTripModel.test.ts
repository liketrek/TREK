import { describe, it, expect } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import {
  coverSrc, dayHasEntries, formatDateRange, formatDurationMinutes, groupInOrder, isHttpUrl, isSharedTripPayload, legFacts, linkHost,
  sharedTripLoadError, spanLabelKey, stopNumbers, transportFacts, unplannedPlaces,
} from './sharedTripModel'

describe('sharedTripModel (#2320)', () => {
  it('accepts http and https and nothing else', () => {
    expect(isHttpUrl('https://a.example/x')).toBe(true)
    expect(isHttpUrl(' http://a.example ')).toBe(true)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('data:text/html,hi')).toBe(false)
    expect(isHttpUrl('ftp://a.example')).toBe(false)
    expect(isHttpUrl('not a url')).toBe(false)
    expect(isHttpUrl('')).toBe(false)
    expect(isHttpUrl(null)).toBe(false)
    expect(isHttpUrl(42)).toBe(false)
  })

  it('writes a planned stay as minutes, hours, or both', () => {
    expect(formatDurationMinutes(45)).toBe('45 min')
    expect(formatDurationMinutes(60)).toBe('1 h')
    expect(formatDurationMinutes(150)).toBe('2 h 30 min')
    expect(formatDurationMinutes(89.6)).toBe('1 h 30 min')
  })

  it('writes nothing for a missing, zero or nonsense figure', () => {
    expect(formatDurationMinutes(null)).toBeNull()
    expect(formatDurationMinutes(undefined)).toBeNull()
    expect(formatDurationMinutes(0)).toBeNull()
    expect(formatDurationMinutes(-5)).toBeNull()
    expect(formatDurationMinutes(Number.NaN)).toBeNull()
  })

  it('labels a link by its host, without the www', () => {
    expect(linkHost('https://www.bahn.example/booking/abc')).toBe('bahn.example')
    expect(linkHost('https://booking.example')).toBe('booking.example')
    expect(linkHost('nonsense')).toBe('nonsense')
  })
})

describe('sharedTripLoadError (#2505)', () => {
  // What the share endpoint sends for an unknown, expired or revoked token.
  const ENDPOINT_404 = { error: 'Invalid or expired link' }

  const answered = (status: number, data: unknown = ENDPOINT_404) =>
    new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
      status,
      statusText: '',
      data,
      headers: {},
      config: { headers: new AxiosHeaders() },
    })

  it('calls only the endpoint 404 an expired link', () => {
    expect(sharedTripLoadError(answered(404))).toBe('expired')
  })

  it('treats every other answer as a failed load', () => {
    for (const status of [400, 401, 403, 408, 429, 500, 502, 503, 504]) {
      expect(sharedTripLoadError(answered(status))).toBe('unavailable')
    }
  })

  it('does not take a 404 without the TREK error body for an expired link', () => {
    // Traefik with the container stopped or still starting, nginx, an empty
    // answer: a 404 from something in front of TREK says nothing about the token.
    expect(sharedTripLoadError(answered(404, '404 page not found\n'))).toBe('unavailable')
    expect(sharedTripLoadError(answered(404, '<html><body><h1>404 Not Found</h1></body></html>'))).toBe('unavailable')
    expect(sharedTripLoadError(answered(404, ''))).toBe('unavailable')
    expect(sharedTripLoadError(answered(404, null))).toBe('unavailable')
    expect(sharedTripLoadError(answered(404, {}))).toBe('unavailable')
    expect(sharedTripLoadError(answered(404, [{ error: 'x' }]))).toBe('unavailable')
    expect(sharedTripLoadError(answered(404, { error: 404 }))).toBe('unavailable')
  })

  it('treats a request without any answer as a failed load', () => {
    expect(sharedTripLoadError(new AxiosError('Network Error', AxiosError.ERR_NETWORK))).toBe('unavailable')
    expect(sharedTripLoadError(new AxiosError('timeout of 8000ms exceeded', AxiosError.ECONNABORTED))).toBe('unavailable')
    expect(sharedTripLoadError(new TypeError('Failed to fetch'))).toBe('unavailable')
    expect(sharedTripLoadError(undefined)).toBe('unavailable')
    expect(sharedTripLoadError(null)).toBe('unavailable')
  })
})

describe('isSharedTripPayload (#2505)', () => {
  it('accepts what the share endpoint sends', () => {
    expect(isSharedTripPayload({ trip: { id: 1, title: 'Lisbon' }, days: [], permissions: {} })).toBe(true)
  })

  it('rejects a 200 that is not the share payload', () => {
    // An auth wall or a captive portal answering the API call with its own page.
    expect(isSharedTripPayload('<!doctype html><html><body>Sign in</body></html>')).toBe(false)
    expect(isSharedTripPayload('')).toBe(false)
    expect(isSharedTripPayload(null)).toBe(false)
    expect(isSharedTripPayload(undefined)).toBe(false)
    expect(isSharedTripPayload([])).toBe(false)
    expect(isSharedTripPayload({})).toBe(false)
    expect(isSharedTripPayload({ trip: null })).toBe(false)
    expect(isSharedTripPayload({ trip: 'Lisbon' })).toBe(false)
  })
})

describe('sharedTripModel, the redesigned page', () => {
  it('reads a cover in each of the three shapes the column holds', () => {
    expect(coverSrc(null)).toBeNull()
    expect(coverSrc('https://cdn.example/a.jpg')).toBe('https://cdn.example/a.jpg')
    expect(coverSrc('/uploads/covers/b.jpg')).toBe('/uploads/covers/b.jpg')
    expect(coverSrc('c.jpg')).toBe('/uploads/c.jpg')
  })

  it('prints a range with an arrow, a single date alone, and nothing without dates', () => {
    expect(formatDateRange('2026-07-07', '2026-07-25', 'en-US')).toBe('Jul 7, 2026 → Jul 25, 2026')
    expect(formatDateRange('2026-07-07', null, 'en-US')).toBe('Jul 7, 2026')
    expect(formatDateRange(null, undefined, 'en-US')).toBeNull()
  })

  it('numbers stops by their order, counts a stop without a place, and gives a revisited place both numbers', () => {
    const { byAssignment, byPlace } = stopNumbers([
      { id: 3, order_index: 2, place: { id: 10 } },
      { id: 1, order_index: 0, place: { id: 10 } },
      { id: 2, order_index: 1, place: null },
      { id: 4, order_index: 3, place: { id: 11 } },
    ])
    expect(byAssignment).toEqual({ 1: 1, 2: 2, 3: 3, 4: 4 })
    expect(byPlace).toEqual({ 10: [1, 3], 11: [4] })
  })

  it('groups in the order the groups first appear', () => {
    expect(groupInOrder(['b1', 'a1', 'b2'], v => v[0])).toEqual([['b', ['b1', 'b2']], ['a', ['a1']]])
  })

  it('names each end of a span the way the planner does, and a single day not at all', () => {
    expect(spanLabelKey('flight', 'single')).toBeNull()
    expect(spanLabelKey('flight', 'start')).toBe('reservations.span.departure')
    expect(spanLabelKey('flight', 'middle')).toBe('reservations.span.inTransit')
    expect(spanLabelKey('car', 'end')).toBe('reservations.span.return')
    expect(spanLabelKey('parking', 'start')).toBe('reservations.span.dropOff')
    expect(spanLabelKey('parking', 'end')).toBe('reservations.span.pickup')
    expect(spanLabelKey('hotel', 'middle')).toBe('reservations.span.ongoing')
  })

  it('states the facts of a transport row, those of the leg itself for a leg, and none for other types', () => {
    expect(transportFacts({ type: 'flight', metadata: { airline: 'LH', flight_number: '190', departure_airport: 'FRA', arrival_airport: 'BER' } }, 'Platform'))
      .toEqual(['LH', '190', 'FRA → BER'])
    expect(transportFacts({ type: 'flight', metadata: JSON.stringify({ airline: 'KLM', departure_airport: 'AMS' }) }, 'Platform')).toEqual(['KLM'])
    expect(transportFacts({ type: 'flight', metadata: {}, __leg: { index: 1, airline: 'EK', flight_number: '46', from: 'FRA', to: null } }, 'Platform'))
      .toEqual(['EK', '46', 'FRA'])
    expect(transportFacts({ type: 'train', metadata: '{"train_number":"ICE 5","platform":"7"}' }, 'Platform')).toEqual(['ICE 5', 'Platform 7'])
    expect(transportFacts({ type: 'train', metadata: {}, __leg: { index: 0, train_number: 'EC 51', from: 'Basel', to: 'Milano' } }, 'Gleis'))
      .toEqual(['EC 51', 'Basel → Milano'])
    expect(transportFacts({ type: 'train', metadata: 'not json' }, 'Platform')).toEqual([])
    expect(transportFacts({ type: 'bus', metadata: { airline: 'Flix' } }, 'Platform')).toEqual([])
  })

  it('lists a leg with its carrier, number, platform and route', () => {
    expect(legFacts({ train_number: 'IC 8', platform: '12', from: 'Bern', to: 'Zurich' }, 'Platform')).toEqual(['IC 8', 'Platform 12', 'Bern → Zurich'])
    expect(legFacts({ airline: 'Emirates', flight_number: 'EK350' }, 'Platform')).toEqual(['Emirates', 'EK350'])
  })
})

describe('unplanned places and day entries (#1758, #1712)', () => {
  it('keeps the pool places no day has picked up, in pool order', () => {
    const places = [{ id: 3 }, { id: 1 }, { id: 2 }]
    const assignments = { 10: [{ place: { id: 1 } }, { place: null }], 11: [] }
    expect(unplannedPlaces(places, assignments)).toEqual([{ id: 3 }, { id: 2 }])
    expect(unplannedPlaces([], assignments)).toEqual([])
  })

  it('counts a day with an entry or a night booked', () => {
    expect(dayHasEntries(0, 0)).toBe(false)
    expect(dayHasEntries(1, 0)).toBe(true)
    expect(dayHasEntries(0, 1)).toBe(true)
  })
})
