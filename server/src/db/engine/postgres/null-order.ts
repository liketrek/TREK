import { PostgreSqlPlatform } from '@mikro-orm/postgresql';

import {
  AliasNode,
  ColumnNode,
  IdentifierNode,
  PostgresQueryCompiler,
  RawNode,
  ReferenceNode,
  TableNode,
  type DatabaseIntrospector,
  type Dialect,
  type Kysely,
  type OperationNode,
  type OrderByItemNode,
  type SelectQueryNode,
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
 *
 * A Kysely ORDER BY on the `id` of a table the statement reads in its FROM
 * gets no position: every `id` of TREK's schema is a primary key, so no NULL
 * sorts there, and a NULL position Postgres's btree does not hold in that
 * direction would keep the primary key from serving `ORDER BY id DESC LIMIT n`.
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

/** The name a FROM item reads a plain table under, or null for anything else (a subquery, a function). */
function tableName(item: OperationNode): string | null {
  if (TableNode.is(item)) return item.table.identifier.name;
  if (AliasNode.is(item) && TableNode.is(item.node) && IdentifierNode.is(item.alias)) return item.alias.name;
  return null;
}

/** Where a SELECT's ORDER BY may name the `id` of a table it reads, which is never NULL. */
interface KeyScope {
  /** The names of the plain tables of its FROM. */
  tables: ReadonlySet<string>;
  /** Whether a bare `id` can only be the one table's: no join, and no selection named `id`. */
  bare: boolean;
}

/** The scope of `node`, or null where a row may lack the table's `id` (a set operation, a CTE, a right or full join). */
function keyScope(node: SelectQueryNode): KeyScope | null {
  if (node.setOperations?.length || node.with) return null;
  const joins = node.joins ?? [];
  if (joins.some((join) => join.joinType === 'RightJoin' || join.joinType === 'FullJoin')) return null;
  const froms = node.from?.froms ?? [];
  const tables = new Set(froms.map(tableName).filter((name): name is string => name !== null));
  const namedId = (node.selections ?? []).some(
    ({ selection }) => AliasNode.is(selection) && IdentifierNode.is(selection.alias) && selection.alias.name === 'id',
  );
  return { tables, bare: froms.length === 1 && tables.size === 1 && joins.length === 0 && !namedId };
}

/** Whether an ORDER BY item is the `id` of a table `scope` reads. */
function isTableKey(orderBy: OperationNode, scope: KeyScope | null): boolean {
  if (!scope || !ReferenceNode.is(orderBy) || !ColumnNode.is(orderBy.column)) return false;
  if (orderBy.column.column.name !== 'id') return false;
  return orderBy.table ? scope.tables.has(orderBy.table.table.identifier.name) : scope.bare;
}

/** Postgres's query compiler, with SQLite's NULL position on every ORDER BY item that names none. */
export class SqliteNullOrderCompiler extends PostgresQueryCompiler {
  private readonly scopes: Array<KeyScope | null> = [];

  protected override visitSelectQuery(node: SelectQueryNode): void {
    this.scopes.push(keyScope(node));
    try {
      super.visitSelectQuery(node);
    } finally {
      this.scopes.pop();
    }
  }

  protected override visitOrderByItem(node: OrderByItemNode): void {
    if (node.nulls || isTableKey(node.orderBy, this.scopes.at(-1) ?? null)) {
      super.visitOrderByItem(node);
      return;
    }
    super.visitOrderByItem({ ...node, nulls: sqliteNulls(isDescending(node.direction)) });
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
