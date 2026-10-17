import type { WindForecastResponse } from '@trek/shared';
import type { PaddleTourRoute } from '../planner/paddleRouting';

/** The hours a day tour is out on the water, as the wind strip shows them. */
const FIRST_HOUR = 6;
const LAST_HOUR = 21;

/**
 * Wind from which open water gets rough for a small boat: a moderate breeze
 * (Beaufort 4 from 20 km/h) or gusts of 30 km/h, where a crossing turns into
 * work and a capsize far from the bank into a long swim.
 */
const MEAN_KMH = 20;
const GUSTS_KMH = 30;

/** Whether the route as planned crosses a lake, so its lake style changes anything. */
export function crossesLake(route: Pick<PaddleTourRoute, 'legs'> | null): boolean {
  return !!route?.legs.some((leg) => leg?.status === 'ok' && leg.segments.some((segment) => segment.kind === 'lake'));
}

/**
 * PAD-11 with PAD-08: the strongest wind of the paddling hours when it is
 * enough to keep near the shores on the lakes, else null. Lakes are crossed
 * straight over as a rule and along the shore only in wind; this says when.
 */
export function windForShore(forecast: WindForecastResponse): { meanKmh: number; gustsKmh: number } | null {
  const hours = forecast.hours.filter((hour) => hour.hour >= FIRST_HOUR && hour.hour <= LAST_HOUR);
  const meanKmh = Math.max(0, ...hours.map((hour) => hour.speed_kmh ?? 0));
  const gustsKmh = Math.max(0, ...hours.map((hour) => hour.gusts_kmh ?? 0));
  if (meanKmh < MEAN_KMH && gustsKmh < GUSTS_KMH) return null;
  return { meanKmh: Math.round(meanKmh), gustsKmh: Math.round(gustsKmh) };
}
