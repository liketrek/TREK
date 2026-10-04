import { describe, it, expect } from 'vitest';
import { formatDate, formatTime, formatClockTime, currencyDecimals, parseMeridiemTime } from '../../../src/utils/formatters';

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
