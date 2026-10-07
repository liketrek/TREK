import { DB_TIMESTAMP_RE, DbTimestampType, dbNow } from '../../../../src/db/types';

import { describe, expect, it } from 'vitest';

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
    expect(type.convertToJSValue(new Date(Date.UTC(2026, 8, 21, 13, 5, 9)) as unknown as string)).toBe(
      '2026-09-21 13:05:09',
    );
  });

  it('TS-005: a millisecond integer (a Date written by the stock DateTimeType) reads back as text', () => {
    expect(type.convertToJSValue(Date.UTC(2026, 8, 21, 13, 5, 9) as unknown as string)).toBe('2026-09-21 13:05:09');
  });

  it('TS-006: writes text unchanged and a stray Date as text, never as a number', () => {
    expect(type.convertToDatabaseValue('2026-09-21 13:05:09')).toBe('2026-09-21 13:05:09');
    expect(type.convertToDatabaseValue(new Date(Date.UTC(2026, 8, 21, 13, 5, 9)) as unknown as string)).toBe(
      '2026-09-21 13:05:09',
    );
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
