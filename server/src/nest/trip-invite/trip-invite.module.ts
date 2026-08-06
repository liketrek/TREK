import { RateLimitModule } from '../common/rate-limit.module';
import { Module } from '@nestjs/common';
import { TripInviteLinkController, TripInviteController } from './trip-invite.controller';
import { TripInviteService } from './trip-invite.service';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [RateLimitModule, PermissionsModule, AuditModule],
  controllers: [TripInviteLinkController, TripInviteController],
  providers: [TripInviteService],
})
export class TripInviteModule {}
