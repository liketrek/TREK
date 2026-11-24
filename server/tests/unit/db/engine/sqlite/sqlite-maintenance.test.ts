import { SqliteMaintenance } from '../../../../../src/db/engine/sqlite/sqlite-maintenance';
import { createSnapshotTestDb } from '../../../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../../../helpers/test-orm';

import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let maintenance: SqliteMaintenance;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  maintenance = new SqliteMaintenance(t.em);
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

/**
 * The first SQL text handed to the connection after the spy is set (the ORM
 * may read its own metadata on the same connection afterwards).
 */
function spyOnExecute(): { first: () => string; restore: () => void } {
  const connection = t.em.getConnection();
  const spy = vi.spyOn(connection, 'execute');
  return {
    first: () => String(spy.mock.calls[0]?.[0]),
    restore: () => spy.mockRestore(),
  };
}

/** Whether the SQLite file at `file` holds a table named `table`. */
function holdsTable(file: string, table: string): boolean {
  const snap = new Database(file, { readonly: true });
  try {
    return (snap.pragma(`table_info(${table})`) as unknown[]).length > 0;
  } finally {
    snap.close();
  }
}

describe('SqliteMaintenance', () => {
  it('SQLMAINT-001: walCheckpoint sends PRAGMA wal_checkpoint(TRUNCATE)', async () => {
    const execute = spyOnExecute();
    try {
      await expect(maintenance.walCheckpoint()).resolves.toBeUndefined();
      expect(execute.first()).toBe('PRAGMA wal_checkpoint(TRUNCATE)');
    } finally {
      execute.restore();
    }
  });

  describe('vacuumInto', () => {
    let scratchDir: string;

    afterEach(() => {
      if (scratchDir) fs.rmSync(scratchDir, { recursive: true, force: true });
    });

    it("SQLMAINT-002: sends `VACUUM INTO '<path>'` and leaves a readable copy at the path", async () => {
      scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sqlite-maint-'));
      const target = path.join(scratchDir, 'snap.db');
      const execute = spyOnExecute();
      try {
        await maintenance.vacuumInto(target);
        expect(execute.first()).toBe(`VACUUM INTO '${target}'`);
      } finally {
        execute.restore();
      }
      expect(holdsTable(target, 'users')).toBe(true);
    });

    it('SQLMAINT-003: doubles single quotes in the path', async () => {
      scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "sqlite-maint-o'brien-"));
      const target = path.join(scratchDir, 'snap.db');
      const execute = spyOnExecute();
      try {
        await maintenance.vacuumInto(target);
        expect(execute.first()).toBe(`VACUUM INTO '${target.replaceAll("'", "''")}'`);
      } finally {
        execute.restore();
      }
      expect(holdsTable(target, 'users')).toBe(true);
    });
  });

  it('SQLMAINT-004: both methods throw outside a request context (fail closed, as TrekRepository)', async () => {
    const { MikroORM } = await import('@mikro-orm/core');
    const fresh = await MikroORM.init({
      entities: [],
      driver: (await import('../../../../../src/db/orm-driver')).createBoundSqliteDriver(() => testDb),
      dbName: ':memory:',
      allowGlobalContext: false,
      discovery: { warnWhenNoEntities: false },
    });
    try {
      const unwrapped = new SqliteMaintenance(fresh.em);
      await expect(unwrapped.walCheckpoint()).rejects.toThrow();
      await expect(unwrapped.vacuumInto(path.join(os.tmpdir(), 'never.db'))).rejects.toThrow();
    } finally {
      await fresh.close(false);
    }
  });
});
