import { AuditModule } from '../audit/audit.module';
import { RateLimitModule } from '../common/rate-limit.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { TripInviteLinkController, TripInviteController } from './trip-invite.controller';
import { TripInviteService } from './trip-invite.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [RateLimitModule, PermissionsModule, AuditModule, TripMembershipModule],
  controllers: [TripInviteLinkController, TripInviteController],
  providers: [TripInviteService],
})
export class TripInviteModule {}
