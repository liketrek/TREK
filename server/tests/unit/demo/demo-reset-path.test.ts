/**
 * demo-reset's database file.
 *
 * demo-reset closes the live connection, puts the baseline in place of the
 * database file and reopens. It used to compute that file itself as
 * data/travel.db, which is wrong the moment TREK_DB_FILE moves the database
 * elsewhere: the baseline lands on an unrelated file and the real database is
 * never reset. Both directions go through the database backup port now, the
 * same one an admin restore uses, and the port takes the file from
 * `DatabaseLifecycle.file`, the path the connection runs on. So what these
 * cases assert is which file each step names.
 *
 * The port is the real `SqliteDatabaseBackup` over a lifecycle stand-in (the
 * file, close, reopen) and a MaintenanceRepository stand-in (checkpoint,
 * VACUUM INTO). The file system is spied rather than written to, because the
 * baseline path is fixed at data/travel-baseline.db and a developer running a
 * demo instance has a real one sitting there.
 *
 * `resetDemoUser` still reads the admin credentials and instance keys through
 * `DemoRepository` before the swap, so every call runs inside
 * `withRequestContext` over a real (empty) test database: the reads find
 * nothing and the restore-writes are skipped.
 */
import type { MaintenanceRepository } from '../../../src/db/repositories/MaintenanceRepository';
import { resetDemoUser, saveBaseline } from '../../../src/demo/demo-reset';
import { SqliteDatabaseBackup } from '../../../src/nest/backup/sqlite-database-backup';
import { DatabaseConnectionLostError } from '../../../src/nest/database/database-backup.interface';
import type { DatabaseLifecycle } from '../../../src/nest/database/database-lifecycle.service';
import { withRequestContext } from '../../../src/nest/database/request-context';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestOrm } from '../../helpers/test-orm';

import type Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const LIVE_DB = path.join(path.sep, 'srv', 'trek', 'custom-name.db');
const BASELINE = path.resolve(__dirname, '..', '..', '..', 'data', 'travel-baseline.db');

describe('demo-reset DB path', () => {
  let copyFileSync: ReturnType<typeof vi.spyOn>;
  let renameSync: ReturnType<typeof vi.spyOn>;
  let ormDb: Database.Database;
  let lifecycle: { file: string; close: ReturnType<typeof vi.fn>; reopen: ReturnType<typeof vi.fn> };
  let maintenance: { walCheckpoint: ReturnType<typeof vi.fn>; vacuumInto: ReturnType<typeof vi.fn> };
  let database: SqliteDatabaseBackup;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    // Built before the existsSync spy below is installed: createSnapshotTestDb()
    // reads the schema snapshot through schema-snapshot.ts's own fs.existsSync
    // (locating the migrations dir to key the snapshot file), which the spy
    // would otherwise answer `false` for every path except the two below.
    ormDb = createSnapshotTestDb();
    copyFileSync = vi.spyOn(fs, 'copyFileSync').mockImplementation(() => undefined);
    renameSync = vi.spyOn(fs, 'renameSync').mockImplementation(() => undefined);
    vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
    vi.spyOn(fs, 'rmSync').mockImplementation(() => undefined);
    vi.spyOn(fs, 'existsSync').mockImplementation(
      ((p: fs.PathLike) => String(p) === BASELINE || String(p) === LIVE_DB) as typeof fs.existsSync,
    );
    lifecycle = { file: LIVE_DB, close: vi.fn(), reopen: vi.fn(async () => {}) };
    maintenance = { walCheckpoint: vi.fn(async () => {}), vacuumInto: vi.fn(async () => {}) };
    database = new SqliteDatabaseBackup(
      lifecycle as unknown as DatabaseLifecycle,
      maintenance as unknown as MaintenanceRepository,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    ormDb.close();
  });

  async function withCtx<T>(fn: () => Promise<T>): Promise<T> {
    const orm = await createTestOrm(ormDb);
    return await withRequestContext(orm.orm, fn);
  }

  it('DEMORESET-001: saves the baseline as a snapshot of the file the connection has open, renamed into place', async () => {
    await withCtx(() => saveBaseline(database));
    // Written beside the baseline first, so a failed save cannot leave half a
    // baseline where the previous good one was.
    expect(maintenance.vacuumInto).toHaveBeenCalledWith(BASELINE + '.tmp');
    expect(renameSync).toHaveBeenCalledWith(BASELINE + '.tmp', BASELINE);
  });

  it('DEMORESET-002: restores the baseline onto that same file, not data/travel.db', async () => {
    const order: string[] = [];
    lifecycle.close.mockImplementation(() => order.push('close'));
    copyFileSync.mockImplementation(() => {
      order.push('copy');
    });
    lifecycle.reopen.mockImplementation(async () => {
      order.push('reopen');
    });

    await withCtx(() => resetDemoUser(database));

    expect(copyFileSync).toHaveBeenCalledWith(BASELINE, LIVE_DB + '.restore-tmp');
    expect(renameSync).toHaveBeenCalledWith(LIVE_DB + '.restore-tmp', LIVE_DB);
    // Closed before the copy and reopened after it — copying over an open
    // SQLite file is how a database ends up half of each.
    expect(order).toEqual(['close', 'copy', 'reopen']);
    expect(maintenance.walCheckpoint).toHaveBeenCalled();
  });

  it('DEMORESET-003: an in-memory database is left alone rather than copied around', async () => {
    lifecycle.file = ':memory:';
    await withCtx(() => saveBaseline(database));
    await withCtx(() => resetDemoUser(database));
    expect(copyFileSync).not.toHaveBeenCalled();
    expect(maintenance.vacuumInto).not.toHaveBeenCalled();
    expect(lifecycle.close).not.toHaveBeenCalled();
  });

  it('DEMORESET-004: a baseline save that fails keeps the previous baseline', async () => {
    maintenance.vacuumInto.mockRejectedValueOnce(new Error('database or disk is full'));

    await expect(withCtx(() => saveBaseline(database))).rejects.toThrow('database or disk is full');

    expect(renameSync).not.toHaveBeenCalled();
  });

  it('DEMORESET-005: a swap that fails is logged, and the connection is reopened anyway', async () => {
    copyFileSync.mockImplementation(() => {
      throw new Error('EACCES');
    });

    await expect(withCtx(() => resetDemoUser(database))).resolves.toBeUndefined();

    expect(lifecycle.reopen).toHaveBeenCalled();
    expect(renameSync).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('[Demo Reset] Failed to restore baseline:', 'EACCES');
  });

  it('DEMORESET-006: a reopen that fails after the swap is not swallowed', async () => {
    lifecycle.reopen.mockRejectedValueOnce(new Error('database is locked'));

    await expect(withCtx(() => resetDemoUser(database))).rejects.toThrow('database is locked');
  });

  it('DEMORESET-007: a swap that fails with a reopen that fails too is not swallowed either', async () => {
    copyFileSync.mockImplementation(() => {
      throw new Error('EACCES');
    });
    lifecycle.reopen.mockRejectedValueOnce(new Error('database is locked'));

    // The instance has no connection now: the tick has to log that, so the
    // reset does not end as a plain "failed to restore" line.
    await expect(withCtx(() => resetDemoUser(database))).rejects.toBeInstanceOf(DatabaseConnectionLostError);

    expect(console.error).not.toHaveBeenCalledWith('[Demo Reset] Failed to restore baseline:', expect.anything());
    expect(renameSync).not.toHaveBeenCalled();
  });
});
