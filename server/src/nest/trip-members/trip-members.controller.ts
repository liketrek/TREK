import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../../types';
import { TripMembersService } from './trip-members.service';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { RequireTripOwner, TripOwnerGuard } from '../permissions/trip-owner.guard';
import { getClientIp } from '../audit/client-ip';
import { AuditService } from '../audit/audit.service';
import { NotFoundError, ValidationError } from '../common/domain-errors';
import { toRowId } from '../common/row-id';
import { TripAddMemberDto, TripTransferOwnershipDto, TripCreateGuestDto, TripRenameGuestDto } from '../trips/trips.dto';

/**
 * /api/trips/:id/{members,transfer,guests} — who is on a trip.
 *
 * Same prefix as TripsController but a separate class in a separate module:
 * every route here is at least one segment deeper than the @Get(':id') it sits
 * beside, so there is no ambiguity, and TripInviteLinkController has served
 * /api/trips/:tripId/invite-link from its own module for as long.
 *
 * No class-level TripAccessGuard on purpose. Guards run before pipes, so one
 * here would answer the trip 404 before the body pipe could answer its 400, and
 * the e2e cases pin that order. The inline canAccessTrip checks are the ones
 * that moved, unchanged.
 *
 * The four owner-only routes are the exception: they carry TripOwnerGuard, which
 * replaces the hand-written `access.user_id !== user.id` each of them had. Their
 * bodies are ids and names, so the 400-before-404 ordering does not arise —
 * transfer is the one with a DTO, and its own e2e asserts the 404 first.
 */
@Controller('api/trips')
@UseGuards(JwtAuthGuard)
export class TripMembersController {
  constructor(private readonly roster: TripMembersService, private readonly audit: AuditService) {}

  @Get(':id/members')
  async members(@CurrentUser() user: User, @Param('id') id: string) {
    const access = await this.roster.canAccessTrip(id, user.id);
    if (!access) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    const { owner, members } = await this.roster.listMembers(id, access.user_id);
    return { owner, members, current_user_id: user.id };
  }

  @Post(':id/members')
  @HttpCode(201)
  async addMember(@CurrentUser() user: User, @Param('id') id: string, @Body() body: TripAddMemberDto) {
    const { identifier } = body;
    const access = await this.roster.canAccessTrip(id, user.id);
    if (!access) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    if (!(await this.roster.can('member_manage', user.role, access.user_id, user.id, access.user_id !== user.id))) {
      throw new HttpException({ error: 'No permission to manage members' }, 403);
    }
    try {
      const result = await this.roster.addMember(id, identifier, access.user_id, user.id);
      this.roster.notifyInvite(id, user, result.targetUserId, result.tripTitle, result.member.email);
      return { member: result.member };
    } catch (e: unknown) {
      if (e instanceof NotFoundError) throw new HttpException({ error: e.message }, 404);
      if (e instanceof ValidationError) throw new HttpException({ error: e.message }, 400);
      throw e;
    }
  }

  @Delete(':id/members/:userId')
  async removeMember(@CurrentUser() user: User, @Param('id') id: string, @Param('userId') userId: string) {
    // Plan 4 Task 8a — parsed ONCE here (toRowId, not Number(): rule 15's
    // NaN-into-SQL trap), and the parsed number is what both the access
    // check and the removal itself use below — this route has no class-level
    // TripAccessGuard (this controller's own docstring explains why), so it
    // owns this parse itself rather than inheriting the guard's.
    const tripId = toRowId(id);
    if (tripId === null) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    const access = await this.roster.canAccessTrip(tripId, user.id);
    if (!access) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    const targetId = Number.parseInt(userId);
    if (targetId !== user.id && !(await this.roster.can('member_manage', user.role, access.user_id, user.id, access.user_id !== user.id))) {
      throw new HttpException({ error: 'No permission to remove members' }, 403);
    }
    await this.roster.removeMember(tripId, targetId);
    return { success: true };
  }

  @Post(':id/transfer')
  @UseGuards(TripOwnerGuard)
  @RequireTripOwner('Only the owner can transfer ownership', { param: 'id' })
  async transferOwnership(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: TripTransferOwnershipDto,
    @Req() req: Request,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const { newOwnerId } = body;
    try {
      const result = await this.roster.transferOwnership(id, newOwnerId, user.id);
      await this.audit.writeAudit({ userId: user.id, action: 'trip.transfer_ownership', ip: getClientIp(req), details: { tripId: Number(id), trip: result.tripTitle, from: result.fromEmail, to: result.toEmail } });
      // Nudge everyone viewing the trip to re-read it so the new ownership and the
      // recomputed permissions take effect live.
      const updatedTrip = await this.roster.getTripForViewer(id, user.id);
      this.roster.broadcast(id, 'trip:updated', { trip: updatedTrip }, socketId);
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof NotFoundError) throw new HttpException({ error: e.message }, 404);
      if (e instanceof ValidationError) throw new HttpException({ error: e.message }, 400);
      throw e;
    }
  }

  @Post(':id/guests')
  @HttpCode(201)
  @UseGuards(TripOwnerGuard)
  @RequireTripOwner('Only the owner can manage guests', { param: 'id' })
  async createGuest(@CurrentUser() user: User, @Param('id') id: string, @Body() body: TripCreateGuestDto) {
    // Whitespace-only names still 400 with the legacy body — the service throws
    // ValidationError('Guest name is required') after trimming.
    try {
      // No notifyInvite: a guest has no inbox.
      return await this.roster.createGuest(id, body.name, user.id);
    } catch (e: unknown) {
      if (e instanceof ValidationError) throw new HttpException({ error: e.message }, 400);
      throw e;
    }
  }

  @Put(':id/guests/:userId')
  @UseGuards(TripOwnerGuard)
  @RequireTripOwner('Only the owner can manage guests', { param: 'id' })
  async renameGuest(@CurrentUser() user: User, @Param('id') id: string, @Param('userId') userId: string, @Body() body: TripRenameGuestDto) {
    try {
      if (!(await this.roster.renameGuest(id, Number.parseInt(userId), body.name))) {
        throw new HttpException({ error: 'Guest not found' }, 404);
      }
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof HttpException) throw e;
      if (e instanceof ValidationError) throw new HttpException({ error: e.message }, 400);
      throw e;
    }
  }

  @Delete(':id/guests/:userId')
  @UseGuards(TripOwnerGuard)
  @RequireTripOwner('Only the owner can manage guests', { param: 'id' })
  async deleteGuest(@CurrentUser() user: User, @Param('id') id: string, @Param('userId') userId: string) {
    if (!(await this.roster.deleteGuest(id, Number.parseInt(userId)))) {
      throw new HttpException({ error: 'Guest not found' }, 404);
    }
    return { success: true };
  }
}
