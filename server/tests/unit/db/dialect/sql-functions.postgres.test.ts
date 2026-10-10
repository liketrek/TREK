import {
  castIntegerKysely,
  concatKysely,
  currentTimestampKysely,
  nowPlusSecondsKysely,
  startsWithIsoDateKysely,
  substringKysely,
  unixEpochToIsoKysely,
} from '../../../../src/db/dialect/kysely-functions';
import {
  isKnownPlatform,
  isPostgres,
  isSqlite,
  pgDateText,
  pgTimestampText,
} from '../../../../src/db/dialect/platform';
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
} from '../../../../src/db/dialect/sql-functions';
import { Platform } from '@mikro-orm/core';
import { BasePostgreSqlPlatform, SqlitePlatform } from '@mikro-orm/sql';

import {
  DummyDriver,
  expressionBuilder,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from 'kysely';
import { describe, expect, it } from 'vitest';

/**
 * The Postgres branches of the dialect layer, pinned as compiled text. Nothing
 * here talks to a Postgres server: the CI `postgres-probe` job
 * (`scripts/pg-probe.ts`) runs every one of these spellings against a real
 * one and compares the values with what SQLite returns. This file holds the
 * text, so a change to a spelling is a visible diff in review.
 */

const pg = new BasePostgreSqlPlatform();
const NOW = "(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')";

interface ProbeDB {
  users: { id: number; username: string; display_name: string | null; created_at: number };
}

const db = new Kysely<ProbeDB>({
  dialect: {
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (kysely) => new PostgresIntrospector(kysely),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  },
});

describe('dialect platform checks', () => {
  it('SQLFPG-001: tells SQLite, Postgres and anything else apart', () => {
    class FakePlatform extends Platform {}
    expect(isSqlite(new SqlitePlatform())).toBe(true);
    expect(isPostgres(new SqlitePlatform())).toBe(false);
    expect(isPostgres(pg)).toBe(true);
    expect(isSqlite(pg)).toBe(false);
    expect(isKnownPlatform(pg)).toBe(true);
    expect(isKnownPlatform(new SqlitePlatform())).toBe(true);
    expect(isKnownPlatform(new FakePlatform())).toBe(false);
  });

  it("SQLFPG-002: renders a timestamp expression as SQLite's timestamp and date text", () => {
    expect(pgTimestampText('x')).toBe("to_char(x, 'YYYY-MM-DD HH24:MI:SS')");
    expect(pgDateText('x')).toBe("to_char(x, 'YYYY-MM-DD')");
  });
});

describe('sql-functions (postgres)', () => {
  it("SQLFPG-010: the clock helpers render SQLite's UTC text", () => {
    expect(currentTimestamp(pg).sql).toBe(`to_char(${NOW}, 'YYYY-MM-DD HH24:MI:SS')`);
    expect(nowMinusDays(pg, 30).sql).toBe(`to_char(${NOW} - INTERVAL '30 days', 'YYYY-MM-DD HH24:MI:SS')`);
    expect(nowMinusHours(pg, 20).sql).toBe(`to_char(${NOW} - INTERVAL '20 hours', 'YYYY-MM-DD HH24:MI:SS')`);
    expect(nowPlusSeconds(pg, 90).sql).toBe(`to_char(${NOW} + INTERVAL '90 seconds', 'YYYY-MM-DD HH24:MI:SS')`);
    expect(nowDateOffset(pg, -400).sql).toBe(`to_char(${NOW} + INTERVAL '-400 days', 'YYYY-MM-DD')`);
    expect(nowDateOffset(pg, 1).sql).toBe(`to_char(${NOW} + INTERVAL '1 days', 'YYYY-MM-DD')`);
  });

  it('SQLFPG-011: the column date helpers cast the stored text to a timestamp', () => {
    expect(dateOf(pg, 'u.created_at').sql).toBe("to_char(CAST(u.created_at AS timestamp), 'YYYY-MM-DD')");
    expect(dateAdd(pg, 'u.created_at', 10).sql).toBe(
      "to_char(CAST(u.created_at AS timestamp) + INTERVAL '10 days', 'YYYY-MM-DD')",
    );
    expect(dateAdd(pg, 'u.created_at', -3).sql).toBe(
      "to_char(CAST(u.created_at AS timestamp) + INTERVAL '-3 days', 'YYYY-MM-DD')",
    );
    const distance = dayDistance(pg, 'date', '2026-01-01');
    expect(distance.sql).toBe('ABS(EXTRACT(EPOCH FROM (CAST(date AS timestamp) - CAST(? AS timestamp))) / 86400)');
    expect(distance.params).toEqual(['2026-01-01']);
  });

  it('SQLFPG-012: the validation guards hold on Postgres as they do on SQLite', () => {
    expect(() => dateOf(pg, 'u.created_at); DROP TABLE users; --')).toThrow(/not a column reference/);
    expect(() => dateAdd(pg, 'u.created_at', 1.5)).toThrow(/integer day count/);
    expect(() => nowMinusDays(pg, -1)).toThrow(/non-negative integer day count/);
    expect(() => nowMinusHours(pg, 0.5)).toThrow(/non-negative integer hour count/);
    expect(() => nowPlusSeconds(pg, -1)).toThrow(/non-negative integer second count/);
    expect(() => nowDateOffset(pg, 0.5)).toThrow(/integer day count/);
    expect(() => substring(pg, 'r.t', 0)).toThrow(/1-based integer start/);
    expect(() => concat(pg, { column: 'a.b' })).toThrow(/at least two parts/);
  });

  it('SQLFPG-013: the spellings both engines read alike stay byte-identical', () => {
    expect(columnRef(pg, 'u.max_uses').sql).toBe('u.max_uses');
    expect(columnIncrementedBy(pg, 'u.used_count', -2).sql).toBe('u.used_count - 2');
    expect(columnIncrementedBy(pg, 'u.used_count', 1).sql).toBe('u.used_count + 1');
    expect(lower(pg, 'u.email').sql).toBe('LOWER(u.email)');
    expect(lowerParam(pg, 'JOSÉ@x.com').params).toEqual(['JOSÉ@x.com']);
    expect(lowerParam(pg, 'x').sql).toBe('LOWER(?)');
    expect(trim(pg, 'p.name').sql).toBe('TRIM(p.name)');
    expect(lowerTrim(pg, 'p.name').sql).toBe('LOWER(TRIM(p.name))');
    expect(lowerTrimParam(pg, ' X ').sql).toBe('LOWER(TRIM(?))');
    expect(coalesce(pg, 'a.x', 'a.y').sql).toBe('COALESCE(a.x, a.y)');
    expect(coalesceParam(pg, 'a.x', 3).sql).toBe('COALESCE(a.x, ?)');
    expect(coalesceOverride(pg, 'v', 'a.x').sql).toBe('COALESCE(?, a.x)');
    expect(absDifference(pg, 'p.lat', 1.5).sql).toBe('ABS(p.lat - ?)');
    expect(countAll(pg, 'total').sql).toBe('COUNT(*) as total');
    expect(minOf(pg, 'p.at', 'first').sql).toBe('MIN(p.at) as first');
    expect(maxOf(pg, 'p.at', 'last').sql).toBe('MAX(p.at) as last');
    expect(countAllRef(pg).sql).toBe('COUNT(*)');
    expect(caseWhenEquals(pg, 'u.id', 1, 'owner', 'member').sql).toBe('CASE WHEN u.id = ? THEN ? ELSE ? END');
    expect(caseWhenNotNull(pg, 'p.tour_id', 'p.route').sql).toBe('CASE WHEN p.tour_id IS NOT NULL THEN p.route END');
    expect(foundAgainState(pg, 's.state', 's.file_id').sql).toBe(
      "CASE WHEN s.state = 'remote_missing' AND s.file_id IS NOT NULL THEN 'synced' ELSE s.state END",
    );
    expect(substring(pg, 'r.t', 1, 10).sql).toBe('substr(r.t, 1, 10)');
    expect(substring(pg, 'r.t', 12).sql).toBe('substr(r.t, 12)');
    const joined = concat(pg, { column: 'd.date' }, { value: 'T' }, { column: 'a.check_in' });
    expect(joined.sql).toBe('d.date || ? || a.check_in');
    expect(joined.params).toEqual(['T']);
  });

  it('SQLFPG-014: GLOB, the integer cast, NOCASE and the null-safe IS get their Postgres forms', () => {
    expect(startsWithIsoDate(pg, 'r.reservation_time').sql).toBe(
      "CAST(r.reservation_time AS text) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'",
    );
    expect(castInteger(pg, 'vr.accommodation_id').sql).toBe(
      'CAST(trunc(CAST(vr.accommodation_id AS numeric)) AS integer)',
    );
    expect(collateNoCase(pg, 'name').sql).toBe('name COLLATE "nocase"');
    const whileSame = coalesceOverrideWhileSame(pg, null, 'u.tls', 'u.url', 'https://a');
    expect(whileSame.sql).toBe(
      'CASE WHEN u.url IS NOT DISTINCT FROM ? THEN COALESCE(?, u.tls) ELSE COALESCE(?, 0) END',
    );
    expect(whileSame.params).toEqual(['https://a', null, null]);
  });
});

describe('kysely-functions (postgres)', () => {
  it('SQLFPG-020: startsWithIsoDateKysely is an anchored regular expression over the text', () => {
    const compiled = db
      .selectFrom('users')
      .select((eb) => startsWithIsoDateKysely(pg, eb, 'username').as('v'))
      .compile();
    expect(compiled.sql).toBe('select cast("username" as text) ~ $1 as "v" from "users"');
    expect(compiled.parameters).toEqual(['^[0-9]{4}-[0-9]{2}-[0-9]{2}']);
  });

  it('SQLFPG-021: substringKysely and concatKysely compose, a bound part cast to text', () => {
    const compiled = db
      .selectFrom('users')
      .select((eb) =>
        concatKysely(
          pg,
          eb,
          { column: 'username' },
          { value: 'T' },
          { expression: substringKysely(pg, eb, 'username', 12) },
        ).as('v'),
      )
      .compile();
    expect(compiled.sql).toBe('select "username" || cast($1 as text) || substr("username", $2) as "v" from "users"');
    expect(compiled.parameters).toEqual(['T', 12]);

    const sliced = db
      .selectFrom('users')
      .select((eb) => substringKysely(pg, eb, 'username', 1, 10).as('v'))
      .compile();
    expect(sliced.sql).toBe('select substr("username", $1, $2) as "v" from "users"');
    expect(sliced.parameters).toEqual([1, 10]);
  });

  it('SQLFPG-022: castIntegerKysely truncates through numeric', () => {
    const compiled = db
      .selectFrom('users')
      .select((eb) => castIntegerKysely(pg, eb, 'display_name').as('v'))
      .compile();
    expect(compiled.sql).toBe('select cast(trunc(cast("display_name" as numeric)) as integer) as "v" from "users"');
    expect(compiled.parameters).toEqual([]);
  });

  it('SQLFPG-023: unixEpochToIsoKysely renders UTC ISO text from epoch milliseconds', () => {
    const compiled = db
      .selectFrom('users')
      .select((eb) => unixEpochToIsoKysely(pg, eb, 'created_at').as('v'))
      .compile();
    expect(compiled.sql).toBe(
      'select to_char(timezone(cast($1 as text), to_timestamp("created_at" / $2)), cast($3 as text)) as "v" from "users"',
    );
    expect(compiled.parameters).toEqual(['UTC', 1000, 'YYYY-MM-DD"T"HH24:MI:SS"Z"']);
  });

  it("SQLFPG-024: the Kysely clock helpers render SQLite's timestamp text", () => {
    const later = db
      .selectFrom('users')
      .select((eb) => nowPlusSecondsKysely(pg, eb, 45).as('v'))
      .compile();
    expect(later.sql).toBe(`select to_char(${NOW} + make_interval(secs => 45), cast($1 as text)) as "v" from "users"`);
    expect(later.parameters).toEqual(['YYYY-MM-DD HH24:MI:SS']);

    const now = db
      .selectFrom('users')
      .select(() => currentTimestampKysely(pg).as('v'))
      .compile();
    expect(now.sql).toBe(`select to_char(${NOW}, 'YYYY-MM-DD HH24:MI:SS') as "v" from "users"`);
    expect(now.parameters).toEqual([]);
  });

  it('SQLFPG-025: an unknown platform still fails closed in the Kysely twins', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    const eb = expressionBuilder<ProbeDB, 'users'>();
    expect(() => startsWithIsoDateKysely(foreign, eb, 'username')).toThrow(
      /no implementation for platform FakePlatform/,
    );
    expect(() => substringKysely(foreign, eb, 'username', 1)).toThrow(/no implementation for platform FakePlatform/);
    expect(() => concatKysely(foreign, eb, { value: 'a' }, { value: 'b' })).toThrow(
      /no implementation for platform FakePlatform/,
    );
    expect(() => castIntegerKysely(foreign, eb, 'display_name')).toThrow(/no implementation for platform FakePlatform/);
    expect(() => unixEpochToIsoKysely(foreign, eb, 'created_at')).toThrow(
      /no implementation for platform FakePlatform/,
    );
    expect(() => nowPlusSecondsKysely(foreign, eb, 1)).toThrow(/no implementation for platform FakePlatform/);
    expect(() => currentTimestampKysely(foreign)).toThrow(/no implementation for platform FakePlatform/);
  });
});
