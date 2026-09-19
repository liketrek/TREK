import type { RoadtripStop } from './planning-types';
import { formatClock, leaveAfter, parseClock, type Schedule } from './roadtripModel';

export function continueSchedule(
  stops: RoadtripStop[],
  schedule: Schedule,
  legs: (number | undefined)[],
  /** Unused since a check-out stopped shaping the chain; kept so the call sites and
   *  their specs read the same as every other scheduler entry point. */
  _dayNumber?: number,
): Schedule {
  const entries = schedule.entries.map((entry) => ({ ...entry }));
  const warnings = [...schedule.warnings];
  for (let i = 1; i < stops.length; i++) {
    const entry = entries[i]!;
    if (entry.arrival !== null) continue;
    const previous = entries[i - 1]!;
    const departure = parseClock(previous.departure);
    const duration = legs[i - 1];
    if (departure === null || duration === undefined) continue;
    const previousArrival = parseClock(previous.arrival);
    const departureAt =
      previous.dayOffset * 1440 + departure + (previousArrival !== null && departure < previousArrival ? 1440 : 0);
    const arrivalAt = departureAt + Math.round(duration / 60);
    const stop = stops[i]!;
    const leave = parseClock(stop.leaveAt);
    const left = leave === null ? null : leaveAfter(arrivalAt, leave, departureAt);
    if (left && left.missedBy !== null) warnings.push({ index: i, code: 'missedLeave', minutes: left.missedBy });
    const leaveAt = left ? left.departure : arrivalAt + (stop.dwellMinutes ?? 0);
    entry.arrival = formatClock(arrivalAt);
    entry.departure = formatClock(leaveAt);
    entry.dayOffset = Math.floor(arrivalAt / 1440);
    if (entry.dayOffset > previous.dayOffset) warnings.push({ index: i, code: 'overnight' });
  }
  return { entries, warnings };
}
