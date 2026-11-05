import { currencyDecimals, splitEqualShares, sumMinor, toMinor } from '@trek/shared';

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
function allocateDisplayCents(cents: number[], factor: number, total?: number, unit = 1): number[] {
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
 * A custom split's member amounts as trip cents that add up to what the payers were
 * credited. Converting each amount on its own rounds each one to a cent, so four
 * quarters of a 136,000 ISK bill came to 4 x 249.38 = 997.52 EUR against the 997.51
 * the payer was credited: every such bill left the balances a cent off zero, a cent
 * the settle-up list then had no payment for. When the amounts add up to the payers'
 * total in the bill's own currency, as the write path insists, they are allocated
 * against `creditCents` by largest remainder, ties to the lower user id. A split that
 * does not add up (rows from before that check) still converts member by member.
 */
export function customSplitCents(
  members: readonly { user_id: number; amount?: number | null }[],
  convert: (amount: number) => number,
  creditCents: number,
  paidMinor: number,
): Record<number, number> {
  const shares: Record<number, number> = {};
  const own = members.map((m) => m.amount ?? 0);
  if (members.length === 0) return shares;
  if (sumMinor(own) !== paidMinor) {
    members.forEach((m, i) => (shares[m.user_id] = toMinor(convert(own[i]))));
    return shares;
  }
  const exact = own.map((amount) => convert(amount) * 100);
  const cents = exact.map((v) => Math.floor(v));
  let drift = creditCents - cents.reduce((a, c) => a + c, 0);
  const rows = members.map((m, i) => ({ i, userId: m.user_id, frac: exact[i] - cents[i] }));
  const up = [...rows].sort((a, b) => b.frac - a.frac || a.userId - b.userId);
  const down = [...rows].sort((a, b) => a.frac - b.frac || a.userId - b.userId);
  for (let k = 0; drift > 0; k++, drift--) cents[up[k % up.length].i] += 1;
  for (let k = 0; drift < 0; k++, drift++) cents[down[k % down.length].i] -= 1;
  members.forEach((m, i) => (shares[m.user_id] = cents[i]));
  return shares;
}

/**
 * Each member's part of one expense for the per-person summary, in trip cents. A
 * member with an amount of their own owes exactly that, the rest split the total
 * evenly, as the query this replaced did. When every member has an amount, the
 * amounts are converted as one set (customSplitCents) the way the settlement
 * converts them, so the parts add up to the bill.
 */
export function summaryShareCents(
  members: readonly { user_id: number; amount?: number | null }[],
  convert: (amount: number) => number,
  totalPrice: number,
  itemId: number,
): Record<number, number> {
  const totalCents = toMinor(convert(totalPrice));
  const hasAmount = (m: { amount?: number | null }) => m.amount !== null && m.amount !== undefined;
  if (members.length > 0 && members.every(hasAmount)) {
    return customSplitCents(members, convert, totalCents, toMinor(totalPrice));
  }
  const equal = splitEqualShares(totalCents, members, itemId);
  return Object.fromEntries(
    members.map((m) => [m.user_id, hasAmount(m) ? toMinor(convert(m.amount as number)) : equal[m.user_id] || 0]),
  );
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
function quoteRatio(rates: Record<string, number> | null, to: string, from: string): number | null {
  const rTo = rates?.[to];
  const rFrom = rates?.[from];
  return rTo && rTo > 0 && rFrom && rFrom > 0 ? rTo / rFrom : null;
}

/**
 * How a settlement reads its currencies: the display currency it answers in, the factor
 * from trip cents into it, and the converters for expenses and recorded transfers.
 * `calculateSettlement` nets with these; they are pure, so they live here.
 */
export function settlementFx(opts: {
  base?: string;
  rates?: Record<string, number> | null;
  tripCurrency?: string;
  baseRate?: number;
}) {
  const requested = (opts.base || opts.tripCurrency || 'EUR').toUpperCase();
  const tripCurrency = (opts.tripCurrency || requested).toUpperCase();
  const rates = opts.rates ?? null;
  // Net the whole settlement in the trip's canonical currency and convert the final
  // totals to the display currency once, instead of netting in the (moving) display
  // currency. Otherwise per-expense rounding shifts as live FX drifts and the greedy
  // debt-simplifier reshuffles it into phantom third-party micro-flows (#1382). When
  // the display currency IS the trip currency (the common case) every conversion below
  // is the identity, so behaviour is unchanged.
  // rates[X] = units of X per 1 base; the frozen exchange_rate is units of item-currency
  // per 1 trip-currency. Pre-rework rows store currency = NULL = "the trip's own currency".
  // Prefer the FX rate frozen at entry time (#1335): a settled expense keeps the rate
  // it was booked at, so a later live-rate drift doesn't re-open it with a residual.
  // Legacy rows without a frozen rate convert via base with live rates.
  const converterFor = (itemCurrency: string | null | undefined, itemRate?: number | null) =>
    tripConverter(itemCurrency, itemRate, tripCurrency, rates);
  // trip-currency → display currency, applied once to the final netted totals.
  // Held as a plain factor so it is exactly linear: the balances are converted as
  // one set (allocateDisplayCents) rather than one at a time, which is what keeps
  // them adding up to zero in whatever currency the viewer picked (#1382).
  //
  // `rates` may be quoted against any base; the ratio of the two quotes is the
  // factor either way. Callers pass the trip currency's own quote (see settlement()),
  // the one freezeForeignRate froze every entry rate from, so a bill entered today in
  // the display currency converts back to exactly what was typed (#2525). Taken the
  // other way round, from the display currency's quote, the two quotes are not exact
  // inverses and 12,345.67 USD came back as 12,346.06.
  //
  // Without a quote, the caller's own figure for the pair (`baseRate`) stands in for
  // the missing display quote, and for nothing else: a row with a currency of its own
  // is never converted with it. Like a live quote, it also reads a legacy transfer
  // without a currency, which is taken to be in the display currency. With neither,
  // the answer stays in the trip currency and says so, rather than printing trip cents
  // as the display currency.
  const baseRate = opts.baseRate != null && Number.isFinite(opts.baseRate) && opts.baseRate > 0 ? opts.baseRate : null;
  const quoted = requested === tripCurrency ? 1 : (quoteRatio(rates, requested, tripCurrency) ?? baseRate);
  const currency = quoted === null ? tripCurrency : requested;
  const displayFactor = quoted ?? 1;
  // Every figure goes out in whole steps of that currency: whole won or yen (#2604).
  const displayUnit = 10 ** Math.max(0, 2 - currencyDecimals(currency));
  const toDisplay = (cents: number[], total?: number) => allocateDisplayCents(cents, displayFactor, total, displayUnit);
  // An expense entered in the display currency itself is owed in that currency
  // (#2965). Booked through the trip currency at its frozen rate and back at
  // today's, 1,081.09 EUR on a yen trip came back a day later as 1,078.86 EUR,
  // and a repayment of exactly what was typed left 2.23 EUR owed. Such rows are
  // netted apart, in whole display cents as entered; every other row still nets
  // in trip cents and converts once, so Σ balances stays 0 in both halves.
  const direct = currency !== tripCurrency ? currency : null;
  const isDirect = (rowCurrency: string | null | undefined) =>
    direct !== null && (rowCurrency || tripCurrency).toUpperCase() === direct;
  // A recorded settle-up amount is entered in whatever display currency the payer
  // was viewing. New rows capture that currency and the rate frozen at settle time
  // (#1445), so a settled position stays balanced when live rates drift — mirroring
  // the expenses; a frozen currency without a usable rate falls back to live rates,
  // and without those the transfer is left out like an expense. Legacy rows
  // (currency = NULL) have no frozen rate, so fall back to the old behaviour: assume
  // they were entered in the current display base and convert with live rates, by the
  // inverse of the display factor, so such a transfer reads back as entered.
  const settleConverterFor = (sCurrency?: string | null, sRate?: number | null) =>
    sCurrency ? tripConverter(sCurrency, sRate, tripCurrency, rates) : (amount: number) => amount / displayFactor;
  return { currency, displayFactor, displayUnit, toDisplay, converterFor, settleConverterFor, isDirect };
}
