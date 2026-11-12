import { describe, expect, it } from 'vitest';
import { priceValue } from './priceValue';

describe('priceValue', () => {
  it('reads the store price strings of the usual currencies, in hundredths', () => {
    expect(priceValue('9,99 €')).toBe(999);
    expect(priceValue('$9.99')).toBe(999);
    expect(priceValue('59,99 €')).toBe(5999);
    expect(priceValue('¥1,500')).toBe(150000);
    expect(priceValue('1.234,50 €')).toBe(123450);
    expect(priceValue('CHF 10')).toBe(1000);
  });

  it('has no value for nothing or for a string it cannot read with confidence', () => {
    expect(priceValue(undefined)).toBeNull();
    expect(priceValue('')).toBeNull();
    expect(priceValue('free')).toBeNull();
    expect(priceValue('1.2.3')).toBeNull();
  });
});
