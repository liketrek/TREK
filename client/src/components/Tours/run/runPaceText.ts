import type { TourListItem } from '@trek/shared';
import type { DistanceUnit } from '../../../types';
import { formatRunPace, runPaceInvalid, runPaceUnitText } from './runPace';

/**
 * RUN-01: a saved run's pace as its facts say it, "6:00 min/km" with the unit
 * in the user's language, or "9:39 min/mi" with distances in miles; null for
 * another type and for a run without one (an import, a run whose runner has
 * not entered one yet): unknown stays unknown.
 */
export function runPaceText(
  tour: Pick<TourListItem, 'tour_type'> & Partial<Pick<TourListItem, 'run_pace_seconds_per_km'>>,
  t: (key: string) => string,
  unit: DistanceUnit = 'metric'
): string | null {
  const pace = tour.tour_type === 'run' ? (tour.run_pace_seconds_per_km ?? null) : null;
  return pace === null || runPaceInvalid(pace) ? null : `${formatRunPace(pace, unit)} ${runPaceUnitText(unit, t)}`;
}
