// FE-BUDGET-RCPTLINK-001 to FE-BUDGET-RCPTLINK-003
import { describe, expect, it } from 'vitest';

import { buildTripFile } from '../../../tests/helpers/factories';
import { linkableReceiptFiles, receiptOfFile } from './receiptLinks';

const names = (files: { original_name: string }[]) => files.map((f) => f.original_name);

describe('receipt links (#2839)', () => {
  const menu = buildTripFile({ id: 1, original_name: 'menu.jpg' });
  const confirmation = buildTripFile({ id: 2, original_name: 'hotel-confirmation.pdf', reservation_id: 7 });
  const linked = buildTripFile({ id: 3, original_name: 'hotel-invoice.pdf', linked_reservation_ids: [9, 7] });
  const binned = buildTripFile({ id: 4, original_name: 'old.pdf', deleted_at: '2026-01-01 10:00:00' });

  it('FE-BUDGET-RCPTLINK-001: offers the live files the expense does not carry yet', () => {
    const files = linkableReceiptFiles([menu, confirmation, linked, binned], [receiptOfFile(linked)], null);
    expect(names(files)).toEqual(['menu.jpg', 'hotel-confirmation.pdf']);
  });

  it("FE-BUDGET-RCPTLINK-002: the booking's own files lead, by its column or a link row", () => {
    expect(names(linkableReceiptFiles([menu, confirmation, linked], [], 7))).toEqual([
      'hotel-confirmation.pdf',
      'hotel-invoice.pdf',
      'menu.jpg',
    ]);
    expect(names(linkableReceiptFiles([menu, confirmation], [], 8))).toEqual(['menu.jpg', 'hotel-confirmation.pdf']);
  });

  it('FE-BUDGET-RCPTLINK-003: a file reads as a receipt row under its own id and download path', () => {
    expect(receiptOfFile(confirmation)).toEqual({
      id: 2,
      filename: 'test.pdf',
      original_name: 'hotel-confirmation.pdf',
      file_size: null,
      mime_type: 'application/pdf',
      url: '/api/trips/1/files/2/download',
    });
  });
});
