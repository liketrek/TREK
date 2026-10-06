import { BudgetItems } from '../../db/entities/BudgetItems.entity';
import { DayAccommodations } from '../../db/entities/DayAccommodations.entity';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import { Days } from '../../db/entities/Days.entity';
import { Places } from '../../db/entities/Places.entity';
import { ReservationDayPositions } from '../../db/entities/ReservationDayPositions.entity';
import { ReservationEndpoints } from '../../db/entities/ReservationEndpoints.entity';
import { ReservationTravelers } from '../../db/entities/ReservationTravelers.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { Users } from '../../db/entities/Users.entity';
import { AccommodationsModule } from '../accommodations/accommodations.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { AuthModule } from '../auth/auth.module';
import { BudgetModule } from '../budget/budget.module';
import { DaysModule } from '../days/days.module';
import { AirtrailCoreModule } from '../integrations/airtrail-core.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ReservationsReadModule } from './reservations-read.module';
import { ReservationsController } from './reservations.controller';
import { ReservationsMcp } from './reservations.mcp';
import { ReservationsRpc } from './reservations.rpc';
import { ReservationsService } from './reservations.service';
import { UpcomingReservationsController } from './upcoming-reservations.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Reservations + accommodations domain (S5 — Phase 2 trip sub-domain).
 * Mounts: /api/trips/:tripId/reservations, /accommodations, and the cross-trip
 * /api/reservations/upcoming dashboard feed. ReservationsMcp carries the
 * decorator-registered MCP tools + resource for the domain.
 *
 * `MikroOrmModule.forFeature([...])` registers `ReservationsRepository`/
 * `ReservationEndpointsRepository`/`ReservationTravelersRepository`/
 * `ReservationDayPositionsRepository`/`DayAccommodationsRepository` (this
 * task's own) plus `DaysRepository`/`PlacesRepository`/
 * `DayAssignmentsRepository`/`TripMembersRepository`/`UsersRepository`/
 * `TripsRepository` (owned elsewhere, reached the same way
 * `AssignmentsDomainModule` reaches `Days`/`Places`/`TripMembers` — the
 * entity classes only, never the owning module) for `ReservationsService`'s
 * `@InjectRepository` constructor params (Plan 3d Task 2).
 */
@Module({
  // DaysModule: ReservationsMcp injects DaysService for its nine getDay calls.
  // BudgetModule: ReservationsService + ReservationsMcp inject BudgetService (budget-sync seam).
  // AccommodationsModule: a hotel booking writes its own day_accommodations row, and
  // that stay owes the day plan the same stop one entered under Days does. No edge
  // back — accommodations reaches neither days nor reservations (ACC-002).
  imports: [
    McpSharedModule,
    NotificationsModule,
    DaysModule,
    AssignmentsModule,
    AccommodationsModule,
    PermissionsModule,
    BudgetModule,
    AuthModule,
    RealtimeModule,
    PluginGuardsModule,
    ReservationsReadModule,
    AirtrailCoreModule,
    MikroOrmModule.forFeature([
      Reservations,
      ReservationEndpoints,
      ReservationTravelers,
      ReservationDayPositions,
      DayAccommodations,
      Days,
      Places,
      DayAssignments,
      TripMembers,
      Users,
      Trips,
      BudgetItems,
    ]),
  ],
  controllers: [ReservationsController, UpcomingReservationsController],
  providers: [ReservationsService, ReservationsMcp, ReservationsRpc],
  // For in-container consumers (ReservationsRpc, TripsService, BookingImportService).
  exports: [ReservationsService],
})
export class ReservationsModule {}
