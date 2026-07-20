import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const checkSsrf = vi.fn();
vi.mock('../../../src/utils/ssrfGuard', () => ({ checkSsrf: (...a: unknown[]) => checkSsrf(...a) }));

// The module wraps undici's fetch to disable connection reuse and to set
// `duplex`. Intercept it so those choices can actually be asserted.
const undiciCalls: { url: string; init: Record<string, unknown> }[] = [];
vi.mock('undici', () => ({
  Agent: class { constructor(public opts: unknown) {} },
  fetch: (url: string, init: Record<string, unknown>) => {
    undiciCalls.push({ url, init });
    return Promise.resolve(new Response(''));
  },
}));

// s3mini is ESM-only and loaded with a dynamic import, so it is mocked by
// specifier rather than by relative path.
const api = {
  putAnyObject: vi.fn(),
  putObject: vi.fn(),
  getObjectResponse: vi.fn(),
  objectExists: vi.fn(),
  deleteObject: vi.fn(),
  listObjects: vi.fn(),
};
let lastConfig: Record<string, unknown> | null = null;
vi.mock('s3mini', () => ({
  S3mini: class {
    constructor(cfg: Record<string, unknown>) { lastConfig = cfg; }
    putAnyObject = (...a: unknown[]) => api.putAnyObject(...a);
    putObject = (...a: unknown[]) => api.putObject(...a);
    getObjectResponse = (...a: unknown[]) => api.getObjectResponse(...a);
    objectExists = (...a: unknown[]) => api.objectExists(...a);
    deleteObject = (...a: unknown[]) => api.deleteObject(...a);
    listObjects = (...a: unknown[]) => api.listObjects(...a);
  },
}));

import {
  bucketEndpoint,
  deleteRemote,
  describeS3Error,
  downloadRemote,
  listRemote,
  objectExists,
  objectKeyFor,
  testConnection,
  uploadBackup,
  validateEndpoint,
} from '../../../src/nest/backup/backup-target.s3';
import type { TargetConfig } from '../../../src/nest/backup/backup-target.config';

function cfg(over: Partial<TargetConfig> = {}): TargetConfig {
  return {
    type: 's3',
    localPath: '',
    endpoint: 'https://s3.example.test',
    region: 'us-east-1',
    bucket: 'trek-backups',
    prefix: '',
    accessKeyId: 'AKIA',
    secretAccessKey: 'secret',
    forcePathStyle: false,
    requireTls: true,
    ...over,
  };
}

const isBackupName = (n: string) => /^(?:auto-)?backup-[\w-]+\.zip$/.test(n);

beforeEach(() => {
  vi.clearAllMocks();
  lastConfig = null;
  checkSsrf.mockResolvedValue({ allowed: true, isPrivate: false });
  api.putAnyObject.mockResolvedValue({ ok: true });
  api.putObject.mockResolvedValue({ ok: true });
  api.deleteObject.mockResolvedValue(true);
  api.listObjects.mockResolvedValue([]);
  api.objectExists.mockResolvedValue(false);
});

describe('validateEndpoint', () => {
  it('accepts an empty endpoint as "real AWS S3" without an SSRF probe', async () => {
    await expect(validateEndpoint(cfg({ endpoint: '' }))).resolves.toEqual({ ok: true });
    expect(checkSsrf).not.toHaveBeenCalled();
  });

  it('rejects a malformed URL', async () => {
    const res = await validateEndpoint(cfg({ endpoint: 'not a url' }));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/not a valid URL/i);
  });

  it('rejects a non-http protocol', async () => {
    expect((await validateEndpoint(cfg({ endpoint: 'ftp://s3.example.test' }))).ok).toBe(false);
  });

  it('rejects plaintext http while require_tls is on', async () => {
    const res = await validateEndpoint(cfg({ endpoint: 'http://minio.lan:9000' }));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/https/i);
  });

  it('allows plaintext http once require_tls is off (LAN MinIO/Garage)', async () => {
    expect((await validateEndpoint(cfg({ endpoint: 'http://minio.lan:9000', requireTls: false }))).ok).toBe(true);
  });

  it('surfaces an SSRF rejection verbatim', async () => {
    checkSsrf.mockResolvedValue({ allowed: false, isPrivate: true, error: 'Requests to private/internal network addresses are not allowed.' });
    const res = await validateEndpoint(cfg());
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/private\/internal/);
  });

  it('respects ALLOW_INTERNAL_NETWORK by not forcing the private-IP bypass', async () => {
    await validateEndpoint(cfg());
    // A second argument of `true` would block private IPs even when the operator
    // opted in — a LAN MinIO is the normal self-hosted case, so we must not.
    expect(checkSsrf).toHaveBeenCalledWith('https://s3.example.test/');
  });
});

describe('bucketEndpoint', () => {
  it('appends the bucket to the path in path-style', () => {
    expect(bucketEndpoint(cfg({ forcePathStyle: true }))).toBe('https://s3.example.test/trek-backups');
  });

  it('prepends the bucket as a subdomain in virtual-hosted style', () => {
    expect(bucketEndpoint(cfg({ forcePathStyle: false }))).toBe('https://trek-backups.s3.example.test');
  });

  it('keeps an endpoint path and appends the bucket after it', () => {
    // Supabase serves the S3 API under /storage/v1/s3; dropping that path would
    // address the wrong thing entirely.
    const supabase = 'https://ljdxzzlurgitgiafjvlo.storage.supabase.co/storage/v1/s3';
    expect(bucketEndpoint(cfg({ endpoint: supabase, forcePathStyle: true })))
      .toBe('https://ljdxzzlurgitgiafjvlo.storage.supabase.co/storage/v1/s3/trek-backups');
  });

  it('derives the AWS host from the region when no endpoint is set', () => {
    expect(bucketEndpoint(cfg({ endpoint: '', region: 'eu-central-1' })))
      .toBe('https://trek-backups.s3.eu-central-1.amazonaws.com');
    expect(bucketEndpoint(cfg({ endpoint: '', region: 'eu-central-1', forcePathStyle: true })))
      .toBe('https://s3.eu-central-1.amazonaws.com/trek-backups');
  });
});

describe('objectKeyFor', () => {
  it('places the archive under the configured prefix', () => {
    expect(objectKeyFor(cfg({ prefix: 'nightly/' }), '/data/backups/backup-1.zip')).toBe('nightly/backup-1.zip');
    expect(objectKeyFor(cfg({ prefix: '' }), '/data/backups/backup-1.zip')).toBe('backup-1.zip');
  });
});

describe('uploadBackup', () => {
  let tmp: string;
  let src: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-s3-'));
    src = path.join(tmp, 'backup-1.zip');
    fs.writeFileSync(src, 'ARCHIVE');
  });

  it('refuses an incomplete target before touching the network', async () => {
    const res = await uploadBackup(src, cfg({ secretAccessKey: '' }));
    expect(res).toEqual({ uploaded: false, error: expect.stringMatching(/incomplete/i) });
    expect(api.putAnyObject).not.toHaveBeenCalled();
  });

  it('refuses to upload when the endpoint fails validation', async () => {
    checkSsrf.mockResolvedValue({ allowed: false, isPrivate: true, error: 'blocked' });
    expect((await uploadBackup(src, cfg())).uploaded).toBe(false);
    expect(api.putAnyObject).not.toHaveBeenCalled();
  });

  it('streams the archive with a known length so multipart can be chosen', async () => {
    const res = await uploadBackup(src, cfg({ prefix: 'nightly/' }));
    expect(res).toEqual({ uploaded: true, key: 'nightly/backup-1.zip' });

    const [key, body, type, , , length] = api.putAnyObject.mock.calls[0];
    expect(key).toBe('nightly/backup-1.zip');
    expect(type).toBe('application/zip');
    // A known content length is what lets putAnyObject pick multipart for a
    // multi-gigabyte archive; a stream body keeps it out of memory.
    expect(length).toBe('ARCHIVE'.length);
    expect(body).toBeInstanceOf(ReadableStream);
  });

  it('returns the failure instead of throwing', async () => {
    api.putAnyObject.mockRejectedValue(new Error('AccessDenied: 403'));
    const res = await uploadBackup(src, cfg());
    expect(res.uploaded).toBe(false);
    expect(res.error).toMatch(/access denied/i);
  });

  it('sets duplex on a streamed body, which undici requires', async () => {
    // Without it undici refuses the request outright ("duplex option is
    // required when sending a body") and every archive upload fails.
    await uploadBackup(src, cfg());
    const wrapped = lastConfig!.fetch as (u: string, i?: Record<string, unknown>) => Promise<unknown>;

    undiciCalls.length = 0;
    await wrapped('https://x.test', { method: 'PUT', body: new ReadableStream() });
    expect(undiciCalls[0].init.duplex).toBe('half');

    // A plain string body must NOT get duplex — undici rejects that pairing.
    undiciCalls.length = 0;
    await wrapped('https://x.test', { method: 'PUT', body: 'trek' });
    expect(undiciCalls[0].init.duplex).toBeUndefined();
  });

  it('never reuses a connection, whatever the body', async () => {
    // Measured against Supabase behind Cloudflare: 5/5 uploads failed on a
    // reused keep-alive socket with `invalid content-length header`, 5/5
    // succeeded on fresh ones.
    await uploadBackup(src, cfg());
    const wrapped = lastConfig!.fetch as (u: string, i?: Record<string, unknown>) => Promise<unknown>;
    undiciCalls.length = 0;
    await wrapped('https://x.test', { method: 'GET' });
    expect(undiciCalls[0].init.dispatcher).toBeDefined();
  });

  it('passes the resolved bucket endpoint to the client', async () => {
    await uploadBackup(src, cfg({ forcePathStyle: true }));
    expect(lastConfig).toMatchObject({ endpoint: 'https://s3.example.test/trek-backups', region: 'us-east-1' });
  });
});

describe('objectExists', () => {
  it('is true only on a definite hit', async () => {
    api.objectExists.mockResolvedValue(true);
    expect(await objectExists('/b/backup-1.zip', cfg())).toBe(true);
  });

  it.each([[false], [null]])('treats %s as absent', async (value) => {
    api.objectExists.mockResolvedValue(value);
    expect(await objectExists('/b/backup-1.zip', cfg())).toBe(false);
  });

  it('answers false when the check throws, rather than propagating', async () => {
    // Re-uploading is wasteful but safe; wrongly skipping loses the backup.
    api.objectExists.mockRejectedValue(new Error('boom'));
    expect(await objectExists('/b/backup-1.zip', cfg())).toBe(false);
  });
});

describe('listRemote', () => {
  it('returns only well-formed backup names directly under the prefix', async () => {
    api.listObjects.mockResolvedValue([
      { Key: 'nightly/backup-1.zip', Size: 10, LastModified: new Date('2026-01-01T00:00:00Z') },
      { Key: 'nightly/auto-backup-2.zip', Size: 20, LastModified: new Date('2026-01-02T00:00:00Z') },
      { Key: 'nightly/holiday.jpg', Size: 30, LastModified: new Date() },
      { Key: 'nightly/deeper/backup-3.zip', Size: 40, LastModified: new Date() },
    ]);
    const listed = await listRemote(cfg({ prefix: 'nightly/' }), isBackupName);
    expect(listed.map(b => b.filename)).toEqual(['backup-1.zip', 'auto-backup-2.zip']);
    expect(listed[0]).toMatchObject({ size: 10, created_at: '2026-01-01T00:00:00.000Z' });
  });

  it('tolerates a null listing', async () => {
    api.listObjects.mockResolvedValue(null);
    expect(await listRemote(cfg(), isBackupName)).toEqual([]);
  });
});

describe('deleteRemote', () => {
  it('deletes the prefixed key', async () => {
    await deleteRemote('backup-1.zip', cfg({ prefix: 'nightly/' }));
    expect(api.deleteObject).toHaveBeenCalledWith('nightly/backup-1.zip');
  });
});

describe('downloadRemote', () => {
  it('streams the object to disk', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-s3-dl-'));
    const dest = path.join(tmp, 'out.zip');
    api.getObjectResponse.mockResolvedValue(new Response('ARCHIVE'));

    await downloadRemote('backup-1.zip', dest, cfg());
    expect(fs.readFileSync(dest, 'utf8')).toBe('ARCHIVE');
  });

  it('refuses an empty response rather than writing a truncated file', async () => {
    api.getObjectResponse.mockResolvedValue(null);
    await expect(downloadRemote('backup-1.zip', '/tmp/x.zip', cfg())).rejects.toThrow(/empty object/i);
  });
});

describe('testConnection', () => {
  it('checks reachability, then write, then cleans the probe up again', async () => {
    const res = await testConnection(cfg({ prefix: 'nightly/' }));
    expect(res).toEqual({ success: true });
    expect(api.listObjects).toHaveBeenCalled();
    expect(api.putObject).toHaveBeenCalledWith('nightly/.trek-connection-test', 'trek', 'text/plain');
    expect(api.deleteObject).toHaveBeenCalledWith('nightly/.trek-connection-test');
  });

  it('fails a read-only key instead of reporting a healthy target', async () => {
    // The exact #228 failure mode: listing succeeds, writes do not, and every
    // subsequent backup would fail silently.
    api.putObject.mockRejectedValue(new Error('AccessDenied'));
    const res = await testConnection(cfg());
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not writable/i);
  });

  it('still reports success when only the probe cleanup fails, but warns about retention', async () => {
    api.deleteObject.mockRejectedValue(new Error('AccessDenied'));
    const res = await testConnection(cfg());
    expect(res.success).toBe(true);
    expect(res.error).toMatch(/retention/i);
  });

  it('reports an incomplete target rather than probing', async () => {
    expect((await testConnection(cfg({ bucket: '' }))).success).toBe(false);
    expect(api.listObjects).not.toHaveBeenCalled();
  });

  it('maps an unreachable bucket to an actionable message', async () => {
    api.listObjects.mockRejectedValue(new Error('NoSuchBucket'));
    expect(await testConnection(cfg())).toEqual({ success: false, error: 'Bucket not found.' });
  });
});

describe('describeS3Error', () => {
  it('translates a TLS handshake failure into the path-style fix', () => {
    // The first thing a Supabase/MinIO user hits: path-style off means the
    // bucket becomes a subdomain the certificate does not cover.
    const msg = describeS3Error(
      Object.assign(new Error('write EPROTO ssl3_read_bytes:ssl/tls alert handshake failure'), { code: 'EPROTO' }),
    );
    expect(msg).toMatch(/path-style/i);
    expect(msg).not.toMatch(/ssl3_read_bytes/);
  });

  it.each([
    ['ECONNREFUSED', /refused/i],
    ['ENOTFOUND', /could not be resolved/i],
    ['ETIMEDOUT', /did not respond in time/i],
    ['ECONNRESET', /reset/i],
  ])('translates the %s transport failure', (code, expected) => {
    expect(describeS3Error(Object.assign(new Error(code), { code }))).toMatch(expected);
  });

  it.each([
    ['NoSuchBucket', /bucket not found/i],
    ['InvalidAccessKeyId', /access key ID is not valid/i],
    ['SignatureDoesNotMatch', /secret access key is wrong/i],
    ['AccessDenied', /access denied/i],
  ])('maps the %s provider error', (code, expected) => {
    expect(describeS3Error(new Error(`${code}: request failed`))).toMatch(expected);
  });

  it.each([
    ['Request failed with 403', /access denied/i],
    ['HTTP 404 Not Found', /not found/i],
  ])('maps the bare status code in %s', (message, expected) => {
    // These branches use word boundaries. A previous edit smuggled literal
    // control characters in place of them, so the codes never matched and no
    // test noticed.
    expect(describeS3Error(new Error(message))).toMatch(expected);
  });

  it('never returns an empty string for an unknown shape', () => {
    expect(describeS3Error(undefined)).toBe('The S3 request failed.');
    expect(describeS3Error({})).toBe('The S3 request failed.');
  });
});
