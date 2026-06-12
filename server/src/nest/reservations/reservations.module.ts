import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { AccommodationsController } from './accommodations.controller';
import { AccommodationsService } from './accommodations.service';
import { UpcomingReservationsController } from './upcoming-reservations.controller';

/**
 * Reservations + accommodations domain (S5 — Phase 2 trip sub-domain).
 * Mounts: /api/trips/:tripId/reservations, /accommodations, and the cross-trip
 * /api/reservations/upcoming dashboard feed.
 */
@Module({
  controllers: [ReservationsController, AccommodationsController, UpcomingReservationsController],
  providers: [ReservationsService, AccommodationsService],
})
export class ReservationsModule {}
