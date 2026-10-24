import { logWarn } from '../audit/audit-log.logger';
import { RoadtripRouterService } from '../roadtrip/roadtrip-router.service';
import { footWayOf, type FootWay } from './city-walk-briefing.helpers';
import { Injectable } from '@nestjs/common';

/**
 * The day the router is asked for. A way on foot does not depend on the day:
 * the router only keys its cache by one and hands it to a routing plugin,
 * which a walk on foot never asks.
 */
const ANY_DAY = 0;

/**
 * CW-11, MCP-T02: the way on foot through the points of a city walk, planned
 * by the router the road trip uses (the traveller's own routing server where
 * they set one). The proposal of a new walk, its creation and a prepared
 * change to a saved walk all ask here, so their distances and times come from
 * one source. Where the router gives no way, the answer says why instead of
 * guessing one; a way that crosses by boat is none on foot (CW-12).
 */
@Injectable()
export class CityWalkFootWayService {
  constructor(private readonly router: RoadtripRouterService) {}

  /** The way on foot through the points in their order, or why there is none. */
  async plan(userId: number, tripId: number, points: ReadonlyArray<{ lat: number; lng: number }>): Promise<FootWay> {
    if (points.length < 2) return { kind: 'unrouted', why: 'nothing_to_route', position: null };
    const asked = points.map(({ lat, lng }) => ({ lat, lng }));
    try {
      return footWayOf(await this.router.route(userId, tripId, ANY_DAY, asked, 'walking', [], { footOnly: true }));
    } catch (err: unknown) {
      logWarn(`[CityWalk] no way on foot for trip ${tripId}: ${err instanceof Error ? err.message : String(err)}`);
      return { kind: 'unrouted', why: 'router_unavailable', position: null };
    }
  }
}
