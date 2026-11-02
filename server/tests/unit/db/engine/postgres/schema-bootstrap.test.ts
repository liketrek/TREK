/**
 * How a Postgres database reaches the schema (src/db/engine/postgres/schema-bootstrap.ts):
 * the three states the plan names (empty, foreign tables, TREK's own) and the
 * safety net before pending migrations, over a fake migrator and connection.
 */
import type { AppEnv } from '../../../../../src/app-config';
import {
  bootstrapPostgresSchema,
  postgresSafetyNet,
  type PostgresBootstrapDeps,
} from '../../../../../src/db/engine/postgres/schema-bootstrap';
import type { MigrationSafetyNet } from '../../../../../src/db/legacy-baseline';
import type { AnyOrm } from '../../../../../src/db/orm';
import { Logger } from '@nestjs/common';

import { afterEach, describe, expect, it, vi } from 'vitest';

const M1 = 'Migration20200101000000_baseline_schema';
const M2 = 'Migration20200101000100_second';
const M3 = 'Migration20200101000200_after_the_cut';

interface FakeDb {
  executed: string[];
  pending: string[];
  tables: string[];
  /** Whether mikro_orm_migrations exists: from the start when anything is recorded. */
  history: boolean;
  ensureTable: ReturnType<typeof vi.fn>;
  sql: string[];
  logged: string[];
  inTransaction: boolean[];
  up: ReturnType<typeof vi.fn>;
}

function fakeOrm(state: Pick<FakeDb, 'executed' | 'pending' | 'tables'> & { history?: boolean }): {
  orm: AnyOrm;
  db: FakeDb;
} {
  const db: FakeDb = {
    ...state,
    history: state.history ?? state.executed.length > 0,
    ensureTable: vi.fn(async () => {
      db.history = true;
    }),
    sql: [],
    logged: [],
    inTransaction: [],
    up: vi.fn(async () => undefined),
  };
  const trx = { trx: true };
  const connection = {
    execute: vi.fn(async (sql: string, _params?: unknown[], _method?: string, ctx?: unknown) => {
      if (sql.includes('information_schema.tables')) {
        return [...db.tables, ...(db.history ? ['mikro_orm_migrations'] : [])].map((table_name) => ({ table_name }));
      }
      db.sql.push(sql);
      db.inTransaction.push(ctx === trx);
      return [];
    }),
    transactional: vi.fn(async (work: (ctx: unknown) => Promise<void>) => work(trx)),
  };
  const storage = {
    ensureTable: db.ensureTable,
    logMigration: vi.fn(async ({ name }: { name: string }, ctx?: unknown) => {
      db.logged.push(name);
      db.inTransaction.push(ctx === trx);
      db.executed = [...db.executed, name];
      db.pending = db.pending.filter((pending) => pending !== name);
    }),
  };
  const migrator = {
    getStorage: () => storage,
    getExecuted: vi.fn(async () => db.executed.map((name) => ({ name }))),
    getPending: vi.fn(async () => db.pending.map((name) => ({ name }))),
    up: db.up,
  };
  const orm = {
    config: { getExtension: () => migrator, get: () => ({}) },
    em: { getConnection: () => connection },
  } as unknown as AnyOrm;
  return { orm, db };
}

function deps(
  safetyNet: MigrationSafetyNet = { beforeMigrate: vi.fn(async () => undefined), restoreHint: async () => null },
) {
  const value: PostgresBootstrapDeps = {
    baseline: () => ({
      through: M2,
      migrations: [M1, M2],
      statements: ['create table "a" ("id" bigserial)', 'create index "x" on "a" ("id")'],
    }),
    known: new Set([M1, M2, M3]),
    safetyNet,
  };
  return value;
}

afterEach(() => vi.restoreAllMocks());

describe('bootstrapPostgresSchema', () => {
  it('PGBOOT-001: an empty database gets the baseline and its migrations recorded, all in one transaction', async () => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const { orm, db } = fakeOrm({ executed: [], pending: [M1, M2], tables: [] });
    const net = deps();
    await bootstrapPostgresSchema(orm, net);
    expect(db.sql).toEqual(['create table "a" ("id" bigserial);\ncreate index "x" on "a" ("id")']);
    expect(db.logged).toEqual([M1, M2]);
    expect(db.inTransaction.every(Boolean)).toBe(true);
    expect(db.up).not.toHaveBeenCalled();
    expect(net.safetyNet.beforeMigrate).not.toHaveBeenCalled();
  });

  it('PGBOOT-002: a fresh database runs the migrations after the cut without the safety net (nothing to lose)', async () => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const { orm, db } = fakeOrm({ executed: [], pending: [M1, M2, M3], tables: [] });
    const net = deps();
    await bootstrapPostgresSchema(orm, net);
    expect(db.logged).toEqual([M1, M2]);
    expect(db.up).toHaveBeenCalledTimes(1);
    expect(net.safetyNet.beforeMigrate).not.toHaveBeenCalled();
  });

  it('PGBOOT-003: tables without TREK history are refused, named, and nothing is written', async () => {
    const { orm, db } = fakeOrm({ executed: [], pending: [M1], tables: ['customers', 'orders'] });
    await expect(bootstrapPostgresSchema(orm, deps())).rejects.toThrow(
      /Refusing to boot: the database holds 2 table\(s\) \(customers, orders\) but no TREK migration history/,
    );
    expect(db.sql).toEqual([]);
    expect(db.logged).toEqual([]);
    expect(db.ensureTable).not.toHaveBeenCalled();
  });

  it('PGBOOT-008: an empty history table beside no other table is a fresh database (a first boot cut short)', async () => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const { orm, db } = fakeOrm({ executed: [], pending: [M1, M2], tables: [], history: true });
    await bootstrapPostgresSchema(orm, deps());
    expect(db.logged).toEqual([M1, M2]);
  });

  it('PGBOOT-004: a database a newer TREK migrated is refused before anything runs', async () => {
    const { orm, db } = fakeOrm({ executed: [M1, 'Migration20990101000000_from_the_future'], pending: [], tables: [] });
    await expect(bootstrapPostgresSchema(orm, deps())).rejects.toThrow(/migrated by a newer TREK/);
    expect(db.up).not.toHaveBeenCalled();
  });

  it('PGBOOT-005: pending migrations on a database in use run after the safety net, labelled by the last one', async () => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const { orm, db } = fakeOrm({ executed: [M2, M1], pending: [M3], tables: ['users'] });
    const net = deps();
    await bootstrapPostgresSchema(orm, net);
    expect(net.safetyNet.beforeMigrate).toHaveBeenCalledWith('20200101000100');
    expect(db.up).toHaveBeenCalledTimes(1);
    expect(db.sql).toEqual([]);
  });

  it('PGBOOT-006: a refusing safety net stops the migration', async () => {
    const { orm, db } = fakeOrm({ executed: [M1, M2], pending: [M3], tables: ['users'] });
    const refusing = {
      beforeMigrate: vi.fn(async () => Promise.reject(new Error('no copy'))),
      restoreHint: async () => null,
    };
    await expect(bootstrapPostgresSchema(orm, deps(refusing))).rejects.toThrow('no copy');
    expect(db.up).not.toHaveBeenCalled();
  });

  it('PGBOOT-007: a database at head does nothing', async () => {
    const { orm, db } = fakeOrm({ executed: [M1, M2, M3], pending: [], tables: ['users'] });
    const net = deps();
    await bootstrapPostgresSchema(orm, net);
    expect(db.sql).toEqual([]);
    expect(db.up).not.toHaveBeenCalled();
    expect(net.safetyNet.beforeMigrate).not.toHaveBeenCalled();
  });
});

describe('postgresSafetyNet', () => {
  const envWith = (preMigrateSnapshot: boolean | undefined, isTest: boolean) => () =>
    ({ db: { preMigrateSnapshot }, app: { isTest } }) as unknown as AppEnv;

  it.each([undefined, true])(
    'PGBOOT-010: refuses by default (setting %s), naming pg_dump and the switch, since this release cannot copy a Postgres database',
    async (setting) => {
      await expect(postgresSafetyNet(envWith(setting, false)).beforeMigrate('1')).rejects.toThrow(
        /cannot copy a Postgres database.*pg_dump.*TREK_DB_PRE_MIGRATE_SNAPSHOT=false/,
      );
    },
  );

  it('PGBOOT-011: migrates without a copy when the operator turned it off, and says so', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    await expect(postgresSafetyNet(envWith(false, false)).beforeMigrate('1')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('without a copy'));
  });

  it('PGBOOT-012: stays out of the way under test unless a suite asks for it, and has no restore hint', async () => {
    const net = postgresSafetyNet(envWith(undefined, true));
    await expect(net.beforeMigrate('1')).resolves.toBeUndefined();
    await expect(net.restoreHint('1')).resolves.toBeNull();
  });
});
