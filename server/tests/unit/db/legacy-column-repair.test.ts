/**
 * LEGACYCOL: the columns an install the retired positional runner upgraded
 * can lack, and the migration that adds them
 * (`Migration20200101046460_an_upgraded_install_gets_the_columns_its_history_skipped`).
 *
 * The list in that migration is frozen like every migration, so it is derived
 * here again from the migrations themselves: a database migrated to the last
 * legacy step holds the columns such an install should have, the head schema
 * says how each one is declared now, and the Postgres baseline how Postgres
 * declares it. Then every entry is added to a database that lacks all of them,
 * and an install shaped like the one whose move to Postgres was refused
 * (`users` without `mfa_backup_codes` and `immich_access_token`) is upgraded.
 */
import { BootstrapMigrator, migrateToHead } from '../../../src/db/legacy-baseline';
import { Migration20200101046460_an_upgraded_install_gets_the_columns_its_history_skipped as Repair } from '../../../src/db/migrations/Migration20200101046460_an_upgraded_install_gets_the_columns_its_history_skipped';
import { openLegacyFixture } from '../../helpers/legacy-fixture';
import {
  createMigrationOrm,
  migrateTo,
  migratorOf,
  rawExec,
  rawQuery,
  runMigrationDirect,
} from '../../helpers/migration-step';
import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/sqlite';

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const SERVER = path.join(__dirname, '../../..');
const MIGRATIONS = path.join(SERVER, 'src/db/migrations');
const REPAIR_FILE = path.join(
  MIGRATIONS,
  'Migration20200101046460_an_upgraded_install_gets_the_columns_its_history_skipped.ts',
);
/** The migration that carries the last step the positional runner had (258). */
const LAST_LEGACY_STEP = 'Migration20200101041900_a_journey_that_puts_an_entry_on';
/** A table the list names, left out of LEGACYCOL-003's database to show a missing table is skipped. */
const LEFT_OUT = 'bucket_list';

type Entry = readonly [table: string, sqlite: string, postgres: string];

interface ColumnInfo {
  tbl: string;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
  hidden: number;
}

interface ForeignKey {
  tbl: string;
  from: string;
  table: string;
  to: string;
  on_delete: string;
}

/** The parts of a CREATE TABLE body, split on the commas outside parentheses and quotes. */
function splitDefinitions(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = '';
  for (const ch of body) {
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  parts.push(current.trim());
  return parts.filter((part) => part.length > 0);
}

const TABLE_CONSTRAINT = /^(?:CONSTRAINT|PRIMARY\s+KEY|UNIQUE|CHECK|FOREIGN\s+KEY)\b/i;
const unquote = (name: string) => name.replace(/^["`[]|["`\]]$/g, '');
const nameOf = (definition: string) => unquote(definition.split(/\s+/)[0] ?? '');

function tableBody(sql: string): string {
  return sql.slice(sql.indexOf('(') + 1, sql.lastIndexOf(')'));
}

/** A default ALTER TABLE ... ADD COLUMN accepts: a literal, not an expression. */
function constantDefault(value: string | null): boolean {
  return value === null || /^(?:-?\d+(?:\.\d+)?|'[^']*'|NULL|TRUE|FALSE)$/i.test(value);
}

/** What the migration's list holds, read from its source. */
function listedEntries(): Entry[] {
  const source = ts.createSourceFile(REPAIR_FILE, fs.readFileSync(REPAIR_FILE, 'utf8'), ts.ScriptTarget.Latest, true);
  const entries: Entry[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && node.name.getText() === 'LEGACY_COLUMNS') {
      const object = node.initializer as ts.ObjectLiteralExpression;
      for (const property of object.properties as ts.NodeArray<ts.PropertyAssignment>) {
        for (const tuple of (property.initializer as ts.ArrayLiteralExpression).elements) {
          const [sqlite, postgres] = (tuple as ts.ArrayLiteralExpression).elements as ts.NodeArray<ts.StringLiteral>;
          entries.push([property.name.getText(), sqlite?.text ?? '', postgres?.text ?? '']);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return entries;
}

/** Every column of `assets/postgres/baseline.sql`, as that file declares it. */
function postgresColumns(): Map<string, string> {
  const columns = new Map<string, string>();
  const sql = fs.readFileSync(path.join(SERVER, 'assets/postgres/baseline.sql'), 'utf8');
  for (const match of sql.matchAll(/^create table "(\w+)" \((.*)\);$/gm)) {
    for (const part of splitDefinitions(match[2] ?? '')) {
      const column = /^"(\w+)"/.exec(part)?.[1];
      if (column) columns.set(`${match[1]}.${column}`, part);
    }
  }
  return columns;
}

let atLastStep: MikroORM;
let atHead: MikroORM;

function tables(orm: MikroORM): Promise<Array<{ name: string; sql: string }>> {
  return rawQuery(
    orm,
    `SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> 'mikro_orm_migrations' ORDER BY name`,
  );
}

/** Every column of every table, in one statement. */
function allColumns(orm: MikroORM): Promise<ColumnInfo[]> {
  return rawQuery<ColumnInfo>(
    orm,
    `SELECT m.name AS tbl, p.* FROM sqlite_master m JOIN pragma_table_xinfo(m.name) p WHERE m.type = 'table'`,
  );
}

/** Every foreign key of every table, in one statement. */
function allForeignKeys(orm: MikroORM): Promise<ForeignKey[]> {
  return rawQuery<ForeignKey>(
    orm,
    `SELECT m.name AS tbl, f.* FROM sqlite_master m JOIN pragma_foreign_key_list(m.name) f WHERE m.type = 'table'`,
  );
}

/** Runs `work` on each item, one after the other. */
function inSequence<T>(items: readonly T[], work: (item: T) => Promise<unknown>): Promise<void> {
  return items.reduce<Promise<void>>(
    (previous, item) =>
      previous.then(async () => {
        await work(item);
      }),
    Promise.resolve(),
  );
}

/**
 * The list as the migrations make it: each column the last legacy step's
 * schema holds that head still holds and ALTER TABLE can add, declared as
 * head declares it (a foreign key head declares on the table, on the column).
 */
async function derivedEntries(): Promise<Entry[]> {
  const before = new Set((await allColumns(atLastStep)).map((column) => `${column.tbl}.${column.name}`));
  const postgres = postgresColumns();
  const headColumns = await allColumns(atHead);
  const headKeys = await allForeignKeys(atHead);
  return (await tables(atHead)).flatMap((table) => {
    const definitions = new Map(
      splitDefinitions(tableBody(table.sql))
        .filter((part) => !TABLE_CONSTRAINT.test(part))
        .map((part) => [nameOf(part), part.replace(/\s+/g, ' ')]),
    );
    return headColumns
      .filter((column) => column.tbl === table.name && before.has(`${table.name}.${column.name}`))
      .flatMap((column): Entry[] => {
        let definition = definitions.get(column.name) ?? '';
        const addable =
          column.pk === 0 &&
          column.hidden === 0 &&
          !(column.notnull === 1 && column.dflt_value === null) &&
          constantDefault(column.dflt_value) &&
          !/\b(?:UNIQUE|PRIMARY\s+KEY)\b/i.test(definition);
        if (!addable) return [];
        const key = headKeys.find((fk) => fk.tbl === table.name && fk.from === column.name);
        if (key && !/\bREFERENCES\b/i.test(definition)) {
          definition += ` REFERENCES ${key.table}(${key.to}) ON DELETE ${key.on_delete}`;
        }
        return [[table.name, definition, postgres.get(`${table.name}.${column.name}`) ?? '(not in the baseline)']];
      });
  });
}

beforeAll(async () => {
  atLastStep = await createMigrationOrm();
  await migrateTo(atLastStep, LAST_LEGACY_STEP);
  atHead = await createMigrationOrm();
  await migratorOf(atHead).up();
}, 120_000);

afterAll(async () => {
  await atLastStep.close();
  await atHead.close();
});

describe('the list of columns', () => {
  it('LEGACYCOL-001: holds exactly the columns the migrations derive, declared as head declares them', async () => {
    const listed = listedEntries();
    expect(listed.length).toBeGreaterThan(500);
    expect(listed.map(([table, sqlite]) => `${table}: ${sqlite}`)).toEqual(
      (await derivedEntries()).map(([table, sqlite]) => `${table}: ${sqlite}`),
    );
    expect(listed.map(([table, sqlite]) => `${table}.${nameOf(sqlite)}`)).toEqual(
      expect.arrayContaining(['users.mfa_backup_codes', 'users.immich_access_token', `${LEFT_OUT}.lat`]),
    );
  });

  it('LEGACYCOL-002: each postgres member is the column as the Postgres baseline declares it', () => {
    const postgres = postgresColumns();
    const wrong = listedEntries().filter(
      ([table, sqlite, declared]) => declared !== postgres.get(`${table}.${nameOf(sqlite)}`),
    );
    expect(wrong).toEqual([]);
  });
});

describe('the migration', () => {
  it('LEGACYCOL-003: adds every listed column to a database that lacks them all, as head has it, and skips a missing table', async () => {
    const byTable = new Map<string, Set<string>>();
    for (const [table, sqlite] of listedEntries()) {
      byTable.set(table, (byTable.get(table) ?? new Set()).add(nameOf(sqlite)));
    }

    const bare = await createMigrationOrm();
    try {
      const creates = (await tables(atHead)).flatMap((table) => {
        const removed = byTable.get(table.name);
        if (!removed || table.name === LEFT_OUT) return [];
        const kept = splitDefinitions(tableBody(table.sql)).filter((part) =>
          TABLE_CONSTRAINT.test(part)
            ? ![...removed].some((column) => new RegExp(`\\b${column}\\b`).test(part))
            : !removed.has(nameOf(part)),
        );
        return [`CREATE TABLE "${table.name}" (${kept.join(', ')})`];
      });
      await inSequence(creates, (sql) => rawExec(bare, sql));
      await runMigrationDirect(bare, Repair);

      const listed = (table: string, column: string) => table !== LEFT_OUT && Boolean(byTable.get(table)?.has(column));
      const shape = async (orm: MikroORM) =>
        (await allColumns(orm))
          .filter((row) => listed(row.tbl, row.name))
          .map(({ tbl, name, type, notnull, dflt_value }) => `${tbl}.${name} ${type} ${notnull} ${dflt_value}`)
          .sort();
      const keys = async (orm: MikroORM) =>
        (await allForeignKeys(orm))
          .filter((row) => listed(row.tbl, row.from))
          .map(({ tbl, from, table, to, on_delete }) => `${tbl}.${from} -> ${table}.${to} ${on_delete}`)
          .sort();
      expect(await shape(bare)).toEqual(await shape(atHead));
      expect(await keys(bare)).toEqual(await keys(atHead));
      expect(await rawQuery(bare, `SELECT name FROM sqlite_master WHERE name = ?`, [LEFT_OUT])).toEqual([]);
    } finally {
      await bare.close();
    }
  });

  it('LEGACYCOL-004: changes nothing on a database the migrations built', async () => {
    const shape = async () => (await tables(atHead)).map((table) => `${table.name}: ${table.sql}`);
    const before = await shape();
    await runMigrationDirect(atHead, Repair);
    expect(await shape()).toEqual(before);
  });

  it('LEGACYCOL-005: an install at schema_version 244 without users.mfa_backup_codes and users.immich_access_token gets both', async () => {
    const fixture = openLegacyFixture('legacy-v244');
    const file = fixture.name;
    fixture.exec('ALTER TABLE users DROP COLUMN mfa_backup_codes');
    fixture.exec('ALTER TABLE users DROP COLUMN immich_access_token');
    fixture.close();

    const orm = await MikroORM.init({
      entities: [],
      discovery: { warnWhenNoEntities: false },
      extensions: [Migrator],
      migrations: { path: MIGRATIONS, pathTs: MIGRATIONS, snapshot: false, silent: true },
      dbName: file,
    });
    try {
      const migrator = new BootstrapMigrator(orm.em);
      await migrateToHead(orm.em.getConnection(), migrator);
      const executed = new Set((await migrator.getExecuted()).map((row) => row.name));
      // The step that should have added the column is recorded, not run: the gap this closes.
      expect(executed.has('Migration20200101005300_users_add_mfa_backup_codes')).toBe(true);
      expect(executed.has('Migration20200101046460_an_upgraded_install_gets_the_columns_its_history_skipped')).toBe(
        true,
      );
      const users = (await allColumns(orm)).filter(
        (column) => column.tbl === 'users' && ['mfa_backup_codes', 'immich_access_token'].includes(column.name),
      );
      expect(users.map(({ name, type, notnull, dflt_value }) => ({ name, type, notnull, dflt_value }))).toEqual([
        { name: 'mfa_backup_codes', type: 'TEXT', notnull: 0, dflt_value: null },
        { name: 'immich_access_token', type: 'TEXT', notnull: 0, dflt_value: null },
      ]);
    } finally {
      await orm.close();
    }
  }, 120_000);
});
