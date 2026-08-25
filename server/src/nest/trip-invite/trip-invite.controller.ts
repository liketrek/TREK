import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../../types';
import { TripInviteService } from './trip-invite.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RateLimitService } from '../common/rate-limit.service';
import { TripInviteLinkCreateDto } from './trip-invite.dto';
import { getClientIp } from '../audit/client-ip';
import { AuditService } from '../audit/audit.service';

const RL_WINDOW = 15 * 60 * 1000;

/**
 * /api/trips/:tripId/invite-link — manage a trip's invite link (#1143).
 *
 * Mirrors the public share link: trip access (404) + the 'share_manage'
 * permission (403). Unlike the share link this one is not public — see
 * TripInviteController for the login-required join.
 */
@Controller('api/trips/:tripId/invite-link')
@UseGuards(JwtAuthGuard)
export class TripInviteLinkController {
  constructor(private readonly invites: TripInviteService, private readonly audit: AuditService) {}

  private requireManage(tripId: string, user: User) {
    const trip = this.invites.verifyTripAccess(tripId, user.id);
    if (!trip) throw new HttpException({ error: 'Trip not found' }, 404);
    if (!this.invites.canManage(trip, user)) throw new HttpException({ error: 'No permission' }, 403);
  }

  @Get()
  get(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    // The token grants trip membership, so reading it needs the same
    // share_manage permission as creating/rotating it — not just trip access.
    this.requireManage(tripId, user);
    const info = this.invites.get(tripId);
    return info ? info : { token: null };
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: TripInviteLinkCreateDto,
    @Req() req: Request,
  ) {
    this.requireManage(tripId, user);
    const days = body?.expires_in_days != null && String(body.expires_in_days).trim() !== ''
      ? Number.parseInt(String(body.expires_in_days))
      : null;
    const info = this.invites.createOrRotate(tripId, user.id, Number.isFinite(days as number) ? days : null);
    this.audit.writeAudit({ userId: user.id, action: 'trip.invite_link_create', resource: tripId, ip: getClientIp(req), details: { expires_in_days: days } });
    return info;
  }

  @Delete()
  remove(@CurrentUser() user: User, @Param('tripId') tripId: string, @Req() req: Request) {
    this.requireManage(tripId, user);
    this.invites.remove(tripId);
    this.audit.writeAudit({ userId: user.id, action: 'trip.invite_link_delete', resource: tripId, ip: getClientIp(req) });
    return { success: true };
  }
}

/**
 * /api/trip-invites/:token — resolve + accept a trip invite as an existing,
 * logged-in user. JWT-guarded: an anonymous visitor is redirected to /login by
 * the client (never registration). Rate-limited to blunt any token probing even
 * though the tokens are 192-bit and unguessable. The join is idempotent and
 * owner-safe (see joinTripAsMember).
 */
@Controller('api/trip-invites')
@UseGuards(JwtAuthGuard)
export class TripInviteController {
  constructor(private readonly invites: TripInviteService, private readonly rl: RateLimitService, private readonly audit: AuditService) {}

  private limit(req: Request, max: number): void {
    if (!this.rl.check('trip_invite', req.ip || 'unknown', max, RL_WINDOW, Date.now())) {
      throw new HttpException({ error: 'Too many attempts. Please try again later.' }, 429);
    }
  }

  @Get(':token')
  preview(@Param('token') token: string, @Req() req: Request) {
    this.limit(req, 30);
    const resolved = this.invites.resolve(token);
    if (!resolved) throw new HttpException({ error: 'Invalid or expired invite link' }, 404);
    return { trip_id: resolved.trip_id, title: resolved.title };
  }

  @Post(':token/accept')
  @HttpCode(200)
  accept(@CurrentUser() user: User, @Param('token') token: string, @Req() req: Request) {
    this.limit(req, 20);
    const resolved = this.invites.resolve(token);
    if (!resolved) throw new HttpException({ error: 'Invalid or expired invite link' }, 404);
    const result = this.invites.join(resolved.trip_id, user.id);
    this.audit.writeAudit({ userId: user.id, action: 'trip.invite_link_join', resource: String(resolved.trip_id), ip: getClientIp(req), details: { joined: result.joined } });
    return { trip_id: resolved.trip_id, joined: result.joined };
  }
}
