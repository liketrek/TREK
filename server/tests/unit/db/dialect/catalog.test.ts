/**
 * The schema catalog per engine (src/db/dialect/catalog.ts) and the migration
 * helpers built on it (src/db/migration-utils.ts), so a migration after the
 * Postgres baseline's cut can ask what exists on either engine.
 */
import { columnNamesSql, tableExistsSql } from '../../../../src/db/dialect/catalog';
import {
  addColumnIfMissing,
  columnNames,
  execUnlessTableMissing,
  tableExists,
} from '../../../../src/db/migration-utils';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { Platform, TableNotFoundException } from '@mikro-orm/core';
import type { Migration } from '@mikro-orm/migrations';
import { BasePostgreSqlPlatform, SqlitePlatform } from '@mikro-orm/sql';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const sqlite = new SqlitePlatform();
const postgres = new BasePostgreSqlPlatform();

describe('catalog statements', () => {
  it('CATALOG-001: SQLite reads its own catalog, Postgres the information schema of the current schema', () => {
    expect(columnNamesSql(sqlite)).toBe('select name from pragma_table_info(?)');
    expect(tableExistsSql(sqlite)).toBe("select name from sqlite_master where type = 'table' and name = ?");
    expect(columnNamesSql(postgres)).toBe(
      'select column_name as name from information_schema.columns where table_schema = current_schema() and table_name = ?',
    );
    expect(tableExistsSql(postgres)).toBe(
      'select table_name as name from information_schema.tables where table_schema = current_schema() and table_name = ?',
    );
  });

  it('CATALOG-002: any other engine is refused', () => {
    class OtherPlatform extends Platform {}
    expect(() => columnNamesSql(new OtherPlatform())).toThrow();
    expect(() => tableExistsSql(new OtherPlatform())).toThrow();
  });
});

describe('migration helpers', () => {
  const testDb = createSnapshotTestDb();
  let t: TestOrm;
  let migration: Migration;
  const execute = vi.fn();

  beforeAll(async () => {
    t = await createTestOrm(testDb);
    execute.mockImplementation((sql: string, params?: unknown[]) => t.em.getConnection().execute(sql, params));
    migration = { execute, getEntityManager: () => t.em } as unknown as Migration;
  });
  afterAll(async () => {
    await t.close();
    testDb.close();
  });

  it('CATALOG-010: tableExists and columnNames answer from the live SQLite schema', async () => {
    expect(await tableExists(migration, 'users')).toBe(true);
    expect(await tableExists(migration, 'no_such_table')).toBe(false);
    expect((await columnNames(migration, 'users')).has('email')).toBe(true);
    expect((await columnNames(migration, 'no_such_table')).size).toBe(0);
  });

  it('CATALOG-011: addColumnIfMissing adds once, quoting the table the way the engine does', async () => {
    execute.mockClear();
    await addColumnIfMissing(migration, 'users', 'catalog_probe', 'catalog_probe TEXT');
    await addColumnIfMissing(migration, 'users', 'catalog_probe', 'catalog_probe TEXT');
    const alters = execute.mock.calls.map(([sql]) => String(sql)).filter((sql) => sql.startsWith('alter table'));
    expect(alters).toEqual(['alter table `users` add column catalog_probe TEXT']);
    expect((await columnNames(migration, 'users')).has('catalog_probe')).toBe(true);
    expect(postgres.quoteIdentifier('users')).toBe('"users"');
  });

  it('CATALOG-012: execUnlessTableMissing tolerates a missing table on either engine, and nothing else', async () => {
    const failing = (error: Error) => ({ execute: vi.fn(async () => Promise.reject(error)) }) as unknown as Migration;
    await expect(execUnlessTableMissing(failing(new Error('no such table: x')), 'x')).resolves.toBeUndefined();
    const pgMissing = new TableNotFoundException(
      Object.assign(new Error('relation "x" does not exist'), { code: '42P01' }),
    );
    await expect(execUnlessTableMissing(failing(pgMissing), 'x')).resolves.toBeUndefined();
    await expect(execUnlessTableMissing(failing(new Error('syntax error')), 'x')).rejects.toThrow('syntax error');
  });
});
