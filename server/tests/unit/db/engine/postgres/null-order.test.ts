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
  places: { id: number; trip_id: number };
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
      'select "id" from "trips" order by "start_date" desc nulls last, "title" nulls first, "id" asc',
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

  it('NULLORDER-005: the id of a table the FROM reads gets no position, so the primary key can serve the order', () => {
    const own = db
      .selectFrom('trips as t')
      .leftJoin('places as p', 'p.trip_id', 't.id')
      .select('t.id')
      .orderBy('t.id', 'desc')
      .orderBy('p.id')
      .limit(10)
      .compile();
    expect(own.sql).toBe(
      'select "t"."id" from "trips" as "t" left join "places" as "p" on "p"."trip_id" = "t"."id" ' +
        'order by "t"."id" desc, "p"."id" nulls first limit $1',
    );

    // A bare id beside a join, or a selection named id, may be another table's or no id at all.
    const joined = db
      .selectFrom('trips')
      .innerJoin('places', 'places.trip_id', 'trips.id')
      .select('trips.id')
      .orderBy('id', 'desc')
      .compile();
    expect(joined.sql).toMatch(/order by "id" desc nulls last$/);
    const renamed = db.selectFrom('trips').select('title as id').orderBy('id').compile();
    expect(renamed.sql).toBe('select "title" as "id" from "trips" order by "id" nulls first');

    // A right join pads the FROM table with NULLs, a subquery's id is no table's key.
    const padded = db
      .selectFrom('trips')
      .rightJoin('places', 'places.trip_id', 'trips.id')
      .select('places.id')
      .orderBy('trips.id')
      .compile();
    expect(padded.sql).toMatch(/order by "trips"\."id" nulls first$/);
    const nested = db
      .selectFrom((eb) => eb.selectFrom('trips').select('id').as('sub'))
      .select('sub.id')
      .orderBy('sub.id', 'desc')
      .compile();
    expect(nested.sql).toMatch(/order by "sub"\."id" desc nulls last$/);
  });

  it("NULLORDER-004: MikroORM's ORDER BY items get SQLite's NULL position unless they name one", () => {
    expect(withSqliteNullPosition('"t"."start_date" asc')).toBe('"t"."start_date" asc nulls first');
    expect(withSqliteNullPosition('"t"."start_date" desc')).toBe('"t"."start_date" desc nulls last');
    expect(withSqliteNullPosition('"t"."start_date" desc nulls first')).toBe('"t"."start_date" desc nulls first');
    const platform = new SqliteNullOrderPlatform();
    expect(platform.getOrderByExpression('"name"', 'ASC')).toEqual(['"name" asc nulls first']);
    expect(platform.getOrderByExpression('"name"', 'desc', 'nocase')).toEqual([
      '"name" collate "nocase" desc nulls last',
    ]);
    expect(platform.getOrderByExpression('"name"', 'asc nulls last')).toEqual(['"name" asc nulls last']);
  });
});
