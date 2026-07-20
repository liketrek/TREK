import { describe, it, expect, vi, beforeEach } from 'vitest';

const checkSsrf = vi.fn();
vi.mock('../../../src/utils/ssrfGuard', () => ({ checkSsrf: (...a: unknown[]) => checkSsrf(...a) }));

const send = vi.fn();
const destroy = vi.fn();
// Declared inside the factory: vi.mock is hoisted above the module body, so a
// class defined out here would not exist yet when the factory runs.
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    constructor(public config: unknown) {}
    send = (...a: unknown[]) => send(...a);
    destroy = () => destroy();
  },
  HeadBucketCommand: class {
    constructor(public input: unknown) {}
  },
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
  DeleteObjectCommand: class {
    constructor(public input: unknown) {}
  },
}));

const uploadDone = vi.fn();
vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: class {
    constructor(public opts: unknown) {}
    done = () => uploadDone(this.opts);
  },
}));

vi.mock('node:fs', () => ({
  default: { createReadStream: vi.fn(() => 'STREAM') },
  createReadStream: vi.fn(() => 'STREAM'),
}));

import { DeleteObjectCommand, HeadBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { objectKeyFor, testConnection, uploadBackup, validateEndpoint } from '../../../src/nest/backup/backup-target.s3';
import type { S3TargetConfig } from '../../../src/nest/backup/backup-target.config';

function cfg(over: Partial<S3TargetConfig> = {}): S3TargetConfig {
  return {
    enabled: true,
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

beforeEach(() => {
  vi.clearAllMocks();
  checkSsrf.mockResolvedValue({ allowed: true, isPrivate: false });
  uploadDone.mockResolvedValue(undefined);
  send.mockResolvedValue({});
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
    const res = await validateEndpoint(cfg({ endpoint: 'ftp://s3.example.test' }));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/http/i);
  });

  it('rejects plaintext http while require_tls is on', async () => {
    const res = await validateEndpoint(cfg({ endpoint: 'http://minio.lan:9000' }));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/https/i);
  });

  it('allows plaintext http once require_tls is off (LAN MinIO/Garage)', async () => {
    const res = await validateEndpoint(cfg({ endpoint: 'http://minio.lan:9000', requireTls: false }));
    expect(res.ok).toBe(true);
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

describe('path-bearing endpoints (Supabase Storage, Ceph/Garage sub-paths)', () => {
  // Supabase exposes its S3 API under a path, not at the host root:
  // https://<ref>.storage.supabase.co/storage/v1/s3
  const supabase = 'https://ljdxzzlurgitgiafjvlo.storage.supabase.co/storage/v1/s3';

  it('accepts an endpoint whose S3 API lives under a path', async () => {
    await expect(validateEndpoint(cfg({ endpoint: supabase }))).resolves.toEqual({ ok: true });
  });

  it('hands the SDK the endpoint verbatim, path included', async () => {
    await uploadBackup('/data/backups/backup-1.zip', cfg({ endpoint: supabase, forcePathStyle: true }));
    const client = (uploadDone.mock.calls[0][0] as { client: { config: { endpoint: string; forcePathStyle: boolean } } }).client;
    // Dropping the /storage/v1/s3 path would address the wrong host entirely.
    expect(client.config.endpoint).toBe(supabase);
    expect(client.config.forcePathStyle).toBe(true);
  });

  it('SSRF-checks the full URL rather than a bare origin', async () => {
    await validateEndpoint(cfg({ endpoint: supabase }));
    expect(checkSsrf).toHaveBeenCalledWith(supabase);
  });
});

describe('objectKeyFor', () => {
  it('places the archive under the configured prefix', () => {
    expect(objectKeyFor(cfg({ prefix: 'nightly/' }), '/data/backups/backup-1.zip')).toBe('nightly/backup-1.zip');
    expect(objectKeyFor(cfg({ prefix: '' }), '/data/backups/backup-1.zip')).toBe('backup-1.zip');
  });
});

describe('uploadBackup', () => {
  it('refuses an incomplete target before touching the network', async () => {
    const res = await uploadBackup('/b/x.zip', cfg({ secretAccessKey: '' }));
    expect(res).toEqual({ uploaded: false, error: expect.stringMatching(/incomplete/i) });
    expect(uploadDone).not.toHaveBeenCalled();
  });

  it('refuses to upload when the endpoint fails validation', async () => {
    checkSsrf.mockResolvedValue({ allowed: false, isPrivate: true, error: 'blocked' });
    const res = await uploadBackup('/b/x.zip', cfg());
    expect(res.uploaded).toBe(false);
    expect(uploadDone).not.toHaveBeenCalled();
  });

  it('streams the archive up and reports the key', async () => {
    const res = await uploadBackup('/data/backups/backup-1.zip', cfg({ prefix: 'nightly/' }));
    expect(res).toEqual({ uploaded: true, key: 'nightly/backup-1.zip' });
    const params = (uploadDone.mock.calls[0][0] as { params: Record<string, unknown> }).params;
    expect(params.Bucket).toBe('trek-backups');
    expect(params.Key).toBe('nightly/backup-1.zip');
    expect(params.Body).toBe('STREAM'); // a stream, never a buffered read
    expect(destroy).toHaveBeenCalled();
  });

  it('returns the failure instead of throwing, and still releases the client', async () => {
    uploadDone.mockRejectedValue(Object.assign(new Error('nope'), { name: 'AccessDenied' }));
    const res = await uploadBackup('/b/x.zip', cfg());
    expect(res.uploaded).toBe(false);
    expect(res.error).toMatch(/Access denied/i);
    expect(destroy).toHaveBeenCalled();
  });
});

describe('testConnection', () => {
  it('checks reachability, then write, then cleans the probe up again', async () => {
    const res = await testConnection(cfg({ prefix: 'nightly/' }));
    expect(res).toEqual({ success: true });
    expect(send.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
    expect(send.mock.calls[1][0]).toBeInstanceOf(PutObjectCommand);
    expect(send.mock.calls[2][0]).toBeInstanceOf(DeleteObjectCommand);
    // The probe lands under the configured prefix and is removed again.
    expect((send.mock.calls[1][0] as { input: { Key: string } }).input.Key).toBe('nightly/.trek-connection-test');
    expect((send.mock.calls[2][0] as { input: { Key: string } }).input.Key).toBe('nightly/.trek-connection-test');
  });

  it('fails a read-only key instead of reporting a healthy target', async () => {
    // The exact #228 failure mode: HeadBucket succeeds, writes do not, and
    // every subsequent backup would fail silently.
    send.mockImplementation((cmd: unknown) => {
      if (cmd instanceof PutObjectCommand) {
        return Promise.reject(Object.assign(new Error('x'), { name: 'AccessDenied' }));
      }
      return Promise.resolve({});
    });
    const res = await testConnection(cfg());
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not writable/i);
  });

  it('still reports success when only the probe cleanup fails, but warns about retention', async () => {
    send.mockImplementation((cmd: unknown) => {
      if (cmd instanceof DeleteObjectCommand) {
        return Promise.reject(Object.assign(new Error('x'), { name: 'AccessDenied' }));
      }
      return Promise.resolve({});
    });
    const res = await testConnection(cfg());
    expect(res.success).toBe(true);
    expect(res.error).toMatch(/retention/i);
  });

  // The real failure a Supabase/MinIO user hits first: path-style off means the
  // SDK invents a <bucket>.<host> subdomain the certificate does not cover, and
  // the SDK reports it as a raw OpenSSL string.
  it('translates a TLS handshake failure into the path-style fix', async () => {
    send.mockRejectedValue(
      Object.assign(new Error('write EPROTO 9CA20000:error:0A000410:SSL routines:ssl3_read_bytes:ssl/tls alert handshake failure'), {
        name: 'Error',
        code: 'EPROTO',
      }),
    );
    const res = await testConnection(cfg());
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/path-style/i);
    expect(res.error).not.toMatch(/ssl3_read_bytes/); // no raw OpenSSL noise
  });

  it.each([
    ['ECONNREFUSED', 'connect ECONNREFUSED 10.0.0.5:9000', /refused/i],
    ['ENOTFOUND', 'getaddrinfo ENOTFOUND minio', /could not be resolved/i],
    ['ETIMEDOUT', 'connect ETIMEDOUT', /did not respond in time/i],
    ['ECONNRESET', 'socket hang up ECONNRESET', /reset/i],
    ['SELF_SIGNED', 'DEPTH_ZERO_SELF_SIGNED_CERT', /certificate/i],
  ])('translates the %s transport failure', async (code, message, expected) => {
    send.mockRejectedValue(Object.assign(new Error(message), { name: 'Error', code }));
    const res = await testConnection(cfg());
    expect(res.success).toBe(false);
    expect(res.error).toMatch(expected);
  });

  it('maps a missing bucket to an actionable message', async () => {
    send.mockRejectedValue(Object.assign(new Error('x'), { name: 'NotFound' }));
    expect(await testConnection(cfg())).toEqual({ success: false, error: 'Bucket not found.' });
  });

  it('maps a bad secret to an actionable message', async () => {
    send.mockRejectedValue(Object.assign(new Error('x'), { name: 'SignatureDoesNotMatch' }));
    expect(await testConnection(cfg())).toEqual({ success: false, error: 'Signature mismatch — the secret access key is wrong.' });
  });

  it('reports an incomplete target rather than probing', async () => {
    const res = await testConnection(cfg({ bucket: '' }));
    expect(res.success).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
});
