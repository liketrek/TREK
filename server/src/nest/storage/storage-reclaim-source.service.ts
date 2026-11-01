import { StorageReclaimRegistryService } from './storage-reclaim-registry.service';
import {
  keySearchCore,
  keysNamedIn,
  type StorageKeyOptions,
  type StorageReferenceClaim,
  type StorageReferenceSource,
  type StorageReferenceSourceId,
} from './storage-reclaim.types';
import type { ServedCategory } from './storage.types';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * The shape every owner's reference source shares: it registers itself with
 * the reclaim registry once the app is up, and answers by reading the values
 * its own columns hold and parsing them with `keysNamedIn`, so no source
 * carries a parser of its own.
 *
 * An owner extends this in its own domain, names its id and claims, and reads
 * its columns through `em.getRepository(<its own entity>)`; storage never
 * learns which tables those are. A column that takes any string (an absolute
 * URL of this instance, a path with a query, another category's object)
 * cannot be matched with `IN`, so the values are read and parsed here:
 * - `namedKeys` reads every value once, for a pass that judges a whole category;
 * - `referenced` reads only the rows whose value holds one of the keys' plain
 *   runs (`keySearchCore`, a `LIKE '%run%'` each), fresh, for the question a
 *   delete asks last and for a release right after a user's change. A key with
 *   no such run reads everything, as `namedKeys` does.
 */
@Injectable()
export abstract class StorageReclaimSource implements StorageReferenceSource, OnApplicationBootstrap {
  abstract readonly id: StorageReferenceSourceId;
  abstract readonly claims: ReadonlyArray<StorageReferenceClaim>;
  /** How the values name objects besides the `/uploads/<category>/<key>` and `<category>/<key>` spellings. */
  protected readonly keyOptions: StorageKeyOptions = {};

  constructor(
    private readonly registry: StorageReclaimRegistryService,
    protected readonly em: EntityManager,
  ) {}

  onApplicationBootstrap(): void {
    this.registry.register(this);
  }

  async namedKeys(category: ServedCategory): Promise<Set<string>> {
    if (!this.claimsCategory(category)) return new Set();
    return keysNamedIn(category, await this.storedValues(null), this.keyOptions);
  }

  async referenced(category: ServedCategory, keys: readonly string[]): Promise<Set<string>> {
    if (keys.length === 0 || !this.claimsCategory(category)) return new Set();
    const cores = keys.map(keySearchCore);
    const narrow = cores.every((core): core is string => core !== null) ? [...new Set(cores)] : null;
    const named = keysNamedIn(category, await this.storedValues(narrow), this.keyOptions);
    return new Set(keys.filter((key) => named.has(key.toLowerCase())));
  }

  /**
   * The values the owner's columns hold that may name a stored object; null
   * and empty ones may be among them. With `containing`, only the rows whose
   * value holds one of these lowercase runs are needed (`likeAny` builds the
   * filter); more rows are fine, fewer would lose an object.
   */
  protected abstract storedValues(containing: readonly string[] | null): Promise<Iterable<string | null | undefined>>;

  private claimsCategory(category: ServedCategory): boolean {
    return this.claims.some((claim) => claim.category === category);
  }
}

/**
 * The filter a source narrows its columns with: rows where one of `fields`
 * holds one of the runs, or every row where one of them is set when there are
 * none to narrow by. The runs are `[a-z0-9-]` only, so they need no LIKE
 * escaping; SQLite's LIKE ignores ASCII case, as the parser does.
 */
export function likeAny<T>(
  fields: ReadonlyArray<keyof T & string>,
  containing: readonly string[] | null,
): FilterQuery<T> {
  const terms =
    containing === null
      ? fields.map((field) => ({ [field]: { $ne: null } }))
      : fields.flatMap((field) => containing.map((run) => ({ [field]: { $like: `%${run}%` } })));
  return { $or: terms } as unknown as FilterQuery<T>;
}
