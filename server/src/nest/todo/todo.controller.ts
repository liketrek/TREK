import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { User } from '../../types';
import { TodoService } from './todo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

/**
 * /api/trips/:tripId/todo — trip-scoped task list.
 *
 * Byte-identical to the legacy Express route (server/src/routes/todo.ts): every
 * handler verifies trip access (404); mutations check the 'packing_edit'
 * permission (403); create is 201, the rest 200; the bespoke 400/404 bodies are
 * reproduced; mutations broadcast over WebSocket with the forwarded X-Socket-Id.
 * /reorder is declared before /:id so it wins over the param.
 */
@Controller('api/trips/:tripId/todo')
@UseGuards(JwtAuthGuard)
export class TodoController {
  constructor(private readonly todo: TodoService) {}

  private requireTrip(tripId: string, user: User) {
    const trip = this.todo.verifyTripAccess(tripId, user.id);
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    return trip;
  }

  private requireEdit(trip: ReturnType<TodoService['verifyTripAccess']>, user: User): void {
    if (!this.todo.canEdit(trip!, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
  }

  @Get()
  list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.requireTrip(tripId, user);
    return { items: this.todo.listItems(tripId) };
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: { name?: string; category?: string; due_date?: string; description?: string; assigned_user_id?: number; priority?: number },
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!body.name) {
      throw new HttpException({ error: 'Item name is required' }, 400);
    }
    const { name, category, due_date, description, assigned_user_id, priority } = body;
    const item = this.todo.createItem(tripId, { name, category, due_date, description, assigned_user_id, priority });
    this.todo.broadcast(tripId, 'todo:created', { item }, socketId);
    return { item };
  }

  @Put('reorder')
  reorder(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body('orderedIds') orderedIds: number[],
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    this.todo.reorderItems(tripId, orderedIds);
    return { success: true };
  }

  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const { name, checked, category, due_date, description, assigned_user_id, priority } = body as Record<string, never>;
    const updated = this.todo.updateItem(tripId, id, { name, checked, category, due_date, description, assigned_user_id, priority }, Object.keys(body));
    if (!updated) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    this.todo.broadcast(tripId, 'todo:updated', { item: updated }, socketId);
    return { item: updated };
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!this.todo.deleteItem(tripId, id)) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    this.todo.broadcast(tripId, 'todo:deleted', { itemId: Number(id) }, socketId);
    return { success: true };
  }

  @Get('category-assignees')
  categoryAssignees(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.requireTrip(tripId, user);
    return { assignees: this.todo.getCategoryAssignees(tripId) };
  }

  @Put('category-assignees/:categoryName')
  updateCategoryAssignees(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('categoryName') categoryName: string,
    @Body('user_ids') userIds: number[],
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const category = decodeURIComponent(categoryName);
    const rows = this.todo.updateCategoryAssignees(tripId, category, userIds);
    this.todo.broadcast(tripId, 'todo:assignees', { category, assignees: rows }, socketId);
    return { assignees: rows };
  }
}
