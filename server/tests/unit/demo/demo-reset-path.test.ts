/**
 * demo-reset's DB path.
 *
 * demo-reset closes the live connection, copies the baseline over the database
 * file and reopens. It used to compute that file itself as data/travel.db, which
 * is wrong the moment TREK_DB_FILE moves the database elsewhere: the baseline
 * lands on an unrelated file and the real database is never reset. The path has
 * to come from the connection that database.ts actually opened, so what these
 * cases assert is which file each copy names.
 *
 * demo-reset reads that path off `getRawConnection()` (a static import of
 * ../db/database since the Plan 4 review's m1 — it used to runtime-require the
 * `db` Proxy), so the module is mocked below with a handle stub that only has a
 * `name`. The file system is spied rather than written to, because the
 * baseline path is fixed at data/travel-baseline.db and a developer running a
 * demo instance has a real one sitting there.
 *
 * Plan 3i Task 3: `resetDemoUser`/`saveBaseline` now read/write through
 * `DemoRepository`/`MaintenanceRepository`, which resolve an `EntityManager`
 * via `RequestContext.getEntityManager()` — independent of the
 * `getRawConnection`/`closeDb`/`reinitialize` stub below (that stub covers only the
 * connection-lifecycle calls this file still makes). Every call here runs
 * inside `withRequestContext(orm.orm, ...)`, bound to a REAL (empty) test
 * database, so the credential/instance-key reads resolve to nothing found
 * (no admin/app_settings row seeded) and the restore-writes are skipped —
 * this file's own assertions are about the FILE path, not the row data,
 * which DEMORESET-CRED below covers separately.
 */
import { resetDemoUser, saveBaseline } from '../../../src/demo/demo-reset';
import { withRequestContext } from '../../../src/nest/database/request-context';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestOrm } from '../../helpers/test-orm';

import type Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const LIVE_DB = path.join(path.sep, 'srv', 'trek', 'custom-name.db');

const { handleStub, databaseModule } = vi.hoisted(() => {
  const handleStub = { name: '' };
  return {
    handleStub,
    databaseModule: { getRawConnection: () => handleStub, closeDb: vi.fn(), reinitialize: vi.fn(async () => {}) },
  };
});
vi.mock('../../../src/db/database', () => databaseModule);

const BASELINE = path.resolve(__dirname, '..', '..', '..', 'data', 'travel-baseline.db');

describe('demo-reset DB path', () => {
  let copyFileSync: ReturnType<typeof vi.spyOn>;
  let ormDb: Database.Database;

  beforeEach(async () => {
    handleStub.name = LIVE_DB;
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    // Built before the existsSync spy below is installed: createSnapshotTestDb()
    // reads the schema snapshot through schema-snapshot.ts's own fs.existsSync
    // (locating the migrations dir to key the snapshot file), which the spy
    // would otherwise answer `false` for every path except BASELINE.
    ormDb = createSnapshotTestDb();
    copyFileSync = vi.spyOn(fs, 'copyFileSync').mockImplementation(() => undefined);
    vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
    vi.spyOn(fs, 'existsSync').mockImplementation(((p: fs.PathLike) => String(p) === BASELINE) as typeof fs.existsSync);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    ormDb.close();
  });

  async function withCtx<T>(fn: () => Promise<T>): Promise<T> {
    const orm = await createTestOrm(ormDb);
    return await withRequestContext(orm.orm, fn);
  }

  it('DEMORESET-001: saves the baseline from the file the connection has open', async () => {
    await withCtx(() => saveBaseline());
    expect(copyFileSync).toHaveBeenCalledWith(LIVE_DB, BASELINE);
  });

  it('DEMORESET-002: restores the baseline onto that same file, not data/travel.db', async () => {
    await withCtx(() => resetDemoUser());
    expect(copyFileSync).toHaveBeenCalledWith(BASELINE, LIVE_DB);
    // Closed before the copy and reopened after it — copying over an open
    // SQLite file is how a database ends up half of each.
    expect(databaseModule.closeDb).toHaveBeenCalled();
    expect(databaseModule.reinitialize).toHaveBeenCalled();
  });

  it('DEMORESET-003: an in-memory database is left alone rather than copied around', async () => {
    handleStub.name = ':memory:';
    await withCtx(() => saveBaseline());
    await withCtx(() => resetDemoUser());
    expect(copyFileSync).not.toHaveBeenCalled();
  });
});
