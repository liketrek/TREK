import { TripInviteTokens } from '../../db/entities/TripInviteTokens.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { AppConfigModule } from '../app-config/app-config.module';
import { AuditModule } from '../audit/audit.module';
import { DemoModule } from '../common/demo.module';
import { RateLimitModule } from '../common/rate-limit.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { TripInviteLinkController, TripInviteController } from './trip-invite.controller';
import { TripInviteMcp } from './trip-invite.mcp';
import { TripInviteService } from './trip-invite.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

@Module({
  // The last four carry TripInviteMcp: McpSharedModule for the RBAC check the
  // controller does inline, and the three @Global modules it injects out of
  // (DemoModule added Plan 3i Task 4 fix wave — TripInviteMcp injects
  // DemoService), which a graph assembled without AppModule (the e2e harness)
  // must instantiate itself. TripInviteTokens: Plan 4 Task 1 —
  // TripInviteService's own TripInviteTokensRepository, replacing its raw
  // `this.dbs.get/run` statements. Trips: Plan 4 Task 2 — verifyTripAccess's
  // own canAccessTrip delegate, now TripsRepository directly.
  imports: [
    RateLimitModule,
    PermissionsModule,
    AuditModule,
    TripMembershipModule,
    McpSharedModule,
    AppConfigModule,
    RealtimeModule,
    DemoModule,
    MikroOrmModule.forFeature([TripInviteTokens, Trips]),
  ],
  controllers: [TripInviteLinkController, TripInviteController],
  providers: [TripInviteService, TripInviteMcp],
})
export class TripInviteModule {}
