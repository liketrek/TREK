import { RateLimitModule } from '../common/rate-limit.module';
import { Module } from '@nestjs/common';
import { TripInviteLinkController, TripInviteController } from './trip-invite.controller';
import { TripInviteService } from './trip-invite.service';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditModule } from '../audit/audit.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';

@Module({
  imports: [RateLimitModule, PermissionsModule, AuditModule, TripMembershipModule],
  controllers: [TripInviteLinkController, TripInviteController],
  providers: [TripInviteService],
})
export class TripInviteModule {}
