/**
 * Task C6 (audit #4, major) — a restored archive carries its OWN
 * `app_settings` storage.* rows, which can name a different category
 * assignment than the pre-restore install. Before this fix,
 * `restoreFromZip` never reloaded the storage registry after reopening the
 * DB, so uploads rehydration ran against the STALE pre-restore driver/
 * category map — files landed on the wrong backend.
 *
 * `backup.impl.test.ts` (BACKUP-045f / BACKUP-061f) pins the *ordering*
 * inside `restoreFromZip` with a stubbed StorageService: reinitialize() →
 * storage.reloadConfig() → rehydration, and that reload is skipped when
 * reopen fails. This test pins the other half — that `reloadConfig()`
 * genuinely causes a changed category assignment to take effect for real
 * byte placement — using the REAL StorageRegistryService/StorageService/
 * DatabaseService trio (same pattern as storage-registry.service.test.ts),
 * with two real LocalDriver backends over real tmp directories, so the
 * category under test ('files', reassigned between nas-a/nas-b) never
 * touches a production path. Note: registry construction itself still
 * mkdirs the built-in uploads-local/backups-local roots (server/uploads,
 * server/data/backups) as an unconditional side effect of onModuleInit() —
 * accepted precedent from storage-registry.service.test.ts, harmless (mkdir
 * -p on an existing dir), and orthogonal to what this test actually exercises.
 */
import { AppSettings } from '../../src/db/entities/AppSettings.entity';
import { StorageEventsService } from '../../src/nest/storage/storage-events.service';
import { BACKENDS_KEY, CATEGORIES_KEY, StorageRegistryService } from '../../src/nest/storage/storage-registry.service';
import { StorageService } from '../../src/nest/storage/storage.service';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { deleteRows } from '../helpers/factories/rows';
import { setAppSetting } from '../helpers/factories/settings';
import { createTestUnitOfWork, createTestAppSettingsRepo, sharedTestOrm } from '../helpers/test-uow';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, afterEach } from 'vitest';

const testDb = createSnapshotTestDb();

const tmpDirs: string[] = [];
function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-restore-reload-'));
  tmpDirs.push(dir);
  return dir;
}

function envStub(): { placePhotoDir: string | undefined } {
  return { placePhotoDir: undefined };
}

async function setSetting(key: string, value: unknown): Promise<void> {
  await setAppSetting(await sharedTestOrm(testDb), key, JSON.stringify(value));
}

afterEach(async () => {
  while (tmpDirs.length) fs.rmSync(tmpDirs.pop()!, { recursive: true, force: true });
  await deleteRows(await sharedTestOrm(testDb), AppSettings, { key: { $like: 'storage.%' } });
});

describe('C6 — restore reloads the storage registry (audit #4)', () => {
  it("reloadConfig() picks up the restored archive's category assignment before any byte is rehydrated", async () => {
    const rootA = makeTmpDir();
    const rootB = makeTmpDir();

    // Pre-restore world: 'files' resolves to backend nas-a.
    await setSetting(BACKENDS_KEY, [
      { name: 'nas-a', type: 'local', options: { root: rootA } },
      { name: 'nas-b', type: 'local', options: { root: rootB } },
    ]);
    await setSetting(CATEGORIES_KEY, { files: 'nas-a' });

    const registry = new StorageRegistryService(
      await createTestAppSettingsRepo(testDb),
      envStub(),
      new StorageEventsService(),
      await createTestUnitOfWork(testDb),
      (await sharedTestOrm(testDb)).orm,
    );
    await registry.onModuleInit();
    const storage = new StorageService(registry);

    expect(registry.resolve('files').backendName).toBe('nas-a');

    // A pre-restore object lives under nas-a.
    const preSrc = path.join(makeTmpDir(), 'old.txt');
    fs.writeFileSync(preSrc, 'pre-restore bytes');
    await storage.put('files', 'old.txt', { tmpPath: preSrc });
    expect(fs.existsSync(path.join(rootA, 'files', 'old.txt'))).toBe(true);

    // Simulate what restoreFromZip's DB swap + reinitialize() actually does in
    // production: the restored archive's travel.db is now live, and IT names a
    // different backend for 'files' (an admin on the source install pointed
    // 'files' at a different backend before taking that backup).
    await setSetting(CATEGORIES_KEY, { files: 'nas-b' });

    // Audit #4, pre-fix: the registry is still holding the pre-restore driver
    // map at this point — resolve() is stale until something calls reload().
    expect(registry.resolve('files').backendName).toBe('nas-a');

    // The fix under test: StorageService.reloadConfig(), the narrow passthrough
    // restoreFromZip now calls right after reinitialize() and right before
    // rehydration (see backup.impl.ts).
    await storage.reloadConfig();

    expect(registry.resolve('files').backendName).toBe('nas-b');

    // Rehydration (the same storage.put({ tmpPath }) shape backup.impl.ts's
    // rehydrateUploads uses for every extracted upload entry) now lands under
    // the RESTORED config's backend, never the stale pre-restore one.
    const restoredSrc = path.join(makeTmpDir(), 'restored.txt');
    fs.writeFileSync(restoredSrc, 'restored bytes');
    await storage.put('files', 'restored.txt', { tmpPath: restoredSrc });

    expect(fs.existsSync(path.join(rootB, 'files', 'restored.txt'))).toBe(true);
    expect(fs.existsSync(path.join(rootA, 'files', 'restored.txt'))).toBe(false);
  });
});
