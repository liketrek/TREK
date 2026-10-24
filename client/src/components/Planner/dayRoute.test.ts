import { describe, expect, it } from 'vitest';
import type { Accommodation, Assignment, Day } from '../../types';
import { dayCoMapsUrl, dayExportStops, dayGoogleMapsUrl, fillAroundLocked, optimizeDayOrder } from './dayRoute';

// FE-MOBILE-DAYROUTE-001 to FE-MOBILE-DAYROUTE-015

const days = [
  { id: 10, day_number: 1 },
  { id: 20, day_number: 2 },
  { id: 30, day_number: 3 },
] as unknown as Day[];

const hotel = {
  place_lat: 48.85,
  place_lng: 2.35,
  place_name: 'Hotel Lutetia',
  start_day_id: 10,
  end_day_id: 30,
} as unknown as Accommodation;

const stop = (id: number, name: string, lat: number, lng: number): Assignment =>
  ({ id, day_id: 20, order_index: id, place: { id, name, lat, lng } }) as unknown as Assignment;

const louvre = stop(1, 'Louvre', 48.86, 2.34);
const orsay = stop(2, 'Orsay', 48.87, 2.33);

describe('dayExportStops', () => {
  it('FE-MOBILE-DAYROUTE-001: carries the stops in planned order, hotel-bookended and named', () => {
    expect(dayExportStops(days[1], days, [louvre, orsay], [hotel], true)).toEqual([
      { lat: 48.85, lng: 2.35, name: 'Hotel Lutetia' },
      { lat: 48.86, lng: 2.34, name: 'Louvre' },
      { lat: 48.87, lng: 2.33, name: 'Orsay' },
      { lat: 48.85, lng: 2.35, name: 'Hotel Lutetia' },
    ]);
  });

  it('FE-MOBILE-DAYROUTE-002: drops the bookends when accommodation optimization is off', () => {
    const stops = dayExportStops(days[1], days, [louvre, orsay], [hotel], false);
    expect(stops.map((s) => s.name)).toEqual(['Louvre', 'Orsay']);
  });

  it('FE-MOBILE-DAYROUTE-003: a stop without coordinates cannot be exported', () => {
    const nowhere = { id: 3, day_id: 20, order_index: 3, place: { id: 3, name: 'TBD' } } as unknown as Assignment;
    const stops = dayExportStops(days[1], days, [louvre, nowhere], [], false);
    expect(stops.map((s) => s.name)).toEqual(['Louvre']);
  });

  // The stay above records neither check-in nor check-out time: the #2157 shape.
  const homeNear = stop(4, 'Home', 48.9, 2.4);

  it('FE-MOBILE-DAYROUTE-006: with a carrier on the day, the not-yet-reached check-in hotel is not prepended (#2157)', () => {
    // Arrival day: you fly in, so the hotel may end the list but must not start it.
    const stops = dayExportStops(days[0], days, [homeNear], [hotel], true, { located: true });
    expect(stops.map((s) => s.name)).toEqual(['Home', 'Hotel Lutetia']);
  });

  it('FE-MOBILE-DAYROUTE-007: with a carrier on the day, the already-left check-out hotel is not appended (#2157)', () => {
    // Check-out day: the hotel starts the day, nothing routes back to it after the flight home.
    const stops = dayExportStops(days[2], days, [homeNear], [hotel], true, { located: true });
    expect(stops.map((s) => s.name)).toEqual(['Hotel Lutetia', 'Home']);
  });

  it('FE-MOBILE-DAYROUTE-008: without a carrier the no-time loop still closes (#2009 preserved)', () => {
    const stops = dayExportStops(days[0], days, [louvre], [hotel], true, { located: false });
    expect(stops.map((s) => s.name)).toEqual(['Hotel Lutetia', 'Louvre', 'Hotel Lutetia']);
  });

  it('FE-MOBILE-DAYROUTE-009: an edge stop out of drive range keeps the no-time hotel out even without a carrier (#2157)', () => {
    // No flight recorded, but "Home" is an ocean away, so the loop default is a guess
    // and does not get to route back across it.
    const farHome = stop(5, 'Home', 21.28, -157.83);
    const stops = dayExportStops(days[2], days, [farHome], [hotel], true);
    expect(stops.map((s) => s.name)).toEqual(['Hotel Lutetia', 'Home']);
  });

  // Day 2 checks out of one stay and into the next, with no stop of its own.
  const hotelA = { ...hotel, place_name: 'Hotel A', start_day_id: 10, end_day_id: 20 } as Accommodation;
  const hotelB = {
    ...hotel,
    place_lat: 53.55,
    place_lng: 9.99,
    place_name: 'Hotel B',
    start_day_id: 20,
    end_day_id: 30,
  } as Accommodation;

  it('FE-MOBILE-DAYROUTE-010: a flight between the two stays leaves nothing to export (#2476)', () => {
    // Located or not, the flight is how the day gets from one hotel to the other; a
    // driving route between them is the stretch nobody drives.
    expect(dayExportStops(days[1], days, [], [hotelA, hotelB], true, { located: true, booked: true })).toEqual([]);
    expect(dayExportStops(days[1], days, [], [hotelA, hotelB], true, { booked: true })).toEqual([]);
    expect(dayGoogleMapsUrl(days[1], days, [], [hotelA, hotelB], true, { booked: true })).toBeNull();
    expect(dayCoMapsUrl(days[1], days, [], [hotelA, hotelB], true, 'driving', { booked: true })).toBeNull();
  });

  it('FE-MOBILE-DAYROUTE-011: without a booking the move is still the drive from one stay to the next (#1297)', () => {
    expect(dayExportStops(days[1], days, [], [hotelA, hotelB], true).map((s) => s.name)).toEqual([
      'Hotel A',
      'Hotel B',
    ]);
    // A stop of its own keeps the day exportable even with the flight booked.
    expect(
      dayExportStops(days[1], days, [louvre], [hotelA, hotelB], true, { located: true, booked: true }).map(
        (s) => s.name
      )
    ).toContain('Louvre');
  });
});

describe('day map links', () => {
  it('FE-MOBILE-DAYROUTE-004: both exports read the same stop list', () => {
    // One source for the bookend rules, so the two links can never disagree
    // about which hotel legs are real.
    const google = dayGoogleMapsUrl(days[1], days, [louvre, orsay], [hotel], true)!;
    const coMaps = dayCoMapsUrl(days[1], days, [louvre, orsay], [hotel], true, 'walking')!;
    for (const ll of ['48.85,2.35', '48.86,2.34', '48.87,2.33']) {
      expect(google).toContain(ll);
      expect(coMaps).toContain(ll);
    }
  });

  it('FE-MOBILE-DAYROUTE-005: the CoMaps link travels in the mode it was given', () => {
    // Four bookended stops is more than a CoMaps route link can hold, so it
    // becomes pins, which is also why no mode appears here.
    expect(dayCoMapsUrl(days[1], days, [louvre, orsay], [hotel], true, 'walking')).toMatch(
      /^https:\/\/comaps\.at\/map\?v=1&/
    );
    // Two stops fit a route, and then the mode does apply.
    expect(dayCoMapsUrl(days[1], days, [louvre, orsay], [], false, 'walking')).toContain('type=pedestrian');
  });
});

describe('optimizeDayOrder', () => {
  const timed = (id: number, name: string, lat: number, lng: number, time: string): Assignment =>
    ({ id, day_id: 20, order_index: id, place: { id, name, lat, lng, place_time: time } }) as unknown as Assignment;
  const unlocated = {
    id: 8,
    day_id: 20,
    order_index: 8,
    place: { id: 8, name: 'Somewhere', lat: null, lng: null },
  } as unknown as Assignment;
  const a = stop(3, 'A', 10, 10);
  const b = stop(4, 'B', 10, 30);
  const c = stop(5, 'C', 10, 20);

  it('FE-MOBILE-DAYROUTE-012: a timed stop keeps its slot and the rest are rerouted around it', () => {
    const breakfast = timed(9, 'Breakfast', 40, 40, '08:00');
    const result = optimizeDayOrder(days[1], days, [breakfast, a, b, c], [], false);
    expect(result?.order.map((x) => x.id)).toEqual([9, 3, 5, 4]);
    expect(result?.usedHotel).toBe(false);
  });

  it('FE-MOBILE-DAYROUTE-013: stops without coordinates fill the slots left over at the end', () => {
    const result = optimizeDayOrder(days[1], days, [unlocated, a, b, c], [], false);
    expect(result?.order.map((x) => x.id)).toEqual([3, 5, 4, 8]);
  });

  it('FE-MOBILE-DAYROUTE-014: fewer than two movable located stops leave nothing to optimize', () => {
    expect(optimizeDayOrder(days[1], days, [a, unlocated], [], false)).toBeNull();
    expect(optimizeDayOrder(days[1], days, [timed(9, 'T', 1, 1, '08:00'), a], [], false)).toBeNull();
  });

  it('FE-MOBILE-DAYROUTE-015: the hotel the day starts and ends at anchors the route when asked to', () => {
    const result = optimizeDayOrder(days[1], days, [louvre, orsay, stop(6, 'Opera', 48.871, 2.332)], [hotel], true);
    expect(result?.usedHotel).toBe(true);
    expect(result?.order.map((x) => x.id).sort()).toEqual([1, 2, 6]);
    expect(optimizeDayOrder(days[1], days, [louvre, orsay], [hotel], false)?.usedHotel).toBe(false);
  });
});

describe('fillAroundLocked', () => {
  it('FE-PLANNER-DAYROUTE-001: locked entries stay at their index and the queue fills the gaps in order', () => {
    const locked = new Map([
      [1, 'locked-1'],
      [3, 'locked-3'],
    ]);
    expect(fillAroundLocked(5, locked, ['q1', 'q2', 'q3'])).toEqual(['q1', 'locked-1', 'q2', 'locked-3', 'q3']);
    expect(fillAroundLocked(2, new Map<number, string>(), ['x', 'y'])).toEqual(['x', 'y']);
  });
});
