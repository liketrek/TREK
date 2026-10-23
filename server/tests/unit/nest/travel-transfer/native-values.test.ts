import { NATIVE_DOMAINS } from '../../../../src/db/repositories/_shared/transfer-native-domains';
import {
  nativeFieldName,
  nativeValue,
  portableValue,
  decoratePortable,
} from '../../../../src/nest/travel-transfer/transfer-native-values';

import { describe, expect, it } from 'vitest';

const domain = (table: string) => {
  const value = NATIVE_DOMAINS.find((d) => d.table === table);
  if (!value) throw new Error('Missing domain');
  return value;
};
describe('native scalar compatibility and lossless provenance', () => {
  it.each([
    ['todo_items', 'priority', 1, 'high'],
    ['todo_items', 'priority', 3, 'low'],
    ['todo_items', 'priority', 0, 'normal'],
    ['reservations', 'type', 'hotel', 'accommodation'],
    ['reservations', 'type', 'rental_car', 'car'],
    ['reservations', 'type', 'ferry', 'ferry'],
    ['reservations', 'type', 'legacy-type', 'other'],
    ['reservations', 'status', 'legacy-state', 'planned'],
    ['reservations', 'status', 'confirmed', 'confirmed'],
    ['trip_files', 'deleted_at', '2026-01-01 12:30:00', '2026-01-01T12:30:00Z'],
    ['trip_files', 'deleted_at', '2026-01-01T12:30:00Z', '2026-01-01T12:30:00Z'],
    ['trip_files', 'deleted_at', null, null],
    ['packing_items', 'weight_grams', 12.5, '12.5'],
    ['packing_items', 'weight_grams', null, null],
    ['days', 'day_number', null, 0],
    ['days', 'title', null, ''],
    ['days', 'date', null, null],
    ['todo_items', 'checked', 1, true],
    ['todo_items', 'checked', 0, false],
    ['budget_items', 'persons', null, '1'],
    ['budget_items', 'sort_order', null, '0'],
  ])('retains the raw spelling of %s.%s', (table, column, raw, portable) => {
    const d = domain(String(table)),
      field = String(column);
    expect(portableValue(d, field, raw as string | number | null)).toEqual(portable);
    expect(
      nativeValue(d, field, { [nativeFieldName(d, field)]: portable, trek_native_values: { [field]: raw } }),
    ).toEqual(raw);
  });
  it('handles wall clock times without inventing a timezone', () => {
    const d = domain('day_assignments');
    expect(portableValue(d, 'assignment_time', '09:30')).toEqual({
      local: '09:30',
      zone: '',
      utc: null,
      original_text: '09:30',
    });
    expect(nativeValue(d, 'assignment_time', { start_at: { local: '10:30', zone: 'Asia/Tokyo', utc: null } })).toBe(
      '10:30',
    );
    expect(nativeValue(d, 'assignment_time', { start_at: {} })).toBeNull();
    expect(portableValue(d, 'assignment_time', null)).toEqual({});
    for (const value of ['09:30', [], { local: 9 }])
      expect(() => nativeValue(d, 'assignment_time', { start_at: value })).toThrow('Invalid itinerary time');
    expect(nativeFieldName(domain('reservation_endpoints'), 'local_date', { role: 'from' })).toBe(
      'departure_date_text',
    );
    expect(nativeFieldName(domain('reservation_endpoints'), 'local_time', { role: 'to' })).toBe('arrival_time_text');
  });
  it('rejects precision loss, nonfinite and invalid scalar encodings', () => {
    const d = domain('budget_items');
    for (const amount of ['9007199254740993', '0.12345678901234567891', '1e999', 'NaN', '01.2', 12])
      expect(() => nativeValue(d, 'total_price', { amount_text: amount })).toThrow('Decimal');
    for (const amount of ['12.2500', '1.2e2', '-0', '0.00', '-0.0100'])
      expect(nativeValue(d, 'total_price', { amount_text: amount })).toBe(Number(amount));
    expect(nativeValue(d, 'total_price', { amount_text: null })).toBeNull();
    expect(nativeValue(d, 'persons', { persons_text: '2' })).toBe(2);
    expect(() => nativeValue(d, 'persons', { persons_text: '1.1' })).toThrow('integer');
    expect(nativeValue(domain('todo_items'), 'checked', { checked: false })).toBe(0);
    expect(nativeValue(domain('todo_items'), 'checked', { checked: null })).toBeNull();
    expect(() => nativeValue(domain('todo_items'), 'checked', { checked: 'yes' })).toThrow('boolean');
    expect(() => nativeValue(domain('todo_items'), 'priority', { priority: 'urgent' })).toThrow('priority');
    for (const priority of ['high', 'normal', 'low'])
      expect(typeof nativeValue(domain('todo_items'), 'priority', { priority })).toBe('number');
    expect(nativeValue(domain('reservations'), 'type', { kind: 'accommodation' })).toBe('hotel');
    expect(nativeValue(domain('reservations'), 'type', { kind: 'train' })).toBe('train');
  });
  it('exposes exact ledger units, quantity defaults and safe document mime defaults', () => {
    const f: Record<string, unknown> = {};
    decoratePortable(domain('budget_items'), { total_price: 12.25, currency: null, exchange_rate: 1.5 }, f, 'AUD');
    expect(f).toMatchObject({
      amount_minor: '1225',
      currency: 'AUD',
      exponent: 2,
      fx_base_currency: 'AUD',
      fx_direction: 'base_per_source',
    });
    f.fx_rate = '0';
    decoratePortable(domain('budget_items'), { total_price: 0, currency: 'EUR', exchange_rate: 0 }, f, 'AUD');
    expect(f).not.toHaveProperty('fx_rate');
    for (const table of ['budget_item_members', 'budget_item_payers', 'budget_settlements']) {
      const value = {};
      decoratePortable(domain(table), { amount: null, currency: null, note: null }, value, 'AUD');
      expect(value).toMatchObject({ amount_text: '', amount_minor: null });
      decoratePortable(domain(table), { amount: 1.25, currency: 'EUR', note: 'Settled' }, value, 'AUD');
      expect(value).toMatchObject({ amount_text: '1.25', amount_minor: '125' });
    }
    const packing = {};
    decoratePortable(domain('packing_items'), { quantity: null }, packing, 'AUD');
    expect(packing).toEqual({ quantity: 1 });
    const file = {};
    decoratePortable(domain('trip_files'), { mime_type: null, description: null }, file, 'AUD');
    expect(file).toEqual({ mime: 'application/octet-stream', description: '' });
  });
});
