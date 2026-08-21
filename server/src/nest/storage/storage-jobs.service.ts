import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Injectable, Logger } from '@nestjs/common';
import {
  STORAGE_CATEGORIES,
  type StorageBackfillStatus,
  type StorageCategory,
  type StorageMigrationStatus,
} from '@trek/shared';
import { contentTypeFor } from './content-type';
import { MirrorDriver } from './drivers/mirror.driver';
import { GLOBAL_TEMP_DIR } from './storage-paths';
import { StorageRegistryService } from './storage-registry.service';
import type { StorageDriver } from './storage.types';

export class BackfillTargetError extends Error {}
export class BackfillBusyError extends Error {}
export class MigrationRequestError extends Error {}
export class MigrationTargetError extends Error {}

interface ActiveJob {
  status: StorageBackfillStatus;
  cancelled: boolean;
}

interface ActiveMigration {
  status: StorageMigrationStatus;
  cancelled: boolean;
}

/**
 * One-at-a-time backfill registry (the ImportJobsService idiom, minus WS).
 * Finished statuses linger for ttlMs so a remounted panel can show the
 * outcome; the client polls the admin state while anything is running.
 */
@Injectable()
export class StorageJobsService {
  private readonly logger = new Logger(StorageJobsService.name);
  private readonly jobs = new Map<string, ActiveJob>();
  private readonly migrations = new Map<string, ActiveMigration>();
  private ttlMs = 10 * 60_000;

  /** One storage job at a time, across both backfills and category migrations. */
  private anyJobRunning(): boolean {
    return (
      [...this.jobs.values()].some((j) => j.status.status === 'running') ||
      [...this.migrations.values()].some((m) => m.status.status === 'running')
    );
  }

  constructor(private readonly registry: StorageRegistryService) {}

  /** Test-only factory for a short TTL, since a second constructor param would confuse Nest DI. */
  static withTtl(registry: StorageRegistryService, ttlMs: number): StorageJobsService {
    const svc = new StorageJobsService(registry);
    svc.ttlMs = ttlMs;
    return svc;
  }

  startBackfill(mirrorName: string): void {
    // Resolve/validate the target first so an unknown/non-mirror name 404s
    // even while a sync is running — the busy check only applies once we
    // know there's a real mirror to be busy about.
    const snapshot = this.registry.snapshot();
    const categories = STORAGE_CATEGORIES.filter(
      (category) => snapshot.categories[category]?.backend === mirrorName,
    );
    if (categories.length === 0) {
      throw new BackfillTargetError(`'${mirrorName}' is not a mirror routed by any category`);
    }
    const resolved = categories.map((category) => this.registry.resolve(category));
    const driver = resolved[0]!.driver;
    if (!(driver instanceof MirrorDriver)) {
      throw new BackfillTargetError(`'${mirrorName}' is not a mirror backend`);
    }
    if (this.anyJobRunning()) {
      throw new BackfillBusyError('a sync is already running — one backfill at a time');
    }
    const prefixes = resolved.map((r) => r.keyPrefix);

    const job: ActiveJob = {
      cancelled: false,
      status: {
        backend: mirrorName,
        status: 'running',
        done: 0,
        total: 0,
        copied: 0,
        skipped: 0,
        failed: 0,
        deleted: 0,
        startedAt: Date.now(),
      },
    };
    this.jobs.set(mirrorName, job);

    // Detached: the driver instances are resolved above, so a registry
    // reload() mid-run keeps this job on them (the in-flight guarantee).
    void driver
      .backfill(prefixes, {
        onProgress: (progress) => {
          job.status = { ...job.status, ...progress };
        },
        isCancelled: () => job.cancelled,
      })
      .then((result) => {
        job.status = {
          ...job.status,
          ...result,
          status: result.cancelled ? 'cancelled' : 'done',
          finishedAt: Date.now(),
        };
      })
      .catch((err: unknown) => {
        job.status = {
          ...job.status,
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
          finishedAt: Date.now(),
        };
        this.logger.error(`backfill '${mirrorName}' aborted: ${job.status.error}`);
      })
      .finally(() => {
        setTimeout(() => {
          if (this.jobs.get(mirrorName) === job && job.status.status !== 'running') this.jobs.delete(mirrorName);
        }, this.ttlMs).unref?.();
      });
  }

  cancelBackfill(mirrorName: string): boolean {
    const job = this.jobs.get(mirrorName);
    if (!job || job.status.status !== 'running') return false;
    job.cancelled = true;
    return true;
  }

  statuses(): StorageBackfillStatus[] {
    return [...this.jobs.values()].map((job) => ({ ...job.status }));
  }

  /**
   * Start a category migration: copy every object from the category's
   * current backend to `to`, flip the category assignment once the copy
   * phase is clean, then sweep any delta the copy phase raced against.
   * Throws MigrationRequestError (400) / MigrationTargetError (404) /
   * BackfillBusyError (409, shared with backfills — one storage job at a time).
   */
  startMigration(category: StorageCategory, to: string): void {
    if (!STORAGE_CATEGORIES.includes(category)) {
      throw new MigrationRequestError(`'${category}' is not a configurable category`);
    }
    const current = this.registry.resolve(category);
    if (current.backendName === to) {
      throw new MigrationRequestError(`'${category}' is already on '${to}'`);
    }
    const target = this.registry.driverByName(to);
    if (!target) throw new MigrationTargetError(`no backend named '${to}'`);
    if (this.anyJobRunning()) {
      throw new BackfillBusyError('a sync is already running — one storage job at a time');
    }
    // The DESTINATION prefix, computed for `to` before the flip — may differ
    // from `current.keyPrefix` (audit #8: a mode-A '' source migrating onto a
    // prefixed backend must land its objects under that backend's real
    // prefix, or the registry can never resolve them again post-flip).
    const destPrefix = this.registry.keyPrefixFor(category, to);

    const job: ActiveMigration = {
      cancelled: false,
      status: {
        category,
        from: current.backendName,
        to,
        status: 'running',
        done: 0,
        total: 0,
        copied: 0,
        skipped: 0,
        failed: 0,
        startedAt: Date.now(),
      },
    };
    this.migrations.set(category, job);
    // Detached, driver instances resolved above (in-flight guarantee, same as backfill).
    void this.runMigration(job, current.driver, target, current.keyPrefix, destPrefix)
      .catch((err: unknown) => {
        job.status = {
          ...job.status,
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
          finishedAt: Date.now(),
        };
        this.logger.error(`migration '${category}' aborted: ${job.status.error}`);
      })
      .finally(() => {
        setTimeout(() => {
          if (this.migrations.get(category) === job && job.status.status !== 'running') {
            this.migrations.delete(category);
          }
        }, this.ttlMs).unref?.();
      });
  }

  cancelMigration(category: string): boolean {
    const job = this.migrations.get(category);
    if (!job || job.status.status !== 'running') return false;
    job.cancelled = true;
    return true;
  }

  migrationStatuses(): StorageMigrationStatus[] {
    return [...this.migrations.values()].map((m) => ({ ...m.status }));
  }

  /**
   * After a config apply: any running job whose backend no longer exists (or,
   * for a migration, whose from OR to backend is gone) ends 'cancelled'
   * instead of running invisibly against stale driver refs (spec, polish item
   * 3) — the resolved driver instances stay valid (the in-flight guarantee),
   * only their backend name has fallen out of the config. Also cancels a
   * running migration whose category route no longer matches its `from` —
   * a save can re-route the category to a THIRD, still-defined backend
   * without either of the migration's own backends disappearing, and letting
   * the migration run to completion would flip the category back onto a
   * backend the operator just moved it away from. A cancelled migration
   * pre-flip is harmless (MIG-003's guarantee); post-flip the flag is never
   * read again because the sweep phase always runs to completion.
   */
  cancelJobsForMissingBackends(): void {
    const names = new Set(this.registry.snapshot().backends.map((b) => b.name));
    for (const job of this.jobs.values()) {
      if (job.status.status !== 'running') continue;
      if (!names.has(job.status.backend)) job.cancelled = true;
    }
    for (const migration of this.migrations.values()) {
      if (migration.status.status !== 'running') continue;
      if (!names.has(migration.status.from) || !names.has(migration.status.to)) {
        migration.cancelled = true;
        continue;
      }
      if (this.registry.resolve(migration.status.category).backendName !== migration.status.from) {
        migration.cancelled = true;
      }
    }
  }

  /** Copy one needy object source→target via a spool file; returns false on a counted failure. */
  private async copyObject(
    source: StorageDriver,
    target: StorageDriver,
    sourceKey: string,
    destKey: string,
  ): Promise<boolean> {
    const file = path.join(GLOBAL_TEMP_DIR, randomUUID());
    try {
      const { stream } = await source.getStream(sourceKey);
      await pipeline(stream, fs.createWriteStream(file)); // source errors RETHROW (abort → failed)
    } catch (err) {
      await fs.promises.rm(file, { force: true });
      throw err;
    }
    try {
      await target.put(destKey, fs.createReadStream(file), { contentType: contentTypeFor(destKey) });
      return true;
    } catch {
      return false; // per-object failure: counted, blocks the flip
    } finally {
      await fs.promises.rm(file, { force: true });
    }
  }

  private async runMigration(
    job: ActiveMigration,
    source: StorageDriver,
    target: StorageDriver,
    sourcePrefix: string,
    destPrefix: string,
  ): Promise<void> {
    const s = () => job.status;
    // Rewrite a source key onto the destination backend's own prefix (audit
    // #8): equal prefixes make this the identity function — byte-identical
    // to pre-fix behavior — but a mode-A ('' prefix) source landing on a
    // prefixed destination (or vice versa) now lands at a key the registry
    // will actually resolve post-flip, instead of silently keeping the
    // source's prefix verbatim.
    const destKeyFor = (sourceKey: string): string => destPrefix + sourceKey.slice(sourcePrefix.length);
    // Phase 1a: honest total.
    for await (const _stat of source.list(sourcePrefix)) job.status = { ...s(), total: s().total + 1 };
    // Phase 1b: copy.
    for await (const stat of source.list(sourcePrefix)) {
      if (job.cancelled) {
        job.status = { ...s(), status: 'cancelled', finishedAt: Date.now() };
        return;
      }
      const done = s().done + 1;
      job.status = { ...s(), done, total: Math.max(s().total, done) };
      const destKey = destKeyFor(stat.key);
      const existing = await target.stat(destKey);
      if (existing && existing.size === stat.size) {
        job.status = { ...s(), skipped: s().skipped + 1 };
        continue;
      }
      if (await this.copyObject(source, target, stat.key, destKey)) job.status = { ...s(), copied: s().copied + 1 };
      else job.status = { ...s(), failed: s().failed + 1 };
    }
    if (s().failed > 0) {
      job.status = {
        ...s(),
        status: 'failed',
        error: `${s().failed} object(s) failed to copy — category not flipped`,
        finishedAt: Date.now(),
      };
      return;
    }
    // Close the last-object cancel window: the per-iteration check above only
    // fires at the TOP of each copy iteration, so a cancel landing after the
    // last object's await (or an empty category, which never enters the loop
    // at all) would otherwise reach the flip unchecked. Everything from here
    // to assignCategory() below is one synchronous stretch, so this is the
    // last point a cancel can still be honored before the flip.
    if (job.cancelled) {
      job.status = { ...s(), status: 'cancelled', finishedAt: Date.now() };
      return;
    }
    // Phase 2: flip — the job, not the save, owns this.
    this.registry.assignCategory(s().category, s().to);
    // Phase 3: delta sweep + reclaimable tally. Cancellation is ignored here
    // (bounded). Reclaimable stays SOURCE-keyed — it counts what's left to
    // reclaim on the old backend, not where it landed on the new one.
    const reclaimable = { objects: 0, bytes: 0 };
    for await (const stat of source.list(sourcePrefix)) {
      reclaimable.objects += 1;
      reclaimable.bytes += stat.size;
      const destKey = destKeyFor(stat.key);
      const existing = await target.stat(destKey);
      if (existing && existing.size === stat.size) continue;
      const done = s().done + 1;
      job.status = { ...s(), done, total: Math.max(s().total, done) };
      if (await this.copyObject(source, target, stat.key, destKey)) job.status = { ...s(), copied: s().copied + 1 };
      else job.status = { ...s(), failed: s().failed + 1 }; // sweep failure: reported, flip already happened
    }
    job.status = { ...s(), status: 'done', total: s().done, reclaimable, finishedAt: Date.now() };
  }
}
