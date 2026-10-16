import type { DistanceUnit } from '../../types';
import type { RouteGeometryAnalysis } from '../../utils/routeGeometry';
import { formatDistance, formatElevation } from '../../utils/units';
import type { TourMetricField } from './tourParts';

/** A line's measures as label and value: distance, the extras, lowest and highest point, ascent, descent. */
export function tourMetricFacts(
  analysis: Pick<RouteGeometryAnalysis, 'distanceKm' | 'minEle' | 'maxEle' | 'gain' | 'loss'> | null,
  unitSetting: DistanceUnit | undefined,
  t: (key: string, params?: Record<string, unknown>) => string,
  extra: readonly TourMetricField[] = []
): TourMetricField[] {
  // The setting is unset until the user picks one; metric is what the app shows then.
  const unit = unitSetting ?? 'metric';
  const fields: TourMetricField[] = [
    { label: t('tours.detail.distance'), value: analysis ? formatDistance(analysis.distanceKm, unit) : '-' },
    ...extra,
  ];
  if (analysis?.minEle != null)
    fields.push({ label: t('tours.detail.minAltitude'), value: formatElevation(analysis.minEle, unit) });
  if (analysis?.maxEle != null)
    fields.push({ label: t('tours.detail.maxAltitude'), value: formatElevation(analysis.maxEle, unit) });
  if (analysis?.gain != null)
    fields.push({ label: t('tours.detail.ascent'), value: formatElevation(analysis.gain, unit) });
  if (analysis?.loss != null)
    fields.push({ label: t('tours.detail.descent'), value: formatElevation(analysis.loss, unit) });
  return fields;
}

/**
 * Whether a tour's heights say nothing true: a paddle tour drawn in the
 * planner has its heights read from the terrain at the points the paddler set,
 * on the banks, never from the water, so its ascent, descent and profile stay
 * unknown. A paddle import keeps the heights its file recorded.
 */
export function heightsUnknown(tour: { tour_type?: string; has_waypoints?: boolean }): boolean {
  return tour.tour_type === 'kayak' && tour.has_waypoints !== false;
}

/** The same analysis with every height left unknown, the profile included. */
export function withoutHeights<
  T extends Pick<RouteGeometryAnalysis, 'minEle' | 'maxEle' | 'gain' | 'loss' | 'distanceIndexedProfileSamples'>,
>(analysis: T): T {
  return { ...analysis, minEle: null, maxEle: null, gain: null, loss: null, distanceIndexedProfileSamples: [] };
}

/**
 * What the time on the move is called: walking for a hike (in the wording the
 * place asks for), paddling for a paddle tour.
 */
export function movingTimeLabel(
  tour: { tour_type?: string } | undefined,
  hikeLabel: string,
  t: (key: string) => string
): string {
  return tour?.tour_type === 'kayak' ? t('tours.paddle.timeEstimatedShort') : hikeLabel;
}
