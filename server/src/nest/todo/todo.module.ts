import { Module } from '@nestjs/common';
import { TodoController } from './todo.controller';
import { TodoMcp } from './todo.mcp';
import { TodoService } from './todo.service';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';

/** To-do domain (S3 — Phase 2 trip sub-domain). Registered in AppModule.
 *  Exports TodoService for in-container consumers (TripsService bundle). */
@Module({
  imports: [PermissionsModule, AuthModule],
  controllers: [TodoController],
  providers: [TodoService, TodoMcp],
  exports: [TodoService],
})
export class TodoModule {}
