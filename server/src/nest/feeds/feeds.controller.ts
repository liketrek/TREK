import { readEnv } from '../../app-config';
import type { TripAccess } from '../../db/repositories/Trips.repository';
import type { User } from '../../types';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { Public } from '../auth-core/public.decorator';
import { contentDisposition } from '../common/content-disposition';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { Trip } from '../permissions/trip.decorator';
import { FeedsService } from './feeds.service';
import { Controller, Delete, Get, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';

import type { Request, Response } from 'express';

// Resolve the public origin used to build feed URLs. APP_URL wins — it is the
// canonical externally-reachable URL behind a reverse proxy. When it is unset
// (the default on a plain `docker run`), fall back to the request's own host so
// the link is still absolute and copy-pasteable as webcal:// instead of a dead
// relative path.
function resolveFeedBase(req: Request): string {
  // Single trailing slash stripped on purpose (legacy parity; notifications strips all).
  const configured = (readEnv().app.appUrl || '').replace(/\/$/, '');
  if (configured) return configured;
  const host = req.get('host');
  return host ? `${req.protocol}://${host}` : '';
}

/**
 * Public subscribable ICS feed endpoints — no auth required.
 * The secret token in the URL acts as the access credential.
 */
@Controller('api/feed')
@Public('the secret token in the feed URL is the credential; calendar clients never send a session')
export class FeedsPublicController {
  constructor(private readonly feeds: FeedsService) {}

  @Get('trip/:token.ics')
  async tripFeed(@Param('token') token: string, @Res() res: Response): Promise<void> {
    const result = await this.feeds.buildTripIcs(token);
    if (!result) {
      res.status(404).json({ error: 'Feed not found' });
      return;
    }
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', contentDisposition(result.filename, 'inline'));
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.setHeader('X-Published-TTL', 'PT1H');
    res.send(result.ics);
  }

  @Get('user/:token.ics')
  async userFeed(@Param('token') token: string, @Res() res: Response): Promise<void> {
    const result = await this.feeds.buildUserIcs(token);
    if (!result) {
      res.status(404).json({ error: 'Feed not found' });
      return;
    }
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="all-trips.ics"`);
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.setHeader('X-Published-TTL', 'PT1H');
    res.send(result.ics);
  }
}

/**
 * Authenticated token management for a single trip's feed.
 *   POST   = enable (mint a token, idempotent)
 *   PUT    = rotate (new token, invalidates the old URL)
 *   DELETE = disable (clear the token, public URL stops resolving)
 *
 * All four need `share_manage`, not merely trip access. The token is the only
 * credential the anonymous /api/feed/trip/:token.ics route asks for, so handing
 * it out is handing out the trip, and rotating it cancels every subscription the
 * owner and the other members already set up. Reading is gated for the same
 * reason as writing: GET returns the credential itself, not its status. Same
 * call the invite link makes (trip-invite.controller.ts), and the default policy
 * keeps `share_manage` with the owner while an instance may lower it to
 * trip_member.
 */
@Controller('api/trips/:tripId/feed')
@UseGuards(JwtAuthGuard, TripAccessGuard)
@RequirePermission('share_manage')
export class TripFeedTokenController {
  constructor(private readonly feeds: FeedsService) {}

  // `@Trip()` hands back `TripAccessGuard`'s already-resolved, already-numeric
  // trip id (rule 21: the id is parsed once, at the gate, by the guard's own
  // `Number(tripId)` + `findAccessible` — every handler below reuses that
  // value rather than re-parsing `:tripId` itself). `@RequirePermission
  // ('share_manage')` on the whole controller means the trip is already
  // access-checked AND permission-checked before any of these run.

  @Get('token')
  async get(@CurrentUser() user: User, @Trip() trip: TripAccess, @Req() req: Request) {
    return await this.feeds.getTripToken(trip.id, user.id, resolveFeedBase(req));
  }

  @Post('token')
  async generate(@CurrentUser() user: User, @Trip() trip: TripAccess, @Req() req: Request) {
    return await this.feeds.generateTripToken(trip.id, user.id, resolveFeedBase(req));
  }

  @Put('token')
  async rotate(@CurrentUser() user: User, @Trip() trip: TripAccess, @Req() req: Request) {
    return await this.feeds.rotateTripToken(trip.id, user.id, resolveFeedBase(req));
  }

  @Delete('token')
  async disable(@CurrentUser() user: User, @Trip() trip: TripAccess) {
    await this.feeds.disableTripToken(trip.id, user.id);
    return { feed_url: null };
  }
}

/**
 * Authenticated token management for the all-trips (per-user) feed.
 *   POST   = enable   PUT = rotate   DELETE = disable
 */
@Controller('api/feed/user')
@UseGuards(JwtAuthGuard)
export class UserFeedTokenController {
  constructor(private readonly feeds: FeedsService) {}

  @Get('token')
  async get(@CurrentUser() user: User, @Req() req: Request) {
    return await this.feeds.getUserToken(user.id, resolveFeedBase(req));
  }

  @Post('token')
  async generate(@CurrentUser() user: User, @Req() req: Request) {
    return await this.feeds.generateUserToken(user.id, resolveFeedBase(req));
  }

  @Put('token')
  async rotate(@CurrentUser() user: User, @Req() req: Request) {
    return await this.feeds.rotateUserToken(user.id, resolveFeedBase(req));
  }

  @Delete('token')
  async disable(@CurrentUser() user: User) {
    await this.feeds.disableUserToken(user.id);
    return { feed_url: null };
  }
}
