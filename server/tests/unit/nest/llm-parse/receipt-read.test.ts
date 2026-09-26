import { describe, it, expect } from 'vitest';
import { RECEIPT_AMOUNT_MAX, RECEIPT_LINES_MAX, RECEIPT_TEXT_MAX } from '@trek/shared';
import { buildReceiptPrompt, RECEIPT_LIST_JSON_SCHEMA, RECEIPT_ROOT_KEY, toReceiptRead } from '../../../../src/nest/llm-parse/receipt-read';

describe('toReceiptRead', () => {
  it('keeps a clean answer as it came', () => {
    expect(toReceiptRead({
      merchant: 'Café de Flore', date: '2026-09-20', total: 23.4, currency: 'EUR',
      items: [{ name: '2 x Espresso', price: 8 }, { name: 'Croque', price: 15.4 }],
    })).toEqual({
      merchant: 'Café de Flore', date: '2026-09-20', total: 23.4, currency: 'EUR',
      items: [{ name: '2 x Espresso', price: 8 }, { name: 'Croque', price: 15.4 }],
    });
  });

  it('reads amounts written as text, in either decimal convention', () => {
    expect(toReceiptRead({ total: '12,50 €' })?.total).toBe(12.5);
    expect(toReceiptRead({ total: '1.234,50' })?.total).toBe(1234.5);
    expect(toReceiptRead({ total: '1,234.50' })?.total).toBe(1234.5);
    expect(toReceiptRead({ total: 7, items: [{ name: 'Tea', price: '3,20' }] })?.items).toEqual([{ name: 'Tea', price: 3.2 }]);
  });

  it('turns a currency symbol or name into its code, and drops one nobody can convert', () => {
    expect(toReceiptRead({ total: 5, currency: '€' })?.currency).toBe('EUR');
    expect(toReceiptRead({ total: 5, currency: 'euros' })?.currency).toBe('EUR');
    expect(toReceiptRead({ total: 5, currency: 'Lek' })?.currency).toBeNull();
  });

  it('keeps only a real calendar date', () => {
    expect(toReceiptRead({ total: 5, date: '2026-02-28' })?.date).toBe('2026-02-28');
    for (const date of ['2026-02-30', '28/02/2026', '2026-2-8', '']) expect(toReceiptRead({ total: 5, date })?.date).toBeNull();
  });

  it('leaves out a total that is not a positive amount, and lines without a name or price', () => {
    const read = toReceiptRead({ merchant: 'Shop', total: 0, items: [{ name: '', price: 2 }, { name: 'Bread' }, 'x', { name: 'Milk', price: 1.1 }] });
    expect(read).toEqual({ merchant: 'Shop', date: null, total: null, currency: null, items: [{ name: 'Milk', price: 1.1 }] });
  });

  it('is null when nothing usable came back', () => {
    for (const raw of [null, undefined, 'text', [], {}, { total: 'n/a', merchant: '  ' }]) expect(toReceiptRead(raw)).toBeNull();
  });

  it('leaves out a discount or a free line, written as a number or as text, so the Ticket split can save', () => {
    const read = toReceiptRead({
      total: 10,
      items: [
        { name: 'Tea', price: 3 },
        { name: 'Discount', price: -2 },
        { name: 'Coupon', price: '-2,00' },
        { name: 'Bag refund', price: '0,50-' },
        { name: 'Voucher', price: '€ −1.00' },
        { name: 'Water', price: 0 },
      ],
    });
    expect(read?.items).toEqual([{ name: 'Tea', price: 3 }]);
  });

  it('keeps the sign of a total written as text, and drops a negative one', () => {
    expect(toReceiptRead({ merchant: 'Shop', total: '-12,50' })?.total).toBeNull();
    expect(toReceiptRead({ total: '12,50 €' })?.total).toBe(12.5);
  });

  it('reads a Swiss whole amount such as "45.-" as positive, while "2,00-" stays a discount', () => {
    const read = toReceiptRead({
      total: 'CHF 45.-',
      items: [
        { name: 'Fondue', price: '38,-' },
        { name: 'Coupon', price: '2,00-' },
      ],
    });
    expect(read?.total).toBe(45);
    expect(read?.items).toEqual([{ name: 'Fondue', price: 38 }]);
  });

  it('cuts names, lines and amounts to what the contract takes instead of losing the whole reading', () => {
    const read = toReceiptRead({
      merchant: 'M'.repeat(RECEIPT_TEXT_MAX + 50),
      total: RECEIPT_AMOUNT_MAX * 10,
      items: [
        { name: 'Gold', price: RECEIPT_AMOUNT_MAX + 1 },
        ...Array.from({ length: RECEIPT_LINES_MAX + 20 }, (_, i) => ({ name: `Line ${i} ${'x'.repeat(RECEIPT_TEXT_MAX)}`, price: 1 })),
      ],
    });
    expect(read?.merchant).toHaveLength(RECEIPT_TEXT_MAX);
    expect(read?.total).toBeNull();
    expect(read?.items).toHaveLength(RECEIPT_LINES_MAX);
    expect(read?.items[0].name).toMatch(/^Line 0 /);
    expect(read?.items.every((line) => line.name.length <= RECEIPT_TEXT_MAX)).toBe(true);
  });
});

describe('the receipt prompt and schema', () => {
  it('pins today so an ambiguous date is read towards it', () => {
    expect(buildReceiptPrompt(new Date('2026-09-24T10:00:00Z'))).toContain('Today is 2026-09-24.');
  });

  it('spells out the JSON it wants, wrapped in the receipts list for the cloud clients', () => {
    const local = buildReceiptPrompt(new Date('2026-09-24T10:00:00Z'));
    expect(local).toContain('Return ONLY a JSON object of the form { "merchant": ""');
    expect(local).not.toContain(`"${RECEIPT_ROOT_KEY}"`);
    // A server that turns json_schema down reads this prompt alone, in json_object mode.
    const cloud = buildReceiptPrompt(new Date('2026-09-24T10:00:00Z'), true);
    expect(cloud).toContain(`Return ONLY a JSON object of the form { "${RECEIPT_ROOT_KEY}": [ { "merchant": ""`);
  });

  it('wraps one receipt under the key the cloud clients read', () => {
    expect(RECEIPT_LIST_JSON_SCHEMA.required).toEqual([RECEIPT_ROOT_KEY]);
    expect(RECEIPT_LIST_JSON_SCHEMA.properties[RECEIPT_ROOT_KEY].items.required).toEqual(['merchant', 'date', 'total', 'currency', 'items']);
  });
});
