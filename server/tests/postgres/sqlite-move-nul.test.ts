/**
 * PGMOVENUL-001..010: the move into Postgres (`src/db/engine/postgres/sqlite-move/`)
 * changes nothing silently, on the lane's server. A plugin value holding a NUL
 * or bytes that are not UTF-8 refuses the move before anything is written; a
 * NUL in TREK's own text refuses it unless `dropNul` (`--drop-nul`) is given;
 * a unique key that dropping a NUL may have broken lists that value, with the
 * constraint Postgres reports; a move with `dropNul` lists every value it
 * changed and stores the value TREK would have written, JSON with nothing
 * else changed; and TREK's own text that is not UTF-8 is refused either way.
 * A key over an expression (`lower(email)`) that a dropped NUL breaks lists
 * only the dropped values of the columns its expression reads, and a raw NUL
 * in JSON text is refused as a NUL and dropped like an escaped one. Two rows
 * a Postgres key holds equal while the SQLite file held them apart are a
 * refusal that names the key and says what to change, and a value that lost
 * a NUL in a column of that key is listed only when the duplicate value holds
 * it. The catalog names a key over an expression as one, and a plain key over
 * a quoted column by that column.
 */
import { buildOrmConfig, resolveEngine } from '../../src/db/engine';
import { readPostgresBaseline } from '../../src/db/engine/postgres/baseline';
import { readTargetSchema } from '../../src/db/engine/postgres/sqlite-move/catalog';
import { inOrder, run } from '../../src/db/engine/postgres/sqlite-move/copy';
import { moveSqliteToPostgres, type MoveSummary } from '../../src/db/engine/postgres/sqlite-move/move';
import { MoveRefusal } from '../../src/db/engine/postgres/sqlite-move/refusal';
import { SqliteEngine } from '../../src/db/engine/sqlite/sqlite-engine';
import { knownMigrationNames } from '../../src/db/known-migrations';
import { runSchemaBootstrap, type AnyOrm } from '../../src/db/orm';
import { createBoundSqliteDriver } from '../../src/db/orm-driver';
import { makeUser } from '../helpers/factories/users';
import { withAdmin } from './databases';
import { MikroORM, type Options } from '@mikro-orm/core';
import type { AbstractSqlConnection } from '@mikro-orm/sql';

import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let dir: string;
let handle: Database.Database;
let sqliteOrm: AnyOrm;
let movedId: number;

/** An ORM on its own SQLite file, migrated the way the SQLite engine brings a file to head. */
async function migratedSqlite(file: string): Promise<AnyOrm> {
  handle = new Database(file);
  handle.pragma('foreign_keys = ON');
  const config = buildOrmConfig(new SqliteEngine());
  const options: Options = {
    ...config,
    driver: createBoundSqliteDriver(() => handle),
    dbName: file,
    migrations: { ...config.migrations, silent: true },
  };
  const orm = await MikroORM.init(options);
  await runSchemaBootstrap(orm, { snapshot: false });
  return orm;
}

/** Runs the move into the worker's database, which the lane hands over empty of tables until a move commits. */
async function move(dropNul = false): Promise<MoveSummary> {
  const config = buildOrmConfig(resolveEngine());
  const orm = await MikroORM.init({
    ...config,
    entities: [],
    entitiesTs: [],
    discovery: { warnWhenNoEntities: false },
    migrations: { ...config.migrations, silent: true },
  });
  try {
    return await moveSqliteToPostgres({
      sqliteFile: path.join(dir, 'travel.db'),
      pluginsDataDir: path.join(dir, 'plugins-data'),
      orm,
      known: knownMigrationNames(),
      baseline: readPostgresBaseline,
      log: () => undefined,
      dropNul,
    });
  } finally {
    await orm.close(true);
  }
}

/** The tables of the worker database's current schema. */
async function tablesInTarget(): Promise<number> {
  return withAdmin(process.env.TREK_DB_URL as string, async (run) => {
    const [row] = await run<{ count: string | number }>(
      'select count(*) as count from information_schema.tables where table_schema = current_schema()',
    );
    return Number(row.count);
  });
}

/** The worker's database, emptied: the lane hands each file a migrated copy, and the move fills an empty one only. */
async function emptyTarget(): Promise<void> {
  const name = new URL(process.env.TREK_DB_URL as string).pathname.slice(1);
  await withAdmin(process.env.TREK_TEST_DB_URL as string, async (run) => {
    await run(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    await run(`CREATE DATABASE "${name}"`);
  });
}

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-pg-move-nul-'));
  sqliteOrm = await migratedSqlite(path.join(dir, 'travel.db'));
  await makeUser(sqliteOrm, { username: 'movera' });
  const { user } = await makeUser(sqliteOrm, { username: 'mover-two' });
  movedId = user.id;
  // A value an older TREK stored with a NUL, which the ORM would no longer write.
  handle.exec(`update users set username = 'mover' || char(0) || 'a' where id = ${movedId}`);
  fs.mkdirSync(path.join(dir, 'plugins-data', 'nul-notes'), { recursive: true });
  const plugin = new Database(path.join(dir, 'plugins-data', 'nul-notes', 'plugin.db'));
  plugin.exec(
    'create table notes (k text primary key, v text);' +
      "insert into notes values ('team' || char(0) || 'a', 'one'), ('teama', 'two'), ('bytes', cast(x'ff41' as text));",
  );
  plugin.close();
  await emptyTarget();
}, 180_000);

afterAll(async () => {
  await sqliteOrm?.close(true);
  if (handle?.open) handle.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('the move changes nothing silently', () => {
  it("PGMOVENUL-001: a plugin's NUL or bytes that are not UTF-8 refuse the move before anything is written", async () => {
    const failure = move(true);
    await expect(failure).rejects.toBeInstanceOf(MoveRefusal);
    await expect(failure).rejects.toThrow(
      /2 value\(s\) in plugin data cannot move to Postgres unchanged; nothing was written:\n {2}- plugin nul-notes: notes row k=team\\u0000a, column k: the text "team\\u0000a" holds a NUL character/,
    );
    await expect(failure).rejects.toThrow(
      'plugin nul-notes: notes row k=bytes, column v: the text "\uFFFDA" holds bytes that are not valid UTF-8 (ff41)',
    );
    expect(await tablesInTarget()).toBe(0);
    fs.rmSync(path.join(dir, 'plugins-data'), { recursive: true, force: true });
  });

  it("PGMOVENUL-002: a NUL in TREK's own text refuses the move by default and names --drop-nul", async () => {
    const failure = move();
    await expect(failure).rejects.toBeInstanceOf(MoveRefusal);
    await expect(failure).rejects.toThrow(
      new RegExp(
        `users row id=${movedId}, column username: the text "mover\\\\u0000a" holds a NUL character \\(U\\+0000\\)` +
          '[\\s\\S]*Run the move again with --drop-nul',
      ),
    );
    expect(await tablesInTarget()).toBe(0);
  });

  it('PGMOVENUL-003: with --drop-nul, a unique key the dropped NUL breaks lists that value, with the constraint', async () => {
    await expect(move(true)).rejects.toThrow(
      new RegExp(
        'Postgres refused rows of users: .*constraint users_username_unique[\\s\\S]*' +
          '--drop-nul removed NUL characters \\(U\\+0000\\) from 1 value\\(s\\) of its column\\(s\\) username ' +
          `that may hold it;[\\s\\S]*  - users row id=${movedId}, column username\\n`,
      ),
    );
    expect(await tablesInTarget()).toBe(0);
  });

  it('PGMOVENUL-004: with --drop-nul and no collision, each changed value is listed and stored without the NUL', async () => {
    handle.exec(`update users set username = 'mover' || char(0) || 'b' where id = ${movedId}`);
    // JSON loses the escaped NUL and nothing else: the digits of a large number and the spelling 1.0 stay.
    handle.exec(
      `update addons set config = '{"note":"a\\u0000b","big":12345678901234567890,"ratio":1.0}' where id = 'collab'`,
    );
    const summary = await move(true);
    expect([...summary.nulDropped].sort()).toEqual([
      'addons row id=collab, column config',
      `users row id=${movedId}, column username`,
    ]);
    const stored = await withAdmin(process.env.TREK_DB_URL as string, (run) =>
      run<{ username: string }>('select username from users where id = ?', [movedId]),
    );
    expect(stored).toEqual([{ username: 'moverb' }]);
    const config = await withAdmin(process.env.TREK_DB_URL as string, (run) =>
      run<{ config: string }>("select config::text as config from addons where id = 'collab'"),
    );
    expect(config).toEqual([{ config: '{"big": 12345678901234567890, "note": "ab", "ratio": 1.0}' }]);
  });

  it("PGMOVENUL-005: TREK's own text whose bytes are not UTF-8 is refused, with --drop-nul too", async () => {
    await emptyTarget();
    handle.exec("insert into app_settings (key, value) values ('move-bytes', cast(x'ff41' as text))");
    const failure = move(true);
    await expect(failure).rejects.toBeInstanceOf(MoveRefusal);
    await expect(failure).rejects.toThrow(
      'app_settings row key=move-bytes, column value: the text "\uFFFDA" holds bytes that are not valid UTF-8 (ff41)',
    );
    expect(await tablesInTarget()).toBe(0);
    handle.exec("delete from app_settings where key = 'move-bytes'");
  });

  it('PGMOVENUL-006: a key over an expression that a dropped NUL breaks lists only the values its expression reads', async () => {
    // The row loses a NUL in username and in email; only email is read by lower(email), the key that breaks.
    handle.exec(
      "update users set email = 'Same@x.test' where username = 'movera';" +
        `update users set username = 'mover' || char(0) || 'c', email = 'same' || char(0) || '@x.test' where id = ${movedId}`,
    );
    const failure = move(true);
    await expect(failure).rejects.toBeInstanceOf(MoveRefusal);
    await expect(failure).rejects.toThrow(
      new RegExp(
        'Postgres refused rows of users: .*constraint idx_users_email_lower; ' +
          'Key \\(lower\\(email\\)\\)=\\(same@x\\.test\\) already exists\\.\\n' +
          'Two rows of users share a value of its column\\(s\\) email \\(read by its unique key lower\\(email\\)\\), ' +
          '[^\\n]*\\n' +
          '--drop-nul removed NUL characters \\(U\\+0000\\) from 1 value\\(s\\) of its column\\(s\\) email ' +
          '\\(read by its unique key lower\\(email\\)\\) that may hold it; [^\\n]*\\n' +
          `  - users row id=${movedId}, column email\\n` +
          'Change or remove one of those rows',
      ),
    );
    expect(await tablesInTarget()).toBe(0);
  });

  it("PGMOVENUL-007: a raw NUL in TREK's JSON is refused as a NUL, and --drop-nul drops it like an escaped one", async () => {
    handle.exec(
      `update users set email = 'mover@x.test' where id = ${movedId};` +
        `update addons set config = '{"note":"a' || char(0) || 'b",' || char(0) || '"ratio":1.0}' where id = 'collab'`,
    );
    const failure = move();
    await expect(failure).rejects.toBeInstanceOf(MoveRefusal);
    await expect(failure).rejects.toThrow(
      'addons row id=collab, column config: the text "{\\"note\\":\\"a\\u0000b\\",\\u0000\\"ratio\\":1.0}" holds a ' +
        'NUL character (U+0000), which Postgres text cannot hold',
    );
    await expect(failure).rejects.toThrow(/Run the move again with --drop-nul/);
    expect(await tablesInTarget()).toBe(0);

    const summary = await move(true);
    expect(summary.nulDropped).toContain('addons row id=collab, column config');
    const config = await withAdmin(process.env.TREK_DB_URL as string, (run) =>
      run<{ config: string }>("select config::text as config from addons where id = 'collab'"),
    );
    expect(config).toEqual([{ config: '{"note": "ab", "ratio": 1.0}' }]);
  });

  it('PGMOVENUL-008: two rows the SQLite file held apart but a Postgres key does not are a refusal that says what to do', async () => {
    await emptyTarget();
    // An install whose case-insensitive email index is still deferred: two accounts differ only in case.
    handle.exec(
      'drop index idx_users_email_lower;' +
        "update users set email = 'Dup@x.test' where username = 'movera';" +
        `update users set email = 'dup@x.test' where id = ${movedId}`,
    );
    const failure = move(true);
    await expect(failure).rejects.toBeInstanceOf(MoveRefusal);
    await expect(failure).rejects.toThrow(
      new RegExp(
        'constraint idx_users_email_lower; Key \\(lower\\(email\\)\\)=\\(dup@x\\.test\\) already exists\\.\\n' +
          'Two rows of users share a value of its column\\(s\\) email \\(read by its unique key lower\\(email\\)\\), ' +
          'which Postgres holds unique and the SQLite file did not [\\s\\S]*Change or remove one of those rows in the ' +
          'SQLite file \\(through TREK while it still runs on SQLite, or with the sqlite3 tool while TREK is ' +
          'stopped\\), then run the move again\\.$',
      ),
    );
    expect(await tablesInTarget()).toBe(0);
  });

  it('PGMOVENUL-009: a value that lost a NUL is not blamed for a duplicate that does not hold it', async () => {
    await emptyTarget();
    // The two accounts of PGMOVENUL-008 still differ only in case; a third address loses a NUL and collides with nothing.
    const { user } = await makeUser(sqliteOrm, { username: 'mover-three' });
    handle.exec(`update users set email = 'other' || char(0) || '@x.test' where id = ${user.id}`);
    const failure = move(true);
    await expect(failure).rejects.toBeInstanceOf(MoveRefusal);
    await expect(failure).rejects.toThrow(
      new RegExp(
        'Key \\(lower\\(email\\)\\)=\\(dup@x\\.test\\) already exists\\.\\n' +
          "Two rows of users share [^\\n]*SQLite's lower\\(\\) changes only A to Z\\)\\. The detail above names the " +
          'value\\.\\nChange or remove one of those rows',
      ),
    );
    await expect(failure).rejects.not.toThrow(/--drop-nul/);
    expect(await tablesInTarget()).toBe(0);
  });

  it('PGMOVENUL-010: the catalog names a key over an expression as one, and a plain key over a quoted column by it', async () => {
    const orm = await MikroORM.init({
      ...buildOrmConfig(resolveEngine()),
      entities: [],
      entitiesTs: [],
      discovery: { warnWhenNoEntities: false },
    });
    const db = (orm.em.getConnection() as AbstractSqlConnection).getClient<object>();
    const rollback = new Error('roll back');
    let keys: unknown;
    try {
      await db.transaction().execute(async (trx) => {
        // Rolled back below, so the schema never outlives the test.
        await inOrder(
          [
            'create schema move_catalog_probe',
            'set local search_path to move_catalog_probe',
            'create table p (id bigint primary key, "userId" text, email text, note text)',
            'create unique index p_user on p ("userId")',
            'create unique index p_email on p (lower(email), "userId") include (note) where note is not null',
          ],
          async (statement) => {
            await run(trx, statement);
          },
        );
        const schema = await readTargetSchema(trx);
        keys = schema.tables.find((table) => table.name === 'p')?.uniqueKeys;
        throw rollback;
      });
    } catch (err) {
      if (err !== rollback) throw err;
    } finally {
      await orm.close(true);
    }
    expect(keys).toEqual([
      { name: 'p_email', key: 'lower(email), "userId"', columns: ['userId', 'email'], expression: true },
      { name: 'p_pkey', key: 'id', columns: ['id'], expression: false },
      { name: 'p_user', key: '"userId"', columns: ['userId'], expression: false },
    ]);
  });
});
