import type { User } from '../../types';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { MailIngestInboxService } from './mail-ingest-inbox.service';
import { Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import {
  mailIngestAddressResponseSchema,
  successResponseSchema,
  type MailIngestAddressResponse,
  type SuccessResponse,
} from '@trek/shared';

/**
 * `/api/trips/:tripId/mail-ingest/address`: the address a member keeps for
 * one trip, so a mail sent there needs no trip to be picked. Only a member
 * who may add bookings to the trip has one, and it is theirs alone: another
 * member reading it sees their own or none. It stops taking mail when its
 * owner can no longer add bookings, which the import checks on every mail.
 */
@Controller('api/trips/:tripId/mail-ingest/address')
@UseGuards(JwtAuthGuard, TripAccessGuard)
@RequirePermission('reservation_edit')
export class MailIngestTripController {
  constructor(private readonly inbox: MailIngestInboxService) {}

  @Get()
  @ResponseContract(mailIngestAddressResponseSchema)
  get(@CurrentUser() user: User, @Param('tripId') tripId: string): Promise<MailIngestAddressResponse> {
    return this.inbox.tripAddress(user.id, Number(tripId));
  }

  /** Makes the person's address for the trip, or a new one in place of the old, which stops at once. */
  @Post()
  @HttpCode(200)
  @ResponseContract(mailIngestAddressResponseSchema)
  renew(@CurrentUser() user: User, @Param('tripId') tripId: string): Promise<MailIngestAddressResponse> {
    return this.inbox.renewTripAddress(user.id, Number(tripId));
  }

  @Delete()
  @HttpCode(200)
  @ResponseContract(successResponseSchema)
  async revoke(@CurrentUser() user: User, @Param('tripId') tripId: string): Promise<SuccessResponse> {
    await this.inbox.revokeTripAddress(user.id, Number(tripId));
    return { success: true };
  }
}
