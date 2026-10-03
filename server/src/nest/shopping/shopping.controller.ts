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
import { ShoppingService } from './shopping.service';
import { ShoppingCreateItemDto, ShoppingUpdateItemDto, ShoppingReorderDto } from './shopping.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';

@Controller('api/trips/:tripId/shopping')
@UseGuards(JwtAuthGuard, TripAccessGuard)
export class ShoppingController {
  constructor(private readonly shopping: ShoppingService) {}

  @Get()
  list(@CurrentUser() _user: User, @Param('tripId') tripId: string) {
    return { items: this.shopping.listItems(tripId) };
  }

  @RequirePermission('packing_edit')
  @Post()
  create(
    @CurrentUser() _user: User,
    @Param('tripId') tripId: string,
    @Body() body: ShoppingCreateItemDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const { name, quantity, category, assigned_user_id, notes } = body;
    const item = this.shopping.createItem(tripId, { name, quantity, category, assigned_user_id, notes });
    this.shopping.broadcast(tripId, 'shopping:created', { item }, socketId);
    return { item };
  }

  @RequirePermission('packing_edit')
  @Put('reorder')
  reorder(
    @CurrentUser() _user: User,
    @Param('tripId') tripId: string,
    @Body() body: ShoppingReorderDto,
  ) {
    this.shopping.reorderItems(tripId, body.orderedIds);
    return { success: true };
  }

  @RequirePermission('packing_edit')
  @Post('clear-checked')
  clearChecked(
    @CurrentUser() _user: User,
    @Param('tripId') tripId: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const deletedIds = this.shopping.clearChecked(tripId);
    for (const itemId of deletedIds) {
      this.shopping.broadcast(tripId, 'shopping:deleted', { itemId }, socketId);
    }
    return { success: true, deletedIds };
  }

  @RequirePermission('packing_edit')
  @Put(':id')
  update(
    @CurrentUser() _user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: ShoppingUpdateItemDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const { name, checked, quantity, category, assigned_user_id, notes, budget_item_id } = body;
    if (budget_item_id != null && !this.shopping.budgetItemBelongsToTrip(tripId, budget_item_id)) {
      throw new HttpException({ error: 'Budget item not found' }, 400);
    }
    const updated = this.shopping.updateItem(
      tripId,
      id,
      {
        name,
        checked: checked === undefined ? undefined : checked ? 1 : 0,
        quantity,
        category,
        assigned_user_id,
        notes,
        budget_item_id,
      },
      Object.keys(body),
    );
    if (!updated) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    this.shopping.broadcast(tripId, 'shopping:updated', { item: updated }, socketId);
    return { item: updated };
  }

  @RequirePermission('packing_edit')
  @Delete(':id')
  remove(
    @CurrentUser() _user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const ok = this.shopping.deleteItem(tripId, id);
    if (!ok) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    this.shopping.broadcast(tripId, 'shopping:deleted', { itemId: parseInt(id, 10) }, socketId);
    return { success: true };
  }
}
