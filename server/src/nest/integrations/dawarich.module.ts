import { Module } from '@nestjs/common';
import { AddonsModule } from '../addons/addons.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AtlasModule } from '../atlas/atlas.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlacesModule } from '../places/places.module';
import { AssignmentsDomainModule } from '../assignments/assignments-domain.module';
import { JourneyDomainModule } from '../journey/journey-domain.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { DawarichClient } from './dawarich.client';
import { DawarichController } from './dawarich.controller';
import { DawarichMcp } from './dawarich.mcp';
import { DawarichService } from './dawarich.service';
import { DawarichSuggestionsService } from './dawarich-suggestions.service';
import { DawarichSyncJob } from './dawarich-sync.job';
import { DawarichSyncService } from './dawarich-sync.service';
import { DawarichTracksService } from './dawarich-tracks.service';

/**
 * The Dawarich integration (#2279): a per-user connection to a self-hosted
 * location-history instance, the visits it reports, and the recorded route
 * drawn over a trip.
 *
 * Everything hangs off `/api/integrations/dawarich`, so there is no cycle to
 * dodge and no split into a core module the way AirTrail needed — nothing in
 * TREK injects Dawarich, Dawarich injects TREK. The direction of that arrow is
 * the architecture: this module reads other domains' services to *create* what
 * a user accepted, and never the other way round.
 *
 * The leaf modules are picked deliberately. `AssignmentsDomainModule` rather
 * than `AssignmentsModule`, and `JourneyDomainModule` rather than
 * `JourneyModule`, so accepting a suggestion does not drag two controller
 * stacks and both photo providers into this graph.
 */
@Module({
  imports: [
    AddonsModule,
    AuditModule,
    // The MCP tools ask AuthService whether the caller is the demo user, the
    // same gate every other write tool carries.
    AuthModule,
    AtlasModule,
    // Accepting a stay writes a place and a day assignment, so it asks the same
    // permissions the planner asks before doing either.
    PermissionsModule,
    PlacesModule,
    AssignmentsDomainModule,
    JourneyDomainModule,
    SchedulingModule,
    McpSharedModule,
  ],
  controllers: [DawarichController],
  providers: [
    DawarichClient,
    DawarichService,
    DawarichSyncService,
    DawarichSuggestionsService,
    DawarichTracksService,
    DawarichSyncJob,
    DawarichMcp,
  ],
  exports: [DawarichService, DawarichSuggestionsService, DawarichTracksService],
})
export class DawarichModule {}
