import { quoteIdentifier, run, type CopiedSequence, type TableSpec, type Trx, type UniqueKey } from './copy';
import { planCopyOrder, type ForeignKey } from './order';
import { columnKind } from './values';

/**
 * TREK's tables as the target database holds them after the engine's
 * bootstrap, and how each one is filled from the table of the same name in
 * the SQLite file. The target's catalog decides the column types; the SQLite
 * file only has to hold the same tables and columns, which a file at this
 * build's migration level does.
 */

/** The migration history: each side keeps its own, and the bootstrap wrote the target's. */
const HISTORY_TABLE = 'mikro_orm_migrations';

interface TargetColumn {
  name: string;
  dataType: string;
  nullable: boolean;
}

interface TargetTable {
  name: string;
  columns: TargetColumn[];
  primaryKey: string[];
  /** Every unique index (the primary key's among them), by name, expression indexes included. */
  uniqueKeys: UniqueKey[];
}

export interface TargetSchema {
  tables: TargetTable[];
  foreignKeys: ForeignKey[];
  /** Every column a sequence fills, by table. */
  sequences: Array<{ table: string; column: string; sequence: string }>;
}

/** Reads the tables, keys and sequences of the current schema. */
export async function readTargetSchema(trx: Trx): Promise<TargetSchema> {
  const columns = await run<{ table_name: string; column_name: string; data_type: string; is_nullable: string }>(
    trx,
    'select c.table_name, c.column_name, c.data_type, c.is_nullable from information_schema.columns c ' +
      'join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name ' +
      "where c.table_schema = current_schema() and t.table_type = 'BASE TABLE' order by c.table_name, c.ordinal_position",
  );
  const constraints = await run<{ kind: string; table_name: string; target_name: string | null; columns: string[] }>(
    trx,
    'select c.contype as kind, src.relname as table_name, dst.relname as target_name, ' +
      'array_agg(a.attname::text order by k.ord) as columns from pg_constraint c ' +
      'join pg_class src on src.oid = c.conrelid left join pg_class dst on dst.oid = c.confrelid ' +
      'cross join lateral unnest(c.conkey) with ordinality as k(attnum, ord) ' +
      'join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum ' +
      "where c.connamespace = current_schema()::regnamespace and c.contype in ('p', 'f') " +
      'group by c.oid, c.contype, src.relname, dst.relname',
  );
  const sequences = await run<{ table_name: string; column_name: string; sequence: string }>(
    trx,
    "select table_name, column_name, pg_get_serial_sequence(format('%I', table_name), column_name) as sequence " +
      'from information_schema.columns where table_schema = current_schema() ' +
      "and pg_get_serial_sequence(format('%I', table_name), column_name) is not null order by table_name, column_name",
  );

  // A unique constraint is backed by an index of its name, so the index names what a refusal reports. Its key
  // is read as Postgres spells it. `indkey` holds 0 for a key that is an expression (`lower(email)`), which
  // marks the index as an expression index; the columns an expression reads are the Var nodes of `indexprs`,
  // listed after the plain key columns. The partial index's predicate and the INCLUDE columns are left out,
  // since neither decides whether two rows collide.
  const uniqueIndexes = await run<{
    table_name: string;
    index_name: string;
    keys: string[];
    columns: string[];
    expression: boolean;
  }>(
    trx,
    'select t.relname as table_name, i.relname as index_name, ' +
      '0 = any ((x.indkey::int2[])[0:x.indnkeyatts - 1]) as expression, ' +
      'array(select pg_get_indexdef(x.indexrelid, k, true) from generate_series(1, x.indnkeyatts::int) as k ' +
      'order by k) as keys, ' +
      'array(select a.attname::text from pg_attribute a where a.attrelid = x.indrelid and a.attnum > 0 and (' +
      'a.attnum = any ((x.indkey::int2[])[0:x.indnkeyatts - 1]) or a.attnum::text in (select m[1] from ' +
      "regexp_matches(coalesce(x.indexprs::text, ''), ':varattno ([0-9]+)', 'g') as m)) " +
      'order by coalesce(array_position((x.indkey::int2[])[0:x.indnkeyatts - 1], a.attnum), ' +
      'x.indnkeyatts + a.attnum)) as columns ' +
      'from pg_index x join pg_class i on i.oid = x.indexrelid join pg_class t on t.oid = x.indrelid ' +
      'where x.indisunique and t.relnamespace = current_schema()::regnamespace order by t.relname, i.relname',
  );

  const tables = new Map<string, TargetTable>();
  for (const column of columns) {
    const table = tables.get(column.table_name) ?? {
      name: column.table_name,
      columns: [],
      primaryKey: [],
      uniqueKeys: [],
    };
    table.columns.push({
      name: column.column_name,
      dataType: column.data_type,
      nullable: column.is_nullable === 'YES',
    });
    tables.set(column.table_name, table);
  }
  for (const index of uniqueIndexes) {
    tables.get(index.table_name)?.uniqueKeys.push({
      name: index.index_name,
      key: index.keys.join(', '),
      columns: index.columns,
      expression: index.expression,
    });
  }
  const foreignKeys: ForeignKey[] = [];
  for (const constraint of constraints) {
    if (constraint.kind === 'p') {
      const table = tables.get(constraint.table_name);
      if (table) table.primaryKey = constraint.columns;
    } else if (constraint.target_name) {
      foreignKeys.push({
        table: constraint.table_name,
        columns: constraint.columns,
        references: constraint.target_name,
      });
    }
  }
  return {
    tables: [...tables.values()],
    foreignKeys,
    sequences: sequences.map((row) => ({ table: row.table_name, column: row.column_name, sequence: row.sequence })),
  };
}

/** The tables and columns of the SQLite file, as the move compares them with the target. */
export type SourceTables = ReadonlyMap<string, readonly string[]>;

interface TrekCopyPlan {
  /** The tables in the order they are filled. */
  specs: TableSpec[];
  sequences: CopiedSequence[];
  /** Why the two schemas do not match; the move refuses when there is any. */
  problems: string[];
}

/**
 * Pairs every table of the target with the SQLite table of the same name and
 * puts them in foreign key order. Anything the two do not share, or a column
 * type the move has no rule for, is a problem: copying around it would lose
 * data or guess.
 */
export function planTrekTables(target: TargetSchema, source: SourceTables): TrekCopyPlan {
  const problems: string[] = [];
  const tables = target.tables.filter((table) => table.name !== HISTORY_TABLE);
  const names = new Set(tables.map((table) => table.name));
  for (const name of source.keys()) {
    if (name !== HISTORY_TABLE && !names.has(name)) problems.push(`the SQLite table ${name} has no Postgres table`);
  }
  const plan = planCopyOrder(
    tables.map((table) => table.name),
    target.foreignKeys,
  );
  const byName = new Map(tables.map((table) => [table.name, table]));
  const specs: TableSpec[] = [];
  for (const name of plan.order) {
    const table = byName.get(name);
    const sourceColumns = source.get(name);
    if (!table) continue;
    if (!sourceColumns) {
      problems.push(`the Postgres table ${name} has no SQLite table`);
      continue;
    }
    for (const column of sourceColumns) {
      if (!table.columns.some((candidate) => candidate.name === column)) {
        problems.push(`the SQLite column ${name}.${column} has no Postgres column`);
      }
    }
    const columns = table.columns.flatMap((column) => {
      const kind = columnKind(column.dataType);
      if (!sourceColumns.includes(column.name))
        problems.push(`the Postgres column ${name}.${column.name} has no SQLite column`);
      else if (kind === null)
        problems.push(
          `the Postgres column ${name}.${column.name} has the type ${column.dataType}, which the move does not know`,
        );
      else return [{ name: column.name, kind }];
      return [];
    });
    const deferred = plan.deferred.get(name) ?? [];
    for (const column of deferred) {
      if (!table.columns.find((candidate) => candidate.name === column)?.nullable) {
        problems.push(`${name}.${column} refers back to a table filled later and cannot be NULL meanwhile`);
      }
    }
    specs.push({
      source: name,
      target: quoteIdentifier(name),
      label: name,
      columns,
      deferred,
      primaryKey: table.primaryKey,
      exact: false,
      uniqueKeys: table.uniqueKeys,
    });
  }
  const sequences = target.sequences
    .filter((entry) => names.has(entry.table))
    .map((entry) => ({ ...entry, target: quoteIdentifier(entry.table) }));
  return { specs, sequences, problems };
}
