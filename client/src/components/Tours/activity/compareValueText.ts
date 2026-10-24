import type { DistanceUnit } from '../../../types';
import { formatDistance, formatElevation } from '../../../utils/units';
import { formatPlannedTourDuration } from '../tourPresentation';
import type { CompareKey } from './planComparison';

/** One value of the comparison as it reads in the unit shown. */
export function formatValue(key: CompareKey, value: number, unit: DistanceUnit): string {
  if (key === 'distance') return formatDistance(value, unit);
  if (key === 'time') return formatPlannedTourDuration(value);
  return formatElevation(value, unit);
}

/** A difference as it reads: signed, or "±" where it rounds to nothing in the unit shown. */
export function formatDifference(key: CompareKey, difference: number, unit: DistanceUnit): string {
  const size = formatValue(key, Math.abs(difference), unit);
  if (size === formatValue(key, 0, unit)) return `±${size}`;
  return `${difference > 0 ? '+' : '-'}${size}`;
}
