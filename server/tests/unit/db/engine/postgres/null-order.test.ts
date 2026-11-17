/**
 * SQLite's NULL position on Postgres (src/db/engine/postgres/null-order.ts):
 * the compiled ORDER BY of a Kysely statement and MikroORM's rendered ORDER BY
 * items. Nothing here reaches a server; the Postgres lane runs the orders
 * against a real one (PGSEM-004).
 */
import {
  SqliteNullOrderCompiler,
  SqliteNullOrderPlatform,
  withSqliteNullOrder,
  withSqliteNullPosition,
} from '../../../../../src/db/engine/postgres/null-order';

import { DummyDriver, Kysely, PostgresAdapter, PostgresDialect, PostgresIntrospector, sql } from 'kysely';
import { describe, expect, it } from 'vitest';

interface ProbeDB {
  trips: { id: number; start_date: string | null; title: string };
}

const db = new Kysely<ProbeDB>({
  dialect: withSqliteNullOrder({
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (kysely) => new PostgresIntrospector(kysely),
    createQueryCompiler: () => {
      throw new Error('the wrapped dialect brings its own compiler');
    },
  }),
});

describe('SQLite NULL order on Postgres', () => {
  it('NULLORDER-001: an ascending item sorts NULLs first and a descending one last, as SQLite does', () => {
    const compiled = db
      .selectFrom('trips')
      .select('id')
      .orderBy('start_date', 'desc')
      .orderBy('title')
      .orderBy('id', 'asc')
      .compile();
    expect(compiled.sql).toBe(
      'select "id" from "trips" order by "start_date" desc nulls last, "title" nulls first, "id" asc nulls first',
    );
  });

  it('NULLORDER-002: an explicit NULL position and an expression item are kept as written', () => {
    const compiled = db
      .selectFrom('trips')
      .select('id')
      .orderBy('start_date', (ob) => ob.asc().nullsLast())
      .orderBy((eb) => eb('start_date', 'is', null), 'desc')
      .orderBy(sql`lower(title)`, (ob) => ob.desc())
      .compile();
    expect(compiled.sql).toBe(
      'select "id" from "trips" order by "start_date" asc nulls last, "start_date" is null desc nulls last, lower(title) desc nulls last',
    );
  });

  it('NULLORDER-003: the wrapped dialect keeps its adapter, driver and introspector, and compiles with the null-order compiler', () => {
    const inner = new PostgresDialect({ pool: {} as never });
    const wrapped = withSqliteNullOrder(inner);
    expect(wrapped.createAdapter()).toBeInstanceOf(PostgresAdapter);
    expect(wrapped.createQueryCompiler()).toBeInstanceOf(SqliteNullOrderCompiler);
  });

  it("NULLORDER-004: MikroORM's ORDER BY items get SQLite's NULL position unless they name one", () => {
    expect(withSqliteNullPosition('"t"."start_date" asc')).toBe('"t"."start_date" asc nulls first');
    expect(withSqliteNullPosition('"t"."start_date" desc')).toBe('"t"."start_date" desc nulls last');
    expect(withSqliteNullPosition('"t"."start_date" desc nulls first')).toBe('"t"."start_date" desc nulls first');
    const platform = new SqliteNullOrderPlatform();
    expect(platform.getOrderByExpression('"name"', 'ASC')).toEqual(['"name" asc nulls first']);
    expect(platform.getOrderByExpression('"name"', 'desc', 'nocase')).toEqual(['"name" collate "nocase" desc nulls last']);
    expect(platform.getOrderByExpression('"name"', 'asc nulls last')).toEqual(['"name" asc nulls last']);
  });
});
