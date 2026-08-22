import { describe, it, expect, vi } from 'vitest';
import { Readable } from 'node:stream';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  S3Driver,
  MULTIPART_THRESHOLD,
  defaultClientFactory,
  type S3Api,
  type S3DriverOptions,
} from '../../../../src/nest/storage/drivers/s3.driver';
import {
  StorageBackendError,
  StorageInvalidKeyError,
  StorageNotFoundError,
} from '../../../../src/nest/storage/storage.types';

/** Mock client: every method rejects unless a test overrides it. */
function makeMockApi(overrides: Partial<S3Api> = {}): S3Api {
  const unexpected = (name: string) => vi.fn().mockRejectedValue(new Error(`unexpected ${name}`));
  return {
    PutObject: unexpected('PutObject'),
    Upload: unexpected('Upload'),
    GetObject: unexpected('GetObject'),
    HeadObject: unexpected('HeadObject'),
    DeleteObject: unexpected('DeleteObject'),
    ListObjectsV2: unexpected('ListObjectsV2'),
    ...overrides,
  } as S3Api;
}

function makeDriver(api: S3Api, opts: Partial<S3DriverOptions> = {}): S3Driver {
  return new S3Driver({
    id: 's3-test',
    endpoint: 'http://127.0.0.1:9000',
    region: 'us-east-1',
    bucket: 'trek',
    keyPrefix: '',
    accessKeyId: 'ak',
    secretAccessKey: 'sk',
    retries: 1,
    timeoutMs: 200,
    clientFactory: async () => api,
    ...opts,
  });
}

/** aws-lite error shape: real Error + statusCode/code metadata. */
function awsError(statusCode: number | undefined, code?: string): Error {
  const err = new Error(`@aws-lite/client: S3: ${code ?? 'boom'}`) as Error & {
    statusCode?: number;
    code?: string;
  };
  err.statusCode = statusCode;
  if (code) err.code = code;
  return err;
}

describe('S3Driver construction', () => {
  it('normalizes the key prefix to "" or "segments/" form', async () => {
    const api = makeMockApi({ HeadObject: vi.fn().mockResolvedValue({ ContentLength: 1, LastModified: new Date(1000) }) });
    await makeDriver(api, { keyPrefix: '/trek/prod/' }).stat('a/x.bin');
    expect(api.HeadObject).toHaveBeenCalledWith(expect.objectContaining({ Key: 'trek/prod/a/x.bin' }));
  });
  it('rejects an invalid key prefix at construction', () => {
    expect(() => makeDriver(makeMockApi(), { keyPrefix: '../evil' })).toThrow(StorageInvalidKeyError);
  });
  it('makes no client call at construction (boot must not touch the network)', () => {
    const factory = vi.fn();
    void new S3Driver({
      id: 's3-test', endpoint: 'http://127.0.0.1:9000', region: 'us-east-1', bucket: 'trek',
      keyPrefix: '', accessKeyId: 'ak', secretAccessKey: 'sk', retries: 1, timeoutMs: 200,
      clientFactory: factory,
    });
    expect(factory).not.toHaveBeenCalled();
  });
});

describe('S3Driver stat/delete', () => {
  it('maps HeadObject to ObjectStat', async () => {
    const api = makeMockApi({ HeadObject: vi.fn().mockResolvedValue({ ContentLength: 42, LastModified: new Date(5000) }) });
    expect(await makeDriver(api).stat('a/x.bin')).toEqual({ key: 'a/x.bin', size: 42, mtimeMs: 5000 });
  });
  it('surfaces the bucket ETag verbatim (quotes included) so the serving path can use it as a validator', async () => {
    const api = makeMockApi({
      HeadObject: vi.fn().mockResolvedValue({ ContentLength: 42, LastModified: new Date(5000), ETag: '"d41d8cd98f00b204"' }),
    });
    expect(await makeDriver(api).stat('a/x.bin')).toEqual({
      key: 'a/x.bin',
      size: 42,
      mtimeMs: 5000,
      etag: '"d41d8cd98f00b204"',
    });
  });
  it('re-quotes the unquoted ETag aws-lite hands back (a bare tag is not a valid HTTP ETag)', async () => {
    // Verified live against AIStor: the SDK strips the surrounding quotes.
    const api = makeMockApi({
      HeadObject: vi.fn().mockResolvedValue({ ContentLength: 42, LastModified: new Date(5000), ETag: 'a925576942e9' }),
    });
    expect((await makeDriver(api).stat('a/x.bin'))!.etag).toBe('"a925576942e9"');
  });
  it('leaves an already-weak tag alone and an absent/empty ETag undefined', async () => {
    const weak = makeMockApi({
      HeadObject: vi.fn().mockResolvedValue({ ContentLength: 42, LastModified: new Date(5000), ETag: 'W/"abc"' }),
    });
    expect((await makeDriver(weak).stat('a/x.bin'))!.etag).toBe('W/"abc"');

    const none = makeMockApi({ HeadObject: vi.fn().mockResolvedValue({ ContentLength: 42, LastModified: new Date(5000) }) });
    expect((await makeDriver(none).stat('a/x.bin'))!.etag).toBeUndefined();

    const blank = makeMockApi({
      HeadObject: vi.fn().mockResolvedValue({ ContentLength: 42, LastModified: new Date(5000), ETag: '' }),
    });
    expect((await makeDriver(blank).stat('a/x.bin'))!.etag).toBeUndefined();
  });
  it('stats a 404/NotFound as null', async () => {
    const api = makeMockApi({ HeadObject: vi.fn().mockRejectedValue(awsError(404, 'NotFound')) });
    expect(await makeDriver(api).stat('a/x.bin')).toBeNull();
  });
  it('wraps network errors (no statusCode) in StorageBackendError with cause', async () => {
    const cause = awsError(undefined);
    const api = makeMockApi({ HeadObject: vi.fn().mockRejectedValue(cause) });
    await expect(makeDriver(api).stat('a/x.bin')).rejects.toMatchObject({
      name: 'StorageBackendError',
      cause,
    });
  });
  it('deletes idempotently — a 404 resolves', async () => {
    const api = makeMockApi({ DeleteObject: vi.fn().mockRejectedValue(awsError(404, 'NoSuchKey')) });
    await expect(makeDriver(api).delete('a/x.bin')).resolves.toBeUndefined();
  });
  it('validates keys before any client call', async () => {
    const api = makeMockApi();
    const driver = makeDriver(api);
    for (const bad of ['../x', '/abs', 'a\\b', '.tmp/x']) {
      await expect(driver.stat(bad)).rejects.toBeInstanceOf(StorageInvalidKeyError);
      await expect(driver.delete(bad)).rejects.toBeInstanceOf(StorageInvalidKeyError);
    }
    expect(api.HeadObject).not.toHaveBeenCalled();
    expect(api.DeleteObject).not.toHaveBeenCalled();
  });
  it('expires a hung call after timeoutMs with StorageBackendError', async () => {
    const api = makeMockApi({ HeadObject: vi.fn().mockReturnValue(new Promise(() => {})) });
    await expect(makeDriver(api, { timeoutMs: 50 }).stat('a/x.bin')).rejects.toBeInstanceOf(StorageBackendError);
  });
  it('caches the client across calls and retries a failed factory', async () => {
    const api = makeMockApi({ HeadObject: vi.fn().mockResolvedValue({ ContentLength: 1, LastModified: new Date(0) }) });
    const factory = vi
      .fn()
      .mockRejectedValueOnce(new Error('init boom'))
      .mockResolvedValue(api);
    const driver = makeDriver(api, { clientFactory: factory });
    await expect(driver.stat('a/x.bin')).rejects.toBeInstanceOf(StorageBackendError);
    await driver.stat('a/x.bin'); // second call retries the factory
    await driver.stat('a/x.bin');
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

async function drain(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(Buffer.from(c as Buffer));
  return Buffer.concat(chunks);
}

describe('S3Driver getStream', () => {
  it('streams the body with streamResponsePayload and returns the stat', async () => {
    const api = makeMockApi({
      GetObject: vi.fn().mockResolvedValue({
        Body: Readable.from('hello'),
        ContentLength: 5,
        LastModified: new Date(7000),
      }),
    });
    const { stream, stat } = await makeDriver(api).getStream('a/x.bin');
    expect((await drain(stream)).toString()).toBe('hello');
    expect(stat).toEqual({ key: 'a/x.bin', size: 5, mtimeMs: 7000 });
    expect(api.GetObject).toHaveBeenCalledWith(
      expect.objectContaining({ Key: 'a/x.bin', streamResponsePayload: true }),
    );
    expect((api.GetObject as ReturnType<typeof vi.fn>).mock.calls[0][0]).not.toHaveProperty('Range');
  });
  it('formats closed and open-ended ranges and returns the FULL-object stat from Content-Range', async () => {
    const api = makeMockApi({
      GetObject: vi.fn().mockResolvedValue({
        Body: Readable.from('2345'),
        ContentLength: 4, // the RANGE length — must not become stat.size
        ContentRange: 'bytes 2-5/10',
        LastModified: new Date(7000),
      }),
    });
    const { stat } = await makeDriver(api).getStream('a/x.bin', { start: 2, end: 5 });
    expect(stat.size).toBe(10);
    expect(api.GetObject).toHaveBeenCalledWith(expect.objectContaining({ Range: 'bytes=2-5' }));

    await makeDriver(api).getStream('a/x.bin', { start: 7 });
    expect(api.GetObject).toHaveBeenLastCalledWith(expect.objectContaining({ Range: 'bytes=7-' }));
  });
  it('surfaces the ETag on a plain get, and the FULL-object ETag on a ranged one', async () => {
    const api = makeMockApi({
      GetObject: vi.fn().mockResolvedValue({
        Body: Readable.from('hello'),
        ContentLength: 5,
        LastModified: new Date(7000),
        ETag: '"abc123"',
      }),
    });
    expect((await makeDriver(api).getStream('a/x.bin')).stat.etag).toBe('"abc123"');

    const ranged = makeMockApi({
      GetObject: vi.fn().mockResolvedValue({
        Body: Readable.from('23'),
        ContentLength: 2,
        ContentRange: 'bytes 2-3/10',
        LastModified: new Date(7000),
        ETag: '"abc123"',
      }),
    });
    // S3 answers a 206 with the whole object's tag — the validator a resuming
    // If-Range client sent us in the first place.
    expect((await makeDriver(ranged).getStream('a/x.bin', { start: 2, end: 3 })).stat).toEqual({
      key: 'a/x.bin',
      size: 10,
      mtimeMs: 7000,
      etag: '"abc123"',
    });
  });
  it('maps 404/NoSuchKey to StorageNotFoundError', async () => {
    const api = makeMockApi({ GetObject: vi.fn().mockRejectedValue(awsError(404, 'NoSuchKey')) });
    await expect(makeDriver(api).getStream('a/x.bin')).rejects.toBeInstanceOf(StorageNotFoundError);
  });
  it('rejects a missing Body as StorageBackendError (never a bare undefined stream)', async () => {
    const api = makeMockApi({ GetObject: vi.fn().mockResolvedValue({ ContentLength: 5 }) });
    await expect(makeDriver(api).getStream('a/x.bin')).rejects.toBeInstanceOf(StorageBackendError);
  });
});

describe('S3Driver list', () => {
  function pages(...pageContents: Array<Array<{ Key: string; Size: number; LastModified: Date }>>) {
    return vi.fn().mockResolvedValue(
      (async function* () {
        for (const Contents of pageContents) yield { Contents };
      })(),
    );
  }
  it('paginates with the iterator, strips the keyPrefix, and requests the combined prefix', async () => {
    const api = makeMockApi({
      ListObjectsV2: pages(
        [{ Key: 'trek/prod/a/one.bin', Size: 2, LastModified: new Date(1000) }],
        [{ Key: 'trek/prod/a/sub/two.bin', Size: 3, LastModified: new Date(2000) }],
      ),
    });
    const out = [];
    for await (const stat of makeDriver(api, { keyPrefix: 'trek/prod' }).list('a/')) out.push(stat);
    expect(out).toEqual([
      { key: 'a/one.bin', size: 2, mtimeMs: 1000 },
      { key: 'a/sub/two.bin', size: 3, mtimeMs: 2000 },
    ]);
    expect(api.ListObjectsV2).toHaveBeenCalledWith(
      expect.objectContaining({ Prefix: 'trek/prod/a/', paginate: 'iterator' }),
    );
  });
  it('skips keys with dot-segments and keys outside the keyPrefix (out-of-band writes)', async () => {
    const api = makeMockApi({
      ListObjectsV2: pages([
        { Key: 'trek/prod/a/ok.bin', Size: 1, LastModified: new Date(0) },
        { Key: 'trek/prod/.tmp/junk', Size: 1, LastModified: new Date(0) },
        { Key: 'trek/prod/a/.hidden', Size: 1, LastModified: new Date(0) },
        { Key: 'elsewhere/x.bin', Size: 1, LastModified: new Date(0) },
      ]),
    });
    const out = [];
    for await (const stat of makeDriver(api, { keyPrefix: 'trek/prod' }).list('')) out.push(stat);
    expect(out.map((s) => s.key)).toEqual(['a/ok.bin']);
  });
  it('yields nothing for an empty result and validates the prefix first', async () => {
    const api = makeMockApi({ ListObjectsV2: pages([]) });
    const driver = makeDriver(api);
    const out = [];
    for await (const stat of driver.list('a/')) out.push(stat);
    expect(out).toEqual([]);
    await expect(async () => {
      for await (const s of driver.list('../x')) void s;
    }).rejects.toBeInstanceOf(StorageInvalidKeyError);
  });
});

describe('defaultClientFactory', () => {
  it('builds a real aws-lite client exposing the S3 surface (no network at init)', async () => {
    const s3 = await defaultClientFactory({
      endpoint: 'http://127.0.0.1:1', region: 'us-east-1',
      accessKeyId: 'ak', secretAccessKey: 'sk', retries: 0, keepAlive: false,
    });
    for (const method of ['PutObject', 'Upload', 'GetObject', 'HeadObject', 'DeleteObject', 'ListObjectsV2'] as const) {
      expect(typeof s3[method]).toBe('function');
    }
  });
});

describe('S3Driver put — bounded peek routing', () => {
  it('routes a small stream (ends within threshold) to a single PutObject with buffered Body', async () => {
    const api = makeMockApi({ PutObject: vi.fn().mockResolvedValue({}) });
    await makeDriver(api).put('a/x.bin', Readable.from('hello'), { contentType: 'text/plain' });
    const input = (api.PutObject as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(Buffer.isBuffer(input.Body) && input.Body.toString()).toBe('hello');
    expect(input).toMatchObject({ Key: 'a/x.bin', ContentType: 'text/plain' });
    expect(api.Upload).not.toHaveBeenCalled();
  });
  it('routes a zero-byte stream to PutObject (Upload breaks on empty streams upstream)', async () => {
    const api = makeMockApi({ PutObject: vi.fn().mockResolvedValue({}) });
    await makeDriver(api).put('a/empty.bin', Readable.from([]));
    const input = (api.PutObject as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(Buffer.isBuffer(input.Body) && input.Body.length).toBe(0);
    // aws4@1.13.2 signing workaround (see zeroByteChecksumWorkaround in
    // s3.driver.ts): a zero-byte Body must set ApplyChecksum: true so
    // @aws-lite/s3's PutObject never pre-sets a falsy-numeric Content-Length
    // that aws4 then duplicates, breaking the signature against real S3.
    expect(input.ApplyChecksum).toBe(true);
  });
  it('does not apply the zero-byte checksum workaround to a 1-byte stream (boundary is exactly size 0)', async () => {
    const api = makeMockApi({ PutObject: vi.fn().mockResolvedValue({}) });
    await makeDriver(api).put('a/one-byte.bin', Readable.from(Buffer.from([7])));
    const input = (api.PutObject as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(input.Body.length).toBe(1);
    expect(input.ApplyChecksum).toBeUndefined();
  });
  it('routes a stream exceeding the threshold to Upload with the peeked prefix re-attached', async () => {
    let uploaded: Buffer | null = null;
    const api = makeMockApi({
      Upload: vi.fn().mockImplementation(async ({ Body }: { Body: Readable }) => {
        uploaded = await drain(Body);
      }),
    });
    // Three chunks so the source cannot end during the peek (the peek stops
    // after chunk 2 crosses the threshold; chunk 3 is still pending) — the
    // Upload path is deterministic, not timing-dependent.
    const chunk = Buffer.alloc(6 * 1024 * 1024, 7);
    const big = Buffer.concat([chunk, chunk, chunk]);
    await makeDriver(api).put('a/big.bin', Readable.from([chunk, chunk, chunk]));
    expect(api.PutObject).not.toHaveBeenCalled();
    expect(uploaded!.length).toBe(big.length);
    expect(uploaded!.equals(big)).toBe(true);
    expect((api.Upload as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatchObject({
      Key: 'a/big.bin',
      ChunkSize: MULTIPART_THRESHOLD,
    });
  });
  it('never passes ContentType to Upload (it corrupts CompleteMultipartUpload upstream — MalformedXML)', async () => {
    const api = makeMockApi({
      Upload: vi.fn().mockImplementation(async ({ Body }: { Body: Readable }) => {
        await drain(Body);
      }),
    });
    const chunk = Buffer.alloc(6 * 1024 * 1024, 7);
    await makeDriver(api).put('a/big.zip', Readable.from([chunk, chunk, chunk]), {
      contentType: 'application/zip',
    });
    expect(api.Upload).toHaveBeenCalled();
    expect((api.Upload as ReturnType<typeof vi.fn>).mock.calls[0][0]).not.toHaveProperty('ContentType');
  });
  it('does not drop bytes buffered ahead of a deferred Upload consumer (Transform interposition, not body.on("data"))', async () => {
    // Real aws-lite Upload awaits a full CreateMultipartUpload round trip
    // before attaching its own consumer. A `body.on('data', ...)` listener
    // added directly to the Body stream calls resume() immediately, so any
    // bytes emitted during that window are delivered only to the listener
    // and lost forever. Simulate the round trip with two deferred ticks
    // before the mock ever reads Body.
    let uploaded: Buffer | null = null;
    const api = makeMockApi({
      Upload: vi.fn().mockImplementation(async ({ Body }: { Body: Readable }) => {
        await new Promise((resolve) => setImmediate(resolve));
        await new Promise((resolve) => setImmediate(resolve));
        uploaded = await drain(Body);
      }),
    });
    const chunk = Buffer.alloc(6 * 1024 * 1024, 7);
    const big = Buffer.concat([chunk, chunk, chunk]);
    await makeDriver(api).put('a/deferred.bin', Readable.from([chunk, chunk, chunk]));
    expect(uploaded!.length).toBe(big.length);
    expect(uploaded!.equals(big)).toBe(true);
  });
  it('routes a single-chunk oversized stream that ends at the peek boundary to PutObject (readableEnded guard)', async () => {
    // One huge chunk: 'end' can fire between the peek resolving and pipe()
    // attaching — the driver must detect readableEnded and PutObject the
    // already-buffered payload rather than hang a never-ending PassThrough.
    const api = makeMockApi({
      PutObject: vi.fn().mockResolvedValue({}),
      Upload: vi.fn().mockResolvedValue({}),
    });
    const big = Buffer.alloc(MULTIPART_THRESHOLD + 3, 7);
    const oneChunk = new Readable({ read() {} });
    oneChunk.push(big);
    oneChunk.push(null);
    await makeDriver(api).put('a/one-chunk.bin', oneChunk);
    // Either path must complete with the full payload; no hang, no data loss.
    const putCalls = (api.PutObject as ReturnType<typeof vi.fn>).mock.calls;
    const uploadCalls = (api.Upload as ReturnType<typeof vi.fn>).mock.calls;
    expect(putCalls.length + uploadCalls.length).toBe(1);
    if (putCalls.length === 1) {
      expect((putCalls[0][0].Body as Buffer).length).toBe(big.length);
    }
  });
  it('surfaces a source-stream error before any client call', async () => {
    const api = makeMockApi();
    const boom = new Readable({
      read() {
        this.destroy(new Error('source exploded'));
      },
    });
    await expect(makeDriver(api).put('a/broken.bin', boom)).rejects.toThrow('source exploded');
    expect(api.PutObject).not.toHaveBeenCalled();
    expect(api.Upload).not.toHaveBeenCalled();
  });
  it('expires a stalled Upload via the inactivity deadline (monitoring Transform destroyed)', async () => {
    const api = makeMockApi({
      Upload: vi.fn().mockImplementation(
        ({ Body }: { Body: Readable }) =>
          new Promise((_, reject) => {
            Body.on('error', reject); // aws-lite Upload fails when its source errors
          }),
      ),
    });
    const stalled = new Readable({ read() {} });
    stalled.push(Buffer.alloc(MULTIPART_THRESHOLD + 1)); // exceed the peek, then go silent
    await expect(makeDriver(api, { timeoutMs: 60 }).put('a/stall.bin', stalled)).rejects.toBeInstanceOf(
      StorageBackendError,
    );
  });
  it('destroys the original source when Upload rejects for a non-timeout reason (no fd/socket leak)', async () => {
    const api = makeMockApi({
      Upload: vi.fn().mockImplementation(async ({ Body }: { Body: Readable }) => {
        await drain(Body); // full data transfer succeeds...
        throw awsError(500); // ...but the finalize step (e.g. CompleteMultipartUpload) fails
      }),
    });
    const chunk = Buffer.alloc(6 * 1024 * 1024, 7);
    const source = Readable.from([chunk, chunk, chunk]);
    await expect(makeDriver(api).put('a/fail-after-drain.bin', source)).rejects.toBeInstanceOf(StorageBackendError);
    expect(source.destroyed).toBe(true);
  });
});

describe('S3Driver put — LocalTempFile ownership', () => {
  async function makeTmp(bytes: number): Promise<string> {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'trek-s3-'));
    const p = path.join(dir, 'src.bin');
    await fs.promises.writeFile(p, Buffer.alloc(bytes, 1));
    return p;
  }
  it('uploads a small temp file via PutObject File and consumes it', async () => {
    const api = makeMockApi({ PutObject: vi.fn().mockResolvedValue({}) });
    const tmp = await makeTmp(10);
    await makeDriver(api).put('a/t.bin', { tmpPath: tmp }, { contentType: 'image/png' });
    expect(api.PutObject).toHaveBeenCalledWith(
      expect.objectContaining({ File: tmp, Key: 'a/t.bin', ContentType: 'image/png' }),
    );
    expect(fs.existsSync(tmp)).toBe(false);
  });
  it('routes a threshold-sized temp file to Upload', async () => {
    const api = makeMockApi({ Upload: vi.fn().mockImplementation(async ({ Body }: { Body: Readable }) => drain(Body)) });
    const tmp = await makeTmp(MULTIPART_THRESHOLD);
    await makeDriver(api).put('a/t.bin', { tmpPath: tmp });
    expect(api.Upload).toHaveBeenCalled();
    expect(fs.existsSync(tmp)).toBe(false);
  });
  it('never passes ContentType to a temp-file Upload either (same upstream MalformedXML defect)', async () => {
    const api = makeMockApi({ Upload: vi.fn().mockImplementation(async ({ Body }: { Body: Readable }) => drain(Body)) });
    const tmp = await makeTmp(MULTIPART_THRESHOLD);
    await makeDriver(api).put('a/t.zip', { tmpPath: tmp }, { contentType: 'application/zip' });
    expect(api.Upload).toHaveBeenCalled();
    expect((api.Upload as ReturnType<typeof vi.fn>).mock.calls[0][0]).not.toHaveProperty('ContentType');
  });
  it('rejects a stalled threshold-sized temp-file Upload with StorageBackendError rather than crashing', async () => {
    // The Upload mock never reads/drains Body — only listens for its error,
    // matching aws-lite's real Upload contract — so the fs.createReadStream
    // source AND the interposed Transform must each have an 'error' handler
    // attached before expire() destroys them; otherwise an unlistened
    // 'error' anywhere in that chain crashes the process instead of
    // rejecting this promise.
    const api = makeMockApi({
      Upload: vi.fn().mockImplementation(
        ({ Body }: { Body: Readable }) =>
          new Promise((_, reject) => {
            Body.on('error', reject);
          }),
      ),
    });
    const tmp = await makeTmp(MULTIPART_THRESHOLD);
    await expect(
      makeDriver(api, { timeoutMs: 60 }).put('a/stall-tmp.bin', { tmpPath: tmp }),
    ).rejects.toBeInstanceOf(StorageBackendError);
  });
  it('consumes the temp file on the failure path too (MirrorDriver precedent)', async () => {
    const api = makeMockApi({ PutObject: vi.fn().mockRejectedValue(awsError(500)) });
    const tmp = await makeTmp(10);
    await expect(makeDriver(api).put('a/t.bin', { tmpPath: tmp })).rejects.toBeInstanceOf(StorageBackendError);
    expect(fs.existsSync(tmp)).toBe(false);
  });
});
