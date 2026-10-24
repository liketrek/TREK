/**
 * P6: the pure half of a stop taken into a saved tour or out of it: where it
 * goes, what update_tour is handed for a hike, which stops may be taken out,
 * and the key the save gave the new stop.
 */
import {
  afterPointOf,
  hikePointsWithStop,
  hikePointsWithout,
  keyBefore,
  keyNear,
  removalRefusal,
  stopPointsOf,
} from '../../../src/nest/tours/tour-stops.helpers';
import type { GeometryPoint, TourWaypoint } from '@trek/shared';

import { describe, expect, it } from 'vitest';

// TOUR-STOPS-HELPERS-001 to TOUR-STOPS-HELPERS-008

const wp = (key: string, lat: number, role: TourWaypoint['role'], over: Partial<TourWaypoint> = {}): TourWaypoint => ({
  key,
  lat,
  lng: 11.0,
  role,
  sequence: 0,
  ...over,
});

const START = wp('start1', 47.0, 'start', { name: 'Parking' });
const HUT = wp('hut111', 47.01, 'via', { name: 'Hut', poi_category: 'shelter', stage_end: true });
const END = wp('summit', 47.02, 'end', { name: 'Summit' });
const LINE: GeometryPoint[] = [
  [47.0, 11.0],
  [47.01, 11.0],
  [47.02, 11.0],
];

describe('where a stop goes', () => {
  it('TOUR-STOPS-HELPERS-001: after the last point before it along the line, or after the point named', () => {
    const points = stopPointsOf([START, HUT, END]);
    const between = afterPointOf(points, LINE, { lat: 47.015, lng: 11.0 }, undefined);
    expect(typeof between === 'string' ? between : between.id).toBe('hut111');
    const named = afterPointOf(points, LINE, { lat: 47.015, lng: 11.0 }, 'start1');
    expect(typeof named === 'string' ? named : named.id).toBe('start1');
  });

  it('TOUR-STOPS-HELPERS-002: refuses a key the tour does not have, a shaping point and a leg drawn by hand', () => {
    const free = {
      ...HUT,
      fixed_leg: {
        kind: 'free' as const,
        geometry: [[47.01, 11.0] as [number, number], [47.02, 11.0] as [number, number]],
      },
    };
    const shaping = wp('shape1', 47.005, 'via', { shaping: true });
    expect(afterPointOf(stopPointsOf([START, HUT, END]), LINE, START, 'nope00')).toMatch(
      /no point with the key nope00/,
    );
    expect(afterPointOf(stopPointsOf([START, shaping, END]), LINE, START, 'shape1')).toMatch(/only shapes the line/);
    expect(afterPointOf(stopPointsOf([START, free, END]), LINE, START, 'hut111')).toMatch(/drawn by hand/);
  });

  it('TOUR-STOPS-HELPERS-003: a loop takes nothing after its way back', () => {
    const back = wp('back11', 47.0, 'end');
    expect(afterPointOf(stopPointsOf([START, HUT, back]), LINE, HUT, 'back11')).toMatch(/way back of a loop/);
  });
});

describe('a hike handed to update_tour', () => {
  it('TOUR-STOPS-HELPERS-004: keeps names, kinds and stage ends, the stop in its place', () => {
    const points = stopPointsOf([START, HUT, END]);
    const next = hikePointsWithStop(points, 'hut111', {
      lat: 47.015,
      lng: 11.0,
      name: 'Spring',
      poi_category: 'drinking_water',
    });
    expect(next).toEqual([
      { lat: 47.0, lng: 11.0, name: 'Parking' },
      { lat: 47.01, lng: 11.0, name: 'Hut', poi_category: 'shelter', stage_end: true },
      { lat: 47.015, lng: 11.0, name: 'Spring', poi_category: 'drinking_water' },
      { lat: 47.02, lng: 11.0, name: 'Summit' },
    ]);
    expect(hikePointsWithStop(points, 'nope00', { lat: 47.015, lng: 11.0 })).toBeNull();
  });

  it('TOUR-STOPS-HELPERS-005: takes the stop out and leaves the rest as it was', () => {
    expect(hikePointsWithout(stopPointsOf([START, HUT, END]), 'hut111')).toEqual([
      { lat: 47.0, lng: 11.0, name: 'Parking' },
      { lat: 47.02, lng: 11.0, name: 'Summit' },
    ]);
  });
});

describe('which stop may be taken out', () => {
  it('TOUR-STOPS-HELPERS-006: never the start, the way back of a loop, or a point of a tour of two', () => {
    const back = wp('back11', 47.0, 'end');
    expect(removalRefusal(stopPointsOf([START, HUT, END]), 'hut111')).toBeNull();
    expect(removalRefusal(stopPointsOf([START, HUT, END]), 'summit')).toBeNull();
    expect(removalRefusal(stopPointsOf([START, HUT, END]), 'start1')).toMatch(/start/);
    expect(removalRefusal(stopPointsOf([START, END]), 'summit')).toMatch(/at least its start and its end/);
    expect(removalRefusal(stopPointsOf([START, HUT, back]), 'back11')).toMatch(/way back of a loop/);
    expect(removalRefusal(stopPointsOf([START, HUT, END]), 'nope00')).toMatch(/no point with the key/);
  });
});

describe('the keys around a stop', () => {
  it('TOUR-STOPS-HELPERS-007: the key the save gave the stop is the nearest keyed point within a few metres', () => {
    expect(keyNear([START, HUT, END], { lat: 47.01, lng: 11.0001 })).toBe('hut111');
    expect(keyNear([START, HUT, END], { lat: 47.03, lng: 11.0 })).toBeNull();
    expect(keyNear([{ ...HUT, key: undefined }], { lat: 47.01, lng: 11.0 })).toBeNull();
  });

  it('TOUR-STOPS-HELPERS-008: the point a stop followed, by its key; none before the start', () => {
    const points = stopPointsOf([START, HUT, END]);
    expect(keyBefore(points, 'hut111')).toBe('start1');
    expect(keyBefore(points, 'start1')).toBeNull();
  });
});
