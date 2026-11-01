import { AppSettings } from '../../db/entities/AppSettings.entity';
import { StorageReclaimMarks } from '../../db/entities/StorageReclaimMarks.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import type {
  ReclaimMarkRow,
  StorageReclaimMarksRepository,
} from '../../db/repositories/StorageReclaimMarks.repository';
import { dbNow, parseDbTimestamp } from '../../db/types';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { logError, logInfo } from '../audit/audit-log.logger';
import { AuditService } from '../audit/audit.service';
import { DomainError } from '../common/domain-error';
import { DatabaseLifecycle } from '../database/database-lifecycle.service';
import { withRequestContext } from '../database/request-context';
import { StorageInstallService } from './storage-install.service';
import { StorageJobsService } from './storage-jobs.service';
import { StorageReclaimGuardService } from './storage-reclaim-guard.service';
import { StorageReclaimRegistryService } from './storage-reclaim-registry.service';
import { inReclaimScope, RECLAIM_LEDGER, reclaimableCategories, sharedLocationsOf } from './storage-reclaim.ledger';
import {
  deletedTotal,
  newProgress,
  reportOf,
  withConfirmations,
  type CategoryProgress,
  type ReclaimCandidate,
} from './storage-reclaim.report';
import {
  confirmationCovers,
  confirmationExpired,
  confirmationStale,
  overConfirmShare,
  RECLAIM_DELETE_KEY,
  RECLAIM_DELETE_REPORT_KEY,
  RECLAIM_REPORT_KEY,
  readReclaimConfirmations,
  readReclaimDeleteEnabled,
  readReclaimReport,
  writeReclaimConfirmations,
  type ReclaimConfirmations,
} from './storage-reclaim.settings';
import { storageOwnerMarkerInstall, type StorageReferenceSource } from './storage-reclaim.types';
import { StorageRegistryService } from './storage-registry.service';
import { STORAGE_RELEASE_JOB } from './storage-release.service';
import { StorageService } from './storage.service';
import { SERVED_CATEGORIES, type ServedCategory } from './storage.types';
import { MikroORM } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { StorageReclaimCategoryReport, StorageReclaimReport, StorageReclaimState } from '@trek/shared';

const HOUR_MS = 60 * 60 * 1000;
/** An object younger than this is never judged: every writer puts the bytes before it inserts the row. */
const RECLAIM_GRACE_MS = 24 * HOUR_MS;
/** How long an object must stay unreferenced, on every pass, before a pass may delete it. */
const RECLAIM_DELAY_MS = 7 * 24 * HOUR_MS;
/** Eligible objects per fresh read of every source right before their deletes. */
const FRESH_BATCH = 1000;
/** Stats and deletes in flight at once. */
const DELETE_CONCURRENCY = 20;
/** Marks per statement: four bound values each, well under SQLite's limit. */
const MARK_BATCH = 100;
/** Listed objects between two looks at whether a restore began, so a restore waits seconds, not a whole listing. */
const LIST_CHECK_EVERY = 500;
const JOB_NAME = 'a storage reclaim';

/** What each source names, per category, from the one read a pass makes of it; an Error when that read failed. */
type NamedCache = Map<StorageReferenceSource, Map<ServedCategory, Set<string>> | Error>;

interface PassContext {
  now: number;
  /** Null when this installation has no id: nothing is judged then. */
  installId: string | null;
  /** Deletes may go now; turned off for the rest of the pass once the switch reads off or a backup starts. */
  deleting: boolean;
  /** A backup turned deleting off: every category with something due says so. */
  backupHeld: boolean;
  sources: readonly StorageReferenceSource[];
  shared: ReadonlySet<ServedCategory>;
  confirmations: ReclaimConfirmations;
  /** Confirmations this pass found used up or run out, by the time they were given. */
  spent: Map<ServedCategory, number>;
  /** Read once, at the first category judged; each category's sets are dropped once it is judged. */
  named: NamedCache | null;
  epoch: number;
}

interface ReclaimRunOptions {
  /** Delete nothing, whatever the switch says. */
  reportOnly?: boolean;
  now?: Date;
}

/** A restore began, or the database was swapped under the pass: nothing it learnt before holds any more. */
class ReclaimStopped extends Error {}

/**
 * The reclaim pass (#2924): objects in upload storage that no row names any
 * more, found in two phases and, only when the admin switched deletion on,
 * deleted. A pass lists each category the ledger allows at its root, skips
 * objects younger than a day (the bytes of an upload land before its row),
 * reads every registered reference source once for the whole pass, and marks
 * the rest with the time it first saw them. An object goes only once its mark
 * is a week old, after a fresh read of every source right before its batch,
 * through `StorageService.delete` (so replicas follow and a demo keeps its
 * bytes). What a user deletes or replaces is queued for release instead
 * (StorageReleaseService); the pass is the net for whatever that left behind.
 *
 * Safety, each failing closed:
 * - a category whose sources are not all registered, whose location overlaps
 *   another category's, or where another installation's owner marker lies
 *   (or this one's cannot be written) is not judged (StorageReclaimGuardService);
 * - a failed listing or lookup skips the category for the night; no skip
 *   touches the marks, so one bad night does not restart the week;
 * - more than a fifth unreferenced deletes nothing until an admin confirmed
 *   the count they were shown (`confirm`), which no user action can do; the
 *   confirmation covers half as much again for two weeks, and is used up once
 *   the share is back under a fifth;
 * - a delete that fails on the backend stops deleting in that category;
 * - nothing is deleted while a backup reads the uploads (`backup_running`),
 *   once the switch is turned off mid-pass, or on a demo instance;
 * - a pass never runs beside a backfill, a category migration, a release tick
 *   or a restore (the one-job slot of StorageJobsService, which a restore
 *   waits on), and stops when a restore begins or the database is reopened.
 *
 * Which installation this is comes from a file in the data dir, not from the
 * database (StorageInstallService): a database restored, cloned or copied from
 * another one loses its switch, marks, confirmations and reports at boot, and
 * every reopen does the same.
 */
@Injectable()
export class StorageReclaimService implements OnModuleInit {
  constructor(
    private readonly storage: StorageService,
    private readonly registry: StorageRegistryService,
    private readonly references: StorageReclaimRegistryService,
    private readonly jobs: StorageJobsService,
    private readonly lifecycle: DatabaseLifecycle,
    private readonly runtimeEnv: RuntimeEnvService,
    private readonly audit: AuditService,
    private readonly orm: MikroORM,
    private readonly install: StorageInstallService,
    private readonly guard: StorageReclaimGuardService,
    @InjectRepository(StorageReclaimMarks) private readonly marks: StorageReclaimMarksRepository,
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
  ) {}

  onModuleInit(): void {
    this.lifecycle.onReopened(async () => {
      this.guard.forget();
      await this.install.afterReopen();
    });
  }

  /**
   * Read only, so the admin state's GET never writes (the install id file is
   * made at boot). A category whose live confirmation covers its count reads
   * as no longer waiting for one, before the next pass says so too.
   */
  async state(): Promise<StorageReclaimState> {
    const installId = this.install.installId();
    const lastRun = await readReclaimReport(this.appSettings, RECLAIM_REPORT_KEY);
    const confirmations = installId === null ? {} : await readReclaimConfirmations(this.appSettings, installId);
    return {
      deleteEnabled: installId !== null && (await readReclaimDeleteEnabled(this.appSettings, installId)),
      running: this.jobs.exclusiveHolder === JOB_NAME,
      lastRun: lastRun === null ? null : withConfirmations(lastRun, confirmations, Date.now()),
      lastDeleteRun: await readReclaimReport(this.appSettings, RECLAIM_DELETE_REPORT_KEY),
    };
  }

  /** 409 `reclaim_install_unknown` when this installation has no id to bind the switch to. */
  async setDeleteEnabled(enabled: boolean): Promise<StorageReclaimState> {
    if (enabled) await this.appSettings.upsertOrReplace(RECLAIM_DELETE_KEY, this.requireInstallId());
    else await this.appSettings.deleteValue(RECLAIM_DELETE_KEY);
    return await this.state();
  }

  /**
   * The admin lets the pass delete in a category whose unreferenced share is
   * over a fifth, for the count they were shown (`shown`). 409
   * `reclaim_nothing_to_confirm` when the last report holds nothing waiting
   * there, `reclaim_confirm_stale` when its count is no longer the one shown.
   */
  async confirm(category: ServedCategory, shown: number): Promise<StorageReclaimState> {
    const installId = this.requireInstallId();
    const row = (await readReclaimReport(this.appSettings, RECLAIM_REPORT_KEY))?.categories[category];
    if (!row?.confirmationRequired) {
      throw refusal('reclaim_nothing_to_confirm', 'nothing in this category waits for a confirmation');
    }
    if (confirmationStale(shown, row.unreferenced.objects)) {
      throw refusal('reclaim_confirm_stale', 'the last check found another count since, reload and confirm again');
    }
    const confirmations = await readReclaimConfirmations(this.appSettings, installId);
    await writeReclaimConfirmations(this.appSettings, installId, {
      ...confirmations,
      [category]: { count: shown, confirmedAt: Date.now() },
    });
    return await this.state();
  }

  /**
   * One pass over every category in the caller, its report persisted and
   * returned: the nightly job's. Refuses with a 409 on a demo instance and
   * while another storage job holds the slot; a release tick is waited for.
   */
  async run(options: ReclaimRunOptions = {}): Promise<StorageReclaimReport> {
    await this.releaseTickDone();
    this.claimSlot();
    try {
      return await this.pass(options.reportOnly === true, options.now ?? new Date());
    } finally {
      this.jobs.releaseExclusive(JOB_NAME);
    }
  }

  /**
   * A report-only pass in the background, for the admin's check: it can take
   * longer than a proxy waits for an answer. The same refusals as `run`, at
   * once; the report lands on the admin state, which says `running` meanwhile.
   */
  async start(): Promise<void> {
    await this.releaseTickDone();
    this.claimSlot();
    void withRequestContext(this.orm, () => this.pass(true, new Date()))
      .catch((err: unknown) => {
        logError(`[storage] the reclaim check failed: ${messageOf(err)}`);
      })
      .finally(() => {
        this.jobs.releaseExclusive(JOB_NAME);
      });
  }

  /** A release tick holds the slot for seconds: a pass waits for it rather than losing its night. */
  private async releaseTickDone(): Promise<void> {
    if (this.jobs.exclusiveHolder === STORAGE_RELEASE_JOB) await this.jobs.exclusiveIdle();
  }

  private claimSlot(): void {
    if (this.runtimeEnv.isDemoMode()) throw refusal('reclaim_demo', 'storage reclaim does not run on a demo instance');
    if (!this.jobs.claimExclusive(JOB_NAME)) {
      throw refusal('reclaim_busy', 'another storage job is running, one storage job at a time');
    }
  }

  private requireInstallId(): string {
    const installId = this.install.installId();
    if (installId === null) {
      throw refusal('reclaim_install_unknown', 'this installation has no install id file, so nothing is reclaimed');
    }
    return installId;
  }

  /**
   * @txIndependent a sweep in passes: each category's marks and each delete
   * stand on their own, and a pass cut short leaves the work done so far valid.
   */
  private async pass(reportOnly: boolean, now: Date): Promise<StorageReclaimReport> {
    const wallStart = Date.now();
    const installId = this.install.installId();
    const deleting = !reportOnly && installId !== null && (await readReclaimDeleteEnabled(this.appSettings, installId));
    const ctx: PassContext = {
      now: now.getTime(),
      installId,
      deleting,
      backupHeld: false,
      sources: [...this.references.sources()],
      shared: sharedLocationsOf(this.registry),
      confirmations: installId === null ? {} : await readReclaimConfirmations(this.appSettings, installId),
      spent: new Map(),
      named: null,
      epoch: this.install.epoch,
    };
    const categories = {} as Record<ServedCategory, StorageReclaimCategoryReport>;
    let stopped: StorageReclaimReport['stopped'] = null;
    await SERVED_CATEGORIES.reduce<Promise<void>>(async (previous, category) => {
      await previous;
      const progress = newProgress();
      if (!RECLAIM_LEDGER[category].reclaim) {
        progress.skipped = 'not_reclaimed';
      } else if (stopped !== null) {
        progress.skipped = 'interrupted';
      } else {
        try {
          await this.reclaimCategory(category, ctx, progress);
        } catch (err) {
          stopped = err instanceof ReclaimStopped ? 'database_reopened' : 'failed';
          if (stopped === 'failed') logError(`[storage] the reclaim pass failed in '${category}': ${messageOf(err)}`);
          progress.skipped = 'interrupted';
        }
      }
      categories[category] = reportOf(progress);
    }, Promise.resolve());
    ctx.named = null;
    const report: StorageReclaimReport = {
      startedAt: ctx.now,
      finishedAt: ctx.now + (Date.now() - wallStart),
      mode: deleting ? 'delete' : 'report',
      stopped,
      categories,
    };
    if (stopped !== 'database_reopened') await this.pruneConfirmations(ctx);
    await this.persist(report);
    return report;
  }

  /**
   * Drops the confirmations the pass found used up (the share is back under
   * a fifth) or run out, unless an admin gave a new one meanwhile.
   *
   * @txStandalone one read and one write of the confirmations row, complete on its own.
   */
  private async pruneConfirmations(ctx: PassContext): Promise<void> {
    if (ctx.spent.size === 0 || ctx.installId === null) return;
    const current = await readReclaimConfirmations(this.appSettings, ctx.installId);
    const kept: ReclaimConfirmations = {};
    for (const [category, confirmation] of Object.entries(current) as Array<
      [ServedCategory, ReclaimConfirmations[ServedCategory]]
    >) {
      if (confirmation && ctx.spent.get(category) !== confirmation.confirmedAt) kept[category] = confirmation;
    }
    await writeReclaimConfirmations(this.appSettings, ctx.installId, kept);
  }

  /**
   * The report as the last pass's, and as the last deleting pass's when it ran
   * with deletion on; an audit entry (the system as actor) when it deleted.
   *
   * @txIndependent each row stands on its own: the report, the delete report
   * and the audit entry describe one finished pass, whichever of them lands.
   */
  private async persist(report: StorageReclaimReport): Promise<void> {
    const text = JSON.stringify(report);
    await this.appSettings.upsertOrReplace(RECLAIM_REPORT_KEY, text);
    if (report.mode !== 'delete') return;
    await this.appSettings.upsertOrReplace(RECLAIM_DELETE_REPORT_KEY, text);
    const deleted = deletedTotal(report);
    if (deleted.objects === 0) return;
    await this.audit.writeAudit({
      userId: null,
      action: 'storage.reclaim_deleted',
      details: {
        deleted: deleted.objects,
        bytes: deleted.bytes,
        ...(report.stopped ? { stopped: report.stopped } : {}),
        categories: Object.fromEntries(
          Object.entries(report.categories)
            .filter(([, row]) => row.deleted.objects > 0)
            .map(([category, row]) => [category, row.deleted.objects]),
        ),
      },
    });
  }

  /**
   * Judges one category into `progress`, which the caller reports even when
   * this throws part way.
   *
   * @txIndependent a sweep in passes: marks are written per batch and every
   * delete stands alone, so a failure part way keeps what came before.
   */
  private async reclaimCategory(category: ServedCategory, ctx: PassContext, progress: CategoryProgress): Promise<void> {
    const judged = this.guard.judgeable(category, ctx.sources, ctx.shared);
    if ('refused' in judged) {
      progress.skipped = judged.refused;
      return;
    }
    const { sources } = judged;

    let listed: { objects: number; old: ReclaimCandidate[]; owners: Set<string> };
    try {
      listed = await this.listOld(category, ctx);
    } catch (err) {
      if (err instanceof ReclaimStopped) throw err;
      logError(`[storage] reclaim could not list '${category}': ${messageOf(err)}`);
      progress.skipped = 'list_failed';
      return;
    }
    progress.objects = listed.objects;
    const owner =
      ctx.installId === null
        ? 'owner_unknown'
        : await this.guard.ownerVerdict(category, listed.owners, ctx.installId, ctx.now);
    if (owner !== null) {
      progress.skipped = owner;
      return;
    }

    let named: Set<string>;
    try {
      named = await this.namedIn(category, sources, ctx);
    } catch (err) {
      logError(`[storage] reclaim could not check the references of '${category}': ${messageOf(err)}`);
      progress.skipped = 'source_failed';
      return;
    }
    this.assertSameDatabase(ctx);
    const unreferenced = listed.old.filter((candidate) => !named.has(candidate.key.toLowerCase()));
    progress.unreferenced = unreferenced;

    const marks = new Map((await this.marks.marksOf(category)).map((mark) => [mark.key, mark]));
    await this.writeMarks(category, unreferenced, marks, ctx.now);
    const cutoff = ctx.now - RECLAIM_DELAY_MS;
    progress.eligible = unreferenced.filter((candidate) => markedBefore(marks.get(candidate.key), cutoff));
    const over = overConfirmShare(unreferenced.length, listed.objects);
    this.noteConfirmation(category, over, ctx);
    progress.confirmationRequired =
      over && !confirmationCovers(ctx.confirmations[category], unreferenced.length, ctx.now);
    if (progress.confirmationRequired || progress.eligible.length === 0) return;
    if (ctx.deleting) await this.deleteEligible(category, sources, ctx, progress);
    else if (ctx.backupHeld) progress.skipped = 'backup_running';
  }

  /** A confirmation is spent once the share is back under a fifth, and void once it ran out. */
  private noteConfirmation(category: ServedCategory, over: boolean, ctx: PassContext): void {
    const confirmation = ctx.confirmations[category];
    if (!confirmation) return;
    if (!over || confirmationExpired(confirmation, ctx.now)) ctx.spent.set(category, confirmation.confirmedAt);
  }

  /** The root-level objects of a category, of them the ones past the grace period, and the owner markers there. */
  private async listOld(
    category: ServedCategory,
    ctx: PassContext,
  ): Promise<{ objects: number; old: ReclaimCandidate[]; owners: Set<string> }> {
    let objects = 0;
    let seen = 0;
    const old: ReclaimCandidate[] = [];
    const owners = new Set<string>();
    for await (const stat of this.storage.list(category, '', { shallow: true })) {
      seen += 1;
      if (seen % LIST_CHECK_EVERY === 0) this.assertSameDatabase(ctx);
      if (!inReclaimScope(stat.key)) continue;
      const owner = storageOwnerMarkerInstall(stat.key);
      if (owner !== null) {
        owners.add(owner);
        continue;
      }
      objects += 1;
      // A missing or zero modification time reads as infinitely old: such an object is kept.
      if (!(stat.mtimeMs > 0) || ctx.now - stat.mtimeMs < RECLAIM_GRACE_MS) continue;
      old.push({ key: stat.key, size: stat.size });
    }
    return { objects, old, owners };
  }

  /**
   * Every key of the category some source names, lowercased, from the one read
   * of each source the pass makes at its first judged category; the category's
   * sets are dropped once they are merged, so memory falls as the pass goes.
   */
  private async namedIn(
    category: ServedCategory,
    sources: readonly StorageReferenceSource[],
    ctx: PassContext,
  ): Promise<Set<string>> {
    const cache = (ctx.named ??= await this.readNamed(ctx.sources));
    const named = new Set<string>();
    for (const source of sources) {
      const answer = cache.get(source);
      if (answer === undefined) throw new Error(`the source '${source.id}' was not read`);
      if (answer instanceof Error) throw answer;
      for (const key of answer.get(category) ?? []) named.add(key);
    }
    for (const answer of cache.values()) if (!(answer instanceof Error)) answer.delete(category);
    return named;
  }

  /** One read of each source for every reclaimable category, one source after another to bound memory. */
  private async readNamed(sources: readonly StorageReferenceSource[]): Promise<NamedCache> {
    const categories = reclaimableCategories();
    const cache: NamedCache = new Map();
    await sources.reduce<Promise<void>>(async (previous, source) => {
      await previous;
      try {
        cache.set(source, await source.namedKeysByCategory(categories));
      } catch (err) {
        logError(`[storage] reclaim could not read the reference source '${source.id}': ${messageOf(err)}`);
        cache.set(source, err instanceof Error ? err : new Error(String(err)));
      }
    }, Promise.resolve());
    return cache;
  }

  /** Every key of the category some source names right now, lowercased: the fresh read before deletes. */
  private async namedNow(category: ServedCategory, sources: readonly StorageReferenceSource[]): Promise<Set<string>> {
    const answers = await Promise.all(sources.map((source) => source.namedKeys(category)));
    const named = new Set<string>();
    for (const answer of answers) for (const key of answer) named.add(key.toLowerCase());
    return named;
  }

  /**
   * @txIndependent a mark batch stands on its own: a pass that stops between
   * two leaves marks that are each true.
   */
  private async writeMarks(
    category: ServedCategory,
    unreferenced: readonly ReclaimCandidate[],
    marks: ReadonlyMap<string, ReclaimMarkRow>,
    now: number,
  ): Promise<void> {
    const seenAt = dbNow(new Date(now));
    const fresh = unreferenced.filter((candidate) => !marks.has(candidate.key));
    const still = new Set(unreferenced.map((candidate) => candidate.key));
    const stale = [...marks.keys()].filter((key) => !still.has(key));
    await chunk(fresh, MARK_BATCH).reduce<Promise<void>>(async (previous, page) => {
      await previous;
      await this.marks.insertMissing(category, page, seenAt);
    }, Promise.resolve());
    await chunk(stale, MARK_BATCH).reduce<Promise<void>>(async (previous, page) => {
      await previous;
      await this.marks.deleteKeys(category, page);
    }, Promise.resolve());
  }

  /**
   * The eligible objects a batch at a time, while deleting may still go; a
   * batch whose backend failed stops the category with `delete_failed`, a
   * backup that started stops it with `backup_running`.
   *
   * @txIndependent a batch at a time, each delete standing alone, so a failure
   * leaves the others' work standing.
   */
  private async deleteEligible(
    category: ServedCategory,
    sources: readonly StorageReferenceSource[],
    ctx: PassContext,
    progress: CategoryProgress,
  ): Promise<void> {
    await chunk(progress.eligible, FRESH_BATCH).reduce<Promise<void>>(async (previous, batch) => {
      await previous;
      if (progress.skipped !== null) return;
      if (!(await this.mayDelete(ctx))) {
        if (ctx.backupHeld) progress.skipped = 'backup_running';
        return;
      }
      this.assertSameDatabase(ctx);
      const failed = await this.deleteBatch(category, batch, sources, ctx, progress);
      if (failed) progress.skipped = 'delete_failed';
    }, Promise.resolve());
  }

  /** Deleting goes on while the switch stays on and no backup reads the uploads; once off, off for the pass. */
  private async mayDelete(ctx: PassContext): Promise<boolean> {
    if (!ctx.deleting || ctx.installId === null) return false;
    if (this.jobs.backupRunning) {
      ctx.deleting = false;
      ctx.backupHeld = true;
      logInfo('[storage] a backup is reading the uploads: this reclaim pass deletes nothing more, the next one will');
    } else if (!(await readReclaimDeleteEnabled(this.appSettings, ctx.installId))) {
      ctx.deleting = false;
    }
    return ctx.deleting;
  }

  /**
   * Checks each object is still the old one the pass judged, reads every
   * source again, fresh and whole, and deletes what none of them names. The
   * read goes last so nothing slower than the deletes sits between the answer
   * and them. True when the backend failed, so the category stops.
   *
   * @txIndependent every object goes on its own; its mark goes after it.
   */
  private async deleteBatch(
    category: ServedCategory,
    batch: readonly ReclaimCandidate[],
    sources: readonly StorageReferenceSource[],
    ctx: PassContext,
    progress: CategoryProgress,
  ): Promise<boolean> {
    let stats: Awaited<ReturnType<StorageService['stat']>>[];
    try {
      stats = await inGroups(batch, (candidate) => this.storage.stat(category, candidate.key));
    } catch (err) {
      logError(`[storage] reclaim stopped deleting in '${category}', the backend failed: ${messageOf(err)}`);
      return true;
    }
    // Gone, or written again since it was judged: the next pass looks at it afresh.
    const changed = batch.filter((_candidate, i) => {
      const stat = stats[i];
      return !stat || !(stat.mtimeMs > 0) || ctx.now - stat.mtimeMs < RECLAIM_GRACE_MS;
    });
    if (changed.length > 0) await this.marks.deleteKeys(category, keysOf(changed));
    const due = batch.filter(
      (candidate) => !changed.includes(candidate) && !this.storage.keepsOnDelete(category, candidate.key),
    );
    if (due.length === 0) return false;
    let referenced: Set<string>;
    try {
      referenced = await this.namedNow(category, sources);
    } catch (err) {
      logError(
        `[storage] reclaim kept ${due.length} '${category}' object(s), their re-check failed: ${messageOf(err)}`,
      );
      return false;
    }
    const named = due.filter((candidate) => referenced.has(candidate.key.toLowerCase()));
    if (named.length > 0) await this.marks.deleteKeys(category, keysOf(named));
    const unnamed = due.filter((candidate) => !referenced.has(candidate.key.toLowerCase()));
    this.assertSameDatabase(ctx);
    const deleted: ReclaimCandidate[] = [];
    let failure: unknown = null;
    await chunk(unnamed, DELETE_CONCURRENCY).reduce<Promise<void>>(async (previous, group) => {
      await previous;
      if (failure !== null) return;
      const results = await Promise.allSettled(group.map((candidate) => this.storage.delete(category, candidate.key)));
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') deleted.push(group[i] as ReclaimCandidate);
        else failure ??= result.reason;
      });
    }, Promise.resolve());
    progress.deleted.push(...deleted);
    if (deleted.length > 0) await this.marks.deleteKeys(category, keysOf(deleted));
    if (failure === null) return false;
    logError(`[storage] reclaim stopped deleting in '${category}' after a failed delete: ${messageOf(failure)}`);
    return true;
  }

  /** A restore that began, or a reopen that happened, since the pass started ends it. */
  private assertSameDatabase(ctx: PassContext): void {
    if (this.jobs.restoreRunning) throw new ReclaimStopped('a restore began during the pass');
    if (this.install.epoch !== ctx.epoch) throw new ReclaimStopped('the database was reopened during the pass');
  }
}

/** A 409 whose body names the refusal in `code` next to the text, so the client can say it in the user's language. */
function refusal(
  code:
    | 'reclaim_busy'
    | 'reclaim_demo'
    | 'reclaim_nothing_to_confirm'
    | 'reclaim_confirm_stale'
    | 'reclaim_install_unknown',
  message: string,
): DomainError {
  return new DomainError(409, message, { code, details: { code } });
}

function markedBefore(mark: ReclaimMarkRow | undefined, cutoff: number): boolean {
  const firstSeen = parseDbTimestamp(mark?.first_seen_at);
  return firstSeen !== null && firstSeen.getTime() <= cutoff;
}

function keysOf(candidates: readonly ReclaimCandidate[]): string[] {
  return candidates.map((candidate) => candidate.key);
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_page, i) => items.slice(i * size, (i + 1) * size));
}

/** `work` over every item, DELETE_CONCURRENCY at a time, the answers in order; the first failure rejects. */
async function inGroups<T, R>(items: readonly T[], work: (item: T) => Promise<R>): Promise<R[]> {
  const answers: R[] = [];
  await chunk(items, DELETE_CONCURRENCY).reduce<Promise<void>>(async (previous, group) => {
    await previous;
    answers.push(...(await Promise.all(group.map(work))));
  }, Promise.resolve());
  return answers;
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
