import { sumMinor } from '@trek/shared';

/**
 * Re-denominate whole trip-currency cents into whole display-currency cents
 * without losing or inventing one (#1382).
 *
 * Rounding every balance on its own lets the rounded set drift away from the sum
 * it came from: a squared-up trip viewed in another currency then shows a cent
 * that no payment flow can ever clear, and the drift moves whenever the live rate
 * does, money appearing without a single expense being touched. Rounding down
 * and handing the leftover to the largest fractions keeps Σ(converted) equal to
 * converted(Σ). `factor === 1` (the display currency IS the trip currency, the
 * common case) is the identity and never touches a float.
 */
/**
 * Add money in whole cents, not in floats (#1964).
 *
 * A total that does not divide evenly is split into parts that are each exact
 * to the cent (163.21 across two people is 81.61 and 81.60), but adding those
 * two doubles gives 163.20999999999998, and that is what got written back over
 * the clean total the client sent. It then surfaced anywhere the number is
 * printed without Intl doing the rounding: the expense form when reopened, the
 * mobile cost sheet, and the price stamped onto a linked booking.
 *
 * This is the same rule the settlement maths in budget.service.ts already follows
 * (toTripCents), applied to the one arithmetic that had been left in euros.
 */
export function sumMoney(amounts: number[]): number {
  return sumMinor(amounts) / 100;
}

/**
 * Convert a set of trip cents to display cents so that they still add up: floor
 * each one, then hand the cents lost to flooring to the largest fractions. `total`
 * is what the set has to sum to. By default that is the rounded conversion of its
 * own sum; the rows behind a figure pass the figure's already allocated cents
 * instead, so a list nested under a line lands exactly on that line.
 *
 * `unit` is the smallest step the currency is shown in, in cents (100 for won or
 * yen, else 1). The ledger keeps hundredths, but a set handed out in hundredths of
 * a won and rounded one by one on screen stops adding up (#2604). In the trip's own
 * currency the remainders are integers, so booking what is offered clears it.
 */
export function allocateDisplayCents(cents: number[], factor: number, total?: number, unit = 1): number[] {
  if (factor === 1 && unit === 1) return [...cents];
  const exact = cents.map((c) => (c * factor) / unit);
  const out = exact.map((v) => Math.floor(v));
  const target = total === undefined ? Math.round((cents.reduce((a, c) => a + c, 0) * factor) / unit) : total / unit;
  const drift = target - out.reduce((a, v) => a + v, 0);
  const byFraction = exact
    .map((v, i) => ({ i, frac: factor === 1 ? cents[i] - out[i] * unit : v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; k < drift && k < byFraction.length; k++) out[byFraction[k].i] += 1;
  return unit === 1 ? out : out.map((v) => v * unit);
}

/**
 * What `exchange_rate` holds on a row whose rate was never frozen. The column is
 * `REAL NOT NULL DEFAULT 1`, so without a migration 1 is the only way to store "no
 * rate". It is read in exactly two places, isFrozenRate and the repositories'
 * unfrozen predicate (BG89-BG92); nothing in budget.service.ts compares a rate with 1.
 */
export const NOT_FROZEN_RATE = 1;

/** Whether a stored rate is one that was frozen, rather than the "not frozen" sentinel. */
export function isFrozenRate(rate: number | null | undefined): rate is number {
  return rate != null && Number.isFinite(rate) && rate > 0 && rate !== NOT_FROZEN_RATE;
}

/**
 * How an amount of a row, in the row's own currency, becomes trip currency, or null when
 * nothing can convert it. The rate frozen when the row was entered wins (#1335), so a
 * booked expense keeps the value it was booked at. A row written before the freeze
 * existed (no frozen rate) converts through today's `rates`, units of each currency per
 * 1 of their base. Pre-rework rows store currency = NULL, which means the trip's own.
 *
 * A foreign row with neither is left out by every caller and reported, rather than read
 * as if it were already in the trip currency: 8,920,000 VND counted as that many dollars
 * swamps every balance on the trip.
 *
 * The settlement nets with it and every trip total adds up with it, so the two can never
 * read the same rows differently.
 */
export function tripConverter(
  itemCurrency: string | null | undefined,
  itemRate: number | null | undefined,
  tripCurrency: string,
  rates: Record<string, number> | null,
): ((amount: number) => number) | null {
  const cur = (itemCurrency || tripCurrency).toUpperCase();
  if (cur === tripCurrency) return (amount) => amount;
  if (isFrozenRate(itemRate)) return (amount) => amount / itemRate;
  const rCur = rates?.[cur];
  const rTrip = rates?.[tripCurrency];
  if (rCur && rCur > 0 && rTrip && rTrip > 0) return (amount) => (amount / rCur) * rTrip;
  return null;
}

/**
 * Units of `to` per 1 `from`, from a set of rates quoted against any base (each rate is
 * units of that currency per 1 base). Null when either quote is missing.
 */
export function quoteRatio(rates: Record<string, number> | null, to: string, from: string): number | null {
  const rTo = rates?.[to];
  const rFrom = rates?.[from];
  return rTo && rTo > 0 && rFrom && rFrom > 0 ? rTo / rFrom : null;
}
