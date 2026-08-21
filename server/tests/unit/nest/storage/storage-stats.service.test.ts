import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  return { testDb: db, dbMock: { db, closeDb: () => {}, reinitialize: () => {} } };
});
vi.mock('../../../../src/db/database', () => dbMock);
vi.mock('../../../../src/config', () => ({ ENCRYPTION_KEY: 'storage-stats-test-key' }));

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { createTables } from '../../../../src/db/schema';
import { runMigrations } from '../../../../src/db/migrations';
import { DatabaseService } from '../../../../src/nest/database/database.service';
import type { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { StorageEventsService } from '../../../../src/nest/storage/storage-events.service';
import { StorageRegistryService } from '../../../../src/nest/storage/storage-registry.service';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import { StatsBusyError, StorageStatsService } from '../../../../src/nest/storage/storage-stats.service';

const db = new DatabaseService(testDb);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

const tmpDirs: string[] = [];
function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-stats-'));
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

function makeWorld() {
  const uploadsRoot = makeTmpDir();
  const backupsRoot = makeTmpDir();
  setSetting(
    'storage.backends',
    JSON.stringify([
      { name: 'uploads-local', type: 'local', options: { root: uploadsRoot } },
      { name: 'backups-local', type: 'local', options: { root: backupsRoot } },
    ]),
  );
  const env = { env: () => ({ paths: {} }) } as unknown as RuntimeEnvService;
  const registry = new StorageRegistryService(db, env, new StorageEventsService());
  registry.onModuleInit();
  const storage = new StorageService(registry);
  const stats = new StorageStatsService(storage, db);
  return { storage, stats, uploadsRoot };
}

describe('StorageStatsService', () => {
  it('STATS-001 sums objects and bytes per category, legacy photos separate, and persists with computedAt', async () => {
    const { storage, stats } = makeWorld();
    await storage.put('files', 'a.pdf', Readable.from('12345')); // 5 bytes
    await storage.put('files', 'b.pdf', Readable.from('123')); // 3 bytes
    await storage.put('covers', 'c.jpg', Readable.from('1234567')); // 7 bytes
    await storage.put('photos', 'legacy.jpg', Readable.from('12')); // legacy dir
    const usage = await stats.scan();
    expect(usage.categories.files).toEqual({ objects: 2, bytes: 8 });
    expect(usage.categories.covers).toEqual({ objects: 1, bytes: 7 });
    expect(usage.categories.backups).toEqual({ objects: 0, bytes: 0 });
    expect(usage.legacyPhotos).toEqual({ objects: 1, bytes: 2 });
    expect(usage.computedAt).toBeGreaterThan(0);
    // Persisted round-trip:
    expect(stats.readUsage()).toEqual(usage);
    const raw = testDb.prepare("SELECT value FROM app_settings WHERE key = 'storage.usage'").get() as { value: string };
    expect(JSON.parse(raw.value)).toEqual(usage);
  });

  it('STATS-002 photos-google/photos-trek nested content is NOT double-counted into legacy photos', async () => {
    const { storage, stats } = makeWorld();
    await storage.put('photos-google', 'g.jpg', Readable.from('gggg'));
    const usage = await stats.scan();
    expect(usage.categories['photos-google']).toEqual({ objects: 1, bytes: 4 });
    expect(usage.legacyPhotos).toEqual({ objects: 0, bytes: 0 });
  });

  it('STATS-003 concurrent scans throw StatsBusyError', async () => {
    const { storage, stats } = makeWorld();
    for (let i = 0; i < 30; i++) await storage.put('files', `f${i}.bin`, Readable.from('x'.repeat(500)));
    const first = stats.scan();
    await expect(stats.scan()).rejects.toThrow(StatsBusyError);
    await first;
  });

  it('STATS-004 readUsage returns null on absent or unparseable rows', () => {
    const { stats } = makeWorld();
    expect(stats.readUsage()).toBeNull();
    setSetting('storage.usage', 'not json');
    expect(stats.readUsage()).toBeNull();
  });
});
