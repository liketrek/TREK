import { toRowId } from '../../../../src/nest/common/row-id';

import { describe, it, expect } from 'vitest';

describe('toRowId', () => {
  it('ROWID-001: rejects a non-numeric string', () => {
    expect(toRowId('abc')).toBeNull();
  });

  it('ROWID-002: rejects a hex-shaped string — Number() would accept it, SQLite affinity never would (verified against better-sqlite3)', () => {
    expect(toRowId('0x10')).toBeNull();
  });

  it("ROWID-003: rejects an exponent-shaped string (\"1e3\") — a DELIBERATE, ACCEPTED deviation: SQLite's own numeric-affinity comparison DOES match this against integer 1000 (verified against better-sqlite3, not assumed — the row-id.ts docstring previously claimed the opposite), but no id this guard ever sees originates that way (every id is a canonical decimal string from our own client), so this fails closed to the route's legacy not-found result instead of widening the guard to match SQLite's affinity exactly", () => {
    expect(toRowId('1e3')).toBeNull();
  });

  it('ROWID-004: rejects a negative sign', () => {
    expect(toRowId('-1')).toBeNull();
  });

  it('ROWID-005: rejects a leading space (" 1") — same deliberate deviation as ROWID-003: SQLite\'s affinity conversion ignores leading whitespace and matches integer 1 (verified against better-sqlite3)', () => {
    expect(toRowId(' 1')).toBeNull();
  });

  it('ROWID-005B: rejects a trailing space ("1 ") — same deliberate deviation: SQLite\'s affinity conversion ignores trailing whitespace too and matches integer 1 (verified against better-sqlite3)', () => {
    expect(toRowId('1 ')).toBeNull();
  });

  it('ROWID-006: rejects a decimal point ("1.0") — same deliberate deviation: SQLite\'s affinity conversion parses this as REAL 1.0, which compares equal to INTEGER 1 (verified against better-sqlite3)', () => {
    expect(toRowId('1.0')).toBeNull();
  });

  it('ROWID-006B: rejects a leading plus sign ("+1") — same deliberate deviation: SQLite\'s affinity conversion accepts a leading sign and matches integer 1 (verified against better-sqlite3)', () => {
    expect(toRowId('+1')).toBeNull();
  });

  it('ROWID-007: rejects an empty string', () => {
    expect(toRowId('')).toBeNull();
  });

  it('ROWID-008: rejects undefined', () => {
    expect(toRowId(undefined)).toBeNull();
  });

  it('ROWID-009: accepts a plain digit string', () => {
    expect(toRowId('42')).toBe(42);
  });

  it('ROWID-009B: accepts a leading-zero digit string ("007") — SQLite\'s own affinity conversion resolves this to integer 7 too (verified against better-sqlite3), and the guard\'s regex (/^\\d+$/) must keep matching it: never tighten it to /^(0|[1-9]\\d*)$/', () => {
    expect(toRowId('007')).toBe(7);
  });

  it('ROWID-010: accepts an already-numeric safe integer', () => {
    expect(toRowId(42)).toBe(42);
  });

  it('ROWID-011: rejects a number one past MAX_SAFE_INTEGER (2**53)', () => {
    expect(toRowId(2 ** 53)).toBeNull();
  });

  it("ROWID-012: rejects a digits-only STRING one past MAX_SAFE_INTEGER (coverage: the string branch's own safe-integer check)", () => {
    expect(toRowId('9007199254740993')).toBeNull();
  });
});
