import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DaysController } from './days.controller';
import { DaysService } from './days.service';
import { DaysMcp } from './days.mcp';
import { DaysRpc } from './days.rpc';
import { DayRemovalService } from './day-removal.service';
import { AccommodationsDomainModule } from '../accommodations/accommodations-domain.module';
import { AssignmentsDomainModule } from '../assignments/assignments-domain.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { QueryHelpersModule } from '../query-helpers/query-helpers.module';
import { PlacesModule } from '../places/places.module';
import { AuthModule } from '../auth/auth.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { Days } from '../../db/entities/Days.entity';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import { DayNotes } from '../../db/entities/DayNotes.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { ReservationEndpoints } from '../../db/entities/ReservationEndpoints.entity';
import { DayAccommodations } from '../../db/entities/DayAccommodations.entity';
import { RoadtripVias } from '../../db/entities/RoadtripVias.entity';
import { RoadtripDayBoundaries } from '../../db/entities/RoadtripDayBoundaries.entity';

/**
 * Days (S6 — Phase 2 trip sub-domain), mounted at /api/trips/:tripId/days.
 * DaysMcp carries the decorator-registered MCP tools + resources. DaysService is
 * exported for in-container consumers (DaysRpc, AccommodationsService,
 * TripsService, the assignments/reservations MCP controllers).
 *
 * Day notes used to live here too, with their own full file set; they are their
 * own domain now (day-notes/).
 *
 * Deleting a day cancels the stays that check in or out on it and lets the
 * journey catch up, so DayRemovalService needs the accommodations and
 * assignments services. Both domain modules are leaves (neither reaches days or
 * places), and PlacesModule already brings them in, so the edge adds no cycle.
 *
 * `MikroOrmModule.forFeature([Days, DayAssignments, DayNotes, Trips,
 * Reservations, ReservationEndpoints, DayAccommodations, RoadtripVias,
 * RoadtripDayBoundaries])` registers
 * `DaysRepository`/`DayAssignmentsRepository`/`DayNotesRepository`/
 * `TripsRepository`/`ReservationsRepository`/`ReservationEndpointsRepository`/
 * `DayAccommodationsRepository` for `DaysService`'s `@InjectRepository`
 * constructor params (Plan 3c Task 2; `Reservations`/`ReservationEndpoints`
 * added by Plan 3d Task 2 for DY14–DY18/DY23; `DayAccommodations` added by
 * Plan 3d Task 3 for DY19/DY20/DY22) — the same forFeature +
 * `@InjectRepository` wiring every converted domain copies
 * (`trip-membership.module.ts`'s precedent for pulling in a repository this
 * module doesn't otherwise own). `RoadtripVias` (the stay stop a re-dated stay
 * carries re-pins its roads) and `RoadtripDayBoundaries` (a dated append and a
 * day delete move the day boundaries) serve `DaysService` and
 * `DayRemovalService`.
 */
@Module({
  imports: [
    McpSharedModule,
    PermissionsModule,
    QueryHelpersModule,
    PlacesModule,
    AuthModule,
    RealtimeModule,
    PluginGuardsModule,
    AccommodationsDomainModule,
    AssignmentsDomainModule,
    MikroOrmModule.forFeature([
      Days, DayAssignments, DayNotes, Trips, Reservations, ReservationEndpoints, DayAccommodations,
      RoadtripVias, RoadtripDayBoundaries,
    ]),
  ],
  controllers: [DaysController],
  providers: [DaysService, DayRemovalService, DaysMcp, DaysRpc],
  exports: [DaysService],
})
export class DaysModule {}
