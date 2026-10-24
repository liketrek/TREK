import { ArrowUp, Clock, Ruler } from 'lucide-react';
import { formatDistance, formatElevation } from '../../../utils/units';
import { plannedTotalText, tourPlannedTimes } from '../tourPresentation';
import type { MeasuredTour, Translate, Unit } from './tourPreviewFacts';

/** A tour's own measures as badges; one it does not have is left out, never shown as zero. */
export function measureBadges(tour: MeasuredTour, unit: Unit, t: Translate) {
  const times = tourPlannedTimes(tour);
  const total = plannedTotalText(times, t);
  const badge = plannedTotalText(times, t, true);
  return [
    total != null &&
      badge != null && {
        key: 'time',
        icon: Clock,
        value: badge,
        label: `${t('tours.planner.plannedTotalDuration')}: ${total}`,
      },
    tour.distance != null && {
      key: 'distance',
      icon: Ruler,
      value: formatDistance(tour.distance, unit),
      label: `${t('tours.detail.distance')}: ${formatDistance(tour.distance, unit)}`,
    },
    tour.elevation_gain != null &&
      tour.tour_type !== 'kayak' && {
        key: 'ascent',
        icon: ArrowUp,
        value: formatElevation(tour.elevation_gain, unit),
        label: `${t('tours.detail.ascent')}: ${formatElevation(tour.elevation_gain, unit)}`,
      },
  ].filter((badge) => !!badge);
}
