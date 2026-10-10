/**
 * Money arithmetic both sides need to agree on to the cent.
 *
 * The ledger is netted in whole hundredths of the currency ("minor units" here
 * always means hundredths, whatever the currency's display precision: a yen
 * amount is held as yen × 100 like every other one). Floats are only the
 * storage format; every sum, split and comparison happens on these integers.
 */

/**
 * Currencies whose display precision is not two decimals. HUF is kept
 * zero-decimal by app convention even though ISO lists two.
 */
const ZERO_DECIMAL_CURRENCIES: ReadonlySet<string> = new Set([
  'JPY',
  'KRW',
  'VND',
  'CLP',
  'ISK',
  'HUF',
  'BIF',
  'DJF',
  'GNF',
  'KMF',
  'PYG',
  'RWF',
  'UGX',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);
const THREE_DECIMAL_CURRENCIES: ReadonlySet<string> = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND']);

/** How many decimals a currency is shown with (0, 2 or 3). Case-insensitive; unknown codes get 2. */
export function currencyDecimals(currency: string): number {
  const cur = currency.toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(cur)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(cur)) return 3;
  return 2;
}

/** An amount in whole hundredths, rounded half away from zero the way `Math.round` does for positives. */
export function toMinor(amount: number): number {
  return Math.round(amount * 100);
}

/** The sum of several amounts in whole hundredths: each one is rounded first, so float noise never adds up. */
export function sumMinor(amounts: readonly number[]): number {
  return amounts.reduce((sum, amount) => sum + toMinor(amount), 0);
}

/**
 * Split `totalMinor` equally across `members`, in whole hundredths, keyed by
 * user id.
 *
 * Largest remainder by rotation: the leftover hundredths go to consecutive
 * members starting at `itemId % n` (members ordered by user id), so across
 * several expenses the rounding evens out instead of always favouring the same
 * person. The remainder is `total - base * n` with a floored base, never `%`,
 * so a negative total (a refund, #2176) still yields a remainder in [0, n) and
 * the shares always sum back to the total exactly.
 */
export function splitEqualShares(
  totalMinor: number,
  members: readonly { user_id: number }[],
  itemId: number,
): Record<number, number> {
  const n = members.length;
  if (n === 0) return {};

  const base = Math.floor(totalMinor / n);
  const remainder = totalMinor - base * n;
  const sorted = [...members].sort((a, b) => a.user_id - b.user_id);
  const startIndex = itemId % n;

  const shares: Record<number, number> = {};
  sorted.forEach((member, i) => {
    const hasExtra = (i - startIndex + n) % n < remainder;
    shares[member.user_id] = base + (hasExtra ? 1 : 0);
  });
  return shares;
}
