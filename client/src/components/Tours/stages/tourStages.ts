import {
  hikingTimeMinutes,
  MAX_PLANNED_TOUR_DURATION_MINUTES,
  MAX_TOUR_STAGES,
  runMinutesAtPace,
  type PlannableTourType,
} from '@trek/shared';
import { analyzeRouteGeometry } from '../../../utils/routeGeometry';
import { paddleEstimateOf } from '../planner/paddlePlanOf';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import { runPaceInvalid } from '../run/runPace';

/**
 * MDT-01: the stages of a multi-day tour, read off its points in route order.
 * A stage runs from the start, or from the stop that ended the stage before,
 * to the next stop marked as a stage end, or to the end of the tour. The
 * stages are a view of the one route, never a copy of it: what they measure is
 * cut from the line the whole tour was planned along.
 */

type StagePoint = Pick<TourPlannerWaypoint, 'id' | 'stageEnd' | 'shaping'>;

/** A stage as the points make it: its number from 1 and the index of its first and its last point. */
interface StageSpan {
  number: number;
  from: number;
  to: number;
}

/** How many stops end a stage. */
export function stageEndCount(points: readonly Pick<TourPlannerWaypoint, 'stageEnd'>[]): number {
  return points.filter((point) => point.stageEnd).length;
}

/** The stages in route order; none before the tour has two points, one for a day tour. */
export function stageSpansOf(points: readonly Pick<TourPlannerWaypoint, 'stageEnd'>[]): StageSpan[] {
  if (points.length < 2) return [];
  const last = points.length - 1;
  const spans: StageSpan[] = [];
  let from = 0;
  points.forEach((point, index) => {
    if (!point.stageEnd || index === 0 || index === last) return;
    spans.push({ number: spans.length + 1, from, to: index });
    from = index;
  });
  spans.push({ number: spans.length + 1, from, to: last });
  return spans;
}

/**
 * Whether a stage can end at this point: a stop between start and end, while
 * the tour has room for another stage. A point that ends one already can
 * always stop doing so.
 */
export function canEndStage(points: readonly StagePoint[], id: string): boolean {
  const index = points.findIndex((point) => point.id === id);
  const point = points[index];
  if (!point || index === 0 || index === points.length - 1 || point.shaping) return false;
  return point.stageEnd === true || stageEndCount(points) < MAX_TOUR_STAGES - 1;
}

/** The point without its stage end. */
function withoutMark<T extends StagePoint>(point: T): T {
  const { stageEnd: _taken, ...rest } = point;
  return rest as T;
}

/** The points with the stage end at this one set or taken away; the same array when nothing changes. */
export function withStageEnd<T extends StagePoint>(points: T[], id: string, on: boolean): T[] {
  const point = points.find((item) => item.id === id);
  if (!point || !!point.stageEnd === on || (on && !canEndStage(points, id))) return points;
  return points.map((item) => {
    if (item.id !== id) return item;
    return on ? { ...item, stageEnd: true } : withoutMark(item);
  });
}

/** Every stage end taken away: the tour a day tour again, its route as it was. */
export function withoutStageEnds<T extends StagePoint>(points: T[]): T[] {
  if (stageEndCount(points) === 0) return points;
  return points.map((point) => (point.stageEnd ? withoutMark(point) : point));
}

/**
 * How many stage ends a change of the points could not keep: their point was
 * removed, or the change left it where no stage can end (at the start or the
 * end, as a shaping point) and the planner had to drop the mark. A stage end
 * the change took away on purpose is no loss.
 */
export function lostStageEnds(
  current: readonly StagePoint[],
  changed: readonly StagePoint[],
  next: readonly StagePoint[]
): number {
  const kept = new Set(next.filter((point) => point.stageEnd).map((point) => point.id));
  const asChanged = new Map(changed.map((point) => [point.id, point]));
  return current.filter((point) => {
    if (!point.stageEnd || kept.has(point.id)) return false;
    const asChange = asChanged.get(point.id);
    // A point the change removed lost its mark; one the change kept lost it only if the change still had it.
    return !asChange || !!asChange.stageEnd;
  }).length;
}

/** What a stage measures; null where the route does not tell (no heights on the water, a route not planned yet). */
interface StageMetrics {
  distanceKm: number | null;
  gain: number | null;
  loss: number | null;
  /** Moving time, breaks left out. */
  minutes: number | null;
  /** Where the stage starts and ends along the whole route, in metres, as the elevation profile counts them. */
  fromM: number | null;
  toM: number | null;
}

export interface TourStage extends StageSpan, StageMetrics {
  fromId: string;
  toId: string;
  /** The moving time alone is more than a day. */
  overDay: boolean;
}

/** What a paddle tour's stage times are worked out from, as the planner works out the whole tour's. */
export interface PaddleStageInputs {
  effectiveSpeedKmh: number | null;
  portageSpeedKmh: number | null;
  speedInvalid: boolean;
  /** The routed length of each leg, by the index of the point it starts at. */
  legLengths?: ReadonlyArray<number | null>;
}

export interface TourStageInputs {
  points: readonly TourPlannerWaypoint[];
  /** The route as planned for exactly these points, with heights where it has them; null while it is not. */
  line: ReadonlyArray<readonly number[]> | null;
  tourType: PlannableTourType;
  /** The router's time for the whole tour, seconds. */
  routerSeconds: number | null;
  /** A paddle tour's speeds; null for any other type. */
  paddle: PaddleStageInputs | null;
  /** A run's pace in seconds per kilometre (RUN-01); null without one, and ignored for any other type. */
  runPaceSecondsPerKm: number | null;
}

const METRES_PER_DEGREE = 111_320;
/**
 * How much farther than the nearest spot of the line a point may lie and
 * still be placed at an earlier pass: a route that comes by a point twice (out
 * and back) places it where it gets there first.
 */
const PASS_TOLERANCE_M = 30;

function metresFrom(vertex: readonly number[], lat: number, lng: number): number {
  const x = ((vertex[1] ?? 0) - lng) * Math.cos((lat * Math.PI) / 180);
  const y = (vertex[0] ?? 0) - lat;
  return Math.hypot(x, y) * METRES_PER_DEGREE;
}

/** The vertex of the line each point lies at, searching on from where the one before lay. */
export function vertexIndicesOf(
  points: ReadonlyArray<{ lat: number; lng: number }>,
  line: ReadonlyArray<readonly number[]>
): number[] {
  const indices: number[] = [];
  let from = 0;
  for (const point of points) {
    let nearest = Infinity;
    for (let i = from; i < line.length; i++) nearest = Math.min(nearest, metresFrom(line[i], point.lat, point.lng));
    let index = from;
    for (let i = from; i < line.length; i++) {
      if (metresFrom(line[i], point.lat, point.lng) <= nearest + PASS_TOLERANCE_M) {
        index = i;
        break;
      }
    }
    indices.push(index);
    from = index;
  }
  return indices;
}

interface Stretch {
  distanceKm: number;
  gain: number | null;
  loss: number | null;
}

/** Distance and heights of one stretch of the line; a stretch of a single vertex measures nothing. */
function stretchOf(line: ReadonlyArray<readonly number[]>, from: number, to: number, heights: boolean): Stretch {
  const analysis = to > from ? analyzeRouteGeometry(JSON.stringify(line.slice(from, to + 1))) : null;
  return {
    distanceKm: analysis?.distanceKm ?? 0,
    gain: heights ? (analysis?.gain ?? 0) : null,
    loss: heights ? (analysis?.loss ?? 0) : null,
  };
}

/**
 * A paddle stage's time: its points as their own small tour. A lock at the
 * stop that ends a stage is passed on the day that ends there, not again the
 * next morning.
 */
function paddleStageMinutes(
  points: readonly TourPlannerWaypoint[],
  span: StageSpan,
  paddle: PaddleStageInputs
): number | null {
  const own = points
    .slice(span.from, span.to + 1)
    .map((point, index) => (index === 0 && span.from > 0 && point.lock ? { ...point, lock: null } : point));
  const estimate = paddleEstimateOf(own, paddle, paddle.speedInvalid, paddle.legLengths?.slice(span.from, span.to));
  return estimate.waterMinutes === null ? null : estimate.estimateMinutes;
}

/**
 * A stage's moving time by the tour's own rule, the same rule the whole tour
 * is timed by: a paddle stage at the paddler's speed, a run at the runner's
 * pace over its distance, a hike by the signposts' rule over its distance,
 * climb and descent, and otherwise the router's time for the whole tour
 * shared out by distance, which is how the router times a ride or a walk on
 * the flat. A ride on horseback (HOR-01) and a ski tour (SKI-02) have no
 * time, as the whole tour has none, and a run without a pace has none either.
 */
function stageMinutes(input: TourStageInputs, span: StageSpan, stretch: Stretch, totalKm: number): number | null {
  if (input.paddle) return paddleStageMinutes(input.points, span, input.paddle);
  if (input.tourType === 'horse' || input.tourType === 'ski') return null;
  if (input.tourType === 'run') {
    const pace = input.runPaceSecondsPerKm;
    return pace === null || runPaceInvalid(pace) ? null : runMinutesAtPace(stretch.distanceKm, pace);
  }
  if (input.tourType === 'hike' && stretch.gain !== null && stretch.loss !== null) {
    return hikingTimeMinutes(stretch.distanceKm, stretch.gain, stretch.loss);
  }
  if (input.routerSeconds === null || totalKm <= 0) return null;
  return Math.round((input.routerSeconds / 60) * (stretch.distanceKm / totalKm));
}

function unmeasured(span: StageSpan, points: readonly TourPlannerWaypoint[]): TourStage {
  return {
    ...span,
    fromId: points[span.from].id,
    toId: points[span.to].id,
    distanceKm: null,
    gain: null,
    loss: null,
    minutes: null,
    fromM: null,
    toM: null,
    overDay: false,
  };
}

/** Whether every vertex of the line carries a height. */
function hasHeights(line: ReadonlyArray<readonly number[]>): boolean {
  return line.every((vertex) => vertex.length >= 3 && Number.isFinite(vertex[2]));
}

/**
 * The stages of the tour with what each measures. While the route is not
 * planned for these points every stage is there, unmeasured. A day tour has
 * one stage, the whole tour, which the planner's overview already measures.
 */
export function tourStagesOf(input: TourStageInputs): TourStage[] {
  const spans = stageSpansOf(input.points);
  const { line, points } = input;
  if (!line || line.length < 2 || spans.length < 2) return spans.map((span) => unmeasured(span, points));
  const at = vertexIndicesOf(points, line);
  // A paddle tour's heights come off the banks, not the water: they stay unknown.
  const heights = input.tourType !== 'kayak' && hasHeights(line);
  const stretches = spans.map((span) => stretchOf(line, at[span.from], at[span.to], heights));
  const totalKm = stretches.reduce((sum, stretch) => sum + stretch.distanceKm, 0);
  let travelledM = 0;
  return spans.map((span, index) => {
    const stretch = stretches[index];
    const minutes = stageMinutes(input, span, stretch, totalKm);
    const fromM = travelledM;
    travelledM += stretch.distanceKm * 1000;
    return {
      ...unmeasured(span, points),
      ...stretch,
      minutes,
      fromM,
      toM: travelledM,
      overDay: minutes !== null && minutes > MAX_PLANNED_TOUR_DURATION_MINUTES,
    };
  });
}

/** Where along the route every stage but the last ends, in metres, for the marks across the elevation profile. */
export function stageBoundariesM(stages: readonly TourStage[]): number[] {
  return stages.slice(0, -1).flatMap((stage) => (stage.toM === null ? [] : [stage.toM]));
}

/**
 * MDT-02: how long each leg between two neighbouring points runs along the
 * line, in metres, as the paddle estimate reads a routed leg; a leg of a
 * single vertex has no length the line tells, and is left to the estimate.
 */
export function legLengthsAlong(
  points: ReadonlyArray<{ lat: number; lng: number }>,
  line: ReadonlyArray<readonly number[]>
): Array<number | null> {
  const at = vertexIndicesOf(points, line);
  return at.slice(0, -1).map((from, index) => {
    const to = at[index + 1];
    return to > from ? stretchOf(line, from, to, false).distanceKm * 1000 : null;
  });
}

/** A sum over the stages that have the value, with how many have it: null when none does, never a zero for unknown. */
export interface StageSum {
  value: number | null;
  known: number;
  of: number;
}

function stageSum(values: ReadonlyArray<number | null>): StageSum {
  const known = values.filter((value): value is number => value !== null);
  return {
    value: known.length > 0 ? known.reduce((total, value) => total + value, 0) : null,
    known: known.length,
    of: values.length,
  };
}

/** MDT-02: what the stages add up to, each measure only as far as the stages tell it. */
export function stageTotalsOf(stages: readonly TourStage[]) {
  return {
    distanceKm: stageSum(stages.map((stage) => stage.distanceKm)),
    gain: stageSum(stages.map((stage) => stage.gain)),
    loss: stageSum(stages.map((stage) => stage.loss)),
    minutes: stageSum(stages.map((stage) => stage.minutes)),
  };
}

export type StageTotals = ReturnType<typeof stageTotalsOf>;

/**
 * MDT-02: the keys of the stops the stages start at, as a day holds a stage
 * by them; none for a day tour, and none for a stage that starts at a point
 * no save has kept yet.
 */
export function stageStartKeysOf(points: readonly Pick<TourPlannerWaypoint, 'stageEnd' | 'key'>[]): string[] {
  const spans = stageSpansOf(points);
  if (spans.length < 2) return [];
  return spans.flatMap((span) => {
    const key = points[span.from]?.key;
    return key ? [key] : [];
  });
}
