import { isClosedLoop, walkStationFacts, walkStationsOf } from './tour-walk';

import { describe, expect, it } from 'vitest';

const cathedral = { lat: 48.1, lng: 11.5, name: 'Cathedral' };
const market = { lat: 48.11, lng: 11.51, name: 'Market' };
const park = { lat: 48.13, lng: 11.53, name: 'Park' };
const steer = { lat: 48.105, lng: 11.505, shaping: true };

describe('isClosedLoop (PR1-01)', () => {
  it('is a tour of three points or more whose last stands on the spot of its first', () => {
    expect(isClosedLoop([cathedral, market, { ...cathedral }])).toBe(true);
    expect(isClosedLoop([cathedral, market, { lat: cathedral.lat + 5e-8, lng: cathedral.lng - 5e-8 }])).toBe(true);
    expect(isClosedLoop([cathedral, market, park])).toBe(false);
    expect(isClosedLoop([cathedral, market, { lat: cathedral.lat + 1e-6, lng: cathedral.lng }])).toBe(false);
  });

  it('is no loop with two points on one spot, or with none', () => {
    expect(isClosedLoop([cathedral, { ...cathedral }])).toBe(false);
    expect(isClosedLoop([])).toBe(false);
  });
});

describe('walkStationsOf (CW-02, CW-03)', () => {
  it('lists the stops in order and leaves a shaping point out', () => {
    expect(walkStationsOf([cathedral, steer, market, park])).toEqual([cathedral, market, park]);
  });

  it('leaves the way back of a loop out, so its start is one station', () => {
    const back = { ...cathedral, name: 'Cathedral again' };
    expect(walkStationsOf([cathedral, steer, market, park, back])).toEqual([cathedral, market, park]);
    expect(walkStationsOf([cathedral, { ...cathedral }])).toEqual([cathedral, cathedral]);
    expect(walkStationsOf([])).toEqual([]);
  });
});

describe('walkStationFacts (CW-02, CW-03)', () => {
  it('counts the stops of a walk, sums the stays entered and counts the ones nobody entered apart', () => {
    const museum = { ...market, stay_minutes: 90 };
    const cafe = { ...park, stay_minutes: 30 };
    expect(walkStationFacts('walk', [cathedral, steer, museum, cafe])).toEqual({
      station_count: 3,
      station_stay_minutes: 120,
      station_stays_unknown: 1,
    });
  });

  it('counts the start of a loop once, with its stay, and a stay of 0 as entered', () => {
    const start = { ...cathedral, stay_minutes: 20 };
    const passed = { ...market, stay_minutes: 0 };
    expect(walkStationFacts('walk', [start, passed, { ...start }])).toEqual({
      station_count: 2,
      station_stay_minutes: 20,
      station_stays_unknown: 0,
    });
    expect(walkStationFacts('walk', [])).toEqual({
      station_count: 0,
      station_stay_minutes: 0,
      station_stays_unknown: 0,
    });
  });

  it('sums the minutes its ferry legs take by boat apart, unknown while one has no time (CW-12)', () => {
    const ferry = (minutes: number | null) => ({
      kind: 'ferry' as const,
      geometry: [
        [48.1, 11.5],
        [48.105, 11.505],
        [48.11, 11.51],
      ] as [number, number][],
      crossings: [[0, 1]] as [number, number][],
      minutes,
      walk_minutes: 3,
    });
    expect(
      walkStationFacts('walk', [{ ...cathedral, fixed_leg: ferry(12) }, { ...market, fixed_leg: ferry(5) }, park]),
    ).toMatchObject({
      walk_ferry_minutes: 17,
    });
    expect(
      walkStationFacts('walk', [{ ...cathedral, fixed_leg: ferry(12) }, { ...market, fixed_leg: ferry(null) }, park]),
    ).toMatchObject({
      walk_ferry_minutes: null,
    });
    expect(walkStationFacts('walk', [cathedral, market])).not.toHaveProperty('walk_ferry_minutes');
  });

  it('says nothing of the stations of any other type', () => {
    expect(walkStationFacts('hike', [cathedral, { ...market, stay_minutes: 30 }])).toEqual({
      station_count: null,
      station_stay_minutes: null,
      station_stays_unknown: null,
    });
  });
});
