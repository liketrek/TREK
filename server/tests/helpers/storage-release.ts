/**
 * Stand-ins for StorageReleaseService in suites that hand-build an owner
 * service. The release itself (asking every reference source, the ledger's
 * guards) has its own suites: storage-release.service.test.ts and the
 * integration suite over the full app.
 *
 * - `releaseNothing()` releases nothing and records the calls;
 * - `releaseDirect(storage)` deletes every root-level object the values name,
 *   as a suite with no second row naming them would see the real one do.
 */
import { inReclaimScope } from '../../src/nest/storage/storage-reclaim.ledger';
import {
  storageKeysIn,
  type StorageKeyOptions,
  type StorageKeyRef,
} from '../../src/nest/storage/storage-reclaim.types';
import type { StorageReleaseService } from '../../src/nest/storage/storage-release.service';
import type { StorageService } from '../../src/nest/storage/storage.service';
import type { ServedCategory } from '../../src/nest/storage/storage.types';

import { vi } from 'vitest';

export function releaseNothing() {
  const releaseValues = vi.fn(async (): Promise<StorageKeyRef[]> => []);
  const releaseIfUnreferenced = vi.fn(async (): Promise<string[]> => []);
  return { releaseValues, releaseIfUnreferenced } as unknown as StorageReleaseService & {
    releaseValues: typeof releaseValues;
    releaseIfUnreferenced: typeof releaseIfUnreferenced;
  };
}

export function releaseDirect(storage: StorageService): StorageReleaseService {
  const releaseIfUnreferenced = async (category: ServedCategory, keys: readonly string[]): Promise<string[]> => {
    const present = await Promise.all(
      [...new Set(keys)].map(async (key) =>
        inReclaimScope(key) && (await storage.stat(category, key).catch(() => null)) !== null ? key : null,
      ),
    );
    const gone = present.filter((key): key is string => key !== null);
    await Promise.all(gone.map((key) => storage.delete(category, key)));
    return gone;
  };
  const releaseValues = async (
    values: ReadonlyArray<string | null | undefined>,
    options: StorageKeyOptions = {},
  ): Promise<StorageKeyRef[]> => {
    const byCategory = new Map<string, Set<string>>();
    for (const ref of values.flatMap((value) => storageKeysIn(value, options))) {
      byCategory.set(ref.category, (byCategory.get(ref.category) ?? new Set<string>()).add(ref.key));
    }
    const released = await Promise.all(
      [...byCategory].map(async ([category, keys]) =>
        (await releaseIfUnreferenced(category as ServedCategory, [...keys])).map((key) => ({ category, key })),
      ),
    );
    return released.flat();
  };
  return { releaseValues, releaseIfUnreferenced } as unknown as StorageReleaseService;
}
