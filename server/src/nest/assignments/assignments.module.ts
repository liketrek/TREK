import { AuthModule } from '../auth/auth.module';
import { DaysModule } from '../days/days.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AssignmentsDomainModule } from './assignments-domain.module';
import { DayAssignmentsController, AssignmentOpsController } from './assignments.controller';
import { AssignmentsMcp } from './assignments.mcp';
import { ItineraryRpc } from './itinerary.rpc';
import { Module } from '@nestjs/common';

/**
 * Assignments domain (S7 — Phase 2 trip sub-domain). The day-assignments mount
 * sits under the /api/trips/:tripId/days prefix (S6); the per-assignment ops use
 * the /api/trips/:tripId/assignments prefix. AssignmentsService lives in
 * AssignmentsDomainModule (re-exported here for ReservationsModule and the
 * plugin RPC surface) so PlacesModule can reach it without closing the
 * DaysModule → PlacesModule → AssignmentsModule loop this module is on.
 */
@Module({
  // DaysModule: AssignmentsMcp injects DaysService for the target-day checks.
  // PermissionsModule: the controllers' TripAccessGuard injects PermissionsService.
  imports: [
    McpSharedModule,
    AssignmentsDomainModule,
    DaysModule,
    PermissionsModule,
    AuthModule,
    RealtimeModule,
    PluginGuardsModule,
  ],
  controllers: [DayAssignmentsController, AssignmentOpsController],
  providers: [AssignmentsMcp, ItineraryRpc],
  exports: [AssignmentsDomainModule],
})
export class AssignmentsModule {}
