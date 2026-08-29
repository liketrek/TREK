import {
  csvList,
  csvListFiltered,
  nonNegativeIntOr,
  numberOr,
  parseBool,
  parseDurationMs,
  positiveIntOr,
  positiveNumberOr,
  resolveKeepaliveMs,
  resolveSessionTtlMs,
  stripTrailingSlashes,
} from '../../../src/app-config/parsers';

import { describe, it, expect } from 'vitest';

describe('parseBool', () => {
  it('accepts the whole truthy family, any casing, padded', () => {
    for (const v of ['true', 'TRUE', 'True', '1', 'on', 'ON', 'yes', 'Yes', ' true ']) {
      expect(parseBool(v)).toBe(true);
    }
  });

  it('accepts the whole falsy family', () => {
    for (const v of ['false', 'FALSE', '0', 'off', 'OFF', 'no', 'No', ' off ']) {
      expect(parseBool(v)).toBe(false);
    }
  });

  it('returns undefined for unset, blank and out-of-family values (default applies)', () => {
    expect(parseBool(undefined)).toBeUndefined();
    expect(parseBool('')).toBeUndefined();
    expect(parseBool('  ')).toBeUndefined();
    expect(parseBool('maybe')).toBeUndefined();
    expect(parseBool('enabled')).toBeUndefined();
  });
});

describe('numberOr', () => {
  it('parses plain numbers', () => {
    expect(numberOr('8080', 3001)).toBe(8080);
  });

  // Pins the legacy `Number(x) || d` quirk: "0" is treated as unset.
  it('falls back on NaN, empty and "0"', () => {
    expect(numberOr('abc', 3001)).toBe(3001);
    expect(numberOr('', 3001)).toBe(3001);
    expect(numberOr(undefined, 3001)).toBe(3001);
    expect(numberOr('0', 3001)).toBe(3001);
  });

  it('keeps negative values (legacy quirk: -5 || d === -5)', () => {
    expect(numberOr('-5', 3001)).toBe(-5);
  });
});

describe('positiveNumberOr', () => {
  it('accepts positive numbers including fractions', () => {
    expect(positiveNumberOr('12.5', 500)).toBe(12.5);
  });

  it('falls back on zero, negatives, NaN and unset', () => {
    expect(positiveNumberOr('0', 500)).toBe(500);
    expect(positiveNumberOr('-3', 500)).toBe(500);
    expect(positiveNumberOr('abc', 500)).toBe(500);
    expect(positiveNumberOr(undefined, 500)).toBe(500);
  });
});

describe('positiveIntOr', () => {
  it('parses leading integers the way parseInt does (pins "5x" → 5)', () => {
    expect(positiveIntOr('5', 20)).toBe(5);
    expect(positiveIntOr('5x', 20)).toBe(5);
  });

  it('falls back on zero, negatives and garbage', () => {
    expect(positiveIntOr('0', 20)).toBe(20);
    expect(positiveIntOr('-1', 20)).toBe(20);
    expect(positiveIntOr('abc', 20)).toBe(20);
    expect(positiveIntOr(undefined, 20)).toBe(20);
  });
});

describe('nonNegativeIntOr', () => {
  it('accepts zero (0 disables retries) and positive integers', () => {
    expect(nonNegativeIntOr('0', 1)).toBe(0);
    expect(nonNegativeIntOr('3', 1)).toBe(3);
  });
  it('falls back on unset, blank, negative, and non-numeric', () => {
    expect(nonNegativeIntOr(undefined, 1)).toBe(1);
    expect(nonNegativeIntOr('  ', 1)).toBe(1);
    expect(nonNegativeIntOr('-1', 1)).toBe(1);
    expect(nonNegativeIntOr('nope', 1)).toBe(1);
  });
});

describe('csvList / csvListFiltered', () => {
  it('returns null when unset or empty', () => {
    expect(csvList(undefined)).toBeNull();
    expect(csvList('')).toBeNull();
    expect(csvListFiltered(undefined)).toBeNull();
  });

  it('trims entries', () => {
    expect(csvList(' a.example , b.example ')).toEqual(['a.example', 'b.example']);
  });

  // The two ALLOWED_ORIGINS call sites differ: websocket keeps empty entries,
  // the CORS middleware drops them. Both behaviors are pinned.
  it('csvList keeps empty entries, csvListFiltered drops them', () => {
    expect(csvList('a,,b')).toEqual(['a', '', 'b']);
    expect(csvListFiltered('a,,b')).toEqual(['a', 'b']);
  });
});

describe('stripTrailingSlashes', () => {
  it('strips all trailing slashes', () => {
    expect(stripTrailingSlashes('https://x.example///')).toBe('https://x.example');
    expect(stripTrailingSlashes('https://x.example')).toBe('https://x.example');
  });
});

describe('parseDurationMs', () => {
  it('parses the ms-style units used by SESSION_DURATION', () => {
    expect(parseDurationMs('1h')).toBe(3_600_000);
    expect(parseDurationMs('7d')).toBe(7 * 86_400_000);
    expect(parseDurationMs('500')).toBe(500); // unitless = ms
    expect(parseDurationMs(' 12H ')).toBe(12 * 3_600_000); // trims + case-insensitive
    expect(parseDurationMs('1.5h')).toBe(1.5 * 3_600_000);
  });

  it('rejects zero, negatives and garbage', () => {
    expect(parseDurationMs('0h')).toBeNull();
    expect(parseDurationMs('bogus')).toBeNull();
    expect(parseDurationMs('-1d')).toBeNull();
    expect(parseDurationMs('1 fortnight')).toBeNull();
  });
});

describe('resolveSessionTtlMs', () => {
  it('defaults to 1h and clamps to 24h', () => {
    expect(resolveSessionTtlMs(undefined)).toBe(3_600_000);
    expect(resolveSessionTtlMs('120')).toBe(120_000);
    expect(resolveSessionTtlMs(String(48 * 60 * 60))).toBe(24 * 60 * 60 * 1000);
    expect(resolveSessionTtlMs('0')).toBe(3_600_000);
    expect(resolveSessionTtlMs('abc')).toBe(3_600_000);
  });
});

describe('resolveKeepaliveMs', () => {
  it('defaults to 25s and allows 0 to disable', () => {
    expect(resolveKeepaliveMs(undefined)).toBe(25_000);
    expect(resolveKeepaliveMs('10')).toBe(10_000);
    expect(resolveKeepaliveMs('0')).toBe(0);
    expect(resolveKeepaliveMs('abc')).toBe(25_000);
  });
});
