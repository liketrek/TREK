import { currencyDecimals, splitEqualShares, sumMinor, toMinor } from '@trek/shared';

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

const NOT_FROZEN_RATE = 1;

export function positiveRate(rate: unknown): rate is number {
  return typeof rate === 'number' && Number.isFinite(rate) && rate > 0;
}

export function isFrozenRate(rate: unknown, source?: string | null): rate is number {
  return (
    positiveRate(rate) &&
    (rate !== NOT_FROZEN_RATE ||
      source === 'explicit' ||
      source === 'trip' ||
      source === 'global' ||
      source === 'identity')
  );
}

export function tripConverter(
  itemCurrency: string | null | undefined,
  itemRate: number | null | undefined,
  tripCurrency: string,
  source?: string | null,
): ((amount: number) => number) | null {
  const cur = itemCurrency?.trim().toUpperCase() || tripCurrency;
  if (cur === tripCurrency) return (amount) => amount;
  return isFrozenRate(itemRate, source) ? (amount) => amount / itemRate : null;
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

export interface SettlementRates {
  base?: string;
  tripCurrency?: string;
  tripRates?: Record<string, number>;
  rates?: Record<string, number> | null;
  baseRate?: number;
}

export function settlementFx(opts: SettlementRates, hasSelectedRows: boolean) {
  const requested = (opts.base || opts.tripCurrency || 'EUR').toUpperCase();
  const trip = (opts.tripCurrency || requested).toUpperCase();
  const global = opts.rates ?? null;
  const rateFor = (currency: string) => {
    if (currency === trip) return 1;
    const custom = opts.tripRates?.[currency];
    return positiveRate(custom) ? custom : quoteRatio(global, currency, trip);
  };
  const bridge = rateFor(requested) ?? (positiveRate(opts.baseRate) ? opts.baseRate : null);
  const currency = bridge !== null || hasSelectedRows ? requested : trip;
  const displayUnit = 10 ** Math.max(0, 2 - currencyDecimals(currency));
  const tripUnit = 10 ** Math.max(0, 2 - currencyDecimals(trip));
  const displayRate = currency === trip ? 1 : bridge;
  const convertRow = (rowCurrency: string | null | undefined, saved: number | null, source?: string, payment = false) => {
    const from = rowCurrency?.trim().toUpperCase() || (payment ? currency : trip);
    const booked = from !== trip && source !== 'identity' && isFrozenRate(saved, source) ? saved : null;
    const fromRate = booked ?? rateFor(from) ?? (from === currency ? displayRate : null);
    // The frozen quote only covers the row currency ↔ trip currency pair.
    const toTrip = fromRate === null ? null : (amount: number) => amount / fromRate;
    const direct = booked === null ? quoteRatio(global, currency, from) : null;
    const toDisplay = from === currency ? (amount: number) => amount
      : displayRate !== null && toTrip ? (amount: number) => toTrip(amount) * displayRate
      : direct === null ? null : (amount: number) => amount * direct;
    return { toTrip, toDisplay };
  };
  return { currency, trip, bridge: displayRate, displayUnit, tripUnit, convertRow };
}

// Allocate the shown units together so signed balances remain zero-sum.
export function allocateShownUnits(cents: number[], unit: number, shownTotal?: number): number[] {
  if (unit === 1) return cents;
  const whole = cents.map((value) => Math.floor(value / unit));
  const target = shownTotal === undefined
    ? Math.round(cents.reduce((sum, value) => sum + value, 0) / unit)
    : shownTotal / unit;
  const remainder = target - whole.reduce((sum, value) => sum + value, 0);
  const order = cents.map((value, i) => ({ i, frac: value - whole[i] * unit }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; k < remainder && k < order.length; k++) whole[order[k].i]++;
  return whole.map((value) => value * unit);
}

type ParticipantBalance = { user_id: number; username: string; avatar_url: string | null; cents: number };
type SettlementFlow = { from: Omit<ParticipantBalance, 'cents'>; to: Omit<ParticipantBalance, 'cents'>; amount: number; exchange_rate?: number };

export function settlementFlows(ledger: ParticipantBalance[]): SettlementFlow[] {
  const debtors = ledger.filter((p) => p.cents < 0).map((p) => ({ ...p, remaining: -p.cents }));
  const creditors = ledger.filter((p) => p.cents > 0).map((p) => ({ ...p, remaining: p.cents }));
  debtors.sort((a, b) => b.remaining - a.remaining);
  creditors.sort((a, b) => b.remaining - a.remaining);

  const flows: SettlementFlow[] = [];
  let di = 0;
  let ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const from = debtors[di];
    const to = creditors[ci];
    const transfer = Math.min(from.remaining, to.remaining);
    flows.push({
      from: { user_id: from.user_id, username: from.username, avatar_url: from.avatar_url },
      to: { user_id: to.user_id, username: to.username, avatar_url: to.avatar_url },
      amount: transfer / 100,
    });
    debtors[di].remaining -= transfer;
    creditors[ci].remaining -= transfer;
    if (debtors[di].remaining === 0) di++;
    if (creditors[ci].remaining === 0) ci++;
  }
  return flows;
}
