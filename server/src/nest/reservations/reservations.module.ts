import { Module } from '@nestjs/common';
import { BudgetModule } from '../budget/budget.module';
import { DaysModule } from '../days/days.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { ReservationsRpc } from './reservations.rpc';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ReservationsMcp } from './reservations.mcp';
import { UpcomingReservationsController } from './upcoming-reservations.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * Reservations + accommodations domain (S5 — Phase 2 trip sub-domain).
 * Mounts: /api/trips/:tripId/reservations, /accommodations, and the cross-trip
 * /api/reservations/upcoming dashboard feed. ReservationsMcp carries the
 * decorator-registered MCP tools + resource for the domain.
 */
@Module({
  // DaysModule: ReservationsMcp injects DaysService for its nine getDay calls.
  // BudgetModule: ReservationsService + ReservationsMcp inject BudgetService (budget-sync seam).
  imports: [DaysModule, PermissionsModule, BudgetModule, AuthModule, RealtimeModule, PluginGuardsModule],
  controllers: [ReservationsController, UpcomingReservationsController],
  providers: [ReservationsService, ReservationsMcp, ReservationsRpc],
  // For in-container consumers (ReservationsRpc, TripsService, BookingImportService).
  exports: [ReservationsService],
})
export class ReservationsModule {}
