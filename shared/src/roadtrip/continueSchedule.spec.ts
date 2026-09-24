import { continueSchedule } from './continueSchedule';
import type { RoadtripStop } from './planning-types';
import type { Schedule } from './roadtripModel';

import { describe, expect, it } from 'vitest';

const stops = [0, 60, 60, 60].map((dwellMinutes) => ({ dwellMinutes }) as RoadtripStop);
const schedule = (): Schedule => ({
  entries: [
    { arrival: '18:15', departure: '18:15', dayOffset: 0, anchored: false },
    ...[1, 2, 3].map(() => ({ arrival: null, departure: null, dayOffset: 0, anchored: false })),
  ],
  warnings: [],
});
describe('continuing after a moved day group', () => {
  it('carries Munich departure into the original day stops and over midnight', () => {
    const original = schedule();
    const completed = continueSchedule(stops, original, [237 * 60, 198 * 60, 206 * 60], 2);
    expect(completed.entries.map((entry) => entry.arrival)).toEqual(['18:15', '22:12', '02:30', '06:56']);
    expect(completed.entries[2]!.dayOffset).toBe(1);
    expect(original.entries[1]!.arrival).toBeNull();
  });
  it('keeps manual times and stops at an unknown route duration', () => {
    const original = schedule();
    original.entries[2] = { arrival: '07:00', departure: '08:00', dayOffset: 1, anchored: true };
    const completed = continueSchedule(stops, original, [undefined, 3600, 3600], 2);
    expect(completed.entries[1]!.arrival).toBeNull();
    expect(completed.entries[2]).toEqual(original.entries[2]);
    expect(completed.entries[3]!.arrival).toBe('09:00');
  });
  it('holds a stop with a leave time until then, and reports one it reaches too late', () => {
    const leaving = [
      { dwellMinutes: 0 },
      { dwellMinutes: 60, leaveAt: '23:30' },
      { dwellMinutes: 60, leaveAt: '00:30' },
      { dwellMinutes: 0 },
    ] as RoadtripStop[];
    const completed = continueSchedule(leaving, schedule(), [3600, 3600, 3600], 2);
    // In at 19:15 and out at 23:30, not at 20:15.
    expect(completed.entries[1]).toMatchObject({ arrival: '19:15', departure: '23:30' });
    // Reached on the minute it is meant to be left at: gone at once, and not late.
    expect(completed.entries[2]).toMatchObject({ arrival: '00:30', departure: '00:30', dayOffset: 1 });
    expect(completed.entries[3]!.arrival).toBe('01:30');
    expect(completed.warnings).not.toContainEqual(expect.objectContaining({ code: 'missedLeave' }));
    // Another hour on the road and it is reached an hour after it should have been left.
    const late = continueSchedule(leaving, schedule(), [3600, 7200, 3600], 2);
    expect(late.warnings).toContainEqual({ index: 2, code: 'missedLeave', minutes: 60 });
  });
  it('reports a leave time the drive went past before midnight rather than waiting for the next one', () => {
    const leaving = [
      { dwellMinutes: 0 },
      { dwellMinutes: 60, leaveAt: '23:30' },
      { dwellMinutes: 60 },
      { dwellMinutes: 0 },
    ] as RoadtripStop[];
    // Out of Munich at 18:15, six and a quarter hours to go: in at half past midnight.
    const completed = continueSchedule(leaving, schedule(), [375 * 60, 3600, 3600], 2);
    expect(completed.entries[1]).toMatchObject({ arrival: '00:30', departure: '00:30', dayOffset: 1 });
    expect(completed.entries[2]!.arrival).toBe('01:30');
    expect(completed.warnings).toContainEqual({ index: 1, code: 'missedLeave', minutes: 60 });
  });
});
