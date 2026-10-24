import { reshapedHikePoints } from '../../../src/nest/tours/tour-reshape.helpers';
import { trailDetailsOf } from '../../../src/nest/tours/tour-trail-details.helpers';
import type { TourTrailGrade, TourWaypoint } from '@trek/shared';

import { describe, expect, it } from 'vitest';

// TRAIL-DETAILS-001 to TRAIL-DETAILS-003, RESHAPE-HELPER-001 to RESHAPE-HELPER-003

const grade = (id: number, over: Partial<TourTrailGrade> = {}): TourTrailGrade => ({
  id,
  mtb_scale: null,
  mtb_scale_uphill: null,
  mtb_scale_imba: null,
  sac_scale: null,
  sac_scale_unclear: null,
  surface: null,
  highway: null,
  ...over,
});

describe('the trail details laid onto a saved line', () => {
  it('TRAIL-DETAILS-001: sums each value by the metres of its ways, scaled onto the saved length', () => {
    const ways = [
      { wayId: 1, metres: 500 },
      { wayId: 2, metres: 300 },
      { wayId: null, metres: 200 },
    ];
    const grades = new Map([
      [1, grade(1, { surface: 'asphalt', highway: 'residential' })],
      [2, grade(2, { surface: 'gravel', highway: 'track', sac_scale: 'hiking', mtb_scale: '2+' })],
    ]);
    const details = trailDetailsOf(ways, grades, 2000);
    expect(details.length_m).toBe(2000);
    expect(details.surface).toEqual([
      { value: 'asphalt', metres: 1000, share: 0.5 },
      { value: 'gravel', metres: 600, share: 0.3 },
    ]);
    expect(details.highway.map(({ value }) => value)).toEqual(['residential', 'track']);
    expect(details.sac).toMatchObject({ highest: 1, segments: [{ from_m: 1000, to_m: 1600, sac: 1 }] });
    expect(details.mtb).toEqual({ highest: '2+', values: [{ value: '2+', metres: 600, share: 0.3 }] });
    expect(details.unknown_share).toBe(0.2);
  });

  it('TRAIL-DETAILS-002: the hardest mountain bike step wins, a plus above its plain step', () => {
    const ways = [1, 2, 3].map((wayId) => ({ wayId, metres: 100 }));
    const grades = new Map([
      [1, grade(1, { mtb_scale: '1' })],
      [2, grade(2, { mtb_scale: '2' })],
      [3, grade(3, { mtb_scale: '2+' })],
    ]);
    expect(trailDetailsOf(ways, grades, 300).mtb.highest).toBe('2+');
    expect(trailDetailsOf(ways.slice(0, 2), grades, 200).mtb.highest).toBe('2');
  });

  it('TRAIL-DETAILS-003: without ways the whole line is unknown, never easy', () => {
    const details = trailDetailsOf([], new Map(), 1000);
    expect(details).toMatchObject({ length_m: 0, surface: [], highway: [], unknown_share: 1, mtb: { highest: null } });
    expect(details.sac.highest).toBeNull();
  });
});

const saved = (): TourWaypoint[] => [
  { lat: 47, lng: 11, role: 'start', sequence: 0, name: 'Car park', key: 'stop-carpark' },
  { lat: 47.1, lng: 11, role: 'via', sequence: 1, poi_category: 'shelter', key: 'stop-hut0001' },
  { lat: 47.2, lng: 11, role: 'end', sequence: 2, key: 'stop-summit1' },
];

describe('a saved hike reshaped', () => {
  it('RESHAPE-HELPER-001: reverse turns the points round, each with its name and kind of place', () => {
    expect(reshapedHikePoints(saved(), 'reverse')).toEqual({
      points: [
        { lat: 47.2, lng: 11 },
        { lat: 47.1, lng: 11, poi_category: 'shelter' },
        { lat: 47, lng: 11, name: 'Car park' },
      ],
    });
  });

  it('RESHAPE-HELPER-002: close_loop adds the start again at the end, once', () => {
    const closed = reshapedHikePoints(saved(), 'close_loop');
    expect(closed).toMatchObject({ points: [{ name: 'Car park' }, {}, {}, { lat: 47, lng: 11 }] });
    const loop = [...saved(), { lat: 47, lng: 11, role: 'end' as const, sequence: 3 }];
    expect(reshapedHikePoints(loop, 'close_loop')).toEqual({ refused: 'This hike already ends where it starts.' });
  });

  it('RESHAPE-HELPER-003: a recorded track and a hike in stages are refused with why', () => {
    expect(reshapedHikePoints([], 'reverse')).toMatchObject({ refused: expect.stringContaining('recorded track') });
    const staged = saved().map((point, index) => (index === 1 ? { ...point, stage_end: true } : point));
    expect(reshapedHikePoints(staged, 'reverse')).toMatchObject({ refused: expect.stringContaining('stages') });
    expect(reshapedHikePoints(staged, 'close_loop')).toMatchObject({
      points: expect.arrayContaining([expect.objectContaining({ stage_end: true })]),
    });
  });
});
