import { LocalDriver } from '../../src/nest/storage/drivers/local.driver';
import type { StorageRegistryService, ResolvedCategory } from '../../src/nest/storage/storage-registry.service';
import { StorageService } from '../../src/nest/storage/storage.service';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * A real StorageService facade over a stub registry + a REAL LocalDriver
 * rooted in a throwaway mkdtemp dir (the storage.service.test.ts makeFixture
 * pattern, shared). Every category resolves to the same driver + keyPrefix —
 * exactly what a single-category service test needs, and the two
 * TREK_PLACE_PHOTO_DIR modes are just two prefixes ('photos/google/' vs '').
 * The real mode flip lives in the registry and is pinned by its own tests.
 */
export interface StorageFixture {
  storage: StorageService;
  /** Driver root — objects land at root/<keyPrefix><name>. */
  root: string;
  cleanup(): void;
}

export function makeStorageFixture(keyPrefix: string): StorageFixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-storage-fx-'));
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-storage-fx-tmp-'));
  const driver = new LocalDriver({ id: 'fixture-local', root });
  driver.init({ cleanSpool: true });
  const registry = {
    resolve: (): ResolvedCategory => ({ driver, keyPrefix, backendName: 'fixture-local' }),
    tempDir: () => tempDir,
    replicaFailures: () => [],
  } as unknown as StorageRegistryService;
  return {
    storage: new StorageService(registry),
    root,
    cleanup: () => {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(tempDir, { recursive: true, force: true });
    },
  };
}
