import { describe, expect, it } from 'vitest';
import { DB_TIMESTAMP_RE, DbTimestampType, dbNow, parseDbTimestamp, utcSuffix } from '../../../../src/db/types';
// The value converters take no platform: the wire format is the same text on
// every dialect (see db-timestamp.type.ts).
const type = new DbTimestampType();

describe('dbNow', () => {
  it('TS-001: formats a Date as the SQLite CURRENT_TIMESTAMP text, in UTC', () => {
    expect(dbNow(new Date(Date.UTC(2026, 8, 21, 13, 5, 9, 123)))).toBe('2026-09-21 13:05:09');
  });

  it('TS-002: the default is now and matches the wire format', () => {
    expect(dbNow()).toMatch(DB_TIMESTAMP_RE);
  });
});

describe('DbTimestampType', () => {
  it('TS-003: passes stored text through unchanged on read', () => {
    expect(type.convertToJSValue('2026-09-21 13:05:09')).toBe('2026-09-21 13:05:09');
  });

  it('TS-004: formats a Date a driver hands back (Postgres later) to the same text', () => {
    expect(type.convertToJSValue(new Date(Date.UTC(2026, 8, 21, 13, 5, 9)) as unknown as string))
      .toBe('2026-09-21 13:05:09');
  });

  it('TS-005: a millisecond integer (a Date written by the stock DateTimeType) reads back as text', () => {
    expect(type.convertToJSValue(Date.UTC(2026, 8, 21, 13, 5, 9) as unknown as string))
      .toBe('2026-09-21 13:05:09');
  });

  it('TS-006: writes text unchanged and a stray Date as text, never as a number', () => {
    expect(type.convertToDatabaseValue('2026-09-21 13:05:09')).toBe('2026-09-21 13:05:09');
    expect(type.convertToDatabaseValue(new Date(Date.UTC(2026, 8, 21, 13, 5, 9)) as unknown as string))
      .toBe('2026-09-21 13:05:09');
  });

  it('TS-007: null and undefined survive both directions', () => {
    expect(type.convertToDatabaseValue(null)).toBeNull();
    expect(type.convertToDatabaseValue(undefined)).toBeUndefined();
    expect(type.convertToJSValue(null)).toBeNull();
  });

  it('TS-008: compares as a string and reports a string runtime type', () => {
    expect(type.compareAsType()).toBe('string');
    expect(type.runtimeType).toBe('string');
  });
});

describe('parseDbTimestamp', () => {
  it('TS-101: reads the canonical text as UTC, whatever the process time zone', () => {
    expect(parseDbTimestamp('2026-09-21 13:05:09')?.toISOString()).toBe('2026-09-21T13:05:09.000Z');
  });

  it('TS-102: still reads an ISO value an older writer left behind', () => {
    expect(parseDbTimestamp('2026-09-21T13:05:09.123Z')?.toISOString()).toBe('2026-09-21T13:05:09.123Z');
  });

  it('TS-103: empty and unparseable values are null', () => {
    expect(parseDbTimestamp(null)).toBeNull();
    expect(parseDbTimestamp(undefined)).toBeNull();
    expect(parseDbTimestamp('')).toBeNull();
    expect(parseDbTimestamp('not a date')).toBeNull();
  });

  it('TS-104: round-trips dbNow to the second', () => {
    const at = new Date(Date.UTC(2026, 0, 2, 3, 4, 5, 999));
    expect(parseDbTimestamp(dbNow(at))?.getTime()).toBe(Date.UTC(2026, 0, 2, 3, 4, 5));
  });
});

describe('utcSuffix', () => {
  it('TS-111: returns null for null, undefined and the empty string', () => {
    expect(utcSuffix(null)).toBeNull();
    expect(utcSuffix(undefined)).toBeNull();
    expect(utcSuffix('')).toBeNull();
  });

  it('TS-112: returns a timestamp already ending with Z unchanged', () => {
    expect(utcSuffix('2024-01-01T12:00:00Z')).toBe('2024-01-01T12:00:00Z');
  });

  it('TS-113: replaces the space with T and appends Z for the canonical text', () => {
    expect(utcSuffix('2024-01-01 12:00:00')).toBe('2024-01-01T12:00:00Z');
  });

  it('TS-114: appends Z when T is present but Z is missing', () => {
    expect(utcSuffix('2024-06-15T08:30:00')).toBe('2024-06-15T08:30:00Z');
  });
});
