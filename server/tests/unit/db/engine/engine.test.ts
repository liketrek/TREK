import { deriveDb } from '../../../../src/app-config/derive';
import { buildOrmConfig, resolveEngine } from '../../../../src/db/engine';
import { TrekPostgreSqlDriver } from '../../../../src/db/engine/postgres/postgres-driver';
import { sslOptionFor } from '../../../../src/db/engine/postgres/ssl';
import { redactUrl } from '../../../../src/db/engine/redact-url';
import type { AnyOrm } from '../../../../src/db/orm';
import { SharedSqliteDriver } from '../../../../src/db/orm-driver';
import type { EntityManager } from '@mikro-orm/core';

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const PG_URL = 'postgresql://trek:s3cret@db.example:5432/trek';

describe('resolveEngine', () => {
  it('ENGINE-001: SQLite when no TREK_DB_URL is set, which is the test environment', () => {
    const engine = resolveEngine();
    expect(engine.id).toBe('sqlite');
    expect(engine.ormOptions()).toEqual({ driver: SharedSqliteDriver, dbName: ':memory:' });
    expect(engine.describe()).toBe('SQLite file :memory:');
  });

  it('ENGINE-002: Postgres when TREK_DB_URL names a database, with the pool size and no SSL by default', () => {
    const engine = resolveEngine(deriveDb({ TREK_DB_URL: PG_URL, TREK_DB_POOL_MAX: '7' }));
    expect(engine.id).toBe('postgres');
    expect(engine.ormOptions()).toEqual({
      driver: TrekPostgreSqlDriver,
      clientUrl: PG_URL,
      pool: { min: 0, max: 7 },
      driverOptions: {},
    });
  });

  it('ENGINE-003: describes a Postgres database without its password', () => {
    const engine = resolveEngine(deriveDb({ TREK_DB_URL: `${PG_URL}?sslmode=require&password=other` }));
    expect(engine.describe()).toBe('Postgres postgresql://trek:***@db.example:5432/trek');
    expect(engine.describe()).not.toContain('s3cret');
    expect(engine.describe()).not.toContain('other');
  });
});

describe('sslOptionFor', () => {
  it('ENGINE-010: maps sslmode onto the pg pool option (MikroORM drops the URL query), always verifying the certificate', () => {
    // As the pg driver itself reads them: require and verify-ca are verify-full.
    expect(sslOptionFor(PG_URL)).toBeUndefined();
    expect(sslOptionFor(`${PG_URL}?sslmode=disable`)).toBe(false);
    for (const mode of ['require', 'verify-ca', 'verify-full']) {
      expect(sslOptionFor(`${PG_URL}?sslmode=${mode}`), mode).toEqual({ rejectUnauthorized: true });
    }
  });

  it('ENGINE-011: refuses an sslmode it does not know or that would skip verification', () => {
    expect(() => sslOptionFor(`${PG_URL}?sslmode=requrie`)).toThrow(/sslmode "requrie"/);
    expect(() => sslOptionFor(`${PG_URL}?sslmode=no-verify`)).toThrow(/sslmode "no-verify"/);
    expect(() => sslOptionFor(`${PG_URL}?sslmode=prefer`)).toThrow(/sslmode "prefer"/);
  });

  it('ENGINE-012: passes the SSL option to the pool when the URL asks for one', () => {
    const engine = resolveEngine(deriveDb({ TREK_DB_URL: `${PG_URL}?sslmode=require` }));
    expect(engine.ormOptions().driverOptions).toEqual({ ssl: { rejectUnauthorized: true } });
  });

  it('ENGINE-013: trusts the CA in sslrootcert (a managed host that signs its own certificates), and refuses a missing file', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'trek-ca-'));
    try {
      const ca = path.join(dir, 'root.crt');
      writeFileSync(ca, '-----BEGIN CERTIFICATE-----\nprobe\n-----END CERTIFICATE-----\n');
      expect(sslOptionFor(`${PG_URL}?sslmode=verify-full&sslrootcert=${encodeURIComponent(ca)}`)).toEqual({
        rejectUnauthorized: true,
        ca: readFileSync(ca, 'utf8'),
      });
      expect(() =>
        sslOptionFor(`${PG_URL}?sslmode=require&sslrootcert=${encodeURIComponent(path.join(dir, 'no.crt'))}`),
      ).toThrow(/sslrootcert/);
      expect(() => sslOptionFor(`${PG_URL}?sslrootcert=${encodeURIComponent(ca)}`)).toThrow(
        /sslrootcert without sslmode/,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('redactUrl', () => {
  it('ENGINE-020: hides the password and drops the query, which can carry one too', () => {
    expect(redactUrl('postgres://u:p@h/d?password=x&sslmode=require')).toBe('postgres://u:***@h/d');
    expect(redactUrl('postgres://u@h:5433/d')).toBe('postgres://u@h:5433/d');
    expect(redactUrl('not a url')).toBe('<unparseable URL>');
  });
});

describe('buildOrmConfig', () => {
  it('ENGINE-030: the SQLite config carries the entities, migrations and seeders with the engine options', () => {
    const config = buildOrmConfig(resolveEngine());
    expect(config.driver).toBe(SharedSqliteDriver);
    expect(config.dbName).toBe(':memory:');
    expect(config.migrations).toMatchObject({ pathTs: 'src/db/migrations', snapshot: false });
    expect(config.seeder).toMatchObject({ defaultSeeder: 'DatabaseSeeder' });
    expect(Array.isArray(config.entities) && config.entities.length).toBeGreaterThan(100);
  });

  it('ENGINE-031: the Postgres config carries the same entities and migrations, on the pg driver', () => {
    const config = buildOrmConfig(resolveEngine(deriveDb({ TREK_DB_URL: PG_URL })));
    expect(config.driver).toBe(TrekPostgreSqlDriver);
    expect(config.clientUrl).toBe(PG_URL);
    expect(config.migrations).toMatchObject({ pathTs: 'src/db/migrations', snapshot: false });
    expect(config.entities).toBe(buildOrmConfig(resolveEngine()).entities);
  });

  it('ENGINE-032: a Postgres engine opens and closes nothing of its own; a reopen (after pg_restore) rebinds and migrates', async () => {
    const engine = resolveEngine(deriveDb({ TREK_DB_URL: PG_URL }));
    await expect(engine.reopen()).rejects.toThrow(/reopened before it was opened/);
    const onReopened = vi.fn(async () => undefined);
    const orm = {} as unknown as AnyOrm;
    expect(() => engine.open(orm, onReopened)).not.toThrow();
    expect(() => engine.close()).not.toThrow();
    await engine.reopen();
    expect(onReopened).toHaveBeenCalledTimes(1);
  });

  it('ENGINE-033: Postgres serializes write transactions with one advisory lock taken in the transaction, SQLite needs none', async () => {
    const execute = vi.fn(async () => []);
    const trx = { trx: true };
    const em = { getConnection: () => ({ execute }), getTransactionContext: () => trx } as unknown as EntityManager;
    await resolveEngine(deriveDb({ TREK_DB_URL: PG_URL })).serializeWrites(em);
    expect(execute).toHaveBeenCalledWith('select pg_advisory_xact_lock(?)', [0x5452454b], 'run', trx);
    execute.mockClear();
    await resolveEngine().serializeWrites(em);
    expect(execute).not.toHaveBeenCalled();
  });
});
