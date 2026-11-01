import { logWarn } from '../audit/audit-log.logger';
import { StorageReclaimRegistryService } from './storage-reclaim-registry.service';
import { RECLAIM_LEDGER, sharedLocationsOf } from './storage-reclaim.ledger';
import { storageOwnerMarkerInstall, storageOwnerMarkerKey, type StorageReferenceSource } from './storage-reclaim.types';
import { StorageRegistryService } from './storage-registry.service';
import { StorageService } from './storage.service';
import type { ServedCategory } from './storage.types';
import { Injectable } from '@nestjs/common';

import { Readable } from 'node:stream';

/** Why a category may not be judged, before anything of it is listed. */
type CategoryRefusal = 'not_reclaimed' | 'sources_missing' | 'shared_location';
/** Why the place a category lives in may not be judged: another installation's, or one nobody can tell. */
type OwnerRefusal = 'foreign_install' | 'owner_unknown';

/**
 * How long the release queue trusts a verdict that let a category through: a
 * little more than one release interval (ten minutes), so a marker another
 * installation left since stops the next tick but one at the latest, and the
 * root is listed at most once in that time.
 */
const OWNER_ALLOWED_TTL_MS = 15 * 60 * 1000;
/** A refusal holds until the nightly pass judges again: it only ever keeps objects. */
const OWNER_REFUSAL_TTL_MS = 26 * 60 * 60 * 1000;
/** A failed look at the owner markers is not retried before this. */
const OWNER_FAILURE_TTL_MS = 60 * 60 * 1000;

interface CachedVerdict {
  verdict: OwnerRefusal | null;
  /** Where the category lived when it was judged: a changed storage config judges again. */
  location: string;
  until: number;
}

/**
 * The guards the reclaim pass and the release queue share, so a deferred
 * release refuses exactly what the nightly pass refuses:
 * - `judgeable`: the ledger reclaims the category, every source it requires
 *   answers for all of it, and its location overlaps no other category's;
 * - `ownerVerdict`: no other installation's owner marker lies where the
 *   category's objects do, and this one's could be written there.
 *
 * The owner verdict is cached per category with the location it was judged
 * at. The pass judges it from the listing it makes anyway; the release queue
 * reuses a refusal until the next night, but an allowed verdict only for
 * OWNER_ALLOWED_TTL_MS, and lists the category's root itself when there is no
 * verdict it may reuse: at most once per category in that window, since a
 * fresh verdict is cached again. The root is listed whole, filtered to the
 * markers here: the local driver reads a prefix as a folder, so it cannot be
 * asked for the `trek-owner-` names alone. So a release never deletes in a
 * category another installation's marker has reached for longer than that
 * window.
 */
@Injectable()
export class StorageReclaimGuardService {
  private readonly verdicts = new Map<ServedCategory, CachedVerdict>();

  constructor(
    private readonly storage: StorageService,
    private readonly registry: StorageRegistryService,
    private readonly references: StorageReclaimRegistryService,
  ) {}

  /**
   * The sources to ask about a category, or why it may not be judged. Pass
   * `sources` and `shared` to judge several categories against one snapshot.
   */
  judgeable(
    category: ServedCategory,
    sources: readonly StorageReferenceSource[] = this.references.sources(),
    shared: ReadonlySet<ServedCategory> = sharedLocationsOf(this.registry),
  ): { refused: CategoryRefusal } | { sources: StorageReferenceSource[] } {
    const rule = RECLAIM_LEDGER[category];
    if (!rule.reclaim) return { refused: 'not_reclaimed' };
    const claiming = sources.filter((source) => source.claims.some((claim) => claim.category === category));
    const whole = new Set(
      claiming
        .filter((source) => source.claims.some((claim) => claim.category === category && claim.prefix === ''))
        .map((source) => source.id),
    );
    if (rule.requiredSources.some((id) => !whole.has(id))) return { refused: 'sources_missing' };
    if (shared.has(category)) return { refused: 'shared_location' };
    return { sources: claiming };
  }

  /**
   * Whether this installation may judge where a category lives, from the
   * owner markers a listing of its root found: not where another one's marker
   * lies, and not where its own could not be written, since then a second
   * installation cannot see it either. Writes this one's marker when it is
   * missing, and caches the verdict.
   */
  async ownerVerdict(
    category: ServedCategory,
    owners: ReadonlySet<string>,
    installId: string,
    now: number = Date.now(),
  ): Promise<OwnerRefusal | null> {
    const location = this.locationOf(category);
    const verdict = await this.judgeOwners(category, owners, installId);
    const ttl = verdict === null ? OWNER_ALLOWED_TTL_MS : OWNER_REFUSAL_TTL_MS;
    this.verdicts.set(category, { verdict, location, until: now + ttl });
    return verdict;
  }

  /**
   * The owner verdict for a category, as the last judgement left it while that
   * is fresh (see OWNER_ALLOWED_TTL_MS) and holds for where the category lives
   * now; otherwise its root is listed for owner markers and judged afresh. A
   * listing that fails reads as `owner_unknown` for an hour.
   */
  async cachedOwnerVerdict(
    category: ServedCategory,
    installId: string,
    now: number = Date.now(),
  ): Promise<OwnerRefusal | null> {
    const cached = this.verdicts.get(category);
    if (cached && cached.until > now && cached.location === this.locationOf(category)) return cached.verdict;
    let owners: Set<string>;
    try {
      owners = await this.ownersAt(category);
    } catch (err) {
      logWarn(`[storage] could not look for owner markers in '${category}': ${messageOf(err)}`);
      this.verdicts.set(category, {
        verdict: 'owner_unknown',
        location: this.locationOf(category),
        until: now + OWNER_FAILURE_TTL_MS,
      });
      return 'owner_unknown';
    }
    return await this.ownerVerdict(category, owners, installId, now);
  }

  /** Forgets every verdict: the database or the installation they were judged for changed. */
  forget(): void {
    this.verdicts.clear();
  }

  private async judgeOwners(
    category: ServedCategory,
    owners: ReadonlySet<string>,
    installId: string,
  ): Promise<OwnerRefusal | null> {
    const foreign = [...owners].some((owner) => owner !== installId);
    if (!owners.has(installId)) {
      try {
        await this.storage.put(category, storageOwnerMarkerKey(installId), Readable.from([installId]), {
          contentType: 'text/plain',
        });
      } catch (err) {
        logWarn(`[storage] reclaim could not write its owner marker into '${category}': ${messageOf(err)}`);
        return foreign ? 'foreign_install' : 'owner_unknown';
      }
    }
    if (foreign) logWarn(`[storage] another TREK installation keeps its uploads where '${category}' does: not judged`);
    return foreign ? 'foreign_install' : null;
  }

  /** The owner markers at a category's root. */
  private async ownersAt(category: ServedCategory): Promise<Set<string>> {
    const owners = new Set<string>();
    for await (const stat of this.storage.list(category, '', { shallow: true })) {
      const owner = storageOwnerMarkerInstall(stat.key);
      if (owner !== null) owners.add(owner);
    }
    return owners;
  }

  /** Where a category lives now: its backend, prefix and the backends' settings. */
  private locationOf(category: ServedCategory): string {
    const { backendName, keyPrefix } = this.registry.resolve(category);
    return JSON.stringify([backendName, keyPrefix, this.registry.snapshot().backends]);
  }
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
