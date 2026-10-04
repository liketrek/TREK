import { getDayBookendHotels, getDayOrder, hotelIsTheStop, isDayInAccommodationRange } from './stay-bookends';

import { describe, expect, it } from 'vitest';

const d1 = { id: 10, day_number: 1 };
const d2 = { id: 20, day_number: 2 };
const d3 = { id: 30, day_number: 3 };
const d4 = { id: 40, day_number: 4 };
const days = [d1, d2, d3, d4];

const stay = (id: number, start: number, end: number, at: [number, number] | null = [48.1, 11.5]) => ({
  id,
  name: `Stay ${id}`,
  start_day_id: start,
  end_day_id: end,
  place_lat: at ? at[0] : null,
  place_lng: at ? at[1] : null,
});

describe('the order of a day', () => {
  it('STAY-BOOKENDS-001: a day is ordered by its day number, and by its place in the list without one', () => {
    expect(getDayOrder(d2, days)).toBe(2);
    // The number wins over the position in the list.
    expect(getDayOrder(d2, [d4, d3, d2, d1])).toBe(2);
    const first = { id: 5 };
    const second = { id: 6, day_number: null };
    expect(getDayOrder(first, [first, second])).toBe(0);
    expect(getDayOrder(second, [first, second])).toBe(1);
  });
});

describe('the days a stay spans', () => {
  it('STAY-BOOKENDS-002: a stay spans its check-in and check-out day by day order, and by id when its days are not loaded', () => {
    expect(isDayInAccommodationRange(d1, 10, 30, days)).toBe(true);
    expect(isDayInAccommodationRange(d2, 10, 30, days)).toBe(true);
    expect(isDayInAccommodationRange(d3, 10, 30, days)).toBe(true);
    expect(isDayInAccommodationRange(d4, 10, 30, days)).toBe(false);
    expect(isDayInAccommodationRange(d1, 20, 30, days)).toBe(false);
    // Given the wrong way round, the range still holds.
    expect(isDayInAccommodationRange(d3, 40, 20, days)).toBe(true);

    // The ids of a reordered trip say nothing: the day with id 3 is day 2, between the
    // stay's check-in on day 1 (id 7) and its check-out on day 3 (id 5).
    const shuffled = [
      { id: 7, day_number: 1 },
      { id: 3, day_number: 2 },
      { id: 5, day_number: 3 },
    ];
    expect(isDayInAccommodationRange({ id: 3, day_number: 2 }, 7, 5, shuffled)).toBe(true);

    // Without the endpoint days the ids are all there is.
    expect(isDayInAccommodationRange({ id: 25 }, 20, 30, [])).toBe(true);
    expect(isDayInAccommodationRange({ id: 35 }, 20, 30, [d2])).toBe(false);
  });
});

describe('the hotels at both ends of a day', () => {
  it('STAY-BOOKENDS-003: a transfer day wakes up in the stay it leaves and sleeps in the one it checks into', () => {
    const left = stay(1, 10, 20, [1, 1]);
    const next = stay(2, 20, 40, [9, 9]);
    const hotels = getDayBookendHotels(d2, days, [next, left]);
    // The caller's own rows come back, not copies.
    expect(hotels.morning).toBe(left);
    expect(hotels.evening).toBe(next);
    expect(hotels.morningIsSleptHere).toBe(true);
    expect(hotels.eveningIsOvernight).toBe(true);

    // Two check-ins on one day: the first in the list is tonight's.
    const other = stay(3, 20, 30, [5, 5]);
    expect(getDayBookendHotels(d2, days, [left, other, next]).evening).toBe(other);
    expect(getDayBookendHotels(d2, days, [left, next, other]).evening).toBe(next);
  });

  it('STAY-BOOKENDS-004: a stay of several nights opens on its check-in day, holds the days between and closes on its check-out day', () => {
    const home = stay(1, 10, 30);
    expect(getDayBookendHotels(d1, days, [home])).toEqual({
      morning: home,
      evening: home,
      morningIsSleptHere: false,
      eveningIsOvernight: true,
    });
    expect(getDayBookendHotels(d2, days, [home])).toEqual({
      morning: home,
      evening: home,
      morningIsSleptHere: true,
      eveningIsOvernight: true,
    });
    expect(getDayBookendHotels(d3, days, [home])).toEqual({
      morning: home,
      evening: home,
      morningIsSleptHere: true,
      eveningIsOvernight: false,
    });
    expect(getDayBookendHotels(d4, days, [home])).toEqual({});

    // A long stay still owns the morning of a day another stay checks in on (#887).
    const long = stay(2, 10, 40, [1, 1]);
    const late = stay(3, 20, 40, [9, 9]);
    const transfer = getDayBookendHotels(d2, days, [late, long]);
    expect(transfer.morning).toBe(long);
    expect(transfer.evening).toBe(late);

    // A stay that starts and ends on one day reads as that evening's check-in; the flag
    // only says the stay is booked from today, not that a night follows.
    const dayUse = stay(4, 20, 20);
    expect(getDayBookendHotels(d2, days, [dayUse])).toEqual({
      morning: dayUse,
      evening: dayUse,
      morningIsSleptHere: false,
      eveningIsOvernight: true,
    });

    // With its check-in day not loaded, a stay still holds the day by its ids, but it
    // makes no claim about a night on either side.
    expect(getDayBookendHotels(d2, [d2, d3], [home])).toEqual({
      morning: home,
      evening: home,
      morningIsSleptHere: false,
      eveningIsOvernight: false,
    });
  });

  it('STAY-BOOKENDS-005: a stay without coordinates is left out, and the other stay answers on its own', () => {
    const unplaced = stay(1, 10, 20, null);
    const next = stay(2, 20, 30, [9, 9]);
    expect(getDayBookendHotels(d2, days, [unplaced, next])).toEqual({
      morning: next,
      evening: next,
      morningIsSleptHere: false,
      eveningIsOvernight: true,
    });
    const halfPlaced = { ...stay(3, 10, 30), place_lng: null };
    expect(getDayBookendHotels(d2, days, [unplaced, halfPlaced])).toEqual({});
    expect(getDayBookendHotels(d2, days, [])).toEqual({});
  });
});

describe('the hotel is the edge stop itself', () => {
  it('STAY-BOOKENDS-006: a stop is the hotel only when both carry the same coordinates', () => {
    const hotel = { place_lat: 48.1, place_lng: 11.5 };
    expect(hotelIsTheStop(hotel, { lat: 48.1, lng: 11.5 })).toBe(true);
    expect(hotelIsTheStop(hotel, { lat: 48.1, lng: 11.6 })).toBe(false);
    expect(hotelIsTheStop(hotel, { lat: null, lng: 11.5 })).toBe(false);
    expect(hotelIsTheStop(hotel, { lat: 48.1 })).toBe(false);
    expect(hotelIsTheStop(hotel)).toBe(false);
    expect(hotelIsTheStop({ place_lat: null, place_lng: null }, { lat: 48.1, lng: 11.5 })).toBe(false);
    expect(hotelIsTheStop({ place_lat: 48.1, place_lng: null }, { lat: 48.1, lng: 11.5 })).toBe(false);
    expect(hotelIsTheStop(undefined, { lat: 48.1, lng: 11.5 })).toBe(false);
  });
});
