import { haversineMetres } from '../geo/haversine';
import {
  cumulativeMetres,
  legMinutes,
  nearestAlongM,
  pointsPerLeg,
  pointsPerLine,
  type AlongPoint,
} from './line-along';

import { describe, expect, it } from 'vitest';

/** A point `k` steps of a ten-thousandth of a degree north of 47° N on 11° E, about 11 m each, at `height`. */
const north = (k: number, height?: number): AlongPoint =>
  height === undefined ? [47 + k / 1e4, 11] : [47 + k / 1e4, 11, height];
const STEP_M = haversineMetres(47, 11, 47.0001, 11);

describe('metres along a line', () => {
  it('LINE-ALONG-001: measures each point from the start, the first at nothing', () => {
    const along = cumulativeMetres([north(0), north(1), north(3)]);
    expect(along[0]).toBe(0);
    expect(along[1]).toBeCloseTo(STEP_M, 6);
    expect(along[2]).toBeCloseTo(3 * STEP_M, 6);
    expect(cumulativeMetres([])).toEqual([]);
  });

  it('LINE-ALONG-002: finds the spot nearest a point beside the line, and holds it to the line ends', () => {
    const line = [north(0), north(10), north(20)];
    expect(nearestAlongM(line, 47.0005, 11.0003)).toBeCloseTo(5 * STEP_M, 0);
    expect(nearestAlongM(line, 47.0015, 10.9998)).toBeCloseTo(15 * STEP_M, 0);
    expect(nearestAlongM(line, 46.99, 11)).toBe(0);
    expect(nearestAlongM(line, 47.01, 11)).toBeCloseTo(20 * STEP_M, 6);
    expect(nearestAlongM([north(0)], 47, 11)).toBe(0);
    expect(nearestAlongM([north(0), north(0)], 47, 11)).toBe(0);
  });

  it('LINE-ALONG-003: on a loop back to its start, places the start on the first pass and the far side halfway', () => {
    const loop: AlongPoint[] = [
      [47, 11],
      [47.001, 11],
      [47.001, 11.0015],
      [47, 11.0015],
      [47, 11],
    ];
    const along = cumulativeMetres(loop);
    const total = along[along.length - 1] ?? 0;
    expect(nearestAlongM(loop, 47.00001, 11.00001)).toBeLessThan(5);
    expect(nearestAlongM(loop, 47.0011, 11.0016)).toBeCloseTo(along[2] ?? 0, 0);
    expect(along[2]).toBeCloseTo(total / 2, 0);
  });
});

describe('the walking minutes of each leg', () => {
  it('LINE-ALONG-004: splits the whole time over the legs, a climbing leg longer than a flat one, summing to the total', () => {
    // Flat for 10 steps, then 10 steps climbing 30 m each: 300 m up.
    const line = [north(0, 500), north(10, 500), ...Array.from({ length: 10 }, (_, k) => north(11 + k, 530 + 30 * k))];
    const along = cumulativeMetres(line);
    const atMs = [0, along[1] ?? 0, along[along.length - 1] ?? 0];
    const legs = legMinutes(line, atMs, 75);
    expect(legs).toHaveLength(2);
    expect(legs.reduce((sum, leg) => sum + leg, 0)).toBe(75);
    expect(legs[1]).toBeGreaterThan(3 * (legs[0] ?? 0));
    expect(legs.every(Number.isInteger)).toBe(true);
  });

  it('LINE-ALONG-005: weighs legs without heights by their length, and rounds a time that is not whole', () => {
    const line = [north(0), north(10), north(40)];
    const legs = legMinutes(line, [0, 10 * STEP_M, 40 * STEP_M], 40.4);
    expect(legs).toEqual([10, 30]);
    // A leg as short as a few metres keeps a share of its own rather than none.
    expect(legMinutes(line, [0, 3, 40 * STEP_M], 1000)[0]).toBeGreaterThan(0);
  });

  it('LINE-ALONG-006: splits evenly where no leg has any length, and gives nothing for a single point', () => {
    const line = [north(0, 500), north(1, 510)];
    expect(legMinutes(line, [0, 0, 0], 7)).toEqual([4, 3]);
    expect(legMinutes(line, [0], 7)).toEqual([]);
    expect(legMinutes(line, [0, STEP_M], -3)).toEqual([0]);
  });
});

describe('the points each line gets for drawing', () => {
  it('LINE-ALONG-007: shares the points by length, two at least for each, never more than a line has', () => {
    const shares = pointsPerLine([1000, 3000], 100);
    expect(shares).toEqual([26, 74]);
    expect(pointsPerLine([1000, 3000], 100, [10, 5000])).toEqual([10, 74]);
    expect(pointsPerLine([0, 0, 0], 4)).toEqual([2, 2, 2]);
    expect(pointsPerLine([500, 0], 10)).toEqual([8, 2]);
    expect(pointsPerLine([], 300)).toEqual([]);
  });

  it('LINE-ALONG-008: shares the points over the planned legs in order, a leg not planned drawing none', () => {
    const legs = [{ lengthM: 1000, points: 5000 }, null, { lengthM: 3000, points: 5000 }];
    expect(pointsPerLeg(legs, 100)).toEqual([26, null, 74]);
    expect(pointsPerLeg([null, null], 300)).toEqual([null, null]);
    expect(pointsPerLeg([{ lengthM: 10, points: 3 }], 300)).toEqual([3]);
    expect(pointsPerLeg([], 300)).toEqual([]);
  });
});
