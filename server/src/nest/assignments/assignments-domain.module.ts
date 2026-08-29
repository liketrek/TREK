import { JourneyDomainModule } from '../journey/journey-domain.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { QueryHelpersModule } from '../query-helpers/query-helpers.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AssignmentsService } from './assignments.service';
import { Module } from '@nestjs/common';

/**
 * The assignments SERVICE, split from the controller/MCP/RPC surfaces (the
 * journey-domain precedent). AssignmentsService itself never touches
 * DaysService — only AssignmentsMcp does — so the service can live in a module
 * that stays off the DaysModule → PlacesModule → AssignmentsModule loop.
 * That is what lets PlacesModule import this and places.mcp.ts inject the
 * service, which retired assignments.bridge. Everything here is a leaf:
 * none of the four imports reaches the days or places domains.
 */
@Module({
  imports: [PermissionsModule, QueryHelpersModule, JourneyDomainModule, RealtimeModule],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsDomainModule {}
