import { Tours } from '../../db/entities/Tours.entity';
import type { ToursRepository } from '../../db/repositories/Tours.repository';
import { logWarn } from '../audit/audit-log.logger';
import { DomainError, notFound } from '../common/domain-error';
import { PaddleRoutingService } from '../paddle-routing/paddle-routing.service';
import { RoadtripRouterService } from '../roadtrip/roadtrip-router.service';
import { SkiRoutingService } from '../ski-routing/ski-routing.service';
import { hikeWaypointsOf } from './hike-plan.helpers';
import { HikePlanService, type HikeCreated } from './hike-plan.service';
import { heightsOrNone, joinedLine } from './hike-routing.helpers';
import {
  legsOf,
  paddleCommandOf,
  paddleMarksOf,
  skiCommandOf,
  skiLineOf,
  type SportPlanned,
} from './sport-tour-create.helpers';
import { checkedRequest } from './tour-plan.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  paddleRouteRequestSchema,
  paddleTourCreateRequestSchema,
  skiRouteRequestSchema,
  skiTourCreateRequestSchema,
  type GeometryPoint,
  type HikeRouteOutcome,
  type PaddleTourCreateRequest,
  type SkiTourCreateRequest,
} from '@trek/shared';

/** A leg the router could not plan: the tour is refused, as a 422 the tools answer with its text. */
function legRefused(index: number, code: string, where: string): DomainError {
  return new DomainError(
    422,
    `Leg ${index + 1} could not be planned ${where} (${code}): move its points or plan it again. Nothing was saved.`,
    { code: 'tour_not_routed' },
  );
}

function reasonOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * A paddle tour or a ski tour the assistant planned (plan_paddle_route,
 * plan_ski_route) saved once the traveller said yes, the way the planner's
 * save writes one. Its legs run from each point to the next and are planned
 * again by the same router, on the water or on the piste data; a leg that
 * cannot be planned refuses the tour and nothing is saved. The legs are
 * joined into one line with the height of every point (the piste data's
 * where it has them all, else Valhalla's, as for a hike); where the heights
 * cannot be read the tour is saved with its points only (route_pending), and
 * the planner plans it when it is opened. A paddle tour is timed with the
 * planner's estimate (water at the paddling speed, each portage the router
 * carries round at the carrying speed), a ski tour with the piste router's
 * time. With a day it is put on that day in the same write (HikePlanService's
 * save, so a tour of any type lands on its day alike).
 */
@Injectable()
export class SportTourCreateService {
  constructor(
    private readonly paddle: PaddleRoutingService,
    private readonly ski: SkiRoutingService,
    private readonly router: RoadtripRouterService,
    private readonly hikes: HikePlanService,
    @InjectRepository(Tours) private readonly toursRepo: ToursRepository,
  ) {}

  async createPaddle(userId: number, tripId: number, request: PaddleTourCreateRequest): Promise<HikeCreated> {
    const asked = checkedRequest<PaddleTourCreateRequest>(paddleTourCreateRequestSchema, request);
    const dayId = await this.dayOf(tripId, asked.day_id);
    const planned = await this.paddle.route(
      paddleRouteRequestSchema.parse({
        legs: legsOf(asked.waypoints),
        boat: asked.boat_type ?? 'kayak',
        lake_style: asked.lake_style,
        lock_policy: asked.lock_policy,
      }),
    );
    const legs = planned.legs.map((leg, index) => {
      if (leg.status === 'failed') throw legRefused(index, leg.code, 'on the water');
      return leg;
    });
    const flat = joinedLine(legs.flatMap((leg) => leg.geometry.map(([lat, lng]): [number, number] => [lat, lng])));
    const line = await this.withHeights(userId, flat);
    const saved = this.planned(line, paddleMarksOf(legs));
    return await this.save(
      tripId,
      paddleCommandOf(asked, hikeWaypointsOf(asked.waypoints), saved),
      dayId,
      asked,
      saved,
    );
  }

  async createSki(userId: number, tripId: number, request: SkiTourCreateRequest): Promise<HikeCreated> {
    const asked = checkedRequest<SkiTourCreateRequest>(skiTourCreateRequestSchema, request);
    const dayId = await this.dayOf(tripId, asked.day_id);
    const planned = await this.ski.route(
      skiRouteRequestSchema.parse({
        legs: legsOf(asked.waypoints),
        discipline: asked.discipline,
        technique: asked.discipline === 'cross_country' ? (asked.technique ?? null) : null,
        options: asked.options ?? {},
      }),
    );
    const legs = planned.legs.map((leg, index) => {
      if (leg.status === 'failed') throw legRefused(index, leg.code, 'on the piste data');
      return leg;
    });
    const { line, seconds } = skiLineOf(legs);
    // The piste data's heights where it has one for every point, else Valhalla's, as the planner reads them.
    const measured = line.every((point) => point.length === 3)
      ? line
      : await this.withHeights(
          userId,
          line.map(([lat, lng]): [number, number] => [lat, lng]),
        );
    const saved = this.planned(measured, null);
    const command = skiCommandOf(asked, hikeWaypointsOf(asked.waypoints), saved, {
      build: planned.build,
      seconds,
      legs: legs.length,
    });
    return await this.save(tripId, command, dayId, asked, saved);
  }

  /** The joined line as it is kept: whole with its heights, or none where a height is missing. */
  private planned(line: GeometryPoint[], marks: SportPlanned['marks']): SportPlanned {
    const heights = line.length >= 2 && line.every((point) => point.length === 3);
    return { line: heights ? line : null, marks };
  }

  /** The line with the height of every point, or as it was where the heights could not all be read. */
  private async withHeights(userId: number, flat: Array<[number, number]>): Promise<GeometryPoint[]> {
    try {
      return heightsOrNone(flat, await this.router.heights(userId, flat));
    } catch (err: unknown) {
      logWarn(`[SportTour] no heights: ${reasonOf(err)}`);
      return heightsOrNone(flat, null);
    }
  }

  /** The trip's day a tour is put on; a day of another trip is not found. */
  private async dayOf(tripId: number, dayId: number | undefined): Promise<number | null> {
    if (dayId === undefined) return null;
    const day = await this.toursRepo.dayOfTrip(tripId, dayId);
    if (!day) throw notFound('Day not found');
    return day.id;
  }

  private async save(
    tripId: number,
    command: Parameters<HikePlanService['saveOnDay']>[1],
    dayId: number | null,
    asked: { start_time?: string },
    saved: SportPlanned,
  ): Promise<HikeCreated> {
    // Without its heights the tour waits for its way, as a hike does when the router did not answer.
    const route: HikeRouteOutcome = saved.line
      ? { planned: true }
      : { planned: false, why: 'router_unavailable', position: null };
    return await this.hikes.saveOnDay(tripId, command, dayId, asked.start_time, route);
  }
}
