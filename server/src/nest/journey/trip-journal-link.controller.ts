import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { TripJournalCandidatesQueryDto, TripJournalLinkDto, TripJournalLinkMembersDto } from './trip-journal-link.dto';
import { TripJournalLinkService } from './trip-journal-link.service';
import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Patch, Put, Query, UseGuards } from '@nestjs/common';
import { tripJournalCandidatesResponseSchema, tripJournalLinkResponseSchema } from '@trek/shared';

/**
 * The journal a trip shows, at `/api/trips/:tripId/journal`. Every member of
 * the trip may read the link as it concerns them; changing it is decided in the
 * service, because it turns on who owns the journal as well as on the trip
 * permission. Behind the Journey addon: with it off the routes answer 404.
 */
@Controller('api/trips/:tripId/journal')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.JOURNEY, 'Journey')
export class TripJournalLinkController {
  constructor(private readonly links: TripJournalLinkService) {}

  @Get()
  @ResponseContract(tripJournalLinkResponseSchema)
  async get(@Param('tripId') tripId: string, @CurrentUser() user: User) {
    return this.links.get(Number(tripId), user);
  }

  @Get('candidates')
  @ResponseContract(tripJournalCandidatesResponseSchema)
  async candidates(
    @Param('tripId') tripId: string,
    @CurrentUser() user: User,
    @Query() query: TripJournalCandidatesQueryDto,
  ) {
    return { candidates: await this.links.candidates(Number(tripId), user, query.journey_id) };
  }

  @Put()
  @ResponseContract(tripJournalLinkResponseSchema)
  async link(
    @Param('tripId') tripId: string,
    @CurrentUser() user: User,
    @Body() body: TripJournalLinkDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return this.links.link(Number(tripId), user, body.journey_id, body.members, socketId);
  }

  @Patch('members')
  @ResponseContract(tripJournalLinkResponseSchema)
  async setMembers(
    @Param('tripId') tripId: string,
    @CurrentUser() user: User,
    @Body() body: TripJournalLinkMembersDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    return this.links.setMembers(Number(tripId), user, body.members, socketId);
  }

  @Delete()
  @HttpCode(200)
  @ResponseContract(tripJournalLinkResponseSchema)
  async unlink(@Param('tripId') tripId: string, @CurrentUser() user: User, @Headers('x-socket-id') socketId?: string) {
    return this.links.unlink(Number(tripId), user, socketId);
  }
}
