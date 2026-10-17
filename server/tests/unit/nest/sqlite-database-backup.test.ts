/**
 * SqliteDatabaseBackup: the database backup port for a SQLite file.
 *
 * The snapshot and the swap run for real here, against a database file in a
 * temp directory: a VACUUM INTO through the real MaintenanceRepository, and the
 * copy, sidecar removal and rename of a restore. Only the connection lifecycle
 * is a stand-in, because closing and reopening the process's own connection is
 * DatabaseLifecycle's business (tests/unit/nest/database/).
 */
import { MaintenanceRepository } from '../../../src/db/repositories/MaintenanceRepository';
import { SqliteDatabaseBackup } from '../../../src/nest/backup/sqlite-database-backup';
import { DatabaseConnectionLostError } from '../../../src/nest/database/database-backup.interface';
import type { DatabaseLifecycle } from '../../../src/nest/database/database-lifecycle.service';
import { withRequestContext } from '../../../src/nest/database/request-context';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
  logDebug: vi.fn(),
}));
vi.mock('../../../src/nest/audit/audit-log.logger', () => logMock);

let dir: string;
let liveFile: string;
let lifecycle: { file: string; close: ReturnType<typeof vi.fn>; reopen: ReturnType<typeof vi.fn> };

function maintenanceStub() {
  return { walCheckpoint: vi.fn(async () => {}), vacuumInto: vi.fn(async (_target: string) => {}) };
}

function portWith(maintenance: { walCheckpoint: unknown; vacuumInto: unknown }): SqliteDatabaseBackup {
  return new SqliteDatabaseBackup(
    lifecycle as unknown as DatabaseLifecycle,
    maintenance as unknown as MaintenanceRepository,
  );
}

function writeDb(file: string, label: string): void {
  const db = new Database(file);
  db.exec('CREATE TABLE marker (label TEXT NOT NULL)');
  // test-sql-allow: the marker table is a bare fixture file no entity maps, and no ORM is bound to this handle.
  db.prepare('INSERT INTO marker (label) VALUES (?)').run(label);
  db.close();
}

function readLabel(file: string): string {
  const db = new Database(file, { readonly: true });
  try {
    // test-sql-allow: reads the copied file on a read-only handle no ORM is bound to, from a table no entity maps.
    return (db.prepare('SELECT label FROM marker').get() as { label: string }).label;
  } finally {
    db.close();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-sqlite-backup-'));
  liveFile = path.join(dir, 'live.db');
  lifecycle = { file: liveFile, close: vi.fn(), reopen: vi.fn(async () => {}) };
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('SqliteDatabaseBackup', () => {
  it('SQLBK-001: names the archive entry travel.db and reports the file the connection runs on', () => {
    const port = portWith(maintenanceStub());
    expect(port.archiveEntry).toBe('travel.db');
    expect(port.location()).toBe(liveFile);
  });

  it('SQLBK-002: can snapshot an existing file, never the in-memory database or a missing file', () => {
    const port = portWith(maintenanceStub());
    expect(port.canSnapshot()).toBe(false);
    writeDb(liveFile, 'live');
    expect(port.canSnapshot()).toBe(true);
    lifecycle.file = ':memory:';
    expect(port.canSnapshot()).toBe(false);
  });

  it('SQLBK-003: the checkpoint is the WAL checkpoint', async () => {
    const maintenance = maintenanceStub();
    await portWith(maintenance).checkpoint();
    expect(maintenance.walCheckpoint).toHaveBeenCalledTimes(1);
  });

  describe('snapshot, through the real VACUUM INTO', () => {
    let live: Database.Database;
    let orm: TestOrm;

    beforeEach(async () => {
      writeDb(liveFile, 'live');
      live = new Database(liveFile);
      live.exec('PRAGMA journal_mode = WAL');
      orm = await createTestOrm(live);
    });

    afterEach(async () => {
      await orm.close();
      live.close();
    });

    it('SQLBK-004: writes a consistent copy of the live database', async () => {
      // A write that sits in the WAL only: VACUUM INTO still carries it.
      // test-sql-allow: the marker table is a bare fixture no entity maps; the write has to land in the WAL of this file.
      live.prepare('UPDATE marker SET label = ?').run('after');
      const target = path.join(dir, 'copy.db');
      const port = portWith(new MaintenanceRepository(orm.em));

      await withRequestContext(orm.orm, () => port.snapshot(target));

      expect(readLabel(target)).toBe('after');
    });

    it('SQLBK-005: a VACUUM INTO that fails rejects and leaves nothing at the target', async () => {
      const target = path.join(dir, 'missing-dir', 'copy.db');
      const port = portWith(new MaintenanceRepository(orm.em));

      await expect(withRequestContext(orm.orm, () => port.snapshot(target))).rejects.toThrow();

      expect(fs.existsSync(target)).toBe(false);
    });
  });

  it('SQLBK-006: a partial file a failed snapshot left behind is removed before the error goes on', async () => {
    const target = path.join(dir, 'partial.db');
    const maintenance = maintenanceStub();
    maintenance.vacuumInto.mockImplementationOnce(async (to: string) => {
      fs.writeFileSync(to, 'half a database');
      throw new Error('database or disk is full');
    });

    await expect(portWith(maintenance).snapshot(target)).rejects.toThrow('database or disk is full');

    expect(fs.existsSync(target)).toBe(false);
  });

  it('SQLBK-007: verify refuses an unpacked archive without a database', () => {
    expect(portWith(maintenanceStub()).verify(dir)).toEqual({
      error: 'Invalid backup: travel.db not found',
      status: 400,
    });
  });

  it('SQLBK-008: keeps a copy of the database a restore replaces next to it, and says where', async () => {
    const maintenance = maintenanceStub();

    const kept = await portWith(maintenance).keepCopyBeforeRestore();

    expect(kept).not.toBeNull();
    expect(path.dirname(kept as string)).toBe(dir);
    expect(path.basename(kept as string)).toMatch(/^pre-restore-\d+\.db$/);
    expect(maintenance.vacuumInto).toHaveBeenCalledWith(kept);
    expect(logMock.logInfo).toHaveBeenCalledWith(`Restore: the replaced database was kept as ${kept}`);
  });

  it('SQLBK-009: a copy that cannot be kept does not block the restore', async () => {
    const maintenance = maintenanceStub();
    maintenance.vacuumInto.mockRejectedValueOnce('database disk image is malformed');

    await expect(portWith(maintenance).keepCopyBeforeRestore()).resolves.toBeNull();

    expect(logMock.logWarn).toHaveBeenCalledWith(
      'Restore: could not keep a copy of the current database (database disk image is malformed)',
    );
  });

  describe('replace', () => {
    it('SQLBK-010: closes, swaps the file in by rename, drops the old sidecars and reopens', async () => {
      writeDb(liveFile, 'live');
      const source = path.join(dir, 'restored.db');
      writeDb(source, 'restored');
      const liveBytes = fs.readFileSync(liveFile);
      const sourceBytes = fs.readFileSync(source);
      fs.writeFileSync(liveFile + '-wal', 'stale wal');
      fs.writeFileSync(liveFile + '-shm', 'stale shm');
      // Which database sits at the live path at each step, told by its bytes:
      // no handle is opened on a file whose sidecars are deliberately stale.
      const which = () => {
        const now = fs.readFileSync(liveFile);
        if (now.equals(liveBytes)) return 'live';
        return now.equals(sourceBytes) ? 'restored' : 'other';
      };
      const order: string[] = [];
      lifecycle.close.mockImplementation(() => order.push(`close:${which()}`));
      lifecycle.reopen.mockImplementation(async () => {
        order.push(`reopen:${which()}`);
      });

      const result = await portWith(maintenanceStub()).replace(source);

      expect(result).toEqual({ reopenError: null });
      expect(order).toEqual(['close:live', 'reopen:restored']);
      expect(fs.existsSync(liveFile + '-wal')).toBe(false);
      expect(fs.existsSync(liveFile + '-shm')).toBe(false);
      expect(fs.existsSync(liveFile + '.restore-tmp')).toBe(false);
      // The source stays: it belongs to the caller (an unpacked archive, the demo baseline).
      expect(readLabel(source)).toBe('restored');
    });

    it('SQLBK-011: a reopen that fails after the swap is reported, not thrown', async () => {
      writeDb(liveFile, 'live');
      const source = path.join(dir, 'restored.db');
      writeDb(source, 'restored');
      const failure = new Error('database is locked');
      lifecycle.reopen.mockRejectedValueOnce(failure);

      const result = await portWith(maintenanceStub()).replace(source);

      expect(result.reopenError).toBe(failure);
      expect(readLabel(liveFile)).toBe('restored');
    });

    it('SQLBK-012: a swap that fails still reopens, leaves the live file as it was and rethrows', async () => {
      writeDb(liveFile, 'live');

      await expect(portWith(maintenanceStub()).replace(path.join(dir, 'does-not-exist.db'))).rejects.toThrow(/ENOENT/);

      expect(lifecycle.close).toHaveBeenCalledTimes(1);
      expect(lifecycle.reopen).toHaveBeenCalledTimes(1);
      expect(readLabel(liveFile)).toBe('live');
    });

    it('SQLBK-013: a swap that fails and a reopen that fails too both go up, so the lost connection is not hidden', async () => {
      writeDb(liveFile, 'live');
      const reopenFailure = new Error('database is locked');
      lifecycle.reopen.mockRejectedValueOnce(reopenFailure);

      const thrown = await portWith(maintenanceStub())
        .replace(path.join(dir, 'does-not-exist.db'))
        .then(
          () => null,
          (err: unknown) => err,
        );

      expect(thrown).toBeInstanceOf(DatabaseConnectionLostError);
      const lost = thrown as DatabaseConnectionLostError;
      expect((lost.swapError as Error).message).toMatch(/ENOENT/);
      expect(lost.cause).toBe(reopenFailure);
      expect(lost.message).toMatch(
        /could not be replaced \(ENOENT.*\) and the connection could not be reopened \(database is locked\)\. Restart the server\.$/,
      );
      expect(lifecycle.reopen).toHaveBeenCalledTimes(1);
      expect(readLabel(liveFile)).toBe('live');
    });
  });

  it('SQLBK-014: the lost-connection error names values that are not Errors as they are', () => {
    const lost = new DatabaseConnectionLostError('disk gone', 42);
    expect(lost.name).toBe('DatabaseConnectionLostError');
    expect(lost.swapError).toBe('disk gone');
    expect(lost.cause).toBe(42);
    expect(lost.message).toBe(
      'The database could not be replaced (disk gone) and the connection could not be reopened (42). Restart the server.',
    );
  });
});
