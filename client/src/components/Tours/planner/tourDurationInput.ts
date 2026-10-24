import { formatPlannedTourDuration } from '../tourPresentation';

/** What a typed duration means: nothing (cleared), a number of minutes, or no duration at all. */
export type ParsedTourDuration = number | null | 'invalid';

/** The longest text a duration field takes; nobody types more for a day's walk. */
export const TOUR_DURATION_INPUT_MAX_LENGTH = 16;

const PLAIN_MINUTES = /^\d+$/;
const CLOCK = /^(\d+):(\d{1,2})$/;
// Hours with a unit, then minutes with an optional unit, or minutes alone with a unit:
// "2 h 56", "2h56min", "1,5 h", "45 min". Each part is anchored on its unit, so the
// pattern cannot match one text two ways.
const WITH_UNITS =
  /^(?:(\d+(?:[.,]\d+)?) ?(?:h|hr|hrs|hours?|std|stunden?)\.?)? ?(?:(\d+) ?(?:m|min|mins|minutes?|minuten?)?\.?)?$/;

/**
 * Reads what somebody typed into a duration field as whole minutes.
 *
 * "176" is minutes, "2:56" is hours and minutes, and "2 h 56", "2h 56 min" or
 * "1,5 h" spell the units out. An empty field clears the value. Anything else,
 * a clock with 60 minutes or more included, is invalid. The range is the
 * planner's to check, not this one's.
 */
export function parseTourDuration(text: string): ParsedTourDuration {
  const value = text.trim().toLowerCase().replace(/\s+/g, ' ');
  if (value === '') return null;
  if (value.length > TOUR_DURATION_INPUT_MAX_LENGTH) return 'invalid';
  if (PLAIN_MINUTES.test(value)) return Number(value);
  const clock = CLOCK.exec(value);
  if (clock) {
    const minutes = Number(clock[2]);
    return minutes < 60 ? Number(clock[1]) * 60 + minutes : 'invalid';
  }
  const units = WITH_UNITS.exec(value);
  if (!units || (units[1] === undefined && units[2] === undefined)) return 'invalid';
  const hours = units[1] === undefined ? 0 : Number(units[1].replace(',', '.'));
  const minutes = units[2] === undefined ? 0 : Number(units[2]);
  return Math.round(hours * 60 + minutes);
}

/** "2 h 56 min" for a duration in minutes, and nothing for an empty or unreadable one. */
export function formatTourDuration(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) return '';
  return formatPlannedTourDuration(minutes);
}
