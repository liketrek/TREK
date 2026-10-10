import { DayNotes } from '../../db/entities/DayNotes.entity';
import { Days } from '../../db/entities/Days.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { PluginGuardsModule } from '../../nest-rpc/plugin-guards.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { DayNotesController } from './day-notes.controller';
import { DayNotesMcp } from './day-notes.mcp';
import { DayNotesRpc } from './day-notes.rpc';
import { DayNotesService } from './day-notes.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Day notes. Its own domain rather than a second file set inside days/, which
 * carried two fachlichkeiten with a full controller/service/mcp/rpc/dto each.
 *
 * Deliberately unconnected to DaysModule in both directions: `dayExists` goes
 * through `DaysRepository.existsInTrip` via this module's own `forFeature`
 * registration (Plan 4 Task 1), not through `DaysModule`/`DaysService`, and
 * `DaysService` reads `day_notes` through its own `DayNotesRepository`
 * injection the same way. Wiring the modules to each other would buy
 * nothing and cost a cycle.
 *
 * PluginGuardsModule is only for DayNotesRpc.
 */
@Module({
  // DayNotes/Days: Plan 4 Task 1 — DayNotesService's own DayNotesRepository/
  // DaysRepository.existsInTrip, replacing its raw `this.dbs.all/get/run`.
  imports: [
    TripMembershipModule,
    McpSharedModule,
    PermissionsModule,
    RealtimeModule,
    PluginGuardsModule,
    MikroOrmModule.forFeature([DayNotes, Days, Trips]),
  ],
  controllers: [DayNotesController],
  providers: [DayNotesService, DayNotesMcp, DayNotesRpc],
  exports: [DayNotesService],
})
export class DayNotesModule {}
