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
import { TodoCreateItemDto, TodoUpdateItemDto, TodoReorderDto, TodoCategoryAssigneesDto } from './todo.dto';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { toRowId } from '../common/row-id';
import { ResponseContract } from '../common/response-contract';
import {
  successResponseSchema,
  todoCategoryAssigneesResponseSchema,
  todoCategoryAssigneesUpdateResponseSchema,
  todoItemResponseSchema,
  todoListResponseSchema,
} from '@trek/shared';

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
  @ResponseContract(todoListResponseSchema)
  async list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { items: await this.todo.listItems(tripId) };
  }

  @RequirePermission('packing_edit')
  @Post()
  @ResponseContract(todoItemResponseSchema)
  async create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: TodoCreateItemDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const { name, category, due_date, description, assigned_user_id, priority } = body;
    const item = await this.todo.createItem(tripId, { name, category, due_date, description, assigned_user_id, priority });
    this.todo.broadcast(tripId, 'todo:created', { item }, socketId);
    return { item };
  }

  @RequirePermission('packing_edit')
  @Put('reorder')
  @ResponseContract(successResponseSchema)
  async reorder(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: TodoReorderDto,
  ) {
    await this.todo.reorderItems(tripId, body.orderedIds);
    return { success: true };
  }

  @RequirePermission('packing_edit')
  @Put(':id')
  @ResponseContract(todoItemResponseSchema)
  async update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: TodoUpdateItemDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — :id is parsed ONCE here (toRowId, not Number():
    // rule 15's NaN-into-SQL trap), and the parsed number is what
    // updateItem uses below, instead of the raw string reaching the
    // repository and relying on SQLite's affinity CAST to match it.
    const itemId = toRowId(id);
    if (itemId === null) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    const { name, checked, category, due_date, description, assigned_user_id, priority } = body;
    // bodyKeys carries which keys the request actually provided (the null-clear
    // protocol); the parsed body only ever holds known schema keys.
    const updated = await this.todo.updateItem(
      tripId,
      itemId,
      // checked arrives as boolean or legacy 0/1 — normalize to the 0/1 the SQL binds.
      { name, checked: checked === undefined ? undefined : checked ? 1 : 0, category, due_date, description, assigned_user_id, priority },
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
  @ResponseContract(successResponseSchema)
  async remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — same single gate-level parse as update above.
    const itemId = toRowId(id);
    if (itemId === null) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    if (!(await this.todo.deleteItem(tripId, itemId))) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    this.todo.broadcast(tripId, 'todo:deleted', { itemId }, socketId);
    return { success: true };
  }

  @Get('category-assignees')
  @ResponseContract(todoCategoryAssigneesResponseSchema)
  async categoryAssignees(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { assignees: await this.todo.getCategoryAssignees(tripId) };
  }

  @RequirePermission('packing_edit')
  @Put('category-assignees/:categoryName')
  @ResponseContract(todoCategoryAssigneesUpdateResponseSchema)
  async updateCategoryAssignees(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('categoryName') categoryName: string,
    @Body() body: TodoCategoryAssigneesDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const category = decodeURIComponent(categoryName);
    const rows = await this.todo.updateCategoryAssignees(tripId, category, body.user_ids);
    this.todo.broadcast(tripId, 'todo:assignees', { category, assignees: rows }, socketId);
    return { assignees: rows };
  }
}
