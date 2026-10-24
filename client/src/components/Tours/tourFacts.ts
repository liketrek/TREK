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
 * place asks for) and for a city walk (CW-02), riding for a bike tour and for
 * a ride on horseback (HOR-01), paddling for a paddle tour, ski time for a
 * ski tour (SKI-02), and for a run (RUN-01) the running time it is planned
 * with, said as planned wherever it shows, so it never reads as a time
 * someone recorded.
 */
export function movingTimeLabel(
  tour: { tour_type?: string } | undefined,
  hikeLabel: string,
  t: (key: string) => string
): string {
  if (tour?.tour_type === 'kayak') return t('tours.paddle.timeEstimatedShort');
  if (tour?.tour_type === 'walk') return t('tours.walk.timeEstimatedShort');
  if (tour?.tour_type === 'run') return t('tours.run.timeEstimated');
  if (tour?.tour_type === 'horse') return t('tours.horse.time');
  if (tour?.tour_type === 'ski') return t('tours.ski.time');
  return tour?.tour_type === 'bike' ? t('tours.bike.timeEstimatedShort') : hikeLabel;
}
