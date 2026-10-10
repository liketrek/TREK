import { BudgetItems } from '../../db/entities/BudgetItems.entity';
import { DayAccommodations } from '../../db/entities/DayAccommodations.entity';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import { Days } from '../../db/entities/Days.entity';
import { Places } from '../../db/entities/Places.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { RoadtripVias } from '../../db/entities/RoadtripVias.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { AssignmentsDomainModule } from '../assignments/assignments-domain.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { AccommodationsService } from './accommodations.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * The accommodations SERVICE, split from the controller/MCP/RPC surfaces (the
 * assignments-domain precedent). AccommodationsService itself never touches
 * PlacesService -- only AccommodationsMcp does, for the one tool that writes a
 * place and a stay together -- so the service can live in a module that stays
 * off the AccommodationsModule -> PlacesModule edge.
 *
 * That is what lets PlacesModule import this: deleting a place has to take the
 * nights booked at it with it, and the cascade behind a stay (its partner
 * booking, that booking's expense, the day stop it wrote) belongs in one place
 * rather than copied into the delete path.
 *
 * `MikroOrmModule.forFeature([DayAccommodations, DayAssignments, Places,
 * Days, RoadtripVias, Reservations])` registers `DayAccommodationsRepository`
 * (this task's own) plus `DayAssignmentsRepository`/`PlacesRepository`/
 * `DaysRepository`/`RoadtripViasRepository`/`ReservationsRepository` (owned
 * elsewhere, reached the same way `ReservationsModule` reaches `Days`/
 * `Places`/`DayAssignments` — the entity classes only, never the owning
 * module) for `AccommodationsService`'s `@InjectRepository` constructor
 * params (Plan 3d Task 3). `PlacesService.cancelStaysAt` (PL16) reaches
 * `DayAccommodationsRepository` through `AccommodationsService` itself
 * (already injected there) instead of a repository dependency of its own —
 * no entity added here for that.
 */
@Module({
  imports: [
    TripMembershipModule,
    PermissionsModule,
    RealtimeModule,
    AssignmentsDomainModule,
    MikroOrmModule.forFeature([
      DayAccommodations,
      DayAssignments,
      Places,
      Days,
      RoadtripVias,
      Reservations,
      BudgetItems,
      Trips,
    ]),
  ],
  providers: [AccommodationsService],
  exports: [AccommodationsService],
})
export class AccommodationsDomainModule {}
