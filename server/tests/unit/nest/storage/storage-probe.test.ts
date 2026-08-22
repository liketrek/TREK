import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { LocalDriver } from '../../../../src/nest/storage/drivers/local.driver';
import { S3Driver } from '../../../../src/nest/storage/drivers/s3.driver';
import { ephemeralDriverFor, probeDriver } from '../../../../src/nest/storage/storage-probe';
import { StorageBackendError, type StorageDriver } from '../../../../src/nest/storage/storage.types';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'trek-probe-'));
}

describe('probeDriver', () => {
  it('PROBE-001 round-trips put/stat/delete against a healthy local driver and leaves no object', async () => {
    const root = makeTmpDir();
    const driver = new LocalDriver({ id: 'probe-t', root });
    driver.init({ ensurePrefixes: [], cleanSpool: false });
    const result = await probeDriver('t', driver);
    expect(result).toEqual({ name: 't', ok: true });
    // The probe object itself is gone (an empty trek-probe/ dir may remain — inert).
    const leftovers: string[] = [];
    for await (const obj of driver.list('')) leftovers.push(obj.key);
    expect(leftovers).toEqual([]);
  });

  it('PROBE-002 captures a failing driver as ok:false with the error message', async () => {
    const driver = {
      id: 'boom',
      put: vi.fn().mockRejectedValue(new Error('disk on fire')),
      stat: vi.fn(),
      delete: vi.fn(),
      getStream: vi.fn(),
      list: vi.fn(),
    } as unknown as StorageDriver;
    const result = await probeDriver('boom', driver);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('disk on fire');
  });

  it('PROBE-005 appends the wrapped cause chain to the target error message', async () => {
    const raw = new Error('connect ECONNREFUSED 127.0.0.1:9000');
    const driver = {
      id: 'p',
      put: vi.fn().mockRejectedValue(new StorageBackendError("put failed for 'k' on 'probe-s3'", raw)),
      stat: vi.fn(),
      delete: vi.fn(),
      getStream: vi.fn(),
      list: vi.fn(),
    } as unknown as StorageDriver;
    const result = await probeDriver('p', driver);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("put failed for 'k' on 'probe-s3'");
    expect(result.error).toContain('ECONNREFUSED');
  });

  it("PROBE-006 appends an S3-style error code that isn't already in the cause's message", async () => {
    const raw = Object.assign(new Error('The specified bucket does not exist'), { code: 'NoSuchBucket' });
    const driver = {
      id: 'p',
      put: vi.fn().mockRejectedValue(new StorageBackendError("put failed for 'k' on 'probe-s3'", raw)),
      stat: vi.fn(),
      delete: vi.fn(),
      getStream: vi.fn(),
      list: vi.fn(),
    } as unknown as StorageDriver;
    const result = await probeDriver('p', driver);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('The specified bucket does not exist');
    expect(result.error).toContain('NoSuchBucket');
  });
});

describe('ephemeralDriverFor', () => {
  it('PROBE-003 builds an initialized LocalDriver for local and an S3Driver for s3 — no registry involved', () => {
    const local = ephemeralDriverFor({ name: 'l', type: 'local', options: { root: makeTmpDir() } });
    expect(local).toBeInstanceOf(LocalDriver);
    const s3 = ephemeralDriverFor({
      name: 's',
      type: 's3',
      options: {
        endpoint: 'http://127.0.0.1:1',
        bucket: 'trek',
        accessKeyId: 'ak',
        secretAccessKey: 'sk',
        region: 'us-east-1',
        keyPrefix: '',
        retries: 0,
        timeoutMs: 200,
      },
    });
    expect(s3).toBeInstanceOf(S3Driver);
  });

  it('PROBE-004 an uncreatable local root surfaces as a throw (the service turns it into a target error)', () => {
    const file = path.join(makeTmpDir(), 'a-file');
    fs.writeFileSync(file, 'not a dir');
    expect(() => ephemeralDriverFor({ name: 'l', type: 'local', options: { root: file } })).toThrow();
  });
});
