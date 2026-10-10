import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { JourneyDomainModule } from '../journey/journey-domain.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { QueryHelpersModule } from '../query-helpers/query-helpers.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AssignmentsService } from './assignments.service';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import { AssignmentParticipants } from '../../db/entities/AssignmentParticipants.entity';
import { Days } from '../../db/entities/Days.entity';
import { Places } from '../../db/entities/Places.entity';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import { RoadtripVias } from '../../db/entities/RoadtripVias.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { Tours } from '../../db/entities/Tours.entity';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';

/**
 * The assignments SERVICE, split from the controller/MCP/RPC surfaces (the
 * journey-domain precedent). AssignmentsService itself never touches
 * DaysService — only AssignmentsMcp does — so the service can live in a module
 * that stays off the DaysModule → PlacesModule → AssignmentsModule loop.
 * That is what lets PlacesModule import this and places.mcp.ts inject the
 * service, which retired assignments.bridge. Everything here is a leaf:
 * none of the four service imports reaches the days or places domains.
 *
 * `MikroOrmModule.forFeature([DayAssignments, AssignmentParticipants, Days,
 * Places, TripMembers, RoadtripVias])` registers `DayAssignmentsRepository`/
 * `AssignmentParticipantsRepository`/`DaysRepository`/`PlacesRepository`/
 * `TripMembersRepository`/`RoadtripViasRepository` for `AssignmentsService`'s
 * `@InjectRepository` constructor params (Plan 3c Task 3; `RoadtripVias`
 * added by Plan 3d Task 1 for AS20–AS23) — the entity classes only, not the
 * `DaysModule`/`PlacesModule`/`RoadtripModule` modules themselves, so the
 * loop this module's docstring already avoids stays avoided (`DaysModule`'s
 * own precedent for pulling in `Trips` the same way). `Tours` backs the
 * one-Tour-per-day check create and move share.
 */
@Module({
  imports: [TripMembershipModule, 
    PermissionsModule,
    QueryHelpersModule,
    JourneyDomainModule,
    RealtimeModule,
    MikroOrmModule.forFeature([DayAssignments, AssignmentParticipants, Days, Places, TripMembers, RoadtripVias, Trips, Tours]),
  ],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsDomainModule {}
