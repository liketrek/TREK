import { IMPORT_SOURCE, importExternalId } from '../../../../src/nest/booking-import/booking-origin';
import type { BookingImportPreviewItem } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const item = (fields: Partial<BookingImportPreviewItem>): BookingImportPreviewItem => ({
  type: 'flight',
  title: 'LH 716',
  source: { fileName: 'ticket.pdf', index: 0 },
  ...fields,
});

const endpoint = (role: 'from' | 'to', name: string, code: string | null) => ({
  role,
  sequence: role === 'from' ? 0 : 1,
  name,
  code,
  lat: 0,
  lng: 0,
  timezone: null,
  local_time: null,
  local_date: null,
});

describe('importExternalId', () => {
  it('BOOKING-ORIGIN-001: no reference, no key', () => {
    expect(importExternalId(item({}))).toBeNull();
    expect(importExternalId(item({ confirmation_number: '  ' }))).toBeNull();
    expect(IMPORT_SOURCE).toBe('import');
  });

  it('BOOKING-ORIGIN-002: the reference is read without spacing and case, the route by code before name', () => {
    const outbound = item({
      confirmation_number: ' abc 123',
      reservation_time: '2026-09-01T10:00',
      endpoints: [endpoint('from', 'Frankfurt', 'FRA'), endpoint('to', 'Tokyo Narita', null)],
    });
    expect(importExternalId(outbound)).toBe('ABC123|flight|2026-09-01|fra-tokyo narita');
  });

  it('BOOKING-ORIGIN-003: the legs of one reference get keys of their own', () => {
    const there = item({ confirmation_number: 'ABC123', reservation_time: '2026-09-01T10:00' });
    const back = item({ confirmation_number: 'ABC123', reservation_time: '2026-09-15T10:00' });
    expect(importExternalId(there)).not.toBe(importExternalId(back));
  });

  it('BOOKING-ORIGIN-004: a stay is keyed by its check-in, and an overlong key is cut', () => {
    const stay = item({
      type: 'hotel',
      confirmation_number: 'H-77',
      _accommodation: { check_in: '2026-09-02T15:00', check_out: '2026-09-04T11:00' },
    });
    expect(importExternalId(stay)).toBe('H-77|hotel|2026-09-02|');
    expect(importExternalId(item({ confirmation_number: 'X'.repeat(500) }))).toHaveLength(200);
  });
});
