import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { AccommodationsController } from './accommodations.controller';
import { AccommodationsService } from './accommodations.service';

/**
 * Reservations + accommodations domain (S5 — Phase 2 trip sub-domain).
 * Two mounts: /api/trips/:tripId/reservations and /accommodations.
 */
@Module({
  controllers: [ReservationsController, AccommodationsController],
  providers: [ReservationsService, AccommodationsService],
})
export class ReservationsModule {}
