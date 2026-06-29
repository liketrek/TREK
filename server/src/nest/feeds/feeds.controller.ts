import {
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FeedsService } from './feeds.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '../../types';
import { db } from '../../db/database';

// Resolve the public origin used to build feed URLs. APP_URL wins — it is the
// canonical externally-reachable URL behind a reverse proxy. When it is unset
// (the default on a plain `docker run`), fall back to the request's own host so
// the link is still absolute and copy-pasteable as webcal:// instead of a dead
// relative path.
function resolveFeedBase(req: Request): string {
  const configured = (process.env.APP_URL || '').replace(/\/$/, '');
  if (configured) return configured;
  const host = req.get('host');
  return host ? `${req.protocol}://${host}` : '';
}

/**
 * Public subscribable ICS feed endpoints — no auth required.
 * The secret token in the URL acts as the access credential.
 */
@Controller('api/feed')
export class FeedsPublicController {
  constructor(private readonly feeds: FeedsService) {}

  @Get('trip/:token.ics')
  tripFeed(@Param('token') token: string, @Res() res: Response): void {
    const result = this.feeds.buildTripIcs(token);
    if (!result) {
      res.status(404).json({ error: 'Feed not found' });
      return;
    }
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${result.filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.setHeader('X-Published-TTL', 'PT1H');
    res.send(result.ics);
  }

  @Get('user/:token.ics')
  userFeed(@Param('token') token: string, @Res() res: Response): void {
    const result = this.feeds.buildUserIcs(token);
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
 */
@Controller('api/trips/:tripId/feed')
@UseGuards(JwtAuthGuard)
export class TripFeedTokenController {
  constructor(private readonly feeds: FeedsService) {}

  private assertAccess(tripId: string, userId: number): void {
    const row = db
      .prepare(
        'SELECT id FROM trips WHERE id = ? AND (user_id = ? OR id IN (SELECT trip_id FROM trip_members WHERE user_id = ?))',
      )
      .get(tripId, userId, userId);
    if (!row) throw new HttpException({ error: 'Trip not found' }, 404);
  }

  @Get('token')
  get(@CurrentUser() user: User, @Param('tripId') tripId: string, @Req() req: Request) {
    return this.feeds.getTripToken(tripId, user.id, resolveFeedBase(req));
  }

  @Post('token')
  generate(@CurrentUser() user: User, @Param('tripId') tripId: string, @Req() req: Request) {
    this.assertAccess(tripId, user.id);
    return this.feeds.generateTripToken(tripId, user.id, resolveFeedBase(req));
  }

  @Put('token')
  rotate(@CurrentUser() user: User, @Param('tripId') tripId: string, @Req() req: Request) {
    this.assertAccess(tripId, user.id);
    return this.feeds.rotateTripToken(tripId, resolveFeedBase(req));
  }

  @Delete('token')
  disable(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.assertAccess(tripId, user.id);
    this.feeds.disableTripToken(tripId);
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
  get(@CurrentUser() user: User, @Req() req: Request) {
    return this.feeds.getUserToken(user.id, resolveFeedBase(req));
  }

  @Post('token')
  generate(@CurrentUser() user: User, @Req() req: Request) {
    return this.feeds.generateUserToken(user.id, resolveFeedBase(req));
  }

  @Put('token')
  rotate(@CurrentUser() user: User, @Req() req: Request) {
    return this.feeds.rotateUserToken(user.id, resolveFeedBase(req));
  }

  @Delete('token')
  disable(@CurrentUser() user: User) {
    this.feeds.disableUserToken(user.id);
    return { feed_url: null };
  }
}
