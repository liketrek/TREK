import { toRowId, uriRowId, withRowId } from '../../../../src/nest/common/row-id';

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

describe('withRowId', () => {
  it('ROWID-013: reads with the parsed id', async () => {
    expect(await withRowId('42', async (id) => id + 1)).toBe(43);
  });

  it('ROWID-014: answers undefined without reading for a spelling toRowId refuses', async () => {
    let read = false;
    const spellings = ['0x2a', '42e0', '42.0', '+42', '4_2', ' 42', 'abc', '99999999999999999999'];
    const answers = await Promise.all(spellings.map((spelling) => withRowId(spelling, async () => ((read = true), 1))));
    expect(answers).toEqual(spellings.map(() => undefined));
    expect(read).toBe(false);
  });
});

describe('uriRowId', () => {
  it('ROWID-015: reads the first value of an MCP URI variable as a positive id', () => {
    expect(uriRowId('7')).toBe(7);
    expect(uriRowId(['8', '9'])).toBe(8);
  });

  it('ROWID-016: refuses zero and every spelling toRowId refuses, Number() read them as ids', () => {
    for (const spelling of ['0', '0x7', '7e0', '7.0', '+7', '1e20', 'not-a-number']) {
      expect(uriRowId(spelling)).toBeNull();
    }
  });
});
