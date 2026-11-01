import { logDebug, logWarn } from '../audit/audit-log.logger';
import { StorageJobsService } from './storage-jobs.service';
import { isValidKey } from './storage-keys';
import { StorageReclaimRegistryService } from './storage-reclaim-registry.service';
import { inReclaimScope, RECLAIM_LEDGER, sharedLocationsOf } from './storage-reclaim.ledger';
import {
  storageKeysIn,
  storageOwnerMarkerInstall,
  type StorageKeyOptions,
  type StorageKeyRef,
  type StorageReferenceSource,
} from './storage-reclaim.types';
import { StorageRegistryService } from './storage-registry.service';
import { StorageService } from './storage.service';
import { SERVED_CATEGORIES, type ServedCategory } from './storage.types';
import { Injectable } from '@nestjs/common';

const SERVED = new Set<string>(SERVED_CATEGORIES);

/**
 * Deletes what a user's change left unnamed, right after it: a replaced or
 * removed cover, place image or avatar, a deleted journey photo or trip file.
 * The owner calls it once its transaction committed, with the values the rows
 * held, and every registered reference source (the nightly pass's sources and
 * parser) is asked whether anything still names each object. Only what no row
 * names goes, through `StorageService.delete` (replicas follow, a demo keeps
 * its bytes), so an object a trip copy, a journey or a saved place still shows
 * stays, unlike before (#2924), while a deleted photo is gone at once as it
 * always was.
 *
 * The pass's own guards hold: only the root of a reclaimable category, never
 * an owner marker, never while a restore runs, never where a required source
 * is missing or the category's location overlaps another's. It never fails
 * the caller's request: anything it leaves (an error, a guard) is the nightly
 * pass's to find. Releases are logged at debug, not audited one by one.
 */
@Injectable()
export class StorageReleaseService {
  constructor(
    private readonly storage: StorageService,
    private readonly registry: StorageRegistryService,
    private readonly references: StorageReclaimRegistryService,
    private readonly jobs: StorageJobsService,
  ) {}

  /**
   * The objects these stored values name (any spelling a column holds), each
   * deleted when no row names it any more. Answers the ones that went.
   */
  async releaseValues(
    values: ReadonlyArray<string | null | undefined>,
    options: StorageKeyOptions = {},
  ): Promise<StorageKeyRef[]> {
    const byCategory = new Map<ServedCategory, Set<string>>();
    for (const value of values) {
      for (const ref of storageKeysIn(value, options)) {
        if (!SERVED.has(ref.category)) continue;
        const category = ref.category as ServedCategory;
        const keys = byCategory.get(category) ?? new Set<string>();
        keys.add(ref.key);
        byCategory.set(category, keys);
      }
    }
    const released = await Promise.all(
      [...byCategory].map(async ([category, keys]) =>
        (await this.releaseIfUnreferenced(category, [...keys])).map((key) => ({ category, key })),
      ),
    );
    return released.flat();
  }

  /** These keys of one category, each deleted when it exists and no row names it. Answers the ones that went. */
  async releaseIfUnreferenced(category: ServedCategory, keys: readonly string[]): Promise<string[]> {
    try {
      const candidates = [...new Set(keys)].filter(
        (key) => inReclaimScope(key) && isValidKey(key) && storageOwnerMarkerInstall(key) === null,
      );
      if (candidates.length === 0) return [];
      const sources = this.sourcesFor(category);
      if (sources === null) return [];
      const referenced = await this.referencedIn(category, candidates, sources);
      const unnamed = candidates.filter(
        (key) => !referenced.has(key.toLowerCase()) && !this.storage.keepsOnDelete(category, key),
      );
      const released = await Promise.all(unnamed.map((key) => this.deleteIfPresent(category, key)));
      return unnamed.filter((_key, i) => released[i]);
    } catch (err) {
      logWarn(`[storage] could not release '${category}' objects, the nightly pass will: ${messageOf(err)}`);
      return [];
    }
  }

  /** The sources to ask, or null when the category may not be released from now. */
  private sourcesFor(category: ServedCategory): readonly StorageReferenceSource[] | null {
    const rule = RECLAIM_LEDGER[category];
    if (!rule.reclaim || this.jobs.restoreRunning) return null;
    const sources = this.references.sources().filter((source) => source.claims.some((c) => c.category === category));
    const whole = new Set(
      sources
        .filter((source) => source.claims.some((c) => c.category === category && c.prefix === ''))
        .map((source) => source.id),
    );
    if (rule.requiredSources.some((id) => !whole.has(id))) return null;
    if (sharedLocationsOf(this.registry).has(category)) return null;
    return sources;
  }

  private async referencedIn(
    category: ServedCategory,
    keys: readonly string[],
    sources: readonly StorageReferenceSource[],
  ): Promise<Set<string>> {
    const answers = await Promise.all(
      sources.map(async (source) => {
        const asked = keys.filter((key) =>
          source.claims.some((claim) => claim.category === category && key.startsWith(claim.prefix)),
        );
        return asked.length === 0 ? new Set<string>() : await source.referenced(category, asked);
      }),
    );
    const referenced = new Set<string>();
    for (const answer of answers) for (const key of answer) referenced.add(key.toLowerCase());
    return referenced;
  }

  private async deleteIfPresent(category: ServedCategory, key: string): Promise<boolean> {
    try {
      if ((await this.storage.stat(category, key)) === null) return false;
      await this.storage.delete(category, key);
      logDebug(`[storage] released an unreferenced '${category}' object`);
      return true;
    } catch (err) {
      logWarn(`[storage] could not release a '${category}' object, the nightly pass will: ${messageOf(err)}`);
      return false;
    }
  }
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
