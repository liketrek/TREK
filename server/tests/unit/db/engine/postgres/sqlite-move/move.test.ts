/**
 * MOVE-001..037: the move of a SQLite install into Postgres
 * (src/db/engine/postgres/sqlite-move/), over real SQLite files and a
 * stand-in for Postgres that keeps what it is sent (tests/helpers/fake-postgres-move.ts):
 * the refusals before anything is written, the copy in foreign key order with
 * a table that points at itself, the sequences, the verification, a plugin's
 * own database, the cleanup after a failure, and the command around it. The
 * Postgres lane runs the same move against a real server
 * (tests/postgres/sqlite-move.test.ts).
 */
import type { AppEnv } from '../../../../../../src/app-config';
import { CLEAR_SCHEMA_SQL } from '../../../../../../src/db/engine/postgres/clear-schema';
import { PG_NOW_TEXT_DEFAULT } from '../../../../../../src/db/engine/postgres/schema-adjust';
import {
  runMoveCommand,
  USAGE,
  type MoveCommandIo,
} from '../../../../../../src/db/engine/postgres/sqlite-move/command';
import {
  batchRows,
  describePgError,
  insertSql,
  refusedRowsMessage,
} from '../../../../../../src/db/engine/postgres/sqlite-move/copy';
import {
  migrationLevelProblem,
  moveSqliteToPostgres,
  renderSummary,
  SCHEMA_BUG_REMEDY,
  SCHEMA_DIFFERENCE_REMEDY,
  schemaRefusal,
  type MoveOptions,
  type MoveSummary,
} from '../../../../../../src/db/engine/postgres/sqlite-move/move';
import {
  findPluginDataFiles,
  pluginColumnKind,
  pluginDefault,
} from '../../../../../../src/db/engine/postgres/sqlite-move/plugin-data';
import { MoveRefusal } from '../../../../../../src/db/engine/postgres/sqlite-move/refusal';
import {
  InvalidUtf8Text,
  sqliteInstallHoldsAccounts,
  SqliteSource,
} from '../../../../../../src/db/engine/sqlite/sqlite-source';
import type { AnyOrm } from '../../../../../../src/db/orm';
import { FakePostgres, fakeMoveOrm, type FakeTableDef } from '../../../../../helpers/fake-postgres-move';
import { PostgreSqlPlatform } from '@mikro-orm/postgresql';

import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const M1 = 'Migration20200101000000_baseline_schema';
const M2 = 'Migration20200101000100_second';

/** TREK's schema in miniature, as the bootstrap leaves it on Postgres. */
const SCHEMA: FakeTableDef[] = [
  {
    name: 'messages',
    columns: [
      { name: 'id', dataType: 'bigint', nullable: false },
      { name: 'trip_id', dataType: 'bigint' },
      { name: 'reply_to', dataType: 'bigint' },
      { name: 'body', dataType: 'text' },
    ],
    primaryKey: ['id'],
    foreignKeys: [
      { columns: ['trip_id'], references: 'trips' },
      { columns: ['reply_to'], references: 'messages' },
    ],
    serial: ['id'],
  },
  {
    name: 'trips',
    columns: [
      { name: 'id', dataType: 'bigint', nullable: false },
      { name: 'user_id', dataType: 'bigint' },
      { name: 'title', dataType: 'text' },
      { name: 'meta', dataType: 'jsonb' },
      { name: 'cover', dataType: 'bytea' },
      { name: 'score', dataType: 'double precision' },
    ],
    primaryKey: ['id'],
    foreignKeys: [{ columns: ['user_id'], references: 'users' }],
    serial: ['id'],
  },
  {
    name: 'users',
    columns: [
      { name: 'id', dataType: 'bigint', nullable: false },
      { name: 'name', dataType: 'text', nullable: false },
    ],
    primaryKey: ['id'],
    serial: ['id'],
    unique: [{ name: 'users_name_unique', columns: ['name'] }],
  },
];

const SOURCE_SQL = `
  create table mikro_orm_migrations (id integer primary key autoincrement, name text, executed_at text);
  insert into mikro_orm_migrations (name) values ('${M1}'), ('${M2}');
  create table users (id integer primary key autoincrement, name text not null);
  create table trips (id integer primary key, user_id integer references users (id), title text, meta text, cover blob, score real);
  create table messages (id integer primary key, trip_id integer references trips (id), reply_to integer references messages (id), body text);
  insert into users (name) values ('Ada'), ('Grace'), ('Gone');
  delete from users where name = 'Gone';
  insert into trips values (1, 1, 'Lisbon', '{"b":1,"a":2}', x'00ff', 1.5), (2, 2, 'Porto', null, null, null);
  insert into messages values (1, 1, 2, 'I do'), (2, 1, null, 'Who books the tram?');
`;

let dir: string;
let pg: FakePostgres;
let orm: AnyOrm;
const log = vi.fn();

function sqlite(file: string, sql: string): string {
  const db = new Database(file);
  db.exec(sql);
  db.close();
  return file;
}

function options(overrides: Partial<MoveOptions> = {}): MoveOptions {
  return {
    sqliteFile: path.join(dir, 'travel.db'),
    pluginsDataDir: path.join(dir, 'plugins-data'),
    orm,
    known: new Set([M1, M2]),
    baseline: () => ({ through: M2, migrations: [M1, M2], statements: ['create table "baseline" ("id" bigint)'] }),
    log,
    ...overrides,
  };
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-move-'));
  sqlite(path.join(dir, 'travel.db'), SOURCE_SQL);
  pg = new FakePostgres(SCHEMA);
  orm = fakeMoveOrm(pg, { known: [M1, M2] });
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('moveSqliteToPostgres', () => {
  it('MOVE-001: fills every table in foreign key order, sets the self-references afterwards and verifies the copy', async () => {
    const summary = await moveSqliteToPostgres(options());
    expect(summary.tables.map((table) => [table.label, table.rows])).toEqual([
      ['users', 2],
      ['trips', 2],
      ['messages', 2],
    ]);
    expect(pg.rowsOf('"users"')).toEqual([
      ['1', 'Ada'],
      ['2', 'Grace'],
    ]);
    expect(pg.rowsOf('"trips"')).toEqual([
      ['1', '1', 'Lisbon', '{"b":1,"a":2}', Buffer.from([0, 255]), 1.5],
      ['2', '2', 'Porto', null, null, null],
    ]);
    // The reply was inserted without its reference, then pointed at the message it answers.
    expect(pg.rowsOf('"messages"')).toEqual([
      ['1', '1', '2', 'I do'],
      ['2', '1', null, 'Who books the tram?'],
    ]);
    const statements = pg.statements.join('\n');
    expect(statements).toMatch(/truncate table "users", "trips", "messages"/);
    expect(statements).toMatch(/update "messages" set "reply_to" = \$1 where "id" = \$2/);
    expect(statements).not.toContain(CLEAR_SCHEMA_SQL);
    expect(summary.warnings).toEqual([]);
  });

  it('MOVE-002: moves every sequence past the copied ids, and past ids AUTOINCREMENT handed out before', async () => {
    const summary = await moveSqliteToPostgres(options());
    expect(summary.sequences).toBe(3);
    expect(pg.sequences.get('public.users_id_seq')).toEqual({ value: '3', called: true });
    expect(pg.sequences.get('public.trips_id_seq')).toEqual({ value: '2', called: true });
    expect(pg.sequences.get('public.messages_id_seq')).toEqual({ value: '2', called: true });
  });

  it('MOVE-003: an empty table starts its sequence at 1', async () => {
    sqlite(path.join(dir, 'travel.db'), 'delete from messages;');
    await moveSqliteToPostgres(options());
    expect(pg.sequences.get('public.messages_id_seq')).toEqual({ value: '1', called: false });
  });

  it('MOVE-004: a copy that does not read back as sent is refused and the schema dropped again', async () => {
    pg.tamper.set('"trips"', (rows) => rows.map((row) => row.map((value) => (value === 'Porto' ? 'Braga' : value))));
    await expect(moveSqliteToPostgres(options())).rejects.toThrow(
      /does not match the SQLite file; nothing was written:\n {2}- trips: the rows Postgres holds differ/,
    );
    expect(pg.statements.at(-1)).toBe(CLEAR_SCHEMA_SQL);
  });

  it('MOVE-005: a row count that differs is named with all three counts', async () => {
    pg.tamper.set('"users"', (rows) => rows.slice(1));
    await expect(moveSqliteToPostgres(options())).rejects.toThrow(
      'users: the SQLite file holds 2 rows, 2 were sent, Postgres holds 1',
    );
  });

  it('MOVE-006: values Postgres cannot hold are listed by row and column, and nothing is inserted', async () => {
    sqlite(path.join(dir, 'travel.db'), "update users set id = id; update trips set score = 'high' where id = 2;");
    const failure = moveSqliteToPostgres(options());
    await expect(failure).rejects.toBeInstanceOf(MoveRefusal);
    await expect(moveSqliteToPostgres(options())).rejects.toThrow(
      /1 value\(s\) in the SQLite file cannot be stored in Postgres exactly; nothing was written:\n {2}- trips row id=2, column score: the text "high" is not a number/,
    );
    expect(pg.statements.some((sql) => sql.startsWith('insert into "messages"'))).toBe(false);
    expect(pg.statements.at(-1)).toBe(CLEAR_SCHEMA_SQL);
  });

  it('MOVE-007: a statement Postgres refuses is named with its table, detail and constraint', async () => {
    pg.failOn = /^insert into "trips"/;
    await expect(moveSqliteToPostgres(options())).rejects.toThrow(
      'Postgres refused rows of trips: refused by the fake; constraint fake_key; Key (id)=(1)',
    );
    expect(pg.statements.at(-1)).toBe(CLEAR_SCHEMA_SQL);
  });

  it('MOVE-008: when the schema cannot be dropped after a failure, the error says the database needs dropping', async () => {
    pg.failOn = /^(insert into "trips"|DO \$clear\$)/;
    await expect(moveSqliteToPostgres(options())).rejects.toThrow(/could not be dropped .* Drop the Postgres database/);
  });

  it('MOVE-009: refuses a target that holds a table or a plugin schema, before it writes anything', async () => {
    pg.existing = ['customers'];
    await expect(moveSqliteToPostgres(options())).rejects.toThrow(/The Postgres database is not empty \(customers\)/);
    pg.existing = [];
    pg.pluginSchemas = ['trek_plugin_notes'];
    await expect(moveSqliteToPostgres(options())).rejects.toThrow(/schema trek_plugin_notes/);
    expect(pg.statements.some((sql) => sql.startsWith('create') || sql.startsWith('insert'))).toBe(false);
  });

  it('MOVE-010: refuses a SQLite file at another migration level, one with orphaned rows, and one it cannot read', async () => {
    await expect(
      moveSqliteToPostgres(options({ known: new Set([M1, M2, 'Migration20200101000200_third']) })),
    ).rejects.toThrow(/1 migration\(s\) behind this TREK version\. Start this TREK version on it once/);
    sqlite(
      path.join(dir, 'travel.db'),
      "pragma foreign_keys = off; insert into trips (id, user_id, title) values (9, 77, 'Nowhere');",
    );
    await expect(moveSqliteToPostgres(options())).rejects.toThrow(/trips row 9 refers to a missing row of users/);
    await expect(moveSqliteToPostgres(options({ sqliteFile: path.join(dir, 'missing.db') }))).rejects.toThrow(
      /Cannot read the SQLite file .*missing\.db: There is no SQLite file/,
    );
  });

  it('MOVE-036: a SQLite file whose tables differ from the schema is refused with what that means and what to do', async () => {
    sqlite(
      path.join(dir, 'travel.db'),
      'alter table trips drop column score; alter table users add column nickname text;',
    );
    const failure = moveSqliteToPostgres(options());
    await expect(failure).rejects.toBeInstanceOf(MoveRefusal);
    await expect(failure).rejects.toThrow(
      "The SQLite file and this TREK's Postgres schema differ; nothing was written:\n" +
        '  - the SQLite column users.nickname has no Postgres column\n' +
        '  - the Postgres column trips.score has no SQLite column\n' +
        SCHEMA_DIFFERENCE_REMEDY,
    );
    expect(SCHEMA_DIFFERENCE_REMEDY).toContain('[DB] The database lacks');
    expect(SCHEMA_DIFFERENCE_REMEDY).toContain('keep running TREK on SQLite');
    expect(pg.statements.some((sql) => sql.startsWith('insert into'))).toBe(false);
    expect(pg.statements.at(-1)).toBe(CLEAR_SCHEMA_SQL);
  });

  it('MOVE-037: what the schema itself cannot copy is named apart, as a bug in TREK, not as the file lacking it', () => {
    const typeProblem = 'the Postgres column trips.when has the type interval, which the move does not know';
    expect(schemaRefusal([], [])).toBeNull();
    expect(schemaRefusal([], [typeProblem])).toBe(
      "This TREK's Postgres schema holds what the move cannot copy; nothing was written:\n" +
        `  - ${typeProblem}\n` +
        SCHEMA_BUG_REMEDY,
    );
    expect(schemaRefusal(['the Postgres column trips.score has no SQLite column'], [typeProblem])).toBe(
      "The SQLite file and this TREK's Postgres schema differ; nothing was written:\n" +
        '  - the Postgres column trips.score has no SQLite column\n' +
        `${SCHEMA_DIFFERENCE_REMEDY}\n` +
        "This TREK's Postgres schema holds what the move cannot copy; nothing was written:\n" +
        `  - ${typeProblem}\n` +
        SCHEMA_BUG_REMEDY,
    );
    expect(SCHEMA_BUG_REMEDY).not.toContain('[DB] The database lacks');
  });

  it('MOVE-011: a plugin database goes into its schema with its migration record, ids and indexes', async () => {
    const pluginDir = path.join(dir, 'plugins-data', 'move-notes');
    fs.mkdirSync(pluginDir, { recursive: true });
    fs.mkdirSync(path.join(dir, 'plugins-data', 'Not_An_Id'), { recursive: true });
    sqlite(path.join(dir, 'plugins-data', 'Not_An_Id', 'plugin.db'), 'create table t (a);');
    sqlite(
      path.join(pluginDir, 'plugin.db'),
      `create table _plugin_migrations (id text primary key, applied_at integer);
       insert into _plugin_migrations values ('001', 1700000000000);
       create table notes (id integer primary key autoincrement, body text not null default 'x', score real, raw blob,
         added text default current_timestamp, odd text default (lower('A')));
       create unique index notes_body on notes (body);
       create index notes_hot on notes (score) where score > 1;
       create view recent as select * from notes;
       insert into notes (body, score, raw) values ('a', 1.5, x'01'), ('b', null, null), ('c', 3, null);
       delete from notes where body = 'c';`,
    );
    const summary = await moveSqliteToPostgres(options());
    expect(summary.plugins).toEqual([
      {
        pluginId: 'move-notes',
        schema: 'trek_plugin_move_notes',
        tables: [
          { label: '_plugin_migrations', rows: 1, checksum: expect.any(String) },
          { label: 'notes', rows: 2, checksum: expect.any(String) },
        ],
        notCarried: [
          'the view recent',
          expect.stringMatching(/^the default \(?lower\('A'\)\)? of notes\.odd$/),
          'the index notes_hot on notes (partial or over an expression)',
        ],
      },
    ]);
    expect(summary.warnings).toEqual([
      expect.stringMatching(/Not_An_Id.*plugin\.db is in a directory whose name is no plugin id/),
    ]);
    const statements = pg.statements.join('\n');
    expect(statements).toContain('create schema "trek_plugin_move_notes"');
    expect(statements).toContain(
      'create table "trek_plugin_move_notes"."notes" ("id" bigint generated by default as identity, ' +
        '"body" text not null default \'x\', "score" double precision, "raw" bytea, "added" text default ' +
        'to_char((CURRENT_TIMESTAMP AT TIME ZONE \'UTC\'), \'YYYY-MM-DD HH24:MI:SS\'), "odd" text, primary key ("id"))',
    );
    expect(statements).toContain('create unique index "notes_body" on "trek_plugin_move_notes"."notes" ("body")');
    expect(pg.rowsOf('"trek_plugin_move_notes"."_plugin_migrations"')).toEqual([['001', '1700000000000']]);
    expect(pg.sequences.get('"trek_plugin_move_notes"."notes"_seq')).toEqual({ value: '3', called: true });
    expect(renderSummary(summary, 'postgres://db/trek')).toContain(
      'Plugin move-notes: 2 table(s), 3 rows, into schema trek_plugin_move_notes.',
    );
  });

  it("MOVE-012: a plugin database without a migration record gets the store's empty one", async () => {
    const pluginDir = path.join(dir, 'plugins-data', 'bare-notes');
    fs.mkdirSync(pluginDir, { recursive: true });
    sqlite(path.join(pluginDir, 'plugin.db'), 'create table kv (k text primary key, v);');
    await moveSqliteToPostgres(options());
    expect(pg.statements).toContain(
      'create table "trek_plugin_bare_notes"._plugin_migrations (id text primary key, applied_at bigint)',
    );
    expect(findPluginDataFiles(path.join(dir, 'nowhere'))).toEqual({ files: [], skipped: [] });
  });

  it('MOVE-013: copies an integer past 2^53 exactly and warns that TREK cannot read it back on Postgres', async () => {
    sqlite(path.join(dir, 'travel.db'), 'update trips set id = 9007199254740993 where id = 2;');
    const summary = await moveSqliteToPostgres(options());
    expect(pg.rowsOf('"trips"').map((row) => row[0])).toEqual(['1', '9007199254740993']);
    expect(pg.sequences.get('public.trips_id_seq')).toEqual({ value: '9007199254740993', called: true });
    expect(summary.warnings).toEqual(['trips holds 1 integer(s) beyond 2^53, which TREK refuses to read on Postgres.']);
  });

  it("MOVE-038: a stay id an old install keeps as a number moves as the '<id>.0' text TREK compares it as", async () => {
    pg = new FakePostgres([
      ...SCHEMA,
      {
        name: 'reservations',
        columns: [
          { name: 'id', dataType: 'bigint', nullable: false },
          { name: 'accommodation_id', dataType: 'text' },
        ],
        primaryKey: ['id'],
        serial: ['id'],
      },
    ]);
    orm = fakeMoveOrm(pg, { known: [M1, M2] });
    // The column as legacy step 34 added it: INTEGER, so the '14.0' the services write is stored as 14.
    sqlite(
      path.join(dir, 'travel.db'),
      `create table reservations (id integer primary key, accommodation_id integer);
       insert into reservations values (1, '14.0'), (2, null), (3, 'abc');`,
    );
    await moveSqliteToPostgres(options());
    expect(pg.rowsOf('"reservations"')).toEqual([
      ['1', '14.0'],
      ['2', null],
      ['3', 'abc'],
    ]);
  });
});

describe('nothing is changed silently', () => {
  /** A plugin's `plugin.db` under the plugins' data directory. */
  function pluginDb(pluginId: string, sql: string): void {
    fs.mkdirSync(path.join(dir, 'plugins-data', pluginId), { recursive: true });
    sqlite(path.join(dir, 'plugins-data', pluginId, 'plugin.db'), sql);
  }

  it("MOVE-021: a plugin's NUL or a value that would change type refuses the move before anything is written", async () => {
    pluginDb(
      'nul-notes',
      `create table notes (id integer primary key, tag text, body text);
       insert into notes values (1, 'team' || char(0) || 'a', 'secret' || char(0) || 'payload'), (2, 'teama', 'other');
       create table kv (k text primary key, v);
       insert into kv values ('a', 5), ('b', 1.5), ('c', 'x');`,
    );
    const failure = moveSqliteToPostgres(options());
    await expect(failure).rejects.toBeInstanceOf(MoveRefusal);
    const message = await failure.catch((err: Error) => err.message);
    expect(message).toContain(
      '4 value(s) in plugin data cannot move to Postgres unchanged; nothing was written:\n' +
        '  - plugin nul-notes: kv row k=a, column v: the value 5 is stored as an INTEGER, but the column holds text ' +
        'on Postgres, so the plugin would read it back as another type\n' +
        '  - plugin nul-notes: kv row k=b, column v: the value 1.5 is stored as a REAL',
    );
    expect(message).toContain(
      '  - plugin nul-notes: notes row id=1, column tag: the text "team\\u0000a" holds a NUL character (U+0000), ' +
        'which Postgres text cannot hold\n' +
        '  - plugin nul-notes: notes row id=1, column body: the text "secret\\u0000payload" holds a NUL character',
    );
    expect(message).toMatch(/A plugin's own data moves exactly as the plugin stored it, or not at all/);
    // Refused before the target was even looked at: nothing created, nothing inserted.
    expect(pg.statements).toEqual([]);
  });

  it('MOVE-022: a BLOB column holding text stays text, and a column holding only numbers stays numbers', async () => {
    pluginDb(
      'typed-notes',
      `create table docs (id integer primary key, payload blob, raw blob, data);
       insert into docs values (1, '{"a":1}', x'00ff', 5), (2, 'plain', null, 1.5);`,
    );
    const summary = await moveSqliteToPostgres(options());
    expect(pg.statements).toContain(
      'create table "trek_plugin_typed_notes"."docs" ("id" bigint generated by default as identity, ' +
        '"payload" text, "raw" bytea, "data" double precision, primary key ("id"))',
    );
    expect(pg.rowsOf('"trek_plugin_typed_notes"."docs"')).toEqual([
      ['1', '{"a":1}', Buffer.from([0, 255]), 5],
      ['2', 'plain', null, 1.5],
    ]);
    expect(summary.plugins[0].tables).toEqual([{ label: 'docs', rows: 2, checksum: expect.any(String) }]);
  });

  it("MOVE-023: a NUL in TREK's own text is refused by default, and with dropNul dropped and listed", async () => {
    sqlite(
      path.join(dir, 'travel.db'),
      `update users set name = 'Ad' || char(0) || 'a' where id = 1;
       update trips set meta = '{"k\\u0000":1}' where id = 1;`,
    );
    const failure = moveSqliteToPostgres(options());
    await expect(failure).rejects.toBeInstanceOf(MoveRefusal);
    const message = await failure.catch((err: Error) => err.message);
    expect(message).toContain(
      '2 value(s) in the SQLite file cannot be stored in Postgres exactly; nothing was written:\n' +
        '  - users row id=1, column name: the text "Ad\\u0000a" holds a NUL character (U+0000), which Postgres text cannot hold\n' +
        '  - trips row id=1, column meta: the text "{\\"k\\\\u0000\\":1}" holds a NUL character (U+0000), which ' +
        'Postgres text cannot hold (escaped as \\u0000)\n' +
        '2 of them hold a NUL character (U+0000). TREK no longer stores this character and drops it on its next write. ' +
        'Run the move again with --drop-nul',
    );
    expect(pg.statements.at(-1)).toBe(CLEAR_SCHEMA_SQL);

    const summary = await moveSqliteToPostgres(options({ dropNul: true }));
    expect(pg.rowsOf('"users"')).toEqual([
      ['1', 'Ada'],
      ['2', 'Grace'],
    ]);
    expect(pg.rowsOf('"trips"')[0][3]).toBe('{"k":1}');
    expect(summary.nulDropped).toEqual(['users row id=1, column name', 'trips row id=1, column meta']);
    expect(renderSummary(summary, 'postgres://db/trek')).toContain(
      '  --drop-nul removed NUL characters (U+0000) from 2 value(s):\n' +
        '    users row id=1, column name\n' +
        '    trips row id=1, column meta',
    );
  });

  it('MOVE-024: a unique key a dropped NUL may have broken lists that value, never asserting the cause', async () => {
    sqlite(path.join(dir, 'travel.db'), "update users set name = 'Ad' || char(0) || 'a' where id = 2;");
    pg.failOn = /^insert into "users"/;
    pg.failWith = {
      code: '23505',
      constraint: 'users_name_unique',
      detail: 'Key (name)=(Ada) already exists.',
    };
    const broken = moveSqliteToPostgres(options({ dropNul: true }));
    await expect(broken).rejects.toBeInstanceOf(MoveRefusal);
    await expect(broken).rejects.toThrow(
      'Postgres refused rows of users: refused by the fake; constraint users_name_unique; Key (name)=(Ada) already ' +
        'exists.\nTwo rows of users share a value of its column(s) name, which Postgres holds unique and the SQLite ' +
        'file did not (it may lack that index). The detail above names the value.\n' +
        '--drop-nul removed NUL characters (U+0000) from 1 value(s) of its column(s) name that may hold it; a value ' +
        'that differed from another only by a NUL equals it once the NUL is gone, so check these first:\n' +
        '  - users row id=2, column name\n' +
        'Change or remove one of those rows ' +
        'in the SQLite file (through TREK while it still runs on SQLite, or with the sqlite3 tool while TREK is ' +
        'stopped), then run the move again.',
    );
    // A broken key whose columns lost no NUL is a duplicate the SQLite file held apart: named, with what to do.
    pg.failWith = { code: '23505', constraint: 'users_pkey', detail: 'Key (id)=(2) already exists.' };
    const duplicate = moveSqliteToPostgres(options({ dropNul: true }));
    await expect(duplicate).rejects.toBeInstanceOf(MoveRefusal);
    await expect(duplicate).rejects.toThrow(
      'Postgres refused rows of users: refused by the fake; constraint users_pkey; Key (id)=(2) already exists.\n' +
        'Two rows of users share a value of its column(s) id, which Postgres holds unique and the SQLite file did ' +
        'not (it may lack that index). The detail above names the value.\nChange or remove one of those rows in the ' +
        'SQLite file (through TREK',
    );
    expect(pg.statements.at(-1)).toBe(CLEAR_SCHEMA_SQL);
  });

  it('MOVE-029: a key over an expression lists exactly the dropped values of the columns its expression reads', () => {
    const spec = {
      source: 'users',
      target: '"users"',
      label: 'users',
      columns: [],
      deferred: [],
      primaryKey: ['id'],
      exact: false,
      uniqueKeys: [
        { name: 'users_pkey', key: 'id', columns: ['id'], expression: false },
        { name: 'idx_users_email_lower', key: 'lower(email)', columns: ['email'], expression: true },
      ],
    };
    const dropped = [
      { where: 'users row id=1, column username', column: 'username', text: 'ab@x.test' },
      { where: 'users row id=2, column email', column: 'email', text: 'Ab@x.test' },
      { where: 'users row id=3, column bio', column: 'bio', text: 'ab@x.test' },
    ];
    const err = Object.assign(new Error('duplicate key value violates unique constraint "idx_users_email_lower"'), {
      code: '23505',
      constraint: 'idx_users_email_lower',
      detail: 'Key (lower(email))=(ab@x.test) already exists.',
    });
    expect(refusedRowsMessage(spec, err, dropped)).toBe(
      'Postgres refused rows of users: duplicate key value violates unique constraint "idx_users_email_lower"; ' +
        'constraint idx_users_email_lower; Key (lower(email))=(ab@x.test) already exists.\n' +
        'Two rows of users share a value of its column(s) email (read by its unique key lower(email)), which ' +
        "Postgres holds unique and the SQLite file did not (it may lack that index, or compare differently: SQLite's " +
        'lower() changes only A to Z). The detail above names the value.\n' +
        '--drop-nul removed NUL characters (U+0000) from 1 value(s) of its column(s) email (read by its unique key ' +
        'lower(email)) that may hold it; a value that differed from another only by a NUL equals it once the NUL is ' +
        'gone, so check these first:\n' +
        '  - users row id=2, column email\n' +
        'Change or remove one of those rows ' +
        'in the SQLite file (through TREK while it still runs on SQLite, or with the sqlite3 tool while TREK is ' +
        'stopped), then run the move again.',
    );
    // Without a dropped value in that column, it is a duplicate the SQLite file held apart.
    expect(refusedRowsMessage(spec, err, dropped.slice(0, 1))).toContain(
      'Two rows of users share a value of its column(s) email (read by its unique key lower(email)), which Postgres ' +
        "holds unique and the SQLite file did not (it may lack that index, or compare differently: SQLite's lower() " +
        'changes only A to Z). The detail above names the value.\nChange or remove one of those rows',
    );
  });

  it('MOVE-033: a dropped NUL in a column the key reads is not blamed when the duplicate value does not hold it', () => {
    const spec = {
      source: 'users',
      target: '"users"',
      label: 'users',
      columns: [],
      deferred: [],
      primaryKey: ['id'],
      exact: false,
      uniqueKeys: [{ name: 'idx_users_email_lower', key: 'lower(email)', columns: ['email'], expression: true }],
    };
    // Two accounts differ only in case (the pending index); an unrelated address lost a NUL.
    const unrelated = { where: 'users row id=3, column email', column: 'email', text: 'other@x.test' };
    const err = Object.assign(new Error('duplicate key'), {
      code: '23505',
      constraint: 'idx_users_email_lower',
      detail: 'Key (lower(email))=(dup@x.test) already exists.',
    });
    const message = refusedRowsMessage(spec, err, [unrelated]);
    expect(message).not.toContain('--drop-nul');
    expect(message).not.toContain('row id=3');
    expect(message).toContain("compare differently: SQLite's lower() changes only A to Z). The detail above names");
    // A value whose NUL-free text the duplicate holds is listed, whatever its case.
    const related = { where: 'users row id=4, column email', column: 'email', text: 'DUP@x.test' };
    expect(refusedRowsMessage(spec, err, [unrelated, related])).toMatch(
      /from 1 value\(s\) of its column\(s\) email .*check these first:\n {2}- users row id=4, column email\nChange/,
    );
    // JSON, which jsonb reformats, and a detail of another shape cannot rule a value out: it is listed.
    const json = { where: 'users row id=5, column email', column: 'email', text: null };
    expect(refusedRowsMessage(spec, err, [json])).toContain('  - users row id=5, column email\n');
    const localized = Object.assign(new Error('doppelter Schlüsselwert'), {
      code: '23505',
      constraint: 'idx_users_email_lower',
      detail: 'Schlüssel »(lower(email))=(dup@x.test)« existiert bereits.',
    });
    expect(refusedRowsMessage(spec, localized, [unrelated])).toContain('  - users row id=3, column email\n');
  });

  it('MOVE-034: a plain key over a quoted column is named by its column, without the hint about lower()', () => {
    const spec = {
      source: 'p',
      target: '"trek_plugin_p"."p"',
      label: 'plugin p: p',
      columns: [],
      deferred: [],
      primaryKey: [],
      exact: true,
      uniqueKeys: [{ name: 'p_user', key: '"userId"', columns: ['userId'], expression: false }],
    };
    const err = Object.assign(new Error('duplicate key'), {
      code: '23505',
      constraint: 'p_user',
      detail: 'Key ("userId")=(7) already exists.',
    });
    expect(refusedRowsMessage(spec, err, [])).toBe(
      'Postgres refused rows of plugin p: p: duplicate key; constraint p_user; Key ("userId")=(7) already exists.\n' +
        'Two rows of plugin p: p share a value of its column(s) userId, which Postgres holds unique and the SQLite ' +
        'file did not (it may lack that index). The detail above names the value.\n' +
        "Change or remove one of those rows in the plugin's plugin.db (through the plugin, or with the sqlite3 tool " +
        'while TREK is stopped), then run the move again.',
    );
  });

  it('MOVE-035: a value Postgres refuses at insert is a failure reported as a gap in the move, not a refusal', async () => {
    pg.failOn = /^insert into "trips"/;
    pg.failWith = { code: '22P02' };
    const failure = moveSqliteToPostgres(options());
    await expect(failure).rejects.not.toBeInstanceOf(MoveRefusal);
    await expect(failure).rejects.toThrow(
      /^Postgres refused rows of trips: refused by the fake\nThe move let through a value of trips that Postgres refuses\. It should have refused that value by table, row and column before writing anything, so this is a bug in TREK: please report it with this message\.$/,
    );
    expect(pg.statements.at(-1)).toBe(CLEAR_SCHEMA_SQL);
  });

  it('MOVE-030: a row breaking a constraint is a refusal that says what to do; anything else stays a failure', async () => {
    pg.failOn = /^insert into "trips"/;
    pg.failWith = {
      code: '23514',
      constraint: 'trips_score_check',
      detail: 'Failing row contains (2, 2, Porto, null, null, null).',
    };
    const check = moveSqliteToPostgres(options());
    await expect(check).rejects.toBeInstanceOf(MoveRefusal);
    await expect(check).rejects.toThrow(
      'Postgres refused rows of trips: refused by the fake; constraint trips_score_check; Failing row contains ' +
        '(2, 2, Porto, null, null, null).\nA row of trips breaks a rule of its Postgres table that the SQLite file ' +
        'did not hold it to; the detail above names the failing row or the value it refers to. Correct or remove ' +
        'that row ' +
        'in the SQLite file (through TREK while it still runs on SQLite, or with the sqlite3 tool while TREK is ' +
        'stopped), then run the move again.',
    );
    // A connection or a statement of the move's own is not the file's: no remedy for the file, no refusal.
    pg.failWith = { code: '08006', detail: 'connection lost' };
    const lost = moveSqliteToPostgres(options());
    await expect(lost).rejects.toThrow(/^Postgres refused rows of trips: refused by the fake; connection lost$/);
    await expect(lost).rejects.not.toBeInstanceOf(MoveRefusal);
  });

  it("MOVE-031: a raw NUL in TREK's JSON is refused as a NUL with --drop-nul named, and with it dropped and listed", async () => {
    sqlite(path.join(dir, 'travel.db'), `update trips set meta = '{"k":"a' || char(0) || 'b"}' where id = 1;`);
    const failure = moveSqliteToPostgres(options());
    await expect(failure).rejects.toBeInstanceOf(MoveRefusal);
    await expect(failure).rejects.toThrow(
      '1 value(s) in the SQLite file cannot be stored in Postgres exactly; nothing was written:\n' +
        '  - trips row id=1, column meta: the text "{\\"k\\":\\"a\\u0000b\\"}" holds a NUL character (U+0000), ' +
        'which Postgres text cannot hold\n' +
        '1 of them hold a NUL character (U+0000). TREK no longer stores this character and drops it on its next ' +
        'write. Run the move again with --drop-nul to drop it now; the summary then lists every value it changed.',
    );
    const summary = await moveSqliteToPostgres(options({ dropNul: true }));
    expect(pg.rowsOf('"trips"')[0][3]).toBe('{"k":"ab"}');
    expect(summary.nulDropped).toEqual(['trips row id=1, column meta']);
  });

  it('MOVE-032: a refusal of other values says how to correct them, after the NUL remedy when both occur', async () => {
    sqlite(path.join(dir, 'travel.db'), "update trips set score = 'high' where id = 2;");
    await expect(moveSqliteToPostgres(options())).rejects.toThrow(
      /column score: the text "high" is not a number\nCorrect them in the SQLite file \(through TREK while it still runs on SQLite, or with the sqlite3 tool while TREK is stopped\), then run the move again\.$/,
    );
    sqlite(path.join(dir, 'travel.db'), "update users set name = 'Ad' || char(0) || 'a' where id = 1;");
    await expect(moveSqliteToPostgres(options())).rejects.toThrow(
      /lists every value it changed\.\nCorrect the others in the SQLite file \(through TREK/,
    );
  });

  it('MOVE-025: a refused key is explained by every dropped NUL of the table when the key is not known', () => {
    const spec = {
      source: 't',
      target: '"t"',
      label: 't',
      columns: [],
      deferred: [],
      primaryKey: [],
      exact: false,
      uniqueKeys: [],
    };
    const dropped = [{ where: 't row 1, column a', column: 'a', text: 'x' }];
    const err = Object.assign(new Error('duplicate key'), { code: '23505', constraint: 'gone' });
    expect(refusedRowsMessage(spec, err, dropped)).toMatch(
      /from 1 value\(s\) of t that may hold it; a value .*\n {2}- t row 1, column a\n/,
    );
    expect(refusedRowsMessage(spec, new Error('other'), dropped)).toBe('Postgres refused rows of t: other');
    expect(refusedRowsMessage(spec, err, [])).toBe(
      'Postgres refused rows of t: duplicate key; constraint gone\nTwo rows of t share a unique key, which Postgres ' +
        'holds unique and the SQLite file did not (it may lack that index). The detail above names the value.\n' +
        'Change or remove one of those rows ' +
        'in the SQLite file (through TREK while it still runs on SQLite, or with the sqlite3 tool while TREK is ' +
        'stopped), then run the move again.',
    );
  });
});

describe('migrationLevelProblem', () => {
  it('MOVE-014: a file at this level passes; older, newer or unversioned ones say what to run', () => {
    const known = new Set([M1, M2]);
    expect(migrationLevelProblem([M1, M2], known)).toBeNull();
    expect(migrationLevelProblem(null, known)).toMatch(/no TREK migration history/);
    expect(migrationLevelProblem([], known)).toMatch(/no TREK migration history/);
    expect(migrationLevelProblem([M1, M2, 'Migration20990101000000_future'], known)).toMatch(
      /a newer TREK migrated the SQLite file \(1 migration\(s\) this version does not know, the last Migration20990101000000_future\)/,
    );
    expect(migrationLevelProblem([M1], known)).toMatch(/1 migration\(s\) behind/);
  });
});

describe('the pieces', () => {
  it('MOVE-015: the plugin column rules, defaults and batches', () => {
    const classes = (...names: string[]) => new Set(names);
    expect(pluginColumnKind('INTEGER', classes('text'))).toBe('integer');
    expect(pluginColumnKind('VARCHAR(20)', classes())).toBe('text');
    expect(pluginColumnKind('BLOB', classes('blob'))).toBe('bytes');
    expect(pluginColumnKind('BLOB', classes('integer'))).toBe('integer');
    // Text in a column declared BLOB stays text: the plugin reads a string back, not a Buffer.
    expect(pluginColumnKind('BLOB', classes('text'))).toBe('text');
    expect(pluginColumnKind('BLOB', classes('blob', 'text'))).toBe('text');
    expect(pluginColumnKind('BLOB', classes())).toBe('bytes');
    expect(pluginColumnKind('DOUBLE', classes())).toBe('float');
    // A REAL column keeps its type; text in it is refused by the copy, not turned into text with the numbers.
    expect(pluginColumnKind('REAL', classes('text'))).toBe('float');
    expect(pluginColumnKind('BOOLEAN', classes('integer'))).toBe('integer');
    expect(pluginColumnKind('', classes('integer', 'real'))).toBe('float');
    expect(pluginColumnKind('', classes('blob'))).toBe('bytes');
    expect(pluginColumnKind('', classes())).toBe('text');
    expect(pluginColumnKind('', classes('integer', 'text'))).toBe('text');
    expect(pluginColumnKind('DATETIME', classes('text'))).toBe('text');

    expect(pluginDefault(null, 'text')).toBeNull();
    expect(pluginDefault('NULL', 'text')).toBe('null');
    expect(pluginDefault('(42)', 'integer')).toBe('42');
    expect(pluginDefault('42', 'text')).toBe("'42'");
    expect(pluginDefault('TRUE', 'integer')).toBe('1');
    expect(pluginDefault('false', 'integer')).toBe('0');
    expect(pluginDefault('true', 'text')).toBeNull();
    expect(pluginDefault("'it''s'", 'text')).toBe("'it''s'");
    expect(pluginDefault("strftime('%s','now')", 'integer')).toBe(
      'CAST(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) AS bigint)',
    );
    // A default the column's Postgres type would refuse, or store as another value, is not carried over.
    expect(pluginDefault('0', 'bytes')).toBeNull();
    expect(pluginDefault("'a'", 'bytes')).toBeNull();
    expect(pluginDefault('1.5', 'integer')).toBeNull();
    expect(pluginDefault('1.5', 'float')).toBe('1.5');
    expect(pluginDefault("'abc'", 'integer')).toBeNull();
    expect(pluginDefault('CURRENT_TIMESTAMP', 'integer')).toBeNull();
    expect(pluginDefault('CURRENT_TIMESTAMP', 'text')).toBe(PG_NOW_TEXT_DEFAULT);
    expect(pluginDefault("strftime('%s','now')", 'bytes')).toBeNull();

    expect(batchRows(2)).toBe(500);
    expect(batchRows(200)).toBe(150);
    expect(
      insertSql(
        {
          target: '"t"',
          columns: [
            { name: 'a"b', kind: 'text' },
            { name: 'c', kind: 'integer' },
          ],
        },
        2,
      ),
    ).toBe('insert into "t" ("a""b", "c") values ($1, $2), ($3, $4)');
    expect(describePgError('plain')).toBe('plain');
    expect(describePgError(new Error('bare'))).toBe('bare');
  });

  it('MOVE-016: a SQLite install holds accounts only with a user row; an unreadable file counts as holding them', () => {
    const empty = path.join(dir, 'empty.db');
    fs.writeFileSync(empty, '');
    expect(sqliteInstallHoldsAccounts(empty)).toBe(false);
    expect(sqliteInstallHoldsAccounts(path.join(dir, 'none.db'))).toBe(false);
    expect(sqliteInstallHoldsAccounts(path.join(dir, 'travel.db'))).toBe(true);
    expect(sqliteInstallHoldsAccounts(sqlite(path.join(dir, 'other.db'), 'create table notes (a);'))).toBe(false);
    const broken = path.join(dir, 'broken.db');
    fs.writeFileSync(broken, 'not a database at all, but long enough to be read as one');
    expect(sqliteInstallHoldsAccounts(broken)).toBe(true);
    // Reading never writes the file.
    const before = fs.readFileSync(path.join(dir, 'travel.db'));
    const source = SqliteSource.open(path.join(dir, 'travel.db'));
    expect(source.count('users')).toBe(2);
    source.close();
    source.close();
    expect(fs.readFileSync(path.join(dir, 'travel.db')).equals(before)).toBe(true);
  });

  it('MOVE-026: text is read by its bytes, so bytes that are not UTF-8 are never replaced unseen', () => {
    const file = sqlite(
      path.join(dir, 'bytes.db'),
      'create table t (v);' +
        "insert into t values (cast(x'ff41' as text)), (cast(x'f09080' as text)), (cast(x'efbbbf41' as text)), " +
        "(cast(x'efbfbd' as text)), ('a' || char(0) || 'b'), (''), (x''), (7), (2.5), (null);",
    );
    const source = SqliteSource.open(file);
    const values = [...source.rows('t', ['v'])].map(([value]) => value);
    source.close();
    expect(values[0]).toEqual(new InvalidUtf8Text(Buffer.from([0xff, 0x41]), '\uFFFDA'));
    expect(values[1]).toBeInstanceOf(InvalidUtf8Text);
    expect(String(values[1])).toBe('\uFFFD');
    // A byte order mark and a real U+FFFD are text like any other, kept as they are.
    expect(values.slice(2)).toEqual(['\uFEFFA', '\uFFFD', 'a\u0000b', '', Buffer.alloc(0), 7n, 2.5, null]);
  });

  it('MOVE-028: text of a file created as UTF-16 is read in that encoding, its bad sequences refused like bad UTF-8', () => {
    const file = sqlite(
      path.join(dir, 'utf16.db'),
      "pragma encoding = 'UTF-16le'; create table t (v);" +
        "insert into t values ('h\u00e9llo \u{1F600}'), (cast(x'00d841' || x'00' as text)), ('');",
    );
    const source = SqliteSource.open(file);
    const values = [...source.rows('t', ['v'])].map(([value]) => value);
    source.close();
    expect(values[0]).toBe('h\u00e9llo \u{1F600}');
    expect(values[1]).toEqual(new InvalidUtf8Text(Buffer.from([0x00, 0xd8, 0x41, 0x00]), '\uFFFDA'));
    expect(values[2]).toBe('');
  });

  it('MOVE-027: a plugin key SQLite compared with NOCASE or RTRIM is listed, since Postgres compares it exactly', async () => {
    const pluginDir = path.join(dir, 'plugins-data', 'move-tags');
    fs.mkdirSync(pluginDir, { recursive: true });
    sqlite(
      path.join(pluginDir, 'plugin.db'),
      `create table tags (name text primary key collate nocase, label text, slug text collate rtrim, note text, ref text unique);
       create unique index tags_label on tags (label collate nocase, slug);
       create index tags_note on tags (note);
       insert into tags values ('Alpha', 'a', 's', 'n', 'r');`,
    );
    const summary = await moveSqliteToPostgres(options());
    expect(summary.plugins[0].notCarried).toEqual([
      'the collation NOCASE, RTRIM of the index tags_label on tags (Postgres compares its values exactly)',
      'the collation NOCASE of the primary key on tags (Postgres compares its values exactly)',
    ]);
    const statements = pg.statements.join('\n');
    expect(statements).toContain(
      'create unique index "tags_label" on "trek_plugin_move_tags"."tags" ("label", "slug")',
    );
    expect(statements).toContain('create index "tags_note" on "trek_plugin_move_tags"."tags" ("note")');
    // A UNIQUE constraint's index has a name SQLite made up, so Postgres names it.
    expect(statements).toContain('create unique index on "trek_plugin_move_tags"."tags" ("ref")');
  });
});

describe('runMoveCommand', () => {
  const env = (db: Record<string, unknown>) => () =>
    ({ db: { trekDbFile: path.join(dir, 'travel.db'), ...db }, plugins: { dataDir: '' } }) as unknown as AppEnv;
  const postgres = env({ engine: 'postgres', url: 'postgres://trek:secret@db:5432/trek' });
  const summary: MoveSummary = {
    sqliteFile: 'travel.db',
    tables: [{ label: 'users', rows: 2, checksum: 'x' }],
    plugins: [],
    sequences: 1,
    nulDropped: [],
    warnings: ['careful'],
    seconds: 0.4,
  };

  function io(overrides: Partial<MoveCommandIo> = {}) {
    const out: string[] = [];
    const err: string[] = [];
    const close = vi.fn(async () => undefined);
    return {
      out,
      err,
      close,
      io: {
        env: postgres,
        out: (line: string) => out.push(line),
        err: (line: string) => err.push(line),
        openOrm: async () => ({ close }) as unknown as AnyOrm,
        move: vi.fn(async () => summary),
        ...overrides,
      },
    };
  }

  it('MOVE-017: prints the usage, refuses an unknown argument and a missing TREK_DB_URL', async () => {
    const help = io();
    expect(await runMoveCommand(['--help'], help.io)).toBe(0);
    expect(help.out).toEqual([USAGE]);
    expect(USAGE).toMatch(/\[--drop-nul\][\s\S]*--drop-nul +drop NUL characters \(U\+0000\) from TREK's own text/);
    const unknown = io();
    expect(await runMoveCommand(['--to=x'], unknown.io)).toBe(1);
    expect(unknown.err[0]).toMatch(/The move was refused: Unknown argument --to=x/);
    const onSqlite = io({ env: env({ engine: 'sqlite' }) });
    expect(await runMoveCommand([], onSqlite.io)).toBe(1);
    expect(onSqlite.err[0]).toMatch(/Set TREK_DB_URL/);
  });

  it('MOVE-018: moves the given file, prints the summary without the password and closes the ORM', async () => {
    const run = io();
    expect(await runMoveCommand([`--from=${path.join(dir, 'other.db')}`], run.io)).toBe(0);
    expect(run.io.move).toHaveBeenCalledWith(
      expect.objectContaining({
        sqliteFile: path.join(dir, 'other.db'),
        pluginsDataDir: expect.stringMatching(/plugins-data$/),
        dropNul: false,
      }),
    );
    const dropping = io();
    expect(await runMoveCommand(['--drop-nul'], dropping.io)).toBe(0);
    expect(dropping.io.move).toHaveBeenCalledWith(expect.objectContaining({ dropNul: true }));
    const printed = run.out.join('\n');
    expect(printed).toContain('postgres://trek:***@db:5432/trek');
    expect(printed).not.toContain('secret');
    expect(printed).toMatch(
      /1 tables, 2 rows, each table verified by row count and checksum[\s\S]*users: 2[\s\S]*Warning: careful/,
    );
    expect(run.close).toHaveBeenCalledWith(true);
  });

  it('MOVE-019: a failure prints its cause and still closes the ORM', async () => {
    const failing = io({ move: vi.fn(async () => Promise.reject(new Error('connection lost'))) });
    expect(await runMoveCommand([], failing.io)).toBe(1);
    expect(failing.err[0]).toMatch(/The move failed; .*connection lost/s);
    expect(failing.close).toHaveBeenCalled();
  });

  it("MOVE-020: by default it prints to stdout and stderr and opens the target with the Postgres engine's config", async () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
      // Opening the ORM connects nothing yet, so no server has to answer at the URL.
      let platform: unknown = null;
      const move = vi.fn(async (options: MoveOptions) => {
        platform = options.orm.em.getPlatform();
        return summary;
      });
      expect(await runMoveCommand([], { env: postgres, move })).toBe(0);
      expect(platform).toBeInstanceOf(PostgreSqlPlatform);
      expect(stdout).toHaveBeenCalledWith(expect.stringContaining('into postgres://trek:***@db:5432/trek\n'));

      expect(await runMoveCommand(['--to=x'], { env: postgres })).toBe(1);
      expect(stderr).toHaveBeenCalledWith(expect.stringMatching(/The move was refused: Unknown argument --to=x/));
    } finally {
      stdout.mockRestore();
      stderr.mockRestore();
    }
  });
});
