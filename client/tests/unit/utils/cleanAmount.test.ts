import { describe, it, expect } from 'vitest';
import { cleanAmount, cleanAmountText } from '../../../src/utils/formatters';

/**
 * Money that has been through an uneven split (#1964).
 *
 * A total that does not divide evenly is split into parts that are each exact
 * to the cent, but adding those parts back in floating point does not return
 * the total: 81.61 + 81.60 is 163.20999999999998. The server writes the clean
 * value now, so these two are for what is already stored, and for the places
 * that print a number as it stands rather than through Intl — the expense form
 * when reopened, and the price stamped onto a linked booking.
 */

describe('cleanAmount', () => {
  it('gives back the total the parts were meant to add up to', () => {
    expect(cleanAmount(81.61 + 81.60)).toBe(163.21);
    expect(cleanAmount(33.34 + 33.33 + 33.33)).toBe(100);
  });

  it('leaves a value that was already clean untouched', () => {
    expect(cleanAmount(163.21)).toBe(163.21);
    expect(cleanAmount(25)).toBe(25);
    expect(cleanAmount(0)).toBe(0);
  });

  it('keeps a genuine half-cent from being invented or lost', () => {
    // Rounding to cents is the point; a third of a cent is not money.
    expect(cleanAmount(0.005)).toBe(0.01);
    expect(cleanAmount(0.004)).toBe(0);
  });

  it('handles a negative the same way, since a refund is money too', () => {
    expect(cleanAmount(-81.61 - 81.60)).toBe(-163.21);
  });
});

describe('cleanAmountText', () => {
  it('tidies a numeric price string', () => {
    expect(cleanAmountText('163.20999999999998')).toBe('163.21');
    expect(cleanAmountText(163.20999999999998)).toBe('163.21');
  });

  /*
   * The booking price field holds whatever the confirmation said. Import writes
   * free text into it, so anything that is not a number has to come back out
   * exactly as it went in rather than as NaN.
   */
  it('passes free text through untouched', () => {
    expect(cleanAmountText('included in fare')).toBe('included in fare');
    expect(cleanAmountText('EUR 40,00')).toBe('EUR 40,00');
  });

  it('answers empty for nothing at all', () => {
    expect(cleanAmountText(null)).toBe('');
    expect(cleanAmountText(undefined)).toBe('');
    expect(cleanAmountText('')).toBe('');
  });

  it('does not turn whitespace into a zero', () => {
    expect(cleanAmountText('   ')).toBe('   ');
  });
});
