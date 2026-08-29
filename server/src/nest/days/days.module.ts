import { AuthModule } from '../auth/auth.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlacesModule } from '../places/places.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { QueryHelpersModule } from '../query-helpers/query-helpers.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { DaysController } from './days.controller';
import { DaysMcp } from './days.mcp';
import { DaysRpc } from './days.rpc';
import { DaysService } from './days.service';
import { Module } from '@nestjs/common';

/**
 * Days (S6 — Phase 2 trip sub-domain), mounted at /api/trips/:tripId/days.
 * DaysMcp carries the decorator-registered MCP tools + resources. DaysService is
 * exported for in-container consumers (DaysRpc, AccommodationsService,
 * TripsService, the assignments/reservations MCP controllers).
 *
 * Day notes used to live here too, with their own full file set; they are their
 * own domain now (day-notes/).
 */
@Module({
  imports: [
    McpSharedModule,
    PermissionsModule,
    QueryHelpersModule,
    PlacesModule,
    AuthModule,
    RealtimeModule,
    PluginGuardsModule,
  ],
  controllers: [DaysController],
  providers: [DaysService, DaysMcp, DaysRpc],
  exports: [DaysService],
})
export class DaysModule {}
