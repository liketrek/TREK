/**
 * S3-compatible backup target.
 *
 * Speaks to AWS S3, MinIO, Garage, Ceph RGW, Supabase Storage and anything else
 * with an S3 API, through `s3mini`.
 *
 * Why not the AWS SDK: `@aws-sdk/client-s3` plus `lib-storage` pulls 24 packages
 * and ~14 MB for what is, at this scale, five operations. `s3mini` has no
 * dependencies at all and is ~400 KB. It also brings the two parts that are
 * genuinely easy to get wrong — multipart upload and the ListObjectsV2 response
 * — so they are not hand-rolled here. A backup path is the worst place to
 * discover a bug in your own chunking code, because the damage only shows up at
 * restore time.
 *
 * Loaded with a dynamic `import()` because s3mini is ESM-only. Node 24 (what
 * TREK's image and CI use) can `require()` ESM, but a source install on an
 * older Node cannot; every function here is already async, so the import costs
 * nothing and removes the Node version as a failure mode.
 *
 * SSRF, honestly stated: the endpoint is operator-supplied, so it is an SSRF
 * surface. `validateEndpoint()` runs it through TREK's `checkSsrf` before any
 * request, respecting ALLOW_INTERNAL_NETWORK because a LAN MinIO/Garage is the
 * normal self-hosted case (same reasoning as a local Ollama). Requests go out
 * through the platform `fetch`, not TREK's DNS-pinned `safeFetch`, so this is a
 * config-time and test-time check rather than a TOCTOU-proof guarantee: a
 * hostname that resolves to a public IP during validation can resolve elsewhere
 * when the request is later made. Pinning is reachable — s3mini accepts a
 * custom `fetch`, so an undici dispatcher with a fixed `lookup` could be handed
 * in — but re-pinning per request across a multipart upload is its own change
 * and is out of scope here. The route is admin-gated (JwtAuthGuard +
 * AdminGuard), so the URL comes from someone who could equally set
 * BACKUP_S3_ENDPOINT directly; this check earns its place by catching
 * misconfiguration at Test-Connection time, not by containing that admin.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Agent, fetch as undiciFetch } from 'undici';
import { checkSsrf } from '../../utils/ssrfGuard';
import { isS3Usable, type TargetConfig as S3TargetConfig } from './backup-target.config';

/** Minimal shape of the s3mini client, so this module stays typed without it. */
interface S3Client {
  putAnyObject(key: string, data: unknown, fileType?: string, ssec?: unknown, extra?: unknown, contentLength?: number): Promise<unknown>;
  putObject(key: string, data: unknown, fileType?: string): Promise<unknown>;
  getObjectResponse(key: string): Promise<Response | null>;
  objectExists(key: string): Promise<boolean | null>;
  deleteObject(key: string): Promise<boolean>;
  listObjects(delimiter?: string, prefix?: string, maxKeys?: number): Promise<{ Key: string; Size: number; LastModified: Date }[] | null>;
}

/** Outcome of an endpoint validation. */
export interface EndpointCheck {
  ok: boolean;
  error?: string;
}

/**
 * Validate the configured endpoint before any request goes out.
 *
 * An empty endpoint is valid and means "real AWS S3" — the host is derived from
 * the region and is not operator-controlled, so there is nothing to SSRF-check.
 */
export async function validateEndpoint(cfg: S3TargetConfig): Promise<EndpointCheck> {
  const raw = cfg.endpoint.trim();
  if (raw === '') return { ok: true };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: 'Endpoint is not a valid URL (expected e.g. https://s3.example.com).' };
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { ok: false, error: 'Endpoint must use http:// or https://.' };
  }

  if (cfg.requireTls && url.protocol !== 'https:') {
    return { ok: false, error: 'Endpoint must use https://. Disable "Require TLS" to allow a plaintext endpoint.' };
  }

  // bypassInternalIpAllowed stays false so ALLOW_INTERNAL_NETWORK is respected:
  // blocking a LAN MinIO outright would rule out the most common self-hosted
  // deployment. Loopback is blocked unconditionally by checkSsrf, so a MinIO in
  // the same compose stack must be addressed by its service name or LAN IP,
  // never http://localhost:9000.
  const ssrf = await checkSsrf(url.toString());
  if (!ssrf.allowed) {
    return { ok: false, error: ssrf.error ?? 'Endpoint host is not allowed.' };
  }

  return { ok: true };
}

/**
 * The endpoint URL s3mini wants, which includes the bucket.
 *
 * Path-style puts the bucket in the path (`https://host/bucket`), which is what
 * MinIO, Garage, Supabase Storage and most self-hosted gateways need. Virtual-
 * hosted style puts it in the hostname, which is AWS's default. An endpoint may
 * itself carry a path — Supabase serves the API under `/storage/v1/s3` — so the
 * bucket is appended to that path rather than replacing it.
 */
export function bucketEndpoint(cfg: S3TargetConfig): string {
  const endpoint = cfg.endpoint.trim();
  if (!endpoint) {
    const region = cfg.region || 'us-east-1';
    return cfg.forcePathStyle
      ? `https://s3.${region}.amazonaws.com/${cfg.bucket}`
      : `https://${cfg.bucket}.s3.${region}.amazonaws.com`;
  }
  const url = new URL(endpoint);
  if (cfg.forcePathStyle) {
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/${cfg.bucket}`;
    return url.toString().replace(/\/+$/, '');
  }
  url.hostname = `${cfg.bucket}.${url.hostname}`;
  return url.toString().replace(/\/+$/, '');
}

/**
 * A dispatcher that does not reuse connections.
 *
 * Measured against Supabase Storage, which sits behind Cloudflare: the first
 * request on a fresh socket succeeds and every later one on the same kept-alive
 * socket fails with `invalid content-length header` from undici. Five of five
 * uploads failed with connection reuse and five of five succeeded without it.
 *
 * The cost is a TCP+TLS handshake per request. That is irrelevant here — this
 * is a handful of operations per backup, not a hot path — and correctness on a
 * backup upload is worth far more than a saved round trip.
 */
const noReuse = new Agent({ pipelining: 0, keepAliveTimeout: 1, keepAliveMaxTimeout: 1 });

async function client(cfg: S3TargetConfig): Promise<S3Client> {
  const { S3mini } = (await import('s3mini')) as unknown as { S3mini: new (c: unknown) => S3Client };
  return new S3mini({
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    endpoint: bucketEndpoint(cfg),
    region: cfg.region || 'us-east-1',
    fetch: (url: string, init?: Record<string, unknown>) => {
      // A streamed body needs `duplex: 'half'`; undici refuses to send one
      // without it. s3mini does not set it because the platform fetch it
      // normally uses is handed the stream directly, so it belongs here — this
      // is the path a multi-gigabyte archive upload takes.
      const body = init?.body as { getReader?: unknown } | undefined;
      const streamed = typeof body?.getReader === 'function';
      return undiciFetch(url, {
        ...init,
        dispatcher: noReuse,
        ...(streamed ? { duplex: 'half' } : {}),
      } as never);
    },
  });
}

/** Object key for a backup archive under the configured prefix. */
export function objectKeyFor(cfg: S3TargetConfig, zipPath: string): string {
  return `${cfg.prefix}${path.basename(zipPath)}`;
}

export interface UploadOutcome {
  uploaded: boolean;
  key?: string;
  error?: string;
}

/**
 * A destination a finished backup archive can be pushed to.
 *
 * This is the seam @jubnl asked for on discussion #228 — "keep things open
 * enough (maybe through interfaces) so you can just swap and add storage
 * backend easily". Two implementations exist: `s3Target` here and `localTarget`
 * in backup-target.local.ts, which copies to a second directory. A third
 * backend implements this interface and is picked up without either backup
 * builder changing.
 */
export interface BackupTarget {
  /** Stable id for logs and audit entries. */
  readonly id: string;
  /** Everything needed to reach the destination is present. */
  isConfigured(): boolean;
  upload(zipPath: string): Promise<UploadOutcome>;
  /** Whether an archive with this name is already at the destination. */
  has(zipPath: string): Promise<boolean>;
  /** Remove an archive from the destination. */
  remove(filename: string): Promise<void>;
  /** The archives held at the destination. */
  list(): Promise<RemoteBackup[]>;
  /** Fetch an archive to a local path so it can be restored. */
  download(filename: string, destPath: string): Promise<void>;
  test(): Promise<{ success: boolean; error?: string }>;
}

/** A backup archive that exists at the target. */
export interface RemoteBackup {
  filename: string;
  size: number;
  created_at: string;
}

/** The S3-compatible implementation of {@link BackupTarget}. */
export function s3Target(cfg: S3TargetConfig, isBackupName: (n: string) => boolean): BackupTarget {
  return {
    id: 's3',
    isConfigured: () => isS3Usable(cfg),
    upload: (zipPath: string) => uploadBackup(zipPath, cfg),
    has: (zipPath: string) => objectExists(zipPath, cfg),
    remove: (filename: string) => deleteRemote(filename, cfg),
    list: () => listRemote(cfg, isBackupName),
    download: (filename: string, destPath: string) => downloadRemote(filename, destPath, cfg),
    test: () => testConnection(cfg),
  };
}

/**
 * Stream an archive to the target.
 *
 * `putAnyObject` picks single PUT or multipart from the content length, so a
 * multi-gigabyte archive is chunked without this module owning the chunking.
 * The body is a stream, so the file is never held in memory.
 *
 * Errors are returned, not thrown: the caller is the post-write hook, and the
 * local archive is already safely on disk.
 */
export async function uploadBackup(zipPath: string, cfg: S3TargetConfig): Promise<UploadOutcome> {
  if (!isS3Usable(cfg)) {
    return { uploaded: false, error: 'S3 target is incomplete (bucket, access key and secret are required).' };
  }

  const check = await validateEndpoint(cfg);
  if (!check.ok) return { uploaded: false, error: check.error };

  const key = objectKeyFor(cfg, zipPath);
  try {
    const size = fs.statSync(zipPath).size;
    const body = Readable.toWeb(fs.createReadStream(zipPath));
    await (await client(cfg)).putAnyObject(key, body, 'application/zip', undefined, undefined, size);
    return { uploaded: true, key };
  } catch (err: unknown) {
    return { uploaded: false, key, error: describeS3Error(err) };
  }
}

/**
 * Whether the archive is already in the bucket.
 *
 * Used to make "upload all existing backups" resumable and cheap to re-run: a
 * bucket holding 40 GB of archives should not re-transfer them because someone
 * pressed the button twice. Anything other than a definite hit answers false —
 * re-uploading is wasteful but safe, while wrongly skipping loses the backup.
 */
export async function objectExists(zipPath: string, cfg: S3TargetConfig): Promise<boolean> {
  try {
    return (await (await client(cfg)).objectExists(objectKeyFor(cfg, zipPath))) === true;
  } catch {
    return false;
  }
}

/** Delete an archive from the bucket. */
export async function deleteRemote(filename: string, cfg: S3TargetConfig): Promise<void> {
  await (await client(cfg)).deleteObject(`${cfg.prefix}${filename}`);
}

/**
 * List the backup archives at the target.
 *
 * Only objects directly under the configured prefix are considered, and only
 * names that pass TREK's own backup-filename shape — a bucket shared with other
 * data must not have unrelated objects show up as restorable backups.
 */
export async function listRemote(cfg: S3TargetConfig, isBackupName: (n: string) => boolean): Promise<RemoteBackup[]> {
  const objects = (await (await client(cfg)).listObjects('/', cfg.prefix)) ?? [];
  const out: RemoteBackup[] = [];
  for (const obj of objects) {
    if (!obj?.Key) continue;
    const rest = obj.Key.startsWith(cfg.prefix) ? obj.Key.slice(cfg.prefix.length) : obj.Key;
    // Skip anything in a deeper "folder" — a nested key is not ours.
    if (rest.includes('/') || !isBackupName(rest)) continue;
    out.push({
      filename: rest,
      size: obj.Size ?? 0,
      created_at: new Date(obj.LastModified ?? 0).toISOString(),
    });
  }
  return out;
}

/**
 * Stream a remote archive to a local path.
 *
 * Streamed rather than buffered: these are the same multi-gigabyte archives the
 * upload path is careful about, and a restore must not need them in memory.
 */
export async function downloadRemote(filename: string, destPath: string, cfg: S3TargetConfig): Promise<void> {
  const res = await (await client(cfg)).getObjectResponse(`${cfg.prefix}${filename}`);
  if (!res?.body) throw new Error('The target returned an empty object.');
  await pipeline(Readable.fromWeb(res.body as never), fs.createWriteStream(destPath));
}

/** Probe object written and removed by testConnection. */
const PROBE_OBJECT = '.trek-connection-test';

/**
 * Probe the target for the admin "Test connection" button.
 *
 * Three steps, because connectivity alone is not what a backup needs:
 *   1. list   — endpoint reachable, credentials accepted, bucket visible.
 *   2. put    — the credentials can actually WRITE. A read-only key passes step
 *               1 and then fails every backup, which is precisely the silent
 *               failure a backup system must not have (#228).
 *   3. delete — the credentials can prune, which remote retention needs, and it
 *               leaves the operator's bucket as we found it.
 *
 * A failing delete is reported but does not fail the test: uploads work, so
 * backups work — only automatic pruning would not.
 */
export async function testConnection(cfg: S3TargetConfig): Promise<{ success: boolean; error?: string }> {
  if (!isS3Usable(cfg)) {
    return { success: false, error: 'S3 target is incomplete (bucket, access key and secret are required).' };
  }

  const check = await validateEndpoint(cfg);
  if (!check.ok) return { success: false, error: check.error };

  let c: S3Client;
  try {
    c = await client(cfg);
    await c.listObjects('/', cfg.prefix, 1);
  } catch (err: unknown) {
    return { success: false, error: describeS3Error(err) };
  }

  const probeKey = `${cfg.prefix}${PROBE_OBJECT}`;
  try {
    await c.putObject(probeKey, 'trek', 'text/plain');
  } catch (err: unknown) {
    return { success: false, error: `Bucket is reachable but not writable: ${describeS3Error(err)}` };
  }

  try {
    await c.deleteObject(probeKey);
  } catch (err: unknown) {
    return {
      success: true,
      error: `Uploads work, but the test object could not be removed (${describeS3Error(err)}). Remote retention will not be able to prune old backups.`,
    };
  }

  return { success: true };
}

/**
 * Flatten an error and everything it wraps.
 *
 * `fetch` reports every transport problem as a bare `TypeError: fetch failed`
 * and hides the real reason — ECONNREFUSED, EPROTO, a TLS alert — in `cause`,
 * sometimes nested more than one level. Reading only the top-level message
 * turns every network fault into the same useless string, which is exactly what
 * an admin cannot act on.
 */
function errorChain(err: unknown): { text: string; codes: string[] } {
  const parts: string[] = [];
  const codes: string[] = [];
  let cur: unknown = err;
  for (let depth = 0; cur && typeof cur === 'object' && depth < 5; depth++) {
    const e = cur as { message?: unknown; code?: unknown; errno?: unknown; cause?: unknown };
    if (e.message) parts.push(String(e.message));
    if (e.code) codes.push(String(e.code));
    if (e.errno) codes.push(String(e.errno));
    cur = e.cause;
  }
  return { text: parts.join(' | '), codes };
}

/**
 * Turn an error into something an admin can act on, without ever echoing
 * credentials.
 */
export function describeS3Error(err: unknown): string {
  if (!err || typeof err !== 'object') return 'The S3 request failed.';

  const { text, codes } = errorChain(err);

  const transport = describeTransportError(codes.join(' '), text);
  if (transport) return transport;

  // s3mini surfaces the provider's error code and HTTP status in the message.
  if (/NoSuchBucket/i.test(text)) return 'Bucket not found.';
  if (/InvalidAccessKeyId/i.test(text)) return 'The access key ID is not valid for this endpoint.';
  if (/SignatureDoesNotMatch/i.test(text)) return 'Signature mismatch — the secret access key is wrong.';
  if (/AccessDenied|\b403\b/i.test(text)) return 'Access denied — check the access key, secret and bucket policy.';
  if (/NoSuchKey|\b404\b/i.test(text)) return 'Bucket or object not found.';

  return text || 'The S3 request failed.';
}

/**
 * Map a transport/TLS failure to something an admin can act on, or null when
 * this is not a transport error.
 *
 * The TLS case is the one worth care. With path-style addressing off, the
 * bucket name is prepended as a subdomain — `https://<bucket>.<endpoint-host>`
 * — and a provider that serves its S3 API under a path (Supabase Storage, or a
 * MinIO / Ceph RGW behind a reverse proxy) has no certificate covering that
 * invented subdomain. The connection dies in the handshake with an opaque
 * OpenSSL string, and the actual fix is a checkbox.
 */
function describeTransportError(code: string, message: string): string | null {
  const haystack = `${code} ${message}`.toLowerCase();

  if (haystack.includes('eproto') || haystack.includes('handshake') || haystack.includes('ssl3_') || haystack.includes('tls alert')) {
    return 'TLS handshake failed. If your provider serves the S3 API under a path (Supabase Storage, or MinIO/Ceph behind a reverse proxy), turn on "Use path-style addressing" — without it the bucket name is prepended as a subdomain the certificate does not cover.';
  }
  if (haystack.includes('cert_has_expired') || haystack.includes('depth_zero_self_signed') || haystack.includes('self-signed') || haystack.includes('unable_to_verify')) {
    return 'The endpoint\'s TLS certificate could not be verified (self-signed or expired). Use a certificate your server trusts, or a plain-http endpoint with "Require HTTPS" turned off on a trusted network.';
  }
  if (haystack.includes('econnrefused')) {
    return 'Connection refused — nothing is listening on that endpoint and port.';
  }
  if (haystack.includes('enotfound') || haystack.includes('eai_again')) {
    return 'The endpoint hostname could not be resolved. Check the URL, and remember a container must be addressed by its service name rather than localhost.';
  }
  if (haystack.includes('etimedout') || haystack.includes('timeout')) {
    return 'The endpoint did not respond in time. Check that it is reachable from the TREK server (firewall, network policy).';
  }
  if (haystack.includes('econnreset')) {
    return 'The connection was reset by the endpoint. If it terminates TLS at a proxy, check that the proxy accepts the request path.';
  }
  return null;
}
