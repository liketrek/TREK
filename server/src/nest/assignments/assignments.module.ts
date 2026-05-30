import { Module } from '@nestjs/common';
import { DayAssignmentsController, AssignmentOpsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

/**
 * Assignments domain (S7 — Phase 2 trip sub-domain). The day-assignments mount
 * sits under the /api/trips/:tripId/days prefix (S6); the per-assignment ops use
 * the /api/trips/:tripId/assignments prefix.
 */
@Module({
  controllers: [DayAssignmentsController, AssignmentOpsController],
  providers: [AssignmentsService],
})
export class AssignmentsModule {}
