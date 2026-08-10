import { Module } from '@nestjs/common';
import { TodoController } from './todo.controller';
import { TodoMcp } from './todo.mcp';
import { TodoService } from './todo.service';
import { TodoRpc } from './todo.rpc';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';
import { AddonsModule } from '../addons/addons.module';

/** To-do domain (S3 — Phase 2 trip sub-domain). Registered in AppModule.
 *  Exports TodoService for in-container consumers (TripsService bundle). */
@Module({
  imports: [PermissionsModule, AuthModule, RealtimeModule, PluginGuardsModule, AddonsModule],
  controllers: [TodoController],
  providers: [TodoService, TodoMcp, TodoRpc],
  exports: [TodoService],
})
export class TodoModule {}
