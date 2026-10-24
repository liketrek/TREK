import { runMinutesAtPace } from './run-pace';

import { z } from 'zod';

/**
 * Walking time the way hiking signposts in the Alps state it (DIN 33466, as the
 * DAV and the Swiss hiking trails use it): 4 km an hour on the flat, 300 m of
 * climb and 500 m of descent an hour, and of the time for the distance and the
 * time for the height only the larger counts in full, the smaller by half.
 *
 * The planner times a hike by it, and an imported hike is estimated by it
 * (TIME-01), so both come from this one rule.
 */
const FLAT_KM_PER_HOUR = 4;
const CLIMB_M_PER_HOUR = 300;
const DESCENT_M_PER_HOUR = 500;

export function hikingTimeMinutes(distanceKm: number, climbM: number, descentM: number): number {
  const flat = distanceKm / FLAT_KM_PER_HOUR;
  const height = climbM / CLIMB_M_PER_HOUR + descentM / DESCENT_M_PER_HOUR;
  const hours = Math.max(flat, height) + Math.min(flat, height) / 2;
  return Math.round(hours * 60);
}

/**
 * TIME-01: what an estimate is worked out by. `din33466`: a hike's distance,
 * climb and descent by the signposts' rule; `run_pace`: a run's distance at
 * the pace its runners entered.
 */
export const tourTimeEstimateBasisSchema = z.enum(['din33466', 'run_pace']);
export type TourTimeEstimateBasis = z.infer<typeof tourTimeEstimateBasisSchema>;

/**
 * TIME-01: the time a tour without a planned time is estimated to take, in
 * minutes and without breaks, worked out whenever it is read and never
 * stored. `minutes` is null when the rule needs heights the track does not
 * carry: then the time is unknown, never the time on the flat.
 */
export const tourTimeEstimateSchema = z.object({
  minutes: z.number().int().nonnegative().nullable(),
  basis: tourTimeEstimateBasisSchema,
});
export type TourTimeEstimate = z.infer<typeof tourTimeEstimateSchema>;

/** What an estimate is read from: the tour's type, its measures, its planned time and a run's pace. */
export interface TourTimeEstimateSource {
  tour_type: string;
  distance: number | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  /** The time the planner worked out, in minutes; a tour that has one is not estimated. */
  duration: number | null;
  run_pace_seconds_per_km?: number | null;
}

/**
 * TIME-01: the estimate of a tour that has no time of its own (an imported
 * track, which the planner never timed), or null where there is nothing to
 * estimate it by. Only the rules the planner times these types by are used:
 * a hike by DIN 33466 from its own climb and descent, a run by the pace its
 * runners entered. A bike tour, a city walk and a paddle tour are timed by a
 * router or by a speed of their own, a ride and a ski tour by none, so none
 * of them is estimated here.
 */
export function tourTimeEstimate(tour: TourTimeEstimateSource): TourTimeEstimate | null {
  if (tour.duration != null || tour.distance == null) return null;
  if (tour.tour_type === 'hike') {
    const known = tour.elevation_gain != null && tour.elevation_loss != null;
    return {
      minutes: known ? hikingTimeMinutes(tour.distance, tour.elevation_gain ?? 0, tour.elevation_loss ?? 0) : null,
      basis: 'din33466',
    };
  }
  const pace = tour.run_pace_seconds_per_km ?? null;
  if (tour.tour_type === 'run' && pace !== null) {
    return { minutes: runMinutesAtPace(tour.distance, pace), basis: 'run_pace' };
  }
  return null;
}
