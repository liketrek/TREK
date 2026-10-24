import { logWarn } from '../audit/audit-log.logger';
import { badRequest } from '../common/domain-error';
import { RoadtripRouterService, RouteRefusal } from '../roadtrip/roadtrip-router.service';
import { HikePlanService } from './hike-plan.service';
import { joinedLine } from './hike-routing.helpers';
import {
  legEndsOf,
  legWaysKey,
  percentOf,
  pinnedPointsOf,
  roadOf,
  roundPointsOf,
  roundSearchKey,
  rulesOf,
  wayIndexOf,
  wayKeyAt,
  wayMissing,
} from './hike-ways.helpers';
import { ToursService } from './tours.service';
import { Injectable } from '@nestjs/common';
import {
  computeTourMetrics,
  deviationOf,
  hikingCosting,
  HIKE_WAY_KEYS,
  otherWaysOf,
  pinWay,
  searchRoundLoops,
  TOUR_MAX_SNAP_M,
  type HikeLegWayProposal,
  type HikeLegWayRequest,
  type HikeRoundProposal,
  type HikeRoundProposeRequest,
  type HikeWayMiss,
  type HikeWayMissing,
  type HikeWayPoints,
  type RoadLine,
  type RoundLoop,
  type WayPin,
} from '@trek/shared';

type Spot = { lat: number; lng: number };

/** The day the router is asked for: a hike's way does not depend on it (see HikeRoutingService). */
const ANY_DAY = 0;
/** How long a search is kept: the rounds or ways of one answer are asked for one after another, and taken later. */
const SEARCH_TTL_MS = 15 * 60_000;
/** The most searches kept; the oldest goes first. */
const SEARCH_MAX = 32;

/** What a round search found: the rounds, or why there are none. */
interface RoundSearch {
  rounds: RoundLoop[];
  why: HikeWayMiss | null;
}

/**
 * What the ways of one leg came to: the pins that hold each way the router
 * keeps to, or why there are none. Only what the router was asked is kept;
 * each call sets the pins on its own points.
 */
interface LegWays {
  pins: WayPin[][];
  why: HikeWayMiss | null;
}

interface Kept<T> {
  at: number;
  search: Promise<T>;
}

/** What went wrong, for the log. */
function reasonOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Why a router that answered nothing answered nothing, in a proposal's words. */
function missOf(err: unknown): HikeWayMiss {
  return err instanceof RouteRefusal ? err.why : 'router_unavailable';
}

/**
 * RTE-02 and RTE-03 for the assistant: a round hike of about a wished length
 * out of one point, and the other ways the router knows for one leg of a
 * hike, each answered as a hike proposal (HikePlanService.propose), so the
 * chat draws and compares it as it does propose_hike's and creates the one
 * chosen with create_hike. The search is the planner's (`searchRoundLoops`,
 * `otherWaysOf`, `pinWay` in @trek/shared), asked of the server's router
 * under the hike's own costing. One search answers the three ways: the calls
 * for b and c share the search the call for a started, kept for a while.
 * Writes nothing.
 */
@Injectable()
export class HikeWaysService {
  private readonly kept = new Map<string, Kept<RoundSearch | LegWays>>();

  constructor(
    private readonly router: RoadtripRouterService,
    private readonly hikes: HikePlanService,
    private readonly tours: ToursService,
  ) {}

  /** The round `request.round` of the rounds found out of the start, proposed as a hike; missing where there is none. */
  async proposeRound(
    userId: number,
    tripId: number,
    request: HikeRoundProposeRequest,
  ): Promise<HikeRoundProposal | HikeWayMissing> {
    const key = roundSearchKey(userId, tripId, request);
    const search = await this.recall(key, () => this.searchRounds(userId, tripId, request));
    const { rounds, why } = search as RoundSearch;
    const index = wayIndexOf(request.round);
    const round = rounds[index];
    if (!round) return wayMissing(request.round, rounds.length, why);
    const points = roundPointsOf(request.start, round.via);
    const proposal = await this.hikes.propose(userId, tripId, {
      name: request.name,
      ...points,
      max_hiking_difficulty: request.max_hiking_difficulty,
      hiking_preferences: request.hiking_preferences,
      variant_label: request.variant_label,
      day_id: request.day_id,
      date: request.date,
      start_time: request.start_time,
      along: false,
      include_geometry: request.include_geometry,
    });
    const targetM = Math.round(request.distance_km * 1000);
    return {
      ...proposal,
      found: true,
      round: {
        key: wayKeyAt(index),
        target_m: targetM,
        deviation_pct: percentOf(deviationOf(proposal.distance_m ?? round.distanceM, targetM)),
        rounds_found: rounds.length,
      },
      create_with: points,
    };
  }

  /**
   * The way `request.way` of the other ways for one leg, proposed as the
   * whole hike with that leg taken so, beside the hike as it runs now;
   * missing where there is none. A saved hike named by `tour_id` must be a
   * hike of the trip.
   */
  async proposeLegWay(
    userId: number,
    tripId: number,
    request: HikeLegWayRequest,
  ): Promise<HikeLegWayProposal | HikeWayMissing> {
    if (request.tour_id !== undefined) {
      const { tour } = await this.tours.getTour(String(tripId), String(request.tour_id));
      if (tour.tour_type !== 'hike') throw badRequest('Only the legs of a hike have other ways here.');
    }
    const key = legWaysKey(userId, tripId, request);
    const search = await this.recall(key, () => this.searchLegWays(userId, tripId, request));
    const { pins, why } = search as LegWays;
    // Spots that read as one key may come with other names, stage ends or the way back given as a point.
    const ways = pins.flatMap((held) => {
      const pinned = pinnedPointsOf(request.waypoints, request.leg, held);
      return pinned ? [pinned] : [];
    });
    const index = wayIndexOf(request.way);
    const waypoints = ways[index];
    if (!waypoints) return wayMissing(request.way, ways.length, why);
    const roundTrip = request.round_trip === true;
    const base = {
      name: request.name,
      max_hiking_difficulty: request.max_hiking_difficulty,
      hiking_preferences: request.hiking_preferences,
      day_id: request.day_id,
      date: request.date,
      start_time: request.start_time,
      round_trip: roundTrip,
      along: false,
      include_geometry: request.include_geometry,
    };
    const current = await this.hikes.propose(userId, tripId, { ...base, waypoints: request.waypoints });
    const proposal = await this.hikes.propose(userId, tripId, { ...base, waypoints });
    const points: HikeWayPoints = {
      waypoints: waypoints.map(({ lat, lng, name, poi_category, stage_end }) => ({
        lat,
        lng,
        ...(name === undefined ? {} : { name }),
        ...(poi_category === undefined ? {} : { poi_category }),
        ...(stage_end === true ? { stage_end } : {}),
      })),
      round_trip: roundTrip,
    };
    return {
      ...proposal,
      found: true,
      leg_way: { key: wayKeyAt(index), leg: request.leg, ways_found: ways.length, tour_id: request.tour_id ?? null },
      current: {
        distance_m: current.distance_m,
        ascent_m: current.ascent_m,
        duration_minutes: current.duration_minutes,
      },
      ...(request.include_geometry === true && current.line_geometry
        ? { current_geometry: current.line_geometry }
        : {}),
      create_with: points,
    };
  }

  /**
   * The search kept under `key`, or a new one started; one asked while
   * another for the same key runs shares it. A search that failed is not kept.
   */
  private async recall<T extends RoundSearch | LegWays>(key: string, start: () => Promise<T>): Promise<T> {
    const now = Date.now();
    for (const [other, entry] of this.kept) if (now - entry.at >= SEARCH_TTL_MS) this.kept.delete(other);
    const kept = this.kept.get(key);
    if (kept) return (await kept.search) as T;
    const search = start();
    this.kept.set(key, { at: now, search });
    const [oldest] = this.kept.keys();
    if (this.kept.size > SEARCH_MAX && oldest !== undefined) this.kept.delete(oldest);
    try {
      return await search;
    } catch (err: unknown) {
      this.kept.delete(key);
      throw err;
    }
  }

  /** The rounds out of the start, asked of the router as the planner asks them. */
  private async searchRounds(userId: number, tripId: number, request: HikeRoundProposeRequest): Promise<RoundSearch> {
    const { limit, preferences } = rulesOf(request);
    const costingOptions = hikingCosting(limit, preferences);
    const start = { lat: request.start.lat, lng: request.start.lng };
    let refused: HikeWayMiss | null = null;
    const ask = async (spots: Spot[]): Promise<RoundLoop | null | undefined> => {
      try {
        const route = await this.router.route(userId, tripId, ANY_DAY, [start, ...spots, start], 'walking', [], {
          costingOptions,
        });
        if ((route.snapped ?? []).some((point) => point.meters > TOUR_MAX_SNAP_M)) return null;
        const coordinates = joinedLine(route.leg.line);
        const via = route.snapped?.slice(1, -1).map(({ at }) => ({ lat: at[0], lng: at[1] })) ?? spots;
        return { coordinates, via, distanceM: Math.round(computeTourMetrics(coordinates).distanceKm * 1000) };
      } catch (err: unknown) {
        if (err instanceof RouteRefusal && err.why !== 'no_valhalla') return null;
        refused = missOf(err);
        if (!(err instanceof RouteRefusal)) logWarn(`[Hike] no round for trip ${tripId}: ${reasonOf(err)}`);
        return undefined;
      }
    };
    // Without a Valhalla to ask no round can be found: the search stops at the first answer saying so.
    const signal = {
      get aborted() {
        return refused === 'no_valhalla';
      },
    };
    const state = await searchRoundLoops(start, request.distance_km * 1000, ask, { signal });
    if (state.answered === 0) return { rounds: [], why: refused ?? 'router_unavailable' };
    return { rounds: state.found, why: null };
  }

  /**
   * The other ways of one leg: the router's ways between its two ends under
   * the hike's costing, those that are no way already known, each held by
   * the fewest pins the router keeps to (as the planner holds a way chosen).
   * A way the router does not keep to is left out; one whose pins would take
   * the hike past its points is left out where they are set on them.
   */
  private async searchLegWays(userId: number, tripId: number, request: HikeLegWayRequest): Promise<LegWays> {
    const ends = legEndsOf(request.waypoints, request.round_trip, request.leg);
    if (!ends) throw badRequest('The hike has no such leg');
    const { limit, preferences } = rulesOf(request);
    const costingOptions = hikingCosting(limit, preferences);
    let offers: Array<[number, number][]>;
    try {
      offers = await this.router.alternatesOnFoot(userId, ends.from, ends.to, costingOptions, HIKE_WAY_KEYS.length);
    } catch (err: unknown) {
      if (!(err instanceof RouteRefusal)) logWarn(`[Hike] no other ways for trip ${tripId}: ${reasonOf(err)}`);
      return { pins: [], why: missOf(err) };
    }
    const [own] = offers;
    if (!own) return { pins: [], why: 'no_way' };
    const current = roadOf(own);
    const route = async (pins: WayPin[]): Promise<RoadLine & { fellBack?: boolean }> => {
      try {
        const way = await this.router.route(userId, tripId, ANY_DAY, [ends.from, ...pins, ends.to], 'walking', [], {
          costingOptions,
        });
        return roadOf(joinedLine(way.leg.line), way.leg.seg.distance, way.leg.seg.duration);
      } catch {
        // No answer proves nothing: the way is not offered.
        return { ...roadOf([]), fellBack: true };
      }
    };
    const others = otherWaysOf(
      current,
      offers.map((line) => ({ coordinates: line })),
      HIKE_WAY_KEYS.length,
    );
    // One way after another: each check asks the router's one paced queue.
    const kept = await others.reduce<Promise<WayPin[][]>>(async (before, offer) => {
      const held = await before;
      const proof = await pinWay({ offer: roadOf(offer.coordinates), current, route });
      return proof?.held ? [...held, proof.pins] : held;
    }, Promise.resolve([]));
    return { pins: kept, why: null };
  }
}
