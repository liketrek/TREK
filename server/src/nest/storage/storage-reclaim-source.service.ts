import { logWarn } from '../audit/audit-log.logger';
import { StorageReclaimRegistryService } from './storage-reclaim-registry.service';
import {
  keySearchCore,
  keysNamedIn,
  storageKeysIn,
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
 * - `namedKeysByCategory` reads every value once and parses it for every
 *   category asked, for a pass that judges them all;
 * - `namedKeys` reads every value once for one category, fresh, for the
 *   question a pass asks right before it deletes;
 * - `referenced` reads only the rows whose value holds one of the keys' plain
 *   runs (`keySearchCore`, a `LIKE '%run%'` each, at most MAX_LIKE_TERMS per
 *   query, as many queries as the keys need), for the release queue. A key
 *   with no such run is answered from one whole read; the release queue never
 *   asks about such a key, it leaves it to the nightly pass.
 *
 * The rows are read through the owner's TrekRepository, whose reads skip the
 * identity map, so a pass over a large table keeps no entities alive.
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

  async namedKeysByCategory(categories: readonly ServedCategory[]): Promise<Map<ServedCategory, Set<string>>> {
    const asked = new Set(categories.filter((category) => this.claimsCategory(category)));
    const named = new Map<ServedCategory, Set<string>>([...asked].map((category) => [category, new Set<string>()]));
    if (asked.size === 0) return named;
    for (const value of await this.storedValues(null)) {
      for (const ref of storageKeysIn(value, this.keyOptions)) {
        named.get(ref.category as ServedCategory)?.add(ref.key.toLowerCase());
      }
    }
    return named;
  }

  async referenced(category: ServedCategory, keys: readonly string[]): Promise<Set<string>> {
    if (keys.length === 0 || !this.claimsCategory(category)) return new Set();
    const cores = keys.map(keySearchCore);
    const named = new Set<string>();
    if (cores.some((core) => core === null)) {
      for (const key of keysNamedIn(category, await this.storedValues(null), this.keyOptions)) named.add(key);
    } else {
      const runs = [...new Set(cores.filter((core): core is string => core !== null))];
      await chunked(runs, RUNS_PER_QUERY).reduce<Promise<void>>(async (previous, page) => {
        await previous;
        const values = await this.storedValues(page);
        for (const key of keysNamedIn(category, values, this.keyOptions)) named.add(key);
      }, Promise.resolve());
    }
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
 * The most LIKE terms one narrowed read may hold. SQLite parses an OR chain
 * as a left-deep tree and refuses one deeper than 1000, so a read is kept
 * far below that whatever it is asked about.
 */
export const MAX_LIKE_TERMS = 50;
/** Every source reads at most two columns, so this many runs keep one read within MAX_LIKE_TERMS. */
const RUNS_PER_QUERY = 25;

/**
 * The filter a source narrows its columns with: rows where one of `fields`
 * holds one of the runs, or every row where one of them is set when there are
 * none to narrow by. The runs are `[a-z0-9-]` only, so they need no LIKE
 * escaping; SQLite's LIKE ignores ASCII case, as the parser does. A filter
 * past MAX_LIKE_TERMS is refused rather than handed to SQLite.
 */
export function likeAny<T>(
  fields: ReadonlyArray<keyof T & string>,
  containing: readonly string[] | null,
): FilterQuery<T> {
  const terms =
    containing === null
      ? fields.map((field) => ({ [field]: { $ne: null } }))
      : fields.flatMap((field) => containing.map((run) => ({ [field]: { $like: `%${run}%` } })));
  if (terms.length > MAX_LIKE_TERMS) {
    logWarn(`[storage] a reference lookup asked for ${terms.length} LIKE terms, more than ${MAX_LIKE_TERMS}`);
    throw new Error(`a reference lookup may hold at most ${MAX_LIKE_TERMS} LIKE terms`);
  }
  return { $or: terms } as unknown as FilterQuery<T>;
}

function chunked<T>(items: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_page, i) => items.slice(i * size, (i + 1) * size));
}
