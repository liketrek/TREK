import {
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { FeedsService } from './feeds.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '../../types';
import { db } from '../../db/database';

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
 * Authenticated token management — generate / regenerate feed tokens.
 */
@Controller('api/trips/:tripId/feed')
@UseGuards(JwtAuthGuard)
export class TripFeedTokenController {
  constructor(private readonly feeds: FeedsService) {}

  @Get('token')
  get(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    const result = this.feeds.getTripToken(tripId, user.id);
    return result ?? { feed_url: null };
  }

  @Post('token')
  generate(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    const row = db
      .prepare('SELECT id FROM trips WHERE id = ? AND (user_id = ? OR id IN (SELECT trip_id FROM trip_members WHERE user_id = ?))')
      .get(tripId, user.id, user.id);
    if (!row) throw new HttpException({ error: 'Trip not found' }, 404);
    return this.feeds.generateTripToken(tripId, user.id);
  }

  @Delete('token')
  regenerate(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    const row = db
      .prepare('SELECT id FROM trips WHERE id = ? AND (user_id = ? OR id IN (SELECT trip_id FROM trip_members WHERE user_id = ?))')
      .get(tripId, user.id, user.id);
    if (!row) throw new HttpException({ error: 'Trip not found' }, 404);
    return this.feeds.regenerateTripToken(tripId, user.id);
  }
}

@Controller('api/feed/user')
@UseGuards(JwtAuthGuard)
export class UserFeedTokenController {
  constructor(private readonly feeds: FeedsService) {}

  @Get('token')
  get(@CurrentUser() user: User) {
    return this.feeds.getUserToken(user.id) ?? { feed_url: null };
  }

  @Post('token')
  generate(@CurrentUser() user: User) {
    return this.feeds.generateUserToken(user.id);
  }

  @Delete('token')
  regenerate(@CurrentUser() user: User) {
    return this.feeds.regenerateUserToken(user.id);
  }
}
