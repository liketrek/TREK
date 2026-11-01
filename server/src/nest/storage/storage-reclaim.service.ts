import { AppSettings } from '../../db/entities/AppSettings.entity';
import { StorageReclaimMarks } from '../../db/entities/StorageReclaimMarks.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import type {
  ReclaimMarkRow,
  StorageReclaimMarksRepository,
} from '../../db/repositories/StorageReclaimMarks.repository';
import { dbNow, parseDbTimestamp } from '../../db/types';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { logError } from '../audit/audit-log.logger';
import { DomainError } from '../common/domain-error';
import { DatabaseLifecycle } from '../database/database-lifecycle.service';
import { StorageJobsService } from './storage-jobs.service';
import { StorageReclaimRegistryService } from './storage-reclaim-registry.service';
import { inReclaimScope, RECLAIM_LEDGER, sharedLocationCategories } from './storage-reclaim.ledger';
import {
  RECLAIM_DELETE_KEY,
  RECLAIM_REPORT_KEY,
  readReclaimDeleteEnabled,
  readReclaimState,
} from './storage-reclaim.settings';
import type { StorageReferenceSource } from './storage-reclaim.types';
import { StorageRegistryService } from './storage-registry.service';
import { StorageService } from './storage.service';
import { SERVED_CATEGORIES, type ServedCategory } from './storage.types';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { StorageReclaimCategoryReport, StorageReclaimReport, StorageReclaimState } from '@trek/shared';

const HOUR_MS = 60 * 60 * 1000;
/** An object younger than this is never judged: every writer puts the bytes before it inserts the row. */
const RECLAIM_GRACE_MS = 24 * HOUR_MS;
/** How long an object must stay unreferenced, on every pass, before a pass may delete it. */
const RECLAIM_DELAY_MS = 7 * 24 * HOUR_MS;
/** More unreferenced than this share of a category points at a bucket another install shares: hands off. */
const RECLAIM_BRAKE_SHARE = 0.2;
/** Keys per reference question, the page the sources are promised. */
const SOURCE_PAGE = 500;
/** Marks per statement: four bound values each, well under SQLite's limit. */
const MARK_BATCH = 100;
/** Deletes in flight at once. */
const DELETE_BATCH = 20;
const JOB_NAME = 'a storage reclaim';

interface Candidate {
  key: string;
  size: number;
}

interface PassContext {
  now: number;
  deleting: boolean;
  sources: readonly StorageReferenceSource[];
  shared: ReadonlySet<ServedCategory>;
  generation: number;
}

interface ReclaimRunOptions {
  /** Delete nothing, whatever the switch says. */
  reportOnly?: boolean;
  now?: Date;
}

/** The database was swapped under the pass (a restore): nothing it learnt before holds any more. */
class ReclaimStopped extends Error {}

/**
 * The reclaim pass (#2924): objects in upload storage that no row names any
 * more, found in two phases and, only when the admin switched deletion on,
 * deleted. A pass lists each category the ledger allows, skips objects younger
 * than a day (the bytes of an upload land before its row), asks every
 * registered reference source which keys are still named, and marks the rest
 * with the time it first saw them. An object goes only once its mark is a week
 * old, after one more question to every source about that single key, through
 * `StorageService.delete` (so replicas follow and a demo keeps its bytes).
 *
 * Brakes, each failing closed: a category whose sources are not all
 * registered, whose objects share a location with another category's, whose
 * listing or lookups fail, or where more than a fifth of the objects look
 * unreferenced is skipped and its marks start over. A pass never runs beside
 * a backfill or a category migration (the one-job slot of StorageJobsService),
 * never on a demo instance, and stops when the database is reopened under it.
 */
@Injectable()
export class StorageReclaimService implements OnModuleInit {
  private generation = 0;

  constructor(
    private readonly storage: StorageService,
    private readonly registry: StorageRegistryService,
    private readonly references: StorageReclaimRegistryService,
    private readonly jobs: StorageJobsService,
    private readonly lifecycle: DatabaseLifecycle,
    private readonly runtimeEnv: RuntimeEnvService,
    @InjectRepository(StorageReclaimMarks) private readonly marks: StorageReclaimMarksRepository,
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
  ) {}

  onModuleInit(): void {
    this.lifecycle.onReopened(async () => {
      this.generation += 1;
    });
  }

  async state(): Promise<StorageReclaimState> {
    return await readReclaimState(this.appSettings);
  }

  async setDeleteEnabled(enabled: boolean): Promise<StorageReclaimState> {
    await this.appSettings.setValue(RECLAIM_DELETE_KEY, enabled ? 'true' : 'false');
    return await this.state();
  }

  /**
   * One pass over every category, its report persisted and returned. Refuses
   * with a 409 on a demo instance and while another storage job holds the slot.
   */
  async run(options: ReclaimRunOptions = {}): Promise<StorageReclaimReport> {
    if (this.runtimeEnv.isDemoMode()) {
      throw new DomainError(409, 'storage reclaim does not run on a demo instance', { code: 'reclaim_demo' });
    }
    if (!this.jobs.claimExclusive(JOB_NAME)) {
      throw new DomainError(409, 'another storage job is running, one storage job at a time', {
        code: 'reclaim_busy',
      });
    }
    try {
      return await this.pass(options.reportOnly === true, options.now ?? new Date());
    } finally {
      this.jobs.releaseExclusive(JOB_NAME);
    }
  }

  /**
   * @txIndependent a sweep in passes: each category's marks and each delete
   * stand on their own, and a pass cut short leaves the work done so far valid.
   */
  private async pass(reportOnly: boolean, now: Date): Promise<StorageReclaimReport> {
    const wallStart = Date.now();
    const ctx: PassContext = {
      now: now.getTime(),
      deleting: !reportOnly && (await readReclaimDeleteEnabled(this.appSettings)),
      sources: [...this.references.sources()],
      shared: this.sharedLocations(),
      generation: this.generation,
    };
    const categories = {} as Record<ServedCategory, StorageReclaimCategoryReport>;
    let stopped: StorageReclaimReport['stopped'] = null;
    await SERVED_CATEGORIES.reduce<Promise<void>>(async (previous, category) => {
      await previous;
      if (stopped === null) {
        try {
          categories[category] = await this.reclaimCategory(category, ctx);
          return;
        } catch (err) {
          if (!(err instanceof ReclaimStopped)) throw err;
          stopped = 'database_reopened';
        }
      }
      categories[category] = emptyReport(null, 0);
    }, Promise.resolve());
    const report: StorageReclaimReport = {
      startedAt: ctx.now,
      finishedAt: ctx.now + (Date.now() - wallStart),
      mode: ctx.deleting ? 'delete' : 'report',
      stopped,
      categories,
    };
    await this.appSettings.upsertOrReplace(RECLAIM_REPORT_KEY, JSON.stringify(report));
    return report;
  }

  /** The categories whose resolved location overlaps another's, from the live registry. */
  private sharedLocations(): Set<ServedCategory> {
    const assignments = new Map(
      SERVED_CATEGORIES.map((category) => {
        const { backendName, keyPrefix } = this.registry.resolve(category);
        return [category, { backendName, keyPrefix }] as const;
      }),
    );
    return sharedLocationCategories(assignments, this.registry.snapshot().backends);
  }

  /**
   * @txIndependent a sweep in passes: marks are written per batch and every
   * delete stands alone, so a failure part way keeps what came before.
   */
  private async reclaimCategory(category: ServedCategory, ctx: PassContext): Promise<StorageReclaimCategoryReport> {
    const rule = RECLAIM_LEDGER[category];
    if (!rule.reclaim) return emptyReport('not_reclaimed', 0);
    const sources = ctx.sources.filter((source) => claimsAny(source, category));
    const answering = new Set(sources.filter((source) => answersFor(source, category)).map((source) => source.id));
    if (rule.requiredSources.some((id) => !answering.has(id))) return this.skip(category, 'sources_missing', 0);
    if (ctx.shared.has(category)) return this.skip(category, 'shared_location', 0);

    let listed: { objects: number; old: Candidate[] };
    try {
      listed = await this.listOld(category, ctx.now);
    } catch (err) {
      logError(`[storage] reclaim could not list '${category}': ${messageOf(err)}`);
      return this.skip(category, 'list_failed', 0);
    }
    let unreferenced: Candidate[];
    try {
      unreferenced = await this.unreferencedOf(category, listed.old, sources);
    } catch (err) {
      logError(`[storage] reclaim could not check the references of '${category}': ${messageOf(err)}`);
      return this.skip(category, 'source_failed', listed.objects);
    }
    this.assertSameDatabase(ctx);
    const unreferencedCount = countOf(unreferenced);
    if (unreferenced.length > listed.objects * RECLAIM_BRAKE_SHARE) {
      return {
        ...(await this.skip(category, 'too_many_unreferenced', listed.objects)),
        unreferenced: unreferencedCount,
      };
    }

    const marks = new Map((await this.marks.marksOf(category)).map((mark) => [mark.key, mark]));
    await this.writeMarks(category, unreferenced, marks, ctx.now);
    const cutoff = ctx.now - RECLAIM_DELAY_MS;
    const eligible = unreferenced.filter((candidate) => markedBefore(marks.get(candidate.key), cutoff));
    const deleted = ctx.deleting ? await this.deleteEligible(category, eligible, sources, ctx) : [];
    return {
      objects: listed.objects,
      unreferenced: unreferencedCount,
      eligible: countOf(eligible),
      deleted: countOf(deleted),
      skipped: null,
    };
  }

  /** A category this pass cannot judge: nothing is deleted and its marks start over. */
  private async skip(
    category: ServedCategory,
    reason: NonNullable<StorageReclaimCategoryReport['skipped']>,
    objects: number,
  ): Promise<StorageReclaimCategoryReport> {
    await this.marks.deleteCategory(category);
    return emptyReport(reason, objects);
  }

  /** The root-level objects of a category, and of them the ones past the grace period. */
  private async listOld(category: ServedCategory, now: number): Promise<{ objects: number; old: Candidate[] }> {
    let objects = 0;
    const old: Candidate[] = [];
    for await (const stat of this.storage.list(category)) {
      if (!inReclaimScope(stat.key)) continue;
      objects += 1;
      // A missing or zero modification time reads as infinitely old: such an object is kept.
      if (!(stat.mtimeMs > 0) || now - stat.mtimeMs < RECLAIM_GRACE_MS) continue;
      old.push({ key: stat.key, size: stat.size });
    }
    return { objects, old };
  }

  /** The candidates no source names, asked a page at a time. */
  private async unreferencedOf(
    category: ServedCategory,
    candidates: readonly Candidate[],
    sources: readonly StorageReferenceSource[],
  ): Promise<Candidate[]> {
    return chunk(candidates, SOURCE_PAGE).reduce<Promise<Candidate[]>>(async (previous, page) => {
      const done = await previous;
      const referenced = await this.referencedIn(
        category,
        page.map((candidate) => candidate.key),
        sources,
      );
      done.push(...page.filter((candidate) => !referenced.has(candidate.key.toLowerCase())));
      return done;
    }, Promise.resolve([]));
  }

  /**
   * The keys some source still names, lowercased. Every key is claimed: the
   * ledger's required sources answer for the whole category, and a category
   * missing one never gets this far.
   */
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
    unreferenced: readonly Candidate[],
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
   * @txIndependent one delete per object, each with its own re-check, so a
   * failure leaves the others' work standing.
   */
  private async deleteEligible(
    category: ServedCategory,
    eligible: readonly Candidate[],
    sources: readonly StorageReferenceSource[],
    ctx: PassContext,
  ): Promise<Candidate[]> {
    return chunk(eligible, DELETE_BATCH).reduce<Promise<Candidate[]>>(async (previous, batch) => {
      const done = await previous;
      const results = await Promise.all(batch.map((candidate) => this.deleteOne(category, candidate, sources, ctx)));
      done.push(...batch.filter((_candidate, i) => results[i]));
      return done;
    }, Promise.resolve([]));
  }

  /**
   * Asks every source about this one key again, checks the object is still the
   * old one the pass judged, then deletes it and its mark. False keeps it.
   *
   * @txIndependent the object goes first and the mark after, so a mark never
   * outlives a delete that failed.
   */
  private async deleteOne(
    category: ServedCategory,
    candidate: Candidate,
    sources: readonly StorageReferenceSource[],
    ctx: PassContext,
  ): Promise<boolean> {
    let referenced: Set<string>;
    try {
      referenced = await this.referencedIn(category, [candidate.key], sources);
    } catch (err) {
      logError(`[storage] reclaim kept a '${category}' object, its re-check failed: ${messageOf(err)}`);
      return false;
    }
    if (referenced.size > 0) {
      await this.marks.deleteKeys(category, [candidate.key]);
      return false;
    }
    const stat = await this.storage.stat(category, candidate.key);
    if (stat === null || !(stat.mtimeMs > 0) || ctx.now - stat.mtimeMs < RECLAIM_GRACE_MS) {
      // Gone, or written again since it was judged: the next pass looks at it afresh.
      await this.marks.deleteKeys(category, [candidate.key]);
      return false;
    }
    if (this.storage.keepsOnDelete(category, candidate.key)) return false;
    this.assertSameDatabase(ctx);
    try {
      await this.storage.delete(category, candidate.key);
    } catch (err) {
      logError(`[storage] reclaim could not delete a '${category}' object: ${messageOf(err)}`);
      return false;
    }
    await this.marks.deleteKeys(category, [candidate.key]);
    return true;
  }

  private assertSameDatabase(ctx: PassContext): void {
    if (this.generation !== ctx.generation) throw new ReclaimStopped('the database was reopened during the pass');
  }
}

function emptyReport(skipped: StorageReclaimCategoryReport['skipped'], objects: number): StorageReclaimCategoryReport {
  const none = { objects: 0, bytes: 0 };
  return { objects, unreferenced: none, eligible: none, deleted: none, skipped };
}

function countOf(candidates: readonly Candidate[]): { objects: number; bytes: number } {
  return { objects: candidates.length, bytes: candidates.reduce((sum, candidate) => sum + candidate.size, 0) };
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

function chunk<T>(items: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_page, i) => items.slice(i * size, (i + 1) * size));
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
