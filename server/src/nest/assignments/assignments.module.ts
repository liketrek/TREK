import { Module } from '@nestjs/common';
import { DaysModule } from '../days/days.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { QueryHelpersModule } from '../query-helpers/query-helpers.module';
import { DayAssignmentsController, AssignmentOpsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { AssignmentsMcp } from './assignments.mcp';
import { AuthModule } from '../auth/auth.module';

/**
 * Assignments domain (S7 — Phase 2 trip sub-domain). The day-assignments mount
 * sits under the /api/trips/:tripId/days prefix (S6); the per-assignment ops use
 * the /api/trips/:tripId/assignments prefix. AssignmentsService is exported for
 * the plugin RPC host (PluginHostDepsFactory injects it).
 */
@Module({
  // DaysModule: AssignmentsMcp injects DaysService for the target-day checks.
  imports: [DaysModule, PermissionsModule, QueryHelpersModule, AuthModule],
  controllers: [DayAssignmentsController, AssignmentOpsController],
  providers: [AssignmentsService, AssignmentsMcp],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
