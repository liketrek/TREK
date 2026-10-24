// CW-02, CW-04: a city walk's stations on one day: what is missing for their
// arrivals, and their arrivals, stays and opening hours once nothing is.
import { describe, expect, it } from 'vitest';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import { walkScheduleOf, type LinkedPlaceOf, type WalkScheduleInput } from './walkSchedule';

const ROUTE: Array<[number, number]> = [
  [48, 11],
  [48.001, 11],
  [48.002, 11],
];

const museum: TourPlannerWaypoint = {
  id: 'museum',
  lat: 48,
  lng: 11,
  role: 'start',
  name: 'Museum',
  stayMinutes: 90,
  openingHours: 'Mo-Fr 10:00-18:00',
};
const square: TourPlannerWaypoint = { id: 'square', lat: 48.001, lng: 11, role: 'via', linkedPlaceId: 5 };
const cafe: TourPlannerWaypoint = { id: 'cafe', lat: 48.002, lng: 11, role: 'end', name: 'Cafe', stayMinutes: 30 };

// 2026-10-19 is a Monday.
const MONDAY = { date: '2026-10-19' };
const noPlace: LinkedPlaceOf = () => null;

function input(overrides: Partial<WalkScheduleInput> = {}): WalkScheduleInput {
  return {
    stations: [museum, square, cafe],
    route: ROUTE,
    walkingMinutes: 40,
    day: { day: MONDAY, start: '09:30' },
    placeOf: noPlace,
    ...overrides,
  };
}

describe('walkScheduleOf', () => {
  it('says what is missing, in order: a day, its date, a start time, a route with its walking time', () => {
    expect(walkScheduleOf(input({ day: null })).state).toBe('noDay');
    expect(walkScheduleOf(input({ day: { day: { date: null }, start: '09:30' } })).state).toBe('noDate');
    expect(walkScheduleOf(input({ day: { day: MONDAY, start: null } })).state).toBe('noStart');
    expect(walkScheduleOf(input({ day: { day: MONDAY, start: 'soon' } })).state).toBe('noStart');
    expect(walkScheduleOf(input({ stations: null })).state).toBe('noRoute');
    expect(walkScheduleOf(input({ route: null })).state).toBe('noRoute');
    expect(walkScheduleOf(input({ route: ROUTE.slice(0, 1) })).state).toBe('noRoute');
    const unknown = walkScheduleOf(input({ walkingMinutes: null }));
    expect(unknown).toEqual({ state: 'noRoute', byStation: new Map(), anyHours: false });
  });

  it('gives each station its arrival, the end of its stay and what its hours say', () => {
    const schedule = walkScheduleOf(input());
    expect(schedule.state).toBe('ready');
    expect(schedule.anyHours).toBe(true);
    expect(schedule.byStation.get('museum')).toEqual({
      arrival: 570,
      atLeast: false,
      leave: 660,
      fit: { kind: 'closed', source: 'osm', windows: [[600, 1080]] },
    });
    // No stay entered at the square: its end is not known, and the cafe after it comes at the earliest.
    expect(schedule.byStation.get('square')).toEqual({
      arrival: 680,
      atLeast: false,
      leave: null,
      fit: { kind: 'unknown' },
    });
    expect(schedule.byStation.get('cafe')).toMatchObject({ arrival: 700, atLeast: true, leave: 730 });
  });

  it("reads a start typed in twelve hours, and a trip place's own hours before the station's", () => {
    const week = JSON.stringify(Array.from({ length: 7 }, () => ({ closed: false, open: '09:00', close: '23:30' })));
    const placeOf: LinkedPlaceOf = (point) =>
      point.linkedPlaceId === 5 ? { name: 'Square', opening_hours: week } : null;
    const stations = [museum, { ...square, openingHours: 'Mo off' }, cafe];
    const schedule = walkScheduleOf(input({ stations, day: { day: MONDAY, start: '9:30 PM' }, placeOf }));
    expect(schedule.byStation.get('museum')?.arrival).toBe(1290);
    expect(schedule.byStation.get('square')?.fit).toEqual({ kind: 'open', source: 'place', window: [540, 1410] });
  });

  it('reaches a station after a crossing by boat its minutes later, the walk shared out on land only (CW-12)', () => {
    // 20 min of walking to the square, then the boat to the cafe.
    const stations = [museum, { ...square, stayMinutes: 0 }, cafe];
    const boat = (minutes: number | null) => [{ crossings: [ROUTE.slice(1)], minutes }];
    const crossed = walkScheduleOf(input({ stations, walkingMinutes: 20, ferries: boat(12) }));
    expect(crossed.byStation.get('square')).toMatchObject({ arrival: 680, atLeast: false });
    expect(crossed.byStation.get('cafe')).toMatchObject({ arrival: 692, atLeast: false, leave: 722 });

    const untimed = walkScheduleOf(input({ stations, walkingMinutes: 20, ferries: boat(null) }));
    expect(untimed.byStation.get('cafe')).toMatchObject({ arrival: 680, atLeast: true });
  });

  it('knows no hours where no station has any', () => {
    const schedule = walkScheduleOf(input({ stations: [{ ...museum, openingHours: null }, square, cafe] }));
    expect(schedule.state).toBe('ready');
    expect(schedule.anyHours).toBe(false);
  });
});
