import type { DistanceUnit } from '../../types';
import { formatDistance } from '../../utils/units';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * A day's or the trip's distance as the overview panel and the PDF print it.
 *
 * A leg the router gave no road for is drawn straight and adds nothing to the sum, so a
 * figure with such legs in it is a floor, and a figure made of nothing but such legs is
 * no figure at all. "0 m" for a day of driving read as a measurement (#2876). One wording
 * for the screen and the document, so the two cannot drift apart again.
 */
export function routeDistanceLabel(meters: number, unroutedLegs: number, unit: DistanceUnit, t: Translate): string {
  const distance = formatDistance(meters / 1000, unit);
  if (unroutedLegs <= 0) return distance;
  return meters > 0 ? t('map.overview.distanceAtLeast', { distance }) : t('map.overview.notRouted');
}
