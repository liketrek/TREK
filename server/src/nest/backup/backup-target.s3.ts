/**
 * S3-compatible external backup target.
 *
 * Speaks to AWS S3, MinIO, Garage, Ceph RGW and anything else with an S3 API.
 * Only the pieces Phase 1 needs live here: validate an endpoint, stream a
 * finished archive up, and probe the bucket for the admin "Test connection"
 * button. Listing, restoring and pruning remote objects are deliberately not
 * here yet — they are their own slice.
 *
 * SSRF, honestly stated: the endpoint is operator-supplied, so it is an SSRF
 * surface. `validateEndpoint()` runs it through TREK's `checkSsrf` before any
 * request, respecting ALLOW_INTERNAL_NETWORK because a LAN MinIO/Garage is the
 * normal self-hosted case (same reasoning as a local Ollama). But the AWS SDK
 * does its own networking and does NOT route through TREK's DNS-pinned
 * `safeFetch`, so this is a config-time and test-time check, not a TOCTOU-proof
 * guarantee: a hostname that resolves to a public IP during validation can
 * resolve elsewhere when the SDK later connects.
 *
 * Pinning is reachable — the SDK takes a custom `requestHandler`, and a
 * NodeHttpHandler's `httpsAgent` passes a `lookup` through to tls.connect — but
 * doing it properly means resolving and re-pinning per request across multipart
 * uploads, which is its own security-critical change and deliberately out of
 * scope here. The route is admin-gated (JwtAuthGuard + AdminGuard), so the URL
 * comes from someone who could equally set BACKUP_S3_ENDPOINT or
 * ALLOW_INTERNAL_NETWORK directly; this check earns its place by catching
 * misconfiguration at Test-Connection time, not by containing that admin.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { checkSsrf } from '../../utils/ssrfGuard';
import { isTargetUsable, type S3TargetConfig } from './backup-target.config';

/** Outcome of an endpoint validation. */
export interface EndpointCheck {
  ok: boolean;
  error?: string;
}

/**
 * Validate the configured endpoint before any request goes out.
 *
 * An empty endpoint is valid and means "real AWS S3" — the SDK derives the
 * host from the region, and that host is not operator-controlled, so there is
 * nothing to SSRF-check.
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

function createClient(cfg: S3TargetConfig): S3Client {
  return new S3Client({
    region: cfg.region || 'us-east-1',
    // An empty endpoint lets the SDK derive the real AWS host from the region.
    ...(cfg.endpoint.trim() ? { endpoint: cfg.endpoint.trim() } : {}),
    forcePathStyle: cfg.forcePathStyle,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
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
 * backend easily". S3 is the only implementation today; a further backend (NFS,
 * or whatever the general `StorageBackend` for uploads grows into) implements
 * this and `onBackupWritten` picks it up without changing either backup builder.
 *
 * Deliberately narrow: only what pushing an archive off-box needs. The richer
 * store/download interface jubnl sketched belongs with the uploads work, where
 * reads are on the hot path — not here, where the operation is write-only.
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
  test(): Promise<{ success: boolean; error?: string }>;
}

/** The S3-compatible implementation of {@link BackupTarget}. */
export function s3Target(cfg: S3TargetConfig): BackupTarget {
  return {
    id: 's3',
    isConfigured: () => isTargetUsable(cfg),
    upload: (zipPath: string) => uploadBackup(zipPath, cfg),
    has: (zipPath: string) => objectExists(zipPath, cfg),
    remove: (filename: string) => deleteRemote(filename, cfg),
    test: () => testConnection(cfg),
  };
}

/** Delete an archive from the bucket. */
export async function deleteRemote(filename: string, cfg: S3TargetConfig): Promise<void> {
  const client = createClient(cfg);
  try {
    await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: `${cfg.prefix}${filename}` }));
  } finally {
    client.destroy();
  }
}

/** A backup archive that exists at the target. */
export interface RemoteBackup {
  filename: string;
  size: number;
  created_at: string;
}

/**
 * List the backup archives at the target.
 *
 * Only objects directly under the configured prefix are considered, and only
 * names that pass TREK's own backup-filename shape — a bucket shared with
 * other data must not have unrelated objects show up as restorable backups.
 */
export async function listRemote(cfg: S3TargetConfig, isBackupName: (n: string) => boolean): Promise<RemoteBackup[]> {
  const client = createClient(cfg);
  const out: RemoteBackup[] = [];
  try {
    let token: string | undefined;
    do {
      const page = await client.send(
        new ListObjectsV2Command({ Bucket: cfg.bucket, Prefix: cfg.prefix, ContinuationToken: token }),
      );
      for (const obj of page.Contents ?? []) {
        if (!obj.Key) continue;
        const rest = obj.Key.slice(cfg.prefix.length);
        // Skip anything in a deeper "folder" — a nested key is not ours.
        if (rest.includes('/') || !isBackupName(rest)) continue;
        out.push({
          filename: rest,
          size: obj.Size ?? 0,
          created_at: (obj.LastModified ?? new Date(0)).toISOString(),
        });
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
    return out;
  } finally {
    client.destroy();
  }
}

/**
 * Stream a remote archive to a local path.
 *
 * Streamed rather than buffered: these are the same multi-gigabyte archives the
 * upload path is careful about, and a restore must not need them in memory.
 */
export async function downloadRemote(filename: string, destPath: string, cfg: S3TargetConfig): Promise<void> {
  const client = createClient(cfg);
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: `${cfg.prefix}${filename}` }));
    if (!res.Body) throw new Error('The target returned an empty object.');
    await pipeline(res.Body as Readable, fs.createWriteStream(destPath));
  } finally {
    client.destroy();
  }
}

/**
 * Whether the archive is already in the bucket.
 *
 * Used to make "upload all existing backups" resumable and cheap to re-run: a
 * bucket holding 40 GB of archives should not re-transfer them because someone
 * pressed the button twice. Any error other than a clean 404 answers false —
 * re-uploading is wasteful but safe, while wrongly skipping loses the backup.
 */
export async function objectExists(zipPath: string, cfg: S3TargetConfig): Promise<boolean> {
  const client = createClient(cfg);
  try {
    await client.send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: objectKeyFor(cfg, zipPath) }));
    return true;
  } catch {
    return false;
  } finally {
    client.destroy();
  }
}

/**
 * Stream a finished archive to the target.
 *
 * `lib-storage`'s Upload multiparts a stream, so a multi-gigabyte archive never
 * has to be buffered in memory. Errors are returned, not thrown: the caller is
 * the post-write hook, and the local archive is already safely on disk.
 */
export async function uploadBackup(zipPath: string, cfg: S3TargetConfig): Promise<UploadOutcome> {
  if (!isTargetUsable(cfg)) {
    return { uploaded: false, error: 'S3 target is incomplete (bucket, access key and secret are required).' };
  }

  const check = await validateEndpoint(cfg);
  if (!check.ok) return { uploaded: false, error: check.error };

  const key = objectKeyFor(cfg, zipPath);
  const client = createClient(cfg);
  try {
    const upload = new Upload({
      client,
      params: {
        Bucket: cfg.bucket,
        Key: key,
        Body: fs.createReadStream(zipPath),
        ContentType: 'application/zip',
      },
    });
    await upload.done();
    return { uploaded: true, key };
  } catch (err: unknown) {
    return { uploaded: false, key, error: describeS3Error(err) };
  } finally {
    client.destroy();
  }
}

/** Probe object written and removed by testConnection. */
const PROBE_OBJECT = '.trek-connection-test';

/**
 * Probe the target for the admin "Test connection" button.
 *
 * Three steps, because connectivity alone is not what a backup needs:
 *   1. HeadBucket  — endpoint reachable, credentials accepted, bucket visible.
 *   2. PutObject   — the credentials can actually WRITE. A read-only key passes
 *                    step 1 and then fails every backup, which is precisely the
 *                    silent failure a backup system must not have (#228).
 *   3. DeleteObject — the credentials can prune, which remote retention needs,
 *                    and it leaves the operator's bucket as we found it.
 *
 * A failing delete is reported but does not fail the test: uploads work, so
 * backups work — only automatic pruning would not.
 */
export async function testConnection(cfg: S3TargetConfig): Promise<{ success: boolean; error?: string }> {
  if (!isTargetUsable(cfg)) {
    return { success: false, error: 'S3 target is incomplete (bucket, access key and secret are required).' };
  }

  const check = await validateEndpoint(cfg);
  if (!check.ok) return { success: false, error: check.error };

  const client = createClient(cfg);
  const probeKey = `${cfg.prefix}${PROBE_OBJECT}`;
  try {
    await client.send(new HeadBucketCommand({ Bucket: cfg.bucket }));

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: cfg.bucket,
          Key: probeKey,
          Body: 'trek',
          ContentType: 'text/plain',
        }),
      );
    } catch (err: unknown) {
      return { success: false, error: `Bucket is reachable but not writable: ${describeS3Error(err)}` };
    }

    try {
      await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: probeKey }));
    } catch (err: unknown) {
      return {
        success: true,
        error: `Uploads work, but the test object could not be removed (${describeS3Error(err)}). Remote retention will not be able to prune old backups.`,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: describeS3Error(err) };
  } finally {
    client.destroy();
  }
}

/**
 * Turn an SDK error into something an admin can act on, without ever echoing
 * credentials. The SDK's own messages are safe (they carry status codes and
 * bucket names, not keys), but the fallback stays generic rather than
 * stringifying an unknown object of unknown provenance.
 */
function describeS3Error(err: unknown): string {
  if (err && typeof err === 'object') {
    const name = 'name' in err ? String((err as { name: unknown }).name) : '';
    const message = 'message' in err ? String((err as { message: unknown }).message) : '';
    // Transport-level failures never carry an S3 error name — they surface as
    // raw OpenSSL/libuv strings ("write EPROTO … ssl/tls alert handshake
    // failure") that tell an admin nothing about what to change. Translate the
    // ones that actually happen in this feature.
    const code = 'code' in err ? String((err as { code: unknown }).code) : '';
    const transport = describeTransportError(code, message);
    if (transport) return transport;

    switch (name) {
      case 'NotFound':
      case 'NoSuchBucket':
        return 'Bucket not found.';
      case 'Forbidden':
      case 'AccessDenied':
        return 'Access denied — check the access key, secret and bucket policy.';
      case 'InvalidAccessKeyId':
        return 'The access key ID is not valid for this endpoint.';
      case 'SignatureDoesNotMatch':
        return 'Signature mismatch — the secret access key is wrong.';
      default:
        return message || name;
    }
  }
  return 'The S3 request failed.';
}

/**
 * Map a transport/TLS failure to something an admin can act on, or null when
 * this is not a transport error.
 *
 * The TLS case is the one worth care. With path-style addressing off, the SDK
 * builds a virtual-hosted URL — `https://<bucket>.<endpoint-host>/…` — and a
 * provider that serves its S3 API under a path (Supabase Storage, or a MinIO /
 * Ceph RGW behind a reverse proxy) has no certificate covering that invented
 * subdomain. The connection dies in the handshake with an opaque OpenSSL
 * string, and the actual fix is a checkbox.
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
