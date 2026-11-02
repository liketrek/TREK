/**
 * PARITY-PG — the schema a Postgres database ends with after its bootstrap
 * (the baseline, then every migration after its cut) is the schema the
 * entities describe, as scripts/generate-pg-baseline.ts writes it for
 * Postgres (src/db/engine/postgres/schema-adjust.ts). MikroORM's comparator
 * reads the live database and must find nothing to change: a migration after
 * the cut that left Postgres behind SQLite, or a baseline that drifted from
 * the entities, fails here. It runs on the lane's database, never skipped.
 *
 * The comparator also reports statements that change nothing, and each kind
 * is proven so rather than recognised by its text:
 * - `drop not null` on a primary key column: SQLite lets a key column be null
 *   and the entities say so; Postgres keeps every primary key NOT NULL (and
 *   refuses the statement), checked against the live keys.
 * - a column default or a check constraint Postgres stores in its own spelling
 *   (casts added, EXTRACT rewritten, BETWEEN as two comparisons): such
 *   statements are applied in a transaction that is rolled back, and the
 *   catalogue's own rendering of every default and check must read the same
 *   after as before. A default or a bound that really differs changes it.
 * - dropping a trigger the entities cannot carry: only the triggers ported by
 *   hand (POSTGRES_TRIGGERS), by exact name, and each of them must exist.
 */
import { adjustColumns, POSTGRES_TRIGGERS, type ColumnMeta } from '../../src/db/engine/postgres/schema-adjust';
import { ALL_ENTITIES } from '../../src/db/entities';
import type { EntityProperty, Transaction } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';

import { describe, expect, it } from 'vitest';

const PORTED = Object.keys(POSTGRES_TRIGGERS);
const DROP_NOT_NULL = /^alter table "(\w+)" alter column "(\w+)" drop not null$/;
const SPELLING =
  /^alter table "\w+" (?:alter column "\w+" set default .+|drop constraint "\w+"|add constraint "\w+" check \(.+\))$/s;
/** MikroORM drops a trigger by its name, and the function it would have made for it as `<table>_<trigger>_fn`. */
const DROP_TRIGGER = /^drop trigger if exists "(\w+)" on "(\w+)"$/;
const DROP_FUNCTION = /^drop function if exists "(\w+)"\(\)$/;

/** Every column default and check constraint of the schema, as the catalogue renders them. */
const FINGERPRINT_SQL = `select string_agg(item, E'\\n' order by item) as fingerprint from (
  select 'default ' || c.relname || '.' || a.attname || ' = ' || pg_get_expr(d.adbin, d.adrelid) as item
  from pg_attrdef d join pg_class c on c.oid = d.adrelid join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
  where c.relnamespace = current_schema()::regnamespace
  union all
  select 'check ' || conrelid::regclass || '.' || conname || ' = ' || pg_get_constraintdef(oid)
  from pg_constraint where contype = 'c' and connamespace = current_schema()::regnamespace
) items`;

const ROLLBACK = new Error('roll back the spelling check');

async function liveSets(orm: MikroORM): Promise<{ primaryKeys: Set<string>; triggers: Set<string> }> {
  const connection = orm.em.getConnection();
  const names = (sql: string) =>
    connection.execute<Array<{ name: string }>>(sql).then((rows) => new Set(rows.map((row) => row.name)));
  const [primaryKeys, triggers] = await Promise.all([
    names(
      `select c.relname || '.' || a.attname as name from pg_index i
       join pg_class c on c.oid = i.indrelid join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
       where i.indisprimary and c.relnamespace = current_schema()::regnamespace`,
    ),
    names(
      `select c.relname || '.' || t.tgname as name from pg_trigger t join pg_class c on c.oid = t.tgrelid
       where not t.tgisinternal and c.relnamespace = current_schema()::regnamespace`,
    ),
  ]);
  return { primaryKeys, triggers };
}

/** Whether applying `statements` leaves every default and check constraint reading as it did; nothing is kept. */
async function changesNothing(
  orm: MikroORM,
  statements: readonly string[],
): Promise<{ before: string; after: string }> {
  const connection = orm.em.getConnection();
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

describe('PARITY-PG', () => {
  it('PARITY-PG-001: the bootstrapped database holds exactly the schema the entities generate for Postgres', async () => {
    const orm = await MikroORM.init({
      clientUrl: process.env.TREK_DB_URL,
      entities: [...ALL_ENTITIES],
      discovery: { warnWhenNoEntities: false },
    });
    try {
      for (const meta of orm.getMetadata().getAll().values()) {
        adjustColumns(meta.props as EntityProperty[] as ColumnMeta[]);
      }
      const live = await liveSets(orm);
      const statements = (await orm.schema.getUpdateSchemaSQL({ wrap: false }))
        .split(';\n')
        .map((statement) => statement.trim().replace(/;$/, ''))
        .filter((statement) => statement !== '');

      const isKeyNotNull = (s: string) => {
        const m = DROP_NOT_NULL.exec(s);
        return m !== null && live.primaryKeys.has(`${m[1]}.${m[2]}`);
      };
      const isPortedTrigger = (s: string) => {
        const trigger = DROP_TRIGGER.exec(s);
        if (trigger) return PORTED.includes(trigger[1]) && live.triggers.has(`${trigger[2]}.${trigger[1]}`);
        const fn = DROP_FUNCTION.exec(s);
        return fn !== null && PORTED.some((name) => fn[1].endsWith(`_${name}_fn`));
      };
      const spelling = statements.filter((s) => !isKeyNotNull(s) && !isPortedTrigger(s) && SPELLING.test(s));

      expect(statements.filter((s) => !isKeyNotNull(s) && !isPortedTrigger(s) && !SPELLING.test(s))).toEqual([]);
      const { before, after } = await changesNothing(orm, spelling);
      expect(after).toBe(before);
      // Every hand-ported trigger is in the database, on its table.
      expect(PORTED.filter((name) => ![...live.triggers].some((t) => t.endsWith(`.${name}`)))).toEqual([]);
    } finally {
      await orm.close(true);
    }
  }, 60_000);
});
