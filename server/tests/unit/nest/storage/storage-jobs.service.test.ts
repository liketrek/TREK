import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  return { testDb: db, dbMock: { db, closeDb: () => {}, reinitialize: () => {} } };
});
vi.mock('../../../../src/db/database', () => dbMock);
vi.mock('../../../../src/config', () => ({ ENCRYPTION_KEY: 'storage-jobs-test-key' }));

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { Logger } from '@nestjs/common';
import { createTables } from '../../../../src/db/schema';
import { runMigrations } from '../../../../src/db/migrations';
import { DatabaseService } from '../../../../src/nest/database/database.service';
import type { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { MirrorDriver } from '../../../../src/nest/storage/drivers/mirror.driver';
import { StorageEventsService } from '../../../../src/nest/storage/storage-events.service';
import { StorageRegistryService } from '../../../../src/nest/storage/storage-registry.service';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import {
  BackfillBusyError,
  BackfillTargetError,
  StorageJobsService,
} from '../../../../src/nest/storage/storage-jobs.service';

const db = new DatabaseService(testDb);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

const tmpDirs: string[] = [];
function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-jobs-'));
  tmpDirs.push(dir);
  return dir;
}
function setSetting(key: string, value: string): void {
  testDb.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, value);
}
beforeEach(() => {
  testDb.prepare("DELETE FROM app_settings WHERE key LIKE 'storage.%'").run();
});
afterEach(() => {
  vi.restoreAllMocks();
  while (tmpDirs.length) fs.rmSync(tmpDirs.pop()!, { recursive: true, force: true });
});

/** A registry whose backups category routes through mirror 'm' (nas replica). */
function makeWorld() {
  const uploadsRoot = makeTmpDir();
  const backupsRoot = makeTmpDir();
  const nasRoot = makeTmpDir();
  setSetting(
    'storage.backends',
    JSON.stringify([
      { name: 'uploads-local', type: 'local', options: { root: uploadsRoot } },
      { name: 'backups-local', type: 'local', options: { root: backupsRoot } },
      { name: 'nas', type: 'local', options: { root: nasRoot } },
      { name: 'm', type: 'mirror', options: { primary: 'backups-local', replicas: ['nas'] } },
    ]),
  );
  setSetting('storage.categories', JSON.stringify({ backups: 'm' }));
  const env = { env: () => ({ paths: {} }) } as unknown as RuntimeEnvService;
  const registry = new StorageRegistryService(db, env, new StorageEventsService());
  registry.onModuleInit();
  const storage = new StorageService(registry);
  const jobs = new StorageJobsService(registry);
  return { registry, storage, jobs, backupsRoot, nasRoot };
}

async function waitFor(predicate: () => boolean, ms = 5000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > ms) throw new Error('timed out waiting for job');
    await new Promise((r) => setTimeout(r, 20));
  }
}

describe('StorageJobsService', () => {
  it('JOBS-001 backfills the categories routed through the mirror and lands on done', async () => {
    const { storage, jobs, nasRoot } = makeWorld();
    await storage.put('backups', 'old-backup.zip', Readable.from('zipzip'));
    fs.rmSync(path.join(nasRoot, 'old-backup.zip'), { force: true }); // simulate pre-mirror object
    jobs.startBackfill('m');
    await waitFor(() => jobs.statuses().some((s) => s.backend === 'm' && s.status === 'done'));
    const status = jobs.statuses().find((s) => s.backend === 'm')!;
    expect(status).toMatchObject({ status: 'done', total: 1, done: 1, copied: 1, failed: 0 });
    expect(fs.existsSync(path.join(nasRoot, 'old-backup.zip'))).toBe(true);
  });

  it('JOBS-002 rejects an unrouted or non-mirror name with BackfillTargetError', () => {
    const { jobs } = makeWorld();
    expect(() => jobs.startBackfill('nas')).toThrow(BackfillTargetError);
    expect(() => jobs.startBackfill('ghost')).toThrow(BackfillTargetError);
  });

  it('JOBS-003 a second start while one runs throws BackfillBusyError (global, either backend)', async () => {
    const { storage, jobs } = makeWorld();
    for (let i = 0; i < 20; i++) await storage.put('backups', `b${i}.zip`, Readable.from('x'.repeat(1000)));
    jobs.startBackfill('m');
    expect(() => jobs.startBackfill('m')).toThrow(BackfillBusyError);
    await waitFor(() => jobs.statuses().some((s) => s.status !== 'running'));
  });

  it('JOBS-004 cancel flips a running job to cancelled; cancelling a finished/unknown one returns false', async () => {
    const { storage, jobs } = makeWorld();
    for (let i = 0; i < 50; i++) await storage.put('backups', `c${i}.zip`, Readable.from('y'.repeat(2000)));
    jobs.startBackfill('m');
    expect(jobs.cancelBackfill('m')).toBe(true);
    await waitFor(() => jobs.statuses().some((s) => s.backend === 'm' && s.status !== 'running'));
    expect(jobs.statuses().find((s) => s.backend === 'm')!.status).toBe('cancelled');
    expect(jobs.cancelBackfill('m')).toBe(false);
    expect(jobs.cancelBackfill('ghost')).toBe(false);
  });

  it('JOBS-005 finished statuses expire after the TTL', async () => {
    vi.useFakeTimers();
    try {
      const { storage, jobs } = makeWorld();
      await storage.put('backups', 'one.zip', Readable.from('z'));
      jobs.startBackfill('m');
      // Drain the real async job under fake timers by flushing microtasks.
      await vi.waitFor(() => expect(jobs.statuses()[0]?.status).toBe('done'));
      vi.advanceTimersByTime(10 * 60_000 + 1000);
      expect(jobs.statuses()).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('JOBS-006 an Error rejection from driver.backfill lands the job on "error" with its message, and is logged', async () => {
    const { jobs } = makeWorld();
    const backfillSpy = vi.spyOn(MirrorDriver.prototype, 'backfill').mockRejectedValueOnce(new Error('replica offline'));
    const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jobs.startBackfill('m');
    await waitFor(() => jobs.statuses().some((s) => s.backend === 'm' && s.status === 'error'));
    const status = jobs.statuses().find((s) => s.backend === 'm')!;
    expect(status.error).toBe('replica offline');
    expect(errorSpy).toHaveBeenCalledWith("backfill 'm' aborted: replica offline");
    backfillSpy.mockRestore();
  });

  it('JOBS-006b a non-Error rejection is stringified rather than crashing', async () => {
    const { jobs } = makeWorld();
    const backfillSpy = vi.spyOn(MirrorDriver.prototype, 'backfill').mockRejectedValueOnce('replica gone');
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jobs.startBackfill('m');
    await waitFor(() => jobs.statuses().some((s) => s.backend === 'm' && s.status === 'error'));
    expect(jobs.statuses().find((s) => s.backend === 'm')!.error).toBe('replica gone');
    backfillSpy.mockRestore();
  });

  it('JOBS-007 withTtl builds a service whose finished jobs expire on the given (short) TTL, not the 10-minute default', async () => {
    const { registry, storage } = makeWorld();
    await storage.put('backups', 'q.zip', Readable.from('q'));
    const jobs = StorageJobsService.withTtl(registry, 50);
    jobs.startBackfill('m');
    await waitFor(() => jobs.statuses().some((s) => s.status === 'done'));
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(jobs.statuses()).toEqual([]);
  });

  it('JOBS-008 while a backfill is running, starting an unknown/non-mirror name throws BackfillTargetError, not BackfillBusyError', async () => {
    const { storage, jobs } = makeWorld();
    for (let i = 0; i < 20; i++) await storage.put('backups', `d${i}.zip`, Readable.from('x'.repeat(1000)));
    jobs.startBackfill('m');
    expect(() => jobs.startBackfill('ghost')).toThrow(BackfillTargetError);
    expect(() => jobs.startBackfill('nas')).toThrow(BackfillTargetError);
    await waitFor(() => jobs.statuses().some((s) => s.status !== 'running'));
  });
});
