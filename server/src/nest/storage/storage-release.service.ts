import { StorageReleaseQueue } from '../../db/entities/StorageReleaseQueue.entity';
import type {
  ReleaseQueueRow,
  StorageReleaseQueueRepository,
} from '../../db/repositories/StorageReleaseQueue.repository';
import { dbNow } from '../../db/types';
import { logDebug, logWarn } from '../audit/audit-log.logger';
import { UnitOfWork } from '../database/unit-of-work';
import { StorageInstallService } from './storage-install.service';
import { StorageJobsService } from './storage-jobs.service';
import { isValidKey } from './storage-keys';
import { StorageReclaimGuardService } from './storage-reclaim-guard.service';
import { StorageReclaimRegistryService } from './storage-reclaim-registry.service';
import { inReclaimScope, RECLAIM_LEDGER, reclaimableCategories, sharedLocationsOf } from './storage-reclaim.ledger';
import {
  keySearchCore,
  storageKeysIn,
  storageOwnerMarkerInstall,
  type StorageKeyOptions,
  type StorageReferenceSource,
} from './storage-reclaim.types';
import { StorageRegistryService } from './storage-registry.service';
import { StorageService } from './storage.service';
import { SERVED_CATEGORIES, type ServedCategory } from './storage.types';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

const HOUR_MS = 60 * 60 * 1000;
/**
 * How long a released object waits before the queue may delete it: longer
 * than every window in TREK that can write a value back that names it.
 * - the assistant: a change card's undo lasts 15 minutes (UNDO_WINDOW_MS), and
 *   a proposed change may be approved for 24 hours (APPROVAL_TTL_MS), so a
 *   change proposed with an old cover path can still be applied a day later;
 * - the offline mutation queue retries a write the server failed with a 5xx
 *   for about two hours (MAX_SERVER_ERROR_ATTEMPTS, doubling from 30 s);
 * - the planner's own undo (usePlannerHistory) and a write queued while
 *   offline are bounded by nothing but the tab and the outage: those are
 *   unbounded, and the place undo does not offer to undo a delete that took an
 *   uploaded image (placeUndo.ts) for that reason.
 * So the longest bounded window is a day; two hours on top cover the clock
 * and the job's interval. What comes back later than that finds the object
 * gone, as it did before the reclaim when every delete was immediate.
 */
export const RELEASE_DELAY_MS = 26 * HOUR_MS;
/** A queued row older than this past its time belongs to the nightly pass: its category stayed refused. */
const QUEUE_MAX_AGE_MS = 30 * 24 * HOUR_MS;
/** Keys one stored value may queue: a value naming more than that is no upload path of ours. */
const MAX_KEYS_PER_VALUE = 16;
/** Keys one call may queue; the rest is the nightly pass's. */
const MAX_KEYS_PER_CALL = 1000;
/** No more rows than this wait at once; a release past it is the nightly pass's. */
const QUEUE_LIMIT = 50_000;
/** Rows per insert: three bound values each. */
const ENQUEUE_BATCH = 100;
/** Rows one tick looks at, shared equally between the categories it may judge. */
const TICK_LIMIT = 200;
/** Keys per question to the sources. */
const ASK_BATCH = 50;
/** Deletes in flight at once. */
const DELETE_CONCURRENCY = 10;

const SERVED = new Set<string>(SERVED_CATEGORIES);

/** The name a release tick holds the one-job slot under. */
export const STORAGE_RELEASE_JOB = 'a storage release';

export interface ReleaseTickResult {
  /** Why the tick did nothing, or null when it ran. */
  skipped: 'busy' | 'no_install_id' | 'install_mismatch' | null;
  deleted: number;
  /** Rows dropped because a row still names the object, or the instance keeps it. */
  kept: number;
}

/** A restore began, a backup started or the database was swapped mid-tick: the rest waits for the next one. */
class ReleaseStopped extends Error {}

/**
 * What a user's change left unnamed: a replaced or removed cover, place image
 * or avatar, a deleted journey photo or trip file. The owner hands the values
 * its rows held to `releaseValues` once its transaction committed, and every
 * object they name is queued, which is all the request pays. Nothing goes
 * before RELEASE_DELAY_MS, so an undo or a late write that brings the value
 * back keeps its object.
 *
 * A job (StorageReleaseJob) then takes the due rows, asks every registered
 * reference source again about them (the nightly pass's sources and parser)
 * and deletes only what none of them names, through `StorageService.delete`
 * (replicas follow, a demo keeps its bytes); the row goes either way. So an
 * object a trip copy, a journey or a saved place still shows stays (#2924),
 * while a deleted photo still goes as it did before, a day later.
 *
 * The queue refuses what the pass refuses (StorageReclaimGuardService): only
 * the root of a reclaimable category, never an owner marker, never where a
 * required source is missing, where the category's location overlaps another
 * one's, or where another installation's owner marker lies (or this one's
 * cannot be written). It does nothing while a restore or a backup runs or
 * another storage job holds the slot, without an install id, and while the
 * database names another installation or a restore's reset is still pending
 * (StorageInstallService.databaseIsThis). A refused category's rows wait, up
 * to QUEUE_MAX_AGE_MS; what is dropped then, or never queued because the queue
 * was full, is logged and left to the nightly pass. Releases run whatever the
 * nightly deletion switch says: they are what a delete always did. Queueing
 * never fails the caller's request.
 */
@Injectable()
export class StorageReleaseService {
  constructor(
    private readonly storage: StorageService,
    private readonly registry: StorageRegistryService,
    private readonly references: StorageReclaimRegistryService,
    private readonly jobs: StorageJobsService,
    private readonly install: StorageInstallService,
    private readonly guard: StorageReclaimGuardService,
    private readonly uow: UnitOfWork,
    @InjectRepository(StorageReleaseQueue) private readonly queue: StorageReleaseQueueRepository,
  ) {}

  /**
   * Queues the objects these stored values name (any spelling a column holds)
   * for a release once they are due; answers how many were queued. Never
   * throws: what it cannot queue is the nightly pass's.
   *
   * @txStandalone a queue row stands on its own whatever the caller wrote:
   * the job asks every source again before anything goes.
   */
  async releaseValues(
    values: ReadonlyArray<string | null | undefined>,
    options: StorageKeyOptions = {},
  ): Promise<number> {
    try {
      const rows = releasable(values, options);
      if (rows.length === 0) return 0;
      const waiting = await this.queue.size();
      if (waiting + rows.length > QUEUE_LIMIT) {
        logWarn(
          `[storage] the release queue is full (${waiting} of ${QUEUE_LIMIT} waiting): ${rows.length} released ` +
            `object(s) are left to the nightly pass, which removes them only once deletion is on`,
        );
        return 0;
      }
      const dueAt = dbNow(new Date(Date.now() + RELEASE_DELAY_MS));
      await this.uow.transactional(async () => {
        await chunk(rows, ENQUEUE_BATCH).reduce<Promise<void>>(async (previous, page) => {
          await previous;
          await this.queue.enqueue(page, dueAt);
        }, Promise.resolve());
      });
      return rows.length;
    } catch (err) {
      logWarn(`[storage] could not queue released objects, the nightly pass will find them: ${messageOf(err)}`);
      return 0;
    }
  }

  /**
   * One tick of the release job: the due rows of every category the guards
   * let through, at most TICK_LIMIT, each object deleted when no source names
   * it. Holds the one-job slot while it runs, so a restore waits for it and a
   * backfill or a migration never runs beside it.
   *
   * @txIndependent every delete and every dropped row stands on its own: a
   * tick cut short leaves the rest queued.
   */
  async processDue(now: Date = new Date()): Promise<ReleaseTickResult> {
    const result: ReleaseTickResult = { skipped: null, deleted: 0, kept: 0 };
    const installId = this.install.installId();
    if (installId === null) return { ...result, skipped: 'no_install_id' };
    // A reconcile that failed at boot leaves another installation's queue, or a restore's, in place.
    if (!(await this.install.databaseIsThis(installId))) return { ...result, skipped: 'install_mismatch' };
    if (this.jobs.backupRunning || !this.jobs.claimExclusive(STORAGE_RELEASE_JOB))
      return { ...result, skipped: 'busy' };
    try {
      await this.drain(installId, now.getTime(), this.install.epoch, result);
    } finally {
      this.jobs.releaseExclusive(STORAGE_RELEASE_JOB);
    }
    return result;
  }

  /** @txIndependent see processDue. */
  private async drain(installId: string, now: number, epoch: number, result: ReleaseTickResult): Promise<void> {
    await this.dropOverdue(now);
    const due = new Set(await this.queue.dueCategories(dbNow(new Date(now))));
    if (due.size === 0) return;
    const allowed = await this.allowedCategories(due, installId, now);
    const byCategory = await this.dueKeys([...allowed.keys()], now);
    try {
      await [...byCategory].reduce<Promise<void>>(async (previous, [category, keys]) => {
        await previous;
        await this.releaseCategory(category, keys, allowed.get(category) ?? [], epoch, result);
      }, Promise.resolve());
    } catch (err) {
      if (!(err instanceof ReleaseStopped)) throw err;
      logDebug(`[storage] a release tick stopped: ${err.message}`);
    }
  }

  /** Drops the rows that waited QUEUE_MAX_AGE_MS past their time, their category refused all along. */
  private async dropOverdue(now: number): Promise<void> {
    const dropped = await this.queue.deleteDueBefore(dbNow(new Date(now - QUEUE_MAX_AGE_MS)));
    if (dropped === 0) return;
    logWarn(
      `[storage] ${dropped} released object(s) waited 30 days past their time in a category the release may not ` +
        `judge: they are left to the nightly pass, which removes them only once deletion is on`,
    );
  }

  /**
   * The due keys of each category, the longest waiting first, at most an
   * equal share of TICK_LIMIT each: a category whose deletes keep failing
   * keeps only its own rows waiting, never another's.
   */
  private async dueKeys(categories: readonly ServedCategory[], now: number): Promise<Map<ServedCategory, string[]>> {
    const byCategory = new Map<ServedCategory, string[]>();
    if (categories.length === 0) return byCategory;
    const share = Math.ceil(TICK_LIMIT / categories.length);
    await categories.reduce<Promise<void>>(async (previous, category) => {
      await previous;
      const rows = await this.queue.dueIn(category, dbNow(new Date(now)), share);
      const keys = rows.map((row) => row.key);
      if (keys.length > 0) byCategory.set(category, keys);
    }, Promise.resolve());
    return byCategory;
  }

  /** Of the categories with rows due, the ones the guards let a release judge now, each with the sources to ask. */
  private async allowedCategories(
    due: ReadonlySet<string>,
    installId: string,
    now: number,
  ): Promise<Map<ServedCategory, StorageReferenceSource[]>> {
    const sources = this.references.sources();
    const shared = sharedLocationsOf(this.registry);
    const allowed = new Map<ServedCategory, StorageReferenceSource[]>();
    const asked = reclaimableCategories().filter((category) => due.has(category));
    await asked.reduce<Promise<void>>(async (previous, category) => {
      await previous;
      const judged = this.guard.judgeable(category, sources, shared);
      if ('refused' in judged) return;
      if ((await this.guard.cachedOwnerVerdict(category, installId, now)) !== null) return;
      allowed.set(category, judged.sources);
    }, Promise.resolve());
    return allowed;
  }

  /**
   * The due keys of one category, ASK_BATCH at a time: asked about, then
   * deleted when unnamed. A failed question or delete stops the category for
   * this tick and leaves its rows queued.
   *
   * @txIndependent every delete stands alone, its row goes after it.
   */
  private async releaseCategory(
    category: ServedCategory,
    keys: readonly string[],
    sources: readonly StorageReferenceSource[],
    epoch: number,
    result: ReleaseTickResult,
  ): Promise<void> {
    let failed = false;
    await chunk(keys, ASK_BATCH).reduce<Promise<void>>(async (previous, batch) => {
      await previous;
      if (failed) return;
      this.assertUndisturbed(epoch);
      failed = await this.releaseBatch(category, batch, sources, epoch, result);
    }, Promise.resolve());
  }

  /** True when the batch failed part way, so the category stops for this tick. */
  private async releaseBatch(
    category: ServedCategory,
    batch: readonly string[],
    sources: readonly StorageReferenceSource[],
    epoch: number,
    result: ReleaseTickResult,
  ): Promise<boolean> {
    let referenced: Set<string>;
    try {
      referenced = await this.referencedIn(category, batch, sources);
    } catch (err) {
      logWarn(`[storage] could not ask about released '${category}' objects, they wait: ${messageOf(err)}`);
      return true;
    }
    const kept = batch.filter((key) => referenced.has(key.toLowerCase()) || this.storage.keepsOnDelete(category, key));
    const unnamed = batch.filter((key) => !kept.includes(key));
    this.assertUndisturbed(epoch);
    const deleted: string[] = [];
    let failure: unknown = null;
    await chunk(unnamed, DELETE_CONCURRENCY).reduce<Promise<void>>(async (previous, group) => {
      await previous;
      if (failure !== null) return;
      const results = await Promise.allSettled(group.map((key) => this.storage.delete(category, key)));
      results.forEach((settled, i) => {
        if (settled.status === 'fulfilled') deleted.push(group[i] as string);
        else failure ??= settled.reason;
      });
    }, Promise.resolve());
    await this.queue.deleteKeys(category, [...kept, ...deleted]);
    result.kept += kept.length;
    result.deleted += deleted.length;
    if (deleted.length > 0) logDebug(`[storage] released ${deleted.length} unreferenced '${category}' object(s)`);
    if (failure === null) return false;
    logWarn(`[storage] could not release a '${category}' object, it waits: ${messageOf(failure)}`);
    return true;
  }

  /**
   * The keys some source names right now, lowercased. A key no source can
   * narrow its read to (no plain run of 8 characters, which every name TREK
   * writes has) counts as named without a question: asking about it would read
   * whole tables, so it is the nightly pass's.
   */
  private async referencedIn(
    category: ServedCategory,
    batch: readonly string[],
    sources: readonly StorageReferenceSource[],
  ): Promise<Set<string>> {
    const referenced = new Set(batch.filter((key) => keySearchCore(key) === null).map((key) => key.toLowerCase()));
    const keys = batch.filter((key) => keySearchCore(key) !== null);
    if (keys.length === 0) return referenced;
    const answers = await Promise.all(
      sources.map(async (source) => {
        const asked = keys.filter((key) =>
          source.claims.some((claim) => claim.category === category && key.startsWith(claim.prefix)),
        );
        return asked.length === 0 ? new Set<string>() : await source.referenced(category, asked);
      }),
    );
    for (const answer of answers) for (const key of answer) referenced.add(key.toLowerCase());
    return referenced;
  }

  /** A restore or a backup that began, or a reopen that happened, since the tick started ends it. */
  private assertUndisturbed(epoch: number): void {
    if (this.jobs.restoreRunning) throw new ReleaseStopped('a restore began');
    if (this.jobs.backupRunning) throw new ReleaseStopped('a backup began');
    if (this.install.epoch !== epoch) throw new ReleaseStopped('the database was reopened');
  }
}

/**
 * The rows these values queue: root-level keys of reclaimable categories,
 * never an owner marker, at most MAX_KEYS_PER_VALUE per value and
 * MAX_KEYS_PER_CALL in all.
 */
function releasable(
  values: ReadonlyArray<string | null | undefined>,
  options: StorageKeyOptions,
): Array<Pick<ReleaseQueueRow, 'category' | 'key'>> {
  const seen = new Set<string>();
  const rows: Array<Pick<ReleaseQueueRow, 'category' | 'key'>> = [];
  for (const value of values) {
    const refs = storageKeysIn(value, options).filter(
      (ref) =>
        SERVED.has(ref.category) &&
        RECLAIM_LEDGER[ref.category as ServedCategory].reclaim &&
        inReclaimScope(ref.key) &&
        isValidKey(ref.key) &&
        storageOwnerMarkerInstall(ref.key) === null,
    );
    for (const ref of refs.slice(0, MAX_KEYS_PER_VALUE)) {
      const id = `${ref.category}\n${ref.key}`;
      if (seen.has(id) || rows.length >= MAX_KEYS_PER_CALL) continue;
      seen.add(id);
      rows.push({ category: ref.category, key: ref.key });
    }
  }
  return rows;
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_page, i) => items.slice(i * size, (i + 1) * size));
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
