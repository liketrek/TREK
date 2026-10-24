import { distancesToLine, haversineMetres, type TourActivityMetrics } from '@trek/shared';

/**
 * ACT-02, the pure half of comparing a tour's plan with a track it was
 * actually done with: the values both carry side by side, the difference only
 * where both are known and mean the same thing, and how far the recorded line
 * strayed from the planned one. Nothing is estimated: a value one side does
 * not carry stays missing and is said to be.
 */

type Line = readonly (readonly number[])[];

/** What the plan says, as the tour's detail shows it in its head. */
export interface PlanValues {
  distanceKm: number | null;
  gain: number | null;
  loss: number | null;
  /** The planned total, breaks included, as a recording's time includes its pauses; null without one. */
  minutes: number | null;
  /** The total leaves out a stay nobody entered yet (CW-02): a floor, not a value to subtract from. */
  minutesAtLeast: boolean;
  /** The planned line, `[lat, lng]` points; null while the tour has none. */
  line: Line | null;
}

export type CompareKey = 'distance' | 'ascent' | 'descent' | 'time';

/** One measure of both: kilometres, metres or minutes, as the key says. */
export interface CompareRow {
  key: CompareKey;
  plan: number | null;
  actual: number | null;
  /** Actual less planned; null unless both are known and comparable. */
  difference: number | null;
}

function row(key: CompareKey, plan: number | null, actual: number | null, comparable = true): CompareRow {
  return { key, plan, actual, difference: comparable && plan !== null && actual !== null ? actual - plan : null };
}

/** The four measures both sides can carry, in the order the detail names them. */
export function compareRows(plan: PlanValues, metrics: TourActivityMetrics): CompareRow[] {
  return [
    row('distance', plan.distanceKm, metrics.distance_km),
    row('ascent', plan.gain, metrics.elevation_gain_m),
    row('descent', plan.loss, metrics.elevation_loss_m),
    row('time', plan.minutes, metrics.elapsed_minutes, !plan.minutesAtLeast),
  ];
}

/**
 * How far from the planned line a recorded point may lie and still count as
 * on it: a phone's position wanders by tens of metres, and a planned line runs
 * down the middle of a road the track walked beside.
 */
export const OFF_PLAN_M = 50;

/**
 * At most this many recorded points are measured. A track logged every second
 * holds tens of thousands, each measured against every leg of the plan; every
 * n-th point keeps the measuring quick and the answer within a few metres.
 */
export const MEASURED_POINTS = 1500;

interface PlanDeviation {
  /** The largest distance of a recorded point from the planned line, in metres. */
  farthestM: number;
  /** The recorded kilometres farther than OFF_PLAN_M from the plan. */
  offPlanKm: number;
  /** That share of the recorded distance, 0 to 1. */
  offPlanShare: number;
}

/** Every n-th point, the last always among them, so the measured line still ends where the track did. */
function sampled(points: Line): Line {
  if (points.length <= MEASURED_POINTS) return points;
  const step = Math.ceil(points.length / MEASURED_POINTS);
  const kept = points.filter((_, index) => index % step === 0);
  return kept[kept.length - 1] === points[points.length - 1] ? kept : [...kept, points[points.length - 1]];
}

/**
 * Where the recorded line left the planned one: its farthest point and the
 * stretches away from it. A stretch counts as away when both its ends lie
 * farther than OFF_PLAN_M. Null without two points on either line.
 */
export function planDeviation(recorded: Line, planned: Line | null): PlanDeviation | null {
  if (!planned || planned.length < 2 || recorded.length < 2) return null;
  const points = sampled(recorded);
  const distances = distancesToLine(points, planned);
  if (!distances) return null;
  let total = 0;
  let off = 0;
  let farthestM = distances[0] ?? 0;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const step = haversineMetres(Number(from[0]), Number(from[1]), Number(to[0]), Number(to[1]));
    total += step;
    if ((distances[index - 1] ?? 0) > OFF_PLAN_M && (distances[index] ?? 0) > OFF_PLAN_M) off += step;
    farthestM = Math.max(farthestM, distances[index] ?? 0);
  }
  return { farthestM, offPlanKm: off / 1000, offPlanShare: total > 0 ? off / total : 0 };
}
