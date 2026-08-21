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
import { CATEGORIES_KEY, StorageRegistryService } from '../../../../src/nest/storage/storage-registry.service';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import {
  BackfillBusyError,
  BackfillTargetError,
  MigrationRequestError,
  MigrationTargetError,
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

async function waitFor(predicate: () => boolean, ms = 5000, intervalMs = 20): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > ms) throw new Error('timed out waiting for job');
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/** A registry with 'files' explicitly routed to 'uploads-local' and an unassigned 'dest-local' target. */
function makeMigrationWorld() {
  const uploadsRoot = makeTmpDir();
  const backupsRoot = makeTmpDir();
  const destRoot = makeTmpDir();
  setSetting(
    'storage.backends',
    JSON.stringify([
      { name: 'uploads-local', type: 'local', options: { root: uploadsRoot } },
      { name: 'backups-local', type: 'local', options: { root: backupsRoot } },
      { name: 'dest-local', type: 'local', options: { root: destRoot } },
    ]),
  );
  setSetting('storage.categories', JSON.stringify({ files: 'uploads-local' }));
  const env = { env: () => ({ paths: {} }) } as unknown as RuntimeEnvService;
  const registry = new StorageRegistryService(db, env, new StorageEventsService());
  registry.onModuleInit();
  const storage = new StorageService(registry);
  const jobs = new StorageJobsService(registry);
  return { registry, storage, jobs, uploadsRoot, destRoot };
}

/**
 * A registry with TREK_PLACE_PHOTO_DIR set, so 'photos-google' defaults to
 * the bare-key mode-A backend 'place-photos-local' (audit #8's source shape),
 * plus an unassigned 'dest-local' target that uses the normal prefixed
 * (mode-B) layout for every other backend.
 */
function makePhotosGoogleMigrationWorld() {
  const uploadsRoot = makeTmpDir();
  const backupsRoot = makeTmpDir();
  const placePhotoRoot = makeTmpDir();
  const destRoot = makeTmpDir();
  setSetting(
    'storage.backends',
    JSON.stringify([
      { name: 'uploads-local', type: 'local', options: { root: uploadsRoot } },
      { name: 'backups-local', type: 'local', options: { root: backupsRoot } },
      { name: 'dest-local', type: 'local', options: { root: destRoot } },
    ]),
  );
  const env = { env: () => ({ paths: { placePhotoDir: placePhotoRoot } }) } as unknown as RuntimeEnvService;
  const registry = new StorageRegistryService(db, env, new StorageEventsService());
  registry.onModuleInit();
  const storage = new StorageService(registry);
  const jobs = new StorageJobsService(registry);
  return { registry, storage, jobs, placePhotoRoot, destRoot };
}

/** Combines the migration world's 'dest-local' target with the backfill world's routed mirror 'm'. */
function makeMigrationBackfillWorld() {
  const uploadsRoot = makeTmpDir();
  const backupsRoot = makeTmpDir();
  const nasRoot = makeTmpDir();
  const destRoot = makeTmpDir();
  setSetting(
    'storage.backends',
    JSON.stringify([
      { name: 'uploads-local', type: 'local', options: { root: uploadsRoot } },
      { name: 'backups-local', type: 'local', options: { root: backupsRoot } },
      { name: 'nas', type: 'local', options: { root: nasRoot } },
      { name: 'dest-local', type: 'local', options: { root: destRoot } },
      { name: 'm', type: 'mirror', options: { primary: 'backups-local', replicas: ['nas'] } },
    ]),
  );
  setSetting('storage.categories', JSON.stringify({ backups: 'm', files: 'uploads-local' }));
  const env = { env: () => ({ paths: {} }) } as unknown as RuntimeEnvService;
  const registry = new StorageRegistryService(db, env, new StorageEventsService());
  registry.onModuleInit();
  const storage = new StorageService(registry);
  const jobs = new StorageJobsService(registry);
  return { registry, storage, jobs, uploadsRoot, backupsRoot, nasRoot, destRoot };
}

/** Reads the raw 'storage.categories' app_settings row (undefined key ⇒ {}). */
function registryCategoriesRow(): Record<string, string> {
  const row = testDb.prepare('SELECT value FROM app_settings WHERE key = ?').get(CATEGORIES_KEY) as
    | { value: string }
    | undefined;
  return row ? (JSON.parse(row.value) as Record<string, string>) : {};
}

/** Polls migrationStatuses() for the named category to leave 'running', bounded ~5s. */
async function waitTerminal(jobs: StorageJobsService, category: string) {
  await waitFor(() => jobs.migrationStatuses().some((m) => m.category === category && m.status !== 'running'));
  return jobs.migrationStatuses().find((m) => m.category === category)!;
}

describe('StorageJobsService', () => {
  it('JOBS-001 backfills the categories routed through the mirror and lands on done', async () => {
    const { storage, jobs, nasRoot } = makeWorld();
    await storage.put('backups', 'old-backup.zip', Readable.from('zipzip'));
    fs.rmSync(path.join(nasRoot, 'old-backup.zip'), { force: true }); // simulate pre-mirror object
    jobs.startBackfill('m');
    await waitFor(() => jobs.statuses().some((s) => s.backend === 'm' && s.status === 'done'));
    const status = jobs.statuses().find((s) => s.backend === 'm')!;
    expect(status).toMatchObject({ status: 'done', total: 1, done: 1, copied: 1, failed: 0, deleted: 0 });
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

describe('StorageJobsService migrations', () => {
  it('MIG-001 happy path: copies, flips the category, sweeps a raced write, tallies reclaimable', async () => {
    const { storage, jobs, uploadsRoot, destRoot } = makeMigrationWorld();
    // Sized up (not slept) so the copy phase has real work left when we poll
    // for enumeration-done — a few bytes would finish before the first poll tick.
    const big = 'a'.repeat(4_000_000);
    await storage.put('files', 'a.txt', Readable.from(big));
    await storage.put('files', 'b.txt', Readable.from(big.replace(/a/g, 'b')));

    jobs.startMigration('files', 'dest-local');
    // Enumeration done — write the raced third object before the copy phase settles.
    // Tight poll interval: the window between "total > 0" and job completion is narrow.
    await waitFor(
      () => jobs.migrationStatuses().some((m) => m.category === 'files' && m.total > 0),
      5000,
      1,
    );
    fs.writeFileSync(path.join(uploadsRoot, 'files', 'c.txt'), 'ccc');

    const final = await waitTerminal(jobs, 'files');
    expect(final.status).toBe('done');
    // 2 copy-phase + 1 sweep — but the raced write may instead land in the
    // copy phase's own (re-run) list(), so assert combined coverage, not
    // which phase caught it.
    expect(final.copied + final.skipped).toBeGreaterThanOrEqual(3);
    expect(registryCategoriesRow().files).toBe('dest-local'); // flip persisted
    expect(fs.existsSync(path.join(destRoot, 'files', 'a.txt'))).toBe(true);
    expect(fs.existsSync(path.join(destRoot, 'files', 'b.txt'))).toBe(true);
    expect(fs.existsSync(path.join(destRoot, 'files', 'c.txt'))).toBe(true);
    expect(final.reclaimable).toEqual({ objects: 3, bytes: expect.any(Number) }); // sources kept
  });

  it('MIG-002 a copy failure blocks the flip and ends failed', async () => {
    const { storage, jobs, destRoot } = makeMigrationWorld();
    await storage.put('files', 'a.txt', Readable.from('aaa'));
    await storage.put('files', 'b.txt', Readable.from('bbb'));
    // Pre-create a DIRECTORY at the target key path so the put's rename fails.
    fs.mkdirSync(path.join(destRoot, 'files', 'a.txt'), { recursive: true });

    jobs.startMigration('files', 'dest-local');
    const final = await waitTerminal(jobs, 'files');
    expect(final.status).toBe('failed');
    expect(final.failed).toBeGreaterThan(0);
    expect(registryCategoriesRow().files).toBe('uploads-local'); // NOT flipped
  });

  it('MIG-003 cancel before the flip leaves everything untouched', async () => {
    const { storage, jobs } = makeMigrationWorld();
    // Many, largish objects (not sleeps) so the copy phase is still running
    // when we poll for done >= 1 and issue the cancel.
    for (let i = 0; i < 100; i++) await storage.put('files', `f${i}.txt`, Readable.from('x'.repeat(100_000)));

    jobs.startMigration('files', 'dest-local');
    await waitFor(() => jobs.migrationStatuses().some((m) => m.category === 'files' && m.done >= 1), 5000, 1);
    expect(jobs.cancelMigration('files')).toBe(true);

    const final = await waitTerminal(jobs, 'files');
    expect(final.status).toBe('cancelled');
    expect(registryCategoriesRow().files).toBe('uploads-local');
  });

  it('MIG-007 a cancel landing after the copy loop but before the flip ends cancelled, categories row untouched', async () => {
    // Deterministic route (no timing race): an EMPTY category never enters
    // either copy loop, so the only place a cancel can be observed is the
    // guard between the failed-check and the flip. `cancelMigration` is
    // called synchronously right after `startMigration` returns — the
    // detached runMigration's first `for await` suspends on a microtask
    // before doing any work, so this synchronous call always lands the
    // cancel flag before the async function resumes.
    const { jobs } = makeMigrationWorld(); // 'files' has zero objects
    jobs.startMigration('files', 'dest-local');
    expect(jobs.cancelMigration('files')).toBe(true);

    const final = await waitTerminal(jobs, 'files');
    expect(final.status).toBe('cancelled');
    expect(registryCategoriesRow().files).toBe('uploads-local'); // never flipped
  });

  it('MIG-004 validations: 400s, 404, and 409 against a running backfill (and vice versa)', async () => {
    const { storage, jobs } = makeMigrationBackfillWorld();
    expect(() => jobs.startMigration('files', 'uploads-local')).toThrow(MigrationRequestError); // to === current
    expect(() => jobs.startMigration('nope' as never, 'dest-local')).toThrow(MigrationRequestError);
    expect(() => jobs.startMigration('files', 'ghost')).toThrow(MigrationTargetError);

    // A running backfill blocks a migration start.
    for (let i = 0; i < 20; i++) await storage.put('backups', `b${i}.zip`, Readable.from('x'.repeat(1000)));
    jobs.startBackfill('m');
    expect(() => jobs.startMigration('files', 'dest-local')).toThrow(BackfillBusyError);
    await waitFor(() => jobs.statuses().some((s) => s.status !== 'running'));

    // A running migration blocks a backfill start too.
    await storage.put('files', 'a.txt', Readable.from('a'.repeat(5000)));
    jobs.startMigration('files', 'dest-local');
    expect(() => jobs.startBackfill('m')).toThrow(BackfillBusyError);
    await waitFor(() => jobs.migrationStatuses().some((m) => m.status !== 'running'));
  });

  it('MIG-005 an object already on the target with a matching size is skipped in the copy phase itself', async () => {
    const { storage, jobs, destRoot } = makeMigrationWorld();
    await storage.put('files', 'a.txt', Readable.from('aaa'));
    // Pre-populate the destination with a byte-identical copy — the shape of
    // a retried/resumed migration, not just the delta sweep's territory.
    fs.mkdirSync(path.join(destRoot, 'files'), { recursive: true });
    fs.writeFileSync(path.join(destRoot, 'files', 'a.txt'), 'aaa');

    jobs.startMigration('files', 'dest-local');
    const final = await waitTerminal(jobs, 'files');
    expect(final.status).toBe('done');
    expect(final.skipped).toBeGreaterThanOrEqual(1);
    expect(final.copied).toBe(0);
    expect(registryCategoriesRow().files).toBe('dest-local');
  });

  it('MIG-006 a sweep-phase copy failure is reported without undoing the already-flipped category', async () => {
    const { storage, jobs, registry, uploadsRoot, destRoot } = makeMigrationWorld();
    await storage.put('files', 'a.txt', Readable.from('aaa'));

    // Grab the exact driver instance startMigration will resolve and keep for
    // its whole run (the in-flight guarantee), then wrap list() so the THIRD
    // call — the delta sweep's own re-list, after phase 1a's total count and
    // phase 1b's copy — races a content change into the source right as the
    // sweep starts, with the destination path blocked so the sweep's re-copy
    // attempt fails without touching the flip that already happened.
    const { driver: sourceDriver } = registry.resolve('files');
    const originalList = sourceDriver.list.bind(sourceDriver);
    let listCalls = 0;
    vi.spyOn(sourceDriver, 'list').mockImplementation((prefix: string) => {
      listCalls += 1;
      if (listCalls === 3) {
        fs.writeFileSync(path.join(uploadsRoot, 'files', 'a.txt'), 'aaaa');
        fs.rmSync(path.join(destRoot, 'files', 'a.txt'), { force: true });
        fs.mkdirSync(path.join(destRoot, 'files', 'a.txt'), { recursive: true });
      }
      return originalList(prefix);
    });

    jobs.startMigration('files', 'dest-local');
    const final = await waitTerminal(jobs, 'files');
    expect(final.status).toBe('done'); // sweep failures don't undo a completed flip
    expect(final.failed).toBeGreaterThanOrEqual(1);
    expect(registryCategoriesRow().files).toBe('dest-local');
  });

  it('MIG-008 photos-google mode-A (bare "" prefix) migrating to a prefixed backend rewrites destination keys (audit #8)', async () => {
    const { storage, jobs, placePhotoRoot, destRoot } = makePhotosGoogleMigrationWorld();
    await storage.put('photos-google', 'abc.jpg', Readable.from('img-a'));
    await storage.put('photos-google', 'sub/def.jpg', Readable.from('img-b'));

    jobs.startMigration('photos-google', 'dest-local');
    const final = await waitTerminal(jobs, 'photos-google');

    expect(final.status).toBe('done');
    expect(final.copied).toBe(2);
    expect(final.failed).toBe(0);
    // Source stayed bare-keyed (mode A) — untouched.
    expect(fs.existsSync(path.join(placePhotoRoot, 'abc.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(placePhotoRoot, 'sub', 'def.jpg'))).toBe(true);
    // Destination lands under the category's normal prefixed (mode-B) layout —
    // NOT at the bare source key, which the registry would never resolve.
    expect(fs.existsSync(path.join(destRoot, 'photos', 'google', 'abc.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(destRoot, 'photos', 'google', 'sub', 'def.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(destRoot, 'abc.jpg'))).toBe(false); // not left at the bare source key
    expect(registryCategoriesRow()['photos-google']).toBe('dest-local');
  });

  it('MIG-009 the skip-check on a rewritten-prefix migration stats the DESTINATION key, not the source key', async () => {
    const { storage, jobs, destRoot } = makePhotosGoogleMigrationWorld();
    await storage.put('photos-google', 'abc.jpg', Readable.from('same-bytes'));
    // Pre-populate the destination at the REWRITTEN key with matching size —
    // if the skip-check mistakenly stat'd the bare source key on the target,
    // it would find nothing and copy instead of skipping.
    fs.mkdirSync(path.join(destRoot, 'photos', 'google'), { recursive: true });
    fs.writeFileSync(path.join(destRoot, 'photos', 'google', 'abc.jpg'), 'same-bytes');

    jobs.startMigration('photos-google', 'dest-local');
    const final = await waitTerminal(jobs, 'photos-google');

    expect(final.status).toBe('done');
    expect(final.skipped).toBeGreaterThanOrEqual(1);
    expect(final.copied).toBe(0);
    expect(registryCategoriesRow()['photos-google']).toBe('dest-local');
  });

  it('MIG-010 the delta sweep rewrites a raced object\'s destination key too', async () => {
    const { storage, jobs, placePhotoRoot, destRoot } = makePhotosGoogleMigrationWorld();
    const big = 'x'.repeat(2_000_000);
    await storage.put('photos-google', 'a.jpg', Readable.from(big));

    jobs.startMigration('photos-google', 'dest-local');
    await waitFor(
      () => jobs.migrationStatuses().some((m) => m.category === 'photos-google' && m.total > 0),
      5000,
      1,
    );
    // Race a second bare-keyed object in after enumeration but before the copy
    // phase settles — the delta sweep must pick it up and rewrite its key too.
    fs.writeFileSync(path.join(placePhotoRoot, 'raced.jpg'), 'raced-bytes');

    const final = await waitTerminal(jobs, 'photos-google');
    expect(final.status).toBe('done');
    expect(fs.existsSync(path.join(destRoot, 'photos', 'google', 'a.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(destRoot, 'photos', 'google', 'raced.jpg'))).toBe(true);
    expect(registryCategoriesRow()['photos-google']).toBe('dest-local');
  });

  it('MIG-011 equal-prefix migrations (files -> dest-local) stay byte-identical: destination key equals the source key', async () => {
    const { storage, jobs, destRoot } = makeMigrationWorld();
    await storage.put('files', 'a.txt', Readable.from('aaa'));

    jobs.startMigration('files', 'dest-local');
    const final = await waitTerminal(jobs, 'files');

    expect(final.status).toBe('done');
    expect(final.copied).toBe(1);
    // Both source and destination use the same 'files/' prefix — the key is
    // unchanged, exactly today's pre-fix behavior.
    expect(fs.existsSync(path.join(destRoot, 'files', 'a.txt'))).toBe(true);
    expect(registryCategoriesRow().files).toBe('dest-local');
  });
});

describe('StorageJobsService.cancelJobsForMissingBackends', () => {
  it('JOBS-020 cancels a running backfill whose mirror left the config', async () => {
    const { storage, jobs, registry } = makeWorld();
    for (let i = 0; i < 50; i++) await storage.put('backups', `c${i}.zip`, Readable.from('y'.repeat(2000)));
    jobs.startBackfill('m');
    await waitFor(() => jobs.statuses().some((s) => s.backend === 'm' && s.done >= 1), 5000, 1);

    // Simulate a config save that drops mirror 'm' entirely — 'backups' reverts
    // to the built-in default ('backups-local'), a self-consistent config.
    setSetting('storage.backends', JSON.stringify([]));
    setSetting('storage.categories', JSON.stringify({}));
    registry.reload();

    jobs.cancelJobsForMissingBackends();
    await waitFor(() => jobs.statuses().some((s) => s.backend === 'm' && s.status !== 'running'));
    const status = jobs.statuses().find((s) => s.backend === 'm')!;
    expect(status.status).toBe('cancelled');
  });

  it('JOBS-021 cancels a running migration whose source or target backend is gone', async () => {
    // A category migrating away from a non-built-in backend ('nas') to another
    // non-built-in backend ('dest-local') — both can genuinely disappear from
    // a config save, unlike the always-present 'uploads-local'/'backups-local'.
    const uploadsRoot = makeTmpDir();
    const nasRoot = makeTmpDir();
    const destRoot = makeTmpDir();
    setSetting(
      'storage.backends',
      JSON.stringify([
        { name: 'uploads-local', type: 'local', options: { root: uploadsRoot } },
        { name: 'nas', type: 'local', options: { root: nasRoot } },
        { name: 'dest-local', type: 'local', options: { root: destRoot } },
      ]),
    );
    setSetting('storage.categories', JSON.stringify({ files: 'nas' }));
    const env = { env: () => ({ paths: {} }) } as unknown as RuntimeEnvService;
    const registry = new StorageRegistryService(db, env, new StorageEventsService());
    registry.onModuleInit();
    const storage = new StorageService(registry);
    const jobs = new StorageJobsService(registry);

    for (let i = 0; i < 100; i++) await storage.put('files', `f${i}.txt`, Readable.from('x'.repeat(100_000)));
    jobs.startMigration('files', 'dest-local');
    await waitFor(() => jobs.migrationStatuses().some((m) => m.category === 'files' && m.done >= 1), 5000, 1);

    // Simulate a config save: 'files' is rerouted to 'uploads-local' and the
    // migration's in-flight FROM backend ('nas') is dropped from the config
    // entirely — self-consistent (validateConfig only checks the new
    // category map), but the running migration's `from` no longer resolves.
    setSetting(
      'storage.backends',
      JSON.stringify([
        { name: 'uploads-local', type: 'local', options: { root: uploadsRoot } },
        { name: 'dest-local', type: 'local', options: { root: destRoot } },
      ]),
    );
    setSetting('storage.categories', JSON.stringify({ files: 'uploads-local' }));
    registry.reload();

    jobs.cancelJobsForMissingBackends();
    const final = await waitTerminal(jobs, 'files');
    expect(final.status).toBe('cancelled');
  });

  it('JOBS-022 cancels a running migration re-routed to a third, still-defined backend (route no longer matches `from`)', async () => {
    const { storage, jobs, registry } = makeMigrationWorld(); // 'files' -> 'uploads-local'; 'dest-local' is the target
    for (let i = 0; i < 100; i++) await storage.put('files', `f${i}.txt`, Readable.from('x'.repeat(100_000)));
    jobs.startMigration('files', 'dest-local');
    await waitFor(() => jobs.migrationStatuses().some((m) => m.category === 'files' && m.done >= 1), 5000, 1);

    // A config save re-routes 'files' to a THIRD backend — both the
    // migration's own from ('uploads-local') and to ('dest-local') backends
    // still exist (the migration's already-resolved source driver instance
    // is unaffected by the roots below — the in-flight guarantee), so the
    // existing missing-backend check wouldn't catch this.
    setSetting(
      'storage.backends',
      JSON.stringify([
        { name: 'uploads-local', type: 'local', options: { root: makeTmpDir() } },
        { name: 'backups-local', type: 'local', options: { root: makeTmpDir() } },
        { name: 'dest-local', type: 'local', options: { root: makeTmpDir() } },
        { name: 'third-local', type: 'local', options: { root: makeTmpDir() } },
      ]),
    );
    setSetting('storage.categories', JSON.stringify({ files: 'third-local' }));
    registry.reload();

    jobs.cancelJobsForMissingBackends();
    const final = await waitTerminal(jobs, 'files');
    expect(final.status).toBe('cancelled');
    expect(registryCategoriesRow().files).toBe('third-local'); // the save's reroute stands — no flip
  });

  it('JOBS-023 a save that does not touch the migrating category leaves it running', async () => {
    const { storage, jobs, registry } = makeMigrationWorld();
    for (let i = 0; i < 100; i++) await storage.put('files', `f${i}.txt`, Readable.from('x'.repeat(100_000)));
    jobs.startMigration('files', 'dest-local');
    await waitFor(() => jobs.migrationStatuses().some((m) => m.category === 'files' && m.done >= 1), 5000, 1);

    // A save that touches an unrelated category only — 'files' route is untouched.
    setSetting(
      'storage.backends',
      JSON.stringify([
        { name: 'uploads-local', type: 'local', options: { root: makeTmpDir() } },
        { name: 'backups-local', type: 'local', options: { root: makeTmpDir() } },
        { name: 'dest-local', type: 'local', options: { root: makeTmpDir() } },
      ]),
    );
    // Re-declare the original mapping unchanged (files still on uploads-local).
    setSetting('storage.categories', JSON.stringify({ files: 'uploads-local' }));

    jobs.cancelJobsForMissingBackends();
    expect(jobs.migrationStatuses().find((m) => m.category === 'files')!.status).toBe('running');

    expect(jobs.cancelMigration('files')).toBe(true); // clean up
    await waitTerminal(jobs, 'files');
  });
});
