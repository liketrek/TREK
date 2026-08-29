import type { User } from '../../types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { TodoCreateItemDto, TodoUpdateItemDto, TodoReorderDto, TodoCategoryAssigneesDto } from './todo.dto';
import { TodoService } from './todo.service';
import { Body, Controller, Delete, Get, Headers, HttpException, Param, Post, Put, UseGuards } from '@nestjs/common';

/**
 * /api/trips/:tripId/todo — trip-scoped task list.
 *
 * Every handler verifies trip access (404); mutations check the 'packing_edit'
 * permission (403); create is 201, the rest 200; mutations broadcast over
 * WebSocket with the forwarded X-Socket-Id. /reorder is declared before /:id so
 * it wins over the param. Bodies validate against the @trek/shared todo schemas
 * via the DTO classes in todo.dto.ts + the global ZodValidationPipe (400 with
 * the standard `{ error }` envelope on mismatch — this replaced the legacy
 * bespoke 'Item name is required' check).
 */
@Controller('api/trips/:tripId/todo')
// TripAccessGuard resolves :tripId and 404s a trip the user cannot reach; mutations
// add @RequirePermission('packing_edit'), the same action string the service's canEdit
// passes, so the HTTP and MCP paths cannot demand different rights.
@UseGuards(JwtAuthGuard, TripAccessGuard)
export class TodoController {
  constructor(private readonly todo: TodoService) {}

  @Get()
  list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { items: this.todo.listItems(tripId) };
  }

  @RequirePermission('packing_edit')
  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: TodoCreateItemDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const { name, category, due_date, description, assigned_user_id, priority } = body;
    const item = this.todo.createItem(tripId, { name, category, due_date, description, assigned_user_id, priority });
    this.todo.broadcast(tripId, 'todo:created', { item }, socketId);
    return { item };
  }

  @RequirePermission('packing_edit')
  @Put('reorder')
  reorder(@CurrentUser() user: User, @Param('tripId') tripId: string, @Body() body: TodoReorderDto) {
    this.todo.reorderItems(tripId, body.orderedIds);
    return { success: true };
  }

  @RequirePermission('packing_edit')
  @Put(':id')
  update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: TodoUpdateItemDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const { name, checked, category, due_date, description, assigned_user_id, priority } = body;
    // bodyKeys carries which keys the request actually provided (the null-clear
    // protocol); the parsed body only ever holds known schema keys.
    const updated = this.todo.updateItem(
      tripId,
      id,
      // checked arrives as boolean or legacy 0/1 — normalize to the 0/1 the SQL binds.
      {
        name,
        checked: checked === undefined ? undefined : checked ? 1 : 0,
        category,
        due_date,
        description,
        assigned_user_id,
        priority,
      },
      Object.keys(body),
    );
    if (!updated) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    this.todo.broadcast(tripId, 'todo:updated', { item: updated }, socketId);
    return { item: updated };
  }

  @RequirePermission('packing_edit')
  @Delete(':id')
  remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!this.todo.deleteItem(tripId, id)) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    this.todo.broadcast(tripId, 'todo:deleted', { itemId: Number(id) }, socketId);
    return { success: true };
  }

  @Get('category-assignees')
  categoryAssignees(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { assignees: this.todo.getCategoryAssignees(tripId) };
  }

  @RequirePermission('packing_edit')
  @Put('category-assignees/:categoryName')
  updateCategoryAssignees(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('categoryName') categoryName: string,
    @Body() body: TodoCategoryAssigneesDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const category = decodeURIComponent(categoryName);
    const rows = this.todo.updateCategoryAssignees(tripId, category, body.user_ids);
    this.todo.broadcast(tripId, 'todo:assignees', { category, assignees: rows }, socketId);
    return { assignees: rows };
  }
}
