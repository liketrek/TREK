import { AuthModule } from '../auth/auth.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { DayNotesController } from './day-notes.controller';
import { DayNotesMcp } from './day-notes.mcp';
import { DayNotesRpc } from './day-notes.rpc';
import { DayNotesService } from './day-notes.service';
import { Module } from '@nestjs/common';

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
  imports: [McpSharedModule, PermissionsModule, AuthModule, RealtimeModule, PluginGuardsModule],
  controllers: [DayNotesController],
  providers: [DayNotesService, DayNotesMcp, DayNotesRpc],
  exports: [DayNotesService],
})
export class DayNotesModule {}
