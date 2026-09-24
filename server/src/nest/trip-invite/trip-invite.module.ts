import { RateLimitModule } from '../common/rate-limit.module';
import { Module } from '@nestjs/common';
import { TripInviteLinkController, TripInviteController } from './trip-invite.controller';
import { TripInviteService } from './trip-invite.service';
import { TripInviteMcp } from './trip-invite.mcp';
import { AppConfigModule } from '../app-config/app-config.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AuditModule } from '../audit/audit.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';

@Module({
  // The last three carry TripInviteMcp: McpSharedModule for the RBAC check the
  // controller does inline, and the two @Global modules it injects out of,
  // which a graph assembled without AppModule (the e2e harness) must
  // instantiate itself.
  imports: [RateLimitModule, PermissionsModule, AuditModule, TripMembershipModule, McpSharedModule, AppConfigModule, RealtimeModule],
  controllers: [TripInviteLinkController, TripInviteController],
  providers: [TripInviteService, TripInviteMcp],
})
export class TripInviteModule {}
