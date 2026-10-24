import { useCallback, useEffect, useState } from 'react'
import type { BudgetFallbackFx } from '@trek/shared'
import { currencyDecimals } from '../utils/formatters'

/**
 * Live FX rates for the Costs panel, used to convert every amount into the user's
 * display currency. Fetches api.frankfurter.dev (no key, already CSP-allowlisted
 * for the dashboard widget) for the given base and caches per base in memory +
 * localStorage for a few hours. rates[X] = units of X per 1 base, so an amount in
 * currency C converts to base as `amount / rates[C]`.
 */

const TTL_MS = 6 * 60 * 60 * 1000 // 6h
// A hung request would otherwise hold every caller, the freeze-rates heal included,
// for as long as the browser keeps the socket open.
const FETCH_TIMEOUT_MS = 10_000
const mem = new Map<string, { rates: Record<string, number>; ts: number }>()

function readCache(base: string): { rates: Record<string, number>; ts: number } | null {
  const m = mem.get(base)
  if (m) return m
  try {
    const raw = localStorage.getItem('trek_fx_' + base)
    if (raw) {
      const parsed = JSON.parse(raw) as { rates: Record<string, number>; ts: number }
      if (parsed?.rates) { mem.set(base, parsed); return parsed }
    }
  } catch { /* ignore */ }
  return null
}

/**
 * Plain-function twin of the hook, for non-React callers (PDF export). Never
 * rejects: a fresh cache short-circuits, otherwise it fetches and caches; on
 * any failure it returns the stale cache if one exists, else null ("no rates" —
 * callers fall back to per-currency breakdowns rather than converting).
 */
export async function fetchExchangeRates(base: string): Promise<Record<string, number> | null> {
  const upper = (base || 'EUR').toUpperCase()
  const cached = readCache(upper)
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.rates
  // A controller rather than AbortSignal.timeout, which Safari only has from 16 on;
  // without it the call would throw and never fetch at all.
  const stop = new AbortController()
  const timer = setTimeout(() => stop.abort(), FETCH_TIMEOUT_MS)
  try {
    const d = await fetch(`https://api.frankfurter.dev/v2/rates?base=${encodeURIComponent(upper)}`, { signal: stop.signal })
      .then(r => r.json()) as Array<{ quote?: string; rate?: number }>
    if (!Array.isArray(d)) return cached?.rates ?? null
    // Frankfurter omits the base's own self-rate, so seed it with `base = 1`.
    const rates: Record<string, number> = { [upper]: 1 }
    for (const r of d) {
      if (r && typeof r.quote === 'string' && typeof r.rate === 'number') rates[r.quote] = r.rate
    }
    const entry = { rates, ts: Date.now() }
    mem.set(upper, entry)
    try { localStorage.setItem('trek_fx_' + upper, JSON.stringify(entry)) } catch { /* ignore */ }
    return rates
  } catch {
    return cached?.rates ?? null // offline → stale beats nothing
  } finally {
    clearTimeout(timer)
  }
}

/**
 * The cached rates for `base`, and only while they are fresh (younger than the TTL). This is
 * the table the client lends the server to freeze a rate with (`fallback_fx`): a stale one
 * would pin a figure from another day on the row for good.
 */
export function freshRates(base: string): Record<string, number> | null {
  const cached = readCache((base || 'EUR').toUpperCase())
  return cached && Date.now() - cached.ts < TTL_MS ? cached.rates : null
}

/** `freshRates`, fetching first when the cache is not fresh. Null when the fetch fails too. */
export async function fetchFreshRates(base: string): Promise<Record<string, number> | null> {
  await fetchExchangeRates(base)
  return freshRates(base)
}

const CURRENCY_CODE = /^[A-Z]{3}$/

/**
 * Whether a rate is one the server's contract takes (budget.schema.ts): finite and from
 * 1e-9 to 1e9, for a lent `fallback_fx` rate as for the settlement's `base_rate`. Anything
 * else fails the whole request with a 400, so the client leaves it out instead.
 */
export function isSendableRate(rate: number | null | undefined): rate is number {
  return rate != null && Number.isFinite(rate) && rate >= 1e-9 && rate <= 1e9
}

/**
 * `data` with its currency's rate against the trip currency lent alongside, for a write the
 * server freezes a rate on (an expense, a transfer). The server prefers its own rate and
 * uses this one only when it has none, which is the setup where its fetch fails and the
 * browser's does not. Sent only for a currency foreign to the trip with a fresh quote in
 * the cache, and never beside an explicit `exchange_rate`; anything else comes back as it
 * was. A rate outside what the contract accepts would fail the whole write, so it is left out.
 */
export function withFallbackFx<T extends { currency?: string | null; exchange_rate?: number | null }>(
  data: T,
  tripCurrency: string | null | undefined,
): T & { fallback_fx?: BudgetFallbackFx } {
  const trip = (tripCurrency || '').toUpperCase()
  const cur = (data.currency || '').toUpperCase()
  if (!CURRENCY_CODE.test(trip) || !CURRENCY_CODE.test(cur) || cur === trip || data.exchange_rate != null) return data
  const rate = freshRates(trip)?.[cur]
  if (!isSendableRate(rate)) return data
  return { ...data, fallback_fx: { base: trip, rates: { [cur]: rate } } }
}

/**
 * Convert a booked amount the way the server's settlement does (#1335, #1445): the FX
 * rate frozen when the expense or transfer was entered wins over today's rate, so a cost
 * keeps the value it was booked at instead of drifting with the market. The frozen rate is
 * "units of the row's currency per 1 *trip* currency", which is why the amount goes to the
 * trip currency first and only then, live, to whatever currency the viewer reads in.
 *
 * That holds for an amount in the viewer's own currency too. A bill of 801.76 USD on a euro
 * trip is booked at 685.26 EUR, and a viewer reading in dollars sees those euros at today's
 * rate, which is what the balances and settle-up offer them as well (#2525). With the
 * conversion anchored on the trip currency (useExchangeRates' second argument) that is
 * the bill exactly as typed until the rate moves; after that it is what the bill counts
 * as, and convertedLine explains the difference.
 *
 * `convertLive` is the hook's own `convert`. Passing it in keeps this a plain function that
 * both shells and the PDF can share, rather than three copies of the same three branches.
 */
export function convertBooked(
  amount: number,
  rowCurrency: string | null | undefined,
  frozenRate: number | null | undefined,
  tripCurrency: string,
  convertLive: (amount: number, from: string | null | undefined) => number,
): number {
  const trip = (tripCurrency || 'EUR').toUpperCase()
  const inTrip = bookedInTrip(amount, rowCurrency, frozenRate, trip)
  if (inTrip != null) return convertLive(inTrip, trip)
  // A NULL currency means the trip's own, and then there was never anything to freeze.
  return convertLive(amount, (rowCurrency || trip).toUpperCase())
}

/**
 * The amount a row was booked at in the trip currency, when it was booked through one: a
 * foreign currency with a frozen rate. Null for a row in the trip currency, and for one
 * written before the freeze existed. A rate of exactly 1 is the column default, not a booked
 * rate, and those rows still convert live, as they always did.
 *
 * The lists print it between the amount entered and the amount shown, so a row whose value
 * moved with the rate shows where the move came from instead of a figure nobody typed.
 */
export function bookedInTrip(
  amount: number,
  rowCurrency: string | null | undefined,
  frozenRate: number | null | undefined,
  tripCurrency: string,
): number | null {
  const trip = (tripCurrency || 'EUR').toUpperCase()
  const cur = (rowCurrency || trip).toUpperCase()
  if (cur === trip) return null
  if (frozenRate != null && frozenRate > 0 && frozenRate !== 1) return amount / frozenRate
  return null
}

/**
 * What an amount of a row counts as in the trip currency, the figure the settlement nets:
 * the booked amount for a row booked through the trip currency, the amount itself for one
 * in it, and today's rate for a foreign row that never froze one, the way the server
 * counts that row too.
 */
export function tripAmountOf(
  amount: number,
  rowCurrency: string | null | undefined,
  frozenRate: number | null | undefined,
  tripCurrency: string,
  convertLive: (amount: number, from: string | null | undefined) => number,
): number {
  const trip = (tripCurrency || 'EUR').toUpperCase()
  const inTrip = bookedInTrip(amount, rowCurrency, frozenRate, trip)
  if (inTrip != null) return inTrip
  const cur = (rowCurrency || trip).toUpperCase()
  if (cur === trip) return amount
  const perTrip = convertLive(1, trip)
  return perTrip > 0 ? convertLive(amount, cur) / perTrip : amount
}

/** An amount and the currency it is in. */
export interface MoneyPart { amount: number; currency: string }

/**
 * The line under an amount the lists show converted (#2525): what was entered, then where
 * it went. For a row booked through the trip currency that is the booked trip amount,
 * "$801.76 -> 685,26 EUR", since the display value beside it already shows the last step.
 * Any other foreign row goes straight to the display value, "100,00 EUR -> $113.98".
 *
 * Null when there is nothing to explain: a row in the display currency that still reads
 * as typed, or an amount of 0. `shown` is the display value printed beside the line.
 * Every list uses it, so the desktop and phone shells and the shared page can never
 * explain the same row two ways.
 */
export function convertedLine(
  amount: number,
  rowCurrency: string | null | undefined,
  frozenRate: number | null | undefined,
  tripCurrency: string,
  displayCurrency: string,
  shown: number,
): { entered: MoneyPart; into: MoneyPart } | null {
  const trip = (tripCurrency || 'EUR').toUpperCase()
  const display = (displayCurrency || trip).toUpperCase()
  const cur = (rowCurrency || trip).toUpperCase()
  const entered = { amount, currency: cur }
  const inTrip = display !== trip && amount !== 0 ? bookedInTrip(amount, cur, frozenRate, trip) : null
  if (inTrip != null) {
    const unit = 10 ** currencyDecimals(display)
    if (cur === display && Math.round(shown * unit) === Math.round(amount * unit)) return null
    return { entered, into: { amount: inTrip, currency: trip } }
  }
  return cur === display ? null : { entered, into: { amount: shown, currency: display } }
}

/** Test-only: the module-level cache outlives a vitest file's individual tests. */
export function clearExchangeRateCache(): void {
  mem.clear()
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('trek_fx_')) localStorage.removeItem(k)
    }
  } catch { /* ignore */ }
}

/** Rates for one base, from the cache first and then the network; null for no base. */
function useRatesFor(base: string | null): Record<string, number> | null {
  const [rates, setRates] = useState<Record<string, number> | null>(() => (base ? readCache(base)?.rates ?? null : null))

  useEffect(() => {
    if (!base) { setRates(null); return }
    const cached = readCache(base)
    if (cached) setRates(cached.rates)
    if (cached && Date.now() - cached.ts < TTL_MS) return
    let cancelled = false
    void fetchExchangeRates(base).then(r => {
      if (!cancelled && r) setRates(r)
    })
    return () => { cancelled = true }
  }, [base])

  return rates
}

/**
 * Units of `to` per 1 `from`, from rates quoted against any base (each rate is units of
 * that currency per 1 base). Null when either quote is missing.
 */
export function crossRate(rates: Record<string, number> | null | undefined, to: string, from: string): number | null {
  const rTo = rates?.[to]
  const rFrom = rates?.[from]
  return rTo && rTo > 0 && rFrom && rFrom > 0 ? rTo / rFrom : null
}

/**
 * `tripCurrency`, when given, anchors the conversion on the trip currency's own quote
 * (#2525). That is the quote the server froze every entry rate from and converts the
 * settlement with, so an amount booked through the trip currency comes back exactly as
 * entered while the rate has not moved. The display currency's own quote is a separately
 * rounded figure, not the exact inverse: through it a same-day 12,345.67 USD bill on a
 * euro trip read as $12,346.05. Both quotes are cached like any other, so the anchor works
 * offline too; the display quote only stands in while the trip's is missing.
 */
export function useExchangeRates(base: string, tripCurrency?: string | null) {
  const upper = (base || 'EUR').toUpperCase()
  const anchor = (tripCurrency || upper).toUpperCase()
  const rates = useRatesFor(upper)
  const anchorRates = useRatesFor(anchor === upper ? null : anchor)

  const convert = useCallback(
    (amount: number, from: string | null | undefined): number => {
      const f = (from || upper).toUpperCase()
      if (f === upper) return amount
      const viaAnchor = crossRate(anchorRates, upper, f)
      if (viaAnchor != null) return amount * viaAnchor
      const r = rates?.[f]
      return r && r > 0 ? amount / r : amount
    },
    [rates, anchorRates, upper],
  )

  // Units of the display currency per 1 trip currency, from the same quotes `convert` uses.
  // The settlement takes it as `base_rate` to answer in the display currency when the
  // server has no quote of its own. Null while neither quote is known, and null for a
  // figure the settlement query refuses (a trip in XAU shown in IRR runs past 1e9): sent
  // along, it would fail the whole read with a 400, healthy server or not.
  const perTrip = rates?.[anchor]
  const quoted = anchor === upper
    ? 1
    : crossRate(anchorRates, upper, anchor) ?? (perTrip && perTrip > 0 ? 1 / perTrip : null)
  const displayPerTrip = isSendableRate(quoted) ? quoted : null

  return { rates, convert, displayPerTrip }
}
