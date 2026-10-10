import type { Accommodation, Day } from '../../types';
import { isDayInAccommodationRange } from '../../utils/dayOrder';

/**
 * The stays a day's header names, in the order a traveller meets them that day:
 * the one checked out of first, then the ones running through, the one checked
 * into last.
 */
export function dayHeadStays(accommodations: Accommodation[], day: Day, days: Day[]): Accommodation[] {
  const rank = (a: Accommodation) => {
    if (a.end_day_id === day.id && a.start_day_id !== day.id) return 0;
    if (a.start_day_id === day.id) return 2;
    return 1;
  };
  return accommodations
    .filter((a) => isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days))
    .sort((a, b) => rank(a) - rank(b));
}
