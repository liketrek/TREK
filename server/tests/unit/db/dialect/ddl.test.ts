/**
 * Schema statements written once per engine (src/db/dialect/ddl.ts) and the
 * migration side of it in src/db/migration-utils.ts: `engineDdl` queues the
 * statements of the engine the migration runs on, in order, and
 * `addColumnIfMissing` takes a column definition per engine, so a migration
 * after the Postgres baseline's cut never hands Postgres a SQLite spelling.
 */
import { forEngine } from '../../../../src/db/dialect/ddl';
import { addColumnIfMissing, engineDdl } from '../../../../src/db/migration-utils';
import { Platform } from '@mikro-orm/core';
import type { Migration } from '@mikro-orm/migrations';
import { BasePostgreSqlPlatform, SqlitePlatform } from '@mikro-orm/sql';

import { describe, expect, it, vi } from 'vitest';

const sqlite = new SqlitePlatform();
const postgres = new BasePostgreSqlPlatform();
class OtherPlatform extends Platform {}

/** A migration on `platform` that records what it queues and executes; `columns` is what the catalog answers. */
function migrationOn(platform: Platform, columns: string[] = []) {
  const queued: string[] = [];
  const executed: string[] = [];
  const migration = {
    addSql: vi.fn((sql: string) => queued.push(sql)),
    execute: vi.fn(async (sql: string) => {
      if (sql.startsWith('alter table')) {
        executed.push(sql);
        return [];
      }
      return columns.map((name) => ({ name }));
    }),
    getEntityManager: () => ({ getPlatform: () => platform }),
  } as unknown as Migration;
  return { migration, queued, executed };
}

const DDL = {
  sqlite: ['CREATE TABLE t (id INTEGER PRIMARY KEY)', 'CREATE INDEX t_a ON t (a)'],
  postgres: ['create table "t" ("id" bigserial primary key)', 'create index "t_a" on "t" ("a")'],
};

describe('engine DDL', () => {
  it('DDL-001: forEngine picks the member of the platform and refuses any other engine', () => {
    expect(forEngine(sqlite, { sqlite: 1, postgres: 2 })).toBe(1);
    expect(forEngine(postgres, { sqlite: 1, postgres: 2 })).toBe(2);
    expect(() => forEngine(new OtherPlatform(), { sqlite: 1, postgres: 2 })).toThrow();
  });

  it('DDL-002: engineDdl queues the statements of the engine it runs on, in order', () => {
    const onSqlite = migrationOn(sqlite);
    engineDdl(onSqlite.migration, DDL);
    expect(onSqlite.queued).toEqual(DDL.sqlite);

    const onPostgres = migrationOn(postgres);
    engineDdl(onPostgres.migration, DDL);
    expect(onPostgres.queued).toEqual(DDL.postgres);

    expect(() => engineDdl(migrationOn(new OtherPlatform()).migration, DDL)).toThrow();
  });

  it('DDL-003: addColumnIfMissing adds the definition of the engine it runs on, once', async () => {
    const definition = { sqlite: 'note TEXT', postgres: 'note text null' };
    const onPostgres = migrationOn(postgres);
    await addColumnIfMissing(onPostgres.migration, 'trips', 'note', definition);
    expect(onPostgres.executed).toEqual(['alter table "trips" add column note text null']);

    const onSqlite = migrationOn(sqlite);
    await addColumnIfMissing(onSqlite.migration, 'trips', 'note', definition);
    expect(onSqlite.executed).toEqual(['alter table `trips` add column note TEXT']);

    const present = migrationOn(postgres, ['note']);
    await addColumnIfMissing(present.migration, 'trips', 'note', definition);
    expect(present.executed).toEqual([]);
  });
});
