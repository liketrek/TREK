import { paddleSpeedKmhSchema, recommendedPaddleSpeedKmh, type TourListItem, type TourWaypoint } from '@trek/shared';
import { parseRenderableRouteGeometry } from '../../../utils/routeGeometry';
import { openedTourFields } from '../planner/tourPlannerFacts';
import {
  normalizePlannerWaypoints,
  plannerWaypointsOf,
  type TourPlannerWaypoint,
} from '../planner/tourPlannerWaypoints';
import { legLengthsAlong, tourStagesOf, type PaddleStageInputs, type TourStage } from './tourStages';

/** MDT-02: a stage of a saved tour, with the key of the stop it starts at, by which a day holds it. */
export interface SavedTourStage extends TourStage {
  key: string | null;
}

/** The saved tour's points as the planner reads them, each numbered by its place in the route. */
export function savedStagePoints(tour: TourListItem, saved: readonly TourWaypoint[]): TourPlannerWaypoint[] {
  let next = 0;
  const points = plannerWaypointsOf(saved, () => `saved-${next++}`);
  return normalizePlannerWaypoints(points, openedTourFields(tour).tourType);
}

/**
 * A saved paddle tour's speeds as the planner works its time out: the speed
 * the paddler chose, else the boat's suggestion, and each leg as long as the
 * saved line runs it. Null for any other type.
 */
function paddleInputsOf(
  tour: TourListItem,
  points: readonly TourPlannerWaypoint[],
  line: ReadonlyArray<readonly number[]>
): PaddleStageInputs | null {
  if (tour.tour_type !== 'kayak') return null;
  const chosen = tour.paddle_speed_kmh ?? null;
  return {
    effectiveSpeedKmh: chosen ?? recommendedPaddleSpeedKmh(tour.boat_type ?? null),
    portageSpeedKmh: tour.portage_speed_kmh ?? null,
    speedInvalid: chosen !== null && !paddleSpeedKmhSchema.safeParse(chosen).success,
    legLengths: legLengthsAlong(points, line),
  };
}

/**
 * MDT-02: the stages of a saved multi-day tour, read the way the planner reads
 * them (MDT-01) off its saved points and its saved line, so the overview in
 * the list and the planner give the same figures. Without a line every stage
 * is there, unmeasured; the router's time is the tour's stored one.
 */
export function savedTourStagesOf(
  tour: TourListItem,
  points: readonly TourPlannerWaypoint[],
  routeGeometry: string | null | undefined
): SavedTourStage[] {
  const line = parseRenderableRouteGeometry(routeGeometry);
  const stages = tourStagesOf({
    points,
    line,
    tourType: openedTourFields(tour).tourType,
    routerSeconds: tour.duration == null ? null : tour.duration * 60,
    paddle: line ? paddleInputsOf(tour, points, line) : null,
    runPaceSecondsPerKm: tour.run_pace_seconds_per_km ?? null,
  });
  return stages.map((stage) => ({ ...stage, key: points[stage.from]?.key ?? null }));
}
