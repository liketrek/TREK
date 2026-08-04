import { Module } from '@nestjs/common';
import { DaysController } from './days.controller';
import { DaysService } from './days.service';
import { DaysMcp } from './days.mcp';
import { DayNotesController } from './day-notes.controller';
import { DayNotesService } from './day-notes.service';
import { DayNotesMcp } from './day-notes.mcp';
import { PermissionsModule } from '../permissions/permissions.module';
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
  imports: [PermissionsModule, PlacesModule, AuthModule],
  controllers: [DaysController, DayNotesController],
  providers: [DaysService, DaysMcp, DayNotesService, DayNotesMcp],
  exports: [DaysService, DayNotesService],
})
export class DaysModule {}
