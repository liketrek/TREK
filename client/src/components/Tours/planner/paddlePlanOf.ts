import {
  estimatePaddleTime,
  paddleLayoutOfPoints,
  paddleRolesOf,
  type PaddlePlanPoint,
  type PaddleRole,
  type PaddleTimeEstimate,
} from '@trek/shared';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';

/** The planner's control points as the shared paddle plan reads them. */
export function paddlePlanPoints(points: readonly TourPlannerWaypoint[]): PaddlePlanPoint[] {
  return points.map((point) => ({
    lat: point.lat,
    lng: point.lng,
    fixed_leg: point.fixedLeg ?? null,
    lock: point.lock ?? null,
  }));
}

/** Put-in, take-out, re-entry and final take-out by control point id. */
export function paddleRolesById(points: readonly TourPlannerWaypoint[]): Map<string, PaddleRole | null> {
  const roles = paddleRolesOf(paddlePlanPoints(points));
  return new Map(points.map((point, index) => [point.id, roles[index] ?? null]));
}

/**
 * PAD-07: the estimate of a paddle tour as planned, without its breaks (the
 * planner adds those as it does for a hike), with the routed length of each
 * leg where the router planned it (PAD-11). A speed the paddler typed that
 * does not hold leaves the water time unknown rather than wrong.
 */
export function paddleEstimateOf(
  points: readonly TourPlannerWaypoint[],
  paddle: { effectiveSpeedKmh: number | null; portageSpeedKmh: number | null },
  speedInvalid: boolean,
  legLengths?: ReadonlyArray<number | null>
): PaddleTimeEstimate {
  return estimatePaddleTime(paddleLayoutOfPoints(paddlePlanPoints(points), legLengths), {
    paddleSpeedKmh: speedInvalid ? null : paddle.effectiveSpeedKmh,
    portageSpeedKmh: paddle.portageSpeedKmh,
    breakMinutes: null,
  });
}
