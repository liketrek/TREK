import {
  RECEIPT_AMOUNT_MAX,
  RECEIPT_LINES_MAX,
  RECEIPT_TEXT_MAX,
  receiptReadSchema,
  receiptScanResultSchema,
} from './receipt-scan.schema';

import { describe, it, expect } from 'vitest';

const read = {
  merchant: 'Café de Flore',
  date: '2026-09-20',
  total: 23.4,
  currency: 'EUR',
  items: [{ name: 'Croque', price: 15.4 }],
};

describe('receiptReadSchema', () => {
  it('takes a reading, and one where nothing but the total was read', () => {
    expect(receiptReadSchema.safeParse(read).success).toBe(true);
    expect(
      receiptReadSchema.safeParse({ merchant: null, date: null, total: 5, currency: null, items: [] }).success,
    ).toBe(true);
  });

  it('refuses a line that is not a charge: a discount or a free item stops the Ticket split', () => {
    for (const price of [0, -2]) {
      expect(receiptReadSchema.safeParse({ ...read, items: [{ name: 'Discount', price }] }).success).toBe(false);
    }
  });

  it('holds names, lines and amounts to their bounds', () => {
    const long = 'x'.repeat(RECEIPT_TEXT_MAX + 1);
    expect(receiptReadSchema.safeParse({ ...read, merchant: long }).success).toBe(false);
    expect(receiptReadSchema.safeParse({ ...read, items: [{ name: long, price: 1 }] }).success).toBe(false);
    const lines = Array.from({ length: RECEIPT_LINES_MAX + 1 }, () => ({ name: 'Tea', price: 1 }));
    expect(receiptReadSchema.safeParse({ ...read, items: lines }).success).toBe(false);
    expect(receiptReadSchema.safeParse({ ...read, items: lines.slice(1) }).success).toBe(true);
    expect(receiptReadSchema.safeParse({ ...read, total: RECEIPT_AMOUNT_MAX + 1 }).success).toBe(false);
    expect(receiptReadSchema.safeParse({ ...read, total: Number.POSITIVE_INFINITY }).success).toBe(false);
    expect(
      receiptReadSchema.safeParse({ ...read, items: [{ name: 'Gold', price: RECEIPT_AMOUNT_MAX + 1 }] }).success,
    ).toBe(false);
  });

  it('refuses a date or a currency in any other form', () => {
    expect(receiptReadSchema.safeParse({ ...read, date: '20/09/2026' }).success).toBe(false);
    expect(receiptReadSchema.safeParse({ ...read, currency: 'eur' }).success).toBe(false);
  });
});

describe('receiptScanResultSchema', () => {
  it('carries a reading, or none with the reason', () => {
    expect(receiptScanResultSchema.safeParse({ receipt: read, warnings: [] }).success).toBe(true);
    expect(
      receiptScanResultSchema.safeParse({ receipt: null, warnings: ['bill.jpg: no receipt could be read'] }).success,
    ).toBe(true);
  });
});
