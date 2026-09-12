import type { RoadtripStop } from './planning-types';
import { formatClock, parseClock, type Schedule } from './roadtripModel';

export function continueSchedule(
  stops: RoadtripStop[],
  schedule: Schedule,
  legs: (number | undefined)[],
  dayNumber: number,
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
      stops[i - 1]!.checkoutAt !== undefined
        ? stops[i - 1]!.checkoutAt! - dayNumber * 1440
        : previous.dayOffset * 1440 + departure + (previousArrival !== null && departure < previousArrival ? 1440 : 0);
    const arrivalAt = departureAt + Math.round(duration / 60);
    const stop = stops[i]!;
    const leaveAt =
      stop.checkoutAt === undefined
        ? arrivalAt + (stop.dwellMinutes ?? 0)
        : Math.max(arrivalAt, stop.checkoutAt - dayNumber * 1440);
    entry.arrival = formatClock(arrivalAt);
    entry.departure = formatClock(leaveAt);
    entry.dayOffset = Math.floor(arrivalAt / 1440);
    if (entry.dayOffset > previous.dayOffset) warnings.push({ index: i, code: 'overnight' });
  }
  return { entries, warnings };
}
