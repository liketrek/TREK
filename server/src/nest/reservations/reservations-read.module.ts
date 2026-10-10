import { ReservationEndpoints } from '../../db/entities/ReservationEndpoints.entity';
import { ReservationTravelers } from '../../db/entities/ReservationTravelers.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { ReservationsReadService } from './reservations-read.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * A leaf on purpose (the trip-membership precedent): AirtrailCoreModule needs
 * the single-reservation hydration reads without dragging ReservationsModule
 * in — which would re-close the cycle that airtrail.bridge used to dodge.
 *
 * `MikroOrmModule.forFeature([Reservations, ReservationEndpoints,
 * ReservationTravelers])` registers `ReservationsRepository`/
 * `ReservationEndpointsRepository`/`ReservationTravelersRepository` for
 * `ReservationsReadService`'s `@InjectRepository` constructor params (Plan
 * 3d Task 2, R11) — the entity classes only, not `ReservationsModule`
 * itself, so this module stays the same leaf it always was.
 */
@Module({
  imports: [MikroOrmModule.forFeature([Reservations, ReservationEndpoints, ReservationTravelers])],
  providers: [ReservationsReadService],
  exports: [ReservationsReadService],
})
export class ReservationsReadModule {}
