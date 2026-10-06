import { TodoCategoryAssignees } from '../../db/entities/TodoCategoryAssignees.entity';
import { TodoItems } from '../../db/entities/TodoItems.entity';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { AddonsModule } from '../addons/addons.module';
import { AuthModule } from '../auth/auth.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { TodoController } from './todo.controller';
import { TodoMcp } from './todo.mcp';
import { TodoRpc } from './todo.rpc';
import { TodoService } from './todo.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/** To-do domain (S3 — Phase 2 trip sub-domain). Registered in AppModule.
 *  Exports TodoService for in-container consumers (TripsService bundle).
 *  `MikroOrmModule.forFeature([TodoItems, TodoCategoryAssignees, Trips])`
 *  (Plan 3e Task 4) registers `TodoItemsRepository`/
 *  `TodoCategoryAssigneesRepository` for `TodoService`'s `@InjectRepository`
 *  constructor params — the `CollabModule`/`FilesModule` precedent. `Trips`
 *  (Plan 4 Task 2): `verifyTripAccess`'s own canAccessTrip delegate, now
 *  TripsRepository directly. */
@Module({
  imports: [
    MikroOrmModule.forFeature([TodoItems, TodoCategoryAssignees, Trips, TripMembers]),
    McpSharedModule,
    PermissionsModule,
    AuthModule,
    RealtimeModule,
    PluginGuardsModule,
    AddonsModule,
  ],
  controllers: [TodoController],
  providers: [TodoService, TodoMcp, TodoRpc],
  exports: [TodoService],
})
export class TodoModule {}
