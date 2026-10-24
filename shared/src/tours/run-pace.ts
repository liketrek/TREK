import { z } from 'zod';

/**
 * RUN-01: a run is planned with the runner's own pace, in seconds per
 * kilometre, and its time is the distance at that pace. Nothing else goes in:
 * no climb, no descent, no surface and no difficulty, and TREK suggests no
 * pace of its own. A run without a pace has no time; it stays unknown.
 *
 * The bounds keep a typo out, not a runner: 2:00 min/km is faster than any
 * road record, 20:00 min/km slower than walking.
 */
export const MIN_RUN_PACE_SECONDS_PER_KM = 2 * 60;
export const MAX_RUN_PACE_SECONDS_PER_KM = 20 * 60;
export const runPaceSecondsPerKmSchema = z
  .number()
  .int()
  .min(MIN_RUN_PACE_SECONDS_PER_KM)
  .max(MAX_RUN_PACE_SECONDS_PER_KM);

/** The planned running time in whole minutes: the distance at the pace, 8 km at 6:00 min/km is 48 minutes. */
export function runMinutesAtPace(distanceKm: number, paceSecondsPerKm: number): number {
  return Math.round((distanceKm * paceSecondsPerKm) / 60);
}
