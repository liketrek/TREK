import { DatabaseService } from '../database/database.service';
import { Injectable } from '@nestjs/common';
import {
  FRANKFURTER_CURRENCY_SET,
  type ExchangeRateResolution,
  type ExchangeRateSource,
  type ExchangeRateSnapshot as GlobalRateSnapshot,
} from '@trek/shared';

import { createHash, randomUUID } from 'node:crypto';

export interface ExchangeRateWrite {
  currency?: string | null;
  exchange_rate?: number;
  exchange_rate_note?: string | null;
  exchange_rate_source?: ExchangeRateSource;
  exchange_rate_source_version?: string | null;
  exchange_rate_effective_date?: string | null;
  exchange_rate_set_at?: string | null;
  exchange_rate_set_by_user_id?: number | null;
  exchange_rate_reset_at?: string | null;
}

export class ExchangeRateUnavailableError extends Error {
  readonly status = 400;
  constructor() {
    super('No exchange-rate snapshot or trip default is available; enter a manual exchange rate');
  }
}
export class InvalidExchangeRateError extends Error {
  readonly status = 400;
}
export class ExchangeRateConflictError extends Error {
  readonly status = 409;
}
export class ExchangeRatePreviewExpiredError extends Error {
  readonly status = 409;
  readonly code = 'EXCHANGE_RATE_PREVIEW_EXPIRED';
}

const TTL_MS = 6 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 60 * 1000;
const PROVIDER_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const MAX_PROVIDER_CONCURRENCY = 4;
const PREVIEW_TTL_MS = 60 * 60 * 1000;
const inflight = new Map<string, Promise<GlobalRateSnapshot | null>>();
const providerFailures = new Map<string, number>();
const providerWaiters: Array<() => void> = [];
let activeProviderRequests = 0;

export function resetExchangeRateProviderStateForTests(): void {
  inflight.clear();
  providerFailures.clear();
  providerWaiters.splice(0);
  activeProviderRequests = 0;
}

const upper = (currency: string | null | undefined, fallback = 'EUR'): string =>
  (currency || fallback).trim().toUpperCase();
const positive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;

function currencyCode(value: string): string {
  const code = upper(value);
  if (!/^[A-Z]{3}$/.test(code)) throw new InvalidExchangeRateError('currency must be a three-letter ISO code');
  return code;
}

export function isSupportedProviderCurrency(value: string): boolean {
  return FRANKFURTER_CURRENCY_SET.has(upper(value));
}

async function withProviderSlot<T>(run: () => Promise<T>): Promise<T> {
  if (activeProviderRequests >= MAX_PROVIDER_CONCURRENCY) {
    await new Promise<void>((resolve) => providerWaiters.push(resolve));
  }
  activeProviderRequests += 1;
  try {
    return await run();
  } finally {
    activeProviderRequests -= 1;
    providerWaiters.shift()?.();
  }
}

const sqliteTimestamp = (timestampMs: number): string =>
  new Date(timestampMs).toISOString().replace('T', ' ').slice(0, 19);

export function convertWithRates(
  amount: number,
  from: string | null | undefined,
  base: string,
  rates: Record<string, number> | null,
): number {
  const fromCurrency = upper(from, base);
  const baseCurrency = upper(base);
  if (fromCurrency === baseCurrency || !rates) return amount;
  const rate = rates[fromCurrency];
  return positive(rate) ? amount / rate : amount;
}

export function effectiveTripValue(
  amount: number,
  itemCurrency: string | null | undefined,
  tripCurrency: string,
  itemRate: number | null | undefined,
  source: string | null | undefined,
  rates: Record<string, number> | null,
): number {
  const currency = upper(itemCurrency, tripCurrency);
  const trip = upper(tripCurrency);
  if (currency === trip) return amount;
  if (positive(itemRate) && (itemRate !== 1 || (source != null && source !== 'legacy'))) return amount / itemRate;
  const currencyRate = rates?.[currency];
  const tripRate = rates?.[trip];
  return positive(currencyRate) && positive(tripRate) ? (amount / currencyRate) * tripRate : amount;
}

type BatchSelection = { type: 'expense' | 'settlement'; id: number };
type BatchRow = {
  type: 'expense' | 'settlement';
  id: number;
  amount: number;
  currency: string | null;
  exchange_rate: number | null;
  source: ExchangeRateSource | null;
  source_version: string | null;
};

@Injectable()
export class ExchangeRatesService {
  constructor(private readonly db: DatabaseService) {}

  private readSnapshot(base: string): GlobalRateSnapshot | null {
    const row = this.db.get<{
      base_currency: string;
      rates_json: string;
      source_version: string;
      effective_date: string | null;
      fetched_at: string;
    }>(
      `SELECT base_currency, rates_json, source_version, effective_date, fetched_at
        FROM global_exchange_rate_snapshots WHERE base_currency = ?`,
      base,
    );
    if (!row) return null;
    try {
      return {
        base_currency: row.base_currency,
        rates: JSON.parse(row.rates_json) as Record<string, number>,
        source_version: row.source_version,
        effective_date: row.effective_date,
        fetched_at: row.fetched_at,
        stale: Date.now() - Date.parse(row.fetched_at) >= TTL_MS,
      };
    } catch {
      return null;
    }
  }

  private async fetchProviderSnapshot(base: string): Promise<GlobalRateSnapshot | null> {
    return withProviderSlot(async () => {
      try {
        const response = await fetch(`https://api.frankfurter.dev/v2/rates?base=${encodeURIComponent(base)}`, {
          signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        });
        if (!response.ok) return null;
        const text = await response.text();
        if (text.length > MAX_RESPONSE_BYTES) return null;
        const payload: unknown = JSON.parse(text);
        if (!Array.isArray(payload)) return null;
        const rates: Record<string, number> = { [base]: 1 };
        let effectiveDate: string | null = null;
        for (const raw of payload) {
          if (typeof raw !== 'object' || raw === null) continue;
          const entry = raw as { date?: unknown; quote?: unknown; rate?: unknown };
          if (typeof entry.quote !== 'string' || !positive(entry.rate)) continue;
          rates[entry.quote.toUpperCase()] = entry.rate;
          if (typeof entry.date === 'string' && (!effectiveDate || entry.date > effectiveDate))
            effectiveDate = entry.date;
        }
        if (Object.keys(rates).length === 1) return null;
        const fetchedAt = new Date().toISOString();
        const sourceVersion = `frankfurter:${effectiveDate || fetchedAt}`;
        this.db.run(
          `INSERT INTO global_exchange_rate_snapshots
             (base_currency, rates_json, source_version, effective_date, fetched_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(base_currency) DO UPDATE SET
             rates_json = excluded.rates_json, source_version = excluded.source_version,
             effective_date = excluded.effective_date, fetched_at = excluded.fetched_at`,
          base,
          JSON.stringify(rates),
          sourceVersion,
          effectiveDate,
          fetchedAt,
        );
        return {
          base_currency: base,
          rates,
          source_version: sourceVersion,
          effective_date: effectiveDate,
          fetched_at: fetchedAt,
          stale: false,
        };
      } catch (error) {
        console.error('[exchange-rates] rates fetch failed for', base, error);
        return null;
      }
    });
  }

  async refreshGlobalRates(baseCurrency = 'EUR'): Promise<GlobalRateSnapshot | null> {
    const base = upper(baseCurrency);
    const stored = this.readSnapshot(base);
    if (!isSupportedProviderCurrency(base)) return stored;
    const failedUntil = providerFailures.get(base) ?? 0;
    if (failedUntil > Date.now()) return stored;
    if (failedUntil) providerFailures.delete(base);
    let pending = inflight.get(base);
    if (!pending) {
      pending = this.fetchProviderSnapshot(base).then((snapshot) => {
        inflight.delete(base);
        if (snapshot) providerFailures.delete(base);
        else providerFailures.set(base, Date.now() + FAILURE_TTL_MS);
        return snapshot || this.readSnapshot(base);
      });
      inflight.set(base, pending);
    }
    return pending;
  }

  async getGlobalRateSnapshot(baseCurrency = 'EUR'): Promise<GlobalRateSnapshot | null> {
    const base = upper(baseCurrency);
    const stored = this.readSnapshot(base);
    if (stored && !stored.stale) return stored;
    const refreshed = await this.refreshGlobalRates(base);
    if (!refreshed) return stored;
    return { ...refreshed, stale: Date.now() - Date.parse(refreshed.fetched_at) >= TTL_MS };
  }

  async getRates(base: string): Promise<Record<string, number> | null> {
    return (await this.getGlobalRateSnapshot(base))?.rates ?? null;
  }

  async refreshStoredRateBases(): Promise<void> {
    const rows = this.db.all<{ base_currency: string }>('SELECT base_currency FROM global_exchange_rate_snapshots');
    const bases = new Set(['EUR', ...rows.map((row) => upper(row.base_currency)).filter(isSupportedProviderCurrency)]);
    await Promise.all([...bases].map((base) => this.refreshGlobalRates(base)));
  }

  async resolveExchangeRate(tripId: string | number, itemCurrency: string): Promise<ExchangeRateResolution | null> {
    const trip = this.db.get<{ id: number; currency?: string | null }>(
      'SELECT id, currency FROM trips WHERE id = ?',
      tripId,
    );
    if (!trip) return null;
    const tripCurrency = upper(trip.currency);
    const currency = currencyCode(itemCurrency || tripCurrency);
    if (currency === tripCurrency) {
      return {
        trip_id: trip.id,
        trip_currency: tripCurrency,
        item_currency: currency,
        exchange_rate: 1,
        source: 'identity',
        source_version: `identity:${tripCurrency}`,
        effective_date: null,
        fetched_at: null,
        stale: false,
      };
    }
    const tripRate = this.db.get<{
      exchange_rate: number;
      effective_date: string | null;
      source_version: string;
      set_at: string;
    }>(
      `SELECT exchange_rate, effective_date, source_version, set_at
        FROM trip_exchange_rates WHERE trip_id = ? AND currency = ?`,
      trip.id,
      currency,
    );
    if (tripRate && positive(tripRate.exchange_rate)) {
      return {
        trip_id: trip.id,
        trip_currency: tripCurrency,
        item_currency: currency,
        exchange_rate: tripRate.exchange_rate,
        source: 'trip',
        source_version: tripRate.source_version,
        effective_date: tripRate.effective_date,
        fetched_at: tripRate.set_at,
        stale: false,
      };
    }
    const snapshot = await this.getGlobalRateSnapshot(tripCurrency);
    const exchangeRate = snapshot?.rates[currency];
    if (!snapshot || !positive(exchangeRate)) return null;
    return {
      trip_id: trip.id,
      trip_currency: tripCurrency,
      item_currency: currency,
      exchange_rate: exchangeRate,
      source: 'global',
      source_version: snapshot.source_version,
      effective_date: snapshot.effective_date,
      fetched_at: snapshot.fetched_at,
      stale: snapshot.stale,
    };
  }

  private applyProvenance(
    data: ExchangeRateWrite,
    rate: number,
    source: ExchangeRateSource,
    userId: number | undefined,
    sourceVersion: string,
    effectiveDate: string | null,
  ): void {
    Object.assign(data, {
      exchange_rate: rate,
      exchange_rate_source: source,
      exchange_rate_source_version: sourceVersion,
      exchange_rate_effective_date: effectiveDate,
      exchange_rate_set_at: new Date().toISOString(),
      exchange_rate_set_by_user_id: userId ?? null,
    });
  }

  async freezeRateForWrite(
    tripId: string | number,
    data: ExchangeRateWrite,
    userId?: number,
    existing?: { currency?: string | null; exchange_rate?: number } | null,
  ): Promise<void> {
    for (const field of [
      'exchange_rate_source',
      'exchange_rate_source_version',
      'exchange_rate_effective_date',
      'exchange_rate_set_at',
      'exchange_rate_set_by_user_id',
      'exchange_rate_reset_at',
    ] as const)
      delete (data as Record<string, unknown>)[field];
    const trip = this.db.get<{ currency?: string | null }>('SELECT currency FROM trips WHERE id = ?', tripId);
    if (!trip) return;
    const tripCurrency = upper(trip.currency);
    const currency = upper(data.currency === undefined ? existing?.currency : data.currency, tripCurrency);
    const oldCurrency = existing ? upper(existing.currency, tripCurrency) : null;
    if (currency === tripCurrency) {
      this.applyProvenance(data, 1, 'identity', userId, `identity:${tripCurrency}`, null);
      data.exchange_rate_note = null;
      return;
    }
    if (data.exchange_rate !== undefined) {
      if (!positive(data.exchange_rate))
        throw new InvalidExchangeRateError('exchange_rate must be finite and greater than zero');
      this.applyProvenance(data, data.exchange_rate, 'explicit', userId, `explicit:${randomUUID()}`, null);
      return;
    }
    if (existing && currency === oldCurrency) return;
    const resolution = await this.resolveExchangeRate(tripId, currency);
    if (!resolution) throw new ExchangeRateUnavailableError();
    this.applyProvenance(
      data,
      resolution.exchange_rate,
      resolution.source,
      userId,
      resolution.source_version,
      resolution.effective_date,
    );
  }

  listTripExchangeRates(tripId: string | number): unknown[] {
    return this.db.all(
      `SELECT trip_id, currency, exchange_rate, effective_date, source_version,
              set_at, set_by_user_id, note
       FROM trip_exchange_rates WHERE trip_id = ? ORDER BY currency`,
      tripId,
    );
  }

  setTripExchangeRate(
    tripId: string | number,
    currencyInput: string,
    exchangeRate: number,
    userId: number,
    note?: string | null,
  ): unknown {
    if (!positive(exchangeRate))
      throw new InvalidExchangeRateError('exchange_rate must be finite and greater than zero');
    const trip = this.db.get<{ currency?: string | null }>('SELECT currency FROM trips WHERE id = ?', tripId);
    if (!trip) return null;
    const currency = currencyCode(currencyInput);
    if (currency === upper(trip.currency))
      throw new InvalidExchangeRateError('The trip currency always uses a 1:1 identity rate');
    const now = new Date().toISOString();
    const version = `trip:${tripId}:${currency}:${now}`;
    this.db.run(
      `INSERT INTO trip_exchange_rates
         (trip_id, currency, exchange_rate, effective_date, source_version, set_at, set_by_user_id, note)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?)
       ON CONFLICT(trip_id, currency) DO UPDATE SET
         exchange_rate = excluded.exchange_rate, effective_date = NULL,
         source_version = excluded.source_version, set_at = excluded.set_at,
         set_by_user_id = excluded.set_by_user_id, note = excluded.note`,
      tripId,
      currency,
      exchangeRate,
      version,
      now,
      userId,
      note || null,
    );
    return (
      this.listTripExchangeRates(tripId).find((row) => (row as { currency?: string }).currency === currency) ?? null
    );
  }

  deleteTripExchangeRate(tripId: string | number, currencyInput: string): boolean {
    return (
      this.db.run(
        'DELETE FROM trip_exchange_rates WHERE trip_id = ? AND currency = ?',
        tripId,
        currencyCode(currencyInput),
      ).changes > 0
    );
  }

  cleanupExpiredExchangeRatePreviews(now = Date.now()): number {
    return this.db.run(
      'DELETE FROM exchange_rate_batch_previews WHERE created_at <= ?',
      sqliteTimestamp(now - PREVIEW_TTL_MS),
    ).changes;
  }

  private batchRows(tripId: string | number, currency: string): BatchRow[] {
    const expenses = this.db.all<Omit<BatchRow, 'type'>>(
      `SELECT id, total_price AS amount, currency, exchange_rate,
              exchange_rate_source AS source, exchange_rate_source_version AS source_version
       FROM budget_items WHERE trip_id = ? AND UPPER(COALESCE(currency, '')) = ?`,
      tripId,
      currency,
    );
    const settlements = this.db.all<Omit<BatchRow, 'type'>>(
      `SELECT id, amount, currency, exchange_rate,
              exchange_rate_source AS source, exchange_rate_source_version AS source_version
       FROM budget_settlements WHERE trip_id = ? AND UPPER(COALESCE(currency, '')) = ?`,
      tripId,
      currency,
    );
    return [
      ...expenses.map((row) => ({ type: 'expense' as const, ...row })),
      ...settlements.map((row) => ({ type: 'settlement' as const, ...row })),
    ];
  }

  private batchStateToken(tripId: string | number, currency: string): string {
    const tripRate =
      this.db.get(
        `SELECT exchange_rate, source_version, set_at FROM trip_exchange_rates
       WHERE trip_id = ? AND currency = ?`,
        tripId,
        currency,
      ) ?? null;
    return createHash('sha256')
      .update(JSON.stringify({ tripRate, rows: this.batchRows(tripId, currency) }))
      .digest('hex');
  }

  async previewTripExchangeRateUpdate(
    tripId: string | number,
    currencyInput: string,
    exchangeRate: number,
    userId: number,
    note?: string | null,
  ): Promise<unknown> {
    if (!positive(exchangeRate))
      throw new InvalidExchangeRateError('exchange_rate must be finite and greater than zero');
    const currency = currencyCode(currencyInput);
    const trip = this.db.get<{ currency?: string | null }>('SELECT currency FROM trips WHERE id = ?', tripId);
    if (!trip) throw new InvalidExchangeRateError('Trip not found');
    const tripCurrency = upper(trip.currency);
    if (currency === tripCurrency)
      throw new InvalidExchangeRateError('The trip currency always uses a 1:1 identity rate');
    this.cleanupExpiredExchangeRatePreviews();
    const snapshot = await this.getGlobalRateSnapshot(tripCurrency);
    const rows = this.batchRows(tripId, currency).map((row) => {
      const oldRate = positive(row.exchange_rate) ? row.exchange_rate : 1;
      const oldValue = effectiveTripValue(
        row.amount,
        row.currency,
        tripCurrency,
        oldRate,
        row.source,
        snapshot?.rates ?? null,
      );
      const newValue = row.amount / exchangeRate;
      const source = row.source || 'legacy';
      return {
        type: row.type,
        id: row.id,
        currency,
        amount: row.amount,
        old_exchange_rate: oldRate,
        new_exchange_rate: exchangeRate,
        old_trip_value: oldValue,
        new_trip_value: newValue,
        trip_value_delta: newValue - oldValue,
        source,
        selected: source === 'global' || source === 'trip',
      };
    });
    const previewId = randomUUID();
    const preview = { preview_id: previewId, trip_id: Number(tripId), currency, exchange_rate: exchangeRate, rows };
    this.db.run(
      `INSERT INTO exchange_rate_batch_previews
         (id, trip_id, currency, exchange_rate, note, state_token, preview_json, created_by_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      previewId,
      tripId,
      currency,
      exchangeRate,
      note || null,
      this.batchStateToken(tripId, currency),
      JSON.stringify(preview),
      userId,
      sqliteTimestamp(Date.now()),
    );
    return preview;
  }

  applyTripExchangeRateUpdate(
    tripId: string | number,
    previewId: string,
    selected: BatchSelection[],
    userId: number,
    expectedCurrency?: string,
  ): unknown {
    const stored = this.db.get<{
      currency: string;
      exchange_rate: number;
      note: string | null;
      state_token: string;
      preview_json: string;
      created_by_user_id: number;
      created_at: string;
    }>(
      `SELECT currency, exchange_rate, note, state_token, preview_json, created_by_user_id, created_at
        FROM exchange_rate_batch_previews WHERE id = ? AND trip_id = ?`,
      previewId,
      tripId,
    );
    if (!stored || stored.created_by_user_id !== userId)
      throw new InvalidExchangeRateError('Exchange-rate preview not found');
    const createdAt = Date.parse(`${stored.created_at.replace(' ', 'T')}Z`);
    if (!Number.isFinite(createdAt) || Date.now() - createdAt >= PREVIEW_TTL_MS) {
      this.db.run('DELETE FROM exchange_rate_batch_previews WHERE id = ?', previewId);
      throw new ExchangeRatePreviewExpiredError('Exchange-rate preview expired');
    }
    if (expectedCurrency && stored.currency !== upper(expectedCurrency)) {
      throw new InvalidExchangeRateError('Preview currency does not match the request');
    }
    if (this.batchStateToken(tripId, stored.currency) !== stored.state_token) {
      throw new ExchangeRateConflictError('Exchange-rate data changed after the preview');
    }
    const preview = JSON.parse(stored.preview_json) as { rows: Array<{ type: string; id: number }> };
    const allowed = new Set(preview.rows.map((row) => `${row.type}:${row.id}`));
    if (selected.some((row) => !allowed.has(`${row.type}:${row.id}`))) {
      throw new InvalidExchangeRateError('Selection contains an item outside this preview');
    }
    const now = new Date().toISOString();
    const sourceVersion = `trip:${tripId}:${stored.currency}:${now}`;
    this.db.transaction(() => {
      this.db.run(
        `INSERT INTO trip_exchange_rates
           (trip_id, currency, exchange_rate, effective_date, source_version, set_at, set_by_user_id, note)
         VALUES (?, ?, ?, NULL, ?, ?, ?, ?)
         ON CONFLICT(trip_id, currency) DO UPDATE SET
           exchange_rate = excluded.exchange_rate, effective_date = NULL,
           source_version = excluded.source_version, set_at = excluded.set_at,
           set_by_user_id = excluded.set_by_user_id, note = excluded.note`,
        tripId,
        stored.currency,
        stored.exchange_rate,
        sourceVersion,
        now,
        userId,
        stored.note || null,
      );
      for (const row of selected) {
        const table = row.type === 'expense' ? 'budget_items' : 'budget_settlements';
        this.db.run(
          `UPDATE ${table} SET
             exchange_rate = ?, exchange_rate_source = 'trip', exchange_rate_source_version = ?,
             exchange_rate_effective_date = NULL, exchange_rate_set_at = ?,
             exchange_rate_set_by_user_id = ?, exchange_rate_note = ?, exchange_rate_reset_at = ?
           WHERE id = ? AND trip_id = ? AND UPPER(COALESCE(currency, '')) = ?`,
          stored.exchange_rate,
          sourceVersion,
          now,
          userId,
          stored.note || null,
          now,
          row.id,
          tripId,
          stored.currency,
        );
      }
      this.db.run('DELETE FROM exchange_rate_batch_previews WHERE id = ?', previewId);
    });
    return {
      rate: this.listTripExchangeRates(tripId).find(
        (row) => (row as { currency?: string }).currency === stored.currency,
      ),
      updated: selected,
    };
  }
}
