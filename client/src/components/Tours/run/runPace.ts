import { runPaceSecondsPerKmSchema } from '@trek/shared';
import type { DistanceUnit } from '../../../types';

/** The longest text the pace field takes: "12:30" and a little room. */
export const RUN_PACE_INPUT_MAX_LENGTH = 6;

/** Minutes and two-digit seconds as whole seconds, or NaN for seconds of 60 or more. */
function clockSeconds(minutes: string, seconds: string): number {
  const secondsNumber = Number(seconds);
  return secondsNumber < 60 ? Number(minutes) * 60 + secondsNumber : Number.NaN;
}

/** A statute mile in kilometres: a pace per mile is this many times a pace per kilometre. */
const KM_PER_MILE = 1.609344;

const CLOCK = /^(\d{1,2}):(\d{2})$/;
const MINUTES = /^(\d{1,2})(?:[.,](\d{1,2}))?$/;

/** A pace as typed, whole seconds per the unit it is typed in. */
function typedSeconds(value: string): number {
  const clock = CLOCK.exec(value);
  if (clock) return clockSeconds(clock[1], clock[2]);
  const minutes = MINUTES.exec(value);
  if (!minutes) return Number.NaN;
  const [, whole, part = '0'] = minutes;
  if (part.length === 2) return clockSeconds(whole, part);
  return Math.round(Number(`${whole}.${part}`) * 60);
}

/**
 * RUN-01: a pace as typed, read as whole seconds per kilometre, the way it is
 * stored. The runner types it per kilometre or, with distances in miles, per
 * mile. "5:30" is minutes and seconds, "6" whole minutes and "5,5" or "5.5"
 * minutes and a tenth. Two digits after the point or comma are seconds, the
 * way "5.30" or "5,30" is written for 5:30 in much of Europe, not hundredths
 * of a minute. An empty field is no pace (null); anything else, seconds of 60
 * or more included, is NaN, so the planner marks it and holds Save back while
 * the text stays for the runner to fix. Whether the pace is in bounds is the
 * contract's to say, not this one's.
 */
export function parseRunPace(text: string, unit: DistanceUnit = 'metric'): number | null {
  const value = text.trim();
  if (value === '') return null;
  const seconds = typedSeconds(value);
  return unit === 'imperial' && !Number.isNaN(seconds) ? Math.round(seconds / KM_PER_MILE) : seconds;
}

/** A pace as the runner reads it, minutes and seconds per kilometre or per mile: 360 s/km is "6:00" or "9:39". */
export function formatRunPace(secondsPerKm: number, unit: DistanceUnit = 'metric'): string {
  const whole = Math.round(unit === 'imperial' ? secondsPerKm * KM_PER_MILE : secondsPerKm);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/** The unit a pace reads in, in the user's language: minutes per kilometre, or per mile with distances in miles. */
export function runPaceUnitText(unit: DistanceUnit, t: (key: string) => string): string {
  return t(unit === 'imperial' ? 'tours.run.paceUnitMi' : 'tours.run.paceUnit');
}

/** Whether a pace held by the planner is one a run can be saved with: unset, or in the contract's bounds. */
export function runPaceInvalid(secondsPerKm: number | null): boolean {
  return secondsPerKm !== null && !runPaceSecondsPerKmSchema.safeParse(secondsPerKm).success;
}
