import { Module } from '@nestjs/common';
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
 */
@Module({
  imports: [
    McpSharedModule, PermissionsModule, QueryHelpersModule, PlacesModule, AuthModule, RealtimeModule, PluginGuardsModule,
    AccommodationsDomainModule, AssignmentsDomainModule,
  ],
  controllers: [DaysController],
  providers: [DaysService, DayRemovalService, DaysMcp, DaysRpc],
  exports: [DaysService],
})
export class DaysModule {}
