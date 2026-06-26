import { describe, it, expect } from 'vitest'
import type { Day, Accommodation } from '../types'
import { getDayOrder, isDayInAccommodationRange, getAccommodationAnchors, getDayBookendHotels } from './dayOrder'

const days = [
  { id: 10, day_number: 1 },
  { id: 20, day_number: 2 },
  { id: 30, day_number: 3 },
] as unknown as Day[]

const hotel = (over: Partial<Accommodation>): Accommodation =>
  ({ place_lat: 48.1, place_lng: 11.5, start_day_id: 10, end_day_id: 30, ...over }) as Accommodation

describe('getDayOrder', () => {
  it('prefers day_number when present', () => {
    expect(getDayOrder(days[1], days)).toBe(2)
  })
  it('falls back to array index when day_number is missing', () => {
    const noNumber = [{ id: 5 }, { id: 6 }] as unknown as Day[]
    expect(getDayOrder(noNumber[1], noNumber)).toBe(1)
  })
})

describe('isDayInAccommodationRange', () => {
  it('is inclusive of both the check-in and check-out day', () => {
    expect(isDayInAccommodationRange(days[0], 10, 30, days)).toBe(true) // check-in morning
    expect(isDayInAccommodationRange(days[1], 10, 30, days)).toBe(true) // mid-stay
    expect(isDayInAccommodationRange(days[2], 10, 30, days)).toBe(true) // check-out day
  })
  it('excludes days outside the stay', () => {
    expect(isDayInAccommodationRange(days[0], 20, 30, days)).toBe(false)
  })
})

describe('getAccommodationAnchors', () => {
  it('returns no anchors when the day has no accommodation', () => {
    expect(getAccommodationAnchors(days[1], days, [])).toEqual({})
  })

  it('anchors both ends to the same hotel on a mid-stay day (round trip)', () => {
    const accs = [hotel({ start_day_id: 10, end_day_id: 30, place_lat: 48.1, place_lng: 11.5 })]
    expect(getAccommodationAnchors(days[1], days, accs)).toEqual({
      start: { lat: 48.1, lng: 11.5 },
      end: { lat: 48.1, lng: 11.5 },
    })
  })

  it('loops a single hotel on its check-out day (home base for the day)', () => {
    const accs = [hotel({ start_day_id: 10, end_day_id: 20, place_lat: 1, place_lng: 2 })]
    expect(getAccommodationAnchors(days[1], days, accs)).toEqual({ start: { lat: 1, lng: 2 }, end: { lat: 1, lng: 2 } })
  })

  it('loops a single hotel on its check-in day (home base for the day)', () => {
    const accs = [hotel({ start_day_id: 20, end_day_id: 30, place_lat: 3, place_lng: 4 })]
    expect(getAccommodationAnchors(days[1], days, accs)).toEqual({ start: { lat: 3, lng: 4 }, end: { lat: 3, lng: 4 } })
  })

  it('uses the checked-out hotel as start and the checked-in hotel as end on a transfer day', () => {
    const accs = [
      hotel({ start_day_id: 10, end_day_id: 20, place_lat: 1, place_lng: 1 }), // checkout today
      hotel({ start_day_id: 20, end_day_id: 30, place_lat: 9, place_lng: 9 }), // check-in today
    ]
    expect(getAccommodationAnchors(days[1], days, accs)).toEqual({
      start: { lat: 1, lng: 1 },
      end: { lat: 9, lng: 9 },
    })
  })

  it('ignores accommodations that have no coordinates', () => {
    const accs = [hotel({ start_day_id: 10, end_day_id: 30, place_lat: null, place_lng: null })]
    expect(getAccommodationAnchors(days[1], days, accs)).toEqual({})
  })

  it('keeps morning/evening correct on a transfer day when the morning stay runs long (#887)', () => {
    const accs = [
      hotel({ start_day_id: 10, end_day_id: 30, place_lat: 1, place_lng: 1 }), // slept here, checks out later
      hotel({ start_day_id: 20, end_day_id: 30, place_lat: 9, place_lng: 9 }), // check-in today
    ]
    expect(getAccommodationAnchors(days[1], days, accs)).toEqual({
      start: { lat: 1, lng: 1 },
      end: { lat: 9, lng: 9 },
    })
  })
})

describe('getDayBookendHotels', () => {
  it('returns nothing when the day has no accommodation', () => {
    expect(getDayBookendHotels(days[1], days, [])).toEqual({})
  })

  it('bookends both ends with the single hotel on a normal stay day', () => {
    const h = hotel({ start_day_id: 10, end_day_id: 30 })
    const { morning, evening } = getDayBookendHotels(days[1], days, [h])
    expect(morning).toBe(h)
    expect(evening).toBe(h)
  })

  it('uses the checked-out hotel in the morning and the checked-in hotel in the evening on a transfer day', () => {
    const out = hotel({ start_day_id: 10, end_day_id: 20, place_lat: 1, place_lng: 1 })
    const into = hotel({ start_day_id: 20, end_day_id: 30, place_lat: 9, place_lng: 9 })
    const { morning, evening } = getDayBookendHotels(days[1], days, [out, into])
    expect(morning).toBe(out)
    expect(evening).toBe(into)
  })

  it('still picks the slept-in hotel for the morning when its stay does not end on the transfer day (#887)', () => {
    // The morning hotel runs long (checks out day 3) so it is not flagged as "checks out today";
    // the old "ends today" rule collapsed both bookends onto the arriving hotel.
    const stayed = hotel({ start_day_id: 10, end_day_id: 30, place_lat: 1, place_lng: 1 })
    const into = hotel({ start_day_id: 20, end_day_id: 30, place_lat: 9, place_lng: 9 })
    const { morning, evening } = getDayBookendHotels(days[1], days, [stayed, into])
    expect(morning).toBe(stayed)
    expect(evening).toBe(into)
  })

  it('ignores accommodations without coordinates', () => {
    const h = hotel({ place_lat: null, place_lng: null })
    expect(getDayBookendHotels(days[1], days, [h])).toEqual({})
  })

  it('flags an arrival/check-in day as not slept-here in the morning (#1321)', () => {
    // Day 1: you arrive from home and check in tonight, so the morning hotel is only a
    // check-in fallback — no hotel → departure leg should be drawn.
    const into = hotel({ start_day_id: 10, end_day_id: 30, place_lat: 3, place_lng: 4 })
    const r = getDayBookendHotels(days[0], days, [into])
    expect(r.morning).toBe(into)
    expect(r.morningIsSleptHere).toBe(false)
    expect(r.eveningIsOvernight).toBe(true)
    // The optimizer anchor must stay a loop on the check-in day (values unchanged).
    expect(getAccommodationAnchors(days[0], days, [into])).toEqual({ start: { lat: 3, lng: 4 }, end: { lat: 3, lng: 4 } })
  })

  it('flags a mid-stay day as slept-here and overnight', () => {
    const h = hotel({ start_day_id: 10, end_day_id: 30 })
    const r = getDayBookendHotels(days[1], days, [h])
    expect(r.morningIsSleptHere).toBe(true)
    expect(r.eveningIsOvernight).toBe(true)
  })

  it('an evening departure with no replacement check-in is not overnight (S7 mirror)', () => {
    // You woke up here but check out today and board an evening transport — you do not
    // sleep here tonight, so the last-stop → hotel leg must be droppable.
    const h = hotel({ start_day_id: 10, end_day_id: 20, place_lat: 1, place_lng: 1 })
    const r = getDayBookendHotels(days[1], days, [h])
    expect(r.morningIsSleptHere).toBe(true)
    expect(r.eveningIsOvernight).toBe(false)
  })

  it('flags a transfer day as slept-here in the morning and overnight in the evening', () => {
    const out = hotel({ start_day_id: 10, end_day_id: 20, place_lat: 1, place_lng: 1 })
    const into = hotel({ start_day_id: 20, end_day_id: 30, place_lat: 9, place_lng: 9 })
    const r = getDayBookendHotels(days[1], days, [out, into])
    expect(r.morningIsSleptHere).toBe(true)
    expect(r.eveningIsOvernight).toBe(true)
  })
})
