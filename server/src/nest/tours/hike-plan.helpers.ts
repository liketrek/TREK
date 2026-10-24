import { addStretch, metresAlong } from './hike-routing.helpers';
import type { PlannedHike } from './hike-routing.service';
import type { TourCreateCommand } from './tours.service';
import {
  arrivalsOf,
  cumulativeMetres,
  haversineMetres,
  HIKE_ALONG_MAX,
  HIKE_PROPOSAL_SAC_SEGMENTS,
  hikeScheduleOf,
  hikingPreferencesOf,
  legMinutes,
  nearestAlongM,
  TOUR_MAX_SNAP_M,
  type GeometryPoint,
  type HikeAlongPlace,
  type HikeCreateRequest,
  type HikeHighPoint,
  type HikePlan,
  type HikePlanPoint,
  type HikeStop,
  type HikeProposal,
  type HikeProposalSac,
  type HikeProposeRequest,
  type HikeRouteOutcome,
  type HikeSacSegment,
  type HikeTrailGrades,
  type TourPoi,
  type TourWaypoint,
  type UnroutedHikePlan,
  type WeatherResult,
} from '@trek/shared';

/**
 * The pure halves of a hike an assistant plans over MCP (HikePlanService):
 * the points it is planned through, the proposal shown from a plan (where
 * and when each point is reached, the highest point, the places along the
 * way, the day), the way a saved hike keeps from a plan, and the write a
 * created hike makes.
 */

/** The points a hike is planned through: as asked, and for a round trip back to its start. */
export function hikePointsOf(waypoints: readonly HikeStop[], roundTrip: boolean | undefined): HikeStop[] {
  const [start] = waypoints;
  // The way back ends where the hike began: the start ends no stage there.
  return roundTrip === true && start ? [...waypoints, { ...start, stage_end: undefined }] : [...waypoints];
}

/** Whether the way was planned, and why not, as the answers name it. */
export function routeOutcomeOf(plan: HikePlan): HikeRouteOutcome {
  return plan.kind === 'routed' ? { planned: true } : { planned: false, why: plan.why, position: plan.position };
}

/**
 * The points as a tour keeps them: in order, the first the start and the
 * last the end, with their names, and on a hike over several days the stops
 * its stages end at.
 */
export function hikeWaypointsOf(points: readonly HikeStop[]): TourWaypoint[] {
  const last = points.length - 1;
  return points.map(({ lat, lng, name, poi_category, stage_end }, sequence) => ({
    lat,
    lng,
    ...(name ? { name } : {}),
    ...(poi_category ? { poi_category } : {}),
    role: sequence === 0 ? 'start' : sequence === last ? 'end' : 'via',
    sequence,
    ...(stage_end === true && sequence > 0 && sequence < last ? { stage_end: true } : {}),
  }));
}

/** How many stages a hike's points make: one for a day hike. */
export function hikeStagesOf(points: readonly HikeStop[]): number {
  return 1 + points.filter((point) => point.stage_end === true).length;
}

/** The way a saved hike keeps from a plan: its whole line and walking time, or none, and how the planning went. */
export interface KeptWay {
  line: GeometryPoint[] | null;
  seconds: number | null;
  route: HikeRouteOutcome;
}

/**
 * The way a hike is saved with from its plan, as the planner saves one: the
 * whole line with the height of every point, and its walking time. A way
 * whose heights could not all be read is not kept: the planner saves no
 * hike without them, and the router that did not answer for them is asked
 * again when the hike is next planned, so it reads as `router_unavailable`.
 */
export function keptWayOf({ plan, line }: PlannedHike): KeptWay {
  if (plan.kind === 'routed' && plan.has_heights && line) {
    return { line, seconds: plan.duration_minutes * 60, route: { planned: true } };
  }
  const route: HikeRouteOutcome =
    plan.kind === 'routed' ? { planned: false, why: 'router_unavailable', position: null } : routeOutcomeOf(plan);
  return { line: null, seconds: null, route };
}

/**
 * The write of a hike created from its points, the way the planner's save
 * writes one: the way it keeps (the whole line with its heights and its
 * walking time) and its routing limit. Without a way it is saved with its
 * points only, and the planner plans the way when it is opened.
 */
export function hikeCreateCommandOf(
  request: HikeCreateRequest,
  points: readonly HikeStop[],
  way: KeptWay,
  limit: number,
): TourCreateCommand {
  return {
    name: request.name,
    description: request.description,
    tour_type: 'hike',
    route_geometry: way.line,
    duration_seconds: way.seconds,
    max_hiking_difficulty: limit,
    hiking_preferences: hikingPreferencesOf(request.hiking_preferences),
    ...(request.planned_duration_minutes !== undefined
      ? { planned_duration_minutes: request.planned_duration_minutes }
      : {}),
    waypoints: hikeWaypointsOf(points),
  };
}

/** How near a new point of a hike stands to a saved one to be the same point, in metres. */
const SAME_POINT_M = 25;

/** A new point and a saved one it may be, and how far apart they stand. */
interface PointPair {
  point: number;
  saved: number;
  gap: number;
}

/**
 * The saved point each new point stands on, one to one: of the pairs within
 * SAME_POINT_M the nearest are matched first, so a point set where a saved one
 * stood keeps it and a new point beside it takes nothing of it. Two pairs as
 * near (a loop's start and end on one spot) go by the order of the points.
 */
function savedPointsAt(points: readonly HikeStop[], saved: readonly TourWaypoint[]): Array<TourWaypoint | undefined> {
  const pairs: PointPair[] = [];
  points.forEach(({ lat, lng }, point) => {
    saved.forEach((old, index) => {
      const gap = haversineMetres(lat, lng, old.lat, old.lng);
      if (gap <= SAME_POINT_M) pairs.push({ point, saved: index, gap });
    });
  });
  pairs.sort((a, b) => a.gap - b.gap || a.point - b.point || a.saved - b.saved);
  const matched: Array<TourWaypoint | undefined> = points.map(() => undefined);
  const taken = new Set<number>();
  for (const pair of pairs) {
    if (matched[pair.point] || taken.has(pair.saved)) continue;
    matched[pair.point] = saved[pair.saved];
    taken.add(pair.saved);
  }
  return matched;
}

/**
 * New points as a hike keeps them, in order. A point that stands where a
 * saved one stood (within SAME_POINT_M, each saved point standing for one new
 * point at most) is that point still: it keeps its key, its link to the trip's
 * place it stands for, its name where the new one gives none, and on the way
 * a shaping point's mark where no stage ends there. A saved point no new one
 * stands on goes, with its link.
 */
export function repointedWaypoints(points: readonly HikeStop[], saved: readonly TourWaypoint[]): TourWaypoint[] {
  const same = savedPointsAt(points, saved);
  return hikeWaypointsOf(points).map((point, index) => {
    const old = same[index];
    if (!old) return point;
    const name = point.name ?? old.name;
    // A hike's new points carry no shaping mark: a spot that only steered the line steers it still.
    const shaping = old.shaping === true && point.role === 'via' && point.stage_end !== true;
    // Its key too: a stage is put on its day by the key of the stop it starts at.
    return {
      ...point,
      ...(old.key ? { key: old.key } : {}),
      ...(name ? { name } : {}),
      ...(old.linked_place_id ? { linked_place_id: old.linked_place_id } : {}),
      ...(shaping ? { shaping: true } : {}),
    };
  });
}

/**
 * How much nearer than the nearest pass a later one may be and still lose to
 * an earlier one: a way that comes by a point twice (a summit walked up and
 * down the same path) places it on the first pass.
 */
const PASS_SLACK_M = 30;

/**
 * Where each point lies along the line, in metres: at the line's nearest
 * point at or after the one before it, so the points keep their order and a
 * round trip's end lies at the end of the way, not at its start.
 */
export function positionsAlong(line: readonly GeometryPoint[], points: readonly HikePlanPoint[]): number[] {
  const along = metresAlong(line);
  let from = 0;
  return points.map(({ lat, lng }) => {
    const gaps = line.slice(from).map(([pointLat, pointLng]) => haversineMetres(lat, lng, pointLat, pointLng));
    const nearest = gaps.reduce((low, gap) => Math.min(low, gap), Number.POSITIVE_INFINITY);
    from += Math.max(
      0,
      gaps.findIndex((gap) => gap <= nearest + PASS_SLACK_M),
    );
    return Math.round(along[from]);
  });
}

/** The lowest and highest point of a line with heights, in whole metres. */
export function heightRangeOf(line: readonly GeometryPoint[]): { min: number; max: number } | null {
  const heights = line.flatMap((point) => (point.length === 3 ? [point[2]] : []));
  if (heights.length === 0 || heights.length !== line.length) return null;
  return {
    min: Math.round(heights.reduce((low, height) => Math.min(low, height), Number.POSITIVE_INFINITY)),
    max: Math.round(heights.reduce((high, height) => Math.max(high, height), Number.NEGATIVE_INFINITY)),
  };
}

/**
 * Neighbouring stretches joined in pairs, each pair taking the harder of its
 * grades, so a joined stretch never reads easier than a path in it. Only
 * stretches that touch are paired unless `acrossGaps`: a stretch of unknown
 * grade between two stays unknown, rather than read as either's grade.
 */
function pairedUp(segments: readonly HikeSacSegment[], acrossGaps: boolean): HikeSacSegment[] {
  const paired: HikeSacSegment[] = [];
  let held: HikeSacSegment | null = null;
  for (const segment of segments) {
    if (held && (acrossGaps || held.to_m === segment.from_m)) {
      addStretch(paired, { from_m: held.from_m, to_m: segment.to_m, sac: Math.max(held.sac, segment.sac) });
      held = null;
    } else {
      if (held) addStretch(paired, held);
      held = segment;
    }
  }
  if (held) addStretch(paired, held);
  return paired;
}

/**
 * The SAC grades a proposal shows: at most HIKE_PROPOSAL_SAC_SEGMENTS
 * stretches. Where a long way holds more, touching neighbours are joined in
 * pairs, the harder grade kept, until they fit; the stretches of unknown grade
 * between stay as they are. Only a way with more graded stretches than that,
 * each apart from the next, has them joined over the gaps as well. How much
 * of the line is unknown stays as measured.
 */
export function proposalSacOf(grades: HikeTrailGrades | null): HikeProposalSac | null {
  if (!grades) return null;
  let segments = grades.segments.reduce<HikeSacSegment[]>(addStretch, []);
  while (segments.length > HIKE_PROPOSAL_SAC_SEGMENTS) {
    const touching = pairedUp(segments, false);
    segments = touching.length < segments.length ? touching : pairedUp(segments, true);
  }
  return { highest: grades.highest, segments, unknown_share: grades.unknown_share };
}

/** Where a point lies further from any way than a tour allows: which one, and how far the router had to move it. */
function unreachableOf(plan: HikePlan): HikeProposal['unreachable'] {
  if (plan.kind !== 'unrouted' || plan.position === null || plan.snapped_m === null) return null;
  return { position: plan.position, snapped_m: plan.snapped_m };
}

/**
 * Where each point lies along the line, in metres: at the end of its leg as
 * the router measured the legs, laid onto the line's own length, so a point
 * the way passes twice (a loop's start and end, a summit walked up and down
 * one path) lies where the way reaches it in order. Where the router gave no
 * length for each leg, the line's nearest pass in order stands in.
 */
export function waypointPositionsOf({ line, legs }: PlannedHike, points: readonly HikePlanPoint[]): number[] | null {
  if (!line) return null;
  if (!legs || legs.length !== points.length - 1) return positionsAlong(line, points);
  const length = cumulativeMetres(line).at(-1) ?? 0;
  const measured = legs.reduce((sum, leg) => sum + leg, 0);
  const scale = measured > 0 ? length / measured : 0;
  return runningTotals(legs).map((along) => Math.round(along * scale));
}

/** Each value summed with all before it, after a leading 0: where each point lies when the legs are walked in order. */
function runningTotals(legs: readonly number[]): number[] {
  const totals = [0];
  let sum = 0;
  for (const leg of legs) {
    sum += leg;
    totals.push(sum);
  }
  return totals;
}

/** The walking minutes from the start to each point, the whole time split over the legs by the signposts' rule. */
function waypointMinutesOf(line: readonly GeometryPoint[], positions: readonly number[], total: number): number[] {
  return runningTotals(legMinutes(line, positions, total));
}

/** The highest point of a line with every height, the first where two are as high, and where along the line it lies. */
export function highPointOf(line: readonly GeometryPoint[] | null): HikeHighPoint | null {
  if (!line || !heightRangeOf(line)) return null;
  let top = 0;
  line.forEach((point, index) => {
    if ((point[2] ?? 0) > (line[top][2] ?? 0)) top = index;
  });
  const [lat, lng, height] = line[top];
  return { lat, lng, ele_m: Math.round(height ?? 0), at_m: Math.round(cumulativeMetres(line)[top]) };
}

/** Where the day's weather of a hike is read: at its highest point where the heights are known, else at its start. */
export function weatherPointOf(points: readonly HikePlanPoint[], { line }: PlannedHike): { lat: number; lng: number } {
  const high = highPointOf(line);
  return high ?? { lat: points[0].lat, lng: points[0].lng };
}

/**
 * The places along a way a proposal names: the nearest to it, at most
 * HIKE_ALONG_MAX, in the order the way passes them, each placed along the
 * whole line as the points of the hike are.
 */
export function alongPlacesOf(pois: readonly TourPoi[], line: readonly GeometryPoint[]): HikeAlongPlace[] {
  return [...pois]
    .sort((a, b) => a.distance_m - b.distance_m)
    .slice(0, HIKE_ALONG_MAX)
    .map((poi) => ({
      name: poi.name.trim() || null,
      category: poi.category,
      lat: poi.lat,
      lng: poi.lng,
      at_m: Math.round(nearestAlongM(line, poi.lat, poi.lng)),
      off_m: Math.round(poi.distance_m),
    }))
    .sort((a, b) => a.at_m - b.at_m);
}

/** What a proposal reads besides its plan: the day it is for, the places along the way and that day's weather. */
export interface HikeProposalContext {
  dayId: number | null;
  date: string | null;
  /** Null where none were looked for or the search failed. */
  along: HikeAlongPlace[] | null;
  /** Null where none was asked or it could not be had. */
  weather: WeatherResult | null;
  /**
   * A bike tour's or a run's own time on the move, in minutes, which stands
   * for the plan's and is shared out over the legs by their length: a ride's
   * is the router's for its profile, a run's its distance at the pace (null
   * without one). A hike leaves it out and keeps the signposts' rule.
   */
  movingMinutes?: number | null;
}

/** The minutes from the start to each point, the whole time shared out by how far along the way each lies. */
function minutesByLength(positions: readonly number[], total: number): number[] {
  const length = positions.at(-1) ?? 0;
  return positions.map((at) => (length > 0 ? Math.round((total * at) / length) : 0));
}

/**
 * The proposal of a hike as a plan gives it: the way and its measures, its
 * grades and highest point, each point with where, after how long and when
 * it is reached, the places along the way, the day's schedule and warnings,
 * and the request's own words given back. The line and the profile only when
 * asked for (include_geometry). Without a way the points are still shown,
 * with why there is none.
 */
export function hikeProposalOf(
  request: HikeProposeRequest,
  points: readonly HikeStop[],
  planned: PlannedHike,
  context: HikeProposalContext,
): HikeProposal {
  const { plan, line } = planned;
  const routed = plan.kind === 'routed' ? plan : null;
  const positions = routed ? waypointPositionsOf(planned, points) : null;
  const heights = routed?.has_heights && line ? heightRangeOf(line) : null;
  const own = context.movingMinutes !== undefined;
  const total = routed ? (own ? (context.movingMinutes ?? null) : routed.duration_minutes) : null;
  let minutes: number[] | null = null;
  if (line && positions && total !== null) {
    minutes = own ? minutesByLength(positions, total) : waypointMinutesOf(line, positions, total);
  }
  const arrivals = arrivalsOf(request.start_time ?? null, minutes ?? points.map(() => null));
  // One day's sun and hours say nothing about a hike over several days.
  const day =
    total !== null && context.date && hikeStagesOf(points) === 1
      ? hikeScheduleOf({
          date: context.date,
          dayId: context.dayId,
          start: request.start_time ?? null,
          minutes: total,
          weather: context.weather,
        })
      : null;
  return {
    name: request.name,
    variant_label: request.variant_label ?? null,
    route: routeOutcomeOf(plan),
    unreachable: unreachableOf(plan),
    distance_m: routed?.distance_m ?? null,
    ascent_m: routed?.ascent_m ?? null,
    descent_m: routed?.descent_m ?? null,
    duration_minutes: total,
    duration_basis: routed?.duration_basis ?? null,
    heights_known: heights !== null,
    min_ele_m: heights?.min ?? null,
    max_ele_m: heights?.max ?? null,
    ...(routed && request.include_geometry === true
      ? { line_geometry: routed.line, profile_geometry: routed.profile }
      : {}),
    sac: proposalSacOf(routed?.grades ?? null),
    high_point: routed ? highPointOf(line) : null,
    waypoints: points.map(({ lat, lng, name, poi_category, stage_end }, index) => ({
      lat,
      lng,
      name: name || null,
      poi_category: poi_category ?? null,
      stage_end: stage_end === true,
      at_m: positions?.[index] ?? null,
      snapped_m: routed ? (planned.snapped?.[index] ?? null) : null,
      minutes: minutes?.[index] ?? null,
      arrival: arrivals[index] ?? null,
    })),
    along: routed ? context.along : null,
    max_hiking_difficulty: plan.max_hiking_difficulty,
    hiking_preferences: routed ? routed.hiking_preferences : hikingPreferencesOf(request.hiking_preferences),
    round_trip: request.round_trip === true,
    day_id: context.dayId,
    date: context.date,
    start_time: request.start_time ?? null,
    schedule: day?.schedule ?? null,
    warnings: day?.warnings ?? [],
  };
}

/** Why no way was planned, in words that say what to do about it. */
const UNPLANNED: Readonly<Record<UnroutedHikePlan['why'], (position: number | null) => string>> = {
  no_valhalla: () =>
    'TREK has no Valhalla router here to plan a hike with (a routing server of its own knows no hiking limit).',
  router_unavailable: () => 'The router did not answer, for the way or for its heights; try again in a moment.',
  no_way: () => 'No way within the hiking limit joins these points: raise the limit or move the points.',
  point_off_the_way: (position) =>
    `Point ${position ?? ''} is further than ${TOUR_MAX_SNAP_M} m from any way: move it onto a path.`,
  too_long: () => 'The way is too long to plan as one hike: split it into shorter hikes.',
};

type Unplanned = Pick<UnroutedHikePlan, 'why' | 'position'>;

/** The refusal of a hike whose way could not be planned for a reason the planner would meet too: nothing is saved. */
export function unplannedCreateMessage({ why, position }: Unplanned): string {
  return `${UNPLANNED[why](position)} Nothing was saved.`;
}

/** The refusal of a change whose new way could not be planned: the hike keeps the way it has. */
export function unplannedChangeMessage({ why, position }: Unplanned): string {
  return `${UNPLANNED[why](position)} Nothing was saved and the hike keeps its way.`;
}
