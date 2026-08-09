import { Module } from '@nestjs/common';
import { DaysController } from './days.controller';
import { DaysService } from './days.service';
import { DaysMcp } from './days.mcp';
import { DayNotesController } from './day-notes.controller';
import { DayNotesService } from './day-notes.service';
import { DayNotesRpc } from './day-notes.rpc';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { DayNotesMcp } from './day-notes.mcp';
import { PermissionsModule } from '../permissions/permissions.module';
import { QueryHelpersModule } from '../query-helpers/query-helpers.module';
import { PlacesModule } from '../places/places.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Days + day-notes domain (S6 — Phase 2 trip sub-domain). The single prefix
 * /api/trips/:tripId/days covers both the days mount and the nested
 * /days/:dayId/notes mount. DaysMcp/DayNotesMcp carry the
 * decorator-registered MCP tools + resources. DaysService and DayNotesService
 * are exported for in-container consumers (PluginHostDepsFactory,
 * AccommodationsService, TripsService, the assignments/reservations MCP
 * controllers).
 */
@Module({
  imports: [PermissionsModule, QueryHelpersModule, PlacesModule, AuthModule, RealtimeModule, PluginGuardsModule],
  controllers: [DaysController, DayNotesController],
  providers: [DaysService, DaysMcp, DayNotesService, DayNotesMcp, DayNotesRpc],
  exports: [DaysService, DayNotesService],
})
export class DaysModule {}
