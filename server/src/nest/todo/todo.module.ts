import { Module } from '@nestjs/common';
import { TodoController } from './todo.controller';
import { TodoService } from './todo.service';

/** To-do domain (S3 — Phase 2 trip sub-domain). Registered in AppModule. */
@Module({
  controllers: [TodoController],
  providers: [TodoService],
})
export class TodoModule {}
