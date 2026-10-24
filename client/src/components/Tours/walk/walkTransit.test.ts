import type { TourListItem } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import type { Assignment } from '../../../types';
import type { MergedItem } from '../../../utils/dayMerge';
import type { DayItineraryItem } from '../../Map/dayTourProjection';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import { walkStartOf } from './walkSchedule';
import {
  arrivesAfterStart,
  journeyLate,
  lateForWalk,
  walkEndOf,
  walkPairAt,
  walkTransitLeg,
  type WalkPair,
  type WalkTransitContext,
} from './walkTransit';

// CW-08: public transit between two city walks on one day.

type Spot = { lat: number; lng: number };

function assignment(placeId: number, time: { assignment?: string | null; place?: string | null } = {}): Assignment {
  return {
    id: placeId + 100,
    day_id: 10,
    place_id: placeId,
    order_index: 0,
    tour_place_id: placeId,
    assignment_time: time.assignment ?? null,
    place: { id: placeId, name: `Place ${placeId}`, place_time: time.place ?? null },
  } as unknown as Assignment;
}

function tourItem(
  placeId: number,
  start: Spot,
  end: Spot,
  time: { assignment?: string | null; place?: string | null } = {}
): Extract<DayItineraryItem, { kind: 'tour' }> {
  const loop = start.lat === end.lat && start.lng === end.lng;
  return { kind: 'tour', assignment: assignment(placeId, time), placeId, start, end, geometry: [], loop, valid: true };
}

function tour(placeId: number, name: string, overrides: Partial<TourListItem> = {}): TourListItem {
  return {
    place_id: placeId,
    name,
    tour_type: 'walk',
    duration: 90,
    planned_duration_minutes: null,
    break_additional_minutes: null,
    station_count: 2,
    station_stay_minutes: 45,
    station_stays_unknown: 0,
    ...overrides,
  } as TourListItem;
}

const OLD_TOWN = tour(1, 'Old town');
const HARBOUR = tour(2, 'Harbour');
const HIKE = tour(3, 'Ridge', { tour_type: 'hike' });
const tours = new Map([OLD_TOWN, HARBOUR, HIKE].map((item) => [item.place_id, item]));
const tourOf = (placeId: number) => tours.get(placeId);

const A_START = { lat: 52.52, lng: 13.4 };
const A_END = { lat: 52.51, lng: 13.42 };
const B_START = { lat: 52.5, lng: 13.45 };
const B_END = { lat: 52.49, lng: 13.46 };
const leg = (from: Spot, to: Spot) => ({ from: { name: '', ...from }, to: { name: '', ...to }, time: '10:00' });
const stop = (id: string, name?: string, linkedPlaceId?: number): TourPlannerWaypoint => ({
  id,
  lat: 0,
  lng: 0,
  role: 'via',
  ...(name ? { name } : {}),
  ...(linkedPlaceId ? { linkedPlaceId } : {}),
});
const t = (key: string, params?: Record<string, string | number | null>) => `${key} ${JSON.stringify(params ?? {})}`;

describe('walkPairAt', () => {
  const first = tourItem(1, A_START, A_END, { place: '10:00' });
  const next = tourItem(2, B_START, B_END, { place: '13:00' });
  const located = (placeId: number, at: Spot, extra: Partial<Assignment> = {}): DayItineraryItem => ({
    kind: 'stop',
    assignment: { ...assignment(placeId), tour_place_id: null, place: { id: placeId, ...at }, ...extra } as Assignment,
  });

  it('finds the walk the leg leaves at its end and the next one it reaches at its start', () => {
    const pair = walkPairAt([first, next], leg(A_END, B_START), tourOf, first.assignment.id);
    expect(pair?.first.tour.name).toBe('Old town');
    expect(pair?.next.tour.name).toBe('Harbour');
  });

  it('reads past an item the route does not go to: a stop without a place, out of the route, or a booked night', () => {
    const unlocated: DayItineraryItem = { kind: 'stop', assignment: assignment(9) };
    const excluded = located(8, A_END, { route_excluded: true });
    const night = located(7, A_END, { accommodation_id: 3 });
    expect(walkPairAt([first, unlocated, excluded, night, next], leg(A_END, B_START), tourOf, 101)?.next.item).toBe(
      next
    );
  });

  it('is no pair where the route goes to a stop first, even one at the walk end or the next walk start', () => {
    expect(walkPairAt([first, located(9, A_END), next], leg(A_END, B_START), tourOf, 101)).toBeNull();
    expect(walkPairAt([first, located(9, B_START), next], leg(A_END, B_START), tourOf, 101)).toBeNull();
  });

  it('pairs a leg with the walk it leaves where two walks of the day end at one spot', () => {
    // Two loops from the hotel, each followed by a walk that starts at the same square.
    const hotel = { lat: 52.53, lng: 13.38 };
    const anyWalk = (placeId: number) => tour(placeId, `Walk ${placeId}`);
    const morning = tourItem(11, hotel, hotel, { place: '09:00' });
    const afternoon = tourItem(13, hotel, hotel, { place: '14:00' });
    const items = [morning, tourItem(12, B_START, B_END), afternoon, tourItem(14, B_START, B_END)];

    const pair = walkPairAt(items, leg(hotel, B_START), anyWalk, afternoon.assignment.id);
    expect(pair?.first.item).toBe(afternoon);
    expect(pair?.next.item).toBe(items[3]);
    if (!pair) throw new Error('no pair');
    const searched = walkTransitLeg({
      leg: leg(hotel, B_START),
      dayId: 10,
      pair,
      stops: { first: [], next: [] },
      places: [],
      t,
    });
    expect(searched.time).toBe('16:15');
    expect(walkPairAt(items, leg(hotel, B_START), anyWalk, morning.assignment.id)?.next.item).toBe(items[1]);
  });

  it('is no pair for a leg that leaves elsewhere or reaches no walk', () => {
    const hike = tourItem(3, B_START, B_END);
    const track = tourItem(4, B_START, B_END);
    expect(walkPairAt([first, hike], leg(A_END, B_START), tourOf, 101)).toBeNull();
    // A place with a track of its own is no tour of the list.
    expect(walkPairAt([first, track], leg(A_END, B_START), tourOf, 101)).toBeNull();
    expect(walkPairAt([hike, next], leg(B_END, B_START), tourOf, 103)).toBeNull();
    // The leg leaves the walk's start, not its end.
    expect(walkPairAt([first, next], leg(A_START, B_START), tourOf, 101)).toBeNull();
    // A leg from the walk to a place, from a walk with nothing after it, or from no entry of the day.
    expect(walkPairAt([first, located(9, { lat: 1, lng: 1 })], leg(A_END, { lat: 1, lng: 1 }), tourOf, 101)).toBeNull();
    expect(walkPairAt([first], leg(A_END, B_START), tourOf, 101)).toBeNull();
    expect(walkPairAt([first, next], leg(A_END, B_START), tourOf, undefined)).toBeNull();
    expect(walkPairAt([first, next], leg(A_END, B_START), tourOf, 102)).toBeNull();
  });
});

describe('walkEndOf', () => {
  it('adds the walking time and the stays to the start', () => {
    expect(walkEndOf(600, OLD_TOWN)).toEqual({ minutes: 735, atLeast: false, nextDay: false });
  });

  it('is at the earliest while a stay is not known, or the list says nothing of the stops', () => {
    expect(walkEndOf(600, tour(1, 'A', { station_stays_unknown: 1 }))).toMatchObject({ minutes: 735, atLeast: true });
    expect(walkEndOf(600, tour(1, 'A', { station_stay_minutes: null }))).toMatchObject({ minutes: 690, atLeast: true });
  });

  it('takes a total entered by hand before the one worked out', () => {
    expect(walkEndOf(600, tour(1, 'A', { planned_duration_minutes: 240, station_stays_unknown: 1 }))).toMatchObject({
      minutes: 840,
      atLeast: false,
    });
  });

  it('is not known without a start or without any time', () => {
    expect(walkEndOf(null, OLD_TOWN)).toBeNull();
    expect(walkEndOf(600, tour(1, 'A', { duration: null, station_stay_minutes: 0 }))).toBeNull();
  });

  it('ends on the next day from midnight on', () => {
    expect(walkEndOf(23 * 60, OLD_TOWN)).toEqual({ minutes: 1515, atLeast: false, nextDay: true });
    expect(walkEndOf(24 * 60 - 135, OLD_TOWN)).toMatchObject({ nextDay: true });
    expect(walkEndOf(24 * 60 - 136, OLD_TOWN)).toMatchObject({ nextDay: false });
  });
});

describe('walkStartOf', () => {
  it('takes the time on the day before the place time, and reads neither when none is set', () => {
    expect(walkStartOf(assignment(1, { assignment: '9:05', place: '11:00' }))).toBe(545);
    expect(walkStartOf(assignment(1, { place: '11:00' }))).toBe(660);
    expect(walkStartOf(assignment(1))).toBeNull();
  });
});

describe('walkTransitLeg', () => {
  const pair = (firstTime: { place?: string | null } = { place: '10:00' }, loop = false): WalkPair => ({
    first: { item: tourItem(1, A_START, loop ? A_START : A_END, firstTime), tour: OLD_TOWN },
    next: { item: tourItem(2, B_START, B_END, { assignment: '9:05' }), tour: HARBOUR },
  });
  const places = [{ id: 7, name: 'Fish market' }];

  it('runs from the last stop to the first, departing when the first walk ends', () => {
    const result = walkTransitLeg({
      leg: leg(A_END, B_START),
      dayId: 10,
      pair: pair(),
      stops: { first: [stop('a', 'Town hall'), stop('b', 'Old bridge')], next: [stop('c', undefined, 7)] },
      places,
      t,
    });
    expect(result).toEqual({
      from: { name: 'Old bridge', ...A_END },
      to: { name: 'Fish market', ...B_START },
      time: '12:15',
      walk: {
        dayId: 10,
        fromWalk: 'Old town',
        toWalk: 'Harbour',
        ends: '12:15',
        endsNextDay: false,
        endsAtLeast: false,
        nextStarts: '09:05',
      },
    });
  });

  it('names an end after its walk where the stops are unread or unnamed, and makes up no time', () => {
    const result = walkTransitLeg({
      leg: leg(A_END, B_START),
      dayId: 10,
      pair: pair({ place: null }),
      stops: { first: null, next: [stop('c')] },
      places,
      t,
    });
    expect(result.from.name).toBe('tours.walk.transit.endOf {"walk":"Old town"}');
    expect(result.to.name).toBe('tours.walk.transit.startOf {"walk":"Harbour"}');
    // The leg's own time is the walk's start, never when it ends.
    expect(result.time).toBeNull();
    expect(result.walk).toMatchObject({ ends: null, endsNextDay: false, endsAtLeast: false });
  });

  it('says a walk ending after midnight ends on the next day, and makes up no time on this one', () => {
    const result = walkTransitLeg({
      leg: leg(A_END, B_START),
      dayId: 10,
      pair: pair({ place: '23:00' }),
      stops: { first: [], next: [] },
      places,
      t,
    });
    expect(result.time).toBeNull();
    expect(result.walk).toMatchObject({ ends: null, endsNextDay: true });
  });

  it('says nothing of the next start, nor of an arrival after it, where the next walk has no time', () => {
    const result = walkTransitLeg({
      leg: leg(A_END, B_START),
      dayId: 10,
      pair: { ...pair(), next: { item: tourItem(2, B_START, B_END), tour: HARBOUR } },
      stops: { first: [], next: [] },
      places,
      t,
    });
    expect(result.walk.nextStarts).toBeNull();
    expect(lateForWalk(result.walk, '2025-06-01', { date: '2025-06-01', time: '23:50' })).toBeNull();
  });

  it('ends a loop at its first stop again', () => {
    const result = walkTransitLeg({
      leg: leg(A_START, B_START),
      dayId: 10,
      pair: pair({ place: '10:00' }, true),
      stops: { first: [stop('a', 'Town hall'), stop('b', 'Old bridge')], next: [] },
      places,
      t,
    });
    expect(result.from).toEqual({ name: 'Town hall', ...A_START });
  });
});

describe('arrivesAfterStart', () => {
  it('compares the clock on the day and counts a later date as late', () => {
    expect(arrivesAfterStart({ date: '2025-06-01', time: '13:10' }, '2025-06-01', '13:00')).toBe(true);
    expect(arrivesAfterStart({ date: '2025-06-01', time: '13:00' }, '2025-06-01', '13:00')).toBe(false);
    expect(arrivesAfterStart({ date: '2025-06-01', time: '12:50' }, '2025-06-01', '13:00')).toBe(false);
    expect(arrivesAfterStart({ date: '2025-06-02', time: '00:10' }, '2025-06-01', '13:00')).toBe(true);
    expect(arrivesAfterStart({ date: '2025-05-31', time: '23:50' }, '2025-06-01', '13:00')).toBe(false);
    expect(arrivesAfterStart({ date: null, time: '13:10' }, '2025-06-01', '13:00')).toBe(true);
  });

  it('says nothing without a start, a date or an arrival time', () => {
    expect(arrivesAfterStart({ date: '2025-06-01', time: '13:10' }, '2025-06-01', null)).toBe(false);
    expect(arrivesAfterStart({ date: '2025-06-01', time: '13:10' }, null, '13:00')).toBe(false);
    expect(arrivesAfterStart({ date: '2025-06-01', time: null }, '2025-06-01', '13:00')).toBe(false);
  });
});

describe('lateForWalk', () => {
  const walk: WalkTransitContext = {
    dayId: 10,
    fromWalk: 'Old town',
    toWalk: 'Harbour',
    ends: '12:15',
    endsNextDay: false,
    endsAtLeast: false,
    nextStarts: '13:00',
  };

  it('names the next walk a connection arrives too late for', () => {
    expect(lateForWalk(walk, '2025-06-01', { date: '2025-06-01', time: '13:10' })).toEqual({
      walk: 'Harbour',
      time: '13:00',
    });
    expect(lateForWalk(walk, '2025-06-01', { date: '2025-06-01', time: '12:50' })).toBeNull();
    expect(lateForWalk({ ...walk, nextStarts: null }, '2025-06-01', { date: '2025-06-01', time: '13:10' })).toBeNull();
    expect(lateForWalk(null, '2025-06-01', { date: '2025-06-01', time: '13:10' })).toBeNull();
  });
});

describe('journeyLate', () => {
  const journey = { type: 'transit', reservation_end_time: '2025-06-01T13:10' };
  const walkAt = (placeId: number, time: string | null) =>
    ({ type: 'place', sortKey: 1, data: assignment(placeId, { place: time }) }) as MergedItem;
  const note = { type: 'note', sortKey: 0, data: {} } as MergedItem;
  const late = (following: MergedItem[], reservation = journey) =>
    journeyLate({ reservation, following, date: '2025-06-01', tourOf });

  it('names the walk a saved journey now arrives too late for, notes aside', () => {
    expect(late([note, walkAt(2, '13:00')])).toEqual({ walk: 'Harbour', time: '13:00' });
    expect(late([walkAt(2, '13:30')])).toBeNull();
  });

  it('says nothing for another booking, another kind of tour, a walk without a start or a stop between', () => {
    expect(late([walkAt(2, '13:00')], { type: 'train', reservation_end_time: '2025-06-01T13:10' })).toBeNull();
    expect(late([walkAt(3, '13:00')])).toBeNull();
    expect(late([walkAt(2, null)])).toBeNull();
    expect(late([{ type: 'transport', sortKey: 1, data: {} } as MergedItem, walkAt(2, '13:00')])).toBeNull();
    expect(late([])).toBeNull();
    const plainPlace = {
      type: 'place',
      sortKey: 1,
      data: { ...assignment(2, { place: '13:00' }), tour_place_id: null },
    };
    expect(late([plainPlace as MergedItem])).toBeNull();
  });
});
