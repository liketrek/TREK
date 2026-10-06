import { AppSettings } from '../../db/entities/AppSettings.entity';
import { BucketList } from '../../db/entities/BucketList.entity';
import { DawarichConnections } from '../../db/entities/DawarichConnections.entity';
import { DawarichVisitSuggestions } from '../../db/entities/DawarichVisitSuggestions.entity';
import { Places } from '../../db/entities/Places.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { Users } from '../../db/entities/Users.entity';
import { AddonsModule } from '../addons/addons.module';
import { AssignmentsDomainModule } from '../assignments/assignments-domain.module';
import { AtlasModule } from '../atlas/atlas.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { JourneyDomainModule } from '../journey/journey-domain.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlacesModule } from '../places/places.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { DawarichSuggestionsService } from './dawarich-suggestions.service';
import { DawarichSyncJob } from './dawarich-sync.job';
import { DawarichSyncService } from './dawarich-sync.service';
import { DawarichTracksService } from './dawarich-tracks.service';
import { DawarichClient } from './dawarich.client';
import { DawarichController } from './dawarich.controller';
import { DawarichMcp } from './dawarich.mcp';
import { DawarichService } from './dawarich.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

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
 *
 * `MikroOrmModule.forFeature` registers every entity this module's own
 * services' `@InjectRepository` constructors need (Plan 3h Task 3):
 * `DawarichConnections`/`DawarichVisitSuggestions` (this domain's own two
 * tables) plus the cross-domain repositories `DawarichSuggestionsService`/
 * `DawarichSyncService`/`DawarichTracksService`/`DawarichSyncJob` reach —
 * `Trips` (3c, access + sync candidates), `Places` (3c, the `source` stamp),
 * `BucketList` (3f, ticks/scan/bounding-box), `Users` (3b, the role lookup
 * `requirePermission` needs) and `AppSettings` (3a, the poll-interval
 * setting) — every module that CONSTRUCTS these services needs its own
 * registration of the entity, not only the entity's own home module (the
 * program-wide BOOT GATE rule).
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      DawarichConnections,
      DawarichVisitSuggestions,
      Trips,
      Places,
      BucketList,
      Users,
      AppSettings,
    ]),
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
