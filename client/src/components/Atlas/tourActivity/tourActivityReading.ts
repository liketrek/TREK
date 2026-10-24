import type { TourActivityTotals } from '@trek/shared';
import { Layers, type LucideIcon } from 'lucide-react';
import { useSettingsStore } from '../../../store/settingsStore';
import type { DistanceUnit } from '../../../types';
import { formatDistance, formatElevation } from '../../../utils/units';
import { tourDayRowIcon } from '../../Tours/tourDayRowIcon';
import { sumReading, type ActivityType } from './tourActivityStatsModel';

export type Translate = (key: string, params?: Record<string, unknown>) => string;

/** The distance unit the user reads in. */
export function useDistanceUnit(): DistanceUnit {
  return useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
}

/** What a type is called in the filter. */
export function typeLabel(type: ActivityType, t: Translate): string {
  return type === 'all' ? t('tours.stats.allTypes') : t(`tourTypes.${type}`);
}

/** The icon a type is drawn with; every type at once is a stack. */
export function typeIcon(type: ActivityType): LucideIcon {
  return type === 'all' ? Layers : tourDayRowIcon(type);
}

/** A distance as said, at least that much when some tours do not know theirs; null when none does. */
export function distanceReading(totals: Pick<TourActivityTotals, 'distanceKm'>, unit: DistanceUnit) {
  return sumReading(totals.distanceKm, (km) => formatDistance(km, unit));
}

/** A height sum as said, the same way. */
export function heightReading(sum: TourActivityTotals['ascentM'], unit: DistanceUnit) {
  return sumReading(sum, (metres) => formatElevation(metres, unit));
}

/** How a short sum explains itself: known for some of the tours only. */
export function partialHint(sum: TourActivityTotals['distanceKm'], t: Translate): string {
  return t('tours.scope.partialBody', { known: sum.known, of: sum.of });
}
