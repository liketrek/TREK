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
import { BudgetService } from './budget.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

/**
 * /api/trips/:tripId/budget — trip-scoped expense planner.
 *
 * Byte-identical to the legacy Express route (server/src/routes/budget.ts):
 * every handler verifies trip access (404); mutations check 'budget_edit' (403);
 * create is 201, the rest 200; bespoke 400/404 bodies reproduced; mutations
 * broadcast over WebSocket with the forwarded X-Socket-Id. Static sub-routes
 * (summary, settlement, reorder/*) are declared before /:id so they win over the
 * param. Updating total_price on a reservation-linked item syncs the price back.
 */
@Controller('api/trips/:tripId/budget')
@UseGuards(JwtAuthGuard)
export class BudgetController {
  constructor(private readonly budget: BudgetService) {}

  private requireTrip(tripId: string, user: User) {
    const trip = this.budget.verifyTripAccess(tripId, user.id);
    if (!trip) {
      throw new HttpException({ error: 'Trip not found' }, 404);
    }
    return trip;
  }

  private requireEdit(trip: ReturnType<BudgetService['verifyTripAccess']>, user: User): void {
    if (!this.budget.canEdit(trip!, user)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
  }

  @Get()
  list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.requireTrip(tripId, user);
    return { items: this.budget.list(tripId) };
  }

  @Get('summary/per-person')
  perPerson(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.requireTrip(tripId, user);
    return { summary: this.budget.perPersonSummary(tripId) };
  }

  @Get('settlement')
  settlement(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.requireTrip(tripId, user);
    return this.budget.settlement(tripId);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: { name?: string; category?: string; total_price?: number; persons?: number | null; days?: number | null; note?: string | null; expense_date?: string | null },
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!body.name) {
      throw new HttpException({ error: 'Name is required' }, 400);
    }
    const item = this.budget.create(tripId, body as { name: string });
    this.budget.broadcast(tripId, 'budget:created', { item }, socketId);
    return { item };
  }

  @Put('reorder/items')
  reorderItems(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body('orderedIds') orderedIds: number[],
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    this.budget.reorderItems(tripId, orderedIds);
    this.budget.broadcast(tripId, 'budget:reordered', { orderedIds }, socketId);
    return { success: true };
  }

  @Put('reorder/categories')
  reorderCategories(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body('orderedCategories') orderedCategories: string[],
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    this.budget.reorderCategories(tripId, orderedCategories);
    this.budget.broadcast(tripId, 'budget:reordered', { orderedCategories }, socketId);
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
    const updated = this.budget.update(id, tripId, body);
    if (!updated) {
      throw new HttpException({ error: 'Budget item not found' }, 404);
    }
    if (updated.reservation_id && body.total_price !== undefined) {
      this.budget.syncReservationPrice(tripId, updated.reservation_id, updated.total_price, socketId);
    }
    this.budget.broadcast(tripId, 'budget:updated', { item: updated }, socketId);
    return { item: updated };
  }

  @Put(':id/members')
  updateMembers(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body('user_ids') userIds: unknown,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    if (!Array.isArray(userIds)) {
      throw new HttpException({ error: 'user_ids must be an array' }, 400);
    }
    const result = this.budget.updateMembers(id, tripId, userIds);
    if (!result) {
      throw new HttpException({ error: 'Budget item not found' }, 404);
    }
    this.budget.broadcast(tripId, 'budget:members-updated', { itemId: Number(id), members: result.members, persons: result.item.persons }, socketId);
    return { members: result.members, item: result.item };
  }

  @Put(':id/members/:userId/paid')
  toggleMemberPaid(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('paid') paid: boolean,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = this.requireTrip(tripId, user);
    this.requireEdit(trip, user);
    const member = this.budget.toggleMemberPaid(id, userId, paid);
    this.budget.broadcast(tripId, 'budget:member-paid-updated', { itemId: Number(id), userId: Number(userId), paid: paid ? 1 : 0 }, socketId);
    return { member };
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
    if (!this.budget.remove(id, tripId)) {
      throw new HttpException({ error: 'Budget item not found' }, 404);
    }
    this.budget.broadcast(tripId, 'budget:deleted', { itemId: Number(id) }, socketId);
    return { success: true };
  }
}
