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
 */

const TTL_MS = 6 * 60 * 60 * 1000; // 6h
const cache = new Map<string, { rates: Record<string, number>; ts: number }>();
const inflight = new Map<string, Promise<Record<string, number> | null>>();

async function fetchRates(base: string): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`https://api.frankfurter.dev/v2/rates?base=${encodeURIComponent(base)}`);
    if (!res.ok) return null;
    // Frankfurter returns an array of { date, base, quote, rate } and omits the
    // base's own self-rate, so seed the map with `base = 1` then index by quote.
    const data = (await res.json()) as Array<{ quote?: string; rate?: number }>;
    if (!Array.isArray(data)) return null;
    const rates: Record<string, number> = { [base.toUpperCase()]: 1 };
    for (const r of data) {
      if (r && typeof r.quote === 'string' && typeof r.rate === 'number') rates[r.quote] = r.rate;
    }
    return Object.keys(rates).length > 1 ? rates : null;
  } catch {
    return null;
  }
}

/** Rates map for `base` (cached). Returns null if unavailable. */
export async function getRates(base: string): Promise<Record<string, number> | null> {
  const key = (base || 'EUR').toUpperCase();
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && now - hit.ts < TTL_MS) return hit.rates;

  // Coalesce concurrent fetches for the same base.
  let p = inflight.get(key);
  if (!p) {
    p = fetchRates(key).then(rates => {
      if (rates) cache.set(key, { rates, ts: Date.now() });
      inflight.delete(key);
      return rates;
    });
    inflight.set(key, p);
  }
  const rates = await p;
  // On failure fall back to the last cached value if we have one.
  if (!rates && hit) return hit.rates;
  return rates;
}

/**
 * Convert `amount` from `from` currency into `base` using a rates map obtained
 * from getRates(base). Identity when same currency or the rate is missing.
 */
export function convertWithRates(
  amount: number,
  from: string | null | undefined,
  base: string,
  rates: Record<string, number> | null,
): number {
  const fromCur = (from || base).toUpperCase();
  const baseCur = base.toUpperCase();
  if (fromCur === baseCur || !rates) return amount;
  const r = rates[fromCur];
  if (!r || r <= 0) return amount;
  return amount / r;
}
