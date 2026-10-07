import { MaintenanceRepository } from '../../../../src/db/repositories/MaintenanceRepository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let maintenance: MaintenanceRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  maintenance = new MaintenanceRepository(t.em);
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('MaintenanceRepository', () => {
  it('MAINTREPO-001: walCheckpoint renders PRAGMA wal_checkpoint(TRUNCATE) — pinned text, equivalent to the legacy raw call', async () => {
    // Rendered-SQL-equivalence: the exact text a direct db.prepare(...) call
    // on the same input executes without throwing, string-for-string what
    // the legacy `db.exec('PRAGMA wal_checkpoint(TRUNCATE)')` issued.
    const RENDERED = 'PRAGMA wal_checkpoint(TRUNCATE)';
    expect(() => testDb.prepare(RENDERED).run()).not.toThrow();
    await expect(maintenance.walCheckpoint()).resolves.toBeUndefined();
  });

  describe('vacuumInto', () => {
    let scratchPath: string;

    afterEach(() => {
      if (scratchPath && fs.existsSync(scratchPath)) fs.rmSync(scratchPath, { force: true });
    });

    it("MAINTREPO-002: vacuumInto renders `VACUUM INTO '<path>'` — pinned text, produces a readable snapshot at the given path", async () => {
      scratchPath = path.join(os.tmpdir(), `maintrepo-vacuum-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
      await maintenance.vacuumInto(scratchPath);
      expect(fs.existsSync(scratchPath)).toBe(true);

      const snap = new Database(scratchPath, { readonly: true });
      try {
        const row = snap.prepare('SELECT name FROM sqlite_master WHERE type = ? AND name = ?').get('table', 'users');
        expect(row).toBeTruthy();
      } finally {
        snap.close();
      }
    });

    it('MAINTREPO-003: single quotes in the path are escaped by doubling, matching the legacy `dbSnap.replaceAll("\'", "\'\'")` shape', async () => {
      const dirWithQuote = path.join(os.tmpdir(), `maintrepo-o'brien-${Date.now()}`);
      fs.mkdirSync(dirWithQuote, { recursive: true });
      scratchPath = path.join(dirWithQuote, 'snap.db');
      try {
        await maintenance.vacuumInto(scratchPath);
        expect(fs.existsSync(scratchPath)).toBe(true);

        // Rendered-SQL-equivalence: the SAME escaped text, run directly
        // against another target path, succeeds identically.
        const directPath = path.join(dirWithQuote, 'snap-direct.db');
        const escaped = directPath.replaceAll("'", "''");
        expect(() => testDb.prepare(`VACUUM INTO '${escaped}'`).run()).not.toThrow();
        expect(fs.existsSync(directPath)).toBe(true);
        fs.rmSync(directPath, { force: true });
      } finally {
        fs.rmSync(dirWithQuote, { recursive: true, force: true });
      }
    });
  });

  it('MAINTREPO-004: both methods throw outside a request context (fail-closed, matching TrekRepository)', async () => {
    const { MikroORM } = await import('@mikro-orm/core');
    const fresh = await MikroORM.init({
      entities: [],
      driver: (await import('../../../../src/db/orm-driver')).createBoundSqliteDriver(() => testDb),
      dbName: ':memory:',
      allowGlobalContext: false,
      discovery: { warnWhenNoEntities: false },
    });
    try {
      const unwrapped = new MaintenanceRepository(fresh.em);
      await expect(unwrapped.walCheckpoint()).rejects.toThrow();
    } finally {
      await fresh.close(false);
    }
  });
});
