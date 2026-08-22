import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import { assertValidKey, assertValidPrefix } from '../storage-keys';
import { contentTypeFor } from '../content-type';
import {
  describeError,
  isLocalTempFile,
  StorageInvalidKeyError,
  StorageNotFoundError,
  type ByteRange,
  type LocalTempFile,
  type ObjectStat,
  type PutOptions,
  type StorageDriver,
} from '../storage.types';

export interface ReplicaFailure {
  backend: string;
  key: string;
  op: 'put' | 'delete' | 'stat' | 'list';
  error: string;
  at: number;
}

export interface BackfillProgress {
  done: number;
  total: number;
  copied: number;
  skipped: number;
  failed: number;
  /** Replica objects removed by the sweep phase — absent from the primary and not raced back. */
  deleted: number;
}

export interface BackfillHooks {
  onProgress(progress: BackfillProgress): void;
  isCancelled(): boolean;
}

export interface BackfillResult extends BackfillProgress {
  cancelled: boolean;
}

/**
 * Composite backend: one primary (source of truth) plus best-effort replicas.
 * Runs entirely over the driver interface — the second in-tree consumer of
 * the contract suite. Any category may be assigned a mirror (the v1
 * backups-only rule was lifted by the replicas-on-primary spec); replica
 * writes are synchronous in the request path, which is why hot categories
 * carry an advisory in the admin UI rather than a prohibition here.
 *
 * Writes hit the primary first and must succeed; replica failures are
 * reported through `onReplicaFailure` (surfaced as health status), never
 * thrown. Reads honor one invariant: a read succeeds if ANY member — primary
 * or any replica — holds the object. `getStream` and `stat` both fall back
 * to replicas on a primary miss (`StorageNotFoundError` / a `null` stat) as
 * well as a primary infra error; only a deterministic `StorageInvalidKeyError`
 * never triggers fallback (every member would reject the same key). Fallback
 * is READ-ONLY and never resurrects anything: a hit found on a replica is
 * NOT written back to the primary (or to any other replica that missed it).
 * The object stays absent everywhere the read didn't find it — closing that
 * staleness window (a primary that failed a delete, or is genuinely missing
 * an object a replica still has) is `backfill`'s sweep phase, below: a
 * "Sync now" run doesn't just copy forward, it also deletes replica objects
 * the primary no longer has.
 */
export class MirrorDriver implements StorageDriver {
  readonly id: string;
  private readonly primary: StorageDriver;
  private readonly replicas: readonly StorageDriver[];
  private readonly tempDir: () => string;
  private readonly onReplicaFailure?: (failure: ReplicaFailure) => void;

  constructor(opts: {
    id: string;
    primary: StorageDriver;
    replicas: StorageDriver[];
    /** Global scratch dir (data/tmp) — mirrors have no same-volume spool of their own. */
    tempDir: () => string;
    onReplicaFailure?: (failure: ReplicaFailure) => void;
  }) {
    this.id = opts.id;
    this.primary = opts.primary;
    this.replicas = [...opts.replicas];
    this.tempDir = opts.tempDir;
    this.onReplicaFailure = opts.onReplicaFailure;
  }

  getSpoolDir(): null {
    return null; // callers fall back to storage.tempDir()
  }

  getLocalPath(key: string): string | null {
    assertValidKey(key);
    return this.primary.getLocalPath?.(key) ?? null;
  }

  async put(key: string, source: Readable | LocalTempFile, opts?: PutOptions): Promise<void> {
    assertValidKey(key);
    // A Readable can only be consumed once, so materialize the source as a
    // local file (stream → spool under tempDir(); temp-file sources as-is),
    // then feed each target its own stream: the bytes survive the primary
    // write for the replicas, and every child put stays atomic.
    let file: string;
    if (isLocalTempFile(source)) {
      file = source.tmpPath;
    } else {
      file = path.join(this.tempDir(), randomUUID());
      try {
        await pipeline(source, fs.createWriteStream(file));
      } catch (err) {
        await fs.promises.rm(file, { force: true });
        throw err;
      }
    }
    try {
      await this.primary.put(key, fs.createReadStream(file), opts);
      for (const replica of this.replicas) {
        try {
          await replica.put(key, fs.createReadStream(file), opts);
        } catch (err) {
          this.reportReplicaFailure(replica.id, key, 'put', err);
        }
      }
    } finally {
      // Ownership of LocalTempFile sources transferred to us — consume it.
      await fs.promises.rm(file, { force: true });
    }
  }

  async getStream(key: string, range?: ByteRange): Promise<{ stream: Readable; stat: ObjectStat }> {
    assertValidKey(key);
    try {
      return await this.primary.getStream(key, range);
    } catch (err) {
      // Widened per the "ANY member holds it" invariant: a primary
      // StorageNotFoundError now falls through to the replicas too, not just
      // an infra error. Only StorageInvalidKeyError skips fallback — every
      // member rejects the same key deterministically, so trying them is
      // pointless. `fromReplicas`' catch-and-continue is safe to reuse here
      // (unlike for `stat` below): a replica miss THROWS StorageNotFoundError,
      // so the loop naturally moves on to the next replica.
      if (err instanceof StorageInvalidKeyError) throw err;
      return this.fromReplicas((replica) => replica.getStream(key, range), err);
    }
  }

  /**
   * Stat-specific fallback loop — deliberately NOT `fromReplicas`. `stat`
   * signals a miss by returning `null`, not by throwing, so a naive
   * catch-and-continue would treat a replica's clean miss as a "success" and
   * stop searching right there. Here `null` explicitly means "keep looking":
   * primary hit returns immediately; a primary infra error is remembered but
   * doesn't stop the search; replicas are tried in order and the first
   * non-null answer wins; an unreachable/erroring replica is treated the
   * same as a miss (keep looking); if nothing answers, the remembered
   * primary error is rethrown, else the result is a genuine `null`.
   */
  async stat(key: string): Promise<ObjectStat | null> {
    assertValidKey(key);
    let primaryErr: unknown;
    try {
      const primaryStat = await this.primary.stat(key);
      if (primaryStat !== null) return primaryStat;
    } catch (err) {
      if (!shouldFallback(err)) throw err;
      primaryErr = err;
    }
    for (const replica of this.replicas) {
      let replicaStat: ObjectStat | null;
      try {
        replicaStat = await replica.stat(key);
      } catch {
        continue; // unreachable/erroring replica — keep looking
      }
      if (replicaStat !== null) return replicaStat;
    }
    if (primaryErr !== undefined) throw primaryErr;
    return null;
  }

  async delete(key: string): Promise<void> {
    assertValidKey(key);
    await this.primary.delete(key); // hard primary failures propagate
    for (const replica of this.replicas) {
      try {
        await replica.delete(key);
      } catch (err) {
        this.reportReplicaFailure(replica.id, key, 'delete', err);
      }
    }
  }

  async *list(prefix: string): AsyncIterable<ObjectStat> {
    assertValidPrefix(prefix);
    let yieldedAny = false;
    try {
      for await (const stat of this.primary.list(prefix)) {
        yieldedAny = true;
        yield stat;
      }
      return;
    } catch (err) {
      // Once items have been handed out, switching sources mid-stream would
      // duplicate or drop keys — only an up-front primary failure falls back.
      if (yieldedAny || !shouldFallback(err)) throw err;
      for (const replica of this.replicas) {
        try {
          for await (const stat of replica.list(prefix)) yield stat;
          return;
        } catch {
          /* try next replica */
        }
      }
      throw err;
    }
  }

  /**
   * Copy existing primary objects under the given prefixes to every replica,
   * then sweep each replica for objects the primary no longer has (backfill/
   * stats spec, extended by the deletion-sweep spec — a "Sync now" run makes
   * the target match the source, it isn't a one-way trash-can). NOT part of
   * the StorageDriver contract — mirror specific and additive.
   *
   * Three phases: enumerate (honest total), copy, sweep. `done`/`total` only
   * ever reflect the copy phase's primary-side enumeration; the sweep phase
   * doesn't touch them. `copied`/`skipped`/`failed` count replica-level copy
   * outcomes; `deleted` counts replica-level sweep deletions. Replica errors
   * (stat/put/delete/list) flow through the same failure funnel the write
   * path uses and never abort the run; PRIMARY errors from the copy phase
   * (list/getStream) propagate — a getStream failure is deliberately kept
   * outside the per-replica try/catch so it can never be misclassified as a
   * replica failure. Objects are compared by size only — the same criterion
   * a re-put would settle anyway.
   *
   * Sweep: the copy loop above already visits every primary key under the
   * given prefixes, so it doubles as the key-set collection (no extra
   * primary listing pass). Once the copy loop finishes, each replica is
   * listed per prefix; any key it holds that isn't in that primary key-set
   * is re-checked against `primary.stat` — the authoritative race gate for a
   * primary that regained the key between the copy loop and here — and only
   * deleted if that re-check still comes back empty. A replica whose `list`
   * itself fails is reported and skipped; the sweep continues with the next
   * replica. Cancellation is honored per key, same as the copy phase.
   */
  async backfill(prefixes: readonly string[], hooks: BackfillHooks): Promise<BackfillResult> {
    const progress: BackfillProgress = { done: 0, total: 0, copied: 0, skipped: 0, failed: 0, deleted: 0 };
    for (const prefix of prefixes) {
      for await (const _stat of this.primary.list(prefix)) progress.total += 1;
    }
    hooks.onProgress({ ...progress });

    const primaryKeys = new Set<string>();
    for (const prefix of prefixes) {
      for await (const stat of this.primary.list(prefix)) {
        if (hooks.isCancelled()) return { ...progress, cancelled: true };
        primaryKeys.add(stat.key);

        // Phase A: decide, per replica, whether it needs this key. Replica
        // stat failures are reported and counted here — they never touch the
        // primary-only try/catch below.
        const needy: StorageDriver[] = [];
        for (const replica of this.replicas) {
          try {
            const existing = await replica.stat(stat.key);
            if (existing && existing.size === stat.size) {
              progress.skipped += 1;
            } else {
              needy.push(replica);
            }
          } catch (err) {
            progress.failed += 1;
            this.reportReplicaFailure(replica.id, stat.key, 'stat', err);
          }
        }

        // Phase B: only if some replica needs the bytes, materialize the key
        // once (the put() spool pattern). A primary getStream/pipeline
        // failure here RETHROWS — it is a primary error, not a replica one.
        if (needy.length > 0) {
          const file = path.join(this.tempDir(), randomUUID());
          try {
            const { stream } = await this.primary.getStream(stat.key);
            await pipeline(stream, fs.createWriteStream(file));
          } catch (err) {
            await fs.promises.rm(file, { force: true });
            throw err;
          }
          try {
            for (const replica of needy) {
              try {
                await replica.put(stat.key, fs.createReadStream(file), { contentType: contentTypeFor(stat.key) });
                progress.copied += 1;
              } catch (err) {
                progress.failed += 1;
                this.reportReplicaFailure(replica.id, stat.key, 'put', err);
              }
            }
          } finally {
            await fs.promises.rm(file, { force: true });
          }
        }

        progress.done += 1;
        if (progress.done > progress.total) progress.total = progress.done;
        hooks.onProgress({ ...progress });
      }
    }
    progress.total = progress.done;

    // Phase 3: deletion sweep. Bounds the staleness window a failed replica
    // delete (or a genuinely-missing-on-primary object) can leave open for
    // mirror read-fallback — see the class doc above.
    for (const prefix of prefixes) {
      for (const replica of this.replicas) {
        try {
          for await (const stat of replica.list(prefix)) {
            if (hooks.isCancelled()) return { ...progress, cancelled: true };
            if (primaryKeys.has(stat.key)) continue;

            // Race gate: the primary may have regained this key between the
            // copy loop above and now — authoritative, re-checked per key.
            let primaryStat: ObjectStat | null;
            try {
              primaryStat = await this.primary.stat(stat.key);
            } catch (err) {
              progress.failed += 1;
              this.reportReplicaFailure(replica.id, stat.key, 'stat', err);
              hooks.onProgress({ ...progress });
              continue;
            }
            if (primaryStat) {
              hooks.onProgress({ ...progress }); // spared — primary regained it
              continue;
            }

            try {
              await replica.delete(stat.key);
              progress.deleted += 1;
            } catch (err) {
              progress.failed += 1;
              this.reportReplicaFailure(replica.id, stat.key, 'delete', err);
            }
            hooks.onProgress({ ...progress });
          }
        } catch (err) {
          // The replica's list() itself failed (up front or mid-stream):
          // report against the prefix, skip this replica, sweep continues.
          progress.failed += 1;
          this.reportReplicaFailure(replica.id, prefix, 'list', err);
        }
      }
    }

    return { ...progress, cancelled: false };
  }

  private async fromReplicas<T>(fn: (replica: StorageDriver) => Promise<T>, primaryErr: unknown): Promise<T> {
    for (const replica of this.replicas) {
      try {
        return await fn(replica);
      } catch {
        /* try next replica */
      }
    }
    throw primaryErr;
  }

  private reportReplicaFailure(backend: string, key: string, op: ReplicaFailure['op'], err: unknown): void {
    this.onReplicaFailure?.({
      backend,
      key,
      op,
      error: describeError(err),
      at: Date.now(),
    });
  }
}

/**
 * Used by `list()`'s primary-error branch and by `stat()`'s primary-error
 * branch: fall back only on a real (infra) error, never on a deterministic
 * bad-key rejection. `StorageNotFoundError` is excluded too, though it's
 * moot for `stat` (the contract signals a miss via `null`, never a throw) —
 * `getStream`, which DOES throw `StorageNotFoundError` on a miss, uses its
 * own inline check instead so a primary miss can fall through to replicas
 * per the "ANY member holds it" invariant.
 */
function shouldFallback(err: unknown): boolean {
  return !(err instanceof StorageNotFoundError || err instanceof StorageInvalidKeyError);
}
