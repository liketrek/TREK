import { currencyDecimals, splitEqualShares, sumMinor, toMinor } from './money';

import { describe, expect, it } from 'vitest';

describe('currencyDecimals', () => {
  it.each([
    ['EUR', 2],
    ['usd', 2],
    ['JPY', 0],
    ['huf', 0],
    ['XPF', 0],
    ['KWD', 3],
    ['tnd', 3],
    ['ZZZ', 2],
  ])('%s has %i decimals', (code, decimals) => {
    expect(currencyDecimals(code)).toBe(decimals);
  });
});

describe('toMinor / sumMinor', () => {
  it('rounds a float amount to whole hundredths', () => {
    expect(toMinor(81.61)).toBe(8161);
    expect(toMinor(0.1 + 0.2)).toBe(30);
    expect(toMinor(-30)).toBe(-3000);
  });

  it('sums each amount rounded, so the two halves of 163.21 add back exactly (#1964)', () => {
    expect(81.61 + 81.6).not.toBe(163.21);
    expect(sumMinor([81.61, 81.6])).toBe(16321);
    expect(sumMinor([])).toBe(0);
  });
});

// The share table the server's settlement and the client's preview were both
// pinned to (#2176). It is the contract of the shared function now.
const SHARE_PARITY_FIXTURE: {
  totalCents: number;
  users: number[];
  itemId: number;
  expected: Record<number, number>;
}[] = [
  { totalCents: 10000, users: [1, 2, 3], itemId: 0, expected: { 1: 3334, 2: 3333, 3: 3333 } },
  { totalCents: 10000, users: [1, 2, 3], itemId: 1, expected: { 1: 3333, 2: 3334, 3: 3333 } },
  { totalCents: -10000, users: [1, 2, 3], itemId: 0, expected: { 1: -3333, 2: -3333, 3: -3334 } },
  { totalCents: -10000, users: [1, 2, 3], itemId: 1, expected: { 1: -3334, 2: -3333, 3: -3333 } },
  { totalCents: -101, users: [1, 2], itemId: 0, expected: { 1: -50, 2: -51 } },
  { totalCents: -101, users: [1, 2], itemId: 1, expected: { 1: -51, 2: -50 } },
  { totalCents: -1, users: [1, 2, 3], itemId: 0, expected: { 1: 0, 2: 0, 3: -1 } },
];

describe('splitEqualShares', () => {
  it.each(SHARE_PARITY_FIXTURE)(
    'splits $totalCents across $users.length members (item $itemId)',
    ({ totalCents, users, itemId, expected }) => {
      const shares = splitEqualShares(
        totalCents,
        users.map((user_id) => ({ user_id })),
        itemId,
      );
      expect(shares).toEqual(expected);
      expect(Object.values(shares).reduce((a, b) => a + b, 0)).toBe(totalCents);
    },
  );

  it('orders members by user id whatever order they arrive in', () => {
    expect(splitEqualShares(100, [{ user_id: 9 }, { user_id: 2 }, { user_id: 5 }], 0)).toEqual({ 2: 34, 5: 33, 9: 33 });
  });

  it('answers an empty map for nobody', () => {
    expect(splitEqualShares(500, [], 3)).toEqual({});
  });
});
