import { Injectable } from '@nestjs/common';

/**
 * Live exchange rates for the Costs/Budget money conversion.
 *
 * Fetches from api.frankfurter.dev (no key, already CSP-allowlisted for the
 * dashboard widget) and caches per base currency in-memory for a few hours so a
 * settlement request never hammers the upstream. Rates are "units of X per 1
 * base", so an amount in currency C converts to base as `amount / rates[C]`.
 *
 * Everything degrades gracefully: if the fetch fails (offline, upstream down),
 * callers get `null`/identity conversion and amounts are treated as already in
 * the base currency rather than throwing.
 *
 * Moved from the legacy `services/exchangeRateService.ts` (the budget-domain
 * fold): identical cache/coalescing behavior, `||` falsy-coercion defaults and
 * null degradation. The cache and inflight maps are deliberately MODULE-scoped,
 * not instance fields — the DI singleton and the out-of-container instances
 * (the trips/airtrail/auth bridges each construct their own) wrap the same
 * upstream feed, so they must share one cache (same reasoning as the
 * permissions-cache.ts cache).
 *
 * Post-migration fixes on top of the relocated legacy behavior: the outbound
 * fetch carries an AbortSignal timeout and a response-size cap, the response is
 * boundary-validated instead of `as`-cast, failures are logged instead of
 * silently swallowed (callers still get null), and the inflight cleanup is
 * rejection-proof. Kept on purpose: the stale-cache fallback on upstream
 * failure (stale beats nothing) and the ">1 keys" empty-response heuristic.
 */

const TTL_MS = 6 * 60 * 60 * 1000; // 6h
const FETCH_TIMEOUT_MS = 10_000;
// Frankfurter quotes a few dozen currencies (~2 KB); anything near this cap is
// not the API we think it is.
const MAX_RESPONSE_BYTES = 1024 * 1024;
const cache = new Map<string, { rates: Record<string, number>; ts: number }>();
const inflight = new Map<string, Promise<Record<string, number> | null>>();

const isRateEntry = (v: unknown): v is { quote: string; rate: number } =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as { quote?: unknown }).quote === 'string' &&
  typeof (v as { rate?: unknown }).rate === 'number';

async function fetchRates(base: string): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`https://api.frankfurter.dev/v2/rates?base=${encodeURIComponent(base)}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.length > MAX_RESPONSE_BYTES) return null;
    // Frankfurter returns an array of { date, base, quote, rate } and omits the
    // base's own self-rate, so seed the map with `base = 1` then index by quote.
    const data: unknown = JSON.parse(text);
    if (!Array.isArray(data)) return null;
    const rates: Record<string, number> = { [base.toUpperCase()]: 1 };
    for (const r of data) {
      if (isRateEntry(r)) rates[r.quote] = r.rate;
    }
    return Object.keys(rates).length > 1 ? rates : null;
  } catch (err) {
    console.error('[exchange-rates] rates fetch failed for', base, err);
    return null;
  }
}

@Injectable()
export class ExchangeRatesService {
  /** Rates map for `base` (cached). Returns null if unavailable. */
  async getRates(base: string): Promise<Record<string, number> | null> {
    const key = (base || 'EUR').toUpperCase();
    const hit = cache.get(key);
    const now = Date.now();
    if (hit && now - hit.ts < TTL_MS) return hit.rates;

    // Coalesce concurrent fetches for the same base.
    let p = inflight.get(key);
    if (!p) {
      p = fetchRates(key)
        .then((rates) => {
          if (rates) cache.set(key, { rates, ts: Date.now() });
          return rates;
        })
        .finally(() => {
          inflight.delete(key);
        });
      inflight.set(key, p);
    }
    const rates = await p;
    // On failure fall back to the last cached value if we have one.
    if (!rates && hit) return hit.rates;
    return rates;
  }
}
