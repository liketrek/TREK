import { AppSettings } from '../../db/entities/AppSettings.entity';
import { StorageReclaimMarks } from '../../db/entities/StorageReclaimMarks.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import type {
  ReclaimMarkRow,
  StorageReclaimMarksRepository,
} from '../../db/repositories/StorageReclaimMarks.repository';
import { dbNow, parseDbTimestamp } from '../../db/types';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { logError, logInfo, logWarn } from '../audit/audit-log.logger';
import { AuditService } from '../audit/audit.service';
import { DomainError } from '../common/domain-error';
import { DatabaseLifecycle } from '../database/database-lifecycle.service';
import { withRequestContext } from '../database/request-context';
import { UnitOfWork } from '../database/unit-of-work';
import { StorageJobsService } from './storage-jobs.service';
import { StorageReclaimRegistryService } from './storage-reclaim-registry.service';
import { inReclaimScope, RECLAIM_LEDGER, sharedLocationsOf } from './storage-reclaim.ledger';
import {
  deletedTotal,
  newProgress,
  reportOf,
  type CategoryProgress,
  type ReclaimCandidate,
} from './storage-reclaim.report';
import {
  INSTALL_ID_KEY,
  RECLAIM_DELETE_KEY,
  RECLAIM_DELETE_REPORT_KEY,
  RECLAIM_REPORT_KEY,
  RECLAIM_RESET_KEYS,
  readReclaimConfirmations,
  readReclaimDeleteEnabled,
  readReclaimReport,
  writeReclaimConfirmations,
} from './storage-reclaim.settings';
import { storageOwnerMarkerInstall, storageOwnerMarkerKey, type StorageReferenceSource } from './storage-reclaim.types';
import { StorageRegistryService } from './storage-registry.service';
import { StorageService } from './storage.service';
import { SERVED_CATEGORIES, type ServedCategory } from './storage.types';
import { MikroORM } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap, type OnModuleInit } from '@nestjs/common';
import type { StorageReclaimCategoryReport, StorageReclaimReport, StorageReclaimState } from '@trek/shared';

import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';

const HOUR_MS = 60 * 60 * 1000;
/** An object younger than this is never judged: every writer puts the bytes before it inserts the row. */
const RECLAIM_GRACE_MS = 24 * HOUR_MS;
/** How long an object must stay unreferenced, on every pass, before a pass may delete it. */
const RECLAIM_DELAY_MS = 7 * 24 * HOUR_MS;
/** More unreferenced than this share of a category waits for an admin's confirmation before anything goes. */
const CONFIRM_SHARE = 0.2;
/** Keys per re-check right before a delete: one fresh, narrowed question to every source. */
const RECHECK_BATCH = 100;
/** Deletes in flight at once. */
const DELETE_CONCURRENCY = 20;
/** Marks per statement: four bound values each, well under SQLite's limit. */
const MARK_BATCH = 100;
/** Listed objects between two looks at whether a restore began, so a restore waits seconds, not a whole listing. */
const LIST_CHECK_EVERY = 500;
const JOB_NAME = 'a storage reclaim';
const INSTALL_ID = /^[a-z0-9-]{8,64}$/;

interface PassContext {
  now: number;
  installId: string;
  /** Deletes may go now; turned off for the rest of the pass once the switch reads off or a backup starts. */
  deleting: boolean;
  sources: readonly StorageReferenceSource[];
  shared: ReadonlySet<ServedCategory>;
  confirmed: Partial<Record<ServedCategory, number>>;
  generation: number;
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
 * reads once per category what every registered reference source names, and
 * marks the rest with the time it first saw them. An object goes only once its
 * mark is a week old, after one more fresh question to every source about its
 * batch, through `StorageService.delete` (so replicas follow and a demo keeps
 * its bytes). What a user deletes or replaces is released at once instead
 * (StorageReleaseService); the pass is the net for whatever that left behind.
 *
 * Safety, each failing closed:
 * - a category whose sources are not all registered, whose location overlaps
 *   another category's, or where another installation's owner marker lies
 *   (or this one's cannot be written) is not judged;
 * - a failed listing or lookup skips the category for the night; no skip
 *   touches the marks, so one bad night does not restart the week;
 * - more than a fifth unreferenced deletes nothing until an admin confirmed
 *   that count (`confirm`), which no user action can do;
 * - a delete that fails on the backend stops deleting in that category;
 * - nothing is deleted while a backup reads the uploads, once the switch is
 *   turned off mid-pass, or on a demo instance;
 * - a pass never runs beside a backfill, a category migration or a restore
 *   (the one-job slot of StorageJobsService, which a restore waits on), and
 *   stops when a restore begins or the database is reopened under it.
 *
 * Every restore turns deletion off and drops the marks, the confirmations and
 * the reports: the restored rows may come from another installation, and this
 * one keeps its own install id (written back over the restored one).
 */
@Injectable()
export class StorageReclaimService implements OnModuleInit, OnApplicationBootstrap {
  private generation = 0;
  private knownInstallId: string | null = null;

  constructor(
    private readonly storage: StorageService,
    private readonly registry: StorageRegistryService,
    private readonly references: StorageReclaimRegistryService,
    private readonly jobs: StorageJobsService,
    private readonly lifecycle: DatabaseLifecycle,
    private readonly runtimeEnv: RuntimeEnvService,
    private readonly audit: AuditService,
    private readonly uow: UnitOfWork,
    private readonly orm: MikroORM,
    @InjectRepository(StorageReclaimMarks) private readonly marks: StorageReclaimMarksRepository,
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
  ) {}

  onModuleInit(): void {
    this.lifecycle.onReopened(() => this.afterReopen());
  }

  /** Makes the install id on the first boot, so a restore later has one of this install's own to keep. */
  async onApplicationBootstrap(): Promise<void> {
    try {
      await withRequestContext(this.orm, () => this.installId());
    } catch (err) {
      logWarn(`[storage] could not read or make the install id: ${messageOf(err)}`);
    }
  }

  /** Read only, so the admin state's GET never writes: an install id not made yet reads as deletion off. */
  async state(): Promise<StorageReclaimState> {
    const installId = this.knownInstallId ?? (await this.appSettings.getValue(INSTALL_ID_KEY));
    return {
      deleteEnabled: installId !== null && (await readReclaimDeleteEnabled(this.appSettings, installId)),
      running: this.jobs.exclusiveHolder === JOB_NAME,
      lastRun: await readReclaimReport(this.appSettings, RECLAIM_REPORT_KEY),
      lastDeleteRun: await readReclaimReport(this.appSettings, RECLAIM_DELETE_REPORT_KEY),
    };
  }

  async setDeleteEnabled(enabled: boolean): Promise<StorageReclaimState> {
    if (enabled) await this.appSettings.upsertOrReplace(RECLAIM_DELETE_KEY, await this.installId());
    else await this.appSettings.deleteValue(RECLAIM_DELETE_KEY);
    return await this.state();
  }

  /**
   * The admin lets the pass delete in a category whose unreferenced share is
   * over a fifth, up to the count the last report showed. 409 when the last
   * report holds nothing that waits for it.
   */
  async confirm(category: ServedCategory): Promise<StorageReclaimState> {
    const row = (await readReclaimReport(this.appSettings, RECLAIM_REPORT_KEY))?.categories[category];
    if (!row?.confirmationRequired) {
      throw refusal('reclaim_nothing_to_confirm', 'nothing in this category waits for a confirmation');
    }
    const installId = await this.installId();
    const counts = await readReclaimConfirmations(this.appSettings, installId);
    await writeReclaimConfirmations(this.appSettings, installId, { ...counts, [category]: row.unreferenced.objects });
    return await this.state();
  }

  /**
   * One pass over every category in the caller, its report persisted and
   * returned: the nightly job's. Refuses with a 409 on a demo instance and
   * while another storage job holds the slot.
   */
  async run(options: ReclaimRunOptions = {}): Promise<StorageReclaimReport> {
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
  start(): void {
    this.claimSlot();
    void withRequestContext(this.orm, () => this.pass(true, new Date()))
      .catch((err: unknown) => {
        logError(`[storage] the reclaim check failed: ${messageOf(err)}`);
      })
      .finally(() => {
        this.jobs.releaseExclusive(JOB_NAME);
      });
  }

  private claimSlot(): void {
    if (this.runtimeEnv.isDemoMode()) throw refusal('reclaim_demo', 'storage reclaim does not run on a demo instance');
    if (!this.jobs.claimExclusive(JOB_NAME)) {
      throw refusal('reclaim_busy', 'another storage job is running, one storage job at a time');
    }
  }

  /**
   * This install's id, made and stored on first use.
   *
   * @txStandalone an idempotent lazy provision: the row is made once and only
   * read after, whatever the caller writes besides.
   */
  private async installId(): Promise<string> {
    if (this.knownInstallId) return this.knownInstallId;
    let id = await this.appSettings.getValue(INSTALL_ID_KEY);
    if (id === null || !INSTALL_ID.test(id)) {
      id = randomUUID();
      await this.appSettings.upsertOrReplace(INSTALL_ID_KEY, id);
    }
    this.knownInstallId = id;
    return id;
  }

  /**
   * A restore or a reopen swapped the database: a pass in flight stops, and
   * the restored rows get this install's id back, deletion off and no marks,
   * confirmations or reports. Contained: a listener that throws fails the reopen.
   */
  private async afterReopen(): Promise<void> {
    this.generation += 1;
    try {
      await withRequestContext(this.orm, () =>
        this.uow.transactional(async () => {
          const wasOn = this.knownInstallId !== null && (await this.appSettings.getValue(RECLAIM_DELETE_KEY)) !== null;
          if (this.knownInstallId) await this.appSettings.upsertOrReplace(INSTALL_ID_KEY, this.knownInstallId);
          await RECLAIM_RESET_KEYS.reduce<Promise<void>>(async (previous, key) => {
            await previous;
            await this.appSettings.deleteValue(key);
          }, Promise.resolve());
          await this.marks.deleteAll();
          if (wasOn)
            logInfo('[storage] the restored database had reclaim deletion on: it is off until an admin turns it on');
        }),
      );
    } catch (err) {
      logError(`[storage] could not reset the reclaim state after the database was reopened: ${messageOf(err)}`);
    }
  }

  /**
   * @txIndependent a sweep in passes: each category's marks and each delete
   * stand on their own, and a pass cut short leaves the work done so far valid.
   */
  private async pass(reportOnly: boolean, now: Date): Promise<StorageReclaimReport> {
    const wallStart = Date.now();
    const installId = await this.installId();
    const deleting = !reportOnly && (await readReclaimDeleteEnabled(this.appSettings, installId));
    const ctx: PassContext = {
      now: now.getTime(),
      installId,
      deleting,
      sources: [...this.references.sources()],
      shared: sharedLocationsOf(this.registry),
      confirmed: await readReclaimConfirmations(this.appSettings, installId),
      generation: this.generation,
    };
    const categories = {} as Record<ServedCategory, StorageReclaimCategoryReport>;
    let stopped: StorageReclaimReport['stopped'] = null;
    await SERVED_CATEGORIES.reduce<Promise<void>>(async (previous, category) => {
      await previous;
      const progress = newProgress();
      if (stopped === null) {
        try {
          await this.reclaimCategory(category, ctx, progress);
        } catch (err) {
          stopped = err instanceof ReclaimStopped ? 'database_reopened' : 'failed';
          if (stopped === 'failed') logError(`[storage] the reclaim pass failed in '${category}': ${messageOf(err)}`);
          progress.skipped = 'interrupted';
        }
      } else {
        progress.skipped = 'interrupted';
      }
      categories[category] = reportOf(progress);
    }, Promise.resolve());
    const report: StorageReclaimReport = {
      startedAt: ctx.now,
      finishedAt: ctx.now + (Date.now() - wallStart),
      mode: deleting ? 'delete' : 'report',
      stopped,
      categories,
    };
    await this.persist(report);
    return report;
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
    const rule = RECLAIM_LEDGER[category];
    if (!rule.reclaim) {
      progress.skipped = 'not_reclaimed';
      return;
    }
    const sources = ctx.sources.filter((source) => claimsAny(source, category));
    const answering = new Set(sources.filter((source) => answersFor(source, category)).map((source) => source.id));
    if (rule.requiredSources.some((id) => !answering.has(id))) {
      progress.skipped = 'sources_missing';
      return;
    }
    if (ctx.shared.has(category)) {
      progress.skipped = 'shared_location';
      return;
    }

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
    const owner = await this.ownerVerdict(category, listed.owners, ctx.installId);
    if (owner !== null) {
      progress.skipped = owner;
      return;
    }

    let named: Set<string>;
    try {
      named = await this.namedIn(category, sources);
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
    progress.confirmationRequired =
      unreferenced.length > listed.objects * CONFIRM_SHARE && unreferenced.length > (ctx.confirmed[category] ?? 0);
    if (ctx.deleting && !progress.confirmationRequired) await this.deleteEligible(category, sources, ctx, progress);
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
   * Whether this installation may judge the place a category lives in: not
   * where another one's owner marker lies, and not where its own could not be
   * written, since then a second installation cannot see it either.
   */
  private async ownerVerdict(
    category: ServedCategory,
    owners: ReadonlySet<string>,
    installId: string,
  ): Promise<'foreign_install' | 'owner_unknown' | null> {
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

  /** Every key of the category some source names, lowercased: one read per source for the whole category. */
  private async namedIn(category: ServedCategory, sources: readonly StorageReferenceSource[]): Promise<Set<string>> {
    const answers = await Promise.all(sources.map((source) => source.namedKeys(category)));
    const named = new Set<string>();
    for (const answer of answers) for (const key of answer) named.add(key);
    return named;
  }

  /** The keys some source names right now, lowercased: the fresh question before a delete. */
  private async referencedIn(
    category: ServedCategory,
    keys: readonly string[],
    sources: readonly StorageReferenceSource[],
  ): Promise<Set<string>> {
    const answers = await Promise.all(
      sources.map(async (source) => {
        const asked = keys.filter((key) => claimsKey(source, category, key));
        return asked.length === 0 ? new Set<string>() : await source.referenced(category, asked);
      }),
    );
    const referenced = new Set<string>();
    for (const answer of answers) for (const key of answer) referenced.add(key.toLowerCase());
    return referenced;
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
   * batch whose backend failed stops the category with `delete_failed`.
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
    await chunk(progress.eligible, RECHECK_BATCH).reduce<Promise<void>>(async (previous, batch) => {
      await previous;
      if (progress.skipped !== null || !(await this.mayDelete(ctx))) return;
      this.assertSameDatabase(ctx);
      const failed = await this.deleteBatch(category, batch, sources, ctx, progress);
      if (failed) progress.skipped = 'delete_failed';
    }, Promise.resolve());
  }

  /** Deleting goes on while the switch stays on and no backup reads the uploads; once off, off for the pass. */
  private async mayDelete(ctx: PassContext): Promise<boolean> {
    if (!ctx.deleting) return false;
    if (this.jobs.backupRunning || !(await readReclaimDeleteEnabled(this.appSettings, ctx.installId))) {
      ctx.deleting = false;
    }
    return ctx.deleting;
  }

  /**
   * Checks each object is still the old one the pass judged, asks every source
   * about the batch again, fresh, and deletes what none of them names. The
   * question goes last so nothing slower than the deletes sits between the
   * answer and them. True when the backend failed, so the category stops.
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
      stats = await Promise.all(batch.map((candidate) => this.storage.stat(category, candidate.key)));
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
      referenced = await this.referencedIn(category, keysOf(due), sources);
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
    if (this.generation !== ctx.generation) throw new ReclaimStopped('the database was reopened during the pass');
  }
}

/** A 409 whose body names the refusal in `code` next to the text, so the client can say it in the user's language. */
function refusal(code: 'reclaim_busy' | 'reclaim_demo' | 'reclaim_nothing_to_confirm', message: string): DomainError {
  return new DomainError(409, message, { code, details: { code } });
}

function markedBefore(mark: ReclaimMarkRow | undefined, cutoff: number): boolean {
  const firstSeen = parseDbTimestamp(mark?.first_seen_at);
  return firstSeen !== null && firstSeen.getTime() <= cutoff;
}

/** The source answers for some part of the category. */
function claimsAny(source: StorageReferenceSource, category: ServedCategory): boolean {
  return source.claims.some((claim) => claim.category === category);
}

/** The source answers for the whole category: what the ledger's required sources must do. */
function answersFor(source: StorageReferenceSource, category: ServedCategory): boolean {
  return source.claims.some((claim) => claim.category === category && claim.prefix === '');
}

function claimsKey(source: StorageReferenceSource, category: ServedCategory, key: string): boolean {
  return source.claims.some((claim) => claim.category === category && key.startsWith(claim.prefix));
}

function keysOf(candidates: readonly ReclaimCandidate[]): string[] {
  return candidates.map((candidate) => candidate.key);
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_page, i) => items.slice(i * size, (i + 1) * size));
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
