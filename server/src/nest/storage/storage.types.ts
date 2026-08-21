import type { Readable } from 'node:stream';

/**
 * The storage abstraction's contract surface (spec:
 * docs/superpowers/specs/2026-07-20-storage-backend-abstraction-design.md).
 *
 * S3 constraints are baked into the driver contract, not the implementation:
 * keys are opaque POSIX-style strings, no rename/append/partial writes, no
 * directory semantics. Adding a backend later means one driver file that
 * passes the contract suite (tests/unit/nest/storage/storage-driver.contract.ts)
 * — zero changes to controllers or services.
 */

// Relocated to shared (the wire schema needs it; a second copy is forbidden).
// Re-exported so every existing `./storage.types` import keeps working.
export { STORAGE_CATEGORIES, type StorageCategory } from '@trek/shared';
import { STORAGE_CATEGORIES as CONFIGURABLE_CATEGORIES, type StorageCategory as ConfigurableCategory } from '@trek/shared';

/**
 * Categories the byte-paths serve. `photos` is the legacy shared photo
 * directory (/uploads/photos): earlier TREK versions wrote place photos there
 * and its objects are still served and backed up, but it is NOT configurable —
 * it left STORAGE_CATEGORIES (category-labels spec) and always resolves to
 * uploads-local (following a name-override, never a category entry).
 */
export const SERVED_CATEGORIES = [...CONFIGURABLE_CATEGORIES, 'photos'] as const;
export type ServedCategory = ConfigurableCategory | 'photos';

export interface ObjectStat {
  key: string;
  size: number;
  mtimeMs: number;
}

/** Inclusive byte range, `fs.createReadStream` semantics; `end` omitted = to EOF. */
export interface ByteRange {
  start: number;
  end?: number;
}

/** Ignored by local drivers; a future S3 driver needs it for the PUT. */
export interface PutOptions {
  contentType?: string;
}

/**
 * A temp file whose OWNERSHIP transfers to `put()`: the driver moves or
 * consumes it (rename into place locally; upload-then-delete remotely).
 * Callers must not touch the path afterwards.
 */
export interface LocalTempFile {
  tmpPath: string;
}

export function isLocalTempFile(source: Readable | LocalTempFile): source is LocalTempFile {
  return typeof (source as LocalTempFile).tmpPath === 'string';
}

/**
 * A socket-facing error code/syscall that LOOKS like "the client walked away
 * or the pipe broke" — but is not, by itself, proof of that: the same codes
 * (ECONNRESET, ERR_STREAM_PREMATURE_CLOSE) can come from a driver's own
 * source stream failing for a real reason (e.g. the S3 SDK's HTTP response
 * dropping on a genuine network blip), independent of the browser client.
 * Callers MUST additionally gate on `res.headersSent` before treating a
 * match as safe to swallow: a pre-header failure is always a real failure
 * (the caller's miss contract — 404/204/next() — must still run), and only a
 * POST-header match is the client walking away mid-download. See
 * storage.service.ts's sendToResponse (the remote pipeline() branch gates
 * this way explicitly; the local res.sendFile branch's callback only ever
 * fires post-attempt, so it swallows unconditionally) and the maps/share
 * place-photo proxies, which gate the same way around their own pipeline()
 * call.
 */
export function isClientAbortError(err: unknown): boolean {
  const e = err as { code?: string; syscall?: string } | null | undefined;
  if (!e || typeof e !== 'object') return false;
  return (
    e.code === 'ECONNABORTED' ||
    e.code === 'ECONNRESET' ||
    e.code === 'ERR_STREAM_PREMATURE_CLOSE' ||
    e.syscall === 'write'
  );
}

export interface StorageDriver {
  /** Backend instance name, e.g. 'uploads-local'. */
  readonly id: string;
  /** Atomic: spool + single rename locally; single/multipart PUT remotely. */
  put(key: string, source: Readable | LocalTempFile, opts?: PutOptions): Promise<void>;
  getStream(key: string, range?: ByteRange): Promise<{ stream: Readable; stat: ObjectStat }>;
  stat(key: string): Promise<ObjectStat | null>;
  /** Idempotent; resolving on a missing key is success. */
  delete(key: string): Promise<void>;
  list(prefix: string): AsyncIterable<ObjectStat>;
  /** Fast-path for local drivers; `null`/absent is exactly the remote-driver branch every caller must handle. */
  getLocalPath?(key: string): string | null;
  /** Same-filesystem spool dir (LocalDriver: `<root>/.tmp`), or null for drivers with no local filesystem. */
  getSpoolDir?(): string | null;
}

/**
 * Typed error set so route handlers map storage failures to their existing
 * bespoke envelopes without string-matching driver internals.
 */
export class StorageBackendError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'StorageBackendError';
  }
}

export class StorageNotFoundError extends Error {
  constructor(readonly key: string) {
    super(`storage object not found: ${key}`);
    this.name = 'StorageNotFoundError';
  }
}

/** Serving slices map this to a miss (404/next()), never a 500. */
export class StorageInvalidKeyError extends Error {
  constructor(readonly key: string) {
    super(`invalid storage key: ${key}`);
    this.name = 'StorageInvalidKeyError';
  }
}
