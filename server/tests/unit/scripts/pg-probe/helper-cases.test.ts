/**
 * The dialect-helper cases the Postgres probe runs on both engines
 * (scripts/pg-probe/helper-cases.ts). Postgres only exists in the CI job,
 * but SQLite is right here: every case must already hold on SQLite, through
 * the same engine adapter the probe uses, so a case that fails in CI points
 * at the Postgres branch and not at the case. The value comparison itself is
 * pinned too, since it is what turns a Postgres answer into pass or fail.
 */
import { sqliteHelperEngine } from '../../../../scripts/pg-probe/engines';
import {
  checkValue,
  HELPER_CASES,
  isoSeconds,
  runHelperCases,
  type HelperEngine,
} from '../../../../scripts/pg-probe/helper-cases';

import { describe, expect, it } from 'vitest';

const NOW = Date.parse('2026-10-08T12:00:00Z');

describe('pg-probe helper cases', () => {
  it('PGPROBE-050: every case holds on SQLite', async () => {
    const engine = sqliteHelperEngine();
    try {
      const results = await runHelperCases(engine);
      expect(results.filter((result) => result.failure !== null)).toEqual([]);
      expect(results).toHaveLength(HELPER_CASES.length);
      expect(results.every((result) => result.engine === 'sqlite')).toBe(true);
    } finally {
      engine.close();
    }
  });

  it('PGPROBE-051: case names are unique and every case selects through exactly one API', () => {
    const names = HELPER_CASES.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    for (const helperCase of HELPER_CASES)
      expect(Number(Boolean(helperCase.raw)) + Number(Boolean(helperCase.kysely))).toBe(1);
  });

  it('PGPROBE-052: compares values the way both drivers hand them back', () => {
    expect(checkValue({ equals: 7 }, '7', 'postgres', NOW)).toBeNull();
    expect(checkValue({ equals: 7 }, BigInt(7), 'postgres', NOW)).toBeNull();
    expect(checkValue({ equals: 3 }, '3.000000000000', 'postgres', NOW)).toBeNull();
    expect(checkValue({ equals: 7 }, 8, 'sqlite', NOW)).toBe('expected 7, got 8');
    expect(checkValue({ equals: true }, 1, 'sqlite', NOW)).toBeNull();
    expect(checkValue({ equals: true }, true, 'postgres', NOW)).toBeNull();
    expect(checkValue({ equals: false }, 0, 'sqlite', NOW)).toBeNull();
    expect(checkValue({ equals: false }, true, 'postgres', NOW)).toBe('expected false, got true');
    expect(checkValue({ equals: 'a' }, 'a', 'sqlite', NOW)).toBeNull();
    expect(checkValue({ equals: 'a' }, 'b', 'sqlite', NOW)).toBe('expected "a", got "b"');
    expect(checkValue({ equals: null }, null, 'sqlite', NOW)).toBeNull();
    expect(checkValue({ equals: null }, 'x', 'sqlite', NOW)).toBe('expected null, got "x"');
  });

  it("PGPROBE-053: holds clock values to SQLite's text and to the moment of the query", () => {
    expect(checkValue({ timestamp: 0 }, '2026-10-08 12:00:30', 'postgres', NOW)).toBeNull();
    expect(checkValue({ timestamp: 90_000 }, '2026-10-08 12:01:30', 'postgres', NOW)).toBeNull();
    expect(checkValue({ timestamp: 0 }, '2026-10-08 12:10:00', 'postgres', NOW)).toBe(
      '2026-10-08 12:10:00 is 600s off',
    );
    expect(checkValue({ timestamp: 0 }, '2026-10-08T12:00:00Z', 'postgres', NOW)).toMatch(/expected timestamp text/);
    expect(checkValue({ timestamp: 0 }, '2026-10-08 12:00:00.123456+00', 'postgres', NOW)).toMatch(
      /expected timestamp text/,
    );
    expect(checkValue({ date: -400 }, '2025-09-03', 'postgres', NOW)).toBeNull();
    expect(checkValue({ date: 1 }, '2026-10-09', 'sqlite', NOW)).toBeNull();
    expect(checkValue({ date: 1 }, '2026-10-12', 'sqlite', NOW)).toBe('2026-10-12 is not 1 day(s) from today');
    expect(checkValue({ date: 0 }, 1, 'sqlite', NOW)).toMatch(/expected date text/);
  });

  it('PGPROBE-054: an expectation may differ per engine', () => {
    const expectation = { perEngine: { sqlite: { equals: 'a' }, postgres: { equals: 'b' } } } as const;
    expect(checkValue(expectation, 'a', 'sqlite', NOW)).toBeNull();
    expect(checkValue(expectation, 'b', 'postgres', NOW)).toBeNull();
    expect(checkValue(expectation, 'a', 'postgres', NOW)).toBe('expected "b", got "a"');
  });

  it('PGPROBE-055: a case that throws or names no select is a failure, not a crash', async () => {
    const sqlite = sqliteHelperEngine();
    const engine: HelperEngine = {
      ...sqlite,
      selectRaw: () => Promise.reject(new Error('relation "x" does not exist\nmore')),
    };
    const results = await runHelperCases(engine, [
      { name: 'throws', row: {}, raw: () => ({ sql: '1', params: [] }), expect: { equals: 1 } },
      { name: 'empty', row: {}, expect: { equals: 1 } },
    ]);
    sqlite.close();
    expect(results).toEqual([
      { engine: 'sqlite', name: 'throws', failure: 'threw: relation "x" does not exist' },
      { engine: 'sqlite', name: 'empty', failure: 'threw: a case needs raw or kysely' },
    ]);
  });

  it('PGPROBE-056: renders epoch milliseconds as whole-second ISO text', () => {
    expect(isoSeconds(1_758_459_909_123)).toBe(new Date(1_758_459_909_000).toISOString().replace('.000Z', 'Z'));
    expect(isoSeconds(0)).toBe('1970-01-01T00:00:00Z');
  });
});
