import { Module } from '@nestjs/common';
import { DayNotesController } from './day-notes.controller';
import { DayNotesService } from './day-notes.service';
import { DayNotesMcp } from './day-notes.mcp';
import { DayNotesRpc } from './day-notes.rpc';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';

/**
 * Day notes. Its own domain rather than a second file set inside days/, which
 * carried two fachlichkeiten with a full controller/service/mcp/rpc/dto each.
 *
 * Deliberately unconnected to DaysModule in both directions: `dayExists` is raw
 * SQL on `days` here, and DaysService reads `day_notes` the same way. Wiring the
 * modules to each other would buy nothing and cost a cycle.
 *
 * AuthModule is only for DayNotesMcp's demo-user gate, PluginGuardsModule only
 * for DayNotesRpc.
 */
@Module({
  imports: [PermissionsModule, AuthModule, RealtimeModule, PluginGuardsModule],
  controllers: [DayNotesController],
  providers: [DayNotesService, DayNotesMcp, DayNotesRpc],
  exports: [DayNotesService],
})
export class DayNotesModule {}
