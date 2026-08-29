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
import { Module } from '@nestjs/common';

/**
 * Reservations + accommodations domain (S5 — Phase 2 trip sub-domain).
 * Mounts: /api/trips/:tripId/reservations, /accommodations, and the cross-trip
 * /api/reservations/upcoming dashboard feed. ReservationsMcp carries the
 * decorator-registered MCP tools + resource for the domain.
 */
@Module({
  // DaysModule: ReservationsMcp injects DaysService for its nine getDay calls.
  // BudgetModule: ReservationsService + ReservationsMcp inject BudgetService (budget-sync seam).
  imports: [
    McpSharedModule,
    NotificationsModule,
    DaysModule,
    AssignmentsModule,
    PermissionsModule,
    BudgetModule,
    AuthModule,
    RealtimeModule,
    PluginGuardsModule,
    ReservationsReadModule,
    AirtrailCoreModule,
  ],
  controllers: [ReservationsController, UpcomingReservationsController],
  providers: [ReservationsService, ReservationsMcp, ReservationsRpc],
  // For in-container consumers (ReservationsRpc, TripsService, BookingImportService).
  exports: [ReservationsService],
})
export class ReservationsModule {}
