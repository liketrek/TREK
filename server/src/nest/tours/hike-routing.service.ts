import { logWarn } from '../audit/audit-log.logger';
import { badRequest } from '../common/domain-error';
import { RoadtripRouterService, RouteRefusal, type RoadtripRoute } from '../roadtrip/roadtrip-router.service';
import { gradableWayIds, gradesAlong, heightsOrNone, joinedLine, profileOf } from './hike-routing.helpers';
import { TourTrailGradeService } from './tour-trail-grade.service';
import { thinnedLine } from './tours.helpers';
import { Injectable } from '@nestjs/common';
import {
  bikeCosting,
  computeTourMetrics,
  HIKE_MAX_LINE_POINTS,
  HIKE_PLAN_LINE_POINTS,
  HIKE_PLAN_PROFILE_SAMPLES,
  hikePlanRequestSchema,
  hikingCosting,
  hikingPreferencesOf,
  hikingTimeMinutes,
  runCosting,
  sacStepOf,
  TOUR_MAX_SNAP_M,
  TOUR_TRAIL_GRADE_MAX_WAYS,
  TOURS_MAX_HIKING_DIFFICULTY,
  type BikeProfile,
  type GeometryPoint,
  type HikePlan,
  type HikePlanRequest,
  type HikingPreferences,
  type HikeTrailGrades,
  type RunProfile,
  type SacStep,
  type UnroutedHikePlan,
} from '@trek/shared';

/**
 * The day the router is asked for. A hike's way does not depend on the day:
 * the router only keys its cache by one and hands it to a routing plugin,
 * which a hike never asks.
 */
const ANY_DAY = 0;

/** A hike as planned: what the plan shows, and the whole line a tour created from it keeps. */
export interface PlannedHike {
  plan: HikePlan;
  /**
   * Every point of the routed line, each with its height or none with one;
   * null where no way was planned.
   */
  line: GeometryPoint[] | null;
  /**
   * For each point asked through, how far the router moved it onto a way, in
   * whole metres; null where no way was planned or the router did not say.
   */
  snapped: number[] | null;
  /**
   * The length of each leg between two points asked through, as the router
   * measured it, in metres; null where no way was planned.
   */
  legs: number[] | null;
}

/**
 * How long a planned hike is kept: a hike created or changed from the way a
 * proposal showed saves that very line, and a proposal asked again (another
 * label, another start) asks the router nothing.
 */
const PLAN_MEMO_TTL_MS = 15 * 60_000;
/** The most planned hikes kept; the one used longest ago goes first. */
const PLAN_MEMO_MAX = 64;
/**
 * The most line points all kept hikes hold together, besides PLAN_MEMO_MAX: a
 * kept line can run to HIKE_MAX_LINE_POINTS, and the memo shares the box with
 * everything else.
 */
const PLAN_MEMO_MAX_POINTS = 200_000;
/** Points nearer than this many decimal places of a degree (about a metre) are one point for the memo. */
const PLAN_MEMO_DECIMALS = 5;

interface KeptPlan {
  at: number;
  /** Whether the grades were read with it, so a proposal is never answered from a save that read none. */
  grades: boolean;
  /** How many points its whole line holds. */
  points: number;
  planned: PlannedHike;
}

/**
 * A tour planned through the same way as a hike but for another activity: a
 * bike tour by bike for its profile, a run on foot for its profile. Neither
 * takes a hiking limit, preferences or SAC grades.
 */
export type PlannedActivity = { activity: 'bike'; profile: BikeProfile } | { activity: 'run'; profile: RunProfile };

/**
 * The request as the memo keys it: who asked in which trip, the points to
 * about a metre, the limit, the preferences, and for a bike tour or a run its
 * activity and profile.
 */
function memoKeyOf(userId: number, tripId: number, request: HikePlanRequest, activity: PlannedActivity | null): string {
  const points = request.waypoints.map(({ lat, lng }) => [
    Number(lat.toFixed(PLAN_MEMO_DECIMALS)),
    Number(lng.toFixed(PLAN_MEMO_DECIMALS)),
  ]);
  const limit = request.max_hiking_difficulty ?? TOURS_MAX_HIKING_DIFFICULTY;
  const key = [userId, tripId, points, limit, hikingPreferencesOf(request.hiking_preferences)];
  return JSON.stringify(activity ? [...key, activity.activity, activity.profile] : key);
}

/** What a plan asks for besides the way and its heights. */
export interface HikePlanOptions {
  /**
   * Whether the SAC grades are read (one more question to the router and the
   * trail grades): a proposal shows them, a hike being saved keeps none.
   */
  grades: boolean;
  /**
   * A bike tour or a run, planned with its own costing and timed by the
   * router; a hike when left out. Its limit and preferences are a hike's and
   * go unread.
   */
  activity?: PlannedActivity;
}

/**
 * How a way is asked of the router: on foot with a hike's limit and
 * preferences, by bike with its profile's bicycle costing, on foot with a
 * run's pedestrian costing.
 */
function costingOf(
  activity: PlannedActivity | null,
  limit: number,
  preferences: HikingPreferences | null,
): ['walking' | 'cycling', Readonly<Record<string, number | string>>] {
  if (activity?.activity === 'bike') return ['cycling', bikeCosting(activity.profile)];
  if (activity?.activity === 'run') return ['walking', runCosting(activity.profile)];
  return ['walking', hikingCosting(limit, preferences)];
}

/** What went wrong, for the log. */
function reasonOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Why a router that gave no way gave none, in the plan's words. */
function whyNot(err: unknown): UnroutedHikePlan['why'] {
  return err instanceof RouteRefusal ? err.why : 'router_unavailable';
}

/**
 * A hike planned on the server the way the tour planner plans one in the
 * browser: the way on foot through its points under its hiking limit and
 * preferences (Valhalla only, through the router the road trip and the city
 * walks use, so its one paced queue and its choice of Valhalla hold), a point
 * the router had to move further onto a way than a tour allows named instead
 * of taken, the heights along the line, its length, climb, descent and the
 * walking time by the signposts' rule, and the SAC grades OpenStreetMap
 * records for the ways under it. Heights and grades are best effort: without
 * heights the line stays flat and its climb unknown, without grades the plan
 * says they could not be read. A way of more points than HIKE_MAX_LINE_POINTS
 * is not measured: its heights alone would hold the router's queue up for
 * every user. A way planned with every height is kept for a while (PLAN_MEMO_TTL_MS),
 * so the hike created from a proposal is the line the proposal showed. Writes nothing.
 */
@Injectable()
export class HikeRoutingService {
  /** The planned hikes kept, the one used last at the end. */
  private readonly memo = new Map<string, KeptPlan>();

  constructor(
    private readonly router: RoadtripRouterService,
    private readonly trailGrades: TourTrailGradeService,
  ) {}

  async plan(
    userId: number,
    tripId: number,
    request: HikePlanRequest,
    options?: HikePlanOptions,
  ): Promise<PlannedHike> {
    const activity = options?.activity ?? null;
    // SAC grades are a hike's: a bike tour or a run never reads them.
    const withGrades = activity === null && (options?.grades ?? true);
    // The tools check their own requests; a change plans through the points a hike has saved, held here to the same.
    const checked = hikePlanRequestSchema.safeParse(request);
    if (!checked.success) throw badRequest(checked.error.issues.map((issue) => issue.message).join('; '));
    const key = memoKeyOf(userId, tripId, request, activity);
    const kept = this.recall(key, withGrades);
    if (kept) return kept;
    const planned = await this.planned(userId, tripId, request, withGrades, activity);
    // Only a way with every height is kept: one without is asked again, and its heights with it.
    if (planned.plan.kind === 'routed' && planned.plan.has_heights && planned.line) {
      const grades = withGrades && planned.plan.grades !== null;
      this.remember(key, { at: Date.now(), grades, points: planned.line.length, planned });
    }
    return planned;
  }

  /** A hike kept from before for the same request, where it is fresh and read the grades it is asked for. */
  private recall(key: string, withGrades: boolean): PlannedHike | null {
    const kept = this.memo.get(key);
    if (!kept) return null;
    this.memo.delete(key);
    if (Date.now() - kept.at >= PLAN_MEMO_TTL_MS) return null;
    // Used now: it goes to the end, the last to be dropped.
    this.memo.set(key, kept);
    return withGrades && !kept.grades ? null : kept.planned;
  }

  /**
   * Keeps a planned hike. Stale ones go first, then the ones used longest ago
   * until the memo holds at most PLAN_MEMO_MAX hikes of PLAN_MEMO_MAX_POINTS
   * line points together.
   */
  private remember(key: string, kept: KeptPlan): void {
    this.memo.delete(key);
    this.memo.set(key, kept);
    let points = 0;
    for (const [other, entry] of this.memo) {
      if (kept.at - entry.at >= PLAN_MEMO_TTL_MS) this.memo.delete(other);
      else points += entry.points;
    }
    for (const [oldest, entry] of this.memo) {
      // The hike just kept is last and stays: one line holds far fewer points than the cap.
      if (this.memo.size <= PLAN_MEMO_MAX && points <= PLAN_MEMO_MAX_POINTS) break;
      this.memo.delete(oldest);
      points -= entry.points;
    }
  }

  /** The hike planned anew: the way, its heights and, where asked, its grades. */
  private async planned(
    userId: number,
    tripId: number,
    request: HikePlanRequest,
    withGrades: boolean,
    activity: PlannedActivity | null,
  ): Promise<PlannedHike> {
    const limit = request.max_hiking_difficulty ?? TOURS_MAX_HIKING_DIFFICULTY;
    const preferences = hikingPreferencesOf(request.hiking_preferences);
    const unrouted = (why: UnroutedHikePlan['why'], position: number | null = null, snapped: number | null = null) => ({
      plan: { kind: 'unrouted' as const, max_hiking_difficulty: limit, why, position, snapped_m: snapped },
      line: null,
      snapped: null,
      legs: null,
    });
    let route: RoadtripRoute;
    try {
      const points = request.waypoints.map(({ lat, lng }) => ({ lat, lng }));
      const [mode, costingOptions] = costingOf(activity, limit, preferences);
      route = await this.router.route(userId, tripId, ANY_DAY, points, mode, [], { costingOptions });
    } catch (err: unknown) {
      if (!(err instanceof RouteRefusal)) logWarn(`[Hike] no way for trip ${tripId}: ${reasonOf(err)}`);
      return unrouted(whyNot(err));
    }
    const snapped = route.snapped ?? [];
    const off = snapped.findIndex((point) => point.meters > TOUR_MAX_SNAP_M);
    if (off >= 0) return unrouted('point_off_the_way', off + 1, Math.round(snapped[off].meters));

    const flat = joinedLine(route.leg.line);
    if (flat.length > HIKE_MAX_LINE_POINTS) return unrouted('too_long');
    const lengthM = computeTourMetrics(flat).distanceKm * 1000;
    const [line, grades] = await Promise.all([
      this.withHeights(userId, flat),
      withGrades ? this.gradesOf(userId, flat, lengthM) : null,
    ]);
    const metrics = computeTourMetrics(line);
    const ascent = metrics.elevationGainM;
    const descent = metrics.elevationLossM;
    const heights = ascent !== null && descent !== null;
    // The signposts' rule is a walker's: a ride keeps the router's time for its profile, and a run's pace is set later.
    const byRule = heights && activity === null;
    return {
      plan: {
        kind: 'routed',
        max_hiking_difficulty: limit,
        hiking_preferences: preferences,
        distance_m: Math.round(lengthM),
        ascent_m: heights ? Math.round(ascent) : null,
        descent_m: heights ? Math.round(descent) : null,
        duration_minutes: byRule
          ? hikingTimeMinutes(metrics.distanceKm, ascent, descent)
          : Math.round(route.leg.seg.duration / 60),
        duration_basis: byRule ? 'din33466' : 'router',
        has_heights: heights,
        line: thinnedLine(line, HIKE_PLAN_LINE_POINTS),
        profile: profileOf(line, HIKE_PLAN_PROFILE_SAMPLES),
        grades,
      },
      line,
      snapped: route.snapped ? snapped.map((point) => Math.round(point.meters)) : null,
      legs: route.parts.map((part) => part.distance),
    };
  }

  /** The line with the height of every point, or as it was where the heights could not all be read. */
  private async withHeights(userId: number, flat: Array<[number, number]>): Promise<GeometryPoint[]> {
    try {
      return heightsOrNone(flat, await this.router.heights(userId, flat));
    } catch (err: unknown) {
      logWarn(`[Hike] no heights: ${reasonOf(err)}`);
      return heightsOrNone(flat, null);
    }
  }

  /**
   * The SAC grades along the line: the ways under it from the router, their
   * grades from OpenStreetMap. Null where either could not be read at all.
   */
  private async gradesOf(
    userId: number,
    flat: Array<[number, number]>,
    lengthM: number,
  ): Promise<HikeTrailGrades | null> {
    try {
      const ways = await this.router.wayIds(userId, flat);
      if (ways.length === 0) return null;
      const ids = gradableWayIds(ways, TOUR_TRAIL_GRADE_MAX_WAYS);
      const steps = new Map<number, SacStep>();
      if (ids.length > 0) {
        const answer = await this.trailGrades.grades({ way_ids: ids });
        if (answer.unanswered.length === ids.length) return null;
        for (const way of answer.ways) if (way.sac_scale) steps.set(way.id, sacStepOf(way.sac_scale));
      }
      return gradesAlong(ways, steps, lengthM);
    } catch (err: unknown) {
      logWarn(`[Hike] no trail grades: ${reasonOf(err)}`);
      return null;
    }
  }
}
