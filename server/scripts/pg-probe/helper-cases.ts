/**
 * The dialect helpers, run on both engines.
 *
 * Each case puts one row into a scratch table, selects one helper's
 * expression over it and checks the value. The same case runs on SQLite
 * (an in-memory better-sqlite3 database) and on Postgres, so a Postgres
 * branch is held to what its SQLite twin returns, not to a value written
 * down once. The cases stay inside what both engines agree on: Postgres
 * folds every letter in LOWER and NOCASE while SQLite folds only ASCII (the
 * helpers' docstrings say so), and what Postgres does with a non-ASCII
 * letter also depends on the database's locale, so the inputs are ASCII. An
 * expectation may still name a value per engine where they are meant to
 * differ.
 *
 * Unlike the repository statements, nothing here is baselined: every case
 * must pass on both engines.
 */
import {
  castIntegerKysely,
  concatKysely,
  currentTimestampKysely,
  nowPlusSecondsKysely,
  startsWithIsoDateKysely,
  substringKysely,
  unixEpochToIsoKysely,
} from '../../src/db/dialect/kysely-functions';
import {
  absDifference,
  caseWhenEquals,
  caseWhenNotNull,
  castInteger,
  coalesce,
  coalesceOverride,
  coalesceOverrideWhileSame,
  coalesceParam,
  collateNoCase,
  columnIncrementedBy,
  columnRef,
  concat,
  countAll,
  countAllRef,
  currentTimestamp,
  dateAdd,
  dateOf,
  dayDistance,
  foundAgainState,
  lower,
  lowerParam,
  lowerTrim,
  lowerTrimParam,
  maxOf,
  minOf,
  nowDateOffset,
  nowMinusDays,
  nowMinusHours,
  nowPlusSeconds,
  startsWithIsoDate,
  substring,
  trim,
} from '../../src/db/dialect/sql-functions';
import type { Platform } from '@mikro-orm/core';

import type { AliasableExpression, ExpressionBuilder } from 'kysely';

export type Engine = 'sqlite' | 'postgres';

export const VALUES_TABLE = 'trek_pg_probe_values';

export interface ValuesRow {
  id: number;
  a: string | null;
  b: string | null;
  n: number | null;
  x: number | null;
}

export interface ValuesDB {
  trek_pg_probe_values: ValuesRow;
}

export const VALUES_TABLE_DDL: Record<Engine, string> = {
  sqlite: `CREATE TABLE ${VALUES_TABLE} (id INTEGER PRIMARY KEY, a TEXT, b TEXT, n INTEGER, x REAL)`,
  postgres: `CREATE TABLE ${VALUES_TABLE} (id integer PRIMARY KEY, a text, b text, n bigint, x double precision)`,
};

/** A fragment rendered into `select <sql> [as v] from trek_pg_probe_values`. */
export interface RawSelect {
  sql: string;
  params: unknown[];
  /** The fragment already names its column (`COUNT(*) as c`); read that one instead of `v`. */
  column?: string;
}

export type KyselySelect = (
  platform: Platform,
  eb: ExpressionBuilder<ValuesDB, 'trek_pg_probe_values'>,
) => AliasableExpression<unknown>;

export type Expectation =
  | { equals: string | number | boolean | null }
  | { timestamp: number }
  | { date: number }
  | { perEngine: Record<Engine, Expectation> };

export interface HelperCase {
  name: string;
  row: Partial<Omit<ValuesRow, 'id'>>;
  raw?: (platform: Platform) => RawSelect;
  kysely?: KyselySelect;
  expect: Expectation;
}

const DAY_MS = 86_400_000;
const CLOCK_TOLERANCE_MS = 120_000;

const rawOf = (fragment: { sql: string; params: readonly unknown[] }, column?: string): RawSelect => ({
  sql: fragment.sql,
  params: [...fragment.params],
  column,
});

/** `(<key> = <value>)` for the helpers used as a filter key. */
const comparison = (
  key: { sql: string; params: readonly unknown[] },
  value: { sql: string; params: readonly unknown[] },
): RawSelect => ({
  sql: `(${key.sql} = ${value.sql})`,
  params: [...key.params, ...value.params],
});

const bound = (value: unknown): { sql: string; params: unknown[] } => ({ sql: '?', params: [value] });

/** Epoch milliseconds as the ISO text `unixEpochToIsoKysely` renders (whole seconds, `Z`). */
export function isoSeconds(ms: number): string {
  return new Date(Math.floor(ms / 1000) * 1000).toISOString().replace('.000Z', 'Z');
}

const EPOCH_MS = 1_758_459_909_123;

export const HELPER_CASES: readonly HelperCase[] = [
  {
    name: 'dateOf',
    row: { a: '2026-09-21 13:05:09' },
    raw: (p) => rawOf(dateOf(p, 'a')),
    expect: { equals: '2026-09-21' },
  },
  {
    name: 'dateAdd forward',
    row: { a: '2026-09-21 13:05:09' },
    raw: (p) => rawOf(dateAdd(p, 'a', 10)),
    expect: { equals: '2026-10-01' },
  },
  {
    name: 'dateAdd back',
    row: { a: '2026-09-21 13:05:09' },
    raw: (p) => rawOf(dateAdd(p, 'a', -10)),
    expect: { equals: '2026-09-11' },
  },
  { name: 'currentTimestamp', row: {}, raw: (p) => rawOf(currentTimestamp(p)), expect: { timestamp: 0 } },
  { name: 'nowMinusDays', row: {}, raw: (p) => rawOf(nowMinusDays(p, 30)), expect: { timestamp: -30 * DAY_MS } },
  { name: 'nowMinusHours', row: {}, raw: (p) => rawOf(nowMinusHours(p, 20)), expect: { timestamp: -20 * 3_600_000 } },
  { name: 'nowPlusSeconds', row: {}, raw: (p) => rawOf(nowPlusSeconds(p, 90)), expect: { timestamp: 90_000 } },
  { name: 'nowDateOffset back', row: {}, raw: (p) => rawOf(nowDateOffset(p, -400)), expect: { date: -400 } },
  { name: 'nowDateOffset forward', row: {}, raw: (p) => rawOf(nowDateOffset(p, 1)), expect: { date: 1 } },
  { name: 'columnRef', row: { n: 7 }, raw: (p) => rawOf(columnRef(p, 'n')), expect: { equals: 7 } },
  {
    name: 'columnIncrementedBy',
    row: { n: 7 },
    raw: (p) => rawOf(columnIncrementedBy(p, 'n', -2)),
    expect: { equals: 5 },
  },
  { name: 'lower', row: { a: 'Probe@X.com' }, raw: (p) => rawOf(lower(p, 'a')), expect: { equals: 'probe@x.com' } },
  {
    name: 'lower = lowerParam',
    row: { a: 'Probe@X.com' },
    raw: (p) => comparison(lower(p, 'a'), lowerParam(p, 'PROBE@x.COM')),
    expect: { equals: true },
  },
  { name: 'trim', row: { a: '  probe  ' }, raw: (p) => rawOf(trim(p, 'a')), expect: { equals: 'probe' } },
  { name: 'lowerTrim', row: { a: '  AbC ' }, raw: (p) => rawOf(lowerTrim(p, 'a')), expect: { equals: 'abc' } },
  {
    name: 'lowerTrim = lowerTrimParam',
    row: { a: ' AbC ' },
    raw: (p) => comparison(lowerTrim(p, 'a'), lowerTrimParam(p, '  aBc')),
    expect: { equals: true },
  },
  {
    name: 'coalesce',
    row: { a: null, b: 'fallback' },
    raw: (p) => rawOf(coalesce(p, 'a', 'b')),
    expect: { equals: 'fallback' },
  },
  {
    name: 'coalesceParam keeps the column',
    row: { a: 'stored' },
    raw: (p) => rawOf(coalesceParam(p, 'a', 'new')),
    expect: { equals: 'stored' },
  },
  {
    name: 'coalesceParam fills a null',
    row: { a: null },
    raw: (p) => rawOf(coalesceParam(p, 'a', 'new')),
    expect: { equals: 'new' },
  },
  {
    name: 'coalesceOverride prefers the value',
    row: { a: 'stored' },
    raw: (p) => rawOf(coalesceOverride(p, 'new', 'a')),
    expect: { equals: 'new' },
  },
  {
    name: 'coalesceOverride keeps on null',
    row: { a: 'stored' },
    raw: (p) => rawOf(coalesceOverride(p, null, 'a')),
    expect: { equals: 'stored' },
  },
  { name: 'absDifference', row: { x: 4 }, raw: (p) => rawOf(absDifference(p, 'x', 6.5)), expect: { equals: 2.5 } },
  { name: 'countAll', row: {}, raw: (p) => rawOf(countAll(p, 'c'), 'c'), expect: { equals: 1 } },
  { name: 'countAllRef', row: {}, raw: (p) => rawOf(countAllRef(p)), expect: { equals: 1 } },
  { name: 'minOf', row: { n: 3 }, raw: (p) => rawOf(minOf(p, 'n', 'lo'), 'lo'), expect: { equals: 3 } },
  { name: 'maxOf', row: { n: 3 }, raw: (p) => rawOf(maxOf(p, 'n', 'hi'), 'hi'), expect: { equals: 3 } },
  {
    name: 'caseWhenEquals',
    row: { n: 7 },
    raw: (p) => rawOf(caseWhenEquals(p, 'n', 7, 'owner', 'member')),
    expect: { equals: 'owner' },
  },
  {
    name: 'caseWhenEquals else',
    row: { n: 8 },
    raw: (p) => rawOf(caseWhenEquals(p, 'n', 7, 'owner', 'member')),
    expect: { equals: 'member' },
  },
  {
    name: 'startsWithIsoDate yes',
    row: { a: '2026-09-21T10:00' },
    raw: (p) => rawOf(startsWithIsoDate(p, 'a')),
    expect: { equals: true },
  },
  {
    name: 'startsWithIsoDate no',
    row: { a: 'abcd-ef-gh' },
    raw: (p) => rawOf(startsWithIsoDate(p, 'a')),
    expect: { equals: false },
  },
  {
    name: 'substring with length',
    row: { a: '2026-09-21T10:00' },
    raw: (p) => rawOf(substring(p, 'a', 1, 10)),
    expect: { equals: '2026-09-21' },
  },
  {
    name: 'substring to the end',
    row: { a: '2026-09-21T10:00' },
    raw: (p) => rawOf(substring(p, 'a', 12)),
    expect: { equals: '10:00' },
  },
  {
    name: 'concat',
    row: { a: '2026-09-21', b: '10:00' },
    raw: (p) => rawOf(concat(p, { column: 'a' }, { value: 'T' }, { column: 'b' })),
    expect: { equals: '2026-09-21T10:00' },
  },
  { name: 'castInteger of 14.0', row: { a: '14.0' }, raw: (p) => rawOf(castInteger(p, 'a')), expect: { equals: 14 } },
  { name: 'castInteger of 14', row: { a: '14' }, raw: (p) => rawOf(castInteger(p, 'a')), expect: { equals: 14 } },
  {
    name: 'dayDistance',
    row: { a: '2026-09-21' },
    raw: (p) => rawOf(dayDistance(p, 'a', '2026-09-24')),
    expect: { equals: 3 },
  },
  {
    name: 'collateNoCase',
    row: { a: 'Probe' },
    raw: (p) => comparison(collateNoCase(p, 'a'), bound('pROBE')),
    expect: { equals: true },
  },
  {
    name: 'foundAgainState recovers',
    row: { a: 'remote_missing', b: 'file-1' },
    raw: (p) => rawOf(foundAgainState(p, 'a', 'b')),
    expect: { equals: 'synced' },
  },
  {
    name: 'foundAgainState passes through',
    row: { a: 'error', b: 'file-1' },
    raw: (p) => rawOf(foundAgainState(p, 'a', 'b')),
    expect: { equals: 'error' },
  },
  {
    name: 'coalesceOverrideWhileSame keeps for the same key',
    row: { a: 'https://a', n: 1 },
    raw: (p) => rawOf(coalesceOverrideWhileSame(p, null, 'n', 'a', 'https://a')),
    expect: { equals: 1 },
  },
  {
    name: 'coalesceOverrideWhileSame resets for a new key',
    row: { a: 'https://a', n: 1 },
    raw: (p) => rawOf(coalesceOverrideWhileSame(p, null, 'n', 'a', 'https://b')),
    expect: { equals: 0 },
  },
  {
    name: 'caseWhenNotNull',
    row: { a: 'x', b: 'route' },
    raw: (p) => rawOf(caseWhenNotNull(p, 'a', 'b')),
    expect: { equals: 'route' },
  },
  {
    name: 'caseWhenNotNull null',
    row: { a: null, b: 'route' },
    raw: (p) => rawOf(caseWhenNotNull(p, 'a', 'b')),
    expect: { equals: null },
  },
  {
    name: 'startsWithIsoDateKysely',
    row: { a: '2026-09-21 10:00:00' },
    kysely: (p, eb) =>
      eb
        .case()
        .when(startsWithIsoDateKysely(p, eb, 'a'))
        .then('yes')
        .else('no')
        .end(),
    expect: { equals: 'yes' },
  },
  {
    name: 'substringKysely',
    row: { a: '2026-09-21T10:00' },
    kysely: (p, eb) => substringKysely(p, eb, 'a', 1, 10),
    expect: { equals: '2026-09-21' },
  },
  {
    name: 'concatKysely',
    row: { a: '2026-09-21', b: 'xx10:00' },
    kysely: (p, eb) =>
      concatKysely(p, eb, { column: 'a' }, { value: 'T' }, { expression: substringKysely(p, eb, 'b', 3) }),
    expect: { equals: '2026-09-21T10:00' },
  },
  {
    name: 'castIntegerKysely',
    row: { a: '14.0' },
    kysely: (p, eb) => castIntegerKysely(p, eb, 'a'),
    expect: { equals: 14 },
  },
  {
    name: 'unixEpochToIsoKysely',
    row: { n: EPOCH_MS },
    kysely: (p, eb) => unixEpochToIsoKysely(p, eb, 'n'),
    expect: { equals: isoSeconds(EPOCH_MS) },
  },
  {
    name: 'nowPlusSecondsKysely',
    row: {},
    kysely: (p, eb) => nowPlusSecondsKysely(p, eb, 45),
    expect: { timestamp: 45_000 },
  },
  { name: 'currentTimestampKysely', row: {}, kysely: (p) => currentTimestampKysely(p), expect: { timestamp: 0 } },
];

const TIMESTAMP_TEXT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const DATE_TEXT = /^\d{4}-\d{2}-\d{2}$/;

/** Why `value` does not meet `expectation` on `engine`, or null when it does. `now` is epoch ms around the query. */
export function checkValue(expectation: Expectation, value: unknown, engine: Engine, now: number): string | null {
  if ('perEngine' in expectation) return checkValue(expectation.perEngine[engine], value, engine, now);
  if ('timestamp' in expectation) {
    if (typeof value !== 'string' || !TIMESTAMP_TEXT.test(value))
      return `expected timestamp text, got ${JSON.stringify(value)}`;
    const off = Date.parse(`${value.replace(' ', 'T')}Z`) - (now + expectation.timestamp);
    return Math.abs(off) <= CLOCK_TOLERANCE_MS ? null : `${value} is ${Math.round(off / 1000)}s off`;
  }
  if ('date' in expectation) {
    if (typeof value !== 'string' || !DATE_TEXT.test(value)) return `expected date text, got ${JSON.stringify(value)}`;
    const wanted = Date.parse(new Date(now + expectation.date * DAY_MS).toISOString().slice(0, 10));
    return Math.abs(Date.parse(value) - wanted) <= DAY_MS
      ? null
      : `${value} is not ${expectation.date} day(s) from today`;
  }
  const expected = expectation.equals;
  if (expected === null) return value === null ? null : `expected null, got ${JSON.stringify(value)}`;
  if (typeof expected === 'boolean') {
    const truthy = value === true || value === 1 || value === 't' || value === '1';
    const falsy = value === false || value === 0 || value === 'f' || value === '0';
    return (expected ? truthy : falsy) ? null : `expected ${expected}, got ${JSON.stringify(value)}`;
  }
  if (typeof expected === 'number') {
    const n =
      typeof value === 'bigint'
        ? Number(value)
        : typeof value === 'string' || typeof value === 'number'
          ? Number(value)
          : Number.NaN;
    return Math.abs(n - expected) < 1e-9
      ? null
      : `expected ${expected}, got ${JSON.stringify(typeof value === 'bigint' ? String(value) : value)}`;
  }
  return value === expected ? null : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`;
}

/** How one engine runs a case: write the row, select the expression, hand back the value. */
export interface HelperEngine {
  engine: Engine;
  platform: Platform;
  writeRow(row: ValuesRow): Promise<void>;
  selectRaw(select: RawSelect): Promise<unknown>;
  selectKysely(select: KyselySelect): Promise<unknown>;
}

export interface HelperResult {
  engine: Engine;
  name: string;
  failure: string | null;
}

export async function runHelperCases(
  engine: HelperEngine,
  cases: readonly HelperCase[] = HELPER_CASES,
): Promise<HelperResult[]> {
  const results: HelperResult[] = [];
  for (const helperCase of cases) {
    let failure: string | null;
    try {
      await engine.writeRow({ id: 1, a: null, b: null, n: null, x: null, ...helperCase.row });
      const before = Date.now();
      let value: unknown;
      if (helperCase.raw) value = await engine.selectRaw(helperCase.raw(engine.platform));
      else if (helperCase.kysely) value = await engine.selectKysely(helperCase.kysely);
      else throw new Error('a case needs raw or kysely');
      failure = checkValue(helperCase.expect, value, engine.engine, Math.round((before + Date.now()) / 2));
    } catch (error) {
      failure = `threw: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`;
    }
    results.push({ engine: engine.engine, name: helperCase.name, failure });
  }
  return results;
}
