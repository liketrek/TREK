import { Controller, Get, HttpException, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  PUBLIC_API_INCLUDES,
  publicApiIncludeQuerySchema,
  type PublicApiBucketList,
  type PublicApiInclude,
  type PublicApiTrip,
  type PublicApiTripList,
} from '@trek/shared';
import { ApiTokenGuard } from './api-token.guard';
import { PublicApiService } from './public-api.service';
import { enforcePublicApiRateLimit, requireUserId } from './public-api-request';
import { RateLimitService } from '../common/rate-limit.service';

/**
 * `/api/v1` — the versioned, read-only surface for third-party integrations.
 *
 * Everything else under `/api` is internal: it answers a session cookie, carries no
 * version, and is free to change with the client. This prefix is the opposite
 * promise, and the version in the path is what makes that promise keepable — a
 * breaking change ships as `/api/v2` rather than as an edit here.
 *
 * The surface is deliberately small. Two read endpoints are enough for the
 * integrations asking for one (a location tracker enriching its own trips), and a
 * small contract is one that can actually be honoured. Write access is not a
 * missing feature: it would need scope enforcement this surface does not implement
 * yet, and a token that reads everything is a very different thing from one that
 * can also delete a trip.
 *
 * Rate limited per caller rather than per IP — the budget lives in
 * `public-api-request.ts`, because the stats route enforces the same one from
 * `atlas/`.
 */
@Controller('api/v1')
@UseGuards(ApiTokenGuard)
export class PublicApiController {
  constructor(
    private readonly api: PublicApiService,
    private readonly rl: RateLimitService,
  ) {}

  private limit(req: Request): void {
    enforcePublicApiRateLimit(this.rl, req);
  }

  /** Every trip the token's owner can reach, without itineraries. */
  @Get('trips')
  listTrips(@Req() req: Request): PublicApiTripList {
    this.limit(req);
    return { trips: this.api.listTrips(requireUserId(req)) };
  }

  /**
   * The caller's bucket list: places they want to reach, with no trip attached.
   *
   * Its own endpoint rather than an `include`, because it hangs off the user and
   * not off any trip. For a consumer that knows where someone has actually been,
   * this is the one list in TREK it can answer questions about.
   */
  @Get('bucket-list')
  listBucketList(@Req() req: Request): PublicApiBucketList {
    this.limit(req);
    return { items: this.api.listBucketList(requireUserId(req)) };
  }

  /**
   * One trip, with the sections named in `?include=`.
   *
   * A trip the caller may not read answers 404, identical to one that does not
   * exist. That is the point: a 403 would confirm the id is real, which turns the
   * endpoint into a way to count someone else's trips.
   */
  @Get('trips/:id')
  getTrip(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('include') include?: string,
  ): PublicApiTrip {
    this.limit(req);
    const tripId = parseTripId(id);
    const trip = this.api.getTrip(tripId, requireUserId(req), parseInclude(include));
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    return trip;
  }
}

/**
 * Trip ids are integers. Anything else is rejected before it reaches a query —
 * `parseInt` would happily turn "12abc" into 12, and a route that quietly accepts
 * a mangled id is a route whose logs stop matching reality.
 */
function parseTripId(raw: string): number {
  if (!/^\d+$/.test(raw)) {
    throw new HttpException({ error: 'Invalid trip id' }, 400);
  }
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new HttpException({ error: 'Invalid trip id' }, 400);
  }
  return id;
}

/**
 * `?include=days,notes`. Absent means everything, because a full sync is the common
 * case and a caller that wants less says so.
 *
 * An unknown section is a 400 rather than being ignored: silently dropping a typo
 * would hand the caller a payload that is missing exactly what they asked for, and
 * they would debug their own code for it.
 *
 * `places`, `notes` and `reservations` are reported on days, so asking for one of
 * them brings `days` along; the service handles that rather than this parser, so
 * the echo of what the caller asked for stays honest.
 */
function parseInclude(raw?: string): PublicApiInclude[] {
  if (raw === undefined || raw.trim() === '') return [...PUBLIC_API_INCLUDES];
  const parsed = publicApiIncludeQuerySchema.safeParse(raw);
  if (!parsed.success) {
    throw new HttpException(
      { error: `include must be a comma-separated list of: ${PUBLIC_API_INCLUDES.join(', ')}` },
      400,
    );
  }
  return parsed.data;
}
