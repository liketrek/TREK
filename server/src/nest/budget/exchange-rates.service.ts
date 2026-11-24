import { ExchangeRateBatchPreviews } from '../../db/entities/ExchangeRateBatchPreviews.entity';
import { GlobalExchangeRateSnapshots } from '../../db/entities/GlobalExchangeRateSnapshots.entity';
import { TripExchangeRates } from '../../db/entities/TripExchangeRates.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { EXCHANGE_RATE_BATCH_PREVIEW, GLOBAL_EXCHANGE_RATE_MAP } from '../../db/json-columns';
import type { ExchangeRateBatchPreviewsRepository } from '../../db/repositories/ExchangeRateBatchPreviews.repository';
import type { GlobalExchangeRateSnapshotsRepository } from '../../db/repositories/GlobalExchangeRateSnapshots.repository';
import type { TripExchangeRatesRepository } from '../../db/repositories/TripExchangeRates.repository';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import type { BudgetRateColumns } from '../../db/repositories/_shared/budget-rate';
import { dbNow, parseDbTimestamp, utcSuffix } from '../../db/types/db-timestamp.type';
import { decodeJson, encodeJson } from '../../utils/json-column';
import { badRequest, conflict, DomainError, notFound } from '../common/domain-error';
import { inOrder } from '../common/in-order';
import { UnitOfWork } from '../database/unit-of-work';
import { isFrozenRate, positiveRate } from './budget-money.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  FRANKFURTER_CURRENCY_SET,
  exchangeRateSourceSchema,
  type ApplyTripExchangeRateRequest,
  type BudgetFallbackFx,
  type ExchangeRateBatchApplyResult,
  type ExchangeRateBatchPreview,
  type ExchangeRateResolution,
  type ExchangeRateSnapshot,
  type ExchangeRateSource,
  type TripExchangeRate,
} from '@trek/shared';

import { createHash, randomUUID } from 'node:crypto';

const SNAPSHOT_TTL = 6 * 60 * 60 * 1000;
const FAILURE_TTL = 60 * 1000;
const PREVIEW_TTL = 60 * 60 * 1000;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const MAX_PROVIDER_CONCURRENCY = 4;

type TrustedSource = Exclude<ExchangeRateSource, 'legacy'>;
type RateSelection = ApplyTripExchangeRateRequest['selected'];
type TrustedQuote = Omit<ExchangeRateResolution, 'source'> & { source: TrustedSource };
export type FrozenRate = BudgetRateColumns & { exchange_rate_source: TrustedSource };

export interface RateWrite {
  currency?: string | null;
  exchange_rate?: number;
  exchange_rate_note?: string | null;
  fallback_fx?: BudgetFallbackFx;
}

export type PreparedRate =
  | { kind: 'preserve'; base: string; previousCurrency: string }
  | { kind: 'freeze'; base: string; previousCurrency: string | null; rate: FrozenRate };

export function normalizeCurrency(currency: string | null | undefined, fallback = 'EUR'): string {
  return currency?.trim().toUpperCase() || fallback;
}

export function isSupportedProviderCurrency(currency: string): boolean {
  return FRANKFURTER_CURRENCY_SET.has(normalizeCurrency(currency));
}

function currencyCode(value: string): string {
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw badRequest('currency must be a three-letter ISO code');
  return code;
}

function validRate(value: number): void {
  if (!positiveRate(value)) throw badRequest('exchange_rate must be finite and greater than zero');
}

function missingRate(): DomainError {
  return badRequest('No exchange-rate snapshot or trip default is available; enter a manual exchange rate');
}

export function freezeRate(
  exchangeRate: number,
  source: TrustedSource,
  version: string,
  options: { userId?: number; effectiveDate?: string | null; note?: string | null; reset?: boolean } = {},
): FrozenRate {
  validRate(exchangeRate);
  const now = new Date().toISOString();
  return {
    exchange_rate: exchangeRate,
    exchange_rate_source: source,
    exchange_rate_source_version: version,
    exchange_rate_effective_date: options.effectiveDate ?? null,
    exchange_rate_set_at: now,
    exchange_rate_set_by_user_id: options.userId ?? null,
    exchange_rate_note: options.note?.trim() || null,
    exchange_rate_reset_at: options.reset ? now : null,
  };
}

function rateForApi(row: TripExchangeRate): TripExchangeRate {
  return { ...row, set_at: utcSuffix(row.set_at) ?? row.set_at };
}

@Injectable()
export class ExchangeRatesService {
  private readonly inflight = new Map<string, Promise<ExchangeRateSnapshot | null>>();
  private readonly providerFailures = new Map<string, number>();
  private readonly waiters: (() => void)[] = [];
  private activeRequests = 0;

  constructor(
    @InjectRepository(GlobalExchangeRateSnapshots) private readonly snapshots: GlobalExchangeRateSnapshotsRepository,
    @InjectRepository(TripExchangeRates) private readonly tripRates: TripExchangeRatesRepository,
    @InjectRepository(ExchangeRateBatchPreviews) private readonly previews: ExchangeRateBatchPreviewsRepository,
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    private readonly uow: UnitOfWork,
  ) {}

  private async storedSnapshot(base: string): Promise<ExchangeRateSnapshot | null> {
    const row = await this.snapshots.getSnapshot(base);
    if (!row) return null;
    const { rates_json, ...metadata } = row;
    const rates = decodeJson(GLOBAL_EXCHANGE_RATE_MAP, rates_json, base);
    const fetched = parseDbTimestamp(row.fetched_at);
    if (!rates || !fetched) return null;
    return { ...metadata, rates, stale: Date.now() - fetched.getTime() >= SNAPSHOT_TTL };
  }

  /** @txStandalone The provider snapshot cache is independent of the trip write using its quote. */
  private async fetchSnapshot(base: string): Promise<ExchangeRateSnapshot | null> {
    if (this.activeRequests === MAX_PROVIDER_CONCURRENCY) {
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    } else {
      this.activeRequests++;
    }
    try {
      const response = await fetch(`https://api.frankfurter.dev/v2/rates?base=${encodeURIComponent(base)}`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) return null;
      const length = Number(response.headers.get('content-length'));
      if (length > MAX_RESPONSE_BYTES) return null;
      const text = await response.text();
      if (text.length > MAX_RESPONSE_BYTES) return null;
      const payload: unknown = JSON.parse(text);
      if (!Array.isArray(payload)) return null;

      const rates: Record<string, number> = { [base]: 1 };
      let effectiveDate: string | null = null;
      for (const raw of payload) {
        if (typeof raw !== 'object' || raw === null) continue;
        const { date, quote, rate } = raw as { date?: unknown; quote?: unknown; rate?: unknown };
        if (typeof quote !== 'string' || !/^[A-Z]{3}$/.test(quote) || quote === base || !positiveRate(rate)) continue;
        rates[quote] = rate;
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && (!effectiveDate || date > effectiveDate)) {
          effectiveDate = date;
        }
      }
      if (Object.keys(rates).length === 1) return null;
      const fetchedAt = new Date().toISOString();
      const metadata = {
        base_currency: base,
        effective_date: effectiveDate,
        fetched_at: fetchedAt,
        source_version: `frankfurter:${effectiveDate || fetchedAt}`,
      };
      await this.snapshots.saveSnapshot({ ...metadata, rates_json: encodeJson(GLOBAL_EXCHANGE_RATE_MAP, rates) });
      return { ...metadata, rates, stale: false };
    } catch (error) {
      console.error('[exchange-rates] rates fetch failed for', base, error);
      return null;
    } finally {
      const next = this.waiters.shift();
      if (next) next();
      else this.activeRequests--;
    }
  }

  async getGlobalRateSnapshot(baseCurrency = 'EUR'): Promise<ExchangeRateSnapshot | null> {
    const base = normalizeCurrency(baseCurrency);
    const stored = await this.storedSnapshot(base);
    if ((stored && !stored.stale) || !isSupportedProviderCurrency(base)) return stored;
    if ((this.providerFailures.get(base) ?? 0) > Date.now()) return stored;

    let pending = this.inflight.get(base);
    if (pending === undefined) {
      pending = this.fetchSnapshot(base)
        .then((fresh) => {
          if (fresh) this.providerFailures.delete(base);
          else this.providerFailures.set(base, Date.now() + FAILURE_TTL);
          return fresh;
        })
        .finally(() => this.inflight.delete(base));
      this.inflight.set(base, pending);
    }
    return (await pending) ?? stored;
  }

  async getRates(base: string): Promise<Record<string, number> | null> {
    return (await this.getGlobalRateSnapshot(base))?.rates ?? null;
  }

  async resolveExchangeRate(tripId: string | number, itemCurrency: string): Promise<TrustedQuote | null> {
    const base = await this.trips.getCurrency(tripId);
    if (base === undefined) return null;
    return this.resolveAgainst(Number(tripId), normalizeCurrency(base), currencyCode(itemCurrency));
  }

  private async resolveAgainst(tripId: number, base: string, currency: string): Promise<TrustedQuote | null> {
    const pair = { trip_id: tripId, trip_currency: base, item_currency: currency };
    if (currency === base) {
      return {
        ...pair,
        exchange_rate: 1,
        source: 'identity',
        source_version: `identity:${base}`,
        effective_date: null,
        fetched_at: null,
        stale: false,
      };
    }
    const tripRate = await this.tripRates.getRate(tripId, currency);
    if (tripRate && positiveRate(tripRate.exchange_rate)) {
      return {
        ...pair,
        exchange_rate: tripRate.exchange_rate,
        source: 'trip',
        source_version: tripRate.source_version,
        effective_date: tripRate.effective_date,
        fetched_at: utcSuffix(tripRate.set_at),
        stale: false,
      };
    }
    const snapshot = await this.getGlobalRateSnapshot(base);
    const exchangeRate = snapshot?.rates[currency];
    if (!snapshot || !positiveRate(exchangeRate)) return null;
    return {
      ...pair,
      exchange_rate: exchangeRate,
      source: 'global',
      source_version: snapshot.source_version,
      effective_date: snapshot.effective_date,
      fetched_at: snapshot.fetched_at,
      stale: snapshot.stale,
    };
  }

  async resolveWriteRate(
    tripId: string | number,
    base: string,
    currency: string,
    data: RateWrite,
    userId?: number,
  ): Promise<FrozenRate | null> {
    if (data.exchange_rate !== undefined) validRate(data.exchange_rate);
    if (base === currency) return freezeRate(1, 'identity', `identity:${base}`, { userId });
    const note = data.exchange_rate_note;
    if (data.exchange_rate !== undefined) {
      return freezeRate(data.exchange_rate, 'explicit', `explicit:${randomUUID()}`, { userId, note });
    }
    const quote = await this.resolveAgainst(Number(tripId), base, currency);
    if (quote) {
      return freezeRate(quote.exchange_rate, quote.source, quote.source_version, {
        effectiveDate: quote.effective_date,
        userId,
        note,
      });
    }
    const fallback = data.fallback_fx;
    const lent = fallback && normalizeCurrency(fallback.base) === base ? fallback.rates[currency] : undefined;
    return positiveRate(lent)
      ? freezeRate(lent, 'explicit', `client-fallback:${randomUUID()}`, { userId, note })
      : null;
  }

  async prepareWrite(
    tripId: string | number,
    data: RateWrite,
    userId?: number,
    existing?: { currency: string | null },
  ): Promise<PreparedRate> {
    const rawBase = await this.trips.getCurrency(tripId);
    if (rawBase === undefined) throw notFound('Trip not found');
    const base = normalizeCurrency(rawBase);
    const previousCurrency = existing ? normalizeCurrency(existing.currency, base) : null;
    const currency = currencyCode(
      normalizeCurrency(data.currency === undefined ? existing?.currency : data.currency, base),
    );
    if (previousCurrency === currency && data.exchange_rate === undefined) {
      return { kind: 'preserve', base, previousCurrency };
    }
    const rate = await this.resolveWriteRate(tripId, base, currency, data, userId);
    if (!rate) throw missingRate();
    return { kind: 'freeze', base, previousCurrency, rate };
  }

  async requireCurrentBase(tripId: string | number, base: string): Promise<void> {
    const current = await this.trips.getCurrency(tripId);
    if (current === undefined) throw notFound('Trip not found');
    if (normalizeCurrency(current) !== base) throw conflict('Trip currency changed while resolving the exchange rate');
  }

  async listTripExchangeRates(tripId: string | number): Promise<TripExchangeRate[]> {
    return (await this.tripRates.listForTrip(Number(tripId))).map(rateForApi);
  }

  private async targetCurrency(tripId: string | number, currency: string, rate: number) {
    validRate(rate);
    const code = currencyCode(currency);
    const rawBase = await this.trips.getCurrency(tripId);
    if (rawBase === undefined) throw notFound('Trip not found');
    const base = normalizeCurrency(rawBase);
    if (base === code) throw badRequest('The trip currency always uses a 1:1 identity rate');
    return { base, code };
  }

  private async saveTripRate(
    tripId: number,
    currency: string,
    exchangeRate: number,
    userId: number,
    note?: string | null,
  ) {
    const row = await this.tripRates.saveRate({
      trip_id: tripId,
      currency,
      exchange_rate: exchangeRate,
      source_version: `trip:${tripId}:${currency}:${randomUUID()}`,
      effective_date: null,
      set_at: new Date().toISOString(),
      set_by_user_id: userId,
      note: note?.trim() || null,
    });
    return rateForApi(row);
  }

  async setTripExchangeRate(
    tripId: string | number,
    currency: string,
    rate: number,
    userId: number,
    note?: string | null,
  ) {
    return this.uow.transactional(async () => {
      const { code } = await this.targetCurrency(tripId, currency, rate);
      return this.saveTripRate(Number(tripId), code, rate, userId, note);
    });
  }

  async rebaseTripRates(tripId: string | number, previous: string, next: string, bridge?: number): Promise<void> {
    const id = Number(tripId);
    await inOrder(await this.tripRates.listForTrip(id), async (rate) => {
      if (normalizeCurrency(rate.currency) === next) {
        await this.tripRates.deleteRate(id, rate.currency);
      } else {
        if (!positiveRate(bridge))
          throw badRequest('No bridge exchange rate is available for the trip currency change');
        const exchange_rate = rate.exchange_rate * bridge;
        validRate(exchange_rate);
        await this.tripRates.saveRate({
          ...rate,
          exchange_rate,
          source_version: `rebase:${previous}:${next}:${rate.source_version}`,
          effective_date: null,
          set_at: new Date().toISOString(),
          set_by_user_id: null,
        });
      }
    });
  }

  async deleteTripExchangeRate(tripId: string | number, currency: string): Promise<boolean> {
    return this.tripRates.deleteRate(Number(tripId), currencyCode(currency));
  }

  private async batchState(tripId: number, base: string, currency: string) {
    const tripRate = await this.tripRates.getRate(tripId, currency);
    const rows = await this.previews.batchRows(tripId, currency);
    const token = createHash('sha256')
      .update(JSON.stringify({ base, tripRate, ...rows }))
      .digest('hex');
    return { ...rows, token };
  }

  async previewTripExchangeRateUpdate(
    tripId: string | number,
    currency: string,
    exchangeRate: number,
    userId: number,
    note?: string | null,
  ): Promise<ExchangeRateBatchPreview> {
    return this.uow.transactional(async () => {
      const { base, code } = await this.targetCurrency(tripId, currency, exchangeRate);
      await this.previews.deleteExpired(dbNow(new Date(Date.now() - PREVIEW_TTL)));
      const state = await this.batchState(Number(tripId), base, code);
      const rows = [
        ...state.expenses.map((row) => ({ ...row, type: 'expense' as const, amount: row.total_price })),
        ...state.settlements.map((row) => ({ ...row, type: 'settlement' as const })),
      ].map((row) => {
        const source = exchangeRateSourceSchema.safeParse(row.exchange_rate_source).data ?? 'legacy';
        const oldValue = isFrozenRate(row.exchange_rate, source) ? row.amount / row.exchange_rate : null;
        const newValue = row.amount / exchangeRate;
        return {
          type: row.type,
          id: row.id,
          currency: code,
          amount: row.amount,
          source,
          old_exchange_rate: positiveRate(row.exchange_rate) ? row.exchange_rate : 1,
          new_exchange_rate: exchangeRate,
          old_trip_value: oldValue,
          new_trip_value: newValue,
          trip_value_delta: oldValue === null ? null : newValue - oldValue,
          selected: source === 'global' || source === 'trip',
        };
      });
      const preview = {
        preview_id: randomUUID(),
        trip_id: Number(tripId),
        currency: code,
        exchange_rate: exchangeRate,
        rows,
      };
      await this.previews.savePreview({
        id: preview.preview_id,
        trip_id: Number(tripId),
        currency: code,
        exchange_rate: exchangeRate,
        note: note?.trim() || null,
        state_token: state.token,
        created_by_user_id: userId,
        preview_json: encodeJson(EXCHANGE_RATE_BATCH_PREVIEW, preview),
        created_at: dbNow(),
      });
      return preview;
    });
  }

  async applyTripExchangeRateUpdate(
    tripId: string | number,
    previewId: string,
    selected: RateSelection,
    userId: number,
    expectedCurrency?: string,
  ): Promise<ExchangeRateBatchApplyResult> {
    return this.uow.transactional(async () => {
      const id = Number(tripId);
      const stored = await this.previews.getPreview(id, previewId);
      if (!stored || stored.created_by_user_id !== userId) throw badRequest('Exchange-rate preview not found');
      const created = parseDbTimestamp(stored.created_at);
      if (!created || Date.now() - created.getTime() >= PREVIEW_TTL) {
        throw new DomainError(409, 'Exchange-rate preview expired', {
          details: { code: 'EXCHANGE_RATE_PREVIEW_EXPIRED' },
        });
      }
      if (expectedCurrency && currencyCode(expectedCurrency) !== stored.currency) {
        throw badRequest('Preview currency does not match the request');
      }
      const rawBase = await this.trips.getCurrency(id);
      if (rawBase === undefined) throw notFound('Trip not found');
      const state = await this.batchState(id, normalizeCurrency(rawBase), stored.currency);
      if (state.token !== stored.state_token) throw conflict('Exchange-rate data changed after the preview');
      const preview = decodeJson(EXCHANGE_RATE_BATCH_PREVIEW, stored.preview_json, previewId);
      const key = (row: RateSelection[number]) => `${row.type}:${row.id}`;
      const allowed = new Set(preview?.rows.map(key));
      if (!preview || selected.some((row) => !allowed.has(key(row)))) {
        throw badRequest('Selection contains an item outside this preview');
      }
      const updated = [...new Map(selected.map((row) => [key(row), row])).values()];
      const rate = await this.saveTripRate(id, stored.currency, stored.exchange_rate, userId, stored.note);
      const frozen = freezeRate(rate.exchange_rate, 'trip', rate.source_version, {
        userId,
        note: rate.note,
        reset: true,
      });
      await this.previews.applySelectedRates(id, updated, frozen);
      await this.previews.deletePreview(previewId);
      return { rate, updated };
    });
  }
}
