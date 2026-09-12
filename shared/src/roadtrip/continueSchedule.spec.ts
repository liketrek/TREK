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
});
