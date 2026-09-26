import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { User } from '../../types';
import { BudgetService } from './budget.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';
import { Trip } from '../permissions/trip.decorator';
import type { TripAccess } from '../database/database.service';
import {
  BudgetCreateItemDto,
  BudgetUpdateItemDto,
  BudgetUpdatePayersDto,
  BudgetUpdateMembersDto,
  BudgetToggleMemberPaidDto,
  BudgetReorderItemsDto,
  BudgetReorderCategoriesDto,
  BudgetCreateSettlementDto,
  BudgetUpdateSettlementDto,
  BudgetFreezeRatesDto,
  BudgetSettlementQueryDto,
} from './budget.dto';

/**
 * /api/trips/:tripId/budget — trip-scoped expense planner.
 *
 * Byte-identical to the legacy Express route (server/src/routes/budget.ts):
 * every handler verifies trip access (404); mutations check 'budget_edit' (403);
 * create is 201, the rest 200; bespoke 404 bodies reproduced; mutations
 * broadcast over WebSocket with the forwarded X-Socket-Id. Static sub-routes
 * (summary, settlement, freeze-rates, reorder/*) are declared before /:id so they
 * win over the param. Updating total_price on a reservation-linked item syncs the
 * price back.
 *
 * Bodies are validated against the @trek/shared budget schemas via budget.dto.ts
 * (global ZodValidationPipe). This replaced the legacy bespoke 400s ('Name is
 * required', 'from_user_id, to_user_id and amount are required', 'user_ids must
 * be an array', 'payers must be an array') with the pipe's uniform
 * { error: 'field: message; …' } envelope.
 */
@Controller('api/trips/:tripId/budget')
// TripAccessGuard resolves :tripId and 404s a trip the user cannot reach; mutations
// add @RequirePermission('budget_edit'), the same action string the service's canEdit
// passes, so the HTTP and MCP paths cannot demand different rights.
@UseGuards(JwtAuthGuard, TripAccessGuard)
export class BudgetController {
  constructor(private readonly budget: BudgetService) {}



  @Get()
  list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { items: this.budget.list(tripId) };
  }

  @Get('summary/per-person')
  async perPerson(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { summary: await this.budget.perPersonSummary(tripId) };
  }

  // `base_rate` is the caller's own quote for the display currency (units per 1 trip
  // currency), used only when the server has none; a malformed one is a 400.
  @Get('settlement')
  settlement(
    @CurrentUser() user: User,
    @Trip() trip: TripAccess,
    @Param('tripId') tripId: string,
    @Query() query: BudgetSettlementQueryDto,
  ) {
    return this.budget.settlement(tripId, query.base, trip.currency || 'EUR', query.base_rate);
  }

  @Get('settlements')
  listSettlements(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { settlements: this.budget.listSettlements(tripId) };
  }

  @RequirePermission('budget_edit')
  @Post('settlements')
  async createSettlement(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: BudgetCreateSettlementDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const settlement = await this.budget.createSettlement(
      tripId,
      {
        from_user_id: body.from_user_id, to_user_id: body.to_user_id, amount: body.amount,
        currency: body.currency, settled_at: body.settled_at, fallback_fx: body.fallback_fx,
      },
      user.id,
    );
    // A party who is not on this trip gets the same answer as a settlement that
    // does not exist, so the endpoint cannot be used to probe for user ids.
    if (!settlement) {
      throw new HttpException({ error: 'Settlement not found' }, 404);
    }
    this.budget.broadcast(tripId, 'budget:settlement-created', { settlement }, socketId);
    return { settlement };
  }

  @RequirePermission('budget_edit')
  @Put('settlements/:settlementId')
  async updateSettlement(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('settlementId') settlementId: string,
    @Body() body: BudgetUpdateSettlementDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const settlement = await this.budget.updateSettlement(settlementId, tripId, {
      from_user_id: body.from_user_id,
      to_user_id: body.to_user_id,
      amount: body.amount,
      currency: body.currency,
      settled_at: body.settled_at,
      fallback_fx: body.fallback_fx,
    });
    if (!settlement) {
      throw new HttpException({ error: 'Settlement not found' }, 404);
    }
    this.budget.broadcast(tripId, 'budget:settlement-updated', { settlement }, socketId);
    return { settlement };
  }

  @RequirePermission('budget_edit')
  @Delete('settlements/:settlementId')
  deleteSettlement(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('settlementId') settlementId: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!this.budget.deleteSettlement(settlementId, tripId)) {
      throw new HttpException({ error: 'Settlement not found' }, 404);
    }
    this.budget.broadcast(tripId, 'budget:settlement-deleted', { settlementId: Number(settlementId) }, socketId);
    return { success: true };
  }

  /**
   * Freeze a rate onto every foreign row that has none frozen yet, the ones the
   * settlement lists as `unconverted` and the ones it still converts at today's rate:
   * the server's own rate first, `fallback_fx` (the browser's) for a currency it cannot
   * quote. A frozen row, a row in the trip currency and a row without a currency are
   * never touched. The same service call as the freeze_budget_rates MCP tool, which
   * lends no rates. 409 when the trip currency changed while the rates were fetched;
   * nothing is written then.
   */
  @RequirePermission('budget_edit')
  @Post('freeze-rates')
  @HttpCode(200)
  async freezeRates(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: BudgetFreezeRatesDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const healed = await this.budget.freezeMissingRates(tripId, body.fallback_fx);
    if (!healed) {
      throw new HttpException({ error: 'The trip currency changed. Reload and try again.' }, 409);
    }
    for (const item of healed.items) this.budget.broadcast(tripId, 'budget:updated', { item }, socketId);
    for (const settlement of healed.settlements) this.budget.broadcast(tripId, 'budget:settlement-updated', { settlement }, socketId);
    return healed;
  }

  @RequirePermission('budget_edit')
  @Post()
  async create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: BudgetCreateItemDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const refusal = this.budget.linkRefusal(tripId, body);
    if (refusal) throw new HttpException({ error: refusal }, 400);
    const item = await this.budget.create(tripId, body);
    // A booking mirrors the total of its expenses (#2084); a new one adds to it.
    if (item.reservation_id) this.budget.resyncReservationPrice(tripId, item.reservation_id, socketId);
    this.budget.broadcast(tripId, 'budget:created', { item }, socketId);
    return { item };
  }

  @RequirePermission('budget_edit')
  @Put('reorder/items')
  reorderItems(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: BudgetReorderItemsDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    this.budget.reorderItems(tripId, body.orderedIds);
    this.budget.broadcast(tripId, 'budget:reordered', { orderedIds: body.orderedIds }, socketId);
    return { success: true };
  }

  @RequirePermission('budget_edit')
  @Put('reorder/categories')
  reorderCategories(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: BudgetReorderCategoriesDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    this.budget.reorderCategories(tripId, body.orderedCategories);
    this.budget.broadcast(tripId, 'budget:reordered', { orderedCategories: body.orderedCategories }, socketId);
    return { success: true };
  }

  @RequirePermission('budget_edit')
  @Put(':id')
  async update(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: BudgetUpdateItemDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const refusal = this.budget.linkRefusal(tripId, body);
    if (refusal) throw new HttpException({ error: refusal }, 400);
    // The booking an expense leaves also needs its price worked out again.
    const before = body.reservation_id !== undefined ? this.budget.getBudgetItem(id, tripId) : null;
    const updated = await this.budget.update(id, tripId, body);
    if (!updated) {
      throw new HttpException({ error: 'Budget item not found' }, 404);
    }
    this.budget.resyncLinkedPrices(tripId, before?.reservation_id, updated, body, socketId);
    this.budget.broadcast(tripId, 'budget:updated', { item: updated }, socketId);
    return { item: updated };
  }

  @RequirePermission('budget_edit')
  @Put(':id/members')
  updateMembers(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: BudgetUpdateMembersDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const result = this.budget.updateMembers(id, tripId, body.user_ids);
    if (!result) {
      throw new HttpException({ error: 'Budget item not found' }, 404);
    }
    this.budget.broadcast(tripId, 'budget:members-updated', { itemId: Number(id), members: result.members, persons: result.item.persons }, socketId);
    return { members: result.members, item: result.item };
  }

  @RequirePermission('budget_edit')
  @Put(':id/payers')
  setPayers(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: BudgetUpdatePayersDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const item = this.budget.setPayers(id, tripId, body.payers);
    if (!item) {
      throw new HttpException({ error: 'Budget item not found' }, 404);
    }
    // The payers derive the total, which the linked booking mirrors.
    if (item.reservation_id) this.budget.resyncReservationPrice(tripId, item.reservation_id, socketId);
    this.budget.broadcast(tripId, 'budget:updated', { item }, socketId);
    return { item };
  }

  @RequirePermission('budget_edit')
  @Put(':id/members/:userId/paid')
  toggleMemberPaid(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: BudgetToggleMemberPaidDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const member = this.budget.toggleMemberPaid(id, tripId, userId, body.paid);
    this.budget.broadcast(tripId, 'budget:member-paid-updated', { itemId: Number(id), userId: Number(userId), paid: body.paid ? 1 : 0 }, socketId);
    return { member };
  }

  @RequirePermission('budget_edit')
  @Delete(':id')
  remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!this.budget.remove(id, tripId)) {
      throw new HttpException({ error: 'Budget item not found' }, 404);
    }
    this.budget.broadcast(tripId, 'budget:deleted', { itemId: Number(id) }, socketId);
    return { success: true };
  }
}
