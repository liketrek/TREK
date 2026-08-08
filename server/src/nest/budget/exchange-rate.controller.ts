import { Body, Controller, Delete, Get, Headers, HttpException, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../../types';
import { getClientIp, writeAudit } from '../../services/auditLog';
import {
  applyTripExchangeRateUpdate,
  deleteTripExchangeRate,
  getGlobalRateSnapshot,
  listTripExchangeRates,
  previewTripExchangeRateUpdate,
  resolveExchangeRate,
  setTripExchangeRate,
} from '../../services/exchangeRateService';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BudgetService } from './budget.service';

@Controller('api/exchange-rates')
export class GlobalExchangeRateController {
  @Get()
  async get(@Query('base') base?: string) {
    const snapshot = await getGlobalRateSnapshot(base || 'EUR');
    if (!snapshot) throw new HttpException({ error: 'No exchange-rate snapshot is available' }, 503);
    return snapshot;
  }
}

@Controller('api/trips/:tripId/exchange-rates')
@UseGuards(JwtAuthGuard)
export class TripExchangeRateController {
  constructor(private readonly budget: BudgetService) {}

  private trip(tripId: string, user: User) {
    const trip = this.budget.verifyTripAccess(tripId, user.id);
    if (!trip) throw new HttpException({ error: 'Trip not found' }, 404);
    return trip;
  }

  private editable(tripId: string, user: User) {
    const trip = this.trip(tripId, user);
    if (!this.budget.canEdit(trip, user)) throw new HttpException({ error: 'No permission' }, 403);
    return trip;
  }

  @Get()
  list(@CurrentUser() user: User, @Param('tripId') tripId: string) {
    this.trip(tripId, user);
    return { rates: listTripExchangeRates(tripId) };
  }

  @Get('resolve')
  async resolve(@CurrentUser() user: User, @Param('tripId') tripId: string, @Query('currency') currency?: string) {
    this.trip(tripId, user);
    if (!currency) throw new HttpException({ error: 'currency is required' }, 400);
    const quote = await resolveExchangeRate(tripId, currency);
    if (!quote) throw new HttpException({ error: 'No exchange rate is available; enter a manual rate' }, 404);
    return quote;
  }

  @Put(':currency')
  set(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('currency') currency: string,
    @Body() body: { exchange_rate?: number; note?: string | null },
    @Headers('x-socket-id') socketId: string | undefined,
    @Req() req: Request,
  ) {
    this.editable(tripId, user);
    if (body.exchange_rate === undefined) throw new HttpException({ error: 'exchange_rate is required' }, 400);
    const rate = setTripExchangeRate(tripId, currency, body.exchange_rate, user.id, body.note);
    this.budget.broadcast(tripId, 'budget:exchange-rates-updated', { rate }, socketId);
    writeAudit({
      userId: user.id,
      action: 'budget.exchange_rate_set',
      resource: String(tripId),
      ip: getClientIp(req),
      details: { tripId: Number(tripId), currency: currency.toUpperCase(), exchange_rate: body.exchange_rate },
    });
    return { rate };
  }

  @Delete(':currency')
  remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('currency') currency: string,
    @Headers('x-socket-id') socketId: string | undefined,
    @Req() req: Request,
  ) {
    this.editable(tripId, user);
    const deleted = deleteTripExchangeRate(tripId, currency);
    if (!deleted) throw new HttpException({ error: 'Trip exchange rate not found' }, 404);
    this.budget.broadcast(tripId, 'budget:exchange-rates-updated', { currency: currency.toUpperCase(), deleted: true }, socketId);
    writeAudit({
      userId: user.id,
      action: 'budget.exchange_rate_delete',
      resource: String(tripId),
      ip: getClientIp(req),
      details: { tripId: Number(tripId), currency: currency.toUpperCase() },
    });
    return { success: true };
  }

  @Post(':currency/preview')
  preview(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('currency') currency: string,
    @Body() body: { exchange_rate?: number; note?: string | null },
  ) {
    this.editable(tripId, user);
    if (body.exchange_rate === undefined) throw new HttpException({ error: 'exchange_rate is required' }, 400);
    return previewTripExchangeRateUpdate(tripId, currency, body.exchange_rate, user.id, body.note);
  }

  @Post(':currency/apply')
  apply(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('currency') currency: string,
    @Body() body: { preview_id?: string; selected?: Array<{ type: 'expense' | 'settlement'; id: number }> },
    @Headers('x-socket-id') socketId: string | undefined,
    @Req() req: Request,
  ) {
    this.editable(tripId, user);
    if (!body.preview_id || !Array.isArray(body.selected)) {
      throw new HttpException({ error: 'preview_id and selected are required' }, 400);
    }
    const result = applyTripExchangeRateUpdate(tripId, body.preview_id, body.selected, user.id, currency);
    this.budget.broadcast(tripId, 'budget:exchange-rates-applied', result as any, socketId);
    writeAudit({
      userId: user.id,
      action: 'budget.exchange_rate_apply',
      resource: String(tripId),
      ip: getClientIp(req),
      details: { tripId: Number(tripId), currency: currency.toUpperCase(), updated: body.selected.length },
    });
    return result;
  }
}
