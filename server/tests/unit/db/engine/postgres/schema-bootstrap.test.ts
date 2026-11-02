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

import { chmodSync, mkdtempSync, readdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  const URL = 'postgresql://trek:pw@db/trek';
  const NOW = new Date('2026-11-02T13:05:09Z');
  let dir: string;
  let bin: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'trek-pg-net-'));
    bin = mkdtempSync(path.join(tmpdir(), 'trek-pg-net-bin-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    rmSync(bin, { recursive: true, force: true });
  });

  /** A stand-in pg_dump that writes its --file, or fails like one that cannot connect. */
  const fakePgDump = (ok: boolean) => {
    const body = ok
      ? 'for a in "$@"; do case "$a" in --file=*) printf dump > "${a#--file=}";; esac; done'
      : 'echo "could not connect" >&2; exit 1';
    writeFileSync(path.join(bin, 'pg_dump'), `#!/bin/sh\n${body}\n`);
    chmodSync(path.join(bin, 'pg_dump'), 0o755);
  };
  const envWith =
    (preMigrateSnapshot: boolean | undefined, isTest: boolean, keep = 3) =>
    () =>
      ({
        db: { preMigrateSnapshot, preMigrateSnapshotKeep: keep, pgBinDir: bin },
        app: { isTest },
      }) as unknown as AppEnv;
  const net = (env: () => AppEnv) =>
    postgresSafetyNet(
      URL,
      env,
      () => NOW,
      () => dir,
    );

  it.each([undefined, true])(
    'PGBOOT-010: dumps the database before migrating it (setting %s), keeping the newest copies and no half-written one',
    async (setting) => {
      vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
      fakePgDump(true);
      for (const old of ['20200101000001', '20200101000002']) {
        writeFileSync(path.join(dir, `pre-migrate-${old}-20250101T000000Z.pgdump`), 'old');
        utimesSync(path.join(dir, `pre-migrate-${old}-20250101T000000Z.pgdump`), 1, 1);
      }
      writeFileSync(path.join(dir, 'pre-migrate-20200101000003-20250101T000000Z.pgdump.partial'), 'killed');
      await net(envWith(setting, false, 2)).beforeMigrate('20200101000100');
      const kept = readdirSync(dir).sort();
      expect(kept).toHaveLength(2);
      expect(kept).toContain('pre-migrate-20200101000100-20261102T130509Z.pgdump');
      expect(kept.some((file) => file.endsWith('.partial'))).toBe(false);
    },
  );

  it('PGBOOT-011: migrates without a copy when the operator turned it off, and says so', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    await expect(net(envWith(false, false)).beforeMigrate('1')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('without a copy'));
    expect(readdirSync(dir)).toEqual([]);
  });

  it('PGBOOT-012: stays out of the way under test unless a suite asks for it', async () => {
    await expect(net(envWith(undefined, true)).beforeMigrate('1')).resolves.toBeUndefined();
    expect(readdirSync(dir)).toEqual([]);
  });

  it('PGBOOT-013: a copy that cannot be written refuses the boot, names the switch, and leaves no partial file', async () => {
    fakePgDump(false);
    await expect(net(envWith(true, false)).beforeMigrate('1')).rejects.toThrow(
      /Refusing to boot: could not write a copy.*pg_dump failed: could not connect.*TREK_DB_PRE_MIGRATE_SNAPSHOT=false/s,
    );
    expect(readdirSync(dir)).toEqual([]);
  });

  it('PGBOOT-014: the newer-database refusal points at the copy taken from this release, or at the others', async () => {
    const hint = net(envWith(true, false));
    await expect(hint.restoreHint('20200101000100')).resolves.toBeNull();
    writeFileSync(path.join(dir, 'pre-migrate-20200101000050-20250101T000000Z.pgdump'), 'old');
    await expect(hint.restoreHint('20200101000100')).resolves.toMatch(/none of them from this release/);
    writeFileSync(path.join(dir, 'pre-migrate-20200101000100-20250102T000000Z.pgdump'), 'mine');
    await expect(hint.restoreHint('20200101000100')).resolves.toMatch(
      /pre-migrate-20200101000100-20250102T000000Z\.pgdump: stop TREK, empty the database .*pg_restore --no-owner/,
    );
  });
});
