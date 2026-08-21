import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import type { ReplicaFailure } from './drivers/mirror.driver';
import { assertValidKey } from './storage-keys';
import { StorageRegistryService } from './storage-registry.service';
import {
  isClientAbortError,
  type ByteRange,
  type LocalTempFile,
  type ObjectStat,
  type PutOptions,
  type ServedCategory,
  type StorageDriver,
} from './storage.types';

export interface SendOptions {
  contentType?: string;
  disposition?: string;
}

interface Resolved {
  driver: StorageDriver;
  keyPrefix: string;
  key: string;
}

/**
 * The facade all call sites use — and the ONLY entry point: callers address
 * storage exclusively as (category, name) on this injected service. They
 * never import a driver, never hold a driver or backend reference, and never
 * know which instance serves a category — resolution happens inside the
 * registry on every call. That is what makes backend reconfiguration a
 * config-plus-reload() operation instead of a code change.
 *
 * `sendToResponse` and `withLocalFile` are the two helpers that make a remote
 * backend a driver-only change later: every byte-consumer goes through one of
 * them, and each owns the local-fast-path vs stream branch exactly once.
 */
@Injectable()
export class StorageService {
  constructor(private readonly registry: StorageRegistryService) {}

  /** Driver-agnostic global scratch space (data/tmp). */
  tempDir(): string {
    return this.registry.tempDir();
  }

  /** The category backend's same-volume spool dir, else tempDir(). Resolved per call. */
  spoolDirFor(category: ServedCategory): string {
    return this.registry.resolve(category).driver.getSpoolDir?.() ?? this.tempDir();
  }

  // The read/write methods are async so key-validation failures surface as
  // rejections, never synchronous throws — callers treat storage uniformly.

  async put(
    category: ServedCategory,
    name: string,
    source: Readable | LocalTempFile,
    opts?: PutOptions,
  ): Promise<void> {
    const { driver, key } = this.resolve(category, name);
    return driver.put(key, source, opts);
  }

  async getStream(
    category: ServedCategory,
    name: string,
    range?: ByteRange,
  ): Promise<{ stream: Readable; stat: ObjectStat }> {
    const { driver, key } = this.resolve(category, name);
    return driver.getStream(key, range);
  }

  async stat(category: ServedCategory, name: string): Promise<ObjectStat | null> {
    const { driver, key } = this.resolve(category, name);
    return driver.stat(key);
  }

  async exists(category: ServedCategory, name: string): Promise<boolean> {
    return (await this.stat(category, name)) !== null;
  }

  async delete(category: ServedCategory, name: string): Promise<void> {
    const { driver, key } = this.resolve(category, name);
    return driver.delete(key);
  }

  /** Names in and out are category-relative — the key prefix stays a registry detail. */
  async *list(category: ServedCategory, subPrefix = ''): AsyncIterable<ObjectStat> {
    const { driver, keyPrefix } = this.registry.resolve(category);
    for await (const stat of driver.list(keyPrefix + subPrefix)) {
      yield { ...stat, key: stat.key.slice(keyPrefix.length) };
    }
  }

  /**
   * Serve an object into an Express response. Local backends use the
   * root-relative res.sendFile form — absolute paths resolve against the
   * rewritten req.url under the ExpressAdapter and spuriously 404
   * (files-download.controller.ts) — which brings etag/range/conditional-GET
   * for free. Path-less (remote) drivers, and a local path whose file has
   * vanished from disk (checked via `localPathIfPresent`, never trusted from
   * `getLocalPath` alone), both fall through to the stream branch — for a
   * MirrorDriver that reaches a replica that still holds the object, for a
   * plain LocalDriver a genuine miss (`getStream` throws
   * StorageNotFoundError, same as always — one extra driver call). A miss
   * throws StorageNotFoundError: the caller owns the route's miss contract
   * (404 envelope, 204-empty, or next()).
   */
  async sendToResponse(category: ServedCategory, name: string, res: Response, opts?: SendOptions): Promise<void> {
    const { driver, key } = this.resolve(category, name);

    const localPath = this.localPathIfPresent(driver, key);
    if (localPath !== null) {
      this.applyHeaders(res, opts);
      await new Promise<void>((resolve, reject) => {
        res.sendFile(path.basename(localPath), { root: path.dirname(localPath) }, (err) => {
          if (!err) {
            resolve();
            return;
          }
          // Client gone / bytes already on the wire: nothing useful to send —
          // mirrors res.sendFile's own default callback (express
          // response.js), which is the exact contract
          // storageStaticHandler (platform.routes.ts) already implements
          // caller-side for the /uploads/* static mounts.
          if (isClientAbortError(err)) {
            resolve();
            return;
          }
          reject(err);
        });
      });
      return;
    }

    const { stream, stat } = await driver.getStream(key);
    res.setHeader('Content-Length', String(stat.size));
    this.applyHeaders(res, opts);
    try {
      // pipeline (unlike the hand-rolled pipe+Promise it replaces) destroys
      // BOTH ends on any failure, so a client abort no longer leaks the
      // source stream (an S3 keep-alive socket, an open fd, …).
      await pipeline(stream, res);
    } catch (err) {
      // Gate the swallow on headersSent, not just the error code: the source
      // here is the driver's raw stream (e.g. the S3 SDK's HTTP response),
      // which can itself throw ECONNRESET/ERR_STREAM_PREMATURE_CLOSE on a
      // genuine network blip that has nothing to do with the browser client
      // — before any byte has reached res. A pre-header failure of ANY code
      // must still reject so the caller's miss contract (404/204/next())
      // runs; only a POST-header failure is the client walking away
      // mid-download, and only then is an abort-like code safe to swallow.
      if (!res.headersSent || !isClientAbortError(err)) throw err;
    }
  }

  /**
   * Hand a consumer (Jimp, zip packing, Immich push, …) a real filesystem
   * path: the local fast-path when the driver has one AND the file is
   * actually on disk (`localPathIfPresent`), else download to tempDir() and
   * clean up afterwards — the same fall-through `sendToResponse` uses, and
   * exactly the branch a remote driver (or a local path gone missing) will
   * exercise.
   */
  async withLocalFile<T>(category: ServedCategory, name: string, fn: (absPath: string) => Promise<T>): Promise<T> {
    const { driver, key } = this.resolve(category, name);

    const localPath = this.localPathIfPresent(driver, key);
    if (localPath !== null) {
      return fn(localPath);
    }

    const tmp = path.join(this.tempDir(), randomUUID());
    const { stream } = await driver.getStream(key);
    await pipeline(stream, fs.createWriteStream(tmp));
    try {
      return await fn(tmp);
    } finally {
      await fs.promises.rm(tmp, { force: true });
    }
  }

  /**
   * A narrow locality probe: the real filesystem path for the object, or
   * null when there isn't one — a remote (path-less) driver, or a local
   * driver whose file no longer exists on disk. The fs-existence check is
   * the fail-safe half of the contract: a caller that trusts a stale path
   * (deleted between listing and this call, or by another process) would
   * otherwise silently skip or corrupt-read the object instead of falling
   * back to the stream path. Same spirit as spoolDirFor — exposes a path,
   * never a driver.
   */
  async getLocalPathOrNull(category: ServedCategory, name: string): Promise<string | null> {
    const { driver, key } = this.resolve(category, name);
    return this.localPathIfPresent(driver, key);
  }

  /** Replica failures from mirror backends — logged there, surfaced here. */
  health(): { replicaFailures: readonly ReplicaFailure[] } {
    return { replicaFailures: this.registry.replicaFailures() };
  }

  private resolve(category: ServedCategory, name: string): Resolved {
    const { driver, keyPrefix } = this.registry.resolve(category);
    const key = keyPrefix + name;
    assertValidKey(key);
    return { driver, keyPrefix, key };
  }

  /**
   * The shared local-fast-path gate for sendToResponse/withLocalFile/
   * getLocalPathOrNull: a driver's `getLocalPath` alone is never trusted as
   * proof the object is at that path — composite drivers (MirrorDriver)
   * resolve it against the primary ONLY, and even a plain local driver's
   * path can vanish between listing and this call. Null here means "no
   * usable local path" for any reason; callers fall through to the stream
   * branch, which is what actually consults a MirrorDriver's replicas.
   */
  private localPathIfPresent(driver: StorageDriver, key: string): string | null {
    const localPath = driver.getLocalPath?.(key) ?? null;
    if (localPath === null) return null;
    return fs.existsSync(localPath) ? localPath : null;
  }

  private applyHeaders(res: Response, opts?: SendOptions): void {
    if (opts?.contentType) res.setHeader('Content-Type', opts.contentType);
    if (opts?.disposition) res.setHeader('Content-Disposition', opts.disposition);
  }
}
