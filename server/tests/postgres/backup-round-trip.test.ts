/**
 * PGRT-001: a backup and a restore with the real client tools against the
 * lane's server (src/db/engine/postgres/pg-tools.ts): pg_dump writes the dump,
 * then pg_restore and psql clear the schema and load it in one transaction, as
 * an ordinary role that owns its database. The schema holds what an operator
 * may add beside TREK's tables, a view and a function over a table, which the
 * clear has to drop through the table's CASCADE without stumbling over them.
 *
 * The tools are the ones TREK finds on the runner. The test needs them to be
 * at least as new as the server and to carry the CVE-2025-8714 fix, as the
 * restore itself does; where they are not, it is skipped and says why. With
 * a client of 17 or later against a server of 14 to 16 it also covers the
 * settings pg_restore writes that such a server does not know.
 */
import { resolvePgTool } from '../../src/db/engine/postgres/pg-process';
import { pgDump, pgRestore } from '../../src/db/engine/postgres/pg-tools';
import { hasRestrictFix } from '../../src/db/engine/postgres/restore-safety';
import { oneByOne } from '../helpers/one-by-one';
import { databaseUrl, withAdmin } from './databases';

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const adminUrl = process.env.TREK_TEST_DB_URL as string;
const NAME = `trek_test_rt_${process.pid}`;
const PASSWORD = 'round-trip';
const LIMIT = 64 * 1024 * 1024;

/** The URL of the database this suite creates, connected as its owner. */
function ownerUrl(): string {
  const url = new URL(databaseUrl(adminUrl, NAME));
  url.username = NAME;
  url.password = PASSWORD;
  return url.toString();
}

/** Why the tools on this machine cannot run a restore against a server of `serverMajor`, or null when they can. */
function toolsUnfitFor(serverMajor: number): string | null {
  for (const tool of ['pg_dump', 'pg_restore', 'psql'] as const) {
    const binary = resolvePgTool(tool, undefined);
    if (!binary) return `${tool} is not installed`;
    const version = execFileSync(binary, ['--version'], { encoding: 'utf8' });
    const major = Number(/\(PostgreSQL\) (\d+)/.exec(version)?.[1]);
    if (!(major >= serverMajor)) return `${version.trim()} is older than the PostgreSQL ${serverMajor} server`;
    if (tool !== 'pg_dump' && !hasRestrictFix(version)) return `${version.trim()} lacks the \\restrict fix`;
  }
  return null;
}

function asOwner<T>(fn: (run: <R = unknown>(sql: string) => Promise<R[]>) => Promise<T>): Promise<T> {
  return withAdmin(ownerUrl(), (run) => fn(run));
}

let unfit: string | null = null;
let work: string;

beforeAll(async () => {
  const [{ version }] = await withAdmin(adminUrl, (run) =>
    run<{ version: string }>("select current_setting('server_version_num') as version"),
  );
  unfit = toolsUnfitFor(Math.floor(Number(version) / 10000));
  if (unfit) return;
  work = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-pg-rt-'));
  await withAdmin(adminUrl, (run) =>
    oneByOne([`create role ${NAME} login password '${PASSWORD}'`, `create database ${NAME} owner ${NAME}`], (sql) =>
      run(sql),
    ),
  );
  await withAdmin(databaseUrl(adminUrl, NAME), (run) => run(`grant create on schema public to ${NAME}`));
});

afterAll(async () => {
  if (unfit) return;
  fs.rmSync(work, { recursive: true, force: true });
  await withAdmin(adminUrl, (run) =>
    oneByOne([`drop database if exists ${NAME} with (force)`, `drop role if exists ${NAME}`], (sql) => run(sql)),
  );
});

describe('Postgres backup round trip', () => {
  it('PGRT-001: a dump restores over a changed schema, dropping what came later, views and functions included', async (ctx) => {
    if (unfit) {
      console.log(`PGRT-001 skipped: ${unfit}`);
      ctx.skip();
    }
    await asOwner((run) =>
      oneByOne(
        [
          'create table mikro_orm_migrations (id serial primary key, name text not null, executed_at text)',
          "insert into mikro_orm_migrations (name) values ('Migration20200101000000_baseline_schema')",
          'create table notes (id serial primary key, body text not null)',
          "insert into notes (body) values ('from the backup')",
          'create view note_bodies as select body from notes',
          'create function all_notes() returns setof notes language sql as $$ select * from notes $$',
        ],
        (sql) => run(sql),
      ),
    );
    const dump = path.join(work, 'travel.pgdump');
    await pgDump(ownerUrl(), dump, undefined);

    await asOwner((run) =>
      oneByOne(["insert into notes (body) values ('after the backup')", 'create table later (id int)'], (sql) =>
        run(sql),
      ),
    );
    await pgRestore(ownerUrl(), dump, undefined, LIMIT);

    const bodies = await asOwner((run) => run<{ body: string }>('select body from note_bodies order by body'));
    const tables = await asOwner((run) =>
      run<{ name: string }>(
        "select table_name as name from information_schema.tables where table_schema = 'public' order by 1",
      ),
    );
    expect(bodies).toEqual([{ body: 'from the backup' }]);
    expect(tables.map((t) => t.name)).toEqual(['mikro_orm_migrations', 'note_bodies', 'notes']);
    expect(fs.readdirSync(work)).toEqual(['travel.pgdump']);
  });
});
