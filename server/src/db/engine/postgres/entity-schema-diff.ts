/**
 * What still separates a live Postgres database from the schema the entities
 * describe for Postgres (`schema-adjust.ts`): the one definition PARITY-PG
 * (`tests/postgres/schema-parity.test.ts`) holds at nothing and
 * `npm run gen:pg-migration` prints as the Postgres side of a new migration.
 *
 * MikroORM's comparator also reports statements that change nothing, and each
 * kind is proven so rather than recognised by its text alone:
 * - `drop not null` on a primary key column: SQLite lets a key column be null
 *   and the entities say so; Postgres keeps every primary key NOT NULL (and
 *   refuses the statement), checked against the live keys.
 * - a column default or a check constraint Postgres stores in its own
 *   spelling (casts added, EXTRACT rewritten, BETWEEN as two comparisons):
 *   such statements are applied in a transaction that is rolled back, and the
 *   catalogue's own rendering of every default and check must read the same
 *   after as before. A default or a bound that really differs changes it.
 * - dropping a trigger the entities cannot carry: only the triggers ported by
 *   hand (`POSTGRES_TRIGGERS`), by exact name, and only while the trigger is in
 *   the database on its table.
 */
import { ALL_ENTITIES } from '../../entities';
import { POSTGRES_TRIGGERS } from './postgres-triggers';
import { applyPostgresColumnAdjustments } from './schema-adjust';
import type { Transaction } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import type { AbstractSqlConnection } from '@mikro-orm/sql';

const DROP_NOT_NULL = /^alter table "(\w+)" alter column "(\w+)" drop not null$/;
const SPELLING =
  /^alter table "\w+" (?:alter column "\w+" set default .+|drop constraint "\w+"|add constraint "\w+" check \(.+\))$/s;
/** MikroORM drops a trigger by its name, and the function it would have made for it as `<table>_<trigger>_fn`. */
const DROP_TRIGGER = /^drop trigger if exists "(\w+)" on "(\w+)"$/;
const DROP_FUNCTION = /^drop function if exists "(\w+)"\(\)$/;

/** Every column default and check constraint of the schema, as the catalogue renders them. */
const FINGERPRINT_SQL = `select string_agg(item, E'\\n' order by item) as fingerprint from (
  select concat('default ', c.relname, '.', a.attname, ' = ', pg_get_expr(d.adbin, d.adrelid)) as item
  from pg_attrdef d join pg_class c on c.oid = d.adrelid join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
  where c.relnamespace = current_schema()::regnamespace
  union all
  select concat('check ', conrelid::regclass, '.', conname, ' = ', pg_get_constraintdef(oid))
  from pg_constraint where contype = 'c' and connamespace = current_schema()::regnamespace
) items`;

const PRIMARY_KEYS_SQL = `select concat(c.relname, '.', a.attname) as name from pg_index i
  join pg_class c on c.oid = i.indrelid join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
  where i.indisprimary and c.relnamespace = current_schema()::regnamespace`;

const TRIGGERS_SQL = `select concat(c.relname, '.', t.tgname) as name from pg_trigger t join pg_class c on c.oid = t.tgrelid
  where not t.tgisinternal and c.relnamespace = current_schema()::regnamespace`;

/** The facts of the live schema the classification needs, each as `<table>.<name>`. */
export interface LiveSchemaFacts {
  primaryKeys: ReadonlySet<string>;
  triggers: ReadonlySet<string>;
}

/** The comparator's statements sorted by what they would do. */
interface ClassifiedDiff {
  /** Statements that change the schema: what a migration has to send. */
  changes: string[];
  /** Default and check statements that may only be Postgres's own spelling; `spellingChangesNothing` decides. */
  spelling: string[];
  /** `drop not null` on a live primary key, which Postgres keeps NOT NULL anyway. */
  keyNotNull: string[];
  /** Dropping a hand-ported trigger or its function. */
  portedTriggers: string[];
}

/** The comparator's SQL (`getUpdateSchemaSQL({ wrap: false })`) as single statements without their semicolons. */
export function splitSchemaDiff(sql: string): string[] {
  return sql
    .split(';\n')
    .map((statement) => statement.trim().replace(/;$/, ''))
    .filter((statement) => statement !== '');
}

/** Sorts the comparator's statements; `ported` names the triggers `POSTGRES_TRIGGERS` carries. */
export function classifySchemaDiff(
  statements: readonly string[],
  live: LiveSchemaFacts,
  ported: readonly string[] = Object.keys(POSTGRES_TRIGGERS),
): ClassifiedDiff {
  const isKeyNotNull = (s: string) => {
    const m = DROP_NOT_NULL.exec(s);
    return m !== null && live.primaryKeys.has(`${m[1]}.${m[2]}`);
  };
  const isPortedTrigger = (s: string) => {
    const trigger = DROP_TRIGGER.exec(s);
    if (trigger) return ported.includes(trigger[1]) && live.triggers.has(`${trigger[2]}.${trigger[1]}`);
    const fn = DROP_FUNCTION.exec(s);
    return fn !== null && ported.some((name) => fn[1].endsWith(`_${name}_fn`));
  };
  const diff: ClassifiedDiff = { changes: [], spelling: [], keyNotNull: [], portedTriggers: [] };
  for (const statement of statements) {
    if (isKeyNotNull(statement)) diff.keyNotNull.push(statement);
    else if (isPortedTrigger(statement)) diff.portedTriggers.push(statement);
    else if (SPELLING.test(statement)) diff.spelling.push(statement);
    else diff.changes.push(statement);
  }
  return diff;
}

/** The hand-ported triggers that are not in the live database. */
export function missingPortedTriggers(
  live: LiveSchemaFacts,
  ported: readonly string[] = Object.keys(POSTGRES_TRIGGERS),
): string[] {
  return ported.filter((name) => ![...live.triggers].some((t) => t.endsWith(`.${name}`)));
}

/** Reads the live primary keys and triggers of the current schema. */
async function readLiveSchemaFacts(connection: AbstractSqlConnection): Promise<LiveSchemaFacts> {
  const names = (sql: string) =>
    connection.execute<Array<{ name: string }>>(sql).then((rows) => new Set(rows.map((row) => row.name)));
  const [primaryKeys, triggers] = await Promise.all([names(PRIMARY_KEYS_SQL), names(TRIGGERS_SQL)]);
  return { primaryKeys, triggers };
}

const ROLLBACK = new Error('roll back the spelling check');

/**
 * The catalogue's rendering of every default and check before and after
 * `statements`, applied in a transaction that is always rolled back: equal
 * means they change nothing.
 */
export async function spellingChangesNothing(
  connection: AbstractSqlConnection,
  statements: readonly string[],
): Promise<{ before: string; after: string }> {
  const fingerprint = async (trx?: Transaction) =>
    (await connection.execute<Array<{ fingerprint: string }>>(FINGERPRINT_SQL, [], 'all', trx))[0].fingerprint;
  const before = await fingerprint();
  let after = '';
  await connection
    .transactional(async (trx) => {
      // One after the other: a drop and the add that follows name the same constraint.
      await statements.reduce<Promise<unknown>>(
        (previous, statement) => previous.then(() => connection.execute(statement, [], 'run', trx)),
        Promise.resolve(),
      );
      after = await fingerprint(trx);
      throw ROLLBACK;
    })
    .catch((err: unknown) => {
      if (err !== ROLLBACK) throw err;
    });
  return { before, after };
}

/** Everything the comparison of one database with the entities found. */
export interface EntitySchemaDiff extends ClassifiedDiff {
  /** Whether the `spelling` statements leave every default and check as it was. */
  spellingHolds: boolean;
  /** The catalogue's defaults and checks before and after the spelling statements, for a failure message. */
  fingerprint: { before: string; after: string };
  /** Hand-ported triggers missing from the database. */
  missingTriggers: string[];
}

/** The statements a migration must still send: the changes, and the spelling ones when they are more than spelling. */
export function remainingStatements(diff: EntitySchemaDiff): string[] {
  return diff.spellingHolds ? [...diff.changes] : [...diff.changes, ...diff.spelling];
}

/**
 * Compares the database `url` names with the entities, read for Postgres the
 * way the baseline writes them. Nothing in the database changes.
 */
export async function diffAgainstEntities(url: string): Promise<EntitySchemaDiff> {
  const orm = await MikroORM.init({
    clientUrl: url,
    entities: [...ALL_ENTITIES],
    discovery: { warnWhenNoEntities: false },
  });
  try {
    for (const meta of orm.getMetadata().getAll().values()) applyPostgresColumnAdjustments(meta.props);
    const connection = orm.em.getConnection();
    const live = await readLiveSchemaFacts(connection);
    const classified = classifySchemaDiff(splitSchemaDiff(await orm.schema.getUpdateSchemaSQL({ wrap: false })), live);
    const fingerprint = await spellingChangesNothing(connection, classified.spelling);
    return {
      ...classified,
      spellingHolds: fingerprint.before === fingerprint.after,
      fingerprint,
      missingTriggers: missingPortedTriggers(live),
    };
  } finally {
    await orm.close(true);
  }
}
