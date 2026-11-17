import { describe, expect, it } from 'vitest';

import { amountIn } from '../../../native-shell/amount';

// FE-NATIVE-AMOUNT-001 to FE-NATIVE-AMOUNT-005
//
// The amount inside a store price string (client/native-shell/amount.ts): read
// as a number, and written again in the same format, so the plan picker can
// count a price up and turn a yearly price into a monthly one in any currency.

describe('native shell price amounts', () => {
  it('FE-NATIVE-AMOUNT-001: a euro price with a decimal comma reads and writes back the same way', () => {
    const amount = amountIn('4,90 €');
    expect(amount?.value).toBe(4.9);
    expect(amount?.render(4.9)).toBe('4,90 €');
    expect(amount?.render(79 / 12)).toBe('6,58 €');
  });

  it('FE-NATIVE-AMOUNT-002: a dollar price keeps its sign in front and its decimal point', () => {
    const amount = amountIn('$199.00');
    expect(amount?.value).toBe(199);
    expect(amount?.render(199 / 12)).toBe('$16.58');
  });

  it('FE-NATIVE-AMOUNT-003: thousands keep their grouping mark', () => {
    expect(amountIn('1.290 ₽')?.value).toBe(1290);
    expect(amountIn('1.290 ₽')?.render(12345)).toBe('12.345 ₽');
    expect(amountIn('CHF 1’290.50')?.value).toBe(1290.5);
    expect(amountIn('CHF 1’290.50')?.render(2000)).toBe('CHF 2’000.00');
    expect(amountIn("CHF 1'290.50")?.render(2000)).toBe("CHF 2'000.00");
  });

  it('FE-NATIVE-AMOUNT-004: a price without figures has no amount', () => {
    expect(amountIn('')).toBeNull();
    expect(amountIn('Free')).toBeNull();
  });

  it('FE-NATIVE-AMOUNT-005: a count never runs below zero', () => {
    expect(amountIn('4,90 €')?.render(-3)).toBe('0,00 €');
  });
});
