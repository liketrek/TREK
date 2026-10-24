import type { TourCreateCommand } from './tours.service';
import {
  cumulativeMetres,
  estimatePaddleTime,
  paddleLayoutOfTrack,
  paddleMovingSeconds,
  recommendedPaddleSpeedKmh,
  skiOptionsForDiscipline,
  type GeometryPoint,
  type PaddleRouteLeg,
  type PaddleTourCreateRequest,
  type SkiRouteLeg,
  type SkiTourCreateRequest,
  type SportTourPoint,
  type TourWaypoint,
  type TrackMarks,
} from '@trek/shared';

/**
 * The pure halves of a paddle or ski tour saved from a plan
 * (SportTourCreateService): the legs between its points, the portages and
 * locks the paddle router found laid along the whole line, the joined line of
 * a ski tour with its time, and the write each one makes, as the planner's
 * save writes it.
 */

/** What a save keeps of a plan: the whole line with its heights (null without them) and a paddle tour's marks. */
export interface SportPlanned {
  line: GeometryPoint[] | null;
  marks: TrackMarks | null;
}

/** The legs a tour's points make, each from one point to the next. */
export function legsOf(points: readonly SportTourPoint[]): Array<{ from: SportTourPoint; to: SportTourPoint }> {
  return points.slice(1).map((to, index) => ({ from: points[index] as SportTourPoint, to }));
}

type PlannedPaddleLeg = Extract<PaddleRouteLeg, { status: 'ok' }>;

/**
 * The portages and locks of the planned legs, in metres along the whole
 * line as the legs are joined: each leg's stretches placed by its own line,
 * after the length of the legs before it. A lock has no time of its own
 * entered, which the estimate names as unknown rather than zero.
 */
export function paddleMarksOf(legs: readonly PlannedPaddleLeg[]): TrackMarks {
  const marks: TrackMarks = { portages: [], locks: [] };
  let offset = 0;
  for (const leg of legs) {
    const along = cumulativeMetres(leg.geometry.map(([lat, lng]) => [lat, lng] as const));
    for (const segment of leg.segments) {
      const from = offset + (along[segment.from] ?? 0);
      const to = offset + (along[segment.to] ?? 0);
      if (segment.kind === 'portage' && to > from) marks.portages.push({ from_m: from, to_m: to, extra_minutes: null });
      if (segment.kind === 'lock') {
        marks.locks.push({ at_m: (from + to) / 2, wait_minutes: null, transit_minutes: null });
      }
    }
    offset += along.at(-1) ?? 0;
  }
  return marks;
}

/** The length of a line in metres. */
function lengthOf(line: readonly GeometryPoint[]): number {
  return cumulativeMetres(line.map(([lat, lng]) => [lat, lng] as const)).at(-1) ?? 0;
}

/**
 * The write of a paddle tour, as the planner's save writes one: its boat and
 * water, the speeds its time is reckoned with (the boat's starting speed where
 * none is given) and that time, the moving part of the planner's estimate.
 */
export function paddleCommandOf(
  request: PaddleTourCreateRequest,
  waypoints: TourWaypoint[],
  planned: SportPlanned,
): TourCreateCommand {
  const boat = request.boat_type ?? 'kayak';
  const speed = request.paddle_speed_kmh ?? recommendedPaddleSpeedKmh(boat);
  const portageSpeed = request.portage_speed_kmh ?? null;
  const estimate = planned.line
    ? estimatePaddleTime(paddleLayoutOfTrack(lengthOf(planned.line), planned.marks), {
        paddleSpeedKmh: speed,
        portageSpeedKmh: portageSpeed,
        breakMinutes: null,
      })
    : null;
  return {
    name: request.name,
    description: request.description,
    tour_type: 'kayak',
    route_geometry: planned.line,
    duration_seconds: estimate ? paddleMovingSeconds(estimate) : null,
    max_hiking_difficulty: null,
    hiking_preferences: null,
    boat_type: boat,
    water_context: request.water_context,
    paddle_speed_kmh: speed,
    portage_speed_kmh: portageSpeed,
    paddle_lake_style: request.lake_style ?? null,
    ...(request.planned_duration_minutes !== undefined
      ? { planned_duration_minutes: request.planned_duration_minutes }
      : {}),
    waypoints,
  };
}

type PlannedSkiLeg = Extract<SkiRouteLeg, { status: 'ok' }>;

/**
 * The planned legs of a ski tour as one line, each point with its height
 * where the piste data has one, a point repeating the one before it left out,
 * and the piste router's time: skiing, lifts, waiting and walking together.
 */
export function skiLineOf(legs: readonly PlannedSkiLeg[]): { line: GeometryPoint[]; seconds: number } {
  const line: GeometryPoint[] = [];
  for (const [lat, lng, height] of legs.flatMap((leg) => leg.geometry)) {
    const last = line.at(-1);
    if (last && last[0] === lat && last[1] === lng) continue;
    line.push(height === null ? [lat, lng] : [lat, lng, height]);
  }
  const seconds = legs.reduce((sum, { seconds: parts }) => sum + parts.ski + parts.lift + parts.wait + parts.walk, 0);
  return { line, seconds };
}

/**
 * The write of a ski tour, as the planner's save writes one: its discipline
 * (and a cross-country technique), the options the piste router was asked
 * with as the discipline reads them, the build its legs were planned on, every
 * leg as planned by it, and its time, given only with the line it belongs to.
 */
export function skiCommandOf(
  request: SkiTourCreateRequest,
  waypoints: TourWaypoint[],
  planned: SportPlanned,
  plan: { build: string | null; seconds: number; legs: number },
): TourCreateCommand {
  const crossCountry = request.discipline === 'cross_country';
  return {
    name: request.name,
    description: request.description,
    tour_type: 'ski',
    route_geometry: planned.line,
    duration_seconds: planned.line ? Math.round(plan.seconds) : null,
    max_hiking_difficulty: null,
    hiking_preferences: null,
    ski_discipline: request.discipline,
    ski_technique: crossCountry ? (request.technique ?? null) : null,
    ski_options: skiOptionsForDiscipline(request.discipline, request.options ?? {}),
    ski_route_build: plan.build,
    ski_planned_legs: Array.from({ length: plan.legs }, (_, index) => index),
    ...(request.planned_duration_minutes !== undefined
      ? { planned_duration_minutes: request.planned_duration_minutes }
      : {}),
    waypoints,
  };
}
