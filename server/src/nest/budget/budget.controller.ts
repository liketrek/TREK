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
import type { TripAccess } from '../../db/repositories/Trips.repository';
import { toRowId } from '../common/row-id';
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
  async list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { items: await this.budget.list(tripId) };
  }

  @Get('summary/per-person')
  async perPerson(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { summary: await this.budget.perPersonSummary(tripId) };
  }

  // `base_rate` is the caller's own quote for the display currency (units per 1 trip
  // currency), used only when the server has none; a malformed one is a 400.
  @Get('settlement')
  async settlement(
    @CurrentUser() user: User,
    @Trip() trip: TripAccess,
    @Param('tripId') tripId: string,
    @Query() query: BudgetSettlementQueryDto,
  ) {
    return this.budget.settlement(tripId, query.base, trip.currency || 'EUR', query.base_rate);
  }

  @Get('settlements')
  async listSettlements(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    return { settlements: await this.budget.listSettlements(tripId) };
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
        currency: body.currency, settled_at: body.settled_at, note: body.note, fallback_fx: body.fallback_fx,
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
    // Plan 4 Task 8b (U6) — :settlementId is parsed ONCE here (toRowId, not
    // Number(): rule 15's NaN-into-SQL trap), and the parsed number is what
    // flows into the service instead of the raw route string reaching the
    // repository. A malformed id never matched under the legacy affinity
    // CAST either, so it 404s with the same body updateSettlement's own
    // not-found branch already produces below.
    const settlementIdNum = toRowId(settlementId);
    if (settlementIdNum === null) {
      throw new HttpException({ error: 'Settlement not found' }, 404);
    }
    const settlement = await this.budget.updateSettlement(settlementIdNum, tripId, {
      from_user_id: body.from_user_id,
      to_user_id: body.to_user_id,
      amount: body.amount,
      currency: body.currency,
      settled_at: body.settled_at,
      note: body.note,
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
  async deleteSettlement(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('settlementId') settlementId: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — same single gate-level parse as updateSettlement above.
    const settlementIdNum = toRowId(settlementId);
    if (settlementIdNum === null) {
      throw new HttpException({ error: 'Settlement not found' }, 404);
    }
    if (!(await this.budget.deleteSettlement(settlementIdNum, tripId))) {
      throw new HttpException({ error: 'Settlement not found' }, 404);
    }
    this.budget.broadcast(tripId, 'budget:settlement-deleted', { settlementId: settlementIdNum }, socketId);
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
    const refusal = await this.budget.linkRefusal(tripId, body);
    if (refusal) throw new HttpException({ error: refusal }, 400);
    const item = await this.budget.create(tripId, body);
    // A booking mirrors the total of its expenses (#2084); a new one adds to it.
    if (item.reservation_id) await this.budget.resyncReservationPrice(tripId, item.reservation_id, socketId);
    this.budget.broadcast(tripId, 'budget:created', { item }, socketId);
    return { item };
  }

  @RequirePermission('budget_edit')
  @Put('reorder/items')
  async reorderItems(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: BudgetReorderItemsDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    await this.budget.reorderItems(tripId, body.orderedIds);
    this.budget.broadcast(tripId, 'budget:reordered', { orderedIds: body.orderedIds }, socketId);
    return { success: true };
  }

  @RequirePermission('budget_edit')
  @Put('reorder/categories')
  async reorderCategories(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: BudgetReorderCategoriesDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    await this.budget.reorderCategories(tripId, body.orderedCategories);
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
    // A body that reaches into another trip is refused whatever :id says (#2084),
    // so the link check sits above the id gate: a malformed id must not turn
    // that 400 into a 404.
    const refusal = await this.budget.linkRefusal(tripId, body);
    if (refusal) throw new HttpException({ error: refusal }, 400);
    // Plan 4 Task 8b (U6) — :id is parsed ONCE here (toRowId, not Number():
    // rule 15's NaN-into-SQL trap), and the parsed number is what flows
    // into the service instead of the raw route string reaching the
    // repository. A malformed id never matched under the legacy affinity
    // CAST either, so it 404s with the same body this handler's own
    // not-found branch already produces below.
    const itemId = toRowId(id);
    if (itemId === null) {
      throw new HttpException({ error: 'Budget item not found' }, 404);
    }
    // The booking an expense leaves also needs its price worked out again.
    const before = body.reservation_id !== undefined ? await this.budget.getBudgetItem(itemId, tripId) : null;
    const updated = await this.budget.update(itemId, tripId, body);
    if (!updated) {
      throw new HttpException({ error: 'Budget item not found' }, 404);
    }
    await this.budget.resyncLinkedPrices(tripId, before?.reservation_id, updated, body, socketId);
    this.budget.broadcast(tripId, 'budget:updated', { item: updated }, socketId);
    return { item: updated };
  }

  @RequirePermission('budget_edit')
  @Put(':id/members')
  async updateMembers(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: BudgetUpdateMembersDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — same single gate-level parse as update above.
    const itemId = toRowId(id);
    if (itemId === null) {
      throw new HttpException({ error: 'Budget item not found' }, 404);
    }
    const result = await this.budget.updateMembers(itemId, tripId, body.user_ids);
    if (!result) {
      throw new HttpException({ error: 'Budget item not found' }, 404);
    }
    this.budget.broadcast(tripId, 'budget:members-updated', { itemId, members: result.members, persons: result.item.persons }, socketId);
    return { members: result.members, item: result.item };
  }

  @RequirePermission('budget_edit')
  @Put(':id/payers')
  async setPayers(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: BudgetUpdatePayersDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — same single gate-level parse as update above.
    const itemId = toRowId(id);
    if (itemId === null) {
      throw new HttpException({ error: 'Budget item not found' }, 404);
    }
    const item = await this.budget.setPayers(itemId, tripId, body.payers);
    if (!item) {
      throw new HttpException({ error: 'Budget item not found' }, 404);
    }
    // The payers derive the total, which the linked booking mirrors.
    if (item.reservation_id) await this.budget.resyncReservationPrice(tripId, item.reservation_id, socketId);
    this.budget.broadcast(tripId, 'budget:updated', { item }, socketId);
    return { item };
  }

  @RequirePermission('budget_edit')
  @Put(':id/members/:userId/paid')
  async toggleMemberPaid(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: BudgetToggleMemberPaidDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — :id/:userId parsed ONCE here (toRowId). Unlike
    // every other handler in this controller, the legacy route
    // (server/src/routes/budget.ts, pre-ORM) never 404'd an unknown item or
    // member on this one either: it always answered 200 { member } (member
    // undefined on a miss) and always broadcast Number(id)/Number(userId)
    // regardless of the result. A malformed id already short-circuits to
    // that exact "no match" shape today — existsInTrip's affinity-seam
    // WHERE simply never matches it — so a null parse here isn't a 404, it
    // is that same no-op: the service call is skipped (nothing would have
    // matched) and the broadcast keeps its legacy Number(id)/Number(userId)
    // fallback for a malformed id.
    const itemId = toRowId(id);
    const memberUserId = toRowId(userId);
    const member = itemId !== null && memberUserId !== null
      ? await this.budget.toggleMemberPaid(itemId, tripId, memberUserId, body.paid)
      : null;
    this.budget.broadcast(tripId, 'budget:member-paid-updated', { itemId: itemId ?? Number(id), userId: memberUserId ?? Number(userId), paid: body.paid ? 1 : 0 }, socketId);
    return { member };
  }

  @RequirePermission('budget_edit')
  @Delete(':id')
  async remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    // Plan 4 Task 8b (U6) — same single gate-level parse as update above.
    const itemId = toRowId(id);
    if (itemId === null) {
      throw new HttpException({ error: 'Budget item not found' }, 404);
    }
    if (!(await this.budget.remove(itemId, tripId))) {
      throw new HttpException({ error: 'Budget item not found' }, 404);
    }
    this.budget.broadcast(tripId, 'budget:deleted', { itemId }, socketId);
    return { success: true };
  }
}
