import { DayNotes } from '../../db/entities/DayNotes.entity';
import { Days } from '../../db/entities/Days.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { AuthModule } from '../auth/auth.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
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
 * AuthModule is only for DayNotesMcp's demo-user gate, PluginGuardsModule only
 * for DayNotesRpc.
 */
@Module({
  // DayNotes/Days: Plan 4 Task 1 — DayNotesService's own DayNotesRepository/
  // DaysRepository.existsInTrip, replacing its raw `this.dbs.all/get/run`.
  imports: [
    McpSharedModule,
    PermissionsModule,
    AuthModule,
    RealtimeModule,
    PluginGuardsModule,
    MikroOrmModule.forFeature([DayNotes, Days, Trips]),
  ],
  controllers: [DayNotesController],
  providers: [DayNotesService, DayNotesMcp, DayNotesRpc],
  exports: [DayNotesService],
})
export class DayNotesModule {}
