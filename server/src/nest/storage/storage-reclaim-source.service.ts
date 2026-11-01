import { StorageReclaimRegistryService } from './storage-reclaim-registry.service';
import {
  referencedAmong,
  type StorageKeyOptions,
  type StorageReferenceClaim,
  type StorageReferenceSource,
  type StorageReferenceSourceId,
} from './storage-reclaim.types';
import type { ServedCategory } from './storage.types';
import { EntityManager } from '@mikro-orm/core';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * The shape every owner's reference source shares: it registers itself with
 * the reclaim registry once the app is up, and answers a page of keys by
 * reading the values its own columns hold and parsing them with
 * `referencedAmong`, so no source carries a parser of its own.
 *
 * An owner extends this in its own domain, names its id and claims, and reads
 * its columns through `em.getRepository(<its own entity>)`; storage never
 * learns which tables those are. The values are read whole on every call:
 * a column that takes any string (an absolute URL of this instance, a path
 * with a query, another category's object) cannot be matched with `IN`, and
 * a re-check right before a delete must see the rows as they are now.
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

  async referenced(category: ServedCategory, keys: readonly string[]): Promise<Set<string>> {
    if (keys.length === 0 || !this.claims.some((claim) => claim.category === category)) return new Set();
    return referencedAmong(category, keys, await this.storedValues(), this.keyOptions);
  }

  /** Every value the owner's columns hold that may name a stored object; null and empty ones may be among them. */
  protected abstract storedValues(): Promise<Iterable<string | null | undefined>>;
}
