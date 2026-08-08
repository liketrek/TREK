import { createHash, randomUUID } from 'node:crypto';
import { db } from '../db/database';

export type ExchangeRateSource = 'identity' | 'global' | 'trip' | 'manual' | 'legacy';

export interface GlobalRateSnapshot {
  base_currency: string;
  rates: Record<string, number>;
  source_version: string;
  effective_date: string | null;
  fetched_at: string;
  stale: boolean;
}

export interface ExchangeRateQuote {
  quote_id: string;
  trip_id: number;
  trip_currency: string;
  item_currency: string;
  exchange_rate: number;
  source: ExchangeRateSource;
  source_version: string;
  effective_date: string | null;
  fetched_at: string | null;
  stale: boolean;
}

export interface ExchangeRateWrite {
  currency?: string | null;
  exchange_rate?: number;
  quote_id?: string;
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

export class InvalidExchangeRateError extends Error { readonly status = 400; }
export class ExchangeRateConflictError extends Error { readonly status = 409; }

const TTL_MS = 6 * 60 * 60 * 1000;
const inflight = new Map<string, Promise<GlobalRateSnapshot | null>>();

const upper = (currency: string | null | undefined, fallback = 'EUR') =>
  (currency || fallback).trim().toUpperCase();

function isPositiveFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function currencyCode(value: string): string {
  const code = upper(value);
  if (!/^[A-Z]{3}$/.test(code)) throw new InvalidExchangeRateError('currency must be a three-letter ISO code');
  return code;
}

function readSnapshot(base: string): GlobalRateSnapshot | null {
  const row = db.prepare(`
    SELECT base_currency, rates_json, source_version, effective_date, fetched_at
    FROM global_exchange_rate_snapshots WHERE base_currency = ?
  `).get(base) as {
    base_currency: string;
    rates_json: string;
    source_version: string;
    effective_date: string | null;
    fetched_at: string;
  } | undefined;
  if (!row) return null;
  try {
    const rates = JSON.parse(row.rates_json) as Record<string, number>;
    return {
      base_currency: row.base_currency,
      rates,
      source_version: row.source_version,
      effective_date: row.effective_date,
      fetched_at: row.fetched_at,
      stale: Date.now() - Date.parse(row.fetched_at) >= TTL_MS,
    };
  } catch {
    return null;
  }
}

async function fetchProviderSnapshot(base: string): Promise<GlobalRateSnapshot | null> {
  try {
    const response = await fetch(`https://api.frankfurter.dev/v2/rates?base=${encodeURIComponent(base)}`);
    if (!response.ok) return null;
    const payload = (await response.json()) as Array<{ date?: string; base?: string; quote?: string; rate?: number }>;
    if (!Array.isArray(payload)) return null;
    const rates: Record<string, number> = { [base]: 1 };
    let effectiveDate: string | null = null;
    for (const entry of payload) {
      if (!entry || typeof entry.quote !== 'string' || !isPositiveFinite(entry.rate)) continue;
      rates[entry.quote.toUpperCase()] = entry.rate;
      if (entry.date && (!effectiveDate || entry.date > effectiveDate)) effectiveDate = entry.date;
    }
    if (Object.keys(rates).length === 1) return null;
    const fetchedAt = new Date().toISOString();
    const sourceVersion = `frankfurter:${effectiveDate || fetchedAt}`;
    db.prepare(`
      INSERT INTO global_exchange_rate_snapshots
        (base_currency, rates_json, source_version, effective_date, fetched_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(base_currency) DO UPDATE SET
        rates_json = excluded.rates_json,
        source_version = excluded.source_version,
        effective_date = excluded.effective_date,
        fetched_at = excluded.fetched_at
    `).run(base, JSON.stringify(rates), sourceVersion, effectiveDate, fetchedAt);
    return { base_currency: base, rates, source_version: sourceVersion, effective_date: effectiveDate, fetched_at: fetchedAt, stale: false };
  } catch {
    return null;
  }
}

/** Persist a fresh provider snapshot, falling back to the last successful one. */
export async function refreshGlobalRates(baseCurrency = 'EUR'): Promise<GlobalRateSnapshot | null> {
  const base = upper(baseCurrency);
  let pending = inflight.get(base);
  if (!pending) {
    pending = fetchProviderSnapshot(base).then(snapshot => {
      inflight.delete(base);
      return snapshot || readSnapshot(base);
    });
    inflight.set(base, pending);
  }
  return pending;
}

/** Server-authoritative snapshot. Browser/product callers never contact the provider. */
export async function getGlobalRateSnapshot(baseCurrency = 'EUR'): Promise<GlobalRateSnapshot | null> {
  const base = upper(baseCurrency);
  const stored = readSnapshot(base);
  if (stored && !stored.stale) return stored;
  const refreshed = await refreshGlobalRates(base);
  if (!refreshed) return stored;
  return { ...refreshed, stale: Date.now() - Date.parse(refreshed.fetched_at) >= TTL_MS };
}

/** Compatibility surface used by settlement, MCP and plugins. */
export async function getRates(base: string): Promise<Record<string, number> | null> {
  return (await getGlobalRateSnapshot(base))?.rates ?? null;
}

export async function refreshStoredRateBases(): Promise<void> {
  const rows = db.prepare('SELECT base_currency FROM global_exchange_rate_snapshots').all() as { base_currency: string }[];
  const bases = new Set(['EUR', ...rows.map(row => row.base_currency)]);
  await Promise.all([...bases].map(base => refreshGlobalRates(base)));
}

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
  return isPositiveFinite(rate) ? amount / rate : amount;
}

function insertQuote(quote: Omit<ExchangeRateQuote, 'quote_id'>): ExchangeRateQuote {
  const quote_id = randomUUID();
  db.prepare(`
    INSERT INTO exchange_rate_quotes
      (id, trip_id, trip_currency, item_currency, exchange_rate, source, source_version,
       effective_date, fetched_at, stale)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    quote_id, quote.trip_id, quote.trip_currency, quote.item_currency, quote.exchange_rate,
    quote.source, quote.source_version, quote.effective_date, quote.fetched_at, quote.stale ? 1 : 0,
  );
  return { quote_id, ...quote };
}

/** Resolve identity → trip default → durable global snapshot and persist an immutable quote. */
export async function resolveExchangeRate(tripId: string | number, itemCurrency: string): Promise<ExchangeRateQuote | null> {
  const trip = db.prepare('SELECT id, currency FROM trips WHERE id = ?').get(tripId) as { id: number; currency?: string | null } | undefined;
  if (!trip) return null;
  const tripCurrency = upper(trip.currency);
  const currency = currencyCode(itemCurrency || tripCurrency);
  if (currency === tripCurrency) {
    return insertQuote({
      trip_id: trip.id,
      trip_currency: tripCurrency,
      item_currency: currency,
      exchange_rate: 1,
      source: 'identity',
      source_version: `identity:${tripCurrency}`,
      effective_date: null,
      fetched_at: null,
      stale: false,
    });
  }

  const tripRate = db.prepare(`
    SELECT exchange_rate, effective_date, source_version, set_at
    FROM trip_exchange_rates WHERE trip_id = ? AND currency = ?
  `).get(trip.id, currency) as {
    exchange_rate: number;
    effective_date: string | null;
    source_version: string;
    set_at: string;
  } | undefined;
  if (tripRate && isPositiveFinite(tripRate.exchange_rate)) {
    return insertQuote({
      trip_id: trip.id,
      trip_currency: tripCurrency,
      item_currency: currency,
      exchange_rate: tripRate.exchange_rate,
      source: 'trip',
      source_version: tripRate.source_version,
      effective_date: tripRate.effective_date,
      fetched_at: tripRate.set_at,
      stale: false,
    });
  }

  const snapshot = await getGlobalRateSnapshot(tripCurrency);
  const exchangeRate = snapshot?.rates[currency];
  if (!snapshot || !isPositiveFinite(exchangeRate)) return null;
  return insertQuote({
    trip_id: trip.id,
    trip_currency: tripCurrency,
    item_currency: currency,
    exchange_rate: exchangeRate,
    source: 'global',
    source_version: snapshot.source_version,
    effective_date: snapshot.effective_date,
    fetched_at: snapshot.fetched_at,
    stale: snapshot.stale,
  });
}

function readQuote(id: string): ExchangeRateQuote | null {
  const row = db.prepare(`
    SELECT id, trip_id, trip_currency, item_currency, exchange_rate, source, source_version,
           effective_date, fetched_at, stale
    FROM exchange_rate_quotes WHERE id = ?
  `).get(id) as any;
  if (!row) return null;
  return { quote_id: row.id, ...row, stale: Boolean(row.stale) } as ExchangeRateQuote;
}

function applyProvenance(
  data: ExchangeRateWrite,
  rate: number,
  source: ExchangeRateSource,
  userId: number | undefined,
  sourceVersion: string,
  effectiveDate: string | null,
): void {
  data.exchange_rate = rate;
  data.exchange_rate_source = source;
  data.exchange_rate_source_version = sourceVersion;
  data.exchange_rate_effective_date = effectiveDate;
  data.exchange_rate_set_at = new Date().toISOString();
  data.exchange_rate_set_by_user_id = userId ?? null;
}

/** Freeze the exact quote/manual value used by an expense or settlement write. */
export async function freezeRateForWrite(
  tripId: string | number,
  data: ExchangeRateWrite,
  userId?: number,
  existing?: { currency?: string | null; exchange_rate?: number } | null,
): Promise<void> {
  const trip = db.prepare('SELECT currency FROM trips WHERE id = ?').get(tripId) as { currency?: string | null } | undefined;
  if (!trip) return;
  const tripCurrency = upper(trip.currency);
  const requestedCurrency = data.currency === undefined ? existing?.currency : data.currency;
  const currency = upper(requestedCurrency, tripCurrency);
  const oldCurrency = existing ? upper(existing.currency, tripCurrency) : null;
  const currencyChanged = oldCurrency !== null && currency !== oldCurrency;

  if (currency === tripCurrency) {
    applyProvenance(data, 1, 'identity', userId, `identity:${tripCurrency}`, null);
    data.exchange_rate_note = null;
    return;
  }

  if (data.exchange_rate !== undefined) {
    if (!isPositiveFinite(data.exchange_rate)) throw new InvalidExchangeRateError('exchange_rate must be finite and greater than zero');
    applyProvenance(data, data.exchange_rate, 'manual', userId, `manual:${randomUUID()}`, null);
    return;
  }

  if (data.quote_id) {
    const quote = readQuote(data.quote_id);
    if (!quote || quote.trip_id !== Number(tripId) || quote.trip_currency !== tripCurrency || quote.item_currency !== currency) {
      throw new InvalidExchangeRateError('The exchange-rate quote does not match this trip and currency');
    }
    applyProvenance(data, quote.exchange_rate, quote.source, userId, quote.source_version, quote.effective_date);
    return;
  }

  // Ordinary edits preserve the frozen rate unless the currency changed.
  if (existing && !currencyChanged) return;

  const quote = await resolveExchangeRate(tripId, currency);
  if (!quote) throw new ExchangeRateUnavailableError();
  applyProvenance(data, quote.exchange_rate, quote.source, userId, quote.source_version, quote.effective_date);
}

export function listTripExchangeRates(tripId: string | number) {
  return db.prepare(`
    SELECT trip_id, currency, exchange_rate, effective_date, source_version,
           set_at, set_by_user_id, note
    FROM trip_exchange_rates WHERE trip_id = ? ORDER BY currency
  `).all(tripId);
}

export function setTripExchangeRate(
  tripId: string | number,
  currencyInput: string,
  exchangeRate: number,
  userId: number,
  note?: string | null,
) {
  if (!isPositiveFinite(exchangeRate)) throw new InvalidExchangeRateError('exchange_rate must be finite and greater than zero');
  const trip = db.prepare('SELECT currency FROM trips WHERE id = ?').get(tripId) as { currency?: string | null } | undefined;
  if (!trip) return null;
  const currency = currencyCode(currencyInput);
  if (currency === upper(trip.currency)) throw new InvalidExchangeRateError('The trip currency always uses a 1:1 identity rate');
  const now = new Date().toISOString();
  const version = `trip:${tripId}:${currency}:${now}`;
  db.prepare(`
    INSERT INTO trip_exchange_rates
      (trip_id, currency, exchange_rate, effective_date, source_version, set_at, set_by_user_id, note)
    VALUES (?, ?, ?, NULL, ?, ?, ?, ?)
    ON CONFLICT(trip_id, currency) DO UPDATE SET
      exchange_rate = excluded.exchange_rate,
      effective_date = NULL,
      source_version = excluded.source_version,
      set_at = excluded.set_at,
      set_by_user_id = excluded.set_by_user_id,
      note = excluded.note
  `).run(tripId, currency, exchangeRate, version, now, userId, note || null);
  return listTripExchangeRates(tripId).find((row: any) => row.currency === currency) || null;
}

export function deleteTripExchangeRate(tripId: string | number, currencyInput: string): boolean {
  return db.prepare('DELETE FROM trip_exchange_rates WHERE trip_id = ? AND currency = ?')
    .run(tripId, currencyCode(currencyInput)).changes > 0;
}

type BatchSelection = { type: 'expense' | 'settlement'; id: number };

function batchRows(tripId: string | number, currency: string) {
  const expenses = db.prepare(`
    SELECT id, total_price AS amount, currency, exchange_rate,
           exchange_rate_source AS source, exchange_rate_source_version AS source_version
    FROM budget_items WHERE trip_id = ? AND UPPER(COALESCE(currency, '')) = ?
  `).all(tripId, currency) as any[];
  const settlements = db.prepare(`
    SELECT id, amount, currency, exchange_rate,
           exchange_rate_source AS source, exchange_rate_source_version AS source_version
    FROM budget_settlements WHERE trip_id = ? AND UPPER(COALESCE(currency, '')) = ?
  `).all(tripId, currency) as any[];
  return [
    ...expenses.map(row => ({ type: 'expense' as const, ...row })),
    ...settlements.map(row => ({ type: 'settlement' as const, ...row })),
  ];
}

function batchStateToken(tripId: string | number, currency: string): string {
  const tripRate = db.prepare(`
    SELECT exchange_rate, source_version, set_at FROM trip_exchange_rates
    WHERE trip_id = ? AND currency = ?
  `).get(tripId, currency) || null;
  return createHash('sha256').update(JSON.stringify({ tripRate, rows: batchRows(tripId, currency) })).digest('hex');
}

export function previewTripExchangeRateUpdate(
  tripId: string | number,
  currencyInput: string,
  exchangeRate: number,
  userId: number,
  note?: string | null,
) {
  if (!isPositiveFinite(exchangeRate)) throw new InvalidExchangeRateError('exchange_rate must be finite and greater than zero');
  const currency = currencyCode(currencyInput);
  const trip = db.prepare('SELECT currency FROM trips WHERE id = ?').get(tripId) as { currency?: string | null } | undefined;
  if (!trip) throw new InvalidExchangeRateError('Trip not found');
  if (currency === upper(trip.currency)) throw new InvalidExchangeRateError('The trip currency always uses a 1:1 identity rate');
  const rows = batchRows(tripId, currency).map(row => {
    const oldRate = isPositiveFinite(row.exchange_rate) ? row.exchange_rate : 1;
    const oldValue = row.amount / oldRate;
    const newValue = row.amount / exchangeRate;
    const source = (row.source || 'legacy') as ExchangeRateSource;
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
  const stateToken = batchStateToken(tripId, currency);
  const preview = { preview_id: previewId, trip_id: Number(tripId), currency, exchange_rate: exchangeRate, rows };
  db.prepare(`
    INSERT INTO exchange_rate_batch_previews
      (id, trip_id, currency, exchange_rate, note, state_token, preview_json, created_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(previewId, tripId, currency, exchangeRate, note || null, stateToken, JSON.stringify(preview), userId);
  return preview;
}

export function applyTripExchangeRateUpdate(
  tripId: string | number,
  previewId: string,
  selected: BatchSelection[],
  userId: number,
  expectedCurrency?: string,
) {
  const stored = db.prepare(`
    SELECT currency, exchange_rate, note, state_token, preview_json, created_by_user_id
    FROM exchange_rate_batch_previews WHERE id = ? AND trip_id = ?
  `).get(previewId, tripId) as any;
  if (!stored || stored.created_by_user_id !== userId) throw new InvalidExchangeRateError('Exchange-rate preview not found');
  if (expectedCurrency && stored.currency !== upper(expectedCurrency)) {
    throw new InvalidExchangeRateError('Preview currency does not match the request');
  }
  if (batchStateToken(tripId, stored.currency) !== stored.state_token) {
    throw new ExchangeRateConflictError('Exchange-rate data changed after the preview');
  }
  const preview = JSON.parse(stored.preview_json) as { rows: Array<{ type: string; id: number }> };
  const allowed = new Set(preview.rows.map(row => `${row.type}:${row.id}`));
  if (selected.some(row => !allowed.has(`${row.type}:${row.id}`))) {
    throw new InvalidExchangeRateError('Selection contains an item outside this preview');
  }
  const now = new Date().toISOString();
  const sourceVersion = `trip:${tripId}:${stored.currency}:${now}`;
  db.transaction(() => {
    db.prepare(`
      INSERT INTO trip_exchange_rates
        (trip_id, currency, exchange_rate, effective_date, source_version, set_at, set_by_user_id, note)
      VALUES (?, ?, ?, NULL, ?, ?, ?, ?)
      ON CONFLICT(trip_id, currency) DO UPDATE SET
        exchange_rate = excluded.exchange_rate,
        effective_date = NULL,
        source_version = excluded.source_version,
        set_at = excluded.set_at,
        set_by_user_id = excluded.set_by_user_id,
        note = excluded.note
    `).run(tripId, stored.currency, stored.exchange_rate, sourceVersion, now, userId, stored.note || null);

    for (const row of selected) {
      const table = row.type === 'expense' ? 'budget_items' : 'budget_settlements';
      db.prepare(`
        UPDATE ${table} SET
          exchange_rate = ?, exchange_rate_source = 'trip',
          exchange_rate_source_version = ?, exchange_rate_effective_date = NULL,
          exchange_rate_set_at = ?, exchange_rate_set_by_user_id = ?,
          exchange_rate_note = ?, exchange_rate_reset_at = ?
        WHERE id = ? AND trip_id = ? AND UPPER(COALESCE(currency, '')) = ?
      `).run(stored.exchange_rate, sourceVersion, now, userId, stored.note || null, now, row.id, tripId, stored.currency);
    }
    db.prepare('DELETE FROM exchange_rate_batch_previews WHERE id = ?').run(previewId);
  })();
  return { rate: listTripExchangeRates(tripId).find((row: any) => row.currency === stored.currency), updated: selected };
}
