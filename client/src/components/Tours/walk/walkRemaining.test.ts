// CW-13: what is left of a city walk on the day it was opened from, and how
// its pill says it.
import { describe, expect, it } from 'vitest';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import { walkRemainingOf, walkRemainingText, type WalkRemainingInput } from './walkRemaining';
import type { LinkedPlaceOf } from './walkSchedule';

const ROUTE: Array<[number, number]> = [
  [48, 11],
  [48.001, 11],
  [48.002, 11],
];

const museum: TourPlannerWaypoint = {
  id: 'museum',
  key: 'stop-museum',
  lat: 48,
  lng: 11,
  role: 'start',
  name: 'Museum',
  stayMinutes: 30,
};
const square: TourPlannerWaypoint = {
  id: 'square',
  key: 'stop-square',
  lat: 48.001,
  lng: 11,
  role: 'via',
  linkedPlaceId: 5,
};
const cafe: TourPlannerWaypoint = {
  id: 'cafe',
  key: 'stop-cafe',
  lat: 48.002,
  lng: 11,
  role: 'end',
  name: 'Cafe',
  stayMinutes: 15,
  importance: 'optional',
};

const placeOf: LinkedPlaceOf = (point) =>
  point.linkedPlaceId === 5 ? { name: 'Old square', opening_hours: null } : null;
const t = ((key: string, params?: Record<string, unknown>) =>
  params ? `${key} ${JSON.stringify(params)}` : key) as Parameters<typeof walkRemainingText>[1];

function input(overrides: Partial<WalkRemainingInput> = {}): WalkRemainingInput {
  return {
    stations: [museum, square, cafe],
    visits: undefined,
    route: ROUTE,
    walkingMinutes: 40,
    placeOf,
    ...overrides,
  };
}

describe('walkRemainingOf', () => {
  it('is nothing to say without stations', () => {
    expect(walkRemainingOf(input({ stations: null }))).toBeNull();
    expect(walkRemainingOf(input({ stations: [] }))).toBeNull();
  });

  it("counts from the day's last visit and names a station by the trip place it stands for", () => {
    const remainder = walkRemainingOf(input({ visits: { 'stop-museum': 'visited', 'stop-square': 'visited' } }));
    expect(remainder?.reference).toEqual({
      kind: 'last_visited',
      station: { position: 2, key: 'stop-square', name: 'Old square' },
    });
    expect(remainder?.walking.remaining_minutes).toBe(20);
    expect(remainder?.stays).toEqual({ remaining_known_minutes: 15, unknown: [], optional_known_minutes: 15 });
  });

  it('reads every station as planned before anything is checked off', () => {
    expect(walkRemainingOf(input())?.walking).toMatchObject({ remaining_minutes: 40, upper_bound: false });
  });

  it('leaves out a ferry leg that starts at a shaping point, as the server reads it off all the points (CW-12)', () => {
    const visits = { 'stop-museum': 'visited', 'stop-square': 'visited' } as const;
    // The boat from a shaping point by the square to the cafe: the last stretch is no walking.
    const ferries = [{ crossings: [ROUTE.slice(1)], minutes: 6 }];
    expect(walkRemainingOf(input({ visits }))?.walking.remaining_minutes).toBe(20);
    expect(walkRemainingOf(input({ visits, ferries }))?.walking.remaining_minutes).toBe(0);
  });
});

describe('walkRemainingText', () => {
  const text = (overrides: Partial<WalkRemainingInput>) => {
    const remainder = walkRemainingOf(input(overrides));
    if (!remainder) throw new Error('no remainder');
    return walkRemainingText(remainder, t);
  };

  it('says the walking time left and, in its tooltip, what it counts from and the stays apart', () => {
    expect(text({ visits: { 'stop-museum': 'visited' } })).toEqual({
      value: 'tours.walk.remaining.pill {"time":"40 min"}',
      label: [
        'tours.walk.remaining.fromStation {"name":"Museum"}',
        'tours.walk.remaining.stays {"time":"15 min"}',
        'tours.walk.remaining.staysUnknown {"count":1}',
      ].join(' '),
      known: true,
    });
    expect(text({}).label.startsWith('tours.walk.remaining.fromStart')).toBe(true);
  });

  it('is an upper bound while a station ahead is skipped', () => {
    const { value, label } = text({ visits: { 'stop-museum': 'visited', 'stop-square': 'skipped' } });
    expect(value).toBe('tours.walk.remaining.pillUpTo {"time":"40 min"}');
    expect(label).toContain('tours.walk.remaining.upperBound');
  });

  it('names the stations that leave the order unclear, dimmed', () => {
    expect(text({ visits: { 'stop-square': 'visited' } })).toEqual({
      value: 'tours.walk.remaining.unclear',
      label: [
        'tours.walk.remaining.unclearHint {"names":"Museum","last":"Old square"}',
        'tours.walk.remaining.stays {"time":"45 min"}',
      ].join(' '),
      known: false,
    });
  });

  it('says why the time is not known, and still names the stays', () => {
    const pending = text({ route: null });
    expect(pending).toMatchObject({ value: 'tours.walk.remaining.unknown', known: false });
    expect(pending.label).toContain('tours.walk.remaining.routePending');
    expect(pending.label).toContain('tours.walk.remaining.stays {"time":"45 min"}');
    expect(text({ walkingMinutes: null }).label).toContain('tours.walk.remaining.noWalkingTime');
  });

  it("names a loop's way back after the last stop, and says when every stop is done", () => {
    const loop: Array<[number, number]> = [...ROUTE, [48.001, 11.001], [48, 11]];
    const { label } = text({ route: loop, walkingMinutes: 60, visits: { 'stop-museum': 'visited' } });
    expect(label).toMatch(/tours\.walk\.remaining\.afterLast \{"time":"\d+ min"\}/);
    const done = text({ visits: { 'stop-museum': 'visited', 'stop-square': 'visited', 'stop-cafe': 'visited' } });
    expect(done).toEqual({
      value: 'tours.walk.remaining.pill {"time":"0 min"}',
      label: 'tours.walk.remaining.done',
      known: true,
    });
  });

  it('says only the way back is left once every stop of a loop is done', () => {
    const loop: Array<[number, number]> = [...ROUTE, [48.001, 11.001], [48, 11]];
    const remainder = walkRemainingOf(
      input({
        route: loop,
        walkingMinutes: 60,
        visits: { 'stop-museum': 'visited', 'stop-square': 'visited', 'stop-cafe': 'visited' },
      })
    );
    if (!remainder) throw new Error('no remainder');
    expect(remainder.finished).toBe(true);
    expect(remainder.walking.remaining_minutes).toBeGreaterThan(0);
    expect(remainder.walking.remaining_minutes).toBe(remainder.walking.after_last_station_minutes);
    const { value, label, known } = walkRemainingText(remainder, t);
    expect(value).toMatch(/^tours\.walk\.remaining\.pill \{"time":"\d+ min"\}$/);
    expect(label).toBe('tours.walk.remaining.wayBack');
    expect(known).toBe(true);
  });
});
