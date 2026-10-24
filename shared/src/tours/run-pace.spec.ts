import {
  MAX_RUN_PACE_SECONDS_PER_KM,
  MIN_RUN_PACE_SECONDS_PER_KM,
  runMinutesAtPace,
  runPaceSecondsPerKmSchema,
} from './run-pace';

import { describe, expect, it } from 'vitest';

describe('run pace (RUN-01)', () => {
  it('plans the distance at the pace: 8 km at 6:00 min/km is 48 minutes', () => {
    expect(runMinutesAtPace(8, 360)).toBe(48);
    expect(runMinutesAtPace(10, 330)).toBe(55);
    // Rounded to the minute, never cut short: 5.03 km at 5:00 is 25 min 9 s.
    expect(runMinutesAtPace(5.03, 300)).toBe(25);
    expect(runMinutesAtPace(0, 360)).toBe(0);
  });

  it('takes whole seconds between 2:00 and 20:00 min/km only', () => {
    expect([MIN_RUN_PACE_SECONDS_PER_KM, MAX_RUN_PACE_SECONDS_PER_KM]).toEqual([120, 1200]);
    expect(runPaceSecondsPerKmSchema.safeParse(360).success).toBe(true);
    for (const pace of [0, -1, 119, 1201, 300.5, Number.POSITIVE_INFINITY]) {
      expect(runPaceSecondsPerKmSchema.safeParse(pace).success).toBe(false);
    }
  });
});
