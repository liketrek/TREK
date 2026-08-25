/// <reference types="@aws-lite/s3-types" />
import awsLite from '@aws-lite/client';
import { PassThrough, Transform, type Readable } from 'node:stream';
import fs from 'node:fs';
import { assertValidKey, assertValidPrefix, isValidKey } from '../storage-keys';
import {
  StorageBackendError,
  StorageNotFoundError,
  isLocalTempFile,
  type ByteRange,
  type LocalTempFile,
  type ObjectStat,
  type PutOptions,
  type StorageDriver,
} from '../storage.types';

/**
 * S3-compatible driver over @aws-lite/client + @aws-lite/s3 (spec:
 * docs/superpowers/specs/2026-08-17-s3-storage-driver-design.md). The client
 * is a driver-internal detail — nothing outside this file imports aws-lite.
 * aws-lite exposes no request timeout or abort signal, so the driver owns the
 * deadline: per client call for single-request operations, inactivity-based
 * for multipart Upload (destroying the interposed monitoring Transform drives
 * Upload's own error path — in-flight parts drain, then AbortMultipartUpload
 * fires).
 */

/** One multipart chunk (aws-lite Upload default) — also the peek threshold. */
export const MULTIPART_THRESHOLD = 10 * 1024 * 1024;

export interface S3ClientOptions {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  retries: number;
  keepAlive: boolean;
}

/** The S3 surface the driver consumes — structural, so tests inject a plain object. */
export interface S3Api {
  PutObject(input: Record<string, unknown>): Promise<unknown>;
  Upload(input: Record<string, unknown>): Promise<unknown>;
  GetObject(input: Record<string, unknown>): Promise<{
    Body?: Readable;
    ContentLength?: number;
    ContentRange?: string;
    LastModified?: Date;
    ETag?: string;
  }>;
  HeadObject(input: Record<string, unknown>): Promise<{ ContentLength?: number; LastModified?: Date; ETag?: string }>;
  DeleteObject(input: Record<string, unknown>): Promise<unknown>;
  ListObjectsV2(input: Record<string, unknown>): Promise<
    AsyncIterable<{ Contents?: Array<{ Key?: string; Size?: number; LastModified?: Date }> }>
  >;
}

// `Omit<S3ClientOptions, 'keepAlive'>` rather than a bare `S3ClientOptions &`:
// intersecting with the required `keepAlive: boolean` would make the
// `keepAlive?: boolean` below a no-op (TS keeps the property required when
// either side of an `&` requires it).
export type S3DriverOptions = Omit<S3ClientOptions, 'keepAlive'> & {
  id: string;
  bucket: string;
  keyPrefix: string;
  timeoutMs: number;
  keepAlive?: boolean;
  clientFactory?: (opts: S3ClientOptions) => Promise<S3Api>;
};

/** Bare GetObject content-sniffs; streamResponsePayload is mandatory (spec, Client). */
export async function defaultClientFactory(opts: S3ClientOptions): Promise<S3Api> {
  const client = await awsLite({
    accessKeyId: opts.accessKeyId,
    secretAccessKey: opts.secretAccessKey,
    region: opts.region,
    endpoint: opts.endpoint,
    retries: opts.retries,
    keepAlive: opts.keepAlive,
    plugins: [await import('@aws-lite/s3')],
  });
  // The `/// <reference types="@aws-lite/s3-types" />` above pulls in the
  // declaration-merged `AwsLiteClient.S3` (https://aws-lite.org/using-typescript),
  // so `client.S3` itself needs no cast. This one narrow cast remains because
  // of a genuine structural mismatch: the real PutObject/Upload signatures
  // require `Bucket`/`Key` (plus other required fields), which S3Api's
  // deliberately permissive `Record<string, unknown>` input can't guarantee —
  // method-syntax parameter bivariance still rejects that narrowing. This is
  // the one sanctioned `as unknown as` boundary; no other cast in this file.
  return client.S3 as unknown as S3Api;
}

function statusCode(err: unknown): number | undefined {
  return (err as { statusCode?: number }).statusCode;
}
function errorCode(err: unknown): string | undefined {
  const code = (err as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}
/** aws-lite 404s: statusCode 404, code 'NoSuchKey' (GetObject) or 'NotFound' (HeadObject, bodiless). */
function isNotFound(err: unknown): boolean {
  const code = errorCode(err);
  return statusCode(err) === 404 || code === 'NoSuchKey' || code === 'NotFound';
}

/**
 * Workaround for a verified upstream signing defect, scoped ONLY to the
 * buffered zero-byte `Body` path in `put()` below — a zero-byte PutObject
 * `Body: Buffer` fails against real S3-compatible servers (confirmed against
 * MinIO) with 403 SignatureDoesNotMatch, while any non-empty `Body` succeeds
 * via the identical code path. Root cause, traced through the installed deps:
 *
 * - `@aws-lite/s3`'s PutObject (node_modules/@aws-lite/s3/src/put-object.mjs:99,
 *   the default `!ApplyChecksum` "unsigned payload" branch) always sets
 *   `headers['content-length'] = dataSize` — a *number*, including `0`.
 * - `aws4`'s signer (node_modules/aws4/aws4.js:151-152, aws4@1.13.2) then runs
 *   `if (request.body && !headers['Content-Length'] && !headers['content-length'])
 *      headers['Content-Length'] = Buffer.byteLength(request.body)`.
 *   `!0 === true`, so aws4 treats the already-set `0` as "unset" and injects
 *   a SECOND, differently-cased `Content-Length` header onto the same object.
 *   JS object keys are case-sensitive, so both survive; aws4's
 *   `filterHeaders()` (aws4.js:302-308) lowercases each header entry for
 *   canonicalization WITHOUT deduping by that lowercased name — the two
 *   distinct keys stay two distinct entries — so `canonicalHeaders()`/
 *   `signedHeaders()` (aws4.js:311-322, which just map/join whatever
 *   `filterHeaders()` produced) sign `content-length` *twice*
 *   (`SignedHeaders=content-length;content-length;...`, confirmed live
 *   against MinIO (see the manual procedure in docker-compose.minio-test.yml)).
 *   MinIO's own canonicalization of the
 *   headers it actually received doesn't reproduce that duplicate, so the
 *   signatures disagree — 403. Any non-empty body makes
 *   `headers['content-length']` a truthy number, so aws4's guard never fires
 *   and no duplicate is ever added — hence the bug is exactly the size-0
 *   boundary, nothing else.
 *
 * The `File` route (`put-object.mjs:87`, `payload = createReadStream(File)`)
 * is NOT affected and must NOT get this workaround: aws-lite's request
 * builder (`@aws-lite/client/src/request/index.js:60,90`) sets
 * `params.body = undefined` for any stream payload, so aws4.js:151's
 * `request.body && ...` guard never even evaluates truthy there — a
 * zero-byte temp file signs correctly today. Only the buffered `Body: Buffer`
 * call site below needs this.
 *
 * `ApplyChecksum: true` routes PutObject through @aws-lite/s3's OTHER branch
 * (put-object.mjs:106-118), which never pre-sets Content-Length itself —
 * aws4 then adds it exactly once, and independently computes a correct
 * `x-amz-content-sha256` for the (empty) body instead of `UNSIGNED-PAYLOAD`.
 * Verified end-to-end against real MinIO: 200 OK, correct empty-object ETag.
 * The extra checksum cost is nil for a 0-byte body. Delete this workaround
 * once aws4 dedupes header keys case-insensitively before signing (or
 * @aws-lite/s3 stops pre-setting a falsy-numeric Content-Length).
 */
function zeroByteChecksumWorkaround(size: number): { ApplyChecksum: true } | Record<string, never> {
  return size === 0 ? { ApplyChecksum: true } : {};
}

export class S3Driver implements StorageDriver {
  readonly id: string;
  private readonly bucket: string;
  private readonly keyPrefix: string;
  private readonly timeoutMs: number;
  private readonly clientOptions: S3ClientOptions;
  private readonly clientFactory: (opts: S3ClientOptions) => Promise<S3Api>;
  private clientPromise: Promise<S3Api> | null = null;

  constructor(opts: S3DriverOptions) {
    this.id = opts.id;
    this.bucket = opts.bucket;
    this.keyPrefix = normalizeKeyPrefix(opts.keyPrefix);
    this.timeoutMs = opts.timeoutMs;
    this.clientFactory = opts.clientFactory ?? defaultClientFactory;
    this.clientOptions = {
      endpoint: opts.endpoint,
      region: opts.region,
      accessKeyId: opts.accessKeyId,
      secretAccessKey: opts.secretAccessKey,
      retries: opts.retries,
      keepAlive: opts.keepAlive ?? true,
    };
  }

  /** No local filesystem — callers fall back to storage.tempDir(). */
  getSpoolDir(): null {
    return null;
  }

  async put(key: string, source: Readable | LocalTempFile, opts?: PutOptions): Promise<void> {
    assertValidKey(key);
    const s3 = await this.client();
    const base: Record<string, unknown> = { Bucket: this.bucket, Key: this.keyPrefix + key };
    if (opts?.contentType) base.ContentType = opts.contentType;

    if (isLocalTempFile(source)) {
      // Ownership transfer: consume the tmp file on success AND failure.
      try {
        const { size } = await fs.promises.stat(source.tmpPath);
        if (size < MULTIPART_THRESHOLD) {
          await this.deadlined(s3.PutObject({ ...base, File: source.tmpPath }), `put '${key}'`);
        } else {
          await this.uploadMonitored(s3, base, fs.createReadStream(source.tmpPath), key);
        }
      } catch (err) {
        throw this.wrap(err, `put failed for '${key}'`);
      } finally {
        await fs.promises.rm(source.tmpPath, { force: true });
      }
      return;
    }

    // Bounded peek (spec, Client): a stream ending within the threshold —
    // including zero bytes — becomes one PutObject with the buffered Body (the
    // same memory Upload would buffer for part 1, and one round trip instead
    // of 3+; aws-lite's Upload also breaks on empty streams). A larger stream
    // flows into Upload with the prefix re-attached. An unbounded stream never
    // reaches PutObject, which would buffer it wholesale.
    const peeked = await peekStream(source, MULTIPART_THRESHOLD); // source errors surface untouched
    // `readableEnded` guards a race: a source whose 'end' fires between the
    // peek resolving (size > threshold) and pipe() attaching would never end
    // the PassThrough — but ended means the chunks already hold everything.
    if (peeked.ended || source.readableEnded) {
      try {
        const body = Buffer.concat(peeked.chunks);
        await this.deadlined(
          s3.PutObject({ ...base, Body: body, ...zeroByteChecksumWorkaround(body.length) }),
          `put '${key}'`,
        );
      } catch (err) {
        throw this.wrap(err, `put failed for '${key}'`);
      }
      return;
    }
    const combined = new PassThrough();
    for (const chunk of peeked.chunks) combined.write(chunk);
    source.pipe(combined);
    source.on('error', (err) => combined.destroy(err));
    try {
      await this.uploadMonitored(s3, base, combined, key, source);
    } catch (err) {
      throw this.wrap(err, `put failed for '${key}'`);
    }
  }

  /**
   * Multipart Upload under an INACTIVITY deadline: a fixed whole-operation
   * deadline would break large backups, so the timer resets on data movement.
   *
   * The reset signal comes from an interposed Transform, NOT a `'data'`
   * listener on `body` itself: `Readable.on('data', ...)` calls `resume()`
   * on the next tick, so `body` would start flowing before aws-lite's Upload
   * ever attaches its own consumer (it awaits a full CreateMultipartUpload
   * round trip first) — anything emitted in that window has nowhere to land
   * and is lost, silently truncating the object. A Transform's readable side
   * only flows once something actually reads it, so bytes queue in its
   * internal buffer (bounded by backpressure) until Upload's real consumer
   * attaches; nothing is dropped, and "inactivity" tracks real data
   * movement through the transform.
   *
   * Expiry destroys the Transform, the piped `body`, and (for the streaming
   * put path) the original source — driving Upload's own error path
   * (in-flight parts drain, then AbortMultipartUpload fires, verified
   * upstream). Any OTHER Upload failure gets the same cleanup so a failed
   * large upload never leaks an open fd/socket.
   */
  private async uploadMonitored(
    s3: S3Api,
    base: Record<string, unknown>,
    body: Readable,
    key: string,
    sourceToDestroy?: Readable,
  ): Promise<void> {
    let timer: NodeJS.Timeout | undefined;
    const expire = () => {
      const err = new StorageBackendError(
        `put '${key}' stalled for ${this.timeoutMs}ms on '${this.id}' — multipart upload aborted`,
      );
      monitored.destroy(err);
      body.destroy(err);
      sourceToDestroy?.destroy(err);
    };
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(expire, this.timeoutMs);
      timer.unref?.();
    };
    const monitored = new Transform({
      transform(chunk, _encoding, callback) {
        reset();
        callback(null, chunk);
      },
    });
    // Workaround for a verified upstream defect: a ContentType param corrupts
    // @aws-lite/s3 Upload's final CompleteMultipartUpload request. Upload
    // builds that request as `headers: { ...xml, ...getHeadersFromParams(
    // params) }` (node_modules/@aws-lite/s3/src/upload.mjs:76-81) — the
    // param-derived `content-type` (e.g. application/zip) is spread AFTER and
    // clobbers the `application/xml` default, which flips @aws-lite/client's
    // payload serializer (client/src/request/index.js:69) off its
    // `XMLContentType` branch: the parts list is sent as JSON, and the server
    // rejects it with 400 MalformedXML ("XML syntax error on line 0: EOF" —
    // confirmed live against MinIO AIStor; any S3 would refuse the same).
    // Dropping ContentType here means multipart objects are stored without
    // it, which TREK never reads back — sendToResponse derives Content-Type
    // from the key/caller, never from object metadata. The single-request
    // PutObject paths keep ContentType. Delete this (and pass `base`
    // through) once Upload stops leaking params into its Complete headers.
    const { ContentType: _dropped, ...uploadBase } = base;
    // Attached BEFORE pipe()/destroy() can fire: an 'error' emitted on a
    // Readable with no listener crashes the process, and both a genuine
    // upstream read failure and our own expire()/catch cleanup emit one.
    // `monitored` gets its own last-resort no-op: real aws-lite Upload
    // attaches its own listener to `monitored` (the `Body` it receives)
    // only after its CreateMultipartUpload round trip, so an expiry that
    // fires in that window would otherwise destroy an unlistened stream —
    // Upload's later read still observes the already-errored/destroyed
    // state, so this doesn't swallow anything Upload would have seen.
    //
    // `onBodyError` is intentionally never `.off()`'d: `expire()` calls
    // `monitored.destroy(err)` and `body.destroy(err)` back to back, each
    // scheduling its own deferred 'error' emission. The FIRST (monitored's)
    // rejects `s3.Upload(...)`, whose `catch`/`finally` runs as an
    // interleaved microtask — before the SECOND (body's) emission gets its
    // turn. Removing the listener there would leave that second emission
    // unlistened and crash the process (verified with a standalone repro).
    // Leaving it attached is harmless: `body` is single-use and discarded
    // with `uploadMonitored`, so nothing keeps accumulating listeners.
    const onBodyError = (err: Error) => monitored.destroy(err);
    body.on('error', onBodyError);
    monitored.on('error', () => {});
    reset();
    body.pipe(monitored);
    try {
      await s3.Upload({ ...uploadBase, Body: monitored, ChunkSize: MULTIPART_THRESHOLD });
    } catch (err) {
      monitored.destroy();
      body.destroy();
      sourceToDestroy?.destroy();
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async getStream(key: string, range?: ByteRange): Promise<{ stream: Readable; stat: ObjectStat }> {
    assertValidKey(key);
    const s3 = await this.client();
    const params: Record<string, unknown> = {
      Bucket: this.bucket,
      Key: this.keyPrefix + key,
      // Mandatory: a bare GetObject content-sniffs and parses JSON/XML bodies.
      streamResponsePayload: true,
    };
    if (range) params.Range = `bytes=${range.start}-${range.end ?? ''}`;
    let res;
    try {
      // Deadline covers time-to-headers; body streaming is never deadlined.
      res = await this.deadlined(s3.GetObject(params), `get '${key}'`);
    } catch (err) {
      if (isNotFound(err)) throw new StorageNotFoundError(key);
      throw this.wrap(err, `get failed for '${key}'`);
    }
    if (!res.Body) throw new StorageBackendError(`get returned no body for '${key}' on '${this.id}'`);
    // LocalDriver parity: on a ranged read the stat is the FULL object's —
    // total from the 206 Content-Range, never the ranged ContentLength.
    const size = range ? totalFromContentRange(res.ContentRange, key, this.id) : (res.ContentLength ?? 0);
    // The ETag's opaque value passes through untouched — on a ranged GET it
    // is still the FULL object's tag (same as `size` above), which is exactly
    // what a conditional/If-Range client needs.
    return {
      stream: res.Body,
      stat: { key, size, mtimeMs: res.LastModified?.getTime() ?? 0, etag: normalizeEtag(res.ETag) },
    };
  }

  async stat(key: string): Promise<ObjectStat | null> {
    assertValidKey(key);
    const s3 = await this.client();
    try {
      const res = await this.deadlined(s3.HeadObject({ Bucket: this.bucket, Key: this.keyPrefix + key }), `stat '${key}'`);
      return {
        key,
        size: res.ContentLength ?? 0,
        mtimeMs: res.LastModified?.getTime() ?? 0,
        etag: normalizeEtag(res.ETag),
      };
    } catch (err) {
      if (isNotFound(err)) return null;
      throw this.wrap(err, `stat failed for '${key}'`);
    }
  }

  async delete(key: string): Promise<void> {
    assertValidKey(key);
    const s3 = await this.client();
    try {
      await this.deadlined(s3.DeleteObject({ Bucket: this.bucket, Key: this.keyPrefix + key }), `delete '${key}'`);
    } catch (err) {
      if (isNotFound(err)) return; // idempotent — S3 204s on missing keys; some compatibles 404
      throw this.wrap(err, `delete failed for '${key}'`);
    }
  }

  async *list(prefix: string): AsyncIterable<ObjectStat> {
    assertValidPrefix(prefix);
    const s3 = await this.client();
    let pages: AsyncIterable<{ Contents?: Array<{ Key?: string; Size?: number; LastModified?: Date }> }>;
    try {
      pages = await this.deadlined(
        s3.ListObjectsV2({ Bucket: this.bucket, Prefix: this.keyPrefix + prefix, paginate: 'iterator' }),
        `list '${prefix}'`,
      );
    } catch (err) {
      throw this.wrap(err, `list failed under '${prefix}'`);
    }
    const it = pages[Symbol.asyncIterator]();
    for (;;) {
      let next: IteratorResult<{ Contents?: Array<{ Key?: string; Size?: number; LastModified?: Date }> }>;
      try {
        // Per-page deadline (each iteration is one ListObjectsV2 request).
        next = await this.deadlined(it.next(), `list '${prefix}'`);
      } catch (err) {
        throw this.wrap(err, `list failed under '${prefix}'`);
      }
      if (next.done) return;
      for (const obj of next.value.Contents ?? []) {
        const objectKey = obj.Key ?? '';
        if (!objectKey.startsWith(this.keyPrefix)) continue; // out-of-band write outside our namespace
        const key = objectKey.slice(this.keyPrefix.length);
        // Defensive parity with LocalDriver's dotfile skip: such keys can only
        // exist from out-of-band writes; serving/sweeps must never see them.
        if (!isValidKey(key)) continue;
        yield { key, size: obj.Size ?? 0, mtimeMs: obj.LastModified?.getTime() ?? 0 };
      }
    }
  }

  private client(): Promise<S3Api> {
    // Cached across calls; a failed init clears the cache so the next call retries.
    this.clientPromise ??= this.clientFactory(this.clientOptions).catch((err) => {
      this.clientPromise = null;
      throw new StorageBackendError(`s3 client init failed on '${this.id}'`, err);
    });
    return this.clientPromise;
  }

  private deadlined<T>(op: Promise<T>, what: string): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const expiry = new Promise<never>((_, reject) => {
      timer = setTimeout(
        // Cannot abort the socket (aws-lite has no signal) — the call is
        // rejected and a hung request lingers until the socket dies.
        () => reject(new StorageBackendError(`${what} timed out after ${this.timeoutMs}ms on '${this.id}'`)),
        this.timeoutMs,
      );
      timer.unref?.();
    });
    return Promise.race([op, expiry]).finally(() => clearTimeout(timer)) as Promise<T>;
  }

  private wrap(err: unknown, message: string): Error {
    if (err instanceof StorageBackendError || err instanceof StorageNotFoundError) return err;
    return new StorageBackendError(`${message} on '${this.id}'`, err);
  }
}

/**
 * '' stays ''; anything else becomes one or more slash-joined segments with a
 * trailing slash, or throws StorageInvalidKeyError. app-config/env.ts's
 * s3Preconditions validates the same slash-stripped shape at boot — keep the two
 * strips identical: leading AND trailing slash runs removed, as `/^\/+|\/+$/g` did.
 * Scanned rather than replaced, because that pattern re-walks the trailing run from
 * every start position.
 */
function normalizeKeyPrefix(raw: string): string {
  let start = 0;
  let end = raw.length;
  while (start < end && raw.charCodeAt(start) === 47 /* '/' */) start++;
  while (end > start && raw.charCodeAt(end - 1) === 47) end--;
  const trimmed = raw.slice(start, end);
  if (trimmed === '') return '';
  assertValidPrefix(`${trimmed}/`);
  return `${trimmed}/`;
}

/**
 * Re-quotes the entity-tag aws-lite hands back. Verified live against AIStor
 * RELEASE.2026-08-07T18-34-35Z: the SDK strips the ETag's surrounding quotes
 * before it reaches us (`a925576942e9…`, not `"a925576942e9…"`), and an
 * unquoted entity-tag is not a valid HTTP ETag (RFC 9110 §8.8.3,
 * `etag = DQUOTE *etagc DQUOTE`) — emitting one straight into an ETag
 * response header invites intermediaries to drop or mangle it. Only the
 * quotes the SDK removed are restored; the opaque value itself is never
 * touched, and an already-quoted or weak tag (from another S3-compatible
 * backend, or a future SDK that stops stripping) passes through unchanged.
 * An absent or empty ETag stays absent — "the backend didn't say" (see
 * ObjectStat.etag), never a synthesized tag.
 */
function normalizeEtag(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.startsWith('"') || raw.startsWith('W/"') ? raw : `"${raw}"`;
}

/** 'bytes 2-5/10' → 10. A 206 without a parseable total is a backend defect. */
function totalFromContentRange(contentRange: string | undefined, key: string, id: string): number {
  const total = contentRange?.match(/\/(\d+)$/)?.[1];
  if (total === undefined) {
    throw new StorageBackendError(`ranged get for '${key}' on '${id}' returned no Content-Range total`);
  }
  return Number(total);
}

/**
 * Reads up to `limit` bytes in paused mode. Resolves `ended: true` when the
 * stream finished within the limit (chunks = the whole payload), else
 * `ended: false` with the peeked prefix still unconsumed downstream. Rejects
 * with the source's own error untouched (LocalDriver parity).
 */
function peekStream(source: Readable, limit: number): Promise<{ chunks: Buffer[]; size: number; ended: boolean }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const cleanup = () => {
      source.off('readable', onReadable);
      source.off('end', onEnd);
      source.off('error', onError);
    };
    const onReadable = () => {
      for (;;) {
        const raw = source.read() as Buffer | string | null;
        if (raw === null) return;
        // A source not explicitly in binary mode (e.g. an object-mode
        // Readable.from(string), as used by callers/tests) can yield string
        // chunks; PutObject's Body and Buffer.concat both need real Buffers.
        const chunk = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
        chunks.push(chunk);
        size += chunk.length;
        // Strictly `>`, not `>=`: a stream ending at exactly `limit` bytes is
        // "ended within the limit" and buffers to PutObject, while a
        // LocalTempFile of exactly `MULTIPART_THRESHOLD` (see put()'s `size <
        // MULTIPART_THRESHOLD` check) goes to Upload instead. Both boundaries
        // are correct on their own terms — deliberate asymmetry, not a bug;
        // do not "align" them.
        if (size > limit) {
          cleanup();
          resolve({ chunks, size, ended: false });
          return;
        }
      }
    };
    const onEnd = () => {
      cleanup();
      resolve({ chunks, size, ended: true });
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    source.on('readable', onReadable);
    source.on('end', onEnd);
    source.on('error', onError);
    onReadable();
  });
}
