// FE-ACT-COMPARE-MODEL-001 to FE-ACT-COMPARE-MODEL-006
// ACT-02, the pure half of comparing a plan with its actual track: the values
// side by side, a difference only where both are known and comparable, and
// how far the recorded line strayed from the planned one.
import type { TourActivityMetrics } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { compareRows, MEASURED_POINTS, OFF_PLAN_M, planDeviation, type PlanValues } from './planComparison';

const plan: PlanValues = {
  distanceKm: 8,
  gain: 600,
  loss: 550,
  minutes: 240,
  minutesAtLeast: false,
  line: null,
};

const metrics: TourActivityMetrics = {
  distance_km: 8.6,
  elevation_gain_m: 640,
  elevation_loss_m: null,
  started_at: '2026-07-02T06:00:00Z',
  ended_at: '2026-07-02T10:30:00Z',
  elapsed_minutes: 270,
  point_count: 400,
};

// A planned line running north along 11° E for about 2.2 km.
const planned = [
  [47, 11],
  [47.01, 11],
  [47.02, 11],
];

describe('compareRows (ACT-02)', () => {
  it('FE-ACT-COMPARE-MODEL-001: names both values of every measure and what lies between them', () => {
    const rows = compareRows(plan, metrics);
    expect(rows.map((row) => row.key)).toEqual(['distance', 'ascent', 'descent', 'time']);
    expect(rows[0]).toEqual({ key: 'distance', plan: 8, actual: 8.6, difference: expect.closeTo(0.6, 6) });
    expect(rows[1]).toEqual({ key: 'ascent', plan: 600, actual: 640, difference: 40 });
    expect(rows[3]).toEqual({ key: 'time', plan: 240, actual: 270, difference: 30 });
  });

  it('FE-ACT-COMPARE-MODEL-002: a value one side does not carry stays missing, and so does the difference', () => {
    const rows = compareRows({ ...plan, gain: null, minutes: null }, metrics);
    expect(rows[1]).toEqual({ key: 'ascent', plan: null, actual: 640, difference: null });
    expect(rows[2]).toEqual({ key: 'descent', plan: 550, actual: null, difference: null });
    expect(rows[3]).toEqual({ key: 'time', plan: null, actual: 270, difference: null });
  });

  it('FE-ACT-COMPARE-MODEL-003: a planned total that is only a floor is shown but never subtracted from', () => {
    const time = compareRows({ ...plan, minutesAtLeast: true }, metrics)[3];
    expect(time).toEqual({ key: 'time', plan: 240, actual: 270, difference: null });
  });
});

describe('planDeviation (ACT-02)', () => {
  it('FE-ACT-COMPARE-MODEL-004: a track along the plan stays on it', () => {
    const deviation = planDeviation(
      [
        [47, 11.0001],
        [47.01, 11.0001],
        [47.02, 11.0001],
      ],
      planned
    );
    expect(deviation?.farthestM).toBeLessThan(OFF_PLAN_M);
    expect(deviation?.offPlanKm).toBe(0);
    expect(deviation?.offPlanShare).toBe(0);
  });

  it('FE-ACT-COMPARE-MODEL-005: a detour away from the plan is measured by its farthest point and its length', () => {
    // Out along the plan, then about 760 m east and back to the plan's end.
    const deviation = planDeviation(
      [
        [47, 11],
        [47.01, 11],
        [47.012, 11.01],
        [47.018, 11.01],
        [47.02, 11],
      ],
      planned
    );
    expect(deviation?.farthestM).toBeGreaterThan(740);
    expect(deviation?.farthestM).toBeLessThan(780);
    // Only the leg between the two eastern points has both ends off the plan: about 670 m.
    expect(deviation?.offPlanKm).toBeGreaterThan(0.6);
    expect(deviation?.offPlanKm).toBeLessThan(0.7);
    // Of about 3.4 km recorded in all.
    expect(deviation?.offPlanShare).toBeGreaterThan(0.15);
    expect(deviation?.offPlanShare).toBeLessThan(0.25);
  });

  it('FE-ACT-COMPARE-MODEL-006: nothing without two points on either line, and a long track measured in samples to its end', () => {
    expect(planDeviation([[47, 11]], planned)).toBeNull();
    expect(planDeviation(planned, null)).toBeNull();
    expect(planDeviation(planned, [[47, 11]])).toBeNull();

    // Twice as many points as are measured along the plan, then on past its end; the last point is kept.
    const count = MEASURED_POINTS * 2;
    const long = Array.from({ length: count }, (_, index) => [47 + (0.02 * index) / count, 11]);
    long.push([47.03, 11], [47.04, 11]);
    const deviation = planDeviation(long, planned);
    expect(deviation?.farthestM).toBeGreaterThan(2200);
    expect(deviation?.offPlanKm).toBeGreaterThan(1.1);
    expect(deviation?.offPlanKm).toBeLessThan(1.12);
  });
});
