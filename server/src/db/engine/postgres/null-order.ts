import { PostgreSqlPlatform } from '@mikro-orm/postgresql';

import {
  PostgresQueryCompiler,
  RawNode,
  type DatabaseIntrospector,
  type Dialect,
  type Kysely,
  type OperationNode,
  type OrderByItemNode,
} from 'kysely';

/**
 * Where NULLs sort, as SQLite sorts them, for every ORDER BY TREK sends to
 * Postgres.
 *
 * SQLite takes NULL as the smallest value: first in ascending order, last in
 * descending order. Postgres takes it as the largest, the other way round, so
 * a list ordered by a nullable column (bookings without a time, trips without
 * dates, items without a position) would come back in another order on each
 * engine. Rather than every ORDER BY spelling its NULL position, which a new
 * one would forget, the Postgres engine renders the position SQLite implies
 * wherever a statement does not name one: Kysely statements through the query
 * compiler below, MikroORM's own (`find`, the query builder) through the
 * platform's ORDER BY rendering. An explicit `nulls first`/`nulls last` is
 * left as written. ORDER BY spelled inside raw SQL text is outside both.
 */

/** The NULL position SQLite gives an ORDER BY item of this direction. */
function sqliteNulls(descending: boolean): 'first' | 'last' {
  return descending ? 'last' : 'first';
}

/** Whether a Kysely ORDER BY item's direction is descending (`desc`); no direction is ascending. */
function isDescending(direction: OperationNode | undefined): boolean {
  if (!direction || !RawNode.is(direction)) return false;
  return direction.sqlFragments.join('').trim().toLowerCase() === 'desc';
}

/** Postgres's query compiler, with SQLite's NULL position on every ORDER BY item that names none. */
export class SqliteNullOrderCompiler extends PostgresQueryCompiler {
  protected override visitOrderByItem(node: OrderByItemNode): void {
    super.visitOrderByItem(node.nulls ? node : { ...node, nulls: sqliteNulls(isDescending(node.direction)) });
  }
}

/** `dialect` with {@link SqliteNullOrderCompiler} as its query compiler; the rest is its own. */
export function withSqliteNullOrder(dialect: Dialect): Dialect {
  return {
    createAdapter: () => dialect.createAdapter(),
    createDriver: () => dialect.createDriver(),
    createIntrospector: (db: Kysely<unknown>): DatabaseIntrospector => dialect.createIntrospector(db),
    createQueryCompiler: () => new SqliteNullOrderCompiler(),
  };
}

/** One rendered MikroORM ORDER BY item (`"t"."start_date" desc`), with SQLite's NULL position when it names none. */
export function withSqliteNullPosition(item: string): string {
  if (/\snulls\s+(first|last)\s*$/i.test(item)) return item;
  return `${item} nulls ${sqliteNulls(/\sdesc\s*$/i.test(item))}`;
}

/** MikroORM's Postgres platform, rendering ORDER BY items with SQLite's NULL position. */
export class SqliteNullOrderPlatform extends PostgreSqlPlatform {
  override getOrderByExpression(column: string, direction: string, collation?: string): string[] {
    return super.getOrderByExpression(column, direction, collation).map(withSqliteNullPosition);
  }
}
