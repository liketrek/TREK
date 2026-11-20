import type { StorageService } from '../../src/nest/storage/storage.service';
import type { ServedCategory } from '../../src/nest/storage/storage.types';

export interface StoredObjects {
  /** Every object stored through the facade since tracking began, in order. */
  readonly stored: ReadonlyArray<{ category: ServedCategory; name: string }>;
  /** Deletes exactly those objects and stops tracking. */
  cleanup(): Promise<void>;
}

/**
 * Records what a suite stores, so it can remove exactly that afterwards.
 *
 * Every suite that boots the app writes into the same server/uploads tree, and
 * on the Postgres lane several of them run at once. A suite that cleaned up by
 * removing a whole category folder (uploads/files, uploads/covers, ...) took
 * the files of whichever suite was running beside it, which then failed with
 * "storage object not found" halfway through a test. `put` is the facade's one
 * write path, so wrapping it on the app's own instance sees every upload,
 * thumbnail and derived copy the suite causes.
 */
export function trackStoredObjects(storage: StorageService): StoredObjects {
  const stored: Array<{ category: ServedCategory; name: string }> = [];
  const put = storage.put.bind(storage);
  storage.put = async (...args: Parameters<StorageService['put']>) => {
    const result = await put(...args);
    stored.push({ category: args[0], name: args[1] });
    return result;
  };
  return {
    stored,
    async cleanup() {
      storage.put = put;
      for (const { category, name } of stored.splice(0)) {
        // Already gone is fine: a test may have deleted its own object.
        await storage.delete(category, name).catch(() => undefined);
      }
    },
  };
}
