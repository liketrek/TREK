/**
 * Stand-ins for StorageReleaseService in suites that hand-build an owner
 * service. The release itself (the queue, the job asking every reference
 * source, the guards) has its own suites: storage-release.service.test.ts,
 * storage-release.job.test.ts and the integration suite over the full app.
 *
 * - `releaseNothing()` queues nothing and records the calls;
 * - `releaseDirect(storage)` deletes every root-level object the values name
 *   at once, as the queue would once the objects are due in a suite with no
 *   second row naming them.
 */
import { inReclaimScope } from '../../src/nest/storage/storage-reclaim.ledger';
import { storageKeysIn, type StorageKeyOptions } from '../../src/nest/storage/storage-reclaim.types';
import type { StorageReleaseService } from '../../src/nest/storage/storage-release.service';
import type { StorageService } from '../../src/nest/storage/storage.service';
import type { ServedCategory } from '../../src/nest/storage/storage.types';

import { vi } from 'vitest';

export function releaseNothing() {
  const releaseValues = vi.fn(async (): Promise<number> => 0);
  return { releaseValues } as unknown as StorageReleaseService & { releaseValues: typeof releaseValues };
}

export function releaseDirect(storage: StorageService): StorageReleaseService {
  const releaseValues = async (
    values: ReadonlyArray<string | null | undefined>,
    options: StorageKeyOptions = {},
  ): Promise<number> => {
    const refs = values.flatMap((value) => storageKeysIn(value, options)).filter((ref) => inReclaimScope(ref.key));
    const unique = [...new Map(refs.map((ref) => [`${ref.category}\n${ref.key}`, ref])).values()];
    const present = await Promise.all(
      unique.map(async (ref) =>
        (await storage.stat(ref.category as ServedCategory, ref.key).catch(() => null)) !== null ? ref : null,
      ),
    );
    const gone = present.filter((ref): ref is NonNullable<typeof ref> => ref !== null);
    await Promise.all(gone.map((ref) => storage.delete(ref.category as ServedCategory, ref.key)));
    return gone.length;
  };
  return { releaseValues } as unknown as StorageReleaseService;
}
