import { ReservationsReadRepository } from './reservations-read.repository';
import { Module } from '@nestjs/common';

/**
 * A leaf on purpose (the trip-membership precedent): AirtrailCoreModule needs
 * the single-reservation hydration reads without dragging ReservationsModule
 * in — which would re-close the cycle that airtrail.bridge used to dodge.
 */
@Module({
  providers: [ReservationsReadRepository],
  exports: [ReservationsReadRepository],
})
export class ReservationsReadModule {}
