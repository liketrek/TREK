import type { TourLibraryItem } from '@trek/shared';
import { formatDistance, formatElevation } from '../../../utils/units';
import type { TourMetricField } from '../tourParts';
import { plannedTotalText, tourPlannedTimes } from '../tourPresentation';

export type Translate = (key: string, params?: Record<string, unknown>) => string;
export type Unit = Parameters<typeof formatDistance>[1];

/** What a tour picked from elsewhere (another trip, a collection) is measured by, as its list carries it. */
export type MeasuredTour = Pick<
  TourLibraryItem,
  | 'tour_type'
  | 'distance'
  | 'elevation_gain'
  | 'elevation_loss'
  | 'duration'
  | 'planned_duration_minutes'
  | 'break_additional_minutes'
  | 'station_count'
  | 'station_stay_minutes'
  | 'station_stays_unknown'
>;

/**
 * The facts of a chosen tour as its preview shows them, each only where the
 * tour has it: where it comes from first, then its type, distance, planned
 * time, heights and how many control points it brings.
 */
export function tourPreviewFacts(
  tour: MeasuredTour,
  waypoints: number,
  unit: Unit,
  t: Translate,
  from: TourMetricField
): TourMetricField[] {
  const total = plannedTotalText(tourPlannedTimes(tour), t);
  const fact = (show: boolean, label: string, value: () => string) => (show ? { label, value: value() } : null);
  return [
    from,
    fact(true, t('tours.filter.type'), () => t(`tourTypes.${tour.tour_type}`)),
    fact(tour.distance != null, t('tours.detail.distance'), () => formatDistance(tour.distance ?? 0, unit)),
    fact(total != null, t('tours.planner.plannedTotalDuration'), () => total ?? ''),
    fact(tour.elevation_gain != null && tour.tour_type !== 'kayak', t('tours.detail.ascent'), () =>
      formatElevation(tour.elevation_gain ?? 0, unit)
    ),
    fact(tour.elevation_loss != null && tour.tour_type !== 'kayak', t('tours.detail.descent'), () =>
      formatElevation(tour.elevation_loss ?? 0, unit)
    ),
    fact(waypoints > 0, t('tours.library.controlPoints'), () => String(waypoints)),
  ].filter((field): field is TourMetricField => field !== null);
}
