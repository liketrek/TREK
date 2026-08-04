import { describe, it, expect } from 'vitest';
import { formatDate, formatTime, formatClockTime, dayTotalCost, currencyDecimals, parseMeridiemTime } from '../../../src/utils/formatters';
import type { AssignmentsMap } from '../../../src/types';

// dayTotalCost intentionally exercises edge-case price inputs (string / non-numeric),
// which are looser than the canonical AssignmentsMap shape — hence the casts below.
const asMap = (m: unknown): AssignmentsMap => m as AssignmentsMap;

describe('currencyDecimals', () => {
  it('returns 0 for zero-decimal currencies', () => {
    expect(currencyDecimals('JPY')).toBe(0);
    expect(currencyDecimals('KRW')).toBe(0);
    expect(currencyDecimals('jpy')).toBe(0); // case-insensitive
  });

  it('returns 2 for standard currencies', () => {
    expect(currencyDecimals('EUR')).toBe(2);
    expect(currencyDecimals('USD')).toBe(2);
    expect(currencyDecimals('GBP')).toBe(2);
  });
});

describe('formatDate', () => {
  it('returns null for null/undefined input', () => {
    expect(formatDate(null, 'en-US')).toBeNull();
    expect(formatDate(undefined, 'en-US')).toBeNull();
  });

  it('formats a date string and returns a non-empty string', () => {
    const result = formatDate('2025-06-01', 'en-US');
    expect(result).not.toBeNull();
    expect(typeof result).toBe('string');
    expect(result!.length).toBeGreaterThan(0);
  });

  it('accepts an optional timeZone parameter without throwing', () => {
    const result = formatDate('2025-06-01', 'en-US', 'America/New_York');
    expect(result).not.toBeNull();
  });
});

describe('formatTime', () => {
  it('returns empty string for null/undefined', () => {
    expect(formatTime(null, 'en-US', '24h')).toBe('');
    expect(formatTime(undefined, 'en-US', '24h')).toBe('');
  });

  it('formats 24h time', () => {
    expect(formatTime('14:30', 'en-US', '24h')).toBe('14:30');
    expect(formatTime('09:05', 'en-US', '24h')).toBe('09:05');
  });

  it('appends Uhr suffix for German locale in 24h mode', () => {
    expect(formatTime('14:30', 'de-DE', '24h')).toBe('14:30 Uhr');
  });

  it('formats 12h time', () => {
    expect(formatTime('14:30', 'en-US', '12h')).toBe('2:30 PM');
    expect(formatTime('00:00', 'en-US', '12h')).toBe('12:00 AM');
    expect(formatTime('12:00', 'en-US', '12h')).toBe('12:00 PM');
    expect(formatTime('01:00', 'en-US', '12h')).toBe('1:00 AM');
  });

  // #1725 — a value stored with a meridiem must still follow the configured format
  it('converts a stored meridiem value to the configured format', () => {
    expect(formatTime('3:00 PM', 'en-US', '24h')).toBe('15:00');
    expect(formatTime('12:30 am', 'en-US', '24h')).toBe('00:30');
    expect(formatTime('3:00 PM', 'en-US', '12h')).toBe('3:00 PM');
    expect(formatTime('15:00', 'de-DE', '24h')).toBe('15:00 Uhr');
  });
});

describe('parseMeridiemTime', () => {
  it('returns null when there is no meridiem to convert', () => {
    expect(parseMeridiemTime(null)).toBeNull();
    expect(parseMeridiemTime(undefined)).toBeNull();
    expect(parseMeridiemTime('')).toBeNull();
    expect(parseMeridiemTime('14:30')).toBeNull();
    expect(parseMeridiemTime('later')).toBeNull();
  });

  it('converts a meridiem time to HH:MM', () => {
    expect(parseMeridiemTime('5:30 pm')).toBe('17:30');
    expect(parseMeridiemTime('5:30 AM')).toBe('05:30');
    expect(parseMeridiemTime('530pm')).toBe('17:30');
    expect(parseMeridiemTime('5pm')).toBe('17:00');
  });

  it('maps 12 AM to midnight and 12 PM to noon', () => {
    expect(parseMeridiemTime('12:30 AM')).toBe('00:30');
    expect(parseMeridiemTime('12:30 PM')).toBe('12:30');
  });
});

// The locale-free counterpart of formatTime, shared by the time picker and the dense
// day/booking rows so those two do not carry their own copy of the rules (#1725).
describe('formatClockTime', () => {
  it('returns an empty string for a missing value', () => {
    expect(formatClockTime(null, false)).toBe('');
    expect(formatClockTime(undefined, true)).toBe('');
    expect(formatClockTime('', true)).toBe('');
  });

  it('leaves a 24h value untouched in 24h and never adds a locale suffix', () => {
    expect(formatClockTime('14:30', false)).toBe('14:30');
    expect(formatClockTime('09:05', false)).toBe('09:05');
  });

  it('converts a 24h value for a 12h user', () => {
    expect(formatClockTime('14:30', true)).toBe('2:30 PM');
    expect(formatClockTime('00:15', true)).toBe('12:15 AM');
    expect(formatClockTime('12:45', true)).toBe('12:45 PM');
  });

  it('converts a stored meridiem value down to 24h', () => {
    expect(formatClockTime('3:00 PM', false)).toBe('15:00');
    expect(formatClockTime('12:30 am', false)).toBe('00:30');
    expect(formatClockTime('3:00 PM', true)).toBe('3:00 PM');
  });

  it('hands back anything it cannot read', () => {
    expect(formatClockTime('later', false)).toBe('later');
    expect(formatClockTime('later', true)).toBe('later');
  });
});

describe('dayTotalCost', () => {
  // Intl money strings use non-breaking / narrow no-break spaces; normalize for assertions.
  const norm = (s: string | null) => s?.replace(/[\u00A0\u202F]/g, ' ') ?? null;

  it('returns null when there are no assignments', () => {
    expect(dayTotalCost(1, {}, 'EUR', 'EUR', 'en')).toBeNull();
  });

  it('returns null when no places have prices', () => {
    const assignments = {
      '1': [
        { id: 1, day_id: 1, order_index: 0, notes: null, place: { id: 1, trip_id: 1, name: 'P', lat: null, lng: null, description: null, address: null, category_id: null, icon: null, price: null, image_url: null, google_place_id: null, osm_id: null, route_geometry: null, place_time: null, end_time: null, created_at: '' } },
      ],
    };
    expect(dayTotalCost(1, asMap(assignments), 'EUR', 'EUR', 'en')).toBeNull();
  });

  it('sums prices across assignments', () => {
    const assignments = {
      '1': [
        { id: 1, day_id: 1, order_index: 0, notes: null, place: { id: 1, trip_id: 1, name: 'A', lat: null, lng: null, description: null, address: null, category_id: null, icon: null, price: '20', image_url: null, google_place_id: null, osm_id: null, route_geometry: null, place_time: null, end_time: null, created_at: '' } },
        { id: 2, day_id: 1, order_index: 1, notes: null, place: { id: 2, trip_id: 1, name: 'B', lat: null, lng: null, description: null, address: null, category_id: null, icon: null, price: '30', image_url: null, google_place_id: null, osm_id: null, route_geometry: null, place_time: null, end_time: null, created_at: '' } },
      ],
    };
    expect(norm(dayTotalCost(1, asMap(assignments), 'EUR', 'EUR', 'en'))).toBe('50 €');
  });

  it('ignores non-numeric price strings', () => {
    const assignments = {
      '1': [
        { id: 1, day_id: 1, order_index: 0, notes: null, place: { id: 1, trip_id: 1, name: 'A', lat: null, lng: null, description: null, address: null, category_id: null, icon: null, price: 'free', image_url: null, google_place_id: null, osm_id: null, route_geometry: null, place_time: null, end_time: null, created_at: '' } },
      ],
    };
    expect(dayTotalCost(1, asMap(assignments), 'EUR', 'EUR', 'en')).toBeNull();
  });

  it('uses the dayId key to look up assignments', () => {
    const assignments = {
      '2': [
        { id: 3, day_id: 2, order_index: 0, notes: null, place: { id: 3, trip_id: 1, name: 'C', lat: null, lng: null, description: null, address: null, category_id: null, icon: null, price: '10', image_url: null, google_place_id: null, osm_id: null, route_geometry: null, place_time: null, end_time: null, created_at: '' } },
      ],
    };
    expect(dayTotalCost(1, asMap(assignments), 'USD', 'USD', 'en')).toBeNull();
    expect(dayTotalCost(2, asMap(assignments), 'USD', 'USD', 'en')).toBe('$10');
  });

  it('resolves a currency-less place to the trip currency, converting into the base (#1561)', () => {
    const assignments = {
      '1': [
        { id: 1, day_id: 1, order_index: 0, notes: null, place: { id: 1, trip_id: 1, name: 'A', lat: null, lng: null, description: null, address: null, category_id: null, icon: null, price: '100', currency: null, image_url: null, google_place_id: null, osm_id: null, route_geometry: null, place_time: null, end_time: null, created_at: '' } },
      ],
    };
    // base USD, trip NOK: the implicit-NOK price must convert (rates[NOK]=10 per USD)…
    expect(dayTotalCost(1, asMap(assignments), 'USD', 'NOK', 'en', { NOK: 10 })).toBe('≈ $10');
    // …and without rates it must show as NOK, never as a raw number labeled USD.
    expect(norm(dayTotalCost(1, asMap(assignments), 'USD', 'NOK', 'en'))).toMatch(/100\s?kr|kr\s?100/);
  });

  it('mislabels nothing when a foreign-currency price has no rate (#1561)', () => {
    const assignments = {
      '1': [
        { id: 1, day_id: 1, order_index: 0, notes: null, place: { id: 1, trip_id: 1, name: 'Hotel', lat: null, lng: null, description: null, address: null, category_id: null, icon: null, price: 2730.27, currency: 'USD', image_url: null, google_place_id: null, osm_id: null, route_geometry: null, place_time: null, end_time: null, created_at: '' } },
        { id: 2, day_id: 1, order_index: 1, notes: null, place: { id: 2, trip_id: 1, name: 'Museum', lat: null, lng: null, description: null, address: null, category_id: null, icon: null, price: 2500, currency: 'NOK', image_url: null, google_place_id: null, osm_id: null, route_geometry: null, place_time: null, end_time: null, created_at: '' } },
      ],
    };
    const out = norm(dayTotalCost(1, asMap(assignments), 'NOK', 'NOK', 'en'));
    expect(out).toContain(' + ');
    expect(out).toMatch(/2 500\s?kr|kr\s?2 500/);
    expect(out).toContain('$2,730');
    expect(out).not.toContain('≈');
  });
});
