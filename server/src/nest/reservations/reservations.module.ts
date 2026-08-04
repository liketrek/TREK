import { Module } from '@nestjs/common';
import { BudgetModule } from '../budget/budget.module';
import { DaysModule } from '../days/days.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { ReservationsMcp } from './reservations.mcp';
import { AccommodationsController } from './accommodations.controller';
import { AccommodationsService } from './accommodations.service';
import { UpcomingReservationsController } from './upcoming-reservations.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * Reservations + accommodations domain (S5 — Phase 2 trip sub-domain).
 * Mounts: /api/trips/:tripId/reservations, /accommodations, and the cross-trip
 * /api/reservations/upcoming dashboard feed. ReservationsMcp carries the
 * decorator-registered MCP tools + resource for the domain.
 */
@Module({
  // DaysModule: AccommodationsService + ReservationsMcp inject DaysService.
  // BudgetModule: ReservationsService + ReservationsMcp inject BudgetService (budget-sync seam).
  imports: [DaysModule, PermissionsModule, BudgetModule, AuthModule],
  controllers: [ReservationsController, AccommodationsController, UpcomingReservationsController],
  providers: [ReservationsService, AccommodationsService, ReservationsMcp],
  // For in-container consumers (PluginHostDepsFactory, TripsService, BookingImportService).
  exports: [ReservationsService],
})
export class ReservationsModule {}
